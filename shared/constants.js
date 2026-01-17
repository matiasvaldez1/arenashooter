// Shared constants between client and server
// Modular Theme System

export * from './themes/index.js';
import { getActiveCharacters, getCharacter, getActiveTheme } from './themes/index.js';

export const GAME_CONFIG = {
  WIDTH: 1280,
  HEIGHT: 720,
  TICK_RATE: 20,
  PHYSICS_RATE: 60,
};

// Dynamic PLAYER_CLASSES getter for backward compatibility
export function getPlayerClasses() {
  return getActiveCharacters();
}

// Backward compatible PLAYER_CLASSES export (computed from active theme)
export const PLAYER_CLASSES = new Proxy({}, {
  get(target, prop) {
    const chars = getActiveCharacters();
    return chars[prop];
  },
  ownKeys() {
    return Object.keys(getActiveCharacters());
  },
  getOwnPropertyDescriptor(target, prop) {
    const chars = getActiveCharacters();
    if (prop in chars) {
      return { enumerable: true, configurable: true, value: chars[prop] };
    }
    return undefined;
  },
  has(target, prop) {
    return prop in getActiveCharacters();
  },
});

// Dynamic ULTIMATES getter
export function getUltimates() {
  const chars = getActiveCharacters();
  const ultimates = {};
  for (const [key, char] of Object.entries(chars)) {
    if (char.ultimate) {
      ultimates[char.ultimate.id] = {
        name: char.ultimate.name,
        duration: char.ultimate.duration,
        description: char.ultimate.description,
      };
    }
  }
  return ultimates;
}

// Backward compatible ULTIMATES export
export const ULTIMATES = new Proxy({}, {
  get(target, prop) {
    return getUltimates()[prop];
  },
  ownKeys() {
    return Object.keys(getUltimates());
  },
  getOwnPropertyDescriptor(target, prop) {
    const ults = getUltimates();
    if (prop in ults) {
      return { enumerable: true, configurable: true, value: ults[prop] };
    }
    return undefined;
  },
});

export const POWERUPS = {
  SPEED: {
    name: 'Energy Drink',
    duration: 5000,
    color: '#00ffff',
    effect: { speedMultiplier: 1.8 },
  },
  DAMAGE: {
    name: 'Rage Boost',
    duration: 8000,
    color: '#ff0000',
    effect: { damageMultiplier: 2 },
  },
  SHIELD: {
    name: 'Bodyguards',
    duration: 10000,
    color: '#0088ff',
    effect: { shieldHits: 3 },
  },
  RAPID_FIRE: {
    name: 'Adrenaline',
    duration: 6000,
    color: '#ffff00',
    effect: { fireRateMultiplier: 3 },
  },
  HEALTH: {
    name: 'First Aid',
    duration: 0,
    color: '#00ff00',
    effect: { healAmount: 50 },
  },
  RICOCHET: {
    name: 'Bouncy Shots',
    duration: 8000,
    color: '#ff8800',
    effect: { ricochetCount: 3 },
  },
};

export const HAZARDS = {
  LAVA: {
    damage: 20,
    tickRate: 500,
    color: '#ff4400',
  },
  SPIKES: {
    damage: 30,
    tickRate: 1000,
    color: '#888888',
  },
  BARREL: {
    health: 30,
    explosionDamage: 60,
    explosionRadius: 100,
    color: '#ff0000',
  },
};

export const KILL_STREAKS = {
  2: { name: 'DOUBLE KILL!', color: '#ffff00' },
  3: { name: 'TRIPLE KILL!', color: '#ff8800' },
  4: { name: 'QUAD KILL!', color: '#ff4400' },
  5: { name: 'UNSTOPPABLE!', color: '#ff0000', effect: 'damage' },
  7: { name: 'GODLIKE!', color: '#ff00ff', effect: 'speed' },
  10: { name: 'LEGENDARY!', color: '#00ffff', effect: 'both' },
};

export const ROOM_CONFIG = {
  MAX_PLAYERS: 8,
  CODE_LENGTH: 6,
};

export const RESPAWN_TIME = 3000;
export const SPAWN_INVINCIBILITY = 2000;
export const POWERUP_SPAWN_INTERVAL = 15000;

// Universal dodge mechanic (arrow keys)
export const DODGE_CONFIG = {
  distance: 80,
  cooldown: 1500,
  iframeDuration: 200,
};

// ==========================================
// GAME MODES
// ==========================================

