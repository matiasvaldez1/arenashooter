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
│       ├── Room.js            # Room state, ability handlers
│       ├── Player.js          # Server-side player entity
│       └── GameLoop.js        # Physics tick loop (60Hz)
├── shared/                     # Shared between client/server
│   ├── constants.js           # Game config, powerups, theme exports
│   ├── maps.js                # Dynamic map exports from themes
│   └── themes/                # Modular theme system
│       ├── index.js           # Theme registry & API
│       ├── politics.js        # Politics theme (Messi, Trump, etc.)
│       └── kpop.js            # K-pop theme (Jungkook, Lisa, etc.)
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

## Theme System

The game uses a modular theme system allowing complete character/map swaps:

```javascript
import { setActiveTheme, getCharacterList } from './shared/constants.js';

setActiveTheme('KPOP');  // Switch to K-pop theme
console.log(getCharacterList()); // ['JUNGKOOK', 'MOMO', 'HAEWON', 'LISA', 'WINTER']
```

### Theme API

| Function | Description |
|----------|-------------|
| `getActiveTheme()` | Returns current theme object |
| `setActiveTheme(id)` | Switch theme ('POLITICS', 'KPOP') |
| `getCharacterList()` | Array of enabled character IDs |
| `getCharacter(id)` | Get character stats/abilities |
| `getActiveMaps()` | Object of maps for current theme |
| `getActiveMobs()` | Object of mobs for current theme |

### Adding a New Theme

1. Create `shared/themes/yourtheme.js`:
```javascript
export const YOUR_THEME = {
  id: 'YOUR_THEME',
  name: 'Theme Name',
  characters: { /* character definitions */ },
  maps: { /* map definitions */ },
  mobs: { /* mob definitions */ },
};
```

2. Register in `shared/themes/index.js`:
```javascript
import { YOUR_THEME } from './yourtheme.js';
export const THEMES = { ..., YOUR_THEME };
```

3. Add sprites in `SpriteGenerator.js`

### Available Themes

**Politics** (default):
| Character | Health | Speed | Ability | Ultimate |
|-----------|--------|-------|---------|----------|
| Messi | 70 | 300 | Dash | Golden Ball |
| Milei | 100 | 220 | Chainsaw | Dollarization |
| Trump | 110 | 170 | Turret/Wall | MAGA Mech |
| Biden | 90 | 160 | Heal Zone | Executive Order |
| Putin | 120 | 150 | Missile Barrage | Nuclear Strike |

**K-pop**:
| Character | Health | Speed | Ability | Ultimate |
|-----------|--------|-------|---------|----------|
| Jungkook | 90 | 260 | Dash | Dynamite |
| Momo | 75 | 320 | Dance Zone | Fancy |
| Haewon | 85 | 240 | Scream | O.O |
| Lisa | 80 | 280 | Rapid Fire | Money |
| Winter | 95 | 220 | Freeze Zone | Black Mamba |

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
