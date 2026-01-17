import { SpriteGenerator } from '../utils/SpriteGenerator.js';
import { SocketManager } from '../network/SocketManager.js';
import { t } from '../utils/i18n.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const loadingText = this.add.text(400, 300, t('boot.loading'), {
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
          .text(400, 350, t('boot.connectionFailed'), {
            fontSize: '16px',
            fill: '#ff4444',
            fontFamily: 'Courier New',
          })
          .setOrigin(0.5);
      });
  }
}
