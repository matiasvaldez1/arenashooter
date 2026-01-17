# Socket.io API Reference

## Connection

Connect to: `http://localhost:3001`

## Client -> Server Events

### Room Management

| Event | Payload | Description |
|-------|---------|-------------|
| `room:create` | - | Create new room, callback returns `{success, roomCode}` |
| `room:join` | `{roomCode, playerName}` | Join existing room, callback returns `{success, playerId}` |
| `room:selectMap` | `{mapId}` | Host selects map (`ARENA`, `CONGRESO`, etc.) |
| `room:selectGameMode` | `{mode}` | Host selects game mode (`ARENA`, `WAVE_SURVIVAL`, `INFINITE_HORDE`) |
| `room:changeStep` | `{step}` | Host changes lobby step (0-3) |
| `room:returnToLobby` | - | Return all players to lobby, preserving room |

### Player Actions

| Event | Payload | Description |
|-------|---------|-------------|
| `player:selectClass` | `{classType}` | Select character (`MESSI`, `MILEI`, `TRUMP`, `BIDEN`, `PUTIN`) |
| `player:ready` | `{ready}` | Toggle ready status (boolean) |
| `player:input` | `{up, down, left, right, angle, ability, ultimate}` | Movement and action input |
| `player:shoot` | `{angle}` | Fire weapon at angle (radians) |
| `player:ultimate` | - | Activate ultimate ability |
| `wave:selectPerk` | `{perkId}` | Select perk during wave intermission |
| `game:playAgain` | - | Restart game with same settings |

## Server -> Client Events

### Room Events

| Event | Payload | Description |
|-------|---------|-------------|
| `room:playerJoined` | `{playerId, playerName, players, selectedMap, gameMode, lobbyStep}` | Player joined room |
| `room:playerLeft` | `{playerId, players}` | Player left room |
| `room:playerUpdated` | `{players}` | Player info changed (class, ready status) |
| `room:mapChanged` | `{mapId}` | Map selection changed |
| `room:gameModeChanged` | `{mode}` | Game mode selection changed |
| `room:stepChanged` | `{step}` | Lobby step changed (synced to non-hosts) |
| `room:backToLobby` | `{players, selectedMap, gameMode}` | All players returned to lobby |

### Game State

| Event | Payload | Description |
|-------|---------|-------------|
| `game:start` | `{players, mapId, gameMode, modifiers, gameDuration}` | Game starting |
| `game:state` | `{players, bullets, grenades, powerups, turrets, barriers, barrels, healZones, mobs, timeRemaining, activeBoss}` | Full game state (20Hz) |
| `game:end` | `{reason, winner, scores, finalKill}` | Arena game ended (time limit reached) |

### Combat Events

| Event | Payload | Description |
|-------|---------|-------------|
| `bullet:spawn` | `{id, x, y, vx, vy, ownerId, damage, ...}` | New bullet created |
| `bullet:destroy` | `{id}` | Bullet removed |
| `bullet:ricochet` | `{id, x, y}` | Bullet bounced off wall |
| `grenade:spawn` | `{id, x, y, vx, vy, ownerId}` | New grenade created |
| `grenade:explode` | `{id, x, y, radius, damage}` | Grenade exploded |

### Player Events

| Event | Payload | Description |
|-------|---------|-------------|
| `player:hit` | `{playerId, damage, health, shieldBlocked}` | Player took damage |
| `player:death` | `{playerId, killerId, scores}` | Player died |
| `player:respawn` | `{playerId, x, y, health}` | Player respawned |
| `player:heal` | `{playerId, amount, health}` | Player healed |
| `player:dash` | `{playerId, x, y}` | Player dashed (Messi) |
| `player:dodge` | `{playerId}` | Player dodged |
| `player:chainsaw` | `{playerId, angle}` | Chainsaw attack (Milei) |

### Kill Streaks

| Event | Payload | Description |
|-------|---------|-------------|
| `killStreak` | `{playerId, streak, name, color}` | Kill streak achieved |

### Entity Events

| Event | Payload | Description |
|-------|---------|-------------|
| `powerup:spawn` | `{id, type, x, y}` | Powerup appeared |
| `powerup:collected` | `{id, playerId, type}` | Powerup picked up |
| `turret:spawn` | `{id, x, y, ownerId}` | Turret deployed |
| `turret:shoot` | `{turretId}` | Turret fired |
| `turret:destroy` | `{id}` | Turret destroyed |
| `barrier:spawn` | `{id, x, y, width, height}` | Barrier created |
| `barrier:destroy` | `{id}` | Barrier destroyed |
| `barrel:explode` | `{id, x, y}` | Barrel exploded |
| `healZone:spawn` | `{id, x, y, radius}` | Heal zone created |
| `healZone:destroy` | `{id}` | Heal zone expired |

### Mob Events

| Event | Payload | Description |
|-------|---------|-------------|
| `mob:spawn` | `{id, type, x, y, health, maxHealth}` | Mob spawned |
| `mob:hit` | `{id, damage, health}` | Mob took damage |
| `mob:death` | `{id, killerId}` | Mob killed |
| `mob:attack` | `{mobId, targetId, damage}` | Mob attacked player |

### Ultimate Events

| Event | Payload | Description |
|-------|---------|-------------|
| `player:ultimate` | `{playerId, type}` | Ultimate ability activated |
| `ultimate:dollarization` | `{playerId, duration}` | Dollarization ultimate (Milei) |
| `ultimate:nuclearStrike` | `{playerId}` | Nuclear strike (Putin) |
| `ultimate:fancy` | `{playerId, duration}` | Fancy hypnotize (Momo) |
| `ultimate:sonicWave` | `{playerId, wave}` | Sonic wave (Haewon) |
| `ultimate:money` | `{playerId, duration}` | Money damage aura (Lisa) |
| `ultimate:blackMamba` | `{playerId, duration}` | Black Mamba freeze (Winter) |

### Wave Survival Events

| Event | Payload | Description |
|-------|---------|-------------|
| `wave:start` | `{waveNumber, mobCount, modifiers, isBossWave, gameMode}` | Wave starting |
| `wave:complete` | `{waveNumber, mobsKilled, totalMobsKilled}` | Wave completed |
| `wave:perkOffer` | `{perks, timeRemaining}` | Perk selection offered |
| `wave:perkSelected` | `{playerId, perkId, playerPerks}` | Player selected perk |
| `wave:gameOver` | `{finalWave, totalMobsKilled, scores, finalKill}` | Wave survival ended |

### Boss Events (Infinite Horde)

| Event | Payload | Description |
|-------|---------|-------------|
| `boss:spawn` | `{id, type, x, y, health, maxHealth, bossConfig}` | Boss spawned |
| `boss:death` | `{id, killerId, bossType, bossesKilled}` | Boss killed |
| `boss:charge` | `{id, targetX, targetY}` | Boss charging attack |
| `boss:shoot` | `{id, angle}` | Boss fired projectile |

## Payload Types

### Player State
```javascript
{
  id: string,
  x: number,
  y: number,
  angle: number,
  health: number,
  maxHealth: number,
  alive: boolean,
  score: number,
  killStreak: number,
  ultimateCharge: number,
  classType: string,
  abilityActive: boolean,
  spawnProtection: number
}
```

### Bullet State
```javascript
{
  id: string,
  x: number,
  y: number,
  vx: number,
  vy: number,
  ownerId: string,
  damage: number,
  color: string,
  ricochetCount: number,
  lifeSteal: number
}
```
