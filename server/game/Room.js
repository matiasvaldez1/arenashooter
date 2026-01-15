import { Player } from './Player.js';
import { GameLoop } from './GameLoop.js';
import { GAME_CONFIG, PLAYER_CLASSES, POWERUPS, HAZARDS, KILL_STREAKS, POWERUP_SPAWN_INTERVAL } from '../../shared/constants.js';
import { MAPS, MOBS } from '../../shared/maps.js';

export class Room {
  constructor(code, io) {
    this.code = code;
    this.io = io;
    this.players = new Map();
    this.bullets = [];
    this.grenades = [];
    this.powerups = [];
    this.turrets = [];
    this.barriers = [];
    this.barrels = [];
    this.healZones = [];
    this.hazards = [];
    this.mobs = [];
    this.selectedMap = 'ARENA';
    this.gameStarted = false;
    this.gameLoop = null;
    this.lastPowerupSpawn = 0;
    this.lastMobSpawn = 0;
    this.pendingTimeouts = []; // Track timeouts to clear on room cleanup
  }

  addPlayer(socket, name) {
    const player = new Player(socket.id, name);
    this.players.set(socket.id, player);
    return player;
  }

  removePlayer(playerId) {
    // Remove player's turrets and barriers
    this.turrets = this.turrets.filter(t => t.ownerId !== playerId);
    this.barriers = this.barriers.filter(b => b.ownerId !== playerId);
    this.players.delete(playerId);
  }

  setPlayerClass(playerId, classType) {
    const player = this.players.get(playerId);
    if (player && PLAYER_CLASSES[classType]) {
      player.setClass(classType);
    }
  }

  setPlayerReady(playerId, ready) {
    const player = this.players.get(playerId);
    if (player) {
      player.ready = ready;
    }
  }

  setMap(mapId) {
    if (MAPS[mapId]) {
      this.selectedMap = mapId;
      return true;
    }
    return false;
  }

  getSelectedMap() {
    return this.selectedMap;
  }

  allPlayersReady() {
    if (this.players.size === 0) return false;
    for (const player of this.players.values()) {
      if (!player.ready) return false;
    }
    return true;
  }

  getPlayersInfo() {
    const info = [];
    for (const player of this.players.values()) {
      info.push({
        id: player.id,
        name: player.name,
        classType: player.classType,
        ready: player.ready,
        score: player.score,
        health: player.health,
      });
    }
    return info;
  }

  startGame() {
    this.gameStarted = true;

    // Initialize spawn points
    const spawnPoints = this.getSpawnPoints();
    let i = 0;
    for (const player of this.players.values()) {
      const spawn = spawnPoints[i % spawnPoints.length];
      player.spawn(spawn.x, spawn.y);
      i++;
    }

    // Initialize hazards and barrels
    this.initializeEnvironment();

    // Start game loop
    this.gameLoop = new GameLoop(this);
    this.gameLoop.start();

    console.log(`Starting game in room ${this.code} with map: ${this.selectedMap}`);
    this.io.to(this.code).emit('game:start', {
      players: this.getGameState().players,
      hazards: this.hazards,
      barrels: this.barrels,
      mapId: this.selectedMap,
    });
  }

  initializeEnvironment() {
    // Add explosive barrels - spread across 1280x720 arena
    this.barrels = [
      { id: 'barrel_1', x: 250, y: 180, health: HAZARDS.BARREL.health },
      { id: 'barrel_2', x: 1030, y: 180, health: HAZARDS.BARREL.health },
      { id: 'barrel_3', x: 250, y: 540, health: HAZARDS.BARREL.health },
      { id: 'barrel_4', x: 1030, y: 540, health: HAZARDS.BARREL.health },
      { id: 'barrel_5', x: 640, y: 360, health: HAZARDS.BARREL.health },
      { id: 'barrel_6', x: 450, y: 360, health: HAZARDS.BARREL.health },
      { id: 'barrel_7', x: 830, y: 360, health: HAZARDS.BARREL.health },
    ];

    // Add lava pits
    this.hazards = [
      { id: 'lava_1', type: 'LAVA', x: 150, y: 330, width: 60, height: 60 },
      { id: 'lava_2', type: 'LAVA', x: 1070, y: 330, width: 60, height: 60 },
    ];

    // Add bounce pads
    this.hazards.push(
      { id: 'bounce_1', type: 'BOUNCE', x: 400, y: 150, width: 40, height: 40, angle: -Math.PI / 2 },
      { id: 'bounce_2', type: 'BOUNCE', x: 880, y: 570, width: 40, height: 40, angle: Math.PI / 2 }
    );

    // Initialize mobs based on map
    this.initializeMobs();
  }

