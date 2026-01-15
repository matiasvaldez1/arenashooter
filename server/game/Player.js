import { PLAYER_CLASSES, GAME_CONFIG, SPAWN_INVINCIBILITY, POWERUPS, DODGE_CONFIG } from '../../shared/constants.js';

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

    // Spawn protection
    this.spawnProtection = false;
    this.spawnProtectionEnd = 0;

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
    if (PLAYER_CLASSES[classType]) {
      this.classType = classType;
      const stats = PLAYER_CLASSES[classType];
      this.maxHealth = stats.health;
      this.speed = stats.speed;
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

    // Spawn protection
    this.spawnProtection = true;
    this.spawnProtectionEnd = Date.now() + SPAWN_INVINCIBILITY;
  }

  getEffectiveSpeed() {
    let speed = this.speed;

    // Power-up multiplier
    if (this.activePowerups.SPEED) {
      speed *= POWERUPS.SPEED.effect.speedMultiplier;
    }

    // Mech mode is slower
    if (this.mechMode) {
      speed *= 0.6;
    }

    // Kill streak bonus
    if (this.killStreak >= 7) {
      speed *= 1.2;
    }

    return speed;
  }

  getEffectiveDamage(baseDamage) {
    let damage = baseDamage;

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
    const stats = PLAYER_CLASSES[this.classType];
    let fireRate = stats.fireRate;

    // Power-up multiplier
    if (this.activePowerups.RAPID_FIRE) {
      fireRate *= POWERUPS.RAPID_FIRE.effect.fireRateMultiplier;
    }

    // Ultimate: Golden Ball (Messi rapid fire)
    if (this.ultimateActive && this.classType === 'MESSI') {
      fireRate *= 5;
    }

    // Ultimate: Dollarization (Milei damage aura)
    if (this.ultimateActive && this.classType === 'MILEI') {
      fireRate *= 2;
    }

    return fireRate;
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

    // Charge ultimate from movement
    if (dx !== 0 || dy !== 0) {
      this.ultimateCharge = Math.min(100, this.ultimateCharge + deltaTime * 2);
    }
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

  addKill() {
    this.score++;
    this.killStreak++;
    this.lastKillTime = Date.now();

    // Charge ultimate on kill
    this.ultimateCharge = Math.min(100, this.ultimateCharge + 20);
  }

  canUseUltimate() {
    return this.ultimateCharge >= 100 && !this.ultimateActive && this.alive;
  }

  activateUltimate() {
    if (!this.canUseUltimate()) return false;

    const stats = PLAYER_CLASSES[this.classType];
    this.ultimateActive = true;
    this.ultimateCharge = 0;

    // Set duration based on ultimate type
    const ultimateDurations = {
      GOLDEN_BALL: 4000,      // Messi - rapid fire soccer balls
      DOLLARIZATION: 8000,    // Milei - double damage money aura
      MAGA_MECH: 10000,       // Trump - giant mech suit
      EXECUTIVE_ORDER: 0,     // Biden - instant life swap
      NUCLEAR_STRIKE: 3000,   // Putin - carpet missile barrage
    };

    const duration = ultimateDurations[stats.ultimate] || 5000;
    this.ultimateEndTime = Date.now() + duration;

    // Apply immediate effects
    if (stats.ultimate === 'MAGA_MECH') {
      this.mechMode = true;
      this.maxHealth = stats.health * 2;
      this.health = Math.min(this.health + 100, this.maxHealth);
    } else if (stats.ultimate === 'GOLDEN_BALL') {
      // Messi becomes invincible during Golden Ball
      this.spawnProtection = true;
      this.spawnProtectionEnd = this.ultimateEndTime;
    }

    return true;
  }

  deactivateUltimate() {
    this.ultimateActive = false;
    this.invisible = false;

    if (this.mechMode) {
      this.mechMode = false;
      const stats = PLAYER_CLASSES[this.classType];
      this.maxHealth = stats.health;
      this.health = Math.min(this.health, this.maxHealth);
    }
  }

  canDash() {
    // Messi has dash ability (like a soccer dribble)
    if (this.classType !== 'MESSI') return false;
    const stats = PLAYER_CLASSES.MESSI;
    return Date.now() - this.lastDashTime >= stats.dashCooldown;
  }

  performDash() {
    if (!this.canDash()) return null;

    const stats = PLAYER_CLASSES.MESSI;
    this.lastDashTime = Date.now();

    // Calculate dash end position
    const dashX = this.x + Math.cos(this.angle) * stats.dashDistance;
    const dashY = this.y + Math.sin(this.angle) * stats.dashDistance;

    // Clamp to bounds
    const oldX = this.x;
    const oldY = this.y;
    this.x = Math.max(24, Math.min(GAME_CONFIG.WIDTH - 24, dashX));
    this.y = Math.max(24, Math.min(GAME_CONFIG.HEIGHT - 24, dashY));

    return { fromX: oldX, fromY: oldY, toX: this.x, toY: this.y };
  }

  canChainsaw() {
    // Milei has chainsaw ability
    if (this.classType !== 'MILEI') return false;
    const stats = PLAYER_CLASSES.MILEI;
    return Date.now() - this.lastChainsawTime >= stats.chainsawCooldown;
  }

  performChainsaw() {
    if (!this.canChainsaw()) return null;

    this.lastChainsawTime = Date.now();
    return {
      x: this.x,
      y: this.y,
      angle: this.angle,
      damage: PLAYER_CLASSES.MILEI.chainsawDamage
    };
  }

  // Universal dodge - available to all characters
  canDodge() {
    return Date.now() - this.lastDodgeTime >= DODGE_CONFIG.cooldown;
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
    };
  }
}
