import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { Room } from './game/Room.js';
import { ROOM_CONFIG } from '../shared/constants.js';

// ES Module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// CORS configuration - allow localhost in dev, same origin in production
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (same-origin, mobile apps, etc.)
      if (!origin) {
        callback(null, true);
        return;
      }
      // Allow localhost for development
      if (origin.startsWith('http://localhost:')) {
        callback(null, true);
        return;
      }
      // Allow Render URLs and custom domains
      if (origin.includes('.onrender.com') || process.env.CLIENT_URL === origin) {
        callback(null, true);
        return;
      }
      // In production, allow same origin
      callback(null, true);
    },
    methods: ['GET', 'POST'],
  },
});

// Serve static files from client build in production
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Store active rooms
const rooms = new Map();

// Generate room code
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < ROOM_CONFIG.CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Create a new room
  socket.on('room:create', (callback) => {
    try {
      let roomCode;
      do {
        roomCode = generateRoomCode();
      } while (rooms.has(roomCode));

      const room = new Room(roomCode, io);
      rooms.set(roomCode, room);

      console.log(`Room created: ${roomCode}`);
      if (typeof callback === 'function') {
        callback({ success: true, roomCode });
      }
    } catch (error) {
      console.error('Error creating room:', error);
      if (typeof callback === 'function') {
        callback({ success: false, error: 'Failed to create room' });
      }
    }
  });

  // Join an existing room
  socket.on('room:join', ({ roomCode, playerName }, callback) => {
    try {
      const room = rooms.get(roomCode);

      if (!room) {
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Room not found' });
        }
        return;
      }

      if (room.players.size >= ROOM_CONFIG.MAX_PLAYERS) {
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Room is full' });
        }
        return;
      }

      if (room.gameStarted) {
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Game already in progress' });
        }
        return;
      }

      room.addPlayer(socket, playerName);
      socket.join(roomCode);
      socket.roomCode = roomCode;

      console.log(`Player ${playerName} joined room ${roomCode}`);
      if (typeof callback === 'function') {
        callback({ success: true, playerId: socket.id });
      }

      // Notify all players in room
      io.to(roomCode).emit('room:playerJoined', {
        playerId: socket.id,
        playerName,
        players: room.getPlayersInfo(),
        selectedMap: room.getSelectedMap(),
      });
    } catch (error) {
      console.error('Error joining room:', error);
      if (typeof callback === 'function') {
        callback({ success: false, error: 'Failed to join room' });
      }
    }
  });

  // Select map (host only in practice, but server doesn't enforce)
  socket.on('room:selectMap', ({ mapId }) => {
    try {
      console.log(`Map selection request: ${mapId} for room ${socket.roomCode}`);
      if (!socket.roomCode) return;
      const room = rooms.get(socket.roomCode);
      if (room && !room.gameStarted) {
        if (room.setMap(mapId)) {
          console.log(`Map set to ${mapId} for room ${socket.roomCode}`);
          io.to(socket.roomCode).emit('room:mapChanged', {
            mapId,
          });
        }
      }
    } catch (error) {
      console.error('Error selecting map:', error);
    }
  });

  // Select character class
  socket.on('player:selectClass', ({ classType }) => {
    try {
      if (!socket.roomCode) return;
      const room = rooms.get(socket.roomCode);
      if (room) {
        room.setPlayerClass(socket.id, classType);
        io.to(socket.roomCode).emit('room:playerUpdated', {
          players: room.getPlayersInfo(),
        });
      }
    } catch (error) {
      console.error('Error selecting class:', error);
    }
  });

  // Player ready status
  socket.on('player:ready', ({ ready }) => {
    try {
      if (!socket.roomCode) return;
      const room = rooms.get(socket.roomCode);
      if (room) {
        room.setPlayerReady(socket.id, ready);
        io.to(socket.roomCode).emit('room:playerUpdated', {
          players: room.getPlayersInfo(),
        });

        // Check if all players are ready
        if (room.allPlayersReady() && room.players.size >= 1) {
          room.startGame();
        }
      }
    } catch (error) {
      console.error('Error setting ready status:', error);
    }
  });

  // Player input (movement, aiming)
  socket.on('player:input', (input) => {
    try {
      if (!socket.roomCode) return;
      const room = rooms.get(socket.roomCode);
      if (room && room.gameStarted) {
        room.handlePlayerInput(socket.id, input);
      }
    } catch (error) {
      console.error('Error handling player input:', error);
    }
  });

  // Player shoot
  socket.on('player:shoot', (data) => {
    try {
      if (!socket.roomCode) return;
      const room = rooms.get(socket.roomCode);
      if (room && room.gameStarted) {
        room.handlePlayerShoot(socket.id, data);
      }
    } catch (error) {
      console.error('Error handling player shoot:', error);
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    try {
      console.log(`Player disconnected: ${socket.id}`);

      if (!socket.roomCode) return;
      const room = rooms.get(socket.roomCode);
      if (room) {
        room.removePlayer(socket.id);
        io.to(socket.roomCode).emit('room:playerLeft', {
          playerId: socket.id,
          players: room.getPlayersInfo(),
        });

        // Clean up empty rooms
        if (room.players.size === 0) {
          room.stopGame();
          rooms.delete(socket.roomCode);
          console.log(`Room ${socket.roomCode} deleted (empty)`);
        }
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
