import { SpriteGenerator } from '../utils/SpriteGenerator.js';
import { SocketManager } from '../network/SocketManager.js';
import { t } from '../utils/i18n.js';
import { COLORS, fontStyle } from '../config/theme.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const loadingText = this.add.text(400, 300, t('boot.loading'), fontStyle('heading', COLORS.text));
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
          .text(400, 350, t('boot.connectionFailed'), fontStyle('label', COLORS.danger))
          .setOrigin(0.5);
      });
  }
}
