const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const GameRoom = require('./game/GameRoom');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// REST Routes
app.use('/api', apiRoutes);

// WebSocket Setup
const io = new Server(server, {
  cors: {
    origin: '*', // For development
    methods: ['GET', 'POST']
  }
});

const gameRoom = new GameRoom();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_game', (username) => {
    gameRoom.addPlayer(socket.id, username);
    socket.emit('init_state', gameRoom.getState());
  });

  socket.on('move', (direction) => {
    gameRoom.movePlayer(socket.id, direction);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    gameRoom.removePlayer(socket.id);
  });
});

// Broadcast game state to all clients 30 times a second
setInterval(() => {
  io.emit('game_state', gameRoom.getState());
}, 1000 / 30);

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
