const { getMatch, resetRound } = require('./gameState');
const { classifyDoodle, referee, normalizeLabel } = require('./gemini');

function setupSocket(io) {
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        // Join a match room
        socket.on('join_room', ({ code, playerName }) => {
            const match = getMatch(code);
            if (!match) return;

            // Re-assign socket ID to player slot (helps with reconnects optionally, but mainly just saves ID)
            if (match.names.A === playerName) match.players.A = socket.id;
            else if (match.names.B === playerName) match.players.B = socket.id;

            // Tell this socket to join the socket room
            socket.join(code);

            // Broadcast the state update to everyone in the room
            io.to(code).emit('state:update', match);
        });

        socket.on('start_match', ({ code }) => {
            const match = getMatch(code);
            if (match && match.status === 'waiting') {
                match.status = 'playing';
                io.to(code).emit('state:update', match);
            }
        });

        socket.on('player_ready', ({ code, playerId }) => {
            const match = getMatch(code);
            if (match && match.round) {
                match.round.ready[playerId] = true;
                io.to(code).emit('state:update', match);
            }
        });

        socket.on('start_next_round', ({ code }) => {
            const match = getMatch(code);
            if (match && match.round.ready.A && match.round.ready.B) {
                resetRound(match);
                io.to(code).emit('state:update', match);
            }
        });

        socket.on('end_match', ({ code }) => {
            const match = getMatch(code);
            if (!match) return;

            match.status = 'ended';

            let matchWinner = 'tie';
            if (match.scores.A > match.scores.B) matchWinner = 'A';
            else if (match.scores.B > match.scores.A) matchWinner = 'B';

            io.to(code).emit('match:ended', { winner: matchWinner, finalScores: match.scores });
            io.to(code).emit('state:update', match);
        });

        // Handle round submissions (either doodle or typed text)
        socket.on('round:submit', async ({ code, playerId, type, content }) => {
            const match = getMatch(code);
            if (!match) return;

            // Mark as submitted immediately to broadcast ready state to opponent
            if (playerId === 'A') match.round.A_label = { pending: true };
            if (playerId === 'B') match.round.B_label = { pending: true };
            io.to(code).emit('state:update', match);

            let label = null;
            let containsText = false;

            if (type === 'doodle') {
                const result = await classifyDoodle(content);
                label = result.label;
                containsText = result.contains_text;
            } else if (type === 'text') {
                label = normalizeLabel(content);
                // decrement jolly turns
                if (playerId === 'A') match.jolly.A_typed_turns = Math.max(0, match.jolly.A_typed_turns - 1);
                if (playerId === 'B') match.jolly.B_typed_turns = Math.max(0, match.jolly.B_typed_turns - 1);
            }

            // Store label with potential flags
            const submission = { label, containsText, type };

            if (playerId === 'A') {
                match.round.A_label = submission;
            } else if (playerId === 'B') {
                match.round.B_label = submission;
            }

            // If both players submitted fully (no longer pending), evaluate round
            if (match.round.A_label && !match.round.A_label.pending && match.round.B_label && !match.round.B_label.pending) {
                await evaluateRound(io, code, match);
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
            // Find if this socket belonged to a match and broadcast disconnect info
            const mapEntries = require('./gameState').getMatch ? undefined : null; // hacky check
            // For MVP, if player disconnects, we just set their slot to null and update state
            // It would be better to search matches, but simple hack: broadcast drop to all rooms this socket was in
            socket.rooms.forEach(room => {
                const match = getMatch(room);
                if (match) {
                    if (match.players.A === socket.id) match.players.A = null;
                    if (match.players.B === socket.id) match.players.B = null;
                    io.to(room).emit('state:update', match);
                }
            });
        });
    });
}

async function evaluateRound(io, code, match) {
    const subA = match.round.A_label;
    const subB = match.round.B_label;

    let winner = 'tie';
    let reason = '';
    let newBaseline = match.baseline;

    // 1. Text violation
    const aTextViol = subA.type === 'doodle' && subA.containsText;
    const bTextViol = subB.type === 'doodle' && subB.containsText;

    // 2. Repeat violation
    const aRepeat = match.history.includes(subA.label);
    const bRepeat = match.history.includes(subB.label);

    if ((aTextViol && bTextViol) || (aRepeat && bRepeat)) {
        winner = 'tie';
        reason = 'Both players violated the rules (Text or Repeat).';
    } else if (aTextViol || aRepeat) {
        winner = 'B';
        reason = aTextViol ? 'Player A wrote text.' : 'Player A repeated a word.';
        newBaseline = subB.label; // Simplify baseline update on default win
    } else if (bTextViol || bRepeat) {
        winner = 'A';
        reason = bTextViol ? 'Player B wrote text.' : 'Player B repeated a word.';
        newBaseline = subA.label;
    } else {
        // 3 & 4. Baseline and Strength comparison via Referee
        const refResult = await referee(match.baseline, subA.label, subB.label, match.history);
        winner = refResult.winner;
        reason = refResult.reason;
        if (refResult.strongest_object) {
            newBaseline = refResult.strongest_object;
        }
    }

    // Update history
    if (subA.label && subA.label !== 'unknown' && !match.history.includes(subA.label)) match.history.push(subA.label);
    if (subB.label && subB.label !== 'unknown' && !match.history.includes(subB.label)) match.history.push(subB.label);

    // Update scores and streaks
    if (winner === 'A') {
        match.scores.A += 1;
        match.streaks.ties = 0;
        match.streaks.B_losses += 1;
        match.streaks.A_losses = 0;
    } else if (winner === 'B') {
        match.scores.B += 1;
        match.streaks.ties = 0;
        match.streaks.A_losses += 1;
        match.streaks.B_losses = 0;
    } else {
        match.streaks.ties += 1;
    }

    // Jolly comeback
    if (match.streaks.A_losses >= 3) match.jolly.A_typed_turns = 2;
    if (match.streaks.B_losses >= 3) match.jolly.B_typed_turns = 2;

    // Set new baseline
    match.baseline = newBaseline;

    // Emit result
    io.to(code).emit('round:result', {
        A_label: subA.label,
        B_label: subB.label,
        winner,
        reason,
        new_baseline: match.baseline
    });

    // Send state update so scores/streaks update in background
    io.to(code).emit('state:update', match);
}

module.exports = { setupSocket };
