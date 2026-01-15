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
    dashCooldown: 2500,
    dashDistance: 160,
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
