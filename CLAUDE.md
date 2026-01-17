# CLAUDE.md - Project Guidelines

## Project Overview

Multiplayer 8-bit arena shooter with a modular theme system. Themes include Politics (Messi, Milei, Trump, Biden, Putin) and K-pop (Jungkook, Momo, Haewon, Lisa, Winter). Features real-time Socket.io networking and Phaser 3 rendering.

## Tech Stack

| Component | Technology | Port |
|-----------|------------|------|
| Client | Phaser 3 + Vite | 5173 (or next available) |
| Server | Node.js + Express + Socket.io | 3001 |
| Shared | ES Modules | - |

## Key Commands

```bash
npm install      # Install dependencies
npm run dev      # Start both client and server (development)
npm run server   # Server only
npm run client   # Client only
npm run build    # Production build
```

## Documentation

| File | Description |
|------|-------------|
| [docs/README.md](./docs/README.md) | Quick start guide |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Technical overview, data flow |
| [docs/API.md](./docs/API.md) | Socket.io events reference |
| [docs/CONTROLS.md](./docs/CONTROLS.md) | Game controls and abilities |
| [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) | Common issues and fixes |

## Code Conventions

- **ES Modules** - Use `import`/`export` (not CommonJS)
- **Socket.io events** - Named as `domain:action` (e.g., `player:shoot`, `room:join`)
- **Constants** - SCREAMING_SNAKE_CASE in `shared/constants.js`
- **Classes** - PascalCase (e.g., `GameScene`, `SocketManager`)
- **Commit messages** - All lowercase, 1 line max, no AI/Claude mentions
- **Comments** - Only essential comments; no obvious explanations, no comment spam. Code should be self-documenting.

## Important Files

### Server
- `server/index.js` - Socket event handlers, room management
- `server/game/Room.js` - Game room state, ultimates, mobs
- `server/game/GameLoop.js` - Physics (60Hz), collisions, state broadcast (20Hz)
- `server/game/Player.js` - Player entity, damage, abilities

### Client
- `client/src/main.js` - Phaser initialization
- `client/src/scenes/GameScene.js` - Main gameplay (~2400 lines)
- `client/src/network/SocketManager.js` - Socket.io wrapper
- `client/src/utils/SpriteGenerator.js` - Programmatic sprite generation

### Shared
- `shared/constants.js` - Game config, powerups, theme API exports
- `shared/maps.js` - Dynamic map/mob exports from active theme
- `shared/themes/index.js` - Theme registry, getters, setters
- `shared/themes/politics.js` - Politics theme (Messi, Trump, etc.)
- `shared/themes/kpop.js` - K-pop theme (Jungkook, Lisa, etc.)

## Architecture Notes

- **Server-authoritative**: Server validates all game actions
- **Client interpolation**: Smooth movement between state updates
- **Tick rates**: Physics at 60Hz, state broadcast at 20Hz
- **Procedural assets**: All sprites generated via Canvas API
- **Modular themes**: Characters, maps, mobs defined in `shared/themes/`

## Deployment

Configured for **Render** (free tier):

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main

# 2. Deploy to Render
# - Go to render.com
# - New > Web Service
# - Connect your GitHub repo
# - It will auto-detect render.yaml
```

Or use the Render Blueprint (render.yaml already configured).

## Known Constraints

1. **Single server**: No horizontal scaling currently
2. **No persistence**: Game state lost on server restart
3. **8 players max**: Per room limit in `shared/constants.js`
4. **Free tier sleep**: Render free tier sleeps after 15min inactivity

## Testing

Manual testing via browser. No automated test suite.

To test:
1. Run `npm run dev`
2. Open http://localhost:5173 in browser
3. Create a room, note the code
4. Open another tab, join with the code
5. Test gameplay features

## Claude Code Agents

Custom subagents in `.claude/agents/`:

| Agent | Purpose |
|-------|---------|
| `live-debugger` | Real-time browser debugging via Chrome MCP. Watches console, executes JS, captures screenshots, inspects WebSocket traffic. |

**Usage**: `Use live-debugger to check why player movement isn't syncing`

**Useful debug commands** (run in browser via agent):
```javascript
game.scene.scenes[0].players      // All players
game.scene.scenes[0].localPlayer  // Local player
game.scene.scenes[0].socket       // Socket instance
```

## Environment

- Node.js 18+ required
- Modern browser with ES module support
- Windows/Mac/Linux compatible
