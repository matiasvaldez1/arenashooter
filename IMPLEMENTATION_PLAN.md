# 8-Bit Arena Shooter - Implementation Plan

## Quick Start

```bash
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

---

## Project Overview

A real-time 2D multiplayer arena shooter with:
- **Room-based matchmaking** (create/join via shareable link)
- **Two character classes**: Gunner & Grenadier
- **Score-based gameplay** with respawns
- **Programmatic pixel art sprites**

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Game Engine | Phaser 3 |
| Client Build | Vite |
| Server | Node.js + Express |
| Real-time | Socket.io |

---

## Project Structure

```
multiplayer8bitgame/
├── client/
│   ├── index.html              # Entry HTML
│   ├── vite.config.js          # Vite configuration
│   └── src/
│       ├── main.js             # Phaser game init
│       ├── scenes/
│       │   ├── BootScene.js    # Asset loading
│       │   ├── MenuScene.js    # Room create/join
│       │   ├── LobbyScene.js   # Character select
│       │   └── GameScene.js    # Main gameplay
│       ├── network/
│       │   └── SocketManager.js
│       └── utils/
│           └── SpriteGenerator.js
├── server/
│   ├── index.js                # Express + Socket.io
│   └── game/
│       ├── Room.js             # Room state
│       ├── Player.js           # Player entity
│       └── GameLoop.js         # Physics/tick
├── shared/
│   └── constants.js            # Shared config
└── package.json
```

---

## Character Classes

### Gunner
- Health: 100
- Speed: 200 px/s
- Fire Rate: 3 shots/sec
- Damage: 25

### Grenadier
- Health: 120
- Speed: 170 px/s
- Fire Rate: 1 shot/sec
- Damage: 50 (direct) / 30 (splash)
- Explosion Radius: 80px

---

## Network Events

| Event | Direction | Data |
|-------|-----------|------|
| `room:create` | C→S | - |
| `room:join` | C→S | roomCode, playerName |
| `player:input` | C→S | keys, angle |
| `player:shoot` | C→S | angle |
| `game:state` | S→C | players, bullets |
| `bullet:spawn` | S→C | bullet data |
| `player:hit` | S→C | playerId, damage |
| `player:death` | S→C | playerId, scores |

---

## How to Play

1. **Create a room** or **join via link**
2. **Select class** (Gunner or Grenadier)
3. **Click Ready** to start
4. **WASD** to move
5. **Mouse** to aim
6. **Click** to shoot
7. **TAB** to view scoreboard

---

## Future Improvements

- [ ] Add more character classes
- [ ] Multiple arena maps
- [ ] Power-ups and pickups
- [ ] Sound effects
- [ ] Mobile controls
- [ ] Persistent leaderboards
