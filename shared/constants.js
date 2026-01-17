// Shared constants between client and server
// FAMOUS PERSONALITIES EDITION!

export const GAME_CONFIG = {
  WIDTH: 1280,
  HEIGHT: 720,
  TICK_RATE: 20,
  PHYSICS_RATE: 60,
};

export const PLAYER_CLASSES = {
  MESSI: {
    name: 'Messi',
    health: 70,
    speed: 300,
    fireRate: 5,
    damage: 18,
    projectileSpeed: 700,
    color: '#75aaff', // Argentina blue
    ultimate: 'GOLDEN_BALL',
    ultimateCharge: 80,
    dashCooldown: 2000,
    dashDistance: 400,
    projectileType: 'soccer_ball',
    description: 'The GOAT - Fast dribbles, deadly shots!',
  },
  MILEI: {
    name: 'Milei',
    health: 100,
    speed: 210,
    fireRate: 3.5,
    damage: 28,
    projectileSpeed: 600,
    color: '#ffcc00', // Libertarian yellow
    ultimate: 'DOLLARIZATION',
    ultimateCharge: 100,
    chainsawDamage: 40,
    chainsawCooldown: 4000,
    projectileType: 'peso',
    description: 'VIVA LA LIBERTAD! Chainsaw economist!',
  },
  TRUMP: {
    name: 'Trump',
    health: 110,
    speed: 170,
    fireRate: 2,
    damage: 22,
    projectileSpeed: 500,
    color: '#ff6b35', // Orange
    ultimate: 'MAGA_MECH',
    ultimateCharge: 120,
    wallDuration: 12000,
    wallHealth: 150,
    turretDuration: 8000,
    turretDamage: 12,
    turretFireRate: 2,
    projectileType: 'tweet',
    description: 'Build walls, deploy turrets, Make Arena Great Again!',
  },
  BIDEN: {
    name: 'Biden',
    health: 90,
    speed: 180,
    fireRate: 3,
    damage: 16,
    lifeSteal: 0.25,
    projectileSpeed: 450,
    color: '#3d5a99', // Democrat blue
    ultimate: 'EXECUTIVE_ORDER',
    ultimateCharge: 100,
    healZoneDuration: 6000,
    healZoneRate: 15,
    projectileType: 'ice_cream',
    description: 'Heals allies with ice cream, steals life!',
  },
  PUTIN: {
    name: 'Putin',
    health: 130,
    speed: 160,
    fireRate: 0.8,
    damage: 55,
    splashDamage: 35,
    explosionRadius: 90,
    fuseTime: 1800,
    color: '#cc0000', // Soviet red
    ultimate: 'NUCLEAR_STRIKE',
    ultimateCharge: 100,
    bearDuration: 12000,
    bearDamage: 15,
    bearFireRate: 2,
    projectileType: 'missile',
    description: 'Launches missiles, deploys bears!',
  },
};

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

export const ULTIMATES = {
  GOLDEN_BALL: {
    name: 'Golden Ball',
    duration: 4000,
    description: 'Become unstoppable, rapid fire soccer balls everywhere!',
  },
  DOLLARIZATION: {
    name: 'Dollarization',
    duration: 8000,
    description: 'AFUERA! Double damage, money explosion aura!',
  },
  MAGA_MECH: {
    name: 'MAGA Mech',
    duration: 10000,
    description: 'Transform into a giant mech suit!',
  },
  EXECUTIVE_ORDER: {
    name: 'Executive Order',
    duration: 0,
    description: 'Swap health with the lowest enemy!',
  },
  NUCLEAR_STRIKE: {
    name: 'Nuclear Strike',
    duration: 3000,
    description: 'Rain missiles across the entire arena!',
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
  iframeDuration: 200, // invincibility frames during dodge
};

// ==========================================
// ROGUELIKE MODE CONSTANTS
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
  GAME_DURATION_MS: 90 * 1000, // 90 seconds
  WIN_SCORE: null, // null = time-based, or set a score to win
};

export const TEAM_ABILITIES = {
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
  AURAS: {
    MESSI: {
      type: 'SPEED_AURA',
      radius: 150,
      speedBonus: 0.10,
    },
    MILEI: {
      type: 'ECONOMIC_BOOST',
      cooldown: 30000,
      duration: 5000,
      powerupMultiplier: 2.0,
    },
    TRUMP: {
      type: 'WALL_RALLY',
      radius: 120,
      damageBonus: 0.15,
      duration: 8000,
    },
    BIDEN: {
      type: 'HEAL_ZONE',
      slowEnemies: 0.20,
    },
    PUTIN: {
      type: 'FEAR_AURA',
      radius: 100,
      mobDamageReduction: 0.20,
    },
  },
};

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