  initializeMobs() {
    const map = MAPS[this.selectedMap];
    if (!map || !map.hasMobs) return;

    const mobConfig = MOBS[map.mobType];
    if (!mobConfig) return;

    this.mobs = [];
    this.mobIdCounter = 0;

    // Spawn initial mobs
    for (let i = 0; i < map.mobCount; i++) {
      this.spawnMob(map.mobType);
    }
  }

  spawnMob(mobType) {
    const mobConfig = MOBS[mobType];
    if (!mobConfig) return null;

    // Random spawn position (avoid center where players spawn)
    let x, y;
    const padding = 100;
    const centerX = GAME_CONFIG.WIDTH / 2;
    const centerY = GAME_CONFIG.HEIGHT / 2;

    do {
      x = padding + Math.random() * (GAME_CONFIG.WIDTH - padding * 2);
      y = padding + Math.random() * (GAME_CONFIG.HEIGHT - padding * 2);
    } while (Math.abs(x - centerX) < 200 && Math.abs(y - centerY) < 150);

    const mob = {
      id: `mob_${this.mobIdCounter++}`,
      type: mobType,
      x,
      y,
      health: mobConfig.health,
      maxHealth: mobConfig.health,
      targetId: null,
      lastAttackTime: 0,
      velocityX: 0,
      velocityY: 0,
      alive: true,
    };

    this.mobs.push(mob);
    return mob;
  }

  damageMob(mob, damage, attackerId) {
    if (!mob.alive) return;

    mob.health -= damage;

    this.io.to(this.code).emit('mob:hit', {
      id: mob.id,
      damage,
      health: mob.health,
    });

    if (mob.health <= 0) {
      this.killMob(mob, attackerId);
    }
  }

  killMob(mob, killerId) {
    mob.alive = false;

    // Award points to killer
    const killer = this.players.get(killerId);
    if (killer) {
      killer.score += 5; // Mobs give 5 points
    }

    this.io.to(this.code).emit('mob:death', {
      id: mob.id,
      killerId,
    });

    // Remove mob from array
    const index = this.mobs.indexOf(mob);
    if (index > -1) {
      this.mobs.splice(index, 1);
    }

    // Schedule respawn with tracked timeout
    const map = MAPS[this.selectedMap];
    if (map && map.hasMobs) {
      const timeoutId = setTimeout(() => {
        // Remove from tracking when executed
        this.pendingTimeouts = this.pendingTimeouts.filter(id => id !== timeoutId);
        if (this.gameStarted && this.mobs.length < map.mobCount) {
          const newMob = this.spawnMob(map.mobType);
          if (newMob) {
            this.io.to(this.code).emit('mob:spawn', newMob);
          }
        }
      }, map.mobRespawnTime || 10000);
      this.pendingTimeouts.push(timeoutId);
    }
  }

  stopGame() {
    // Clear all pending timeouts to prevent memory leaks
    this.pendingTimeouts.forEach(id => clearTimeout(id));
    this.pendingTimeouts = [];

    if (this.gameLoop) {
      this.gameLoop.stop();
      this.gameLoop = null;
    }
    this.gameStarted = false;
  }

