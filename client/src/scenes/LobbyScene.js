import { SocketManager } from '../network/SocketManager.js';
import { SoundManager } from '../utils/SoundManager.js';
import { GAME_CONFIG, GAME_MODES, getCharacterList, getCharacter, getActiveTheme } from '../../../shared/constants.js';
import { MAPS, MOBS } from '../../../shared/maps.js';
import { t, getLanguage } from '../utils/i18n.js';
import { COLORS, fontStyle } from '../config/theme.js';

const STEPS = {
  GAME_MODE: 0,
  MAP: 1,
  CHARACTER: 2,
  READY: 3,
};

const STEP_LABELS = ['MODE', 'MAP', 'CHARACTER', 'READY'];

export class LobbyScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LobbyScene' });
  }

  init(data) {
    this.roomCode = data.roomCode;
    this.isHost = data.isHost;
    this.currentStep = STEPS.GAME_MODE;
    const defaultClass = getCharacterList()[0] || 'MESSI';
    this.selectedClass = defaultClass;
    this.selectedMap = data.selectedMap || 'ARENA';
    this.selectedGameMode = data.gameMode || 'ARENA';
    this.players = data.players || [];
    this.isReady = false;
    this.returnedFromGame = data.returnedFromGame || false;

    // Containers for each step
    this.stepContainers = {};
    this.stepIndicators = [];
  }

  create() {
    this.W = GAME_CONFIG.WIDTH;
    this.H = GAME_CONFIG.HEIGHT;
    this.centerX = this.W / 2;
    this.centerY = this.H / 2;

    // Background
    this.createBackground();

    // Room code header (always visible)
    this.createRoomHeader();

    // Step indicator (always visible)
    this.createStepIndicator();

    // Create all step containers
    this.createGameModeStep();
    this.createMapStep();
    this.createCharacterStep();
    this.createReadyStep();

    // Setup socket events first so we can receive step sync
    this.setupSocketEvents();

    // Non-hosts go directly to CHARACTER step (they can't interact with MODE/MAP)
    if (this.isHost) {
      this.showStep(STEPS.GAME_MODE);
    } else {
      this.showStep(STEPS.CHARACTER);
    }

    // Select default class
    SocketManager.selectClass(this.selectedClass);
  }

  createBackground() {
    const graphics = this.add.graphics();
    const theme = getActiveTheme();
    const bgColors = theme.ui?.bgGradient || ['#1a1a2e', '#16213e'];
    const bg1 = Phaser.Display.Color.HexStringToColor(bgColors[0]).color;
    const bg2 = Phaser.Display.Color.HexStringToColor(bgColors[1]).color;

    // Dark gradient using theme colors
    graphics.fillGradientStyle(bg1, bg2, bg1, bg2);
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

    // Animated neon lines using theme colors
    const primary = Phaser.Display.Color.HexStringToColor(theme.ui?.primary || '#ff00ff').color;
    const secondary = Phaser.Display.Color.HexStringToColor(theme.ui?.secondary || '#00ffff').color;
    const accent = Phaser.Display.Color.HexStringToColor(theme.ui?.accent || '#ffff00').color;
    const lineColors = [primary, secondary, accent];
    for (let i = 0; i < 6; i++) {
      const line = this.add.graphics();
      line.lineStyle(2, lineColors[i % lineColors.length], 0.2);
      line.moveTo(0, 100 + i * 120);
      line.lineTo(this.W, 100 + i * 120);
      line.strokePath();

      this.tweens.add({
        targets: line,
        alpha: 0.05,
        duration: 1000 + i * 200,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  createRoomHeader() {
    const theme = getActiveTheme();
    const primaryColor = Phaser.Display.Color.HexStringToColor(theme.ui?.primary || '#ff00ff').color;

    // Room code box - top left
    const headerContainer = this.add.container(100, 35);

    const headerBg = this.add.rectangle(0, 0, 180, 50, 0x000000, 0.7);
    headerBg.setStrokeStyle(2, primaryColor);

    const label = this.add.text(0, -12, t('lobby.roomCode'), fontStyle('small', COLORS.textMuted)).setOrigin(0.5);

    this.roomCodeText = this.add.text(0, 8, this.roomCode, fontStyle('heading', theme.ui?.primary || COLORS.primary)).setOrigin(0.5);

    headerContainer.add([headerBg, label, this.roomCodeText]);

    // Copy button
    const copyBtn = this.add.container(100, 75);
    const copyBg = this.add.rectangle(0, 0, 120, 22, 0x000000, 0.5);
    copyBg.setStrokeStyle(1, 0x00ff88);
    const copyText = this.add.text(0, 0, t('lobby.copyLink'), fontStyle('small', COLORS.success)).setOrigin(0.5);

    copyBtn.add([copyBg, copyText]);
    copyBtn.setSize(120, 22);
    copyBtn.setInteractive({ useHandCursor: true });

    copyBtn.on('pointerover', () => copyBg.setStrokeStyle(2, 0x00ff88));
    copyBtn.on('pointerout', () => copyBg.setStrokeStyle(1, 0x00ff88));
    copyBtn.on('pointerdown', () => {
      const link = `${window.location.origin}?room=${this.roomCode}`;
      navigator.clipboard.writeText(link);
      copyText.setText(t('lobby.copied'));
      SoundManager.playUIClick();
      this.time.delayedCall(1500, () => copyText.setText(t('lobby.copyLink')));
    });

    // Players count - top right
    this.playersCountText = this.add.text(this.W - 30, 35, '', {
      fontSize: '14px',
      fill: '#ffff00',
      fontFamily: 'Courier New',
    }).setOrigin(1, 0.5);

    // Theme indicator - top right below players
    const themeContainer = this.add.container(this.W - 100, 75);
    const themeBg = this.add.rectangle(0, 0, 180, 28, 0x000000, 0.7);
    const themeColor = Phaser.Display.Color.HexStringToColor(theme.ui?.primary || '#ff69b4').color;
    themeBg.setStrokeStyle(2, themeColor);
    const themeText = this.add.text(0, 0, `${theme.flag || ''} ${theme.name}`, {
      fontSize: '14px',
      fill: theme.ui?.primary || '#ff69b4',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    themeContainer.add([themeBg, themeText]);
  }

  createStepIndicator() {
    const indicatorContainer = this.add.container(this.centerX, 35);

    const totalWidth = 400;
    const stepWidth = totalWidth / STEP_LABELS.length;
    const startX = -totalWidth / 2 + stepWidth / 2;

    STEP_LABELS.forEach((label, index) => {
      const x = startX + index * stepWidth;

      // Circle
      const circle = this.add.circle(x, 0, 14, 0x333333);
      circle.setStrokeStyle(2, 0x666666);

      // Number
      const num = this.add.text(x, 0, (index + 1).toString(), {
        fontSize: '14px',
        fill: '#666666',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      // Label below
      const labelText = this.add.text(x, 24, label, fontStyle('small', COLORS.textDim)).setOrigin(0.5);

      // Connecting line (except for last)
      let line = null;
      if (index < STEP_LABELS.length - 1) {
        line = this.add.rectangle(x + stepWidth / 2, 0, stepWidth - 35, 2, 0x333333);
      }

      this.stepIndicators.push({ circle, num, labelText, line });
      indicatorContainer.add([circle, num, labelText]);
      if (line) indicatorContainer.add(line);
    });
  }

  updateStepIndicator() {
    this.stepIndicators.forEach((indicator, index) => {
      const isActive = index === this.currentStep;
      const isCompleted = index < this.currentStep;

      if (isCompleted) {
        indicator.circle.setFillStyle(0x00ff88);
        indicator.circle.setStrokeStyle(2, 0x00ff88);
        indicator.num.setStyle({ fill: '#000000' });
        indicator.labelText.setStyle({ fill: '#00ff88' });
        if (indicator.line) indicator.line.setFillStyle(0x00ff88);
      } else if (isActive) {
        indicator.circle.setFillStyle(0xff00ff);
        indicator.circle.setStrokeStyle(2, 0xff00ff);
        indicator.num.setStyle({ fill: '#ffffff' });
        indicator.labelText.setStyle({ fill: '#ff00ff' });
        if (indicator.line) indicator.line.setFillStyle(0x333333);
      } else {
        indicator.circle.setFillStyle(0x333333);
        indicator.circle.setStrokeStyle(2, 0x666666);
        indicator.num.setStyle({ fill: '#666666' });
        indicator.labelText.setStyle({ fill: '#666666' });
        if (indicator.line) indicator.line.setFillStyle(0x333333);
      }
    });
  }

  // ==================== STEP 1: GAME MODE ====================
  createGameModeStep() {
    const container = this.add.container(0, 0);
    container.setVisible(false);
    this.stepContainers[STEPS.GAME_MODE] = container;

    // Title
    const title = this.add.text(this.centerX, 100, t('lobby.selectMode'), {
      fontSize: '32px',
      fill: '#ffffff',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(title);

    // Subtitle for non-host
    if (!this.isHost) {
      const subtitle = this.add.text(this.centerX, 135, t('lobby.waitingHost'), {
        fontSize: '16px',
        fill: '#888888',
        fontFamily: 'Courier New',
      }).setOrigin(0.5);
      container.add(subtitle);
      this.gameModeWaitingText = subtitle;
    }

    // Game mode cards - larger, centered
    const modeKeys = Object.keys(GAME_MODES);
    const spacing = 300;
    const totalWidth = (modeKeys.length - 1) * spacing;
    const startX = this.centerX - totalWidth / 2;

    this.gameModeCards = {};
    modeKeys.forEach((modeKey, index) => {
      const x = startX + index * spacing;
      const card = this.createLargeGameModeCard(x, 320, modeKey);
      container.add(card);
      this.gameModeCards[modeKey] = card;
    });

  }

  createLargeGameModeCard(x, y, modeKey) {
    const mode = GAME_MODES[modeKey];
    const container = this.add.container(x, y);
    const isWave = modeKey === 'WAVE_SURVIVAL';
    const isHorde = modeKey === 'INFINITE_HORDE';
    const color = isHorde ? 0xff4400 : (isWave ? 0xff00ff : 0x00ffff);
    const colorHex = isHorde ? '#ff4400' : (isWave ? '#ff00ff' : '#00ffff');

    // Glow
    const glow = this.add.rectangle(0, 0, 290, 220, color, 0.15);
    glow.setVisible(modeKey === this.selectedGameMode);

    // Background
    const bg = this.add.rectangle(0, 0, 280, 210, 0x000000, 0.85);
    bg.setStrokeStyle(3, color);

    // Icon
    const iconEmoji = isHorde ? '💀' : (isWave ? '🌊' : '⚔️');
    const icon = this.add.text(0, -60, iconEmoji, {
      fontSize: '48px',
    }).setOrigin(0.5);

    // Mode name
    const nameText = this.add.text(0, -5, mode.name, {
      fontSize: '24px',
      fill: colorHex,
      fontFamily: 'Courier New',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Description
    const descText = this.add.text(0, 35, mode.description, {
      fontSize: '13px',
      fill: '#aaaaaa',
      fontFamily: 'Courier New',
      wordWrap: { width: 250 },
      align: 'center',
    }).setOrigin(0.5);

    // Player count
    const playerInfo = (isWave || isHorde) ? t('lobby.coop') : t('lobby.ffa');
    const playerText = this.add.text(0, 75, playerInfo, fontStyle('small', COLORS.textDim)).setOrigin(0.5);

    // Selection indicator
    const selector = this.add.text(0, -95, t('lobby.selected'), fontStyle('small', COLORS.warning)).setOrigin(0.5);
    selector.setVisible(modeKey === this.selectedGameMode);

    container.add([glow, bg, icon, nameText, descText, playerText, selector]);

    if (this.isHost) {
      bg.setInteractive({ useHandCursor: true });

      bg.on('pointerover', () => {
        glow.setVisible(true);
        bg.setStrokeStyle(4, color);
        SoundManager.playUIHover();
      });

      bg.on('pointerout', () => {
        if (this.selectedGameMode !== modeKey) {
          glow.setVisible(false);
        }
        bg.setStrokeStyle(3, color);
      });

      bg.on('pointerdown', () => {
        this.selectGameMode(modeKey);
        SoundManager.playUIClick();
      });
    }

    container.glow = glow;
    container.selector = selector;
    container.bg = bg;
    container.color = color;

    return container;
  }

  selectGameMode(modeKey) {
    this.selectedGameMode = modeKey;
    SocketManager.selectGameMode(modeKey);

    Object.keys(this.gameModeCards).forEach(key => {
      this.gameModeCards[key].selector.setVisible(key === modeKey);
      this.gameModeCards[key].glow.setVisible(key === modeKey);
    });

    // Auto-advance to next step
    this.goToStep(STEPS.MAP);
  }

  // ==================== STEP 2: MAP ====================
  createMapStep() {
    const container = this.add.container(0, 0);
    container.setVisible(false);
    this.stepContainers[STEPS.MAP] = container;

    // Title
    const title = this.add.text(this.centerX, 100, t('lobby.selectMap'), {
      fontSize: '32px',
      fill: '#ffffff',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(title);

    // Subtitle for non-host
    if (!this.isHost) {
      const subtitle = this.add.text(this.centerX, 135, t('lobby.waitingHost'), {
        fontSize: '16px',
        fill: '#888888',
        fontFamily: 'Courier New',
      }).setOrigin(0.5);
      container.add(subtitle);
      this.mapWaitingText = subtitle;
    }

    // Map cards - 2 rows of 3
    const mapKeys = Object.keys(MAPS);
    this.mapCards = {};
    const cols = 3;
    const spacingX = 260;
    const spacingY = 180;
    const startX = this.centerX - spacingX;
    const startY = 260;

    mapKeys.forEach((mapKey, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * spacingX;
      const y = startY + row * spacingY;
      const card = this.createLargeMapCard(x, y, mapKey);
      container.add(card);
      this.mapCards[mapKey] = card;
    });

    // Back button (centered since no Next button)
    const backBtn = this.createBackButton(this.centerX, 620, () => this.goToStep(STEPS.GAME_MODE));
    container.add(backBtn);
  }

  createLargeMapCard(x, y, mapKey) {
    const map = MAPS[mapKey];
    if (!map) return this.add.container(x, y);
    const isSpanish = getLanguage() === 'es-AR';
    const container = this.add.container(x, y);
    const color = Phaser.Display.Color.HexStringToColor(map.color || '#ffffff').color;

    // Glow
    const glow = this.add.rectangle(0, 0, 235, 145, color, 0.15);
    glow.setVisible(mapKey === this.selectedMap);

    // Background
    const bg = this.add.rectangle(0, 0, 225, 135, 0x000000, 0.85);
    bg.setStrokeStyle(2, color);

    // Map name
    const nameText = this.add.text(0, -40, isSpanish ? map.name : map.nameEn, {
      fontSize: '18px',
      fill: map.color,
      fontFamily: 'Courier New',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Map description
    const hasEnemies = map.hasMobs;
    const descLines = [];
    if (hasEnemies && map.mobType) {
      const mobConfig = MOBS[map.mobType];
      const mobName = mobConfig?.name || map.mobType;
      descLines.push(`${t('lobby.enemies')} ${mobName}`);
    } else {
      descLines.push(t('lobby.noEnemies'));
    }

    const descText = this.add.text(0, -5, descLines.join('\n'), {
      ...fontStyle('small', COLORS.textMuted),
      align: 'center',
    }).setOrigin(0.5);

    // Features icons
    const features = [];
    if (map.hazards?.lavaPits) features.push('🔥');
    if (map.hazards?.spikeTrap) features.push('⚠️');
    if (hasEnemies) features.push('👾');

    const featuresText = this.add.text(0, 25, features.join(' ') || '✓', {
      fontSize: '20px',
    }).setOrigin(0.5);

    // Selection indicator
    const selector = this.add.text(0, -58, '★', {
      fontSize: '16px',
      fill: '#ffff00',
    }).setOrigin(0.5);
    selector.setVisible(mapKey === this.selectedMap);

    container.add([glow, bg, nameText, descText, featuresText, selector]);

    if (this.isHost) {
      bg.setInteractive({ useHandCursor: true });

      bg.on('pointerover', () => {
        glow.setVisible(true);
        bg.setStrokeStyle(3, color);
        SoundManager.playUIHover();
      });

      bg.on('pointerout', () => {
        if (this.selectedMap !== mapKey) {
          glow.setVisible(false);
        }
        bg.setStrokeStyle(2, color);
      });

      bg.on('pointerdown', () => {
        this.selectMap(mapKey);
        SoundManager.playUIClick();
      });
    }

    container.glow = glow;
    container.selector = selector;
    container.bg = bg;
    container.color = color;

    return container;
  }

  selectMap(mapKey) {
    this.selectedMap = mapKey;
    SocketManager.selectMap(mapKey);

    Object.keys(this.mapCards).forEach(key => {
      this.mapCards[key].selector.setVisible(key === mapKey);
      this.mapCards[key].glow.setVisible(key === mapKey);
    });

    // Auto-advance to next step
    this.goToStep(STEPS.CHARACTER);
  }

  // ==================== STEP 3: CHARACTER ====================
  createCharacterStep() {
    const container = this.add.container(0, 0);
    container.setVisible(false);
    this.stepContainers[STEPS.CHARACTER] = container;

    // Title
    const title = this.add.text(this.centerX, 90, t('lobby.selectCharacter'), {
      fontSize: '32px',
      fill: '#ffffff',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(title);

    // Character cards - dynamically loaded from active theme
    const classTypes = getCharacterList();
    this.classCards = {};
    const spacing = 210;
    const totalWidth = (classTypes.length - 1) * spacing;
    const startX = this.centerX - totalWidth / 2;

    classTypes.forEach((classType, index) => {
      const x = startX + index * spacing;
      const card = this.createLargeClassCard(x, 280, classType);
      container.add(card);
      this.classCards[classType] = card;
    });

    // Stats display at bottom
    this.statsContainer = this.add.container(this.centerX, 480);
    container.add(this.statsContainer);
    const firstClass = classTypes[0] || 'MESSI';
    this.updateStatsDisplay(firstClass);

    // Players list (small, right side)
    this.createMiniPlayersList(container);

    // Back button (only for host - non-hosts can't access MODE/MAP steps)
    if (this.isHost) {
      const backBtn = this.createBackButton(this.centerX - 120, 620, () => this.goToStep(STEPS.MAP));
      container.add(backBtn);
    }

    // Next button
    const nextBtn = this.createNextButton(this.isHost ? this.centerX + 120 : this.centerX, 620, () => this.goToStep(STEPS.READY));
    container.add(nextBtn);
  }

  createLargeClassCard(x, y, classType) {
    const container = this.add.container(x, y);
    const stats = getCharacter(classType);
    if (!stats) return container;
    const color = Phaser.Display.Color.HexStringToColor(stats.color || '#ffffff').color;

    // Glow
    const glow = this.add.rectangle(0, 0, 185, 230, color, 0.15);
    glow.setVisible(classType === this.selectedClass);

    // Background
    const bg = this.add.rectangle(0, 0, 175, 220, 0x000000, 0.85);
    bg.setStrokeStyle(2, color);

    // Character sprite - larger
    const sprite = this.add.image(0, -50, classType.toLowerCase());
    sprite.setScale(2.5);

    // Class name
    const charNameKey = `char.${classType.toLowerCase()}.name`;
    const nameText = this.add.text(0, 30, t(charNameKey), {
      fontSize: '20px',
      fill: stats.color,
      fontFamily: 'Courier New',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Quick stats
    const quickStats = `${t('stats.hp')}:${stats.health} ${t('stats.spd')}:${stats.speed}`;
    const quickStatsText = this.add.text(0, 55, quickStats, fontStyle('small', COLORS.textMuted)).setOrigin(0.5);

    // Ultimate name - use translation if available
    const ultNameKey = `ult.${stats.ultimate?.id?.toLowerCase() || stats.ultimate?.name?.toLowerCase() || ''}`;
    const ultimateName = t(ultNameKey) !== ultNameKey ? t(ultNameKey) : (stats.ultimate?.name || t('stats.ultimate'));
    const ultText = this.add.text(0, 75, `[Q] ${ultimateName}`, fontStyle('small', COLORS.warning)).setOrigin(0.5);

    // Selection indicator
    const selector = this.add.text(0, -100, t('lobby.selected'), fontStyle('small', COLORS.warning)).setOrigin(0.5);
    selector.setVisible(classType === this.selectedClass);

    container.add([glow, bg, sprite, nameText, quickStatsText, ultText, selector]);

    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerover', () => {
      glow.setVisible(true);
      bg.setStrokeStyle(3, color);
      sprite.setScale(2.8);
      this.updateStatsDisplay(classType);
      SoundManager.playUIHover();
    });

    bg.on('pointerout', () => {
      if (this.selectedClass !== classType) {
        glow.setVisible(false);
      }
      bg.setStrokeStyle(2, color);
      sprite.setScale(2.5);
    });

    bg.on('pointerdown', () => {
      this.selectClass(classType);
      SoundManager.playUIClick();
    });

    container.glow = glow;
    container.selector = selector;
    container.sprite = sprite;

    return container;
  }

  selectClass(classType) {
    this.selectedClass = classType;
    SocketManager.selectClass(classType);

    Object.keys(this.classCards).forEach(type => {
      this.classCards[type].selector.setVisible(type === classType);
      this.classCards[type].glow.setVisible(type === classType);
    });

    this.updateStatsDisplay(classType);
  }

  updateStatsDisplay(classType) {
    this.statsContainer.removeAll(true);

    const stats = getCharacter(classType);
    if (!stats) return;

    const color = stats.color;
    const ultimate = stats.ultimate;

    const bg = this.add.rectangle(0, 0, 900, 80, 0x000000, 0.7);
    bg.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(color).color);

    // Stats line 1
    const statsLine1 = this.add.text(0, -22,
      `${t('stats.health')}: ${stats.health}  |  ${t('stats.speed')}: ${stats.speed}  |  ${t('stats.damage')}: ${stats.damage}  |  ${t('stats.fireRate')}: ${stats.fireRate}/s`,
      { fontSize: '15px', fill: '#ffffff', fontFamily: 'Courier New' }
    ).setOrigin(0.5);

    // Description - use translation if available
    const descKey = `char.${classType.toLowerCase()}.desc`;
    const description = t(descKey) !== descKey ? t(descKey) : (stats.description || '');
    const statsLine2 = this.add.text(0, 2, description, {
      fontSize: '14px',
      fill: '#aaaaaa',
      fontFamily: 'Courier New',
    }).setOrigin(0.5);

    // Ultimate info - use translation if available
    let ultInfo = '';
    if (ultimate) {
      const ultNameKey = `ult.${ultimate.id?.toLowerCase() || ultimate.name?.toLowerCase()}`;
      const ultDescKey = `${ultNameKey}Desc`;
      const ultName = t(ultNameKey) !== ultNameKey ? t(ultNameKey) : ultimate.name;
      const ultDesc = t(ultDescKey) !== ultDescKey ? t(ultDescKey) : ultimate.description;
      ultInfo = `[Q] ${t('stats.ultimate')}: ${ultName} - ${ultDesc}`;
    }
    const statsLine3 = this.add.text(0, 26, ultInfo, {
      fontSize: '13px',
      fill: color,
      fontFamily: 'Courier New',
    }).setOrigin(0.5);

    this.statsContainer.add([bg, statsLine1, statsLine2, statsLine3]);
  }

  createMiniPlayersList(parentContainer) {
    // Small players list on the right
    const container = this.add.container(this.W - 100, 200);

    const title = this.add.text(0, 0, t('lobby.players'), fontStyle('small', COLORS.warning)).setOrigin(0.5);

    container.add(title);
    parentContainer.add(container);

    this.miniPlayersContainer = container;
  }

  updateMiniPlayersList() {
    // Remove old player entries (keep title)
    const children = this.miniPlayersContainer.getAll();
    children.slice(1).forEach(child => child.destroy());

    this.players.forEach((player, index) => {
      const y = 25 + index * 22;
      const isMe = player.id === SocketManager.playerId;
      const defaultChar = getCharacterList()[0] || 'MESSI';
      const stats = getCharacter(player.classType || defaultChar);
      const playerColor = stats?.color || COLORS.text;

      const text = this.add.text(0, y, player.name.substring(0, 8), fontStyle('small', isMe ? COLORS.warning : playerColor)).setOrigin(0.5);

      this.miniPlayersContainer.add(text);
    });
  }

  // ==================== STEP 4: READY ====================
  createReadyStep() {
    const container = this.add.container(0, 0);
    container.setVisible(false);
    this.stepContainers[STEPS.READY] = container;

    // Title
    const title = this.add.text(this.centerX, 100, t('lobby.readyUp'), {
      fontSize: '36px',
      fill: '#ffffff',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(title);

    // Game summary
    this.gameSummaryContainer = this.add.container(this.centerX, 180);
    container.add(this.gameSummaryContainer);

    // Players list (full)
    this.readyPlayersContainer = this.add.container(this.centerX, 350);
    container.add(this.readyPlayersContainer);

    // Status text
    this.readyStatusText = this.add.text(this.centerX, 520, '', {
      fontSize: '16px',
      fill: '#00ff88',
      fontFamily: 'Courier New',
    }).setOrigin(0.5);
    container.add(this.readyStatusText);

    // Back button
    const backBtn = this.createBackButton(this.centerX - 120, 580, () => this.goToStep(STEPS.CHARACTER));
    container.add(backBtn);

    // Ready button
    this.readyBtn = this.createReadyButton(this.centerX + 120, 580);
    container.add(this.readyBtn);
  }

  updateGameSummary() {
    this.gameSummaryContainer.removeAll(true);

    const mode = GAME_MODES[this.selectedGameMode] || GAME_MODES.ARENA;
    const map = MAPS[this.selectedMap] || MAPS.ARENA;
    const isSpanish = getLanguage() === 'es-AR';
    const myClass = getCharacter(this.selectedClass) || getCharacter(getCharacterList()[0]);

    if (!mode || !map || !myClass) return;

    const bg = this.add.rectangle(0, 0, 600, 100, 0x000000, 0.7);
    bg.setStrokeStyle(2, 0x00ffff);

    // Mode
    const modeText = this.add.text(-200, -25, `${t('lobby.mode')} ${mode.name}`, {
      fontSize: '16px',
      fill: '#00ffff',
      fontFamily: 'Courier New',
    }).setOrigin(0, 0.5);

    // Map
    const mapName = isSpanish ? map.name : map.nameEn;
    const mapText = this.add.text(-200, 5, `${t('lobby.map')} ${mapName}`, {
      fontSize: '16px',
      fill: map.color || '#ffffff',
      fontFamily: 'Courier New',
    }).setOrigin(0, 0.5);

    // Character
    const charText = this.add.text(-200, 35, `${t('lobby.character')} ${this.selectedClass}`, {
      fontSize: '16px',
      fill: myClass.color || '#ffffff',
      fontFamily: 'Courier New',
    }).setOrigin(0, 0.5);

    // Character sprite preview
    const sprite = this.add.image(220, 0, this.selectedClass.toLowerCase());
    sprite.setScale(2);

    this.gameSummaryContainer.add([bg, modeText, mapText, charText, sprite]);
  }

  updateReadyPlayersList() {
    this.readyPlayersContainer.removeAll(true);

    const bg = this.add.rectangle(0, 0, 500, Math.max(140, this.players.length * 35 + 40), 0x000000, 0.5);
    bg.setStrokeStyle(2, 0xffff00);
    this.readyPlayersContainer.add(bg);

    const headerText = this.add.text(0, -bg.height / 2 + 20, t('lobby.players'), {
      fontSize: '14px',
      fill: '#ffff00',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.readyPlayersContainer.add(headerText);

    this.players.forEach((player, index) => {
      const y = -bg.height / 2 + 50 + index * 32;
      const isMe = player.id === SocketManager.playerId;
      const stats = getCharacter(player.classType || getCharacterList()[0]);

      // Name
      const nameText = this.add.text(-180, y, `${isMe ? '> ' : '  '}${player.name}`, {
        fontSize: '16px',
        fill: isMe ? '#ffff00' : '#ffffff',
        fontFamily: 'Courier New',
      }).setOrigin(0, 0.5);

      // Class
      const classText = this.add.text(20, y, player.classType || 'MESSI', {
        fontSize: '14px',
        fill: stats?.color || '#ffffff',
        fontFamily: 'Courier New',
      }).setOrigin(0, 0.5);

      // Ready status
      const readyText = this.add.text(150, y, player.ready ? t('lobby.checkReady') : t('lobby.statusWaiting'), {
        fontSize: '14px',
        fill: player.ready ? '#00ff88' : '#666666',
        fontFamily: 'Courier New',
      }).setOrigin(0, 0.5);

      this.readyPlayersContainer.add([nameText, classText, readyText]);
    });

    // Update ready count
    const readyCount = this.players.filter(p => p.ready).length;
    this.readyStatusText.setText(`${readyCount}/${this.players.length} ${t('lobby.playersReady')}`);
  }

  createReadyButton(x, y) {
    const container = this.add.container(x, y);

    const glow = this.add.rectangle(0, 0, 160, 50, 0x00ff88, 0.2);
    glow.setVisible(false);

    const bg = this.add.rectangle(0, 0, 150, 45, 0x000000, 0.8);
    bg.setStrokeStyle(3, 0x00ff88);

    const text = this.add.text(0, 0, t('lobby.ready'), {
      fontSize: '22px',
      fill: '#00ff88',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([glow, bg, text]);
    container.setSize(150, 45);
    container.setInteractive({ useHandCursor: true });

    container.glow = glow;
    container.bg = bg;
    container.text = text;

    container.on('pointerover', () => {
      glow.setVisible(true);
      SoundManager.playUIHover();
    });

    container.on('pointerout', () => {
      if (!this.isReady) glow.setVisible(false);
    });

    container.on('pointerdown', () => {
      this.toggleReady();
      SoundManager.playUIClick();
    });

    // Pulse animation
    this.tweens.add({
      targets: container,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    return container;
  }

  toggleReady() {
    this.isReady = !this.isReady;
    SocketManager.setReady(this.isReady);

    if (this.isReady) {
      this.readyBtn.text.setText(t('lobby.cancel'));
      this.readyBtn.text.setStyle({ fill: '#ff8844' });
      this.readyBtn.bg.setStrokeStyle(3, 0xff8844);
      this.readyBtn.glow.setFillStyle(0xff8844, 0.2);
      this.readyBtn.glow.setVisible(true);
    } else {
      this.readyBtn.text.setText(t('lobby.ready'));
      this.readyBtn.text.setStyle({ fill: '#00ff88' });
      this.readyBtn.bg.setStrokeStyle(3, 0x00ff88);
      this.readyBtn.glow.setFillStyle(0x00ff88, 0.2);
      this.readyBtn.glow.setVisible(false);
    }
  }

  // ==================== NAVIGATION ====================
  createNextButton(x, y, callback) {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 140, 40, 0x000000, 0.8);
    bg.setStrokeStyle(2, 0x00ff88);

    const text = this.add.text(0, 0, t('lobby.next'), {
      fontSize: '18px',
      fill: '#00ff88',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(140, 40);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.setStrokeStyle(3, 0x00ff88);
      bg.setFillStyle(0x00ff88, 0.1);
      SoundManager.playUIHover();
    });

    container.on('pointerout', () => {
      bg.setStrokeStyle(2, 0x00ff88);
      bg.setFillStyle(0x000000, 0.8);
    });

    container.on('pointerdown', () => {
      callback();
      SoundManager.playUIClick();
    });

    return container;
  }

  createBackButton(x, y, callback) {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 140, 40, 0x000000, 0.8);
    bg.setStrokeStyle(2, 0x888888);

    const text = this.add.text(0, 0, t('lobby.back'), {
      fontSize: '18px',
      fill: '#888888',
      fontFamily: 'Courier New',
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.setSize(140, 40);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.setStrokeStyle(3, 0xaaaaaa);
      text.setStyle({ fill: '#aaaaaa' });
      SoundManager.playUIHover();
    });

    container.on('pointerout', () => {
      bg.setStrokeStyle(2, 0x888888);
      text.setStyle({ fill: '#888888' });
    });

    container.on('pointerdown', () => {
      callback();
      SoundManager.playUIClick();
    });

    return container;
  }

  goToStep(step) {
    // Non-hosts can only navigate between CHARACTER and READY
    if (!this.isHost && step < STEPS.CHARACTER) {
      return;
    }

    // If host, broadcast step change to other players
    if (this.isHost) {
      SocketManager.changeStep(step);
    }

    this.showStep(step);
  }

  showStep(step) {
    // Transition out current step (only if different from new step)
    const currentContainer = this.stepContainers[this.currentStep];
    if (currentContainer && this.currentStep !== step) {
      this.tweens.add({
        targets: currentContainer,
        alpha: 0,
        duration: 150,
        onComplete: () => currentContainer.setVisible(false),
      });
    }

    const previousStep = this.currentStep;
    this.currentStep = step;
    this.updateStepIndicator();

    // Transition in new step
    const newContainer = this.stepContainers[step];
    if (newContainer) {
      newContainer.setVisible(true);
      // Only animate if transitioning from a different step
      if (previousStep !== step) {
        newContainer.setAlpha(0);
        this.tweens.add({
          targets: newContainer,
          alpha: 1,
          duration: 200,
        });
      } else {
        // First load - just show immediately
        newContainer.setAlpha(1);
      }
    }

    // Update step-specific content
    if (step === STEPS.CHARACTER) {
      this.updateMiniPlayersList();
    } else if (step === STEPS.READY) {
      this.updateGameSummary();
      this.updateReadyPlayersList();
    }
  }

  // ==================== SOCKET EVENTS ====================
  setupSocketEvents() {
    SocketManager.on('room:playerJoined', (data) => {
      this.updatePlayersList(data.players);
      if (data.selectedMap) this.updateSelectedMap(data.selectedMap);
      if (data.gameMode) this.updateSelectedGameMode(data.gameMode);
      // Non-hosts sync to READY step if host is already there
      if (!this.isHost && data.lobbyStep === STEPS.READY && this.currentStep !== STEPS.READY) {
        this.showStep(STEPS.READY);
      }
    });

    SocketManager.on('room:playerUpdated', (data) => {
      this.updatePlayersList(data.players);
    });

    SocketManager.on('room:mapChanged', (data) => {
      this.updateSelectedMap(data.mapId);
    });

    SocketManager.on('room:gameModeChanged', (data) => {
      this.updateSelectedGameMode(data.mode);
    });

    SocketManager.on('room:stepChanged', (data) => {
      // Host changed step, sync non-host players only for READY step
      // (non-hosts can't interact with MODE/MAP, so don't pull them back)
      if (!this.isHost && data.step !== undefined && data.step === STEPS.READY) {
        this.showStep(data.step);
      }
    });

    SocketManager.on('room:playerLeft', (data) => {
      this.updatePlayersList(data.players);
    });

    SocketManager.on('game:start', (data) => {
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
    this.players = players;
    const playerWord = players.length !== 1 ? t('lobby.playersPlural') : t('lobby.player');
    this.playersCountText.setText(`${players.length} ${playerWord}`);

    if (this.currentStep === STEPS.CHARACTER) {
      this.updateMiniPlayersList();
    } else if (this.currentStep === STEPS.READY) {
      this.updateReadyPlayersList();
    }
  }

  updateSelectedMap(mapId) {
    this.selectedMap = mapId;
    if (this.mapCards) {
      Object.keys(this.mapCards).forEach(key => {
        this.mapCards[key].selector.setVisible(key === mapId);
        this.mapCards[key].glow.setVisible(key === mapId);
      });
    }
  }

  updateSelectedGameMode(modeKey) {
    this.selectedGameMode = modeKey;
    if (this.gameModeCards) {
      Object.keys(this.gameModeCards).forEach(key => {
        this.gameModeCards[key].selector.setVisible(key === modeKey);
        this.gameModeCards[key].glow.setVisible(key === modeKey);
      });
    }
  }

  shutdown() {
    // Clear step indicators array
    this.stepIndicators = [];

    // Clear step containers
    this.stepContainers = {};

    SocketManager.off('room:playerJoined');
    SocketManager.off('room:playerUpdated');
    SocketManager.off('room:playerLeft');
    SocketManager.off('room:mapChanged');
    SocketManager.off('room:gameModeChanged');
    SocketManager.off('room:stepChanged');
    SocketManager.off('game:start');
  }
}
