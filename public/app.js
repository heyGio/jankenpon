const WS_URL = `ws://${window.location.host}/ws`;

// State
let ws;
let myClientId = Date.now().toString(36) + Math.random().toString(36).substr(2);
let myPlayerNum = 0; // 1 or 2
let state = 'lobby'; // lobby, drawing, judging
let isJolly = false;

// DOM Elements
const screens = {
    lobby: document.getElementById('screen-lobby'),
    game: document.getElementById('screen-game'),
    judging: document.getElementById('screen-judging'),
    gameOver: document.getElementById('screen-game-over'),
    header: document.getElementById('game-header')
};

const ui = {
    baseline: document.getElementById('baseline-value'),
    timer: document.getElementById('round-timer'),
    p1Score: document.getElementById('p1-score'),
    p2Score: document.getElementById('p2-score'),
    lobbyStatus: document.getElementById('lobby-status'),
    btnFindMatch: document.getElementById('btn-find-match'),
    btnPlayAgain: document.getElementById('btn-play-again')
};

// Canvas Setup
function initCanvas(id, num) {
    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');

    // Set white background initially
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let isDrawing = false;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';

    function draw(e) {
        if (!isDrawing) return;
        const rect = canvas.getBoundingClientRect();

        // Handle both mouse and touch
        let clientX = e.clientX;
        let clientY = e.clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
            e.preventDefault(); // Prevent scrolling
        }

        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    }

    // Events
    const start = (e) => {
        if (myPlayerNum !== num) return; // Only draw on own canvas
        isDrawing = true; draw(e);
    };
    const end = () => { isDrawing = false; ctx.beginPath(); };

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('mouseout', end);

    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', end);

    return { canvas, ctx };
}

const c1 = initCanvas('canvas-p1', 1);
const c2 = initCanvas('canvas-p2', 2);

function getMyCanvas() {
    return myPlayerNum === 1 ? c1 : c2;
}

function clearCanvas(num) {
    const c = num === 1 ? c1 : c2;
    c.ctx.fillStyle = '#ffffff';
    c.ctx.fillRect(0, 0, c.canvas.width, c.canvas.height);
}

// Button Liteners
document.getElementById('btn-clear').addEventListener('click', () => { if (myPlayerNum === 1) clearCanvas(1); });
document.getElementById('btn-clear-2').addEventListener('click', () => { if (myPlayerNum === 2) clearCanvas(2); });

const submitDrawing = () => {
    const c = getMyCanvas();
    const dataUrl = c.canvas.toDataURL('image/jpeg', 0.8);

    const isTextInput = !document.getElementById(`p${myPlayerNum}-jolly-overlay`).classList.contains('hidden');
    let submissionType = 'draw';
    let submissionData = dataUrl;

    if (isTextInput) {
        const textVal = document.getElementById(`p${myPlayerNum}-jolly-input`).value.trim();
        if (!textVal) {
            alert("Type something!"); return;
        }
        submissionType = 'type';
        submissionData = textVal;
    }

    ws.send(JSON.stringify({
        action: 'submit',
        type: submissionType,
        data: submissionData
    }));

    // UI update
    document.getElementById(`p${myPlayerNum}-action-status`).innerText = "Submitted!";
    document.getElementById(`p${myPlayerNum}-block-overlay`).className = "block-overlay submitted";

    // Disable tools
    const toolPrefix = myPlayerNum === 1 ? 'btn' : 'btn-2';
    document.getElementById(myPlayerNum === 1 ? 'btn-clear' : 'btn-clear-2').disabled = true;
    document.getElementById(myPlayerNum === 1 ? 'btn-submit' : 'btn-submit-2').disabled = true;
};

document.getElementById('btn-submit').addEventListener('click', () => { if (myPlayerNum === 1) submitDrawing(); });
document.getElementById('btn-submit-2').addEventListener('click', () => { if (myPlayerNum === 2) submitDrawing(); });

ui.btnFindMatch.addEventListener('click', () => {
    connectWS();
    ui.lobbyStatus.innerText = "Connecting...";
    ui.btnFindMatch.disabled = true;
});

ui.btnPlayAgain.addEventListener('click', () => {
    window.location.reload();
});


// WebSocket Handling
function connectWS() {
    ws = new WebSocket(`${WS_URL}/${myClientId}`);

    ws.onopen = () => {
        ws.send(JSON.stringify({ action: 'find_match' }));
    };

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        handleMessage(msg);
    };

    ws.onclose = () => {
        if (state !== 'game_over') {
            alert("Disconnected from server.");
            window.location.reload();
        }
    };
}

