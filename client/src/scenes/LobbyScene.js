import { SocketManager } from '../network/SocketManager.js';
import { SoundManager } from '../utils/SoundManager.js';
import { PLAYER_CLASSES, ULTIMATES, GAME_CONFIG, GAME_MODES } from '../../../shared/constants.js';
import { MAPS } from '../../../shared/maps.js';
import { t, getLanguage } from '../utils/i18n.js';

export class LobbyScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LobbyScene' });
  }

  init(data) {
    this.roomCode = data.roomCode;
    this.isHost = data.isHost;
    this.selectedClass = 'MESSI';
    this.selectedMap = 'ARENA';
    this.selectedGameMode = 'ARENA';
    this.players = [];
    this.isReady = false;
    this.classCards = {};
    this.mapCards = {};
    this.gameModeCards = {};
  }

  create() {
    // Store dimensions
    this.W = GAME_CONFIG.WIDTH;
    this.H = GAME_CONFIG.HEIGHT;
    this.centerX = this.W / 2;

    // Animated background
    this.createBackground();

    // Room code header
    this.createRoomHeader();

    // Character selection
    this.createCharacterSelection();

    // Game mode selection (host only can change)
    this.createGameModeSelection();

    // Map selection (host only can change, others see)
    this.createMapSelection();

    // Players list
    this.createPlayersList();

    // Ready button
    this.createReadyButton();

    // Status text
    this.statusText = this.add
      .text(this.centerX, this.H - 50, '', {
        fontSize: '16px',
        fill: '#00ff88',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5);

    // Setup socket events
    this.setupSocketEvents();

    // Select default class
    SocketManager.selectClass('MESSI');
  }

  createBackground() {
    const graphics = this.add.graphics();

    // Dark gradient
    graphics.fillGradientStyle(0x1a1a2e, 0x16213e, 0x1a1a2e, 0x16213e);
    graphics.fillRect(0, 0, this.W, this.H);

    // Grid pattern
    graphics.lineStyle(1, 0xffffff, 0.05);
    for (let x = 0; x < this.W; x += 40) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, this.H);
    }
    for (let y = 0; y < this.H; y += 40) {
      graphics.moveTo(0, y);
      graphics.lineTo(this.W, y);
    }
    graphics.strokePath();

    // Animated neon lines
    this.neonLines = [];
    const colors = [0xff00ff, 0x00ffff, 0xffff00];

    for (let i = 0; i < 6; i++) {
      const line = this.add.graphics();
      line.lineStyle(2, colors[i % colors.length], 0.3);
      line.moveTo(0, 100 + i * 110);
      line.lineTo(this.W, 100 + i * 110);
      line.strokePath();

      this.tweens.add({
        targets: line,
        alpha: 0.1,
        duration: 1000 + i * 200,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  createRoomHeader() {
    // Room code box
    const headerBg = this.add.rectangle(this.centerX, 35, 350, 50, 0x000000, 0.7);
    headerBg.setStrokeStyle(3, 0xff00ff);

    this.add
      .text(this.centerX, 22, t('lobby.title').replace(':', ''), {
        fontSize: '16px',
        fill: '#888888',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5);

    // Animated room code
    this.roomCodeText = this.add
      .text(this.centerX, 45, this.roomCode, {
        fontSize: '32px',
        fill: '#00ffff',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Color cycle for room code
    const colors = ['#00ffff', '#ff00ff', '#ffff00', '#00ff88'];
    let colorIndex = 0;
    this.time.addEvent({
      delay: 500,
      callback: () => {
        colorIndex = (colorIndex + 1) % colors.length;
        this.roomCodeText.setStyle({ fill: colors[colorIndex] });
      },
      loop: true,
    });

    // Copy link button
    this.createCopyButton();
  }

  createCopyButton() {
    const btn = this.add.container(this.centerX, 75);

    const bg = this.add.rectangle(0, 0, 180, 24, 0x000000, 0.5);
    bg.setStrokeStyle(2, 0x00ff88);

    const copyLabel = `${t('lobby.copy').toUpperCase()} LINK`;
    const text = this.add
      .text(0, 0, copyLabel, {
        fontSize: '14px',
        fill: '#00ff88',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5);

    btn.add([bg, text]);
    btn.setSize(180, 24);
    btn.setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => {
      bg.setStrokeStyle(3, 0x00ff88);
      SoundManager.playUIHover();
    });

    btn.on('pointerout', () => {
      bg.setStrokeStyle(2, 0x00ff88);
    });

    btn.on('pointerdown', () => {
      const link = `${window.location.origin}?room=${this.roomCode}`;
      navigator.clipboard.writeText(link);
      text.setText(t('lobby.copied').toUpperCase());
      SoundManager.playUIClick();
      this.time.delayedCall(1500, () => {
        text.setText(copyLabel);
      });
    });
  }

  createCharacterSelection() {
    // Section header
    const headerBg = this.add.rectangle(this.centerX, 95, 350, 24, 0xff00ff, 0.2);

    this.add
      .text(this.centerX, 95, t('lobby.selectCharacter'), {
        fontSize: '16px',
        fill: '#ff00ff',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Class cards - 5 famous personalities in a row, centered
    const classTypes = ['MESSI', 'MILEI', 'TRUMP', 'BIDEN', 'PUTIN'];
    const colors = ['#75aaff', '#ffcc00', '#ff6b35', '#3d5a99', '#cc0000'];
    const spacing = 160;
    const totalWidth = (classTypes.length - 1) * spacing;
    const startX = this.centerX - totalWidth / 2;

    classTypes.forEach((classType, index) => {
      const x = startX + index * spacing;
      this.classCards[classType] = this.createClassCard(
        x, 190, classType, classType.toLowerCase(), colors[index]
      );
    });

    // Stats display
    this.statsContainer = this.add.container(this.centerX, 310);
    this.updateStatsDisplay('MESSI');
  }

  createClassCard(x, y, classType, textureKey, color) {
    const container = this.add.container(x, y);
    const stats = PLAYER_CLASSES[classType];

    // Card background with glow
    const glow = this.add.rectangle(0, 0, 140, 150, Phaser.Display.Color.HexStringToColor(color).color, 0.15);
    glow.setVisible(false);

    const bg = this.add.rectangle(0, 0, 130, 140, 0x000000, 0.8);
    bg.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(color).color);

    // Character sprite
    const sprite = this.add.image(0, -25, textureKey);
    sprite.setScale(1.8);

    // Class name (translated)
    const charNameKey = `char.${classType.toLowerCase()}.name`;
    const nameText = this.add
      .text(0, 40, t(charNameKey), {
        fontSize: '16px',
        fill: color,
        fontFamily: 'Courier New',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Ultimate name (translated)
    const ultKey = this.getUltKeyForClass(classType);
    const ultimateName = t(`ult.${ultKey}`);
    const ultText = this.add
      .text(0, 58, ultimateName, {
        fontSize: '11px',
        fill: '#888888',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5);

    // Selection indicator
    const selector = this.add
      .text(0, -62, '★', {
        fontSize: '16px',
        fill: '#ffff00',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5);
    selector.setVisible(false);

    container.add([glow, bg, sprite, nameText, ultText, selector]);
    container.setSize(130, 140);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      glow.setVisible(true);
      sprite.setScale(2.1);
      SoundManager.playUIHover();
    });

    container.on('pointerout', () => {
      if (this.selectedClass !== classType) {
        glow.setVisible(false);
      }
      sprite.setScale(1.8);
    });

    container.on('pointerdown', () => {
      this.selectClass(classType);
      SoundManager.playUIClick();
    });

    container.selector = selector;
    container.glow = glow;
    container.bg = bg;

    return container;
  }

  selectClass(classType) {
    this.selectedClass = classType;
    SocketManager.selectClass(classType);

    // Update visuals - hide all selectors first
    Object.keys(this.classCards).forEach(type => {
      this.classCards[type].selector.setVisible(type === classType);
      this.classCards[type].glow.setVisible(type === classType);
    });

    this.updateStatsDisplay(classType);
  }

  updateStatsDisplay(classType) {
    this.statsContainer.removeAll(true);

    const stats = PLAYER_CLASSES[classType];
    const ultimate = ULTIMATES[stats.ultimate];
    const color = stats.color;

    const bg = this.add.rectangle(0, 0, 900, 70, 0x000000, 0.6);
    bg.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(color).color);

    // Stats line 1 - basic stats
    const statsLine1 = this.add
      .text(
        0,
        -18,
        `HP: ${stats.health}  |  SPD: ${stats.speed}  |  DMG: ${stats.damage}  |  RATE: ${stats.fireRate}/s`,
        {
          fontSize: '16px',
          fill: '#ffffff',
          fontFamily: 'Courier New',
        }
      )
      .setOrigin(0.5);

    // Stats line 2 - description (translated)
    const descKey = `char.${classType.toLowerCase()}.desc`;
    const description = t(descKey);
    const statsLine2 = this.add
      .text(0, 4, description, {
        fontSize: '15px',
        fill: '#aaaaaa',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5);

    // Stats line 3 - ultimate info (translated)
    const ultNameKey = `ult.${this.getUltimateKey(stats.ultimate)}`;
    const ultDescKey = `ult.${this.getUltimateKey(stats.ultimate)}Desc`;
    const ultInfo = ultimate ? `[Q] ULTIMATE: ${t(ultNameKey)} - ${t(ultDescKey)}` : '';
    const statsLine3 = this.add
      .text(0, 26, ultInfo, {
        fontSize: '14px',
        fill: color,
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5);

    this.statsContainer.add([bg, statsLine1, statsLine2, statsLine3]);
  }

  getUltimateKey(ultimate) {
    const keyMap = {
      'GOLDEN_BALL': 'goldenBall',
      'DOLLARIZATION': 'dollarization',
      'MAGA_MECH': 'magaMech',
      'EXECUTIVE_ORDER': 'executiveOrder',
      'NUCLEAR_STRIKE': 'nuclearStrike',
    };
    return keyMap[ultimate] || ultimate.toLowerCase();
  }

  getUltKeyForClass(classType) {
    const classToUlt = {
      'MESSI': 'goldenBall',
      'MILEI': 'dollarization',
      'TRUMP': 'magaMech',
      'BIDEN': 'executiveOrder',
      'PUTIN': 'nuclearStrike',
    };
    return classToUlt[classType] || 'goldenBall';
  }

  createGameModeSelection() {
    // Section header
    const headerBg = this.add.rectangle(this.centerX, 365, 300, 24, 0xff8800, 0.2);

    this.add
      .text(this.centerX, 365, '[ GAME MODE ]', {
        fontSize: '16px',
        fill: '#ff8800',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Game mode cards
    const modeKeys = Object.keys(GAME_MODES);
    const spacing = 280;
    const totalWidth = (modeKeys.length - 1) * spacing;
    const startX = this.centerX - totalWidth / 2;

    modeKeys.forEach((modeKey, index) => {
      const x = startX + index * spacing;
      this.gameModeCards[modeKey] = this.createGameModeCard(x, 420, modeKey);
    });

    // If not host, show message
    if (!this.isHost) {
      this.add
        .text(this.centerX, 470, 'Host chooses the game mode', {
          fontSize: '12px',
          fill: '#888888',
          fontFamily: 'Courier New',
        })
        .setOrigin(0.5);
    }
  }

  createGameModeCard(x, y, modeKey) {
    const mode = GAME_MODES[modeKey];
    const container = this.add.container(x, y);
    const isWave = modeKey === 'WAVE_SURVIVAL';
    const color = isWave ? '#ff00ff' : '#00ffff';

    // Card background with glow
    const glow = this.add.rectangle(0, 0, 250, 80, Phaser.Display.Color.HexStringToColor(color).color, 0.2);
    glow.setVisible(modeKey === this.selectedGameMode);

    const bg = this.add.rectangle(0, 0, 240, 70, 0x000000, 0.8);
    bg.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(color).color);

    // Mode name
    const nameText = this.add
      .text(0, -18, mode.name, {
        fontSize: '16px',
        fill: color,
        fontFamily: 'Courier New',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Mode description
    const descText = this.add
      .text(0, 8, mode.description, {
        fontSize: '11px',
        fill: '#aaaaaa',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5);

    // Selection indicator
    const selector = this.add
      .text(0, -35, '★', {
        fontSize: '14px',
        fill: '#ffff00',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5);
    selector.setVisible(modeKey === this.selectedGameMode);

    container.add([glow, bg, nameText, descText, selector]);
    container.setSize(240, 70);

    // Only host can interact
    if (this.isHost) {
      container.setInteractive({ useHandCursor: true });

      container.on('pointerover', () => {
        glow.setVisible(true);
        SoundManager.playUIHover();
      });

      container.on('pointerout', () => {
        if (this.selectedGameMode !== modeKey) {
          glow.setVisible(false);
        }
      });

      container.on('pointerdown', () => {
        this.selectGameMode(modeKey);
        SoundManager.playUIClick();
      });
    }

    container.selector = selector;
    container.glow = glow;

    return container;
  }

  selectGameMode(modeKey) {
    console.log('Selecting game mode:', modeKey);
    this.selectedGameMode = modeKey;
    SocketManager.emit('room:selectGameMode', { mode: modeKey });

    // Update visuals
    Object.keys(this.gameModeCards).forEach(key => {
      this.gameModeCards[key].selector.setVisible(key === modeKey);
      this.gameModeCards[key].glow.setVisible(key === modeKey);
    });
  }

  updateSelectedGameMode(modeKey) {
    this.selectedGameMode = modeKey;

    // Update visuals
    Object.keys(this.gameModeCards).forEach(key => {
      this.gameModeCards[key].selector.setVisible(key === modeKey);
      this.gameModeCards[key].glow.setVisible(key === modeKey);
    });
  }

  createMapSelection() {
    const isSpanish = getLanguage() === 'es-AR';

    // Section header - adjusted Y position
    const headerBg = this.add.rectangle(this.centerX, 490, 300, 24, 0x00ffff, 0.2);

    this.add
      .text(this.centerX, 490, isSpanish ? '[ SELECCIONAR MAPA ]' : '[ SELECT MAP ]', {
        fontSize: '16px',
        fill: '#00ffff',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Map cards - horizontal scroll
    const mapKeys = Object.keys(MAPS);
    const spacing = 200;
    const totalWidth = (mapKeys.length - 1) * spacing;
    const startX = this.centerX - totalWidth / 2;

    mapKeys.forEach((mapKey, index) => {
      const x = startX + index * spacing;
      this.mapCards[mapKey] = this.createMapCard(x, 555, mapKey);
    });

    // If not host, show "waiting for host" message
    if (!this.isHost) {
      this.mapHostText = this.add
        .text(this.centerX, 610, isSpanish ? 'El anfitrion elige el mapa' : 'Host chooses the map', {
          fontSize: '12px',
          fill: '#888888',
          fontFamily: 'Courier New',
        })
        .setOrigin(0.5);
    }
  }

  createMapCard(x, y, mapKey) {
    const map = MAPS[mapKey];
    const isSpanish = getLanguage() === 'es-AR';
    const container = this.add.container(x, y);

    // Card background with glow
    const glow = this.add.rectangle(0, 0, 180, 100, Phaser.Display.Color.HexStringToColor(map.color).color, 0.2);
    glow.setVisible(false);

    const bg = this.add.rectangle(0, 0, 170, 90, 0x000000, 0.8);
    bg.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(map.color).color);

    // Map name
    const nameText = this.add
      .text(0, -25, isSpanish ? map.name : map.nameEn, {
        fontSize: '14px',
        fill: map.color,
        fontFamily: 'Courier New',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Map description (short)
    const descText = this.add
      .text(0, 5, map.hasMobs ? (isSpanish ? 'Con enemigos!' : 'With enemies!') : (isSpanish ? 'Clasico' : 'Classic'), {
        fontSize: '11px',
        fill: '#888888',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5);

    // Mob indicator
    const mobText = this.add
      .text(0, 25, map.hasMobs ? '⚠️' : '✓', {
        fontSize: '16px',
        fill: map.hasMobs ? '#ff8800' : '#00ff88',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5);

    // Selection indicator
    const selector = this.add
      .text(0, -42, '★', {
        fontSize: '14px',
        fill: '#ffff00',
        fontFamily: 'Arial',
      })
      .setOrigin(0.5);
    selector.setVisible(mapKey === this.selectedMap);

    container.add([glow, bg, nameText, descText, mobText, selector]);
    container.setSize(170, 90);

    // Only host can interact
    if (this.isHost) {
      container.setInteractive({ useHandCursor: true });

      container.on('pointerover', () => {
        glow.setVisible(true);
        SoundManager.playUIHover();
      });

      container.on('pointerout', () => {
        if (this.selectedMap !== mapKey) {
          glow.setVisible(false);
        }
      });

      container.on('pointerdown', () => {
        this.selectMap(mapKey);
        SoundManager.playUIClick();
      });
    }

    container.selector = selector;
    container.glow = glow;

    return container;
  }

  selectMap(mapKey) {
    console.log('Selecting map:', mapKey);
    this.selectedMap = mapKey;
    SocketManager.selectMap(mapKey);

    // Update visuals
    Object.keys(this.mapCards).forEach(key => {
      this.mapCards[key].selector.setVisible(key === mapKey);
      this.mapCards[key].glow.setVisible(key === mapKey);
    });
  }

  createPlayersList() {
    // Compact players display on the right side
    this.add
      .text(this.W - 140, 100, t('lobby.players').toUpperCase(), {
        fontSize: '14px',
        fill: '#ffff00',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Players container - right side
    this.playersContainer = this.add.container(this.W - 140, 130);
  }

  createReadyButton() {
    this.readyBtn = this.add.container(this.centerX, this.H - 80);

    const glow = this.add.rectangle(0, 0, 180, 50, 0x00ff88, 0.2);
    glow.setVisible(false);

    const bg = this.add.rectangle(0, 0, 160, 40, 0x000000, 0.8);
    bg.setStrokeStyle(3, 0x00ff88);

    this.readyText = this.add
      .text(0, 0, t('lobby.ready'), {
        fontSize: '24px',
        fill: '#00ff88',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.readyBtn.add([glow, bg, this.readyText]);
    this.readyBtn.setSize(160, 40);
    this.readyBtn.setInteractive({ useHandCursor: true });

    this.readyBtn.glow = glow;
    this.readyBtn.bg = bg;

    this.readyBtn.on('pointerover', () => {
      glow.setVisible(true);
      SoundManager.playUIHover();
    });

    this.readyBtn.on('pointerout', () => {
      if (!this.isReady) glow.setVisible(false);
    });

    this.readyBtn.on('pointerdown', () => {
      this.toggleReady();
      SoundManager.playUIClick();
    });

    // Pulse animation
    this.tweens.add({
      targets: this.readyBtn,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });
  }

  toggleReady() {
    this.isReady = !this.isReady;
    SocketManager.setReady(this.isReady);

    if (this.isReady) {
      this.readyText.setText(t('lobby.notReady'));
      this.readyText.setStyle({ fill: '#ff8844' });
      this.readyBtn.bg.setStrokeStyle(3, 0xff8844);
      this.readyBtn.glow.setFillStyle(0xff8844, 0.2);
      this.readyBtn.glow.setVisible(true);
    } else {
      this.readyText.setText(t('lobby.ready'));
      this.readyText.setStyle({ fill: '#00ff88' });
      this.readyBtn.bg.setStrokeStyle(3, 0x00ff88);
      this.readyBtn.glow.setFillStyle(0x00ff88, 0.2);
      this.readyBtn.glow.setVisible(false);
    }
  }

  setupSocketEvents() {
    SocketManager.on('room:playerJoined', (data) => {
      this.updatePlayersList(data.players);
      if (data.selectedMap) {
        this.updateSelectedMap(data.selectedMap);
      }
      if (data.gameMode) {
        this.updateSelectedGameMode(data.gameMode);
      }
      this.statusText.setText(`${data.playerName} joined!`);
      this.time.delayedCall(2000, () => this.statusText.setText(''));
    });

    SocketManager.on('room:playerUpdated', (data) => {
      this.updatePlayersList(data.players);
    });

    SocketManager.on('room:mapChanged', (data) => {
      this.updateSelectedMap(data.mapId);
      const isSpanish = getLanguage() === 'es-AR';
      const map = MAPS[data.mapId];
      const mapName = isSpanish ? map.name : map.nameEn;
      this.statusText.setText(`${isSpanish ? 'Mapa: ' : 'Map: '}${mapName}`);
      this.time.delayedCall(2000, () => this.statusText.setText(''));
    });

    SocketManager.on('room:gameModeChanged', (data) => {
      this.updateSelectedGameMode(data.mode);
      const mode = GAME_MODES[data.mode];
      this.statusText.setText(`Mode: ${mode.name}`);
      this.time.delayedCall(2000, () => this.statusText.setText(''));
    });

    SocketManager.on('room:playerLeft', (data) => {
      this.updatePlayersList(data.players);
      this.statusText.setText('A player left...');
      this.time.delayedCall(2000, () => this.statusText.setText(''));
    });

    SocketManager.on('game:start', (data) => {
      // Epic transition effect
      this.cameras.main.shake(300, 0.02);
      this.cameras.main.flash(500, 255, 255, 255);

      this.time.delayedCall(300, () => {
        this.scene.start('GameScene', {
          players: data.players,
          mapId: data.mapId,
          gameMode: data.gameMode,
          modifiers: data.modifiers || [],
        });
      });
    });
  }

  updatePlayersList(players) {
    this.playersContainer.removeAll(true);
    this.players = players;

    players.forEach((player, index) => {
      const y = index * 30;
      const isMe = player.id === SocketManager.playerId;
      const stats = PLAYER_CLASSES[player.classType || 'MESSI'];
      const classColor = stats?.color || '#00aaff';

      // Background
      const rowBg = this.add.rectangle(0, y, 500, 26, isMe ? 0xffff00 : 0x000000, isMe ? 0.15 : 0.3);

      // Player indicator
      const indicator = this.add
        .text(-240, y, isMe ? '>' : ' ', {
          fontSize: '16px',
          fill: '#ffff00',
          fontFamily: 'Courier New',
        })
        .setOrigin(0, 0.5);

      // Name
      const nameText = this.add
        .text(-220, y, player.name, {
          fontSize: '16px',
          fill: isMe ? '#ffff00' : '#ffffff',
          fontFamily: 'Courier New',
        })
        .setOrigin(0, 0.5);

      // Class
      const classText = this.add
        .text(20, y, player.classType || 'MESSI', {
          fontSize: '16px',
          fill: classColor,
          fontFamily: 'Courier New',
        })
        .setOrigin(0, 0.5);

      // Ready status
      const readyText = this.add
        .text(180, y, player.ready ? t('lobby.ready') : '...', {
          fontSize: '16px',
          fill: player.ready ? '#00ff88' : '#666666',
          fontFamily: 'Courier New',
        })
        .setOrigin(0, 0.5);

      this.playersContainer.add([rowBg, indicator, nameText, classText, readyText]);
    });
  }

  updateSelectedMap(mapId) {
    this.selectedMap = mapId;

    // Update visuals
    Object.keys(this.mapCards).forEach(key => {
      this.mapCards[key].selector.setVisible(key === mapId);
      this.mapCards[key].glow.setVisible(key === mapId);
    });
  }

  shutdown() {
    SocketManager.off('room:playerJoined');
    SocketManager.off('room:playerUpdated');
    SocketManager.off('room:playerLeft');
    SocketManager.off('room:mapChanged');
    SocketManager.off('room:gameModeChanged');
    SocketManager.off('game:start');
  }
}
