require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const { setupSocket } = require('./socket');
const { createMatch, getMatch } = require('./gameState');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Jankenpon API' });
});

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Setup sockets
setupSocket(io);

// Simple API to create a match
app.post('/api/match/create', (req, res) => {
    const code = createMatch();
    res.json({ code });
});

// Update Join API logic to handle names
app.post('/api/match/:code/join', (req, res) => {
    const { playerName } = req.body;
    if (!playerName) return res.status(400).json({ error: 'Player name required' });

    // We pass a dummy socketId here, it gets updated in 'join_room' socket event
    const joinResult = require('./gameState').joinMatch(req.params.code, 'pending', playerName);

    if (joinResult.error) {
        res.status(400).json({ error: joinResult.error });
    } else {
        res.json({ success: true, slot: joinResult.slot, match: joinResult.match });
    }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
