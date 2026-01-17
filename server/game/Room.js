import { Player } from './Player.js';
import { GameLoop } from './GameLoop.js';
import { GAME_CONFIG, PLAYER_CLASSES, POWERUPS, HAZARDS, KILL_STREAKS, POWERUP_SPAWN_INTERVAL, GAME_MODES, WAVE_CONFIG, PERKS, MAP_MODIFIERS, ARENA_CONFIG, INFINITE_HORDE_CONFIG, TEAM_ABILITIES } from '../../shared/constants.js';
import { MAPS, MOBS, BOSS_MOBS, MAP_HAZARDS } from '../../shared/maps.js';

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

    // Arena mode timer
    this.gameStartTime = 0;
    this.gameEnded = false;

    // Wave Survival Mode state
    this.gameMode = 'ARENA';
    this.waveNumber = 0;
    this.waveState = 'idle'; // 'idle', 'active', 'intermission', 'gameover'
    this.waveStartTime = 0;
    this.waveMobsToSpawn = 0;
    this.waveMobsSpawned = 0;
    this.lastWaveMobSpawn = 0;
    this.activeModifiers = [];
    this.pendingPerkOffers = new Map();
    this.perkSelections = new Map();
    this.waveStats = { mobsKilled: 0, totalMobsKilled: 0 };

    // Boss state for Infinite Horde mode
    this.activeBoss = null;
    this.bossesKilled = 0;

    // Dynamic hazards state
    this.dynamicHazards = [];
    this.lastTrafficSpawn = 0;
    this.lastEruptionTime = 0;
    this.lastRockFallTime = 0;
    this.lastLionSpawn = 0;
    this.lastSpikeRise = 0;
    this.activeCars = [];
    this.activeLavaPools = [];
    this.lions = [];

    // Team abilities - combo damage tracking
    this.recentDamageToMobs = new Map();
    this.recentDamageToPlayers = new Map();

    // Kill cam - track last kill for final kill replay
    this.lastKill = null;
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

  setGameMode(mode) {
    if (GAME_MODES[mode]) {
      this.gameMode = mode;
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
    this.gameStartTime = Date.now();
    this.gameEnded = false;

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

    // Wave Survival Mode initialization
    if (this.gameMode === 'WAVE_SURVIVAL') {
      this.rollMapModifiers(2);
      this.waveNumber = 0;
      this.waveState = 'idle';
      this.waveStats = { mobsKilled: 0, totalMobsKilled: 0 };
      // Don't spawn mobs normally - wave system handles it
      this.mobs = [];
    }

    // Infinite Horde Mode initialization
    if (this.gameMode === 'INFINITE_HORDE') {
      this.rollMapModifiers(2);
      this.waveNumber = 0;
      this.waveState = 'idle';
      this.waveStats = { mobsKilled: 0, totalMobsKilled: 0 };
      this.activeBoss = null;
      this.bossesKilled = 0;
      this.mobs = [];
    }

    // Start game loop
    this.gameLoop = new GameLoop(this);
    this.gameLoop.start();

    console.log(`Starting game in room ${this.code} with map: ${this.selectedMap}, mode: ${this.gameMode}`);
    this.io.to(this.code).emit('game:start', {
      players: this.getGameState().players,
      hazards: this.hazards,
      barrels: this.barrels,
      mapId: this.selectedMap,
      gameMode: this.gameMode,
      modifiers: this.activeModifiers,
      gameDuration: this.gameMode === 'ARENA' ? ARENA_CONFIG.GAME_DURATION_MS : null,
    });

    // Start first wave after a short delay
    if (this.gameMode === 'WAVE_SURVIVAL' || this.gameMode === 'INFINITE_HORDE') {
      const timeoutId = setTimeout(() => {
        this.pendingTimeouts = this.pendingTimeouts.filter(id => id !== timeoutId);
        if (this.gameStarted) {
          this.startNextWave();
        }
      }, 3000);
      this.pendingTimeouts.push(timeoutId);
    }
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
      canCharge: mobConfig.canCharge || false,
      lastChargeTime: 0,
      isCharging: false,
    };

    this.mobs.push(mob);
    return mob;
  }

  damageMob(mob, damage, attackerId) {
    if (!mob.alive) return;

    const now = Date.now();
    let finalDamage = damage;
    let comboCount = 0;

    // Track combo damage in cooperative modes
    if ((this.gameMode === 'WAVE_SURVIVAL' || this.gameMode === 'INFINITE_HORDE') && TEAM_ABILITIES.COMBO_DAMAGE.enabled) {
      const comboWindow = TEAM_ABILITIES.COMBO_DAMAGE.windowMs;

      // Get or create damage tracking for this mob
      if (!this.recentDamageToMobs.has(mob.id)) {
        this.recentDamageToMobs.set(mob.id, []);
      }

      const recentHits = this.recentDamageToMobs.get(mob.id);

      // Clean old hits
      const validHits = recentHits.filter(hit => now - hit.time < comboWindow);

      // Add current hit
      if (attackerId) {
        validHits.push({ time: now, attackerId });
      }

      this.recentDamageToMobs.set(mob.id, validHits);

      // Count unique attackers
      const uniqueAttackers = new Set(validHits.map(h => h.attackerId));
      comboCount = uniqueAttackers.size;

      // Apply combo bonus
      if (comboCount >= 2) {
        const bonus = TEAM_ABILITIES.COMBO_DAMAGE.bonuses[Math.min(comboCount, 4)] || 0;
        finalDamage = Math.floor(damage * (1 + bonus));

        // Emit combo hit event
        this.io.to(this.code).emit('combo:hit', {
          mobId: mob.id,
          comboCount,
          bonusDamage: finalDamage - damage,
          x: mob.x,
          y: mob.y,
        });

        // Apply stun at 4 players
        if (comboCount >= 4 && TEAM_ABILITIES.COMBO_DAMAGE.stunAt4 && !mob.stunned) {
          mob.stunned = true;
          mob.stunnedUntil = now + TEAM_ABILITIES.COMBO_DAMAGE.stunDuration;
        }
      }
    }

    mob.health -= finalDamage;

    this.io.to(this.code).emit('mob:hit', {
      id: mob.id,
      damage: finalDamage,
      health: mob.health,
      comboCount,
    });

    if (mob.health <= 0) {
      this.recentDamageToMobs.delete(mob.id);
      this.killMob(mob, attackerId);
    }
  }

  killMob(mob, killerId) {
    mob.alive = false;

    // Check if this is a boss death
    const isBoss = mob.isBoss;

    // Award points to killer
    const killer = this.players.get(killerId);
    if (killer) {
      const points = isBoss ? 50 : 5; // Bosses give 50 points
      killer.score += points;

      const ultCharge = isBoss ? (mob.ultimateCharge || 25) : 10;
      killer.addUltimateCharge(ultCharge);

      // Handle explosive kills perk
      if (killer.perks && killer.perks.EXPLOSIVE_KILLS) {
        const perk = PERKS.EXPLOSIVE_KILLS;
        this.createExplosion(mob.x, mob.y, perk.effect.explosionRadius, killerId, perk.effect.explosionDamage);
      }
    }

    // Handle boss death rewards
    if (isBoss) {
      this.activeBoss = null;
      this.bossesKilled++;

      // Spawn guaranteed powerup on boss death
      if (mob.dropsPowerup) {
        const powerupTypes = Object.keys(POWERUPS);
        const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
        const powerup = {
          id: `powerup_boss_${Date.now()}`,
          type,
          x: mob.x,
          y: mob.y,
          createdAt: Date.now(),
        };
        this.powerups.push(powerup);
        this.io.to(this.code).emit('powerup:spawn', powerup);
      }

      // Give all alive players ultimate charge on boss kill
      for (const player of this.players.values()) {
        if (player.alive && player.id !== killerId) {
          player.addUltimateCharge(10);
        }
      }

      this.io.to(this.code).emit('boss:death', {
        id: mob.id,
        killerId,
        bossType: mob.type,
        bossesKilled: this.bossesKilled,
      });
    }

    this.io.to(this.code).emit('mob:death', {
      id: mob.id,
      killerId,
      isBoss,
    });

    // Remove mob from array
    const index = this.mobs.indexOf(mob);
    if (index > -1) {
      this.mobs.splice(index, 1);
    }

    // Wave Survival Mode - check wave completion
    if (this.gameMode === 'WAVE_SURVIVAL') {
      this.waveStats.mobsKilled++;
      this.waveStats.totalMobsKilled++;
      this.checkWaveCompletion();
      return; // No respawn in wave mode
    }

    // Infinite Horde Mode - check wave completion
    if (this.gameMode === 'INFINITE_HORDE') {
      this.waveStats.mobsKilled++;
      this.waveStats.totalMobsKilled++;
      this.checkWaveCompletion();
      return; // No respawn in horde mode
    }

    // Arena Mode - Schedule respawn with tracked timeout
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
      lifeSteal: player.getEffectiveLifeSteal(),
      ricochetCount: player.ricochetCount,
      sizeMultiplier: player.getEffectiveProjectileSizeMultiplier(),
      createdAt: Date.now(),
    };
    this.bullets.push(bullet);

    this.io.to(this.code).emit('bullet:spawn', bullet);
  }

  spawnGrenade(player, angle) {
    // Putin fires missiles
    const stats = PLAYER_CLASSES.PUTIN;
    const damage = player.getEffectiveDamage(stats.damage);
    const speed = 450;

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

    // Give ultimate charge to attacker
    const attacker = this.players.get(attackerId);
    if (attacker) {
      attacker.addUltimateCharge(5);
    }

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
        isBoss: m.isBoss,
        isElite: m.isElite,
        scale: m.scale,
        isCharging: m.isCharging,
      })),
      timeRemaining: this.getTimeRemaining(),
      activeBoss: this.activeBoss ? {
        id: this.activeBoss.id,
        type: this.activeBoss.type,
        health: this.activeBoss.health,
        maxHealth: this.activeBoss.maxHealth,
      } : null,
      isBossWave: this.isBossWave ? this.isBossWave() : false,
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

      // Track last kill for final kill replay
      this.lastKill = {
        killerId: killer.id,
        killerName: killer.name,
        killerClass: killer.classType,
        killerX: killer.x,
        killerY: killer.y,
        victimId: player.id,
        victimName: player.name,
        victimClass: player.classType,
        victimX: player.x,
        victimY: player.y,
        timestamp: Date.now(),
      };

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

  // ==========================================
  // WAVE SURVIVAL MODE METHODS
  // ==========================================

  rollMapModifiers(count = 2) {
    const allModifiers = Object.keys(MAP_MODIFIERS);
    const selected = [];

    while (selected.length < count && allModifiers.length > 0) {
      const idx = Math.floor(Math.random() * allModifiers.length);
      selected.push(allModifiers.splice(idx, 1)[0]);
    }

    this.activeModifiers = selected;
    console.log(`Rolled modifiers for room ${this.code}:`, this.activeModifiers);
    return selected;
  }

  getEffectiveModifier(effectKey) {
    let value = 1.0;

    for (const modId of this.activeModifiers) {
      const mod = MAP_MODIFIERS[modId];
      if (mod && mod.effect[effectKey] !== undefined) {
        if (typeof mod.effect[effectKey] === 'number') {
          value *= mod.effect[effectKey];
        }
      }
    }

    return value;
  }

  hasModifier(modifierId) {
    return this.activeModifiers.includes(modifierId);
  }

  startNextWave() {
    // Use Infinite Horde specific logic if in that mode
    if (this.gameMode === 'INFINITE_HORDE') {
      this.startInfiniteHordeWave();
      return;
    }

    this.waveNumber++;
    this.waveState = 'active';
    this.waveStartTime = Date.now();
    this.waveStats.mobsKilled = 0;

    // Calculate mobs for this wave
    const baseMobs = WAVE_CONFIG.BASE_MOB_COUNT;
    const increment = WAVE_CONFIG.MOB_INCREMENT_PER_WAVE;
    this.waveMobsToSpawn = baseMobs + (this.waveNumber - 1) * increment;
    this.waveMobsSpawned = 0;
    this.lastWaveMobSpawn = 0;

    // Cap max mobs
    this.waveMobsToSpawn = Math.min(this.waveMobsToSpawn, WAVE_CONFIG.MAX_MOBS_ALIVE + 10);

    // Apply shield perks at wave start
    for (const player of this.players.values()) {
      if (player.perks && player.perks.SHIELD_ON_WAVE) {
        const shieldsToAdd = PERKS.SHIELD_ON_WAVE.effect.waveShieldHits * player.perks.SHIELD_ON_WAVE;
        player.shieldHits = Math.min((player.shieldHits || 0) + shieldsToAdd, 10);
      }
    }

    console.log(`Wave ${this.waveNumber} starting in room ${this.code}: ${this.waveMobsToSpawn} mobs`);

    this.io.to(this.code).emit('wave:start', {
      waveNumber: this.waveNumber,
      mobCount: this.waveMobsToSpawn,
      modifiers: this.activeModifiers,
    });
  }

  spawnWaveMob() {
    // Use Infinite Horde specific logic if in that mode
    if (this.gameMode === 'INFINITE_HORDE') {
      return this.spawnInfiniteHordeMob();
    }

    if (this.waveMobsSpawned >= this.waveMobsToSpawn) return null;
    if (this.mobs.length >= WAVE_CONFIG.MAX_MOBS_ALIVE) return null;

    // Select mob type based on wave
    const mobTypes = Object.keys(MOBS);
    let mobType;

    if (this.waveNumber <= 2) {
      // Early waves: weak mobs
      mobType = mobTypes.filter(t => MOBS[t].health <= 40)[0] || mobTypes[0];
    } else if (this.waveNumber <= 5) {
      // Mid waves: random weak/medium
      const available = mobTypes.filter(t => MOBS[t].health <= 60);
      mobType = available[Math.floor(Math.random() * available.length)] || mobTypes[0];
    } else {
      // Late waves: any mob including strong ones
      mobType = mobTypes[Math.floor(Math.random() * mobTypes.length)];
    }

    // Check for elite spawn
    let isElite = false;
    const eliteChance = WAVE_CONFIG.ELITE_CHANCE_BASE +
      (this.waveNumber - 1) * WAVE_CONFIG.ELITE_CHANCE_INCREMENT +
      (this.hasModifier('ELITE_SWARM') ? MAP_MODIFIERS.ELITE_SWARM.effect.eliteChanceBonus : 0);

    if (Math.random() < eliteChance) {
      isElite = true;
    }

    const mob = this.spawnMob(mobType);
    if (mob) {
      // Apply wave scaling
      const healthScale = Math.pow(WAVE_CONFIG.HEALTH_SCALING, this.waveNumber - 1);
      mob.health = Math.floor(mob.health * healthScale);
      mob.maxHealth = mob.health;

      // Apply elite bonus
      if (isElite) {
        mob.health = Math.floor(mob.health * WAVE_CONFIG.ELITE_HEALTH_MULTIPLIER);
        mob.maxHealth = mob.health;
        mob.isElite = true;
      }

      // Apply fast mobs modifier
      if (this.hasModifier('FAST_MOBS')) {
        mob.speedMultiplier = MAP_MODIFIERS.FAST_MOBS.effect.mobSpeedMultiplier;
      }

      this.waveMobsSpawned++;
      this.io.to(this.code).emit('mob:spawn', mob);
    }

    return mob;
  }

  checkWaveCompletion() {
    // Wave complete when all mobs spawned and killed
    if (this.waveState !== 'active') return;

    const allSpawned = this.waveMobsSpawned >= this.waveMobsToSpawn;
    const allKilled = this.mobs.length === 0;

    if (allSpawned && allKilled) {
      this.onWaveComplete();
    }
  }

  onWaveComplete() {
    this.waveState = 'intermission';

    console.log(`Wave ${this.waveNumber} complete in room ${this.code}`);

    this.io.to(this.code).emit('wave:complete', {
      waveNumber: this.waveNumber,
      mobsKilled: this.waveStats.mobsKilled,
      totalMobsKilled: this.waveStats.totalMobsKilled,
    });

    // Offer perks
    this.offerPerks();
  }

  offerPerks() {
    this.pendingPerkOffers.clear();
    this.perkSelections.clear();

    const allPerks = Object.keys(PERKS);

    for (const player of this.players.values()) {
      // Roll 3 random perks (avoid maxed perks)
      const availablePerks = allPerks.filter(perkId => {
        const perk = PERKS[perkId];
        const currentStacks = player.perks?.[perkId] || 0;
        return currentStacks < perk.maxStacks;
      });

      const offers = [];
      const tempAvailable = [...availablePerks];

      while (offers.length < 3 && tempAvailable.length > 0) {
        const idx = Math.floor(Math.random() * tempAvailable.length);
        offers.push(tempAvailable.splice(idx, 1)[0]);
      }

      this.pendingPerkOffers.set(player.id, offers);

      this.io.to(player.id).emit('wave:perkOffer', {
        perks: offers.map(id => ({
          id,
          ...PERKS[id],
          currentStacks: player.perks?.[id] || 0,
        })),
        timeRemaining: WAVE_CONFIG.PERK_SELECTION_TIME_MS,
      });
    }

    // Auto-select first perk after timeout
    const timeoutId = setTimeout(() => {
      this.pendingTimeouts = this.pendingTimeouts.filter(id => id !== timeoutId);
      if (this.gameStarted && this.waveState === 'intermission') {
        this.autoSelectPerks();
      }
    }, WAVE_CONFIG.PERK_SELECTION_TIME_MS);
    this.pendingTimeouts.push(timeoutId);
  }

  selectPerk(playerId, perkId) {
    const player = this.players.get(playerId);
    const offers = this.pendingPerkOffers.get(playerId);

    if (!player || !offers || !offers.includes(perkId)) return false;
    if (this.perkSelections.has(playerId)) return false; // Already selected

    player.addPerk(perkId);
    this.perkSelections.set(playerId, perkId);

    this.io.to(this.code).emit('wave:perkSelected', {
      playerId,
      perkId,
      playerPerks: player.perks,
    });

    // Check if all players selected
    if (this.perkSelections.size >= this.players.size) {
      this.startNextWave();
    }

    return true;
  }

  autoSelectPerks() {
    // Auto-select for players who haven't chosen
    for (const player of this.players.values()) {
      if (!this.perkSelections.has(player.id)) {
        const offers = this.pendingPerkOffers.get(player.id);
        if (offers && offers.length > 0) {
          this.selectPerk(player.id, offers[0]);
        }
      }
    }
  }

  checkAllPlayersDead() {
    for (const player of this.players.values()) {
      if (player.alive) return false;
    }
    return true;
  }

  onWaveSurvivalGameOver() {
    if (this.waveState === 'gameover') return;

    this.waveState = 'gameover';

    console.log(`Wave Survival game over in room ${this.code} at wave ${this.waveNumber}`);

    this.io.to(this.code).emit('wave:gameOver', {
      finalWave: this.waveNumber,
      totalMobsKilled: this.waveStats.totalMobsKilled,
      scores: this.getScores(),
      finalKill: this.lastKill,
    });
  }

  getWaveState() {
    return {
      gameMode: this.gameMode,
      waveNumber: this.waveNumber,
      waveState: this.waveState,
      mobsRemaining: this.mobs.length,
      mobsToSpawn: this.waveMobsToSpawn - this.waveMobsSpawned,
      modifiers: this.activeModifiers,
      isBossWave: this.isBossWave(),
      activeBoss: this.activeBoss,
      bossesKilled: this.bossesKilled,
    };
  }

  // ==========================================
  // INFINITE HORDE MODE METHODS
  // ==========================================

  isBossWave() {
    if (this.gameMode !== 'INFINITE_HORDE') return false;
    return this.waveNumber > 0 && this.waveNumber % INFINITE_HORDE_CONFIG.BOSS_EVERY_N_WAVES === 0;
  }

  spawnBoss() {
    const bossTypes = Object.keys(BOSS_MOBS);
    const bossType = bossTypes[Math.floor(Math.random() * bossTypes.length)];
    const bossConfig = BOSS_MOBS[bossType];

    // Spawn at random edge of arena
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    switch (edge) {
      case 0: x = 100; y = GAME_CONFIG.HEIGHT / 2; break; // Left
      case 1: x = GAME_CONFIG.WIDTH - 100; y = GAME_CONFIG.HEIGHT / 2; break; // Right
      case 2: x = GAME_CONFIG.WIDTH / 2; y = 100; break; // Top
      case 3: x = GAME_CONFIG.WIDTH / 2; y = GAME_CONFIG.HEIGHT - 100; break; // Bottom
    }

    // Scale boss health based on wave number
    const healthScale = Math.pow(INFINITE_HORDE_CONFIG.HEALTH_SCALING, Math.floor(this.waveNumber / 3));
    const scaledHealth = Math.floor(bossConfig.health * healthScale);

    const boss = {
      id: `boss_${Date.now()}`,
      type: bossType,
      x,
      y,
      health: scaledHealth,
      maxHealth: scaledHealth,
      targetId: null,
      lastAttackTime: 0,
      velocityX: 0,
      velocityY: 0,
      alive: true,
      isBoss: true,
      dropsPowerup: bossConfig.dropsPowerup,
      ultimateCharge: bossConfig.ultimateCharge,
      scale: bossConfig.scale,
      canCharge: bossConfig.canCharge,
      lastChargeTime: 0,
      isFlying: bossConfig.isFlying,
      projectileSpeed: bossConfig.projectileSpeed,
    };

    this.mobs.push(boss);
    this.activeBoss = boss;
    this.waveMobsSpawned++;

    this.io.to(this.code).emit('boss:spawn', {
      ...boss,
      bossConfig: {
        name: bossConfig.name,
        nameEn: bossConfig.nameEn,
        color: bossConfig.color,
        scale: bossConfig.scale,
      },
    });

    return boss;
  }

  startInfiniteHordeWave() {
    this.waveNumber++;
    this.waveState = 'active';
    this.waveStartTime = Date.now();
    this.waveStats.mobsKilled = 0;

    const isBossWave = this.isBossWave();

    if (isBossWave) {
      // Boss wave - only spawn boss + a few minions
      this.waveMobsToSpawn = 1 + Math.floor(this.waveNumber / 5); // Boss + some minions
    } else {
      // Normal wave calculation
      const baseMobs = INFINITE_HORDE_CONFIG.BASE_MOB_COUNT;
      const increment = INFINITE_HORDE_CONFIG.MOB_INCREMENT_PER_WAVE;
      this.waveMobsToSpawn = baseMobs + (this.waveNumber - 1) * increment;
      this.waveMobsToSpawn = Math.min(this.waveMobsToSpawn, INFINITE_HORDE_CONFIG.MAX_SIMULTANEOUS_MOBS);
    }

    this.waveMobsSpawned = 0;
    this.lastWaveMobSpawn = 0;

    // Apply shield perks at wave start
    for (const player of this.players.values()) {
      if (player.perks && player.perks.SHIELD_ON_WAVE) {
        const shieldsToAdd = PERKS.SHIELD_ON_WAVE.effect.waveShieldHits * player.perks.SHIELD_ON_WAVE;
        player.shieldHits = Math.min((player.shieldHits || 0) + shieldsToAdd, 10);
      }
    }

    console.log(`Infinite Horde Wave ${this.waveNumber} starting in room ${this.code}: ${this.waveMobsToSpawn} mobs, boss wave: ${isBossWave}`);

    this.io.to(this.code).emit('wave:start', {
      waveNumber: this.waveNumber,
      mobCount: this.waveMobsToSpawn,
      modifiers: this.activeModifiers,
      isBossWave,
      gameMode: 'INFINITE_HORDE',
    });

    // Spawn boss immediately if boss wave
    if (isBossWave) {
      const timeoutId = setTimeout(() => {
        this.pendingTimeouts = this.pendingTimeouts.filter(id => id !== timeoutId);
        if (this.gameStarted && this.waveState === 'active') {
          this.spawnBoss();
        }
      }, 1000);
      this.pendingTimeouts.push(timeoutId);
    }
  }

  spawnInfiniteHordeMob() {
    if (this.waveMobsSpawned >= this.waveMobsToSpawn) return null;
    if (this.mobs.length >= INFINITE_HORDE_CONFIG.MAX_SIMULTANEOUS_MOBS) return null;

    // Don't spawn regular mobs if boss is still alive
    if (this.isBossWave() && this.activeBoss && this.waveMobsSpawned > 0) {
      return null;
    }

    // Select mob type based on wave
    const mobTypes = Object.keys(MOBS);
    let mobType;

    if (this.waveNumber <= 3) {
      mobType = mobTypes.filter(t => MOBS[t].health <= 40)[0] || mobTypes[0];
    } else if (this.waveNumber <= 8) {
      const available = mobTypes.filter(t => MOBS[t].health <= 60);
      mobType = available[Math.floor(Math.random() * available.length)] || mobTypes[0];
    } else {
      mobType = mobTypes[Math.floor(Math.random() * mobTypes.length)];
    }

    // Check for elite spawn
    let isElite = false;
    const eliteChance = INFINITE_HORDE_CONFIG.ELITE_CHANCE_BASE +
      (this.waveNumber - 1) * INFINITE_HORDE_CONFIG.ELITE_CHANCE_INCREMENT +
      (this.hasModifier('ELITE_SWARM') ? MAP_MODIFIERS.ELITE_SWARM.effect.eliteChanceBonus : 0);

    if (Math.random() < eliteChance) {
      isElite = true;
    }

    const mob = this.spawnMob(mobType);
    if (mob) {
      // Apply wave scaling
      const healthScale = Math.pow(INFINITE_HORDE_CONFIG.HEALTH_SCALING, this.waveNumber - 1);
      mob.health = Math.floor(mob.health * healthScale);
      mob.maxHealth = mob.health;

      // Apply elite bonus
      if (isElite) {
        mob.health = Math.floor(mob.health * WAVE_CONFIG.ELITE_HEALTH_MULTIPLIER);
        mob.maxHealth = mob.health;
        mob.isElite = true;
      }

      // Apply fast mobs modifier
      if (this.hasModifier('FAST_MOBS')) {
        mob.speedMultiplier = MAP_MODIFIERS.FAST_MOBS.effect.mobSpeedMultiplier;
      }

      this.waveMobsSpawned++;
      this.io.to(this.code).emit('mob:spawn', mob);
    }

    return mob;
  }

  // ==========================================
  // ARENA MODE TIMER
  // ==========================================

  getTimeRemaining() {
    if (this.gameMode !== 'ARENA' || !this.gameStartTime) return null;
    const elapsed = Date.now() - this.gameStartTime;
    return Math.max(0, ARENA_CONFIG.GAME_DURATION_MS - elapsed);
  }

  checkArenaTimeLimit() {
    if (this.gameMode !== 'ARENA') return;
    if (this.gameEnded) return;

    const timeRemaining = this.getTimeRemaining();
    if (timeRemaining !== null && timeRemaining <= 0) {
      this.endArenaGame();
    }
  }

  endArenaGame() {
    if (this.gameEnded) return;
    this.gameEnded = true;

    console.log(`Arena game ended in room ${this.code}`);

    // Find winner (highest score)
    const scores = this.getScores();
    scores.sort((a, b) => b.score - a.score);
    const winner = scores.length > 0 ? scores[0] : null;

    this.io.to(this.code).emit('game:end', {
      reason: 'time',
      winner: winner,
      scores: scores,
      finalKill: this.lastKill,
    });

    // Stop the game loop
    if (this.gameLoop) {
      this.gameLoop.stop();
    }
  }

  resetForNewGame() {
    // Stop existing game loop
    if (this.gameLoop) {
      this.gameLoop.stop();
      this.gameLoop = null;
    }

    // Clear pending timeouts
    this.pendingTimeouts.forEach(id => clearTimeout(id));
    this.pendingTimeouts = [];

    // Reset game state
    this.bullets = [];
    this.grenades = [];
    this.powerups = [];
    this.turrets = [];
    this.barriers = [];
    this.barrels = [];
    this.healZones = [];
    this.hazards = [];
    this.mobs = [];
    this.gameStarted = false;
    this.gameEnded = false;
    this.gameStartTime = 0;
    this.lastPowerupSpawn = 0;
    this.lastMobSpawn = 0;

    // Reset wave survival state
    this.waveNumber = 0;
    this.waveState = 'idle';
    this.waveStartTime = 0;
    this.waveMobsToSpawn = 0;
    this.waveMobsSpawned = 0;
    this.lastWaveMobSpawn = 0;
    this.pendingPerkOffers.clear();
    this.perkSelections.clear();
    this.waveStats = { mobsKilled: 0, totalMobsKilled: 0 };

    // Reset boss state
    this.activeBoss = null;
    this.bossesKilled = 0;

    // Reset kill cam state
    this.lastKill = null;

    // Reset players (keep them in the room but reset stats)
    for (const player of this.players.values()) {
      player.score = 0;
      player.kills = 0;
      player.deaths = 0;
      player.killStreak = 0;
      player.perks = {};
      player.activePowerups = {};
      player.shieldHits = 0;
      player.ricochetCount = 0;
    }

    console.log(`Room ${this.code} reset for new game`);
  }
}
