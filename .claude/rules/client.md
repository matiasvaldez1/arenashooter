---
globs:
  - "client/src/**/*.js"
---

# Client Rules

- Phaser 3 game engine - use Phaser APIs for rendering, input, physics
- GameScene.js is the main gameplay (~2400 lines)
- Client interpolates between server state updates (20Hz)
- All sprites are procedurally generated via SpriteGenerator.js
- SocketManager.js wraps all server communication
- Never trust client state for game logic - server is authoritative
