# 8-Bit Arena Shooter - Quick Start Guide

## Prerequisites
- Node.js 18+
- npm 8+

## Installation

```bash
npm install
```

## Running the Game

```bash
npm run dev
```

This starts both client and server:
- **Client**: http://localhost:5173 (Vite may use next available port)
- **Server**: http://localhost:3001

## How to Play

1. **Create or Join a Room**
   - Click "Create Room" to start a new game
   - Or enter a room code and click "Join Room"

2. **Select Your Character**
   - Choose from 5 famous personalities: Messi, Milei, Trump, Biden, Putin
   - Each has unique abilities and stats

3. **Select a Map** (Host only)
   - Arena Clasica - Standard arena
   - El Congreso - Argentine Congress with protester mobs

4. **Ready Up**
   - Click "READY" when all players have joined
   - Game starts when everyone is ready

5. **Battle!**
   - Defeat opponents to score points
   - Collect powerups for advantages
   - Use your ultimate ability (Q) when charged

## Game Modes

Currently supports:
- **Free-for-All**: Every player for themselves
- **Room-based**: Up to 8 players per room

## Documentation

- [Controls](./CONTROLS.md) - Full keyboard/mouse reference
- [Architecture](./ARCHITECTURE.md) - Technical overview
- [API Reference](./API.md) - Socket.io events
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues
