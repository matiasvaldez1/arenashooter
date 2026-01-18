import { PLAYER_CLASSES, GAME_CONFIG, SPAWN_INVINCIBILITY, POWERUPS, DODGE_CONFIG, PERKS, getCharacter } from '../../shared/constants.js';

export class Player {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.classType = 'MESSI';
    this.ready = false;

    // Position and movement
    this.x = 0;
    this.y = 0;
    this.angle = 0;

    // Stats
    this.health = 100;
    this.maxHealth = 100;
    this.speed = 200;
    this.alive = false;
    this.score = 0;

    // Combat
    this.lastFireTime = 0;
    this.killStreak = 0;
    this.lastKillTime = 0;

    // Ultimate
    this.ultimateCharge = 0;
    this.ultimateActive = false;
    this.ultimateEndTime = 0;

    // Abilities
    this.lastDashTime = 0;
    this.lastChainsawTime = 0;
    this.lastDodgeTime = 0;
    this.dodgeIframeEnd = 0;
    this.invisible = false;
    this.mechMode = false;

    // Power-ups
    this.activePowerups = {};
    this.shieldHits = 0;
    this.ricochetCount = 0;

    // Perks (permanent for wave survival mode)
    this.perks = {};

    // Spawn protection
    this.spawnProtection = false;
    this.spawnProtectionEnd = 0;

    // Slow effect (from abilities like Momo's FANCY)
    this.slowed = false;
    this.slowEndTime = 0;
    this.slowAmount = 0;

    // Input state
    this.input = {
      up: false,
      down: false,
      left: false,
      right: false,
      angle: 0,
      ability: false,
      ultimate: false,
    };
  }

  setClass(classType) {
    const character = getCharacter(classType);
    if (character) {
      this.classType = classType;
      this.maxHealth = character.health;
      this.speed = character.speed;
    }
  }

  spawn(x, y) {
    this.x = x;
    this.y = y;
    this.health = this.maxHealth;
    this.alive = true;
    this.killStreak = 0;
    this.ultimateCharge = 0;
    this.ultimateActive = false;
    this.invisible = false;
    this.mechMode = false;
    this.activePowerups = {};
    this.shieldHits = 0;
    this.ricochetCount = 0;

    // Clear slow effect on spawn
    this.slowed = false;
    this.slowEndTime = 0;
    this.slowAmount = 0;

    // Spawn protection
    this.spawnProtection = true;
    this.spawnProtectionEnd = Date.now() + SPAWN_INVINCIBILITY;
  }

  getEffectiveSpeed() {
    let speed = this.speed;

    // Perk bonus (permanent)
    if (this.perks.SPEED_BOOST) {
      speed *= (1 + PERKS.SPEED_BOOST.effect.speedMultiplier * this.perks.SPEED_BOOST);
    }

    // Power-up multiplier
    if (this.activePowerups.SPEED) {
      speed *= POWERUPS.SPEED.effect.speedMultiplier;
    }

    // Mech mode is slower
    if (this.mechMode) {
      speed *= 0.6;
    }

    // Slow effect (from enemy abilities)
    if (this.slowed && Date.now() < this.slowEndTime) {
      speed *= (1 - this.slowAmount);
    }

    // Kill streak bonus
    if (this.killStreak >= 7) {
      speed *= 1.2;
    }

    return speed;
  }

  getEffectiveDamage(baseDamage) {
    let damage = baseDamage;

    // Perk bonus (permanent)
    if (this.perks.DAMAGE_BOOST) {
      damage *= (1 + PERKS.DAMAGE_BOOST.effect.damageMultiplier * this.perks.DAMAGE_BOOST);
    }

    // Power-up multiplier
    if (this.activePowerups.DAMAGE) {
      damage *= POWERUPS.DAMAGE.effect.damageMultiplier;
    }

    // Mech mode bonus
    if (this.mechMode) {
      damage *= 1.5;
    }

    // Kill streak bonus
    if (this.killStreak >= 5) {
      damage *= 1.3;
    }

    return Math.floor(damage);
  }

  getEffectiveFireRate() {
    const character = getCharacter(this.classType);
    let fireRate = character?.fireRate || 3;

    // Perk bonus (permanent)
    if (this.perks.FIRE_RATE_BOOST) {
      fireRate *= (1 + PERKS.FIRE_RATE_BOOST.effect.fireRateMultiplier * this.perks.FIRE_RATE_BOOST);
    }

    // Power-up multiplier
    if (this.activePowerups.RAPID_FIRE) {
      fireRate *= POWERUPS.RAPID_FIRE.effect.fireRateMultiplier;
    }

    // Ultimate effects on fire rate
    if (this.ultimateActive) {
      const character = getCharacter(this.classType);
      const ultimateEffect = character?.ultimate?.effect;
      if (ultimateEffect === 'GOLDEN_BALL') {
        fireRate *= 5;
      } else if (ultimateEffect === 'DOLLARIZATION') {
        fireRate *= 2;
      } else if (ultimateEffect === 'MONEY') {
        fireRate *= 2;
      }
    }

    // Rapid fire ability active
    if (this.rapidFireActive && Date.now() < this.rapidFireEndTime) {
      fireRate *= this.rapidFireMultiplier || 3;
    }

    return fireRate;
  }

  getEffectiveMaxHealth() {
    let health = this.maxHealth;

    // Perk bonus (permanent)
    if (this.perks.HEALTH_BOOST) {
      health += PERKS.HEALTH_BOOST.effect.healthBonus * this.perks.HEALTH_BOOST;
    }

    return health;
  }

  getEffectiveLifeSteal() {
    let lifeSteal = 0;

    // Base life steal from character stats
    const character = getCharacter(this.classType);
    if (character?.lifeSteal) {
      lifeSteal = character.lifeSteal;
    }

    // Perk bonus (permanent)
    if (this.perks.VAMPIRISM) {
      lifeSteal += PERKS.VAMPIRISM.effect.lifeSteal * this.perks.VAMPIRISM;
    }

    return lifeSteal;
  }

  getEffectiveUltimateChargeRate() {
    let rate = 1.0;

    // Perk bonus (permanent)
    if (this.perks.ULTIMATE_CHARGE) {
      rate *= (1 + PERKS.ULTIMATE_CHARGE.effect.ultimateChargeMultiplier * this.perks.ULTIMATE_CHARGE);
    }

    return rate;
  }

  getEffectiveProjectileSizeMultiplier() {
    let multiplier = 1.0;

    // Perk bonus (permanent)
    if (this.perks.PROJECTILE_SIZE) {
      multiplier += PERKS.PROJECTILE_SIZE.effect.projectileSizeMultiplier * this.perks.PROJECTILE_SIZE;
    }

    return multiplier;
  }

  update(deltaTime) {
    if (!this.alive) return;

    const now = Date.now();

    // Check spawn protection
    if (this.spawnProtection && now > this.spawnProtectionEnd) {
      this.spawnProtection = false;
    }

    // Check ultimate duration
    if (this.ultimateActive && now > this.ultimateEndTime) {
      this.deactivateUltimate();
    }

    // Check power-up durations
    for (const [type, endTime] of Object.entries(this.activePowerups)) {
      if (now > endTime) {
        this.removePowerup(type);
      }
    }

    // Check slow effect duration
    if (this.slowed && now > this.slowEndTime) {
      this.clearSlowEffect();
    }

    // Calculate movement
    let dx = 0;
    let dy = 0;

    if (this.input.up) dy -= 1;
    if (this.input.down) dy += 1;
    if (this.input.left) dx -= 1;
    if (this.input.right) dx += 1;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      dx /= length;
      dy /= length;
    }

    // Apply movement
    const effectiveSpeed = this.getEffectiveSpeed();
    this.x += dx * effectiveSpeed * deltaTime;
    this.y += dy * effectiveSpeed * deltaTime;

    // Clamp to arena bounds
    const margin = this.mechMode ? 32 : 24;
    this.x = Math.max(margin, Math.min(GAME_CONFIG.WIDTH - margin, this.x));
    this.y = Math.max(margin, Math.min(GAME_CONFIG.HEIGHT - margin, this.y));

    // Update angle
    this.angle = this.input.angle;

    // Charge ultimate (passive + bonus from movement)
    const chargeRate = this.getEffectiveUltimateChargeRate();
    const baseCharge = deltaTime * 5 * chargeRate;
    const moveBonus = (dx !== 0 || dy !== 0) ? deltaTime * 5 * chargeRate : 0;
    this.ultimateCharge = Math.min(100, this.ultimateCharge + baseCharge + moveBonus);
  }

  takeDamage(amount, attackerId) {
    if (!this.alive) return { died: false, damage: 0 };

    // Spawn protection
    if (this.spawnProtection) {
      return { died: false, damage: 0, blocked: true };
    }

    // Dodge iframes
    if (this.isInDodgeIframes()) {
      return { died: false, damage: 0, dodged: true };
    }

    // Shield power-up
    if (this.shieldHits > 0) {
      this.shieldHits--;
      return { died: false, damage: 0, shieldBlocked: true };
    }

    // Mech mode damage reduction
    if (this.mechMode) {
      amount = Math.floor(amount * 0.5);
    }

    this.health -= amount;

    if (this.health <= 0) {
      this.health = 0;
      this.killStreak = 0;
      return { died: true, damage: amount };
    }

    return { died: false, damage: amount };
  }

  heal(amount) {
    if (!this.alive) return 0;
    const oldHealth = this.health;
    this.health = Math.min(this.maxHealth, this.health + amount);
    return this.health - oldHealth;
  }

  applySlowEffect(slowAmount, duration) {
    this.slowed = true;
    this.slowAmount = slowAmount;
    this.slowEndTime = Date.now() + duration;
  }

  clearSlowEffect() {
    this.slowed = false;
    this.slowAmount = 0;
    this.slowEndTime = 0;
  }

  addKill() {
    this.score++;
    this.killStreak++;
    this.lastKillTime = Date.now();

    // Charge ultimate on kill
    this.ultimateCharge = Math.min(100, this.ultimateCharge + 25);
  }

  addUltimateCharge(amount) {
    this.ultimateCharge = Math.min(100, this.ultimateCharge + amount);
  }

  canUseUltimate() {
    return this.ultimateCharge >= 100 && !this.ultimateActive && this.alive;
  }

  activateUltimate() {
    if (!this.canUseUltimate()) return false;

    const character = getCharacter(this.classType);
    if (!character?.ultimate) return false;

    this.ultimateActive = true;
    this.ultimateCharge = 0;

    // Get duration from character ultimate config
    const duration = character.ultimate.duration || 5000;
    this.ultimateEndTime = Date.now() + duration;

    return true;
  }

  deactivateUltimate() {
    this.ultimateActive = false;
    this.invisible = false;
    this.rapidFireActive = false;
    this.damageAuraActive = false;

    if (this.mechMode) {
      this.mechMode = false;
      const character = getCharacter(this.classType);
      this.maxHealth = character?.health || 100;
      this.health = Math.min(this.health, this.maxHealth);
    }
  }

  canDash() {
    const character = getCharacter(this.classType);
    if (character?.ability?.type !== 'DASH') return false;
    const cooldown = character.ability.cooldown || 2000;
    return Date.now() - this.lastDashTime >= cooldown;
  }

  performDash() {
    if (!this.canDash()) return null;

    const character = getCharacter(this.classType);
    const distance = character?.ability?.distance || 300;
    this.lastDashTime = Date.now();

    // Calculate dash end position
    const dashX = this.x + Math.cos(this.angle) * distance;
    const dashY = this.y + Math.sin(this.angle) * distance;

    // Clamp to bounds
    const oldX = this.x;
    const oldY = this.y;
    this.x = Math.max(24, Math.min(GAME_CONFIG.WIDTH - 24, dashX));
    this.y = Math.max(24, Math.min(GAME_CONFIG.HEIGHT - 24, dashY));

    return { fromX: oldX, fromY: oldY, toX: this.x, toY: this.y };
  }

  canChainsaw() {
    const character = getCharacter(this.classType);
    if (character?.ability?.type !== 'CHAINSAW') return false;
    const cooldown = character.ability.cooldown || 3000;
    return Date.now() - this.lastChainsawTime >= cooldown;
  }

  performChainsaw() {
    if (!this.canChainsaw()) return null;

    const character = getCharacter(this.classType);
    this.lastChainsawTime = Date.now();
    return {
      x: this.x,
      y: this.y,
      angle: this.angle,
      damage: character?.ability?.damage || 50
    };
  }

  // Universal dodge - available to all characters
  getEffectiveDodgeCooldown() {
    let cooldown = DODGE_CONFIG.cooldown;

    // Perk bonus (permanent)
    if (this.perks.COOLDOWN_REDUCTION) {
      cooldown *= (1 - PERKS.COOLDOWN_REDUCTION.effect.cooldownReduction * this.perks.COOLDOWN_REDUCTION);
    }

    return cooldown;
  }

  canDodge() {
    return Date.now() - this.lastDodgeTime >= this.getEffectiveDodgeCooldown();
  }

  performDodge(direction) {
    if (!this.canDodge()) return null;

    const now = Date.now();
    this.lastDodgeTime = now;
    this.dodgeIframeEnd = now + DODGE_CONFIG.iframeDuration;

    // Calculate dodge direction based on arrow key
    let dx = 0, dy = 0;
    if (direction.up) dy = -1;
    if (direction.down) dy = 1;
    if (direction.left) dx = -1;
    if (direction.right) dx = 1;

    // Normalize diagonal
    if (dx !== 0 && dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
    }

    // If no direction, dodge backward from facing angle
    if (dx === 0 && dy === 0) {
      dx = -Math.cos(this.angle);
      dy = -Math.sin(this.angle);
    }

    const oldX = this.x;
    const oldY = this.y;

    // Apply dodge movement
    this.x += dx * DODGE_CONFIG.distance;
    this.y += dy * DODGE_CONFIG.distance;

    // Clamp to bounds
    this.x = Math.max(24, Math.min(GAME_CONFIG.WIDTH - 24, this.x));
    this.y = Math.max(24, Math.min(GAME_CONFIG.HEIGHT - 24, this.y));

    return { fromX: oldX, fromY: oldY, toX: this.x, toY: this.y };
  }

  isInDodgeIframes() {
    return Date.now() < this.dodgeIframeEnd;
  }

  addPowerup(type) {
    const powerup = POWERUPS[type];
    if (!powerup) return;

    if (type === 'HEALTH') {
      // Instant heal
      this.heal(powerup.effect.healAmount);
    } else if (type === 'SHIELD') {
      this.shieldHits = powerup.effect.shieldHits;
      this.activePowerups[type] = Date.now() + powerup.duration;
    } else if (type === 'RICOCHET') {
      this.ricochetCount = powerup.effect.ricochetCount;
      this.activePowerups[type] = Date.now() + powerup.duration;
    } else {
      this.activePowerups[type] = Date.now() + powerup.duration;
    }
  }

  removePowerup(type) {
    delete this.activePowerups[type];
    if (type === 'SHIELD') {
      this.shieldHits = 0;
    } else if (type === 'RICOCHET') {
      this.ricochetCount = 0;
    }
  }

  // Perks (permanent upgrades for wave survival mode)
  addPerk(perkId) {
    const perk = PERKS[perkId];
    if (!perk) return false;

    if (!this.perks[perkId]) {
      this.perks[perkId] = 0;
    }

    if (this.perks[perkId] >= perk.maxStacks) {
      return false; // Max stacks reached
    }

    this.perks[perkId]++;

    // Apply immediate effects for health boost
    if (perkId === 'HEALTH_BOOST') {
      const newMaxHealth = this.getEffectiveMaxHealth();
      const healthDiff = newMaxHealth - this.maxHealth;
      this.maxHealth = newMaxHealth;
      this.health = Math.min(this.health + healthDiff, this.maxHealth);
    }

    return true;
  }

  getPerkStacks(perkId) {
    return this.perks[perkId] || 0;
  }

  reset() {
    this.score = 0;
    this.killStreak = 0;
    this.lastKillTime = 0;
    this.ultimateCharge = 0;
    this.ultimateActive = false;
    this.ultimateEndTime = 0;
    this.alive = false;
    this.health = this.maxHealth;
    this.activePowerups = {};
    this.shieldHits = 0;
    this.ricochetCount = 0;
    this.perks = {};
    this.spawnProtection = false;
    this.spawnProtectionEnd = 0;
    this.invisible = false;
    this.mechMode = false;
    this.rapidFireActive = false;
    this.damageAuraActive = false;
  }

  getState() {
    return {
      id: this.id,
      name: this.name,
      x: this.x,
      y: this.y,
      angle: this.angle,
      health: this.health,
      maxHealth: this.maxHealth,
      alive: this.alive,
      score: this.score,
      classType: this.classType,
      killStreak: this.killStreak,
      ultimateCharge: this.ultimateCharge,
      ultimateActive: this.ultimateActive,
      invisible: this.invisible,
      mechMode: this.mechMode,
      shieldHits: this.shieldHits,
      spawnProtection: this.spawnProtection,
      activePowerups: Object.keys(this.activePowerups),
      perks: this.perks,
    };
  }
}
