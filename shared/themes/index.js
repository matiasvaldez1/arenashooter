import { POLITICS_THEME } from './politics.js';
import { KPOP_THEME } from './kpop.js';

export const THEMES = {
  POLITICS: POLITICS_THEME,
  KPOP: KPOP_THEME,
};

let activeThemeId = 'KPOP';

export function getActiveTheme() {
  return THEMES[activeThemeId];
}

export function setActiveTheme(themeId) {
  if (THEMES[themeId]) {
    activeThemeId = themeId;
    return true;
  }
  return false;
}

export function getActiveThemeId() {
  return activeThemeId;
}

export function getActiveCharacters() {
  const theme = getActiveTheme();
  return Object.fromEntries(
    Object.entries(theme.characters).filter(([_, c]) => c.enabled !== false)
  );
}

export function getCharacter(classType) {
  const theme = getActiveTheme();
  return theme.characters[classType];
}

export function getCharacterList() {
  return Object.keys(getActiveCharacters());
}

export function getActiveMaps() {
  return getActiveTheme().maps;
}

export function getMap(mapId) {
  return getActiveTheme().maps[mapId];
}

export function getActiveMobs() {
  return getActiveTheme().mobs;
}

export function getMob(mobType) {
  return getActiveTheme().mobs[mobType];
}

export function getUltimate(classType) {
  const character = getCharacter(classType);
  return character?.ultimate;
}

export const ABILITY_TYPES = {
  DASH: 'DASH',
  CHAINSAW: 'CHAINSAW',
  TURRET: 'TURRET',
  DANCE_ZONE: 'DANCE_ZONE',
  SCREAM: 'SCREAM',
  HEAL_ZONE: 'HEAL_ZONE',
  MISSILE_BARRAGE: 'MISSILE_BARRAGE',
  FREEZE_ZONE: 'FREEZE_ZONE',
  RAPID_FIRE: 'RAPID_FIRE',
};

export const ULTIMATE_EFFECTS = {
  GOLDEN_BALL: 'GOLDEN_BALL',
  DOLLARIZATION: 'DOLLARIZATION',
  MAGA_MECH: 'MAGA_MECH',
  EXECUTIVE_ORDER: 'EXECUTIVE_ORDER',
  NUCLEAR_STRIKE: 'NUCLEAR_STRIKE',
  DYNAMITE: 'DYNAMITE',
  FANCY: 'FANCY',
  OO_EFFECT: 'OO_EFFECT',
  MONEY: 'MONEY',
  BLACK_MAMBA: 'BLACK_MAMBA',
};
