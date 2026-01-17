import { SocketManager } from '../network/SocketManager.js';
import { SoundManager } from '../utils/SoundManager.js';
import { GAME_CONFIG } from '../../../shared/constants.js';
import { t, toggleLanguage, getLanguage } from '../utils/i18n.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    // Center coordinates
    this.centerX = GAME_CONFIG.WIDTH / 2;
    this.centerY = GAME_CONFIG.HEIGHT / 2;

    // Consistent spacing values
    this.gap = 55; // Gap between elements

    // Store text elements that need translation updates
    this.translatableTexts = [];

    // Animated background
    this.createAnimatedBackground();

    // Floating particles
    this.createParticles();

    // Title with glow effect
    this.createTitle();

    // Build UI from top, starting below title
    let y = 200;

    // Name label
    this.add.rectangle(this.centerX, y, 280, 30, 0x000000, 0.5);
    this.nameLabelText = this.add.text(this.centerX, y, t('menu.enterName'), {
      fontSize: '18px', fill: '#00ff88', fontFamily: 'Courier New'
    }).setOrigin(0.5);
    this.translatableTexts.push({ text: this.nameLabelText, key: 'menu.enterName' });

    y += this.gap;

    // Name input
    this.nameInput = this.createStyledInput(this.centerX, y, `Jugador${Math.floor(Math.random() * 1000)}`);

    y += this.gap + 20;

    // Create Room button
    this.createRoomBtn = this.createNeonButton(this.centerX, y, t('menu.createRoom'), '#00ff88', () => this.createRoom());
    this.translatableTexts.push({ text: this.createRoomBtn.getAt(2), key: 'menu.createRoom' });

    y += this.gap + 10;

    // Divider
    this.dividerText = this.add.text(this.centerX, y, t('menu.or'), {
      fontSize: '16px', fill: '#888888', fontFamily: 'Courier New'
    }).setOrigin(0.5);
    this.translatableTexts.push({ text: this.dividerText, key: 'menu.or' });

    y += this.gap - 10;

    // Room code label
    this.add.rectangle(this.centerX, y, 280, 30, 0x000000, 0.5);
    this.roomLabelText = this.add.text(this.centerX, y, t('menu.enterRoomCode'), {
      fontSize: '18px', fill: '#ffaa00', fontFamily: 'Courier New'
    }).setOrigin(0.5);
    this.translatableTexts.push({ text: this.roomLabelText, key: 'menu.enterRoomCode' });

    y += this.gap;

    // Room code input
    this.roomInput = this.createStyledInput(this.centerX, y, '');

    y += this.gap + 20;

    // Join button
    this.joinRoomBtn = this.createNeonButton(this.centerX, y, t('menu.joinRoom'), '#ffaa00', () => this.joinRoom());
    this.translatableTexts.push({ text: this.joinRoomBtn.getAt(2), key: 'menu.joinRoom' });

    // Status text
    this.statusText = this.add
      .text(this.centerX, GAME_CONFIG.HEIGHT - 60, '', {
        fontSize: '18px',
        fill: '#ff4444',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5);

    // Start music button
    this.createMusicButton();

    // Language toggle button
    this.createLanguageButton();

    // Check URL for room code
    this.checkUrlForRoom();

    // Add pulsing animation to everything
    this.addPulseAnimations();
  }

  createAnimatedBackground() {
    const W = GAME_CONFIG.WIDTH;
    const H = GAME_CONFIG.HEIGHT;

    // Gradient background
    const graphics = this.add.graphics();

    // Base dark gradient
    graphics.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e);
    graphics.fillRect(0, 0, W, H);

    // Animated scan lines
    for (let y = 0; y < H; y += 4) {
      graphics.fillStyle(0x000000, 0.1);
      graphics.fillRect(0, y, W, 2);
    }

    // Neon border animation
    this.neonBorder = this.add.graphics();
    this.drawNeonBorder(0);

    // Animate border
    this.tweens.addCounter({
      from: 0,
      to: 100,
      duration: 3000,
      repeat: -1,
      onUpdate: (tween) => {
        this.drawNeonBorder(tween.getValue());
      },
    });
  }

  drawNeonBorder(phase) {
    const W = GAME_CONFIG.WIDTH;
    const H = GAME_CONFIG.HEIGHT;

    this.neonBorder.clear();

    const colors = [0xff00ff, 0x00ffff, 0xffff00, 0xff0088];
    const colorIndex = Math.floor(phase / 25) % colors.length;

    this.neonBorder.lineStyle(4, colors[colorIndex], 0.8);
    this.neonBorder.strokeRect(20, 20, W - 40, H - 40);

    this.neonBorder.lineStyle(2, colors[(colorIndex + 1) % colors.length], 0.6);
    this.neonBorder.strokeRect(30, 30, W - 60, H - 60);
  }

  createParticles() {
    const W = GAME_CONFIG.WIDTH;
    const H = GAME_CONFIG.HEIGHT;

    // Floating neon particles
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const colors = [0xff00ff, 0x00ffff, 0xffff00, 0x00ff88];
      const color = colors[Math.floor(Math.random() * colors.length)];

      const particle = this.add.circle(x, y, 2 + Math.random() * 3, color, 0.6);

      this.tweens.add({
        targets: particle,
        y: particle.y - 100 - Math.random() * 200,
        alpha: 0,
        duration: 3000 + Math.random() * 2000,
        repeat: -1,
        onRepeat: () => {
          particle.x = Math.random() * W;
          particle.y = H + Math.random() * 50;
          particle.alpha = 0.6;
        },
      });
    }
  }

  createTitle() {
    // Shadow
    this.add
      .text(this.centerX + 4, 74, t('game.title'), {
        fontSize: '56px',
        fill: '#000000',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0.5);

    // Main title
    this.titleText = this.add
      .text(this.centerX, 70, t('game.title'), {
        fontSize: '56px',
        fill: '#ff00ff',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Subtitle with color cycle
    this.subtitleText = this.add
      .text(this.centerX, 130, t('game.subtitle'), {
        fontSize: '24px',
        fill: '#00ffff',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5);
    this.translatableTexts.push({ text: this.subtitleText, key: 'game.subtitle' });

    // Animate title colors
    const titleColors = ['#ff00ff', '#ff0088', '#ff4444', '#ffaa00', '#ffff00', '#00ff88', '#00ffff'];
    let colorIndex = 0;

    this.time.addEvent({
      delay: 200,
      callback: () => {
        colorIndex = (colorIndex + 1) % titleColors.length;
        this.titleText.setStyle({ fill: titleColors[colorIndex] });
        this.subtitleText.setStyle({ fill: titleColors[(colorIndex + 3) % titleColors.length] });
      },
      loop: true,
    });

    // Bouncing decorative text
    const decoLeft = this.add.text(this.centerX - 300, 70, '>>>', { fontSize: '32px', fill: '#ffff00', fontFamily: 'Courier New' });
    const decoRight = this.add.text(this.centerX + 250, 70, '<<<', { fontSize: '32px', fill: '#ffff00', fontFamily: 'Courier New' });

    this.tweens.add({
      targets: [decoLeft, decoRight],
      x: '+=10',
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  createStyledInput(x, y, defaultValue) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = defaultValue;
    input.maxLength = 20;
    input.style.cssText = `
      position: absolute;
      width: 220px;
      padding: 12px 15px;
      font-size: 18px;
      font-family: 'Courier New', monospace;
      background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
      border: 2px solid #00ffff;
      border-radius: 5px;
      color: #ffffff;
      text-align: center;
      outline: none;
      box-shadow: 0 0 10px #00ffff44, inset 0 0 20px #00000088;
      transition: all 0.3s ease;
    `;

    input.addEventListener('focus', () => {
      input.style.borderColor = '#ff00ff';
      input.style.boxShadow = '0 0 20px #ff00ff66, inset 0 0 20px #00000088';
      SoundManager.playUIClick();
    });

    input.addEventListener('blur', () => {
      input.style.borderColor = '#00ffff';
      input.style.boxShadow = '0 0 10px #00ffff44, inset 0 0 20px #00000088';
    });

    const container = document.getElementById('game-container');
    const canvas = container.querySelector('canvas');
    const rect = canvas.getBoundingClientRect();

    // Calculate scale factor
    const scaleX = rect.width / GAME_CONFIG.WIDTH;
    const scaleY = rect.height / GAME_CONFIG.HEIGHT;

    input.style.left = `${rect.left + (x * scaleX) - 110}px`;
    input.style.top = `${rect.top + (y * scaleY) - 20}px`;
    input.style.transform = `scale(${Math.min(scaleX, scaleY)})`;

    document.body.appendChild(input);

    if (!this.inputs) this.inputs = [];
    this.inputs.push(input);

    return input;
  }

  createNeonButton(x, y, text, color, callback) {
    const container = this.add.container(x, y);

    // Button background
    const bg = this.add.rectangle(0, 0, 220, 50, 0x000000, 0.8);
    bg.setStrokeStyle(3, Phaser.Display.Color.HexStringToColor(color).color);

    // Button text
    const btnText = this.add
      .text(0, 0, text, {
        fontSize: '20px',
        fill: color,
        fontFamily: 'Courier New',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Glow effect (rectangle behind)
    const glow = this.add.rectangle(0, 0, 230, 60, Phaser.Display.Color.HexStringToColor(color).color, 0.1);
    glow.setVisible(false);

    container.add([glow, bg, btnText]);
    container.setSize(220, 50);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      glow.setVisible(true);
      bg.setStrokeStyle(4, Phaser.Display.Color.HexStringToColor(color).color);
      btnText.setScale(1.1);
      SoundManager.playUIHover();
    });

    container.on('pointerout', () => {
      glow.setVisible(false);
      bg.setStrokeStyle(3, Phaser.Display.Color.HexStringToColor(color).color);
      btnText.setScale(1);
    });

    container.on('pointerdown', () => {
      SoundManager.playUIClick();
      this.cameras.main.shake(50, 0.005);
      callback();
    });

    return container;
  }

  createMusicButton() {
    const baseX = GAME_CONFIG.WIDTH - 80;
    const baseY = 30;

    // Volume down button
    const volDown = this.add
      .text(baseX - 40, baseY, '-', {
        fontSize: '28px',
        fill: '#888888',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Volume display
    this.volumeText = this.add
      .text(baseX, baseY, `${Math.round(SoundManager.getVolume() * 100)}%`, {
        fontSize: '18px',
        fill: '#00ffff',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5);

    // Volume up button
    const volUp = this.add
      .text(baseX + 40, baseY, '+', {
        fontSize: '28px',
        fill: '#888888',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    // Music toggle button
    const musicBtn = this.add
      .text(baseX + 80, baseY, '♪', {
        fontSize: '32px',
        fill: '#888888',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    let musicPlaying = false;

    const updateVolumeDisplay = () => {
      const vol = Math.round(SoundManager.getVolume() * 100);
      this.volumeText.setText(`${vol}%`);
    };

    volDown.on('pointerdown', () => {
      SoundManager.playUIClick();
      const newVol = Math.max(0, SoundManager.getVolume() - 0.1);
      SoundManager.setVolume(newVol);
      updateVolumeDisplay();
    });

    volDown.on('pointerover', () => {
      volDown.setScale(1.3);
      volDown.setStyle({ fill: '#ff4444' });
    });

    volDown.on('pointerout', () => {
      volDown.setScale(1);
      volDown.setStyle({ fill: '#888888' });
    });

    volUp.on('pointerdown', () => {
      SoundManager.playUIClick();
      const newVol = Math.min(1, SoundManager.getVolume() + 0.1);
      SoundManager.setVolume(newVol);
      updateVolumeDisplay();
    });

    volUp.on('pointerover', () => {
      volUp.setScale(1.3);
      volUp.setStyle({ fill: '#00ff88' });
    });

    volUp.on('pointerout', () => {
      volUp.setScale(1);
      volUp.setStyle({ fill: '#888888' });
    });

    musicBtn.on('pointerdown', () => {
      if (!musicPlaying) {
        SoundManager.startDubstep();
        musicBtn.setStyle({ fill: '#00ff88' });
        musicPlaying = true;
      } else {
        SoundManager.stopDubstep();
        musicBtn.setStyle({ fill: '#888888' });
        musicPlaying = false;
      }
    });

    musicBtn.on('pointerover', () => {
      musicBtn.setScale(1.2);
    });

    musicBtn.on('pointerout', () => {
      musicBtn.setScale(1);
    });

    // Add label
    this.musicLabel = this.add
      .text(baseX + 20, 55, t('menu.volume'), {
        fontSize: '10px',
        fill: '#666666',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5);
    this.translatableTexts.push({ text: this.musicLabel, key: 'menu.volume' });
  }

  createLanguageButton() {
    const langBtn = this.add
      .text(50, 30, getLanguage() === 'es-AR' ? 'ES' : 'EN', {
        fontSize: '24px',
        fill: '#888888',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    langBtn.on('pointerdown', () => {
      SoundManager.playUIClick();
      const newLang = toggleLanguage();
      langBtn.setText(newLang === 'es-AR' ? 'ES' : 'EN');

      // Update all translatable texts
      this.translatableTexts.forEach(({ text, key }) => {
        text.setText(t(key));
      });
    });

    langBtn.on('pointerover', () => {
      langBtn.setScale(1.2);
      langBtn.setStyle({ fill: '#00ffff' });
    });

    langBtn.on('pointerout', () => {
      langBtn.setScale(1);
      langBtn.setStyle({ fill: '#888888' });
    });

    // Add label
    this.langLabel = this.add
      .text(50, 55, t('misc.language'), {
        fontSize: '10px',
        fill: '#666666',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5);
    this.translatableTexts.push({ text: this.langLabel, key: 'misc.language' });
  }

  addPulseAnimations() {
    // Pulse the create button
    this.tweens.add({
      targets: this.createRoomBtn,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }

  checkUrlForRoom() {
    const params = new URLSearchParams(window.location.search);
    const roomCode = params.get('room');
    if (roomCode) {
      this.roomInput.value = roomCode.toUpperCase();
      // Flash the join button
      this.tweens.add({
        targets: this.joinRoomBtn,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 300,
        yoyo: true,
        repeat: 3,
      });
    }
  }

  async createRoom() {
    const playerName = this.nameInput.value.trim() || 'Player';

    try {
      const roomCode = await SocketManager.createRoom();
      await SocketManager.joinRoom(roomCode, playerName);

      window.history.pushState({}, '', `?room=${roomCode}`);

      this.cleanup();
      this.scene.start('LobbyScene', { roomCode, isHost: true });
    } catch (error) {
      this.showError(error.message);
    }
  }

  async joinRoom() {
    const playerName = this.nameInput.value.trim() || 'Player';
    const roomCode = this.roomInput.value.trim().toUpperCase();

    if (!roomCode) {
      this.showError(t('menu.enterRoomCodeError'));
      return;
    }

    try {
      await SocketManager.joinRoom(roomCode, playerName);

      window.history.pushState({}, '', `?room=${roomCode}`);

      this.cleanup();
      this.scene.start('LobbyScene', { roomCode, isHost: false });
    } catch (error) {
      this.showError(error.message);
    }
  }

  showError(message) {
    this.statusText.setText(message);
    this.statusText.setStyle({ fill: '#ff4444' });

    // Shake effect
    this.cameras.main.shake(200, 0.01);

    // Clear after delay
    this.time.delayedCall(3000, () => {
      this.statusText.setText('');
    });
  }

  cleanup() {
    if (this.inputs) {
      this.inputs.forEach((input) => input.remove());
      this.inputs = [];
    }
  }

  shutdown() {
    this.cleanup();
  }
}