  getSpawnPoints() {
    // Use spawn points from selected map
    const map = MAPS[this.selectedMap];
    return map?.spawnPoints || [
      { x: 100, y: 100 },
      { x: 1180, y: 100 },
      { x: 100, y: 620 },
      { x: 1180, y: 620 },
      { x: 640, y: 100 },
      { x: 640, y: 620 },
      { x: 100, y: 360 },
      { x: 1180, y: 360 },
    ];
  }

  handlePlayerInput(playerId, input) {
    const player = this.players.get(playerId);
    if (player && player.alive) {
      player.input = input;

      // Handle ability (Shift key)
      if (input.ability) {
        this.handleAbility(player);
      }

      // Handle ultimate (Q key)
      if (input.ultimate) {
        this.handleUltimate(player);
      }

      // Handle dodge (Arrow keys)
      if (input.dodge && player.canDodge()) {
        this.handleDodge(player, input.dodgeDirection);
      }
    }
  }

  handleDodge(player, direction) {
    const dodgeResult = player.performDodge(direction);
    if (dodgeResult) {
      this.io.to(this.code).emit('player:dodge', {
        playerId: player.id,
        ...dodgeResult,
      });
    }
  }

  handleAbility(player) {
    // Messi: Dash/Dribble - fast dash through enemies
    if (player.classType === 'MESSI' && player.canDash()) {
      const dashResult = player.performDash();
      if (dashResult) {
        this.io.to(this.code).emit('player:dash', {
          playerId: player.id,
          ...dashResult,
        });

        // Deal damage to players in dash path
        for (const other of this.players.values()) {
          if (other.id === player.id || !other.alive) continue;

          // Simple line collision
          const dist = this.pointToLineDistance(
            other.x, other.y,
            dashResult.fromX, dashResult.fromY,
            dashResult.toX, dashResult.toY
          );

          if (dist < 30) {
            const result = other.takeDamage(20, player.id);
            this.io.to(this.code).emit('player:hit', {
              playerId: other.id,
              damage: 20,
              health: other.health,
            });
            if (result.died) {
              this.handlePlayerDeath(other, player.id);
            }
          }
        }
      }
    }
    // Milei: Chainsaw attack - high damage melee
    else if (player.classType === 'MILEI' && player.canChainsaw()) {
      const chainsawResult = player.performChainsaw();
      if (chainsawResult) {
        this.io.to(this.code).emit('player:chainsaw', {
          playerId: player.id,
          ...chainsawResult,
        });

        // Deal damage in cone area in front
        for (const other of this.players.values()) {
          if (other.id === player.id || !other.alive) continue;

          const dx = other.x - player.x;
          const dy = other.y - player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angleToOther = Math.atan2(dy, dx);
          const angleDiff = Math.abs(angleToOther - player.angle);

          // Within 70 pixels and 45 degree cone
          if (dist < 70 && angleDiff < Math.PI / 4) {
            const result = other.takeDamage(chainsawResult.damage, player.id);
            this.io.to(this.code).emit('player:hit', {
              playerId: other.id,
              damage: chainsawResult.damage,
              health: other.health,
            });
            if (result.died) {
              this.handlePlayerDeath(other, player.id);
            }
          }
        }
      }
    }
    // Trump: Build wall or turret
    else if (player.classType === 'TRUMP') {
      // Place turret or barrier (alternate)
      if (this.turrets.filter(t => t.ownerId === player.id).length < 2) {
        this.placeTurret(player);
      } else {
        this.placeBarrier(player);
      }
    }
    // Biden: Create ice cream heal zone
    else if (player.classType === 'BIDEN') {
      this.createHealZone(player);
    }
    // Putin: Deploy bear turret
    else if (player.classType === 'PUTIN') {
      this.placeBear(player);
    }
  }

  handleUltimate(player) {
    if (!player.canUseUltimate()) return;

    const stats = PLAYER_CLASSES[player.classType];

    if (player.activateUltimate()) {
      this.io.to(this.code).emit('player:ultimate', {
        playerId: player.id,
        type: stats.ultimate,
      });

      // Handle specific ultimates
      if (stats.ultimate === 'NUCLEAR_STRIKE') {
        this.nuclearStrike(player);
      } else if (stats.ultimate === 'EXECUTIVE_ORDER') {
        this.lifeSwap(player);
      } else if (stats.ultimate === 'DOLLARIZATION') {
        this.dollarization(player);
      }
    }
  }

