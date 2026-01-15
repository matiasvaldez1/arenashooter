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

### Player Actions

| Event | Payload | Description |
|-------|---------|-------------|
| `player:selectClass` | `{classType}` | Select character (`MESSI`, `MILEI`, `TRUMP`, `BIDEN`, `PUTIN`) |
| `player:ready` | `{ready}` | Toggle ready status (boolean) |
| `player:input` | `{up, down, left, right, angle, ability, ultimate}` | Movement and action input |
| `player:shoot` | `{angle}` | Fire weapon at angle (radians) |

## Server -> Client Events

### Room Events

| Event | Payload | Description |
|-------|---------|-------------|
| `room:playerJoined` | `{playerId, playerName, players, selectedMap}` | Player joined room |
| `room:playerLeft` | `{playerId, players}` | Player left room |
| `room:playerUpdated` | `{players}` | Player info changed (class, ready status) |
| `room:mapChanged` | `{mapId}` | Map selection changed |

### Game State

| Event | Payload | Description |
|-------|---------|-------------|
| `game:start` | `{players, mapId}` | Game starting |
| `game:state` | `{players, bullets, grenades, powerups, turrets, barriers, barrels, healZones, mobs}` | Full game state (20Hz) |

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
| `ultimate:activate` | `{playerId, type}` | Ultimate ability used |
| `carpetBomb:explosion` | `{x, y}` | Carpet bomb hit (Biden) |
| `lifeSwap` | `{casterId, targetId, casterHealth, targetHealth}` | Life swap (if implemented) |

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