export const GAME_MODES = {
  ARENA: {
    id: 'ARENA',
    name: 'Arena Deathmatch',
    description: 'Classic free-for-all arena combat',
    minPlayers: 1,
    maxPlayers: 8,
  },
  WAVE_SURVIVAL: {
    id: 'WAVE_SURVIVAL',
    name: 'Wave Survival',
    description: 'Survive endless waves of enemies together',
    minPlayers: 1,
    maxPlayers: 4,
    isCooperative: true,
  },
  INFINITE_HORDE: {
    id: 'INFINITE_HORDE',
    name: 'Infinite Horde',
    description: 'Endless waves with boss fights every 3 waves',
    minPlayers: 1,
    maxPlayers: 4,
    isCooperative: true,
  },
};

export const INFINITE_HORDE_CONFIG = {
  BASE_MOB_COUNT: 3,
  MOB_INCREMENT_PER_WAVE: 1,
  BOSS_EVERY_N_WAVES: 3,
  MAX_SIMULTANEOUS_MOBS: 30,
  HEALTH_SCALING: 1.08,
  DAMAGE_SCALING: 1.05,
  SPAWN_INTERVAL_MS: 600,
  WAVE_DELAY_MS: 5000,
  ELITE_CHANCE_BASE: 0.08,
  ELITE_CHANCE_INCREMENT: 0.015,
};

export const ARENA_CONFIG = {
  GAME_DURATION_MS: 90 * 1000,
  WIN_SCORE: null,
};

// Dynamic TEAM_ABILITIES based on active theme
export function getTeamAbilities() {
  const chars = getActiveCharacters();
  const auras = {};
  for (const [key, char] of Object.entries(chars)) {
    if (char.aura) {
      auras[key] = char.aura;
    }
  }
  return {
    COMBO_DAMAGE: {
      enabled: true,
      windowMs: 1000,
      bonuses: {
        2: 0.10,
        3: 0.25,
        4: 0.50,
      },
      stunAt4: true,
      stunDuration: 500,
    },
    AURAS: auras,
  };
}

export const TEAM_ABILITIES = new Proxy({}, {
  get(target, prop) {
    return getTeamAbilities()[prop];
  },
  ownKeys() {
    return Object.keys(getTeamAbilities());
  },
  getOwnPropertyDescriptor(target, prop) {
    const abilities = getTeamAbilities();
    if (prop in abilities) {
      return { enumerable: true, configurable: true, value: abilities[prop] };
    }
    return undefined;
  },
});

export const WAVE_CONFIG = {
  BASE_MOB_COUNT: 5,
  MOB_INCREMENT_PER_WAVE: 2,
  WAVE_DELAY_MS: 8000,
  SPAWN_INTERVAL_MS: 800,
  ELITE_CHANCE_BASE: 0.05,
  ELITE_CHANCE_INCREMENT: 0.02,
  ELITE_HEALTH_MULTIPLIER: 2.5,
  ELITE_DAMAGE_MULTIPLIER: 1.5,
  MAX_MOBS_ALIVE: 25,
  HEALTH_SCALING: 1.12,
  DAMAGE_SCALING: 1.08,
  PERK_SELECTION_TIME_MS: 15000,
};

export const PERKS = {
  DAMAGE_BOOST: {
    id: 'DAMAGE_BOOST',
    name: 'Rage',
    description: '+20% damage',
    color: '#ff4444',
    effect: { damageMultiplier: 0.2 },
    maxStacks: 5,
  },
  HEALTH_BOOST: {
    id: 'HEALTH_BOOST',
    name: 'Thick Skin',
    description: '+30 max health',
    color: '#44ff44',
    effect: { healthBonus: 30 },
    maxStacks: 5,
  },
  SPEED_BOOST: {
    id: 'SPEED_BOOST',
    name: 'Fleet Foot',
    description: '+20% movement speed',
    color: '#44ffff',
    effect: { speedMultiplier: 0.2 },
    maxStacks: 4,
  },
  FIRE_RATE_BOOST: {
    id: 'FIRE_RATE_BOOST',
    name: 'Trigger Happy',
    description: '+25% fire rate',
    color: '#ffff44',
    effect: { fireRateMultiplier: 0.25 },
    maxStacks: 4,
  },
  COOLDOWN_REDUCTION: {
    id: 'COOLDOWN_REDUCTION',
    name: 'Haste',
    description: '-20% ability cooldown',
    color: '#ff44ff',
    effect: { cooldownReduction: 0.2 },
    maxStacks: 3,
  },
  VAMPIRISM: {
    id: 'VAMPIRISM',
    name: 'Vampirism',
    description: 'Heal 10% of damage dealt',
    color: '#880044',
    effect: { lifeSteal: 0.1 },
    maxStacks: 3,
  },
  EXPLOSIVE_KILLS: {
    id: 'EXPLOSIVE_KILLS',
    name: 'Volatile',
    description: 'Enemies explode on death',
    color: '#ff8800',
    effect: { explosiveKills: true, explosionRadius: 60, explosionDamage: 25 },
    maxStacks: 1,
  },
  SHIELD_ON_WAVE: {
    id: 'SHIELD_ON_WAVE',
    name: 'Fresh Start',
    description: '+2 shield hits at wave start',
    color: '#4488ff',
    effect: { waveShieldHits: 2 },
    maxStacks: 3,
  },
  PROJECTILE_SIZE: {
    id: 'PROJECTILE_SIZE',
    name: 'Big Shots',
    description: '+30% projectile size',
    color: '#ff88ff',
    effect: { projectileSizeMultiplier: 0.3 },
    maxStacks: 3,
  },
  ULTIMATE_CHARGE: {
    id: 'ULTIMATE_CHARGE',
    name: 'Power Surge',
    description: '+25% ultimate charge rate',
    color: '#8844ff',
    effect: { ultimateChargeMultiplier: 0.25 },
    maxStacks: 3,
  },
};

export const MAP_MODIFIERS = {
  DOUBLE_DAMAGE: {
    id: 'DOUBLE_DAMAGE',
    name: 'Glass Cannon',
    description: 'Everyone deals 2x damage',
    color: '#ff4444',
    effect: { globalDamageMultiplier: 2.0 },
  },
  FAST_MOBS: {
    id: 'FAST_MOBS',
    name: 'Speed Demons',
    description: 'Mobs move 50% faster',
    color: '#44ff44',
    effect: { mobSpeedMultiplier: 1.5 },
  },
  ELITE_SWARM: {
    id: 'ELITE_SWARM',
    name: 'Elite Swarm',
    description: '+25% elite spawn chance',
    color: '#ff8844',
    effect: { eliteChanceBonus: 0.25 },
  },
  POWERUP_RAIN: {
    id: 'POWERUP_RAIN',
    name: 'Loot Goblins',
    description: 'Powerups spawn 3x faster',
    color: '#44ffff',
    effect: { powerupSpawnMultiplier: 3.0 },
  },
  FOG_OF_WAR: {
    id: 'FOG_OF_WAR',
    name: 'Fog of War',
    description: 'Limited visibility',
    color: '#888888',
    effect: { visibilityRadius: 250 },
  },
  REGENERATION: {
    id: 'REGENERATION',
    name: 'Regeneration',
    description: 'All players slowly heal',
    color: '#88ff88',
    effect: { regenPerSecond: 3 },
  },
  BIG_HEADS: {
    id: 'BIG_HEADS',
    name: 'Big Heads',
    description: '2x head hitbox, 2x headshot damage',
    color: '#ff00ff',
    effect: { headHitboxMultiplier: 2.0, headshotDamageMultiplier: 2.0 },
    category: 'FUN',
  },
  LOW_GRAVITY: {
    id: 'LOW_GRAVITY',
    name: 'Low Gravity',
    description: 'Higher jumps, floaty movement',
    color: '#aaaaff',
    effect: { gravityMultiplier: 0.5, jumpMultiplier: 1.5 },
    category: 'FUN',
  },
  EXPLOSIVE_BARRELS: {
    id: 'EXPLOSIVE_BARRELS',
    name: 'Kaboom',
    description: '3x barrel spawns, chain reactions',
    color: '#ff6600',
    effect: { barrelMultiplier: 3, chainReaction: true },
    category: 'CHAOS',
  },
  ONE_HIT_MODE: {
    id: 'ONE_HIT_MODE',
    name: 'One Hit Wonder',
    description: 'All damage = instant death',
    color: '#ff0000',
    effect: { oneHitKill: true },
    category: 'INTENSE',
  },
  INFINITE_AMMO: {
    id: 'INFINITE_AMMO',
    name: 'Unlimited Power',
    description: 'No reload, no cooldowns',
    color: '#00ffff',
    effect: { noCooldowns: true },
    category: 'MAYHEM',
  },
  TINY_PLAYERS: {
    id: 'TINY_PLAYERS',
    name: 'Tiny Mode',
    description: '0.5x player size, harder to hit',
    color: '#ffaaff',
    effect: { playerScale: 0.5, hitboxScale: 0.5 },
    category: 'FUN',
  },
  RICOCHET_MADNESS: {
    id: 'RICOCHET_MADNESS',
    name: 'Ricochet Madness',
    description: 'All bullets bounce 5 times',
    color: '#ffff00',
    effect: { ricochetCount: 5 },
    category: 'CHAOS',
  },
  MIRROR_MODE: {
    id: 'MIRROR_MODE',
    name: 'Mirror Mode',
    description: 'Controls randomly invert',
    color: '#8888ff',
    effect: { randomInvert: true, invertInterval: 10000 },
    category: 'CHAOS',
  },
};
