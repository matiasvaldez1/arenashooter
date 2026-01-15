# Architecture Overview

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Client Framework | Phaser 3 | 2D game engine, sprites, physics |
| Client Build | Vite | Fast dev server, bundling |
| Server Runtime | Node.js | JavaScript backend |
| Real-time | Socket.io | WebSocket abstraction, rooms |
| Server Framework | Express | HTTP server |

## Directory Structure

```
multiplayer8bitgame/
├── client/                     # Phaser 3 game client
│   ├── index.html             # Entry HTML
│   ├── vite.config.js         # Vite configuration
│   └── src/
│       ├── main.js            # Phaser game initialization
│       ├── scenes/
│       │   ├── BootScene.js   # Asset loading, server connection
│       │   ├── MenuScene.js   # Room create/join UI
│       │   ├── LobbyScene.js  # Character & map selection
│       │   └── GameScene.js   # Main gameplay (2400+ lines)
│       ├── network/
│       │   └── SocketManager.js  # Socket.io client wrapper
│       └── utils/
│           ├── SoundManager.js   # Procedural audio
│           ├── i18n.js           # Spanish/English translations
│           └── SpriteGenerator.js # Programmatic sprites
├── server/                     # Node.js + Socket.io server
│   ├── index.js               # Entry point, socket handlers
│   └── game/
│       ├── Room.js            # Room state management
│       ├── Player.js          # Server-side player entity
│       └── GameLoop.js        # Physics tick loop (60Hz)
├── shared/                     # Shared between client/server
│   ├── constants.js           # Game config, classes, powerups
│   └── maps.js                # Map definitions, mobs
├── docs/                       # Documentation
└── package.json
```

## Data Flow

```
┌─────────────┐                    ┌─────────────┐
│   Client    │                    │   Server    │
│  (Phaser)   │                    │  (Node.js)  │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │ player:input (keys, angle)       │
       │─────────────────────────────────>│
       │                                  │
       │                    GameLoop runs │
       │                    at 60Hz       │
       │                                  │
       │ game:state (positions @ 20Hz)    │
       │<─────────────────────────────────│
       │                                  │
       │ player:shoot                     │
       │─────────────────────────────────>│
       │                                  │
       │ bullet:spawn                     │
       │<─────────────────────────────────│
       │                                  │
       │ player:hit / player:death        │
       │<─────────────────────────────────│
```

## Key Classes

### Server

- **Room** (`server/game/Room.js`)
  - Manages all game state for a room
  - Players, bullets, grenades, powerups, mobs
  - Handles ultimates and special abilities

- **Player** (`server/game/Player.js`)
  - Player entity with health, position, class
  - Damage calculation, respawn logic
  - Ultimate charge tracking

- **GameLoop** (`server/game/GameLoop.js`)
  - Runs at 60Hz for physics
  - Broadcasts state at 20Hz
  - Collision detection for all entities

### Client

- **SocketManager** (`client/src/network/SocketManager.js`)
  - Singleton for server communication
  - Connection management with timeout
  - Event subscription/unsubscription

- **GameScene** (`client/src/scenes/GameScene.js`)
  - Main gameplay rendering
  - Input handling
  - Entity interpolation for smooth movement
  - UI (health, score, ultimate bar)

## Character Classes

| Character | Health | Speed | Ability | Ultimate |
|-----------|--------|-------|---------|----------|
| Messi | 100 | 220 | Dribble (dash) | Golden Ball (invincibility) |
| Milei | 110 | 200 | Chainsaw (melee) | Dollarization (damage aura) |
| Trump | 120 | 180 | Deploy Turret | Build Wall |
| Biden | 100 | 170 | Heal Zone | Carpet Bomb |
| Putin | 130 | 190 | Bear Turret | Nuclear Strike |

## Server Authority

The server is authoritative for:
- Player positions and movement
- Hit detection and damage
- Score tracking
- Powerup spawning and collection
- Mob AI and combat

The client handles:
- Input capture and sending
- Rendering and interpolation
- Visual effects and sounds
- UI state