  nuclearStrike(player) {
    // Putin's ultimate - rain missiles across the entire arena
    const startX = 50;
    const endX = GAME_CONFIG.WIDTH - 50;
    const y = player.y;

    for (let i = 0; i < 10; i++) {
      const timeoutId = setTimeout(() => {
        this.pendingTimeouts = this.pendingTimeouts.filter(id => id !== timeoutId);
        if (this.gameStarted) {
          const x = startX + (endX - startX) * (i / 9);
          this.createExplosion(x, y, 80, player.id, 50);
        }
      }, i * 200);
      this.pendingTimeouts.push(timeoutId);
    }
  }

  dollarization(player) {
    // Milei's ultimate - damage aura and double damage for duration
    const damage = 15;
    for (const other of this.players.values()) {
      if (other.id === player.id || !other.alive) continue;

      const dx = other.x - player.x;
      const dy = other.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 120) {
        const result = other.takeDamage(damage, player.id);
        this.io.to(this.code).emit('player:hit', {
          playerId: other.id,
          damage,
          health: other.health,
        });
        if (result.died) {
          this.handlePlayerDeath(other, player.id);
        }
      }
    }
  }

  lifeSwap(player) {
    // Find player with lowest health
    let lowestPlayer = null;
    let lowestHealth = Infinity;

    for (const other of this.players.values()) {
      if (other.id === player.id || !other.alive) continue;
      if (other.health < lowestHealth) {
        lowestHealth = other.health;
        lowestPlayer = other;
      }
    }

    if (lowestPlayer) {
      const tempHealth = player.health;
      player.health = lowestPlayer.health;
      lowestPlayer.health = tempHealth;

      this.io.to(this.code).emit('player:lifeSwap', {
        playerId: player.id,
        targetId: lowestPlayer.id,
        playerHealth: player.health,
        targetHealth: lowestPlayer.health,
      });
    }
  }

  createHealZone(player) {
    // Biden's ice cream heal zone
    const stats = PLAYER_CLASSES.BIDEN;
    const healZone = {
      id: `healzone_${Date.now()}`,
      ownerId: player.id,
      x: player.x,
      y: player.y,
      radius: 60,
      healRate: stats.healZoneRate,
      endTime: Date.now() + stats.healZoneDuration,
    };

    this.healZones.push(healZone);
    this.io.to(this.code).emit('healZone:spawn', healZone);
  }

  placeTurret(player) {
    // Trump's turret
    const stats = PLAYER_CLASSES.TRUMP;
    const turret = {
      id: `turret_${Date.now()}`,
      ownerId: player.id,
      x: player.x + Math.cos(player.angle) * 50,
      y: player.y + Math.sin(player.angle) * 50,
      health: 50,
      damage: stats.turretDamage,
      fireRate: stats.turretFireRate,
      lastFireTime: 0,
      endTime: Date.now() + stats.turretDuration,
    };

    this.turrets.push(turret);
    this.io.to(this.code).emit('turret:spawn', turret);
  }

  placeBarrier(player) {
    // Trump's wall
    const stats = PLAYER_CLASSES.TRUMP;
    const barrier = {
      id: `barrier_${Date.now()}`,
      ownerId: player.id,
      x: player.x + Math.cos(player.angle) * 40,
      y: player.y + Math.sin(player.angle) * 40,
      width: 80,
      height: 24,
      angle: player.angle,
      health: stats.wallHealth,
    };

    this.barriers.push(barrier);
    this.io.to(this.code).emit('barrier:spawn', barrier);
  }

  placeBear(player) {
    // Putin's bear turret
    const stats = PLAYER_CLASSES.PUTIN;
    const bear = {
      id: `bear_${Date.now()}`,
      ownerId: player.id,
      x: player.x + Math.cos(player.angle) * 50,
      y: player.y + Math.sin(player.angle) * 50,
      health: 80,
      damage: stats.bearDamage,
      fireRate: stats.bearFireRate,
      lastFireTime: 0,
      endTime: Date.now() + stats.bearDuration,
      isBear: true,
    };

    this.turrets.push(bear);
    this.io.to(this.code).emit('bear:spawn', bear);
  }

  handlePlayerShoot(playerId, data) {
    const player = this.players.get(playerId);
    if (!player || !player.alive) return;

    const now = Date.now();
    const fireRate = player.getEffectiveFireRate();
    const fireDelay = 1000 / fireRate;

    if (now - player.lastFireTime < fireDelay) return;

    player.lastFireTime = now;

    // Messi: Golden Ball ultimate - fire soccer balls in all directions
    if (player.ultimateActive && player.classType === 'MESSI') {
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        this.spawnBullet(player, angle);
      }
    }
    // Putin: Fires missiles (grenades)
    else if (player.classType === 'PUTIN') {
      this.spawnGrenade(player, data.angle);
    }
    // Milei: Fires 3 pesos in spread
    else if (player.classType === 'MILEI') {
      this.spawnBullet(player, data.angle - 0.1);
      this.spawnBullet(player, data.angle);
      this.spawnBullet(player, data.angle + 0.1);
    }
    // All others (Messi, Trump, Biden) fire single projectiles
    else {
      this.spawnBullet(player, data.angle);
    }
  }

  spawnBullet(player, angle) {
    const stats = PLAYER_CLASSES[player.classType];
    const damage = player.getEffectiveDamage(stats.damage);

    const bullet = {
      id: `bullet_${Date.now()}_${Math.random()}`,
      ownerId: player.id,
      classType: player.classType, // Include for projectile type on client
      x: player.x,
      y: player.y,
      vx: Math.cos(angle) * stats.projectileSpeed,
      vy: Math.sin(angle) * stats.projectileSpeed,
      damage: damage,
      lifeSteal: player.classType === 'BIDEN' ? PLAYER_CLASSES.BIDEN.lifeSteal : 0,
      ricochetCount: player.ricochetCount,
      createdAt: Date.now(),
    };
    this.bullets.push(bullet);

    this.io.to(this.code).emit('bullet:spawn', bullet);
  }

  spawnGrenade(player, angle) {
    // Putin fires missiles
    const stats = PLAYER_CLASSES.PUTIN;
    const damage = player.getEffectiveDamage(stats.damage);
    const speed = 300;

    const grenade = {
      id: `grenade_${Date.now()}_${Math.random()}`,
      ownerId: player.id,
      classType: player.classType, // Include for projectile type on client
      x: player.x,
      y: player.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage: damage,
      splashDamage: player.getEffectiveDamage(stats.splashDamage),
      explosionRadius: stats.explosionRadius,
      explodeAt: Date.now() + stats.fuseTime,
      createdAt: Date.now(),
    };
    this.grenades.push(grenade);

    this.io.to(this.code).emit('grenade:spawn', grenade);
  }

  spawnPowerup() {
    const types = Object.keys(POWERUPS);
    const type = types[Math.floor(Math.random() * types.length)];
    const powerup = {
      id: `powerup_${Date.now()}`,
      type,
      x: 100 + Math.random() * (GAME_CONFIG.WIDTH - 200),
      y: 100 + Math.random() * (GAME_CONFIG.HEIGHT - 200),
      createdAt: Date.now(),
    };

    this.powerups.push(powerup);
    this.io.to(this.code).emit('powerup:spawn', powerup);
  }

  createExplosion(x, y, radius, ownerId, damage) {
    // Deal damage to players in radius
    for (const player of this.players.values()) {
      if (!player.alive) continue;

      const dx = x - player.x;
      const dy = y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < radius) {
        const falloff = 1 - (distance / radius);
        const actualDamage = Math.floor(damage * falloff);

        if (actualDamage > 0) {
          const result = player.takeDamage(actualDamage, ownerId);

          this.io.to(this.code).emit('player:hit', {
            playerId: player.id,
            damage: actualDamage,
            health: player.health,
          });

          if (result.died) {
            this.handlePlayerDeath(player, ownerId);
          }
        }
      }
    }

    this.io.to(this.code).emit('explosion:create', { x, y, radius });
  }

  damageBarrel(barrel, damage, attackerId) {
    barrel.health -= damage;
    if (barrel.health <= 0) {
      this.explodeBarrel(barrel, attackerId);
    }
  }

  explodeBarrel(barrel, attackerId) {
    const index = this.barrels.indexOf(barrel);
    if (index > -1) {
      this.barrels.splice(index, 1);
    }

    this.createExplosion(barrel.x, barrel.y, HAZARDS.BARREL.explosionRadius, attackerId, HAZARDS.BARREL.explosionDamage);

    this.io.to(this.code).emit('barrel:explode', {
      id: barrel.id,
      x: barrel.x,
      y: barrel.y,
    });

    // Chain reaction - check nearby barrels
    for (const other of this.barrels) {
      const dx = barrel.x - other.x;
      const dy = barrel.y - other.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < HAZARDS.BARREL.explosionRadius) {
        const timeoutId = setTimeout(() => {
          this.pendingTimeouts = this.pendingTimeouts.filter(id => id !== timeoutId);
          if (this.gameStarted) {
            this.damageBarrel(other, 100, attackerId);
          }
        }, 100);
        this.pendingTimeouts.push(timeoutId);
      }
    }
  }

  getGameState() {
    const players = {};
    for (const player of this.players.values()) {
      players[player.id] = player.getState();
    }

    return {
      players,
      bullets: this.bullets.map((b) => ({
        id: b.id,
        x: b.x,
        y: b.y,
      })),
      grenades: this.grenades.map((g) => ({
        id: g.id,
        x: g.x,
        y: g.y,
      })),
      powerups: this.powerups,
      turrets: this.turrets,
      barriers: this.barriers,
      barrels: this.barrels,
      healZones: this.healZones,
      mobs: this.mobs.filter(m => m.alive).map(m => ({
        id: m.id,
        type: m.type,
        x: m.x,
        y: m.y,
        health: m.health,
        maxHealth: m.maxHealth,
      })),
    };
  }

  broadcastState() {
    this.io.to(this.code).emit('game:state', this.getGameState());
  }

  handlePlayerDeath(player, killerId) {
    player.alive = false;

    // Award kill
    const killer = this.players.get(killerId);
    if (killer && killer.id !== player.id) {
      killer.addKill();

      // Check kill streak announcements
      const streak = KILL_STREAKS[killer.killStreak];
      if (streak) {
        this.io.to(this.code).emit('killStreak', {
          playerId: killer.id,
          streak: killer.killStreak,
          name: streak.name,
          color: streak.color,
        });
      }
    }

    this.io.to(this.code).emit('player:death', {
      playerId: player.id,
      killerId,
      scores: this.getScores(),
    });

    // Respawn after delay with tracked timeout
    const timeoutId = setTimeout(() => {
      this.pendingTimeouts = this.pendingTimeouts.filter(id => id !== timeoutId);
      if (this.gameStarted && this.players.has(player.id)) {
        this.respawnPlayer(player);
      }
    }, 3000);
    this.pendingTimeouts.push(timeoutId);
  }

  respawnPlayer(player) {
    const spawnPoints = this.getSpawnPoints();
    const spawn = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
    player.spawn(spawn.x, spawn.y);

    this.io.to(this.code).emit('player:respawn', {
      playerId: player.id,
      x: player.x,
      y: player.y,
      health: player.health,
    });
  }

  getScores() {
    const scores = {};
    for (const player of this.players.values()) {
      scores[player.id] = {
        name: player.name,
        score: player.score,
        killStreak: player.killStreak,
      };
    }
    return scores;
  }

  pointToLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
