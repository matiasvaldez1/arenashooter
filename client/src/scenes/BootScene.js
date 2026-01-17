import { SpriteGenerator } from '../utils/SpriteGenerator.js';
import { SocketManager } from '../network/SocketManager.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const loadingText = this.add.text(400, 300, 'Loading...', {
      fontSize: '24px',
      fill: '#ffffff',
      fontFamily: 'Courier New',
    });
    loadingText.setOrigin(0.5);
  }

  create() {
    SpriteGenerator.generateAll(this);

    SocketManager.connect()
      .then(() => {
        this.scene.start('MenuScene');
      })
      .catch((error) => {
        console.error('Failed to connect:', error);
        this.add
          .text(400, 350, 'Failed to connect to server!', {
            fontSize: '16px',
            fill: '#ff4444',
            fontFamily: 'Courier New',
          })
          .setOrigin(0.5);
      });
  }
}
