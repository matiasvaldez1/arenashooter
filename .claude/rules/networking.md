---
globs:
  - "client/src/network/**/*.js"
  - "server/index.js"
---

# Networking Rules

- Socket.io events: `domain:action` naming convention
- Domains: room, player, game, wave, bullet
- Server handlers in server/index.js
- Client handlers in SocketManager.js and scene files
- Always handle connection errors and disconnects gracefully
- Use callbacks for request-response patterns (room:create, room:join)
