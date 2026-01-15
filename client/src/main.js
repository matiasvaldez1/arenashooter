import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { LobbyScene } from './scenes/LobbyScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GAME_CONFIG } from '../../shared/constants.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#2d2d44',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.ENVELOP,
    width: GAME_CONFIG.WIDTH,
    height: GAME_CONFIG.HEIGHT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    expandParent: true,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, MenuScene, LobbyScene, GameScene],
};

const game = new Phaser.Game(config);