function handleMessage(msg) {
    if (msg.type === 'waiting_for_match') {
        ui.lobbyStatus.innerText = "Waiting for an opponent...";
    }
    else if (msg.type === 'match_found') {
        myPlayerNum = msg.player_num;

        // Show me tags
        document.getElementById(`p${myPlayerNum}-me-tag`).classList.remove('hidden');

        // Disable tools for opponent side
        if (myPlayerNum === 1) {
            document.getElementById('btn-clear-2').disabled = true;
            document.getElementById('btn-submit-2').disabled = true;
        } else {
            document.getElementById('btn-clear').disabled = true;
            document.getElementById('btn-submit').disabled = true;
        }

        switchScreen('game');
        ui.baseline.innerText = "Setting Up...";
    }
    else if (msg.type === 'round_start') {
        state = 'drawing';
        switchScreen('game');

        clearCanvas(1);
        clearCanvas(2);
        document.getElementById('p1-jolly-input').value = "";
        document.getElementById('p2-jolly-input').value = "";

        ui.baseline.innerText = msg.baseline ? msg.baseline : "Nothing (Start)";
        document.getElementById('p1-action-status').innerText = "Drawing...";
        document.getElementById('p2-action-status').innerText = "Drawing...";

        // Manage Overlays
        document.getElementById('p1-block-overlay').className = "block-overlay" + (myPlayerNum === 1 ? " active-draw" : "");
        document.getElementById('p2-block-overlay').className = "block-overlay" + (myPlayerNum === 2 ? " active-draw" : "");

        // Enable own tools
        document.getElementById(myPlayerNum === 1 ? 'btn-clear' : 'btn-clear-2').disabled = false;
        document.getElementById(myPlayerNum === 1 ? 'btn-submit' : 'btn-submit-2').disabled = false;

        ui.timer.innerText = "30";
        ui.timer.classList.remove('warning');
    }
    else if (msg.type === 'tick') {
        ui.timer.innerText = msg.time_left;
        if (msg.time_left <= 5) ui.timer.classList.add('warning');
    }
    else if (msg.type === 'judging_started') {
        state = 'judging';
        ui.timer.innerText = "00";
        document.getElementById('judging-verdict').innerText = "";
        document.getElementById('judging-expl').innerText = "";
        document.getElementById('judge-p1-desc').innerText = "?";
        document.getElementById('judge-p2-desc').innerText = "?";
        switchScreen('judging');
    }
    else if (msg.type === 'round_result') {
        const j = msg.judgment;
        document.getElementById('judge-p1-desc').innerText = j.p1_recognized;
        document.getElementById('judge-p2-desc').innerText = j.p2_recognized;

        let verdict = "ROUND TIE";
        let vColor = "#94a3b8"; // tie

        if (j.winner === 'p1') {
            verdict = "PLAYER 1 WINS ROUND";
            vColor = "#3b82f6";
        } else if (j.winner === 'p2') {
            verdict = "PLAYER 2 WINS ROUND";
            vColor = "#ef4444";
        }

        const elVerdict = document.getElementById('judging-verdict');
        elVerdict.innerText = verdict;
        elVerdict.style.color = vColor;

        document.getElementById('judging-expl').innerText = j.explanation + (j.violation_reason ? ` (Violation: ${j.violation_reason})` : "");

        // Update scores
        ui.p1Score.innerText = msg.p1_score;
        ui.p2Score.innerText = msg.p2_score;

        // Update Jolly Badges and UI
        document.getElementById('p1-jolly-badge').style.display = msg.p1_jolly ? 'block' : 'none';
        document.getElementById('p2-jolly-badge').style.display = msg.p2_jolly ? 'block' : 'none';

        // If my player has jolly, reveal text input next round
        const myJollyStatus = myPlayerNum === 1 ? msg.p1_jolly : msg.p2_jolly;
        if (myJollyStatus) {
            document.getElementById(`p${myPlayerNum}-jolly-overlay`).classList.remove('hidden');
        } else {
            document.getElementById(`p${myPlayerNum}-jolly-overlay`).classList.add('hidden');
        }

        // Reveal opponent canvas (Simulation - actual images not sent right now to keep payload small, but we reveal overlay)
        document.getElementById('p1-block-overlay').className = "block-overlay revealed";
        document.getElementById('p2-block-overlay').className = "block-overlay revealed";

        if (msg.game_over) {
            setTimeout(() => {
                showGameOver(msg);
            }, 5000);
        }
    }
    else if (msg.type === 'opponent_disconnected') {
        alert("Opponent disconnected!");
        window.location.reload();
    }
}

function switchScreen(screenName) {
    if (screenName !== 'judging' && screenName !== 'game_over') {
        Object.values(screens).forEach(s => s.classList.add('hidden'));
    }

    if (screenName === 'lobby') {
        screens.lobby.classList.remove('hidden');
        screens.header.classList.add('hidden');
    } else if (screenName === 'game') {
        screens.game.classList.remove('hidden');
        screens.header.classList.remove('hidden');
        screens.judging.classList.add('hidden'); // Hide overlay if active
    } else if (screenName === 'judging') {
        screens.judging.classList.remove('hidden');
    } else if (screenName === 'game_over') {
        screens.gameOver.classList.remove('hidden');
    }
}

function showGameOver(msg) {
    state = 'game_over';
    switchScreen('game_over');

    document.getElementById('final-p1-score').innerText = msg.p1_score;
    document.getElementById('final-p2-score').innerText = msg.p2_score;

    let title = "TIE MATCH";
    if (msg.winner_id) {
        if (msg.winner_id === myClientId) {
            title = "YOU WIN!";
        } else {
            title = "YOU LOSE!";
        }
    }
    document.getElementById('game-over-title').innerText = title;

    if (msg.ties_in_a_row >= 3) {
        document.getElementById('game-over-subtitle').innerText = "Match ended due to 3 consecutive ties.";
    }
}
