---
globs:
  - "server/**/*.js"
---

# Server Rules

- Server is authoritative - validate all client actions
- Socket.io events use `domain:action` format (e.g., `player:shoot`, `room:join`)
- Tick rates: physics 60Hz (GameLoop), state broadcast 20Hz
- Room.js manages game state, players, mobs, waves
- Player.js handles individual player logic and abilities
- Always emit to room via `io.to(roomCode).emit()` for broadcasts
