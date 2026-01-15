import { GAME_CONFIG, PLAYER_CLASSES, HAZARDS, POWERUP_SPAWN_INTERVAL } from '../../shared/constants.js';
import { MOBS } from '../../shared/maps.js';

export class GameLoop {
  constructor(room) {
    this.room = room;
    this.lastUpdate = Date.now();
    this.tickInterval = null;
    this.broadcastInterval = null;
    this.lastPowerupSpawn = Date.now();
  }

  start() {
    const physicsInterval = 1000 / GAME_CONFIG.PHYSICS_RATE;
    this.tickInterval = setInterval(() => this.update(), physicsInterval);

    const broadcastInterval = 1000 / GAME_CONFIG.TICK_RATE;
    this.broadcastInterval = setInterval(
      () => this.room.broadcastState(),
      broadcastInterval
    );
  }

  stop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }
  }

  update() {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdate) / 1000;
    this.lastUpdate = now;

    // Update players
    for (const player of this.room.players.values()) {
      player.update(deltaTime);
    }

    // Update bullets
    this.updateBullets(deltaTime);

    // Update grenades
    this.updateGrenades(deltaTime);

    // Update turrets
    this.updateTurrets(deltaTime);

    // Update heal zones
    this.updateHealZones(deltaTime);

    // Update hazards (damage players in lava, etc)
    this.updateHazards(deltaTime);

    // Update mobs (AI movement and attacks)
    this.updateMobs(deltaTime);

    // Check powerup collisions
    this.checkPowerupCollisions();

    // Spawn powerups
    if (now - this.lastPowerupSpawn > POWERUP_SPAWN_INTERVAL) {
      this.room.spawnPowerup();
      this.lastPowerupSpawn = now;
    }
  }

  updateBullets(deltaTime) {
    const bulletsToRemove = new Set(); // Use Set to avoid duplicates and O(1) lookup

    for (let i = 0; i < this.room.bullets.length; i++) {
      const bullet = this.room.bullets[i];

      // Move bullet
      bullet.x += bullet.vx * deltaTime;
      bullet.y += bullet.vy * deltaTime;

      // Check bounds - with ricochet
      let hitWall = false;
      if (bullet.x < 0 || bullet.x > GAME_CONFIG.WIDTH) {
        if (bullet.ricochetCount > 0) {
          bullet.vx = -bullet.vx;
          bullet.x = Math.max(0, Math.min(GAME_CONFIG.WIDTH, bullet.x));
          bullet.ricochetCount--;
          this.room.io.to(this.room.code).emit('bullet:ricochet', { id: bullet.id, x: bullet.x, y: bullet.y });
        } else {
          hitWall = true;
        }
      }
      if (bullet.y < 0 || bullet.y > GAME_CONFIG.HEIGHT) {
        if (bullet.ricochetCount > 0) {
          bullet.vy = -bullet.vy;
          bullet.y = Math.max(0, Math.min(GAME_CONFIG.HEIGHT, bullet.y));
          bullet.ricochetCount--;
          this.room.io.to(this.room.code).emit('bullet:ricochet', { id: bullet.id, x: bullet.x, y: bullet.y });
        } else {
          hitWall = true;
        }
      }

      if (hitWall) {
        bulletsToRemove.add(i);
        continue;
      }

      // Check lifetime
      if (Date.now() - bullet.createdAt > 3000) {
        bulletsToRemove.add(i);
        continue;
      }

      // Check barrel collision
      for (const barrel of this.room.barrels) {
        const dx = bullet.x - barrel.x;
        const dy = bullet.y - barrel.y;
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
          this.room.damageBarrel(barrel, bullet.damage, bullet.ownerId);
          bulletsToRemove.add(i);
          break;
        }
      }

      // Check barrier collision
      for (const barrier of this.room.barriers) {
        if (this.pointInRect(bullet.x, bullet.y, barrier.x - barrier.width/2, barrier.y - barrier.height/2, barrier.width, barrier.height)) {
          barrier.health -= bullet.damage;
          if (barrier.health <= 0) {
            const idx = this.room.barriers.indexOf(barrier);
            if (idx > -1) this.room.barriers.splice(idx, 1);
            this.room.io.to(this.room.code).emit('barrier:destroy', { id: barrier.id });
          }
          bulletsToRemove.add(i);
          break;
        }
      }

      if (bulletsToRemove.has(i)) continue;

      // Check turret collision
      for (const turret of this.room.turrets) {
        if (turret.ownerId === bullet.ownerId) continue;
        const dx = bullet.x - turret.x;
        const dy = bullet.y - turret.y;
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
          turret.health -= bullet.damage;
          if (turret.health <= 0) {
            const idx = this.room.turrets.indexOf(turret);
            if (idx > -1) this.room.turrets.splice(idx, 1);
            this.room.io.to(this.room.code).emit('turret:destroy', { id: turret.id });
          }
          bulletsToRemove.add(i);
          break;
        }
      }

      if (bulletsToRemove.has(i)) continue;

      // Check mob collision
      for (const mob of this.room.mobs) {
        if (!mob.alive) continue;
        const dx = bullet.x - mob.x;
        const dy = bullet.y - mob.y;
        if (Math.sqrt(dx * dx + dy * dy) < 25) {
          this.room.damageMob(mob, bullet.damage, bullet.ownerId);
          bulletsToRemove.add(i);
          break;
        }
      }

      if (bulletsToRemove.has(i)) continue;

      // Check player collision
      for (const player of this.room.players.values()) {
        if (player.id === bullet.ownerId) continue;
        if (!player.alive) continue;
        if (player.invisible) continue; // Can't hit invisible players

        const dx = bullet.x - player.x;
        const dy = bullet.y - player.y;
        const hitRadius = player.mechMode ? 24 : 20;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < hitRadius) {
          const result = player.takeDamage(bullet.damage, bullet.ownerId);

          if (!result.blocked) {
            this.room.io.to(this.room.code).emit('player:hit', {
              playerId: player.id,
              damage: bullet.damage,
              health: player.health,
              shieldBlocked: result.shieldBlocked,
            });

            // Life steal - only if attacker is alive
            if (bullet.lifeSteal > 0) {
              const attacker = this.room.players.get(bullet.ownerId);
              if (attacker && attacker.alive) {
                const healAmount = Math.floor(bullet.damage * bullet.lifeSteal);
                attacker.heal(healAmount);
                this.room.io.to(this.room.code).emit('player:heal', {
                  playerId: attacker.id,
                  amount: healAmount,
                  health: attacker.health,
                });
              }
            }

            if (result.died) {
              this.room.handlePlayerDeath(player, bullet.ownerId);
            }
          }

          bulletsToRemove.add(i);
          break;
        }
      }
    }

    // Remove bullets - convert Set to sorted array for correct index removal
    const indicesToRemove = Array.from(bulletsToRemove).sort((a, b) => b - a);
    for (const idx of indicesToRemove) {
      const bullet = this.room.bullets[idx];
      if (bullet) {
        this.room.io.to(this.room.code).emit('bullet:destroy', { id: bullet.id });
        this.room.bullets.splice(idx, 1);
      }
    }
  }

  updateGrenades(deltaTime) {
    const grenadesToRemove = new Set();

    for (let i = 0; i < this.room.grenades.length; i++) {
      const grenade = this.room.grenades[i];

      grenade.x += grenade.vx * deltaTime;
      grenade.y += grenade.vy * deltaTime;
      grenade.vx *= 0.98;
      grenade.vy *= 0.98;

      // Bounce off walls
      if (grenade.x < 0 || grenade.x > GAME_CONFIG.WIDTH) {
        grenade.vx = -grenade.vx * 0.5;
        grenade.x = Math.max(0, Math.min(GAME_CONFIG.WIDTH, grenade.x));
      }
      if (grenade.y < 0 || grenade.y > GAME_CONFIG.HEIGHT) {
        grenade.vy = -grenade.vy * 0.5;
        grenade.y = Math.max(0, Math.min(GAME_CONFIG.HEIGHT, grenade.y));
      }

      // Check barrel collision - explode early
      for (const barrel of this.room.barrels) {
        const dx = grenade.x - barrel.x;
        const dy = grenade.y - barrel.y;
        if (Math.sqrt(dx * dx + dy * dy) < 25) {
          grenade.explodeAt = Date.now(); // Explode now
          break;
        }
      }

      if (Date.now() >= grenade.explodeAt) {
        this.explodeGrenade(grenade);
        grenadesToRemove.add(i);
      }
    }

    // Remove grenades - convert Set to sorted array for correct index removal
    const grenadeIndicesToRemove = Array.from(grenadesToRemove).sort((a, b) => b - a);
    for (const idx of grenadeIndicesToRemove) {
      this.room.grenades.splice(idx, 1);
    }
  }

  explodeGrenade(grenade) {
    // Damage players
    for (const player of this.room.players.values()) {
      if (!player.alive) continue;

      const dx = grenade.x - player.x;
      const dy = grenade.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < grenade.explosionRadius) {
        let damage;
        if (distance < 20) {
          damage = grenade.damage;
        } else {
          const falloff = 1 - distance / grenade.explosionRadius;
          damage = Math.floor(grenade.splashDamage * falloff);
        }

        if (damage > 0) {
          const result = player.takeDamage(damage, grenade.ownerId);

          this.room.io.to(this.room.code).emit('player:hit', {
            playerId: player.id,
            damage,
            health: player.health,
          });

          if (result.died) {
            this.room.handlePlayerDeath(player, grenade.ownerId);
          }
        }
      }
    }

    // Damage barrels
    for (const barrel of this.room.barrels) {
      const dx = grenade.x - barrel.x;
      const dy = grenade.y - barrel.y;
      if (Math.sqrt(dx * dx + dy * dy) < grenade.explosionRadius) {
        this.room.damageBarrel(barrel, grenade.damage, grenade.ownerId);
      }
    }

    // Damage mobs
    for (const mob of this.room.mobs) {
      if (!mob.alive) continue;
      const dx = grenade.x - mob.x;
      const dy = grenade.y - mob.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < grenade.explosionRadius) {
        const falloff = 1 - distance / grenade.explosionRadius;
        const damage = Math.floor(grenade.splashDamage * falloff);
        if (damage > 0) {
          this.room.damageMob(mob, damage, grenade.ownerId);
        }
      }
    }

    this.room.io.to(this.room.code).emit('grenade:explode', {
      id: grenade.id,
      x: grenade.x,
      y: grenade.y,
      radius: grenade.explosionRadius,
    });
  }

  updateTurrets(deltaTime) {
    const turretsToRemove = [];
    const now = Date.now();

    for (let i = 0; i < this.room.turrets.length; i++) {
      const turret = this.room.turrets[i];

      // Check expiration
      if (now > turret.endTime) {
        turretsToRemove.push(i);
        continue;
      }

      // Find nearest enemy
      let nearestEnemy = null;
      let nearestDist = Infinity;

      for (const player of this.room.players.values()) {
        if (player.id === turret.ownerId || !player.alive || player.invisible) continue;

        const dx = player.x - turret.x;
        const dy = player.y - turret.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 250 && dist < nearestDist) {
          nearestDist = dist;
          nearestEnemy = player;
        }
      }

      // Shoot at enemy
      if (nearestEnemy && now - turret.lastFireTime > 1000 / turret.fireRate) {
        turret.lastFireTime = now;

        const angle = Math.atan2(nearestEnemy.y - turret.y, nearestEnemy.x - turret.x);
        const bullet = {
          id: `turret_bullet_${now}_${Math.random()}`,
          ownerId: turret.ownerId,
          x: turret.x,
          y: turret.y,
          vx: Math.cos(angle) * 400,
          vy: Math.sin(angle) * 400,
          damage: turret.damage,
          lifeSteal: 0,
          ricochetCount: 0,
          createdAt: now,
        };

        this.room.bullets.push(bullet);
        this.room.io.to(this.room.code).emit('turret:shoot', { turretId: turret.id, bulletId: bullet.id });
      }
    }

    for (let i = turretsToRemove.length - 1; i >= 0; i--) {
      const turret = this.room.turrets[turretsToRemove[i]];
      this.room.io.to(this.room.code).emit('turret:destroy', { id: turret.id });
      this.room.turrets.splice(turretsToRemove[i], 1);
    }
  }

  updateHealZones(deltaTime) {
    const zonesToRemove = [];
    const now = Date.now();

    for (let i = 0; i < this.room.healZones.length; i++) {
      const zone = this.room.healZones[i];

      if (now > zone.endTime) {
        zonesToRemove.push(i);
        continue;
      }

      // Heal players in zone
      for (const player of this.room.players.values()) {
        if (!player.alive) continue;

        const dx = player.x - zone.x;
        const dy = player.y - zone.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < zone.radius) {
          const healAmount = Math.floor(zone.healRate * deltaTime);
          if (healAmount > 0) {
            player.heal(healAmount);
          }
        }
      }
    }

    for (let i = zonesToRemove.length - 1; i >= 0; i--) {
      const zone = this.room.healZones[zonesToRemove[i]];
      this.room.io.to(this.room.code).emit('healZone:destroy', { id: zone.id });
      this.room.healZones.splice(zonesToRemove[i], 1);
    }
  }

  updateHazards(deltaTime) {
    for (const hazard of this.room.hazards) {
      if (hazard.type === 'LAVA') {
        // Damage players in lava
        for (const player of this.room.players.values()) {
          if (!player.alive || player.spawnProtection) continue;

          if (this.pointInRect(player.x, player.y, hazard.x, hazard.y, hazard.width, hazard.height)) {
            // Tick damage
            if (!player.lastLavaDamage || Date.now() - player.lastLavaDamage > HAZARDS.LAVA.tickRate) {
              player.lastLavaDamage = Date.now();
              const result = player.takeDamage(HAZARDS.LAVA.damage, null);

              this.room.io.to(this.room.code).emit('player:hit', {
                playerId: player.id,
                damage: HAZARDS.LAVA.damage,
                health: player.health,
                hazard: true,
              });

              if (result.died) {
                this.room.handlePlayerDeath(player, null);
              }
            }
          }
        }
      } else if (hazard.type === 'BOUNCE') {
        // Launch players on bounce pads
        for (const player of this.room.players.values()) {
          if (!player.alive) continue;

          if (this.pointInRect(player.x, player.y, hazard.x, hazard.y, hazard.width, hazard.height)) {
            if (!player.lastBounce || Date.now() - player.lastBounce > 500) {
              player.lastBounce = Date.now();
              const bounceForce = 300;
              player.x += Math.cos(hazard.angle) * bounceForce * 0.3;
              player.y += Math.sin(hazard.angle) * bounceForce * 0.3;

              this.room.io.to(this.room.code).emit('player:bounce', {
                playerId: player.id,
                x: player.x,
                y: player.y,
              });
            }
          }
        }
      }
    }
  }

  checkPowerupCollisions() {
    const powerupsToRemove = [];

    for (let i = 0; i < this.room.powerups.length; i++) {
      const powerup = this.room.powerups[i];

      for (const player of this.room.players.values()) {
        if (!player.alive) continue;

        const dx = player.x - powerup.x;
        const dy = player.y - powerup.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 30) {
          player.addPowerup(powerup.type);
          powerupsToRemove.push(i);

          this.room.io.to(this.room.code).emit('powerup:collected', {
            id: powerup.id,
            playerId: player.id,
            type: powerup.type,
          });
          break;
        }
      }
    }

    for (let i = powerupsToRemove.length - 1; i >= 0; i--) {
      this.room.powerups.splice(powerupsToRemove[i], 1);
    }
  }

  pointInRect(px, py, rx, ry, rw, rh) {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  }

  updateMobs(deltaTime) {
    const now = Date.now();

    for (const mob of this.room.mobs) {
      if (!mob.alive) continue;

      const mobConfig = MOBS[mob.type];
      if (!mobConfig) continue;

      // Find nearest player
      let nearestPlayer = null;
      let nearestDist = Infinity;

      for (const player of this.room.players.values()) {
        if (!player.alive || player.invisible) continue;

        const dx = player.x - mob.x;
        const dy = player.y - mob.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mobConfig.aggroRange && dist < nearestDist) {
          nearestDist = dist;
          nearestPlayer = player;
        }
      }

      // Move toward nearest player
      if (nearestPlayer) {
        const dx = nearestPlayer.x - mob.x;
        const dy = nearestPlayer.y - mob.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > mobConfig.attackRange) {
          // Move toward player
          const speed = mobConfig.speed * deltaTime;
          mob.x += (dx / dist) * speed;
          mob.y += (dy / dist) * speed;

          // Keep within bounds
          mob.x = Math.max(20, Math.min(GAME_CONFIG.WIDTH - 20, mob.x));
          mob.y = Math.max(20, Math.min(GAME_CONFIG.HEIGHT - 20, mob.y));
        } else {
          // Attack player if in range
          const attackDelay = 1000 / mobConfig.attackRate;
          if (now - mob.lastAttackTime >= attackDelay) {
            mob.lastAttackTime = now;

            const result = nearestPlayer.takeDamage(mobConfig.damage, null);

            this.room.io.to(this.room.code).emit('mob:attack', {
              mobId: mob.id,
              targetId: nearestPlayer.id,
              damage: mobConfig.damage,
            });

            this.room.io.to(this.room.code).emit('player:hit', {
              playerId: nearestPlayer.id,
              damage: mobConfig.damage,
              health: nearestPlayer.health,
              fromMob: true,
            });

            // Apply stun if mob has it
            if (mobConfig.stunDuration && nearestPlayer.applyStun) {
              nearestPlayer.applyStun(mobConfig.stunDuration);
            }

            if (result.died) {
              this.room.handlePlayerDeath(nearestPlayer, null);
            }
          }
        }
      } else {
        // Wander randomly
        if (!mob.wanderTarget || now - mob.lastWanderChange > 3000) {
          mob.wanderTarget = {
            x: 100 + Math.random() * (GAME_CONFIG.WIDTH - 200),
            y: 100 + Math.random() * (GAME_CONFIG.HEIGHT - 200),
          };
          mob.lastWanderChange = now;
        }

        const dx = mob.wanderTarget.x - mob.x;
        const dy = mob.wanderTarget.y - mob.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 10) {
          const speed = (mobConfig.speed * 0.5) * deltaTime;
          mob.x += (dx / dist) * speed;
          mob.y += (dy / dist) * speed;
        }
      }
    }
  }
}
