import { io } from 'socket.io-client';

// Server URL - auto-detect in production, localhost in development
const SERVER_URL = import.meta.env.DEV
  ? 'http://localhost:3001'
  : window.location.origin;

class SocketManagerClass {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.roomCode = null;
    this.playerId = null;
    this.playerName = null;
  }

  connect(timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      // Set up connection timeout
      const timeout = setTimeout(() => {
        if (this.socket) {
          this.socket.disconnect();
          this.socket = null;
        }
        reject(new Error('Connection timeout'));
      }, timeoutMs);

      this.socket = io(SERVER_URL);

      this.socket.on('connect', () => {
        clearTimeout(timeout);
        this.connected = true;
        this.playerId = this.socket.id;
        console.log('Connected to server:', this.playerId);
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        console.error('Connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', () => {
        this.connected = false;
        console.log('Disconnected from server');
      });
    });
  }

  createRoom() {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.connected) {
        reject(new Error('Not connected to server'));
        return;
      }
      this.socket.emit('room:create', (response) => {
        if (response && response.success) {
          this.roomCode = response.roomCode;
          resolve(response.roomCode);
        } else {
          reject(new Error(response?.error || 'Failed to create room'));
        }
      });
    });
  }

  joinRoom(roomCode, playerName) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.connected) {
        reject(new Error('Not connected to server'));
        return;
      }
      this.socket.emit('room:join', { roomCode, playerName }, (response) => {
        if (response && response.success) {
          this.roomCode = roomCode;
          this.playerName = playerName;
          this.playerId = response.playerId;
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Failed to join room'));
        }
      });
    });
  }

  selectClass(classType) {
    if (!this.socket || !this.connected) {
      console.warn('Cannot selectClass: not connected');
      return;
    }
    this.socket.emit('player:selectClass', { classType });
  }

  selectMap(mapId) {
    if (!this.socket || !this.connected) {
      console.warn('Cannot selectMap: not connected');
      return;
    }
    console.log('SocketManager emitting room:selectMap with mapId:', mapId);
    this.socket.emit('room:selectMap', { mapId });
  }

  setReady(ready) {
    if (!this.socket || !this.connected) {
      console.warn('Cannot setReady: not connected');
      return;
    }
    this.socket.emit('player:ready', { ready });
  }

  sendInput(input) {
    if (!this.socket || !this.connected) {
      return; // Silent fail for high-frequency input
    }
    this.socket.emit('player:input', input);
  }

  shoot(angle) {
    if (!this.socket || !this.connected) {
      return; // Silent fail for high-frequency action
    }
    this.socket.emit('player:shoot', { angle });
  }

  on(event, callback) {
    if (!this.socket) {
      console.warn('Cannot subscribe to event: socket not initialized');
      return;
    }
    this.socket.on(event, callback);
  }

  off(event, callback) {
    if (!this.socket) {
      return;
    }
    // If callback is provided, remove specific listener
    // If not, remove all listeners for the event
    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }
}

export const SocketManager = new SocketManagerClass();
