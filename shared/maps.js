// Map configurations - now theme-aware
import { getActiveTheme, getActiveMaps, getActiveMobs } from './themes/index.js';

// Dynamic MAPS getter for backward compatibility
export function getMaps() {
  return getActiveMaps();
}

// Backward compatible MAPS export (computed from active theme)
export const MAPS = new Proxy({}, {
  get(target, prop) {
    const maps = getActiveMaps();
    return maps[prop];
  },
  ownKeys() {
    return Object.keys(getActiveMaps());
  },
  getOwnPropertyDescriptor(target, prop) {
    const maps = getActiveMaps();
    if (prop in maps) {
      return { enumerable: true, configurable: true, value: maps[prop] };
    }
    return undefined;
  },
  has(target, prop) {
    return prop in getActiveMaps();
  },
});

// Dynamic MOBS getter
export function getMobs() {
  return getActiveMobs();
}

// Backward compatible MOBS export
export const MOBS = new Proxy({}, {
  get(target, prop) {
    const mobs = getActiveMobs();
    return mobs[prop];
  },
  ownKeys() {
    return Object.keys(getActiveMobs());
  },
  getOwnPropertyDescriptor(target, prop) {
    const mobs = getActiveMobs();
    if (prop in mobs) {
      return { enumerable: true, configurable: true, value: mobs[prop] };
    }
    return undefined;
  },
  has(target, prop) {
    return prop in getActiveMobs();
  },
});

// Dynamic BOSS_MOBS getter
export function getBossMobs() {
  const theme = getActiveTheme();
  return theme.bosses || {};
}

// Backward compatible BOSS_MOBS export
export const BOSS_MOBS = new Proxy({}, {
  get(target, prop) {
    return getBossMobs()[prop];
  },
  ownKeys() {
    return Object.keys(getBossMobs());
  },
  getOwnPropertyDescriptor(target, prop) {
    const bosses = getBossMobs();
    if (prop in bosses) {
      return { enumerable: true, configurable: true, value: bosses[prop] };
    }
    return undefined;
  },
  has(target, prop) {
    return prop in getBossMobs();
  },
});

// Map-specific hazards (shared across themes)
export const MAP_HAZARDS = {
  TEAR_GAS: {
    name: 'Gas Lacrimogeno',
    damage: 5,
    tickRate: 500,
    duration: 8000,
    radius: 100,
    slowPercent: 0.5,
    color: '#AAFFAA',
  },
  FIRE: {
    name: 'Fuego',
    damage: 15,
    tickRate: 500,
    radius: 60,
    color: '#FF4400',
  },
  THROWN_OBJECTS: {
    name: 'Objetos Voladores',
    damage: 8,
    interval: 2000,
    color: '#FFFF00',
  },
  TANK_CROSSING: {
    name: 'Cruce de Tanques',
    damage: 100,
    warningTime: 2000,
    color: '#444444',
  },
  SAND_BUNKER: {
    name: 'Bunker de Arena',
    damage: 0,
    slowPercent: 0.6,
    color: '#F4A460',
  },
  WATER: {
    name: 'Agua',
    damage: 0,
    slowPercent: 0.4,
    color: '#4169E1',
  },
  SPIKES: {
    name: 'Pinchos',
    damage: 25,
    tickRate: 1000,
    color: '#666666',
  },
  TRAFFIC: {
    name: 'Trafico',
    damage: 40,
    color: '#FFFF00',
  },
  ERUPTION: {
    name: 'Erupcion',
    damage: 15,
    tickRate: 500,
    color: '#FF4400',
  },
  FALLING_ROCKS: {
    name: 'Rocas Cayendo',
    damage: 30,
    color: '#8B4513',
  },
  LION: {
    name: 'Leon',
    health: 80,
    damage: 35,
    speed: 180,
    aggroRange: 300,
    color: '#DAA520',
  },
  PYRO: {
    name: 'Pyrotechnics',
    damage: 20,
    tickRate: 500,
    color: '#FF6600',
  },
  CROWD_SURGE: {
    name: 'Crowd Surge',
    damage: 10,
    knockback: 100,
    color: '#FF00FF',
  },
};
