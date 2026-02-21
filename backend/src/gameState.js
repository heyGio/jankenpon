const crypto = require('crypto');

// Map of match code to game state
const matches = new Map();

function createMatch() {
  const code = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 char code
  matches.set(code, {
    status: 'waiting', // waiting, playing
    baseline: null,
    history: [],
    scores: { A: 0, B: 0 },
    streaks: { A_losses: 0, B_losses: 0, ties: 0 },
    jolly: { A_typed_turns: 0, B_typed_turns: 0 },
    round: { roundId: 1, timer_ms: 30000, A_label: null, B_label: null, ready: { A: false, B: false } },
    players: { A: null, B: null }, // socket ids
    names: { A: null, B: null } // player names
  });
  return code;
}

function getMatch(code) {
  return matches.get(code);
}

function joinMatch(code, socketId, playerName) {
  const match = getMatch(code);
  if (!match) return { error: 'Match not found' };

  if (!match.players.A) {
    match.players.A = socketId;
    match.names.A = playerName;
    return { slot: 'A', match };
  } else if (!match.players.B) {
    match.players.B = socketId;
    match.names.B = playerName;
    return { slot: 'B', match };
  } else {
    return { error: 'Match is full' };
  }
}

function resetRound(match) {
  match.round.A_label = null;
  match.round.B_label = null;
  match.round.ready.A = false;
  match.round.ready.B = false;
  match.round.roundId = (match.round.roundId || 1) + 1;
}

function resetMatchState(match) {
  match.status = 'waiting';
  match.baseline = null;
  match.history = [];
  match.scores = { A: 0, B: 0 };
  match.streaks = { A_losses: 0, B_losses: 0, ties: 0 };
  match.jolly = { A_typed_turns: 0, B_typed_turns: 0 };
  resetRound(match);
}

function deleteMatch(code) {
  matches.delete(code);
}

module.exports = {
  createMatch,
  getMatch,
  joinMatch,
  resetRound,
  resetMatchState,
  deleteMatch
};
