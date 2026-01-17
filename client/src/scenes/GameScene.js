import { SocketManager } from '../network/SocketManager.js';
import { SoundManager } from '../utils/SoundManager.js';
import { GAME_CONFIG, PLAYER_CLASSES, RESPAWN_TIME, KILL_STREAKS, POWERUPS, ULTIMATES, PERKS, MAP_MODIFIERS, INFINITE_HORDE_CONFIG } from '../../../shared/constants.js';
import { MAPS, MOBS, BOSS_MOBS } from '../../../shared/maps.js';
import { t } from '../utils/i18n.js';
import { COLORS, fontStyle } from '../config/theme.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.serverPlayers = data.players || {};
    this.mapId = data.mapId || 'ARENA';
    this.mapConfig = MAPS[this.mapId] || MAPS.ARENA;
    this.localPlayers = {};
    this.bullets = {};
    this.grenades = {};
    this.powerups = {};
    this.turrets = {};
    this.barriers = {};
    this.barrels = {};
    this.healZones = {};
    this.hazards = [];
    this.mobs = {};
    this.lastInputSent = 0;

    // Wave survival mode state
    this.gameMode = data.gameMode || 'ARENA';
    this.activeModifiers = data.modifiers || [];
    this.waveNumber = 0;
    this.mobsRemaining = 0;
    this.perkSelectionActive = false;
    this.selectedPerkId = null;

    // Arena mode timer (synced from server)
    this.serverTimeRemaining = null;
    this.gameEnded = false;

    // Boss state for Infinite Horde mode
    this.activeBoss = null;
    this.isBossWave = false;
  }

  create() {
    SoundManager.startDubstep();
    this.createMapBackground();

    // Create groups
    this.playersGroup = this.add.group();
    this.bulletsGroup = this.add.group();
    this.grenadesGroup = this.add.group();

    // Initialize players
    for (const [id, playerData] of Object.entries(this.serverPlayers)) {
      this.createPlayerSprite(id, playerData);
    }

    // Input setup
    this.cursors = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      ability: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      ultimate: Phaser.Input.Keyboard.KeyCodes.Q,
    });

    // Space key for dodge
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Track dodge cooldown locally for UI feedback
    this.lastDodgeTime = 0;
    this.dodgeCooldown = 1500;

    // Shooting
    this.input.on('pointerdown', () => this.handleShoot());

    // Ability key
    this.input.keyboard.on('keydown-SHIFT', () => this.handleAbility());

    // Ultimate key
    this.input.keyboard.on('keydown-Q', () => this.handleUltimate());

    // Socket events
    this.setupSocketEvents();

    // UI
    this.createUI();

    // Send input at 20Hz (reduced from 60Hz to avoid network flood)
    this.time.addEvent({
      delay: 1000 / 20,
      callback: this.sendInput,
      callbackScope: this,
      loop: true,
    });

    // Screen effects
    this.cameras.main.flash(200, 0, 255, 255);
  }

  createPlayerSprite(id, playerData) {
    const textureKey = (playerData.classType || 'MESSI').toLowerCase();
    const sprite = this.add.sprite(playerData.x, playerData.y, textureKey);
    sprite.setScale(1.5);

    // Health bar
    const healthBarBg = this.add.image(playerData.x, playerData.y - 40, 'healthbar_bg');
    healthBarBg.setScale(1.5);
    const healthBarFill = this.add.image(playerData.x, playerData.y - 40, 'healthbar_fill');
    healthBarFill.setScale(1.5);
    healthBarFill.setOrigin(0, 0.5);
    healthBarFill.x = playerData.x - 36;

    // Name tag
    const isMe = id === SocketManager.playerId;
    const nameTag = this.add
      .text(playerData.x, playerData.y - 55, playerData.name || 'Player', {
        fontSize: '14px',
        fill: isMe ? '#ffff00' : '#ffffff',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // Class indicator
    const stats = PLAYER_CLASSES[playerData.classType || 'MESSI'];
    const classColor = stats?.color || '#75aaff';
    const classIndicator = this.add.circle(
      playerData.x, playerData.y + 35, 5,
      Phaser.Display.Color.HexStringToColor(classColor).color
    );

    // Shield effect (hidden initially)
    const shieldEffect = this.add.image(playerData.x, playerData.y, 'shield_effect');
    shieldEffect.setScale(1.2);
    shieldEffect.setVisible(false);
    shieldEffect.setAlpha(0.7);

    // Spawn protection ring (hidden initially)
    const spawnProtection = this.add.circle(playerData.x, playerData.y, 35);
    spawnProtection.setStrokeStyle(3, 0x00ff88, 0.5);
    spawnProtection.setVisible(false);

    const container = {
      sprite,
      healthBarBg,
      healthBarFill,
      nameTag,
      classIndicator,
      shieldEffect,
      spawnProtection,
      serverX: playerData.x,
      serverY: playerData.y,
      classType: playerData.classType || 'MESSI',
      health: playerData.health,
      maxHealth: stats?.health || 100,
      alive: playerData.alive !== false,
      ultimateCharge: playerData.ultimateCharge || 0,
      shieldHits: playerData.shieldHits || 0,
      invisible: false,
      mechMode: false,
    };

    this.localPlayers[id] = container;
    return container;
  }

  setupSocketEvents() {
    SocketManager.on('game:state', (state) => {
      // Update players
      for (const [id, playerData] of Object.entries(state.players)) {
        if (this.localPlayers[id]) {
          const local = this.localPlayers[id];
          local.serverX = playerData.x;
          local.serverY = playerData.y;
          local.health = playerData.health;
          local.maxHealth = playerData.maxHealth;
          local.alive = playerData.alive;
          local.ultimateCharge = playerData.ultimateCharge || 0;
          local.shieldHits = playerData.shieldHits || 0;
          local.invisible = playerData.invisible || false;
          local.mechMode = playerData.mechMode || false;
          local.killStreak = playerData.killStreak || 0;
          local.spawnProtectionActive = playerData.spawnProtection || false;
          local.perks = playerData.perks || {};

          // Update spawn protection visual
          local.spawnProtection.setVisible(local.spawnProtectionActive);

          // Update shield visual
          local.shieldEffect.setVisible(local.shieldHits > 0);

          // Update invisibility
          if (id !== SocketManager.playerId) {
            local.sprite.setAlpha(local.invisible ? 0.2 : 1);
          }

          // Update mech mode scale
          if (local.mechMode && local.sprite.scaleX === 1.5) {
            local.sprite.setScale(2);
            local.sprite.setTint(0xffaa00);
          } else if (!local.mechMode && local.sprite.scaleX === 2) {
            local.sprite.setScale(1.5);
            local.sprite.clearTint();
          }
        } else {
          this.createPlayerSprite(id, playerData);
        }
      }

      // Remove disconnected players
      for (const id of Object.keys(this.localPlayers)) {
        if (!state.players[id]) {
          this.removePlayer(id);
        }
      }

      // Update powerups
      this.syncPowerups(state.powerups || []);

      // Update turrets
      this.syncTurrets(state.turrets || []);

      // Update barriers
      this.syncBarriers(state.barriers || []);

      // Update barrels
      this.syncBarrels(state.barrels || []);

      // Update heal zones
      this.syncHealZones(state.healZones || []);

      // Update hazards
      if (state.hazards && this.hazards.length === 0) {
        this.createHazards(state.hazards);
      }

      // Update mobs
      this.syncMobs(state.mobs || []);

      // Update my ultimate bar
      this.updateUltimateUI();

      // Wave survival UI updates
      if (this.gameMode === 'WAVE_SURVIVAL' || this.gameMode === 'INFINITE_HORDE') {
        // Update mobs remaining
        const mobCount = state.mobs ? state.mobs.length : 0;
        if (this.mobsRemainingText && this.mobsRemaining !== mobCount) {
          this.mobsRemaining = mobCount;
          this.mobsRemainingText.setText(`Mobs: ${mobCount}`);
        }

        // Update perks display
        this.updatePlayerPerksDisplay();

        // Update fog of war position
        if (this.fogGraphics) {
          this.updateFogOfWar();
        }

        // Update boss health bar for Infinite Horde
        if (this.gameMode === 'INFINITE_HORDE' && state.activeBoss && this.bossHealthContainer) {
          this.bossHealthContainer.setVisible(true);
          const healthPercent = state.activeBoss.health / state.activeBoss.maxHealth;
          this.bossHealthBarFill.setScale(healthPercent, 1);
          this.bossHealthText.setText(`${state.activeBoss.health} / ${state.activeBoss.maxHealth}`);
        } else if (this.gameMode === 'INFINITE_HORDE' && !state.activeBoss && this.bossHealthContainer) {
          this.bossHealthContainer.setVisible(false);
        }
      }

      // Update game timer from server
      if (state.timeRemaining !== undefined) {
        this.serverTimeRemaining = state.timeRemaining;
      }
    });

    SocketManager.on('bullet:spawn', (bullet) => {
      this.createBullet(bullet);
      SoundManager.playShoot();
    });

    SocketManager.on('bullet:destroy', (data) => {
      this.destroyBullet(data.id);
    });

    SocketManager.on('bullet:ricochet', (data) => {
      // Create ricochet effect
      const bullet = this.bullets[data.id];
      if (bullet) {
        this.createHitParticles(data.x, data.y, 0xffff00);
      }
    });

    SocketManager.on('grenade:spawn', (grenade) => {
      this.createGrenade(grenade);
      SoundManager.playShoot();
    });

    SocketManager.on('grenade:explode', (data) => {
      this.createExplosion(data.x, data.y, data.radius);
      this.destroyGrenade(data.id);
      SoundManager.playExplosion();
    });

    SocketManager.on('player:hit', (data) => {
      this.onPlayerHit(data);
      SoundManager.playHit();
    });

    SocketManager.on('player:death', (data) => {
      this.onPlayerDeath(data);
      SoundManager.playDeath();
    });

    SocketManager.on('player:respawn', (data) => {
      this.onPlayerRespawn(data);
      SoundManager.playRespawn();
    });

    SocketManager.on('player:heal', (data) => {
      this.onPlayerHeal(data);
    });

    SocketManager.on('player:dash', (data) => {
      this.onPlayerDash(data);
    });

    SocketManager.on('player:dodge', (data) => {
      this.onPlayerDodge(data);
    });

    SocketManager.on('player:bounce', (data) => {
      this.onPlayerBounce(data);
    });

    SocketManager.on('killStreak', (data) => {
      this.showKillStreakAnnouncement(data);
    });

    SocketManager.on('powerup:spawn', (data) => {
      this.createPowerup(data);
    });

    SocketManager.on('powerup:collected', (data) => {
      this.destroyPowerup(data.id);
      if (data.playerId === SocketManager.playerId) {
        SoundManager.playPowerup();
        this.showPowerupNotification(data.type);
      }
    });

    SocketManager.on('turret:spawn', (data) => {
      this.createTurret(data);
    });

    SocketManager.on('bear:spawn', (data) => {
      this.createBear(data);
    });

    SocketManager.on('player:chainsaw', (data) => {
      this.onPlayerChainsaw(data);
    });

    SocketManager.on('turret:shoot', (data) => {
      const turret = this.turrets[data.turretId];
      if (turret) {
        // Flash effect on turret
        this.tweens.add({
          targets: turret,
          alpha: 0.5,
          duration: 50,
          yoyo: true,
        });

        // Muzzle flash particle
        const flash = this.add.circle(turret.x, turret.y, 12, 0xffff00, 1);
        flash.setDepth(100);
        this.tweens.add({
          targets: flash,
          alpha: 0,
          scale: 2,
          duration: 100,
          onComplete: () => flash.destroy(),
        });
      }
    });

    SocketManager.on('turret:destroy', (data) => {
      this.destroyTurret(data.id);
    });

    SocketManager.on('barrier:spawn', (data) => {
      this.createBarrier(data);
    });

    SocketManager.on('barrier:destroy', (data) => {
      this.destroyBarrier(data.id);
    });

    SocketManager.on('barrel:explode', (data) => {
      this.onBarrelExplode(data);
    });

    SocketManager.on('healZone:spawn', (data) => {
      this.createHealZone(data);
    });

    SocketManager.on('healZone:destroy', (data) => {
      this.destroyHealZone(data.id);
    });

    SocketManager.on('ultimate:activate', (data) => {
      this.onUltimateActivate(data);
    });

    SocketManager.on('carpetBomb:explosion', (data) => {
      this.createExplosion(data.x, data.y, data.radius);
      SoundManager.playExplosion();
    });

    SocketManager.on('lifeSwap', (data) => {
      this.onLifeSwap(data);
    });

    // Mob events
    SocketManager.on('mob:spawn', (data) => {
      this.createMob(data);
    });

    SocketManager.on('mob:hit', (data) => {
      this.onMobHit(data);
    });

    SocketManager.on('mob:death', (data) => {
      this.onMobDeath(data);
    });

    SocketManager.on('mob:attack', (data) => {
      this.onMobAttack(data);
    });

    // Wave survival events
    SocketManager.on('wave:start', (data) => {
      this.onWaveStart(data);
    });

    SocketManager.on('wave:complete', (data) => {
      this.onWaveComplete(data);
    });

    SocketManager.on('wave:perkOffer', (data) => {
      this.onPerkOffer(data);
    });

    SocketManager.on('wave:perkSelected', (data) => {
      this.onPerkSelected(data);
    });

    SocketManager.on('wave:gameOver', (data) => {
      this.onWaveGameOver(data);
    });

    // Boss events (Infinite Horde mode)
    SocketManager.on('boss:spawn', (data) => {
      this.onBossSpawn(data);
    });

    SocketManager.on('boss:death', (data) => {
      this.onBossDeath(data);
    });

    SocketManager.on('boss:charge', (data) => {
      this.onBossCharge(data);
    });

    SocketManager.on('mob:charge', (data) => {
      this.onMobCharge(data);
    });

    SocketManager.on('boss:shoot', (data) => {
      this.onBossShoot(data);
    });

    // Dynamic hazard events
    SocketManager.on('hazard:carSpawn', (data) => {
      this.onCarSpawn(data);
    });

    SocketManager.on('hazard:warning', (data) => {
      this.onHazardWarning(data);
    });

    SocketManager.on('hazard:lavaPool', (data) => {
      this.onLavaPoolSpawn(data);
    });

    SocketManager.on('hazard:lavaPoolExpire', (data) => {
      this.onLavaPoolExpire(data);
    });

    SocketManager.on('hazard:rockImpact', (data) => {
      this.onRockImpact(data);
    });

    SocketManager.on('hazard:spikeRise', (data) => {
      this.onSpikeRise(data);
    });

    // Team combo events
    SocketManager.on('combo:hit', (data) => {
      this.onComboHit(data);
    });

    // Arena mode game end
    SocketManager.on('game:end', (data) => {
      this.onArenaGameEnd(data);
    });

    // Game restart (play again)
    SocketManager.on('game:start', (data) => {
      // Restart the scene with new game data
      this.scene.restart({
        players: data.players,
        mapId: data.mapId,
        gameMode: data.gameMode,
        modifiers: data.modifiers || [],
        gameDuration: data.gameDuration,
      });
    });
  }

  // Sync functions for server-authoritative entities
  syncPowerups(serverPowerups) {
    const serverIds = new Set(serverPowerups.map(p => p.id));

    // Remove powerups not on server
    for (const id of Object.keys(this.powerups)) {
      if (!serverIds.has(id)) {
        this.destroyPowerup(id);
      }
    }

    // Add/update powerups
    for (const powerup of serverPowerups) {
      if (!this.powerups[powerup.id]) {
        this.createPowerup(powerup);
      }
    }
  }

  syncTurrets(serverTurrets) {
    const serverIds = new Set(serverTurrets.map(t => t.id));

    for (const id of Object.keys(this.turrets)) {
      if (!serverIds.has(id)) {
        this.destroyTurret(id);
      }
    }

    for (const turret of serverTurrets) {
      if (!this.turrets[turret.id]) {
        this.createTurret(turret);
      }
    }
  }

  syncBarriers(serverBarriers) {
    const serverIds = new Set(serverBarriers.map(b => b.id));

    for (const id of Object.keys(this.barriers)) {
      if (!serverIds.has(id)) {
        this.destroyBarrier(id);
      }
    }

    for (const barrier of serverBarriers) {
      if (!this.barriers[barrier.id]) {
        this.createBarrier(barrier);
      }
    }
  }

  syncBarrels(serverBarrels) {
    const serverIds = new Set(serverBarrels.map(b => b.id));

    for (const id of Object.keys(this.barrels)) {
      if (!serverIds.has(id)) {
        this.destroyBarrel(id);
      }
    }

    for (const barrel of serverBarrels) {
      if (!this.barrels[barrel.id]) {
        this.createBarrel(barrel);
      }
    }
  }

  syncHealZones(serverZones) {
    const serverIds = new Set(serverZones.map(z => z.id));

    for (const id of Object.keys(this.healZones)) {
      if (!serverIds.has(id)) {
        this.destroyHealZone(id);
      }
    }

    for (const zone of serverZones) {
      if (!this.healZones[zone.id]) {
        this.createHealZone(zone);
      }
    }
  }

  syncMobs(serverMobs) {
    const serverIds = new Set(serverMobs.map(m => m.id));

    // Remove mobs not on server
    for (const id of Object.keys(this.mobs)) {
      if (!serverIds.has(id)) {
        this.destroyMob(id);
      }
    }

    // Add/update mobs
    for (const mob of serverMobs) {
      if (!this.mobs[mob.id]) {
        this.createMob(mob);
      } else {
        // Update position
        const localMob = this.mobs[mob.id];
        localMob.serverX = mob.x;
        localMob.serverY = mob.y;
        localMob.health = mob.health;

        // Update health bar
        const healthPercent = mob.health / mob.maxHealth;
        const scale = mob.isBoss ? 1.5 : 0.8;
        localMob.healthBarFill.setScale(healthPercent * scale, scale);

        // Update boss health UI if this is the boss
        if (mob.isBoss && this.bossHealthBarFill) {
          const bossHealthPercent = mob.health / mob.maxHealth;
          this.bossHealthBarFill.setScale(bossHealthPercent, 1);
          if (this.bossHealthText) {
            this.bossHealthText.setText(`${mob.health} / ${mob.maxHealth}`);
          }
        }
      }
    }
  }

  createMob(data) {
    // Get config from either regular mobs or boss mobs
    const mobConfig = data.isBoss ? BOSS_MOBS[data.type] : MOBS[data.type];
    if (!mobConfig) return;

    // Create mob container for all parts
    const container = this.add.container(data.x, data.y);

    // Different visual based on mob type
    if (data.type === 'PROTESTER') {
      // === PROTESTER: Person with sign ===
      // Body (torso - wearing protest vest/jacket)
      const body = this.add.rectangle(0, 5, 20, 25, 0x2244aa); // Blue jacket
      body.setStrokeStyle(1, 0x112244);
      // Head
      const head = this.add.circle(0, -15, 10, 0xffcc99); // Skin tone
      head.setStrokeStyle(1, 0xcc9966);
      // Bandana/cap
      this.add.arc(0, -20, 10, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false, 0xff4444);
      // Legs
      this.add.rectangle(-5, 25, 8, 15, 0x333333); // Dark pants
      this.add.rectangle(5, 25, 8, 15, 0x333333);
      // Arms raised with sign
      this.add.rectangle(-12, -5, 6, 20, 0xffcc99).setRotation(-0.3);
      this.add.rectangle(12, -5, 6, 20, 0xffcc99).setRotation(0.3);
      // Protest sign
      const signPole = this.add.rectangle(0, -35, 3, 30, 0x8B4513);
      const sign = this.add.rectangle(0, -55, 40, 20, 0xffffff);
      sign.setStrokeStyle(2, 0x000000);
      const signText = this.add.text(0, -55, '¡FUERA!', {
        ...fontStyle('small', COLORS.danger), fontStyle: 'bold'
      }).setOrigin(0.5);

      container.add([body, head, signPole, sign, signText]);
      container.sprite = body; // Reference for hit effects

    } else if (data.type === 'CACEROLAZO') {
      // === CACEROLAZO: Person banging pot ===
      const body = this.add.rectangle(0, 5, 18, 22, 0x888888); // Gray shirt
      const head = this.add.circle(0, -12, 9, 0xffcc99);
      // Pot
      const pot = this.add.ellipse(-15, 0, 20, 15, 0xc0c0c0);
      pot.setStrokeStyle(2, 0x808080);
      // Spoon/ladle
      const spoon = this.add.rectangle(15, -5, 4, 25, 0x8B4513);
      this.add.rectangle(-5, 22, 7, 14, 0x444444);
      this.add.rectangle(5, 22, 7, 14, 0x444444);

      container.add([body, head, pot, spoon]);
      container.sprite = body;

    } else if (data.type === 'HINCHA') {
      // === HINCHA: Football fan with flag ===
      const body = this.add.rectangle(0, 5, 20, 24, 0x0000aa); // Boca blue
      body.setStrokeStyle(2, 0xffcc00); // Gold trim
      const head = this.add.circle(0, -14, 10, 0xffcc99);
      // Boca hat
      this.add.rectangle(0, -22, 22, 6, 0x0000aa);
      // Flag
      const flagPole = this.add.rectangle(15, -20, 3, 50, 0x8B4513);
      const flag = this.add.rectangle(25, -35, 30, 20, 0x75aaff);
      flag.setStrokeStyle(1, 0xffcc00);
      this.add.rectangle(-5, 24, 8, 14, 0x0000aa);
      this.add.rectangle(5, 24, 8, 14, 0x0000aa);

      container.add([body, head, flagPole, flag]);
      container.sprite = body;

    } else if (data.type === 'BEAR') {
      // === BEAR: Large brown bear ===
      const body = this.add.ellipse(0, 5, 40, 35, 0x8B4513);
      body.setStrokeStyle(3, 0x5a3510);
      const head = this.add.circle(0, -25, 20, 0x9a5a23);
      head.setStrokeStyle(2, 0x5a3510);
      // Ears
      this.add.circle(-15, -40, 8, 0x8B4513);
      this.add.circle(15, -40, 8, 0x8B4513);
      // Snout
      this.add.ellipse(0, -20, 12, 8, 0x6a4a13);
      // Eyes
      this.add.circle(-8, -30, 4, 0x000000);
      this.add.circle(8, -30, 4, 0x000000);
      // Claws
      for (let i = 0; i < 3; i++) {
        this.add.rectangle(-20 + i * 5, 25, 3, 8, 0x333333);
        this.add.rectangle(10 + i * 5, 25, 3, 8, 0x333333);
      }

      container.add([body, head]);
      container.sprite = body;

    } else if (data.type === 'GOLF_CART') {
      // === GOLF CART: Small vehicle ===
      const cart = this.add.rectangle(0, 0, 50, 30, 0xffffff);
      cart.setStrokeStyle(2, 0xcccccc);
      // Roof
      this.add.rectangle(0, -20, 45, 8, 0x228B22);
      // Wheels
      this.add.circle(-18, 18, 10, 0x333333);
      this.add.circle(18, 18, 10, 0x333333);
      // Windshield
      this.add.rectangle(15, -5, 15, 15, 0x87CEEB, 0.7);
      // Golf clubs in back
      this.add.rectangle(-20, -15, 4, 25, 0x8B4513).setRotation(-0.2);

      container.add([cart]);
      container.sprite = cart;

    } else if (data.type === 'LION' || data.isLion) {
      // === LION: Colosseum hazard ===
      const body = this.add.ellipse(0, 5, 45, 30, 0xDAA520);
      body.setStrokeStyle(2, 0xB8860B);
      // Head
      const head = this.add.circle(20, -5, 18, 0xDAA520);
      head.setStrokeStyle(2, 0xB8860B);
      // Mane
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        this.add.circle(
          20 + Math.cos(angle) * 22,
          -5 + Math.sin(angle) * 18,
          8, 0x8B4513, 0.8
        );
      }
      // Face
      this.add.circle(28, -8, 4, 0x000000); // Eye
      this.add.ellipse(35, 0, 8, 5, 0x4a3a20); // Nose
      // Tail
      this.add.rectangle(-30, 5, 20, 4, 0xDAA520).setRotation(-0.3);
      this.add.circle(-40, 0, 6, 0x8B4513);
      // Legs
      this.add.rectangle(-15, 25, 8, 18, 0xDAA520);
      this.add.rectangle(10, 25, 8, 18, 0xDAA520);

      container.add([body, head]);
      container.sprite = body;

    } else if (data.isBoss && data.type === 'MEGA_BEAR') {
      // === MEGA BEAR BOSS ===
      const body = this.add.ellipse(0, 5, 80, 70, 0x8B0000);
      body.setStrokeStyle(5, 0x5a0000);
      const head = this.add.circle(0, -40, 35, 0x9a1a1a);
      head.setStrokeStyle(3, 0x5a0000);
      // Ears
      this.add.circle(-25, -70, 15, 0x8B0000);
      this.add.circle(25, -70, 15, 0x8B0000);
      // Snout
      this.add.ellipse(0, -30, 20, 14, 0x6a0a0a);
      // Eyes (glowing red)
      const eye1 = this.add.circle(-15, -50, 8, 0xff0000);
      const eye2 = this.add.circle(15, -50, 8, 0xff0000);
      this.tweens.add({ targets: [eye1, eye2], alpha: 0.5, duration: 500, yoyo: true, repeat: -1 });
      // Claws
      for (let i = 0; i < 4; i++) {
        this.add.rectangle(-35 + i * 10, 45, 6, 15, 0x333333);
        this.add.rectangle(15 + i * 10, 45, 6, 15, 0x333333);
      }
      container.add([body, head]);
      container.sprite = body;
      container.setScale(data.scale || 2.5);

    } else if (data.isBoss && data.type === 'TANK') {
      // === TANK BOSS ===
      const hull = this.add.rectangle(0, 0, 100, 50, 0x444444);
      hull.setStrokeStyle(4, 0x222222);
      const turret = this.add.rectangle(0, -15, 40, 30, 0x555555);
      turret.setStrokeStyle(2, 0x333333);
      // Cannon
      this.add.rectangle(40, -15, 50, 12, 0x333333);
      // Tracks
      this.add.rectangle(0, 30, 110, 15, 0x222222);
      this.add.rectangle(0, -5, 110, 15, 0x222222);
      // Track details
      for (let i = 0; i < 8; i++) {
        this.add.rectangle(-50 + i * 14, 30, 4, 18, 0x111111);
      }
      container.add([hull, turret]);
      container.sprite = hull;
      container.setScale(data.scale || 2.0);

    } else if (data.isBoss && data.type === 'HELICOPTER') {
      // === HELICOPTER BOSS ===
      const body = this.add.ellipse(0, 0, 80, 35, 0x2F4F4F);
      body.setStrokeStyle(3, 0x1a2a2a);
      // Cockpit
      const cockpit = this.add.ellipse(25, 0, 30, 25, 0x87CEEB, 0.7);
      // Tail
      this.add.rectangle(-50, 0, 40, 10, 0x2F4F4F);
      this.add.ellipse(-70, 0, 20, 15, 0x3a5a5a);
      // Main rotor
      const rotor = this.add.rectangle(0, -25, 100, 6, 0x222222);
      this.tweens.add({ targets: rotor, rotation: Math.PI * 2, duration: 100, repeat: -1 });
      // Tail rotor
      const tailRotor = this.add.rectangle(-70, 0, 4, 20, 0x222222);
      this.tweens.add({ targets: tailRotor, rotation: Math.PI * 2, duration: 50, repeat: -1 });
      // Missiles
      this.add.rectangle(-10, 20, 8, 20, 0xff4444);
      this.add.rectangle(10, 20, 8, 20, 0xff4444);
      container.add([body, cockpit, rotor, tailRotor]);
      container.sprite = body;
      container.setScale(data.scale || 2.2);

    } else {
      // Default fallback
      const sprite = this.add.circle(0, 0, data.isBoss ? 40 : 20, Phaser.Display.Color.HexStringToColor(mobConfig.color).color);
      sprite.setStrokeStyle(data.isBoss ? 5 : 3, 0x000000);
      container.add([sprite]);
      container.sprite = sprite;
      if (data.scale) container.setScale(data.scale);
    }

    // Health bar (for all mobs) - bigger for bosses
    const barWidth = data.isBoss ? 80 : 40;
    const barHeight = data.isBoss ? 10 : 6;
    const barOffset = data.isBoss ? -80 : -45;
    const healthBarBg = this.add.rectangle(data.x, data.y + barOffset, barWidth, barHeight, 0x000000);
    healthBarBg.setStrokeStyle(data.isBoss ? 2 : 1, data.isBoss ? 0xff0000 : 0x333333);
    const healthBarFill = this.add.rectangle(data.x, data.y + barOffset, barWidth - 4, barHeight - 2, data.isBoss ? 0xff4400 : 0xff0000);
    healthBarFill.setOrigin(0, 0.5);
    healthBarFill.x = data.x - (barWidth / 2) + 2;

    // Name tag - bigger for bosses
    const fontSize = data.isBoss ? '14px' : '10px';
    const nameTag = this.add.text(data.x, data.y + barOffset - 15, mobConfig.name, {
      fontSize,
      fill: mobConfig.color,
      fontFamily: 'Courier New',
      fontStyle: data.isBoss ? 'bold' : 'normal',
      stroke: '#000000',
      strokeThickness: data.isBoss ? 4 : 2,
    }).setOrigin(0.5);

    // Add elite indicator
    if (data.isElite) {
      nameTag.setText(`★ ${mobConfig.name}`);
      nameTag.setStyle({ fill: '#ffff00' });
    }

    this.mobs[data.id] = {
      sprite: container,
      container,
      healthBarBg,
      healthBarFill,
      nameTag,
      serverX: data.x,
      serverY: data.y,
      health: data.health,
      maxHealth: data.maxHealth,
      type: data.type,
      isBoss: data.isBoss,
      isElite: data.isElite,
    };
  }

  destroyMob(id) {
    const mob = this.mobs[id];
    if (mob) {
      if (mob.container) {
        mob.container.destroy();
      } else if (mob.sprite) {
        mob.sprite.destroy();
      }
      mob.healthBarBg.destroy();
      mob.healthBarFill.destroy();
      mob.nameTag.destroy();
      delete this.mobs[id];
    }
  }

  onMobHit(data) {
    const mob = this.mobs[data.id];
    if (mob) {
      // Flash effect using tint on container or body element
      const bodyElement = mob.container?.list?.[0];
      if (bodyElement && bodyElement.setFillStyle) {
        const originalColor = bodyElement.fillColor;
        bodyElement.setFillStyle(0xff0000);
        this.time.delayedCall(100, () => {
          if (bodyElement && bodyElement.active) {
            bodyElement.setFillStyle(originalColor);
          }
        });
      } else {
        // Flash the whole container with alpha
        this.tweens.add({
          targets: mob.container,
          alpha: 0.3,
          duration: 50,
          yoyo: true,
        });
      }

      // Update health bar
      const healthPercent = data.health / mob.maxHealth;
      mob.healthBarFill.setScale(healthPercent * 0.8, 0.8);

      this.createHitParticles(mob.container.x, mob.container.y, 0xff6600);
    }
  }

  onMobDeath(data) {
    const mob = this.mobs[data.id];
    if (mob) {
      // Death explosion effect
      this.createExplosion(mob.container.x, mob.container.y, 30);
      this.destroyMob(data.id);
    }
  }

  onMobAttack(data) {
    const mob = this.mobs[data.mobId];
    const target = this.localPlayers[data.targetId];

    if (mob && target) {
      // Attack line effect
      const line = this.add.graphics();
      line.lineStyle(3, 0xff0000, 0.8);
      line.moveTo(mob.container.x, mob.container.y);
      line.lineTo(target.sprite.x, target.sprite.y);
      line.strokePath();

      this.tweens.add({
        targets: line,
        alpha: 0,
        duration: 200,
        onComplete: () => line.destroy(),
      });

      // Mob attack animation (lunge forward)
      const lungeX = mob.container.x + (target.sprite.x - mob.container.x) * 0.2;
      const lungeY = mob.container.y + (target.sprite.y - mob.container.y) * 0.2;
      this.tweens.add({
        targets: mob.container,
        x: lungeX,
        y: lungeY,
        duration: 100,
        yoyo: true,
      });
    }
  }

  createHazards(hazards) {
    for (const hazard of hazards) {
      if (hazard.type === 'LAVA') {
        // Create tiled lava
        const tileSize = 64;
        const tilesX = Math.ceil(hazard.width / tileSize);
        const tilesY = Math.ceil(hazard.height / tileSize);

        for (let tx = 0; tx < tilesX; tx++) {
          for (let ty = 0; ty < tilesY; ty++) {
            const lava = this.add.image(
              hazard.x + tx * tileSize + tileSize / 2,
              hazard.y + ty * tileSize + tileSize / 2,
              'lava'
            );
            lava.setDepth(-1);

            // Animated glow
            this.tweens.add({
              targets: lava,
              alpha: 0.7,
              duration: 500 + Math.random() * 500,
              yoyo: true,
              repeat: -1,
            });

            this.hazards.push(lava);
          }
        }
      } else if (hazard.type === 'BOUNCE') {
        const bounce = this.add.image(hazard.x + 24, hazard.y + 24, 'bounce_pad');
        bounce.setRotation(hazard.angle || 0);
        bounce.setDepth(-1);

        // Pulsing animation
        this.tweens.add({
          targets: bounce,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 500,
          yoyo: true,
          repeat: -1,
        });

        this.hazards.push(bounce);
      }
    }
  }

  createBullet(bulletData) {
    // Get the correct projectile texture based on class type
    const projectileTextures = {
      MESSI: 'soccer_ball',
      MILEI: 'peso',
      TRUMP: 'tweet',
      BIDEN: 'ice_cream',
      PUTIN: 'missile',
    };
    const textureKey = projectileTextures[bulletData.classType] || 'bullet';

    const bullet = this.add.image(bulletData.x, bulletData.y, textureKey);
    const baseScale = 1.5;
    const sizeMultiplier = bulletData.sizeMultiplier || 1;
    bullet.setScale(baseScale * sizeMultiplier);
    bullet.id = bulletData.id;
    bullet.vx = bulletData.vx;
    bullet.vy = bulletData.vy;

    // Rotate bullet to face direction of travel
    bullet.rotation = Math.atan2(bulletData.vy, bulletData.vx);

    this.bullets[bulletData.id] = bullet;
    this.bulletsGroup.add(bullet);
  }

  destroyBullet(id) {
    if (this.bullets[id]) {
      this.createHitParticles(this.bullets[id].x, this.bullets[id].y);
      this.bullets[id].destroy();
      delete this.bullets[id];
    }
  }

  createGrenade(grenadeData) {
    // Putin fires missiles
    const textureKey = grenadeData.classType === 'PUTIN' ? 'missile' : 'grenade';
    const grenade = this.add.image(grenadeData.x, grenadeData.y, textureKey);
    grenade.setScale(1.5);
    grenade.id = grenadeData.id;
    grenade.vx = grenadeData.vx;
    grenade.vy = grenadeData.vy;

    // Rotate to face direction of travel
    grenade.rotation = Math.atan2(grenadeData.vy, grenadeData.vx);

    this.tweens.add({
      targets: grenade,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: -1,
    });

    this.grenades[grenadeData.id] = grenade;
    this.grenadesGroup.add(grenade);
  }

  destroyGrenade(id) {
    if (this.grenades[id]) {
      this.grenades[id].destroy();
      delete this.grenades[id];
    }
  }

  createPowerup(data) {
    const typeKey = `powerup_${data.type.toLowerCase()}`;
    const powerup = this.add.image(data.x, data.y, typeKey);
    powerup.setScale(1.2);
    powerup.id = data.id;

    // Floating animation
    this.tweens.add({
      targets: powerup,
      y: data.y - 8,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Rotating glow
    this.tweens.add({
      targets: powerup,
      angle: 360,
      duration: 3000,
      repeat: -1,
    });

    this.powerups[data.id] = powerup;
  }

  destroyPowerup(id) {
    if (this.powerups[id]) {
      // Collect effect
      const powerup = this.powerups[id];
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const particle = this.add.circle(powerup.x, powerup.y, 4, 0xffffff);

        this.tweens.add({
          targets: particle,
          x: powerup.x + Math.cos(angle) * 40,
          y: powerup.y + Math.sin(angle) * 40,
          alpha: 0,
          duration: 300,
          onComplete: () => particle.destroy(),
        });
      }

      powerup.destroy();
      delete this.powerups[id];
    }
  }

  showPowerupNotification(type) {
    const powerupInfo = POWERUPS[type];
    if (!powerupInfo) return;

    const notification = this.add
      .text(400, 100, `+ ${powerupInfo.name}`, {
        fontSize: '24px',
        fill: powerupInfo.color,
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(200);

    this.tweens.add({
      targets: notification,
      y: 70,
      alpha: 0,
      scale: 1.3,
      duration: 1500,
      onComplete: () => notification.destroy(),
    });
  }

  createTurret(data) {
    SoundManager.playAbility('TRUMP', 'TURRET');

    const turret = this.add.image(data.x, data.y, 'turret');
    turret.setScale(1.2);
    turret.id = data.id;
    this.turrets[data.id] = turret;
  }

  createBear(data) {
    SoundManager.playAbility('PUTIN', 'BEAR');

    // Putin's bear turret
    const bear = this.add.image(data.x, data.y, 'bear');
    bear.setScale(1.5);
    bear.id = data.id;

    // Add a little idle animation
    this.tweens.add({
      targets: bear,
      scaleX: 1.6,
      scaleY: 1.4,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    this.turrets[data.id] = bear;
  }

  onPlayerChainsaw(data) {
    const player = this.localPlayers[data.playerId];
    if (!player) return;

    // Big chainsaw slash effect
    const slashGraphics = this.add.graphics();
    slashGraphics.lineStyle(6, 0xffcc00);
    slashGraphics.beginPath();
    slashGraphics.arc(player.sprite.x, player.sprite.y, 70, data.angle - Math.PI/4, data.angle + Math.PI/4, false);
    slashGraphics.strokePath();
    slashGraphics.setDepth(100);

    // Flash screen orange
    this.cameras.main.flash(100, 255, 200, 0);

    // Chainsaw particles
    for (let i = 0; i < 12; i++) {
      const angle = data.angle + (Math.random() - 0.5) * Math.PI/2;
      const particle = this.add.circle(
        player.sprite.x + Math.cos(angle) * 30,
        player.sprite.y + Math.sin(angle) * 30,
        4, 0xffcc00
      );

      this.tweens.add({
        targets: particle,
        x: particle.x + Math.cos(angle) * 60,
        y: particle.y + Math.sin(angle) * 60,
        alpha: 0,
        duration: 300,
        onComplete: () => particle.destroy(),
      });
    }

    this.tweens.add({
      targets: slashGraphics,
      alpha: 0,
      duration: 200,
      onComplete: () => slashGraphics.destroy(),
    });

    SoundManager.playAbility('MILEI', 'CHAINSAW');
  }

  destroyTurret(id) {
    if (this.turrets[id]) {
      this.createExplosion(this.turrets[id].x, this.turrets[id].y, 30);
      this.turrets[id].destroy();
      delete this.turrets[id];
    }
  }

  createBarrier(data) {
    SoundManager.playAbility('TRUMP', 'WALL');

    const barrier = this.add.image(data.x, data.y, 'barrier');
    barrier.setScale(data.width / 48, data.height / 48);
    barrier.id = data.id;
    this.barriers[data.id] = barrier;
  }

  destroyBarrier(id) {
    if (this.barriers[id]) {
      this.createHitParticles(this.barriers[id].x, this.barriers[id].y, 0xffaa00);
      this.barriers[id].destroy();
      delete this.barriers[id];
    }
  }

  createBarrel(data) {
    const barrel = this.add.image(data.x, data.y, 'barrel');
    barrel.id = data.id;
    this.barrels[data.id] = barrel;
  }

  destroyBarrel(id) {
    if (this.barrels[id]) {
      this.barrels[id].destroy();
      delete this.barrels[id];
    }
  }

  onBarrelExplode(data) {
    this.destroyBarrel(data.id);
    this.createExplosion(data.x, data.y, data.radius);
    SoundManager.playExplosion();
    this.cameras.main.shake(300, 0.04);
  }

  createHealZone(data) {
    SoundManager.playAbility('BIDEN', 'HEAL');

    const zone = this.add.image(data.x, data.y, 'heal_zone');
    zone.setScale(data.radius / 40);
    zone.id = data.id;
    zone.setAlpha(0.6);
    zone.setDepth(-1);

    // Pulsing animation
    this.tweens.add({
      targets: zone,
      alpha: 0.3,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    this.healZones[data.id] = zone;
  }

  destroyHealZone(id) {
    if (this.healZones[id]) {
      this.healZones[id].destroy();
      delete this.healZones[id];
    }
  }

  createExplosion(x, y, radius) {
    let frame = 0;
    const explosion = this.add.image(x, y, 'explosion_0');
    explosion.setScale((radius / 48) * 1.5);
    explosion.setDepth(100);

    const animInterval = this.time.addEvent({
      delay: 40,
      callback: () => {
        frame++;
        if (frame >= 12) {
          explosion.destroy();
          animInterval.remove();
        } else {
          explosion.setTexture(`explosion_${frame}`);
        }
      },
      loop: true,
    });

    this.cameras.main.shake(200, 0.03);
    this.cameras.main.flash(100, 255, 200, 100);

    // Sparks
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 200;
      const particle = this.add.image(x, y, 'particle_spark');
      particle.setScale(1 + Math.random());

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: 500 + Math.random() * 300,
        onComplete: () => particle.destroy(),
      });
    }

    // Smoke
    for (let i = 0; i < 8; i++) {
      const smoke = this.add.image(
        x + (Math.random() - 0.5) * radius,
        y + (Math.random() - 0.5) * radius,
        'particle_smoke'
      );
      smoke.setScale(0.5);
      smoke.setAlpha(0.6);

      this.tweens.add({
        targets: smoke,
        y: smoke.y - 50,
        alpha: 0,
        scale: 2,
        duration: 800,
        onComplete: () => smoke.destroy(),
      });
    }
  }

  createHitParticles(x, y, color = 0xff0000) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 100;
      const particle = this.add.circle(x, y, 3, color);

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        duration: 300,
        onComplete: () => particle.destroy(),
      });
    }
  }

  onPlayerHit(data) {
    const player = this.localPlayers[data.playerId];
    if (player) {
      if (data.shieldBlocked) {
        // Shield block effect
        player.shieldEffect.setVisible(true);
        this.tweens.add({
          targets: player.shieldEffect,
          alpha: 1,
          duration: 100,
          yoyo: true,
          onComplete: () => player.shieldEffect.setAlpha(0.7),
        });
        this.createHitParticles(player.sprite.x, player.sprite.y, 0x0088ff);
      } else {
        // Flash red
        player.sprite.setTint(0xff0000);
        this.time.delayedCall(100, () => {
          if (player.sprite) player.sprite.clearTint();
        });

        // Scale bounce
        this.tweens.add({
          targets: player.sprite,
          scaleX: player.mechMode ? 2.3 : 1.8,
          scaleY: player.mechMode ? 1.7 : 1.2,
          duration: 50,
          yoyo: true,
        });

        this.createHitParticles(player.sprite.x, player.sprite.y);
        this.updateHealthBar(player, data.health);

        if (data.playerId === SocketManager.playerId) {
          this.cameras.main.shake(100, 0.01);
        }
      }
    }
  }

  onPlayerHeal(data) {
    const player = this.localPlayers[data.playerId];
    if (player) {
      // Green heal particles
      for (let i = 0; i < 6; i++) {
        const particle = this.add.circle(
          player.sprite.x + (Math.random() - 0.5) * 30,
          player.sprite.y + 20,
          4, 0x00ff00
        );

        this.tweens.add({
          targets: particle,
          y: particle.y - 40,
          alpha: 0,
          duration: 600,
          onComplete: () => particle.destroy(),
        });
      }

      this.updateHealthBar(player, data.health);
    }
  }

  onPlayerDash(data) {
    const player = this.localPlayers[data.playerId];
    if (player) {
      SoundManager.playAbility('MESSI', 'DASH');

      // Dash trail
      for (let i = 0; i < 5; i++) {
        const t = i / 5;
        const x = data.fromX + (data.toX - data.fromX) * t;
        const y = data.fromY + (data.toY - data.fromY) * t;

        const trail = this.add.image(x, y, 'particle_dash');
        trail.setScale(1.5 - i * 0.2);
        trail.setAlpha(0.6 - i * 0.1);

        this.tweens.add({
          targets: trail,
          alpha: 0,
          scale: 0,
          duration: 300,
          delay: i * 50,
          onComplete: () => trail.destroy(),
        });
      }

      // Update position immediately
      player.serverX = data.toX;
      player.serverY = data.toY;
    }
  }

  onPlayerDodge(data) {
    const player = this.localPlayers[data.playerId];
    if (player) {
      SoundManager.playDodge();

      // Ghost/afterimage effect
      const ghost = this.add.sprite(data.fromX, data.fromY, player.sprite.texture.key);
      ghost.setScale(player.sprite.scaleX);
      ghost.setAlpha(0.5);
      ghost.setTint(0x00ffff);

      this.tweens.add({
        targets: ghost,
        alpha: 0,
        scale: ghost.scaleX * 0.5,
        duration: 200,
        onComplete: () => ghost.destroy(),
      });

      // Dodge trail - cyan colored for dodge
      for (let i = 0; i < 3; i++) {
        const t = i / 3;
        const x = data.fromX + (data.toX - data.fromX) * t;
        const y = data.fromY + (data.toY - data.fromY) * t;

        const particle = this.add.circle(x, y, 6, 0x00ffff);
        particle.setAlpha(0.6 - i * 0.15);

        this.tweens.add({
          targets: particle,
          alpha: 0,
          scale: 0,
          duration: 200,
          delay: i * 30,
          onComplete: () => particle.destroy(),
        });
      }

      // Flash player cyan briefly to show iframes
      player.sprite.setTint(0x00ffff);
      this.time.delayedCall(200, () => {
        if (player.sprite) player.sprite.clearTint();
      });

      // Update position immediately
      player.serverX = data.toX;
      player.serverY = data.toY;

      // Update local dodge cooldown if it's us
      if (data.playerId === SocketManager.playerId) {
        this.lastDodgeTime = Date.now();
      }
    }
  }

  onPlayerBounce(data) {
    const player = this.localPlayers[data.playerId];
    if (player) {
      // Bounce effect
      this.tweens.add({
        targets: player.sprite,
        scaleY: 1.8,
        scaleX: 1.2,
        duration: 100,
        yoyo: true,
      });

      // Bounce particles
      for (let i = 0; i < 6; i++) {
        const particle = this.add.circle(data.x, data.y + 20, 4, 0x00ffff);

        this.tweens.add({
          targets: particle,
          y: particle.y + 30,
          alpha: 0,
          duration: 400,
          onComplete: () => particle.destroy(),
        });
      }
    }
  }

  onPlayerDeath(data) {
    const player = this.localPlayers[data.playerId];
    if (player) {
      this.createExplosion(player.sprite.x, player.sprite.y, 40);

      player.sprite.setVisible(false);
      player.healthBarBg.setVisible(false);
      player.healthBarFill.setVisible(false);
      player.nameTag.setVisible(false);
      player.classIndicator.setVisible(false);
      player.shieldEffect.setVisible(false);
      player.spawnProtection.setVisible(false);
      player.alive = false;

      if (data.playerId === SocketManager.playerId) {
        this.showRespawnMessage();
        this.cameras.main.shake(500, 0.03);
      }
    }

    this.showKillNotification(data);
    this.updateScoreboard(data.scores);
  }

  showKillNotification(data) {
    const killer = this.localPlayers[data.killerId];
    const victim = this.localPlayers[data.playerId];

    if (killer && victim) {
      const killerName = killer.nameTag ? killer.nameTag.text : 'Someone';
      const victimName = victim.nameTag ? victim.nameTag.text : 'Someone';

      const notification = this.add
        .text(400, 50, `${killerName} killed ${victimName}`, {
          fontSize: '18px',
          fill: '#ff4444',
          fontFamily: 'Courier New',
          backgroundColor: '#00000088',
          padding: { x: 10, y: 5 },
        })
        .setOrigin(0.5)
        .setDepth(200);

      this.tweens.add({
        targets: notification,
        y: 30,
        alpha: 0,
        duration: 2000,
        delay: 1000,
        onComplete: () => notification.destroy(),
      });
    }
  }

  showKillStreakAnnouncement(data) {
    const streakInfo = KILL_STREAKS[data.streak];
    if (!streakInfo) return;

    const player = this.localPlayers[data.playerId];
    const playerName = player?.nameTag?.text || 'Someone';

    // Big announcement
    const announcement = this.add
      .text(400, 200, `${playerName}\n${streakInfo.name}`, {
        fontSize: '36px',
        fill: streakInfo.color,
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(250);

    // Epic animation
    announcement.setScale(0);
    this.tweens.add({
      targets: announcement,
      scale: 1.2,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: announcement,
          scale: 1,
          alpha: 0,
          y: 150,
          duration: 1500,
          delay: 1000,
          onComplete: () => announcement.destroy(),
        });
      },
    });

    // Screen flash for big streaks
    if (data.streak >= 5) {
      const flashColor = Phaser.Display.Color.HexStringToColor(streakInfo.color);
      this.cameras.main.flash(200, flashColor.red, flashColor.green, flashColor.blue);
    }
  }

  onUltimateActivate(data) {
    const player = this.localPlayers[data.playerId];
    if (!player) return;

    // Play ultimate sound
    const stats = PLAYER_CLASSES[player.classType];
    if (stats?.ultimate) {
      SoundManager.playUltimate(stats.ultimate);
    }

    // Big flash effect
    const flash = this.add.circle(player.sprite.x, player.sprite.y, 100, 0xffffff, 0.8);
    flash.setDepth(150);
    this.tweens.add({
      targets: flash,
      scale: 2,
      alpha: 0,
      duration: 500,
      onComplete: () => flash.destroy(),
    });

    // Show ultimate name
    const ultimate = ULTIMATES[stats?.ultimate];
    if (ultimate) {
      const ultText = this.add
        .text(player.sprite.x, player.sprite.y - 70, ultimate.name, {
          fontSize: '20px',
          fill: stats.color,
          fontFamily: 'Courier New',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(200);

      this.tweens.add({
        targets: ultText,
        y: ultText.y - 30,
        alpha: 0,
        duration: 1500,
        onComplete: () => ultText.destroy(),
      });
    }
  }

  onLifeSwap(data) {
    // Visual effect for life swap
    const from = this.localPlayers[data.from];
    const to = this.localPlayers[data.to];

    if (from && to) {
      // Create connecting line effect
      const line = this.add.graphics();
      line.lineStyle(4, 0xff0066);
      line.moveTo(from.sprite.x, from.sprite.y);
      line.lineTo(to.sprite.x, to.sprite.y);
      line.strokePath();
      line.setDepth(150);

      this.tweens.add({
        targets: line,
        alpha: 0,
        duration: 500,
        onComplete: () => line.destroy(),
      });

      // Update health displays
      this.updateHealthBar(from, data.fromHealth);
      this.updateHealthBar(to, data.toHealth);
    }
  }

  onPlayerRespawn(data) {
    const player = this.localPlayers[data.playerId];
    if (player) {
      player.sprite.setPosition(data.x, data.y);
      player.sprite.setVisible(true);
      player.sprite.setAlpha(0);
      player.healthBarBg.setVisible(true);
      player.healthBarFill.setVisible(true);
      player.nameTag.setVisible(true);
      player.classIndicator.setVisible(true);
      player.alive = true;
      player.serverX = data.x;
      player.serverY = data.y;
      this.updateHealthBar(player, data.health);

      this.tweens.add({
        targets: player.sprite,
        alpha: 1,
        duration: 300,
      });

      // Spawn particles
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const particle = this.add.circle(data.x, data.y, 5, 0x00ff88);

        this.tweens.add({
          targets: particle,
          x: data.x + Math.cos(angle) * 80,
          y: data.y + Math.sin(angle) * 80,
          alpha: 0,
          duration: 500,
          onComplete: () => particle.destroy(),
        });
      }

      if (data.playerId === SocketManager.playerId && this.respawnText) {
        this.respawnText.destroy();
        this.respawnText = null;
      }
    }
  }

  updateHealthBar(player, health) {
    player.health = health;
    const healthPercent = health / player.maxHealth;
    const baseScale = player.mechMode ? 2 : 1.5;
    player.healthBarFill.setScale(healthPercent * baseScale, baseScale);

    if (healthPercent > 0.6) {
      player.healthBarFill.setTint(0x00ff00);
    } else if (healthPercent > 0.3) {
      player.healthBarFill.setTint(0xffff00);
    } else {
      player.healthBarFill.setTint(0xff0000);
      this.tweens.add({
        targets: player.healthBarFill,
        alpha: 0.5,
        duration: 200,
        yoyo: true,
      });
    }
  }

  showRespawnMessage() {
    this.respawnText = this.add
      .text(400, 300, `YOU DIED\nRespawning in ${RESPAWN_TIME / 1000}...`, {
        fontSize: '36px',
        fill: '#ff0000',
        fontFamily: 'Courier New',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(200);

    this.tweens.add({
      targets: this.respawnText,
      scale: 1.1,
      duration: 300,
      yoyo: true,
      repeat: -1,
    });
  }

  removePlayer(id) {
    const player = this.localPlayers[id];
    if (player) {
      player.sprite.destroy();
      player.healthBarBg.destroy();
      player.healthBarFill.destroy();
      player.nameTag.destroy();
      player.classIndicator.destroy();
      player.shieldEffect.destroy();
      player.spawnProtection.destroy();
      delete this.localPlayers[id];
    }
  }

  createMapBackground() {
    const W = GAME_CONFIG.WIDTH;
    const H = GAME_CONFIG.HEIGHT;

    // Base arena image
    const arena = this.add.image(W / 2, H / 2, 'arena');
    arena.setDisplaySize(W, H);

    // Apply map-specific tint
    const mapColor = Phaser.Display.Color.HexStringToColor(this.mapConfig.color);
    arena.setTint(mapColor.color);
    arena.setAlpha(0.8);

    // Add map-specific overlay effects
    if (this.mapId === 'CONGRESO') {
      // Add protest signs and fire effects in background
      this.createCongresoEffects();
    } else if (this.mapId === 'CASA_ROSADA') {
      // Pink house background
      this.createCasaRosadaEffects();
    } else if (this.mapId === 'BOMBONERA') {
      // Stadium effects
      this.createBomboneraEffects();
    } else if (this.mapId === 'KREMLIN') {
      // Red square effects
      this.createKremlinEffects();
    } else if (this.mapId === 'MAR_A_LAGO') {
      // Golf course effects
      this.createMarALagoEffects();
    } else if (this.mapId === 'OBELISCO') {
      // Buenos Aires obelisk with traffic
      this.createObeliscoEffects();
    } else if (this.mapId === 'COLISEO') {
      // Roman colosseum
      this.createColiseoEffects();
    } else if (this.mapId === 'VOLCANO') {
      // Active volcano
      this.createVolcanoEffects();
    }

    // Display map name at start
    this.showMapName();
  }

  createObeliscoEffects() {
    const W = GAME_CONFIG.WIDTH;
    const H = GAME_CONFIG.HEIGHT;

    // Road lanes (gray asphalt)
    this.add.rectangle(W / 2, 180, W, 70, 0x333333, 0.9).setDepth(-2);
    this.add.rectangle(W / 2, 250, W, 70, 0x333333, 0.9).setDepth(-2);
    this.add.rectangle(W / 2, 520, W, 70, 0x333333, 0.9).setDepth(-2);
    this.add.rectangle(W / 2, 590, W, 70, 0x333333, 0.9).setDepth(-2);

    // Lane markings
    for (let x = 0; x < W; x += 80) {
      this.add.rectangle(x + 40, 215, 40, 4, 0xffff00, 0.6).setDepth(-1);
      this.add.rectangle(x + 40, 555, 40, 4, 0xffff00, 0.6).setDepth(-1);
    }

    // The Obelisk (center)
    const obeliskBase = this.add.rectangle(W / 2, 410, 80, 40, 0xeeeeee, 0.95);
    obeliskBase.setStrokeStyle(2, 0xcccccc);
    const obeliskBody = this.add.rectangle(W / 2, 340, 50, 140, 0xffffff, 0.95);
    obeliskBody.setStrokeStyle(2, 0xdddddd);
    const obeliskTop = this.add.triangle(W / 2, 245, 0, 50, 50, 50, 25, 0, 0xffffff);
    obeliskTop.setStrokeStyle(2, 0xdddddd);

    // Safe zone highlight around obelisk
    const safeZone = this.add.ellipse(W / 2, 360, 200, 150);
    safeZone.setStrokeStyle(3, 0x00ff00, 0.3);
    safeZone.setDepth(-1);

    // Traffic warning signs
    this.add.text(100, 140, '⚠️ TRAFICO', { fontSize: '14px', fill: '#ffff00', fontStyle: 'bold' });
    this.add.text(W - 150, 140, '⚠️ TRAFICO', { fontSize: '14px', fill: '#ffff00', fontStyle: 'bold' });

    // Animated traffic cars container
    this.trafficCars = this.add.container(0, 0);
    this.trafficCars.setDepth(10);
  }

  createColiseoEffects() {
    const W = GAME_CONFIG.WIDTH;
    const H = GAME_CONFIG.HEIGHT;

    // Stone arena floor pattern
    for (let x = 0; x < W; x += 80) {
      for (let y = 100; y < H - 50; y += 80) {
        const tile = this.add.rectangle(x + 40, y + 40, 75, 75, 0x8B7355, 0.3);
        tile.setStrokeStyle(1, 0x5a4a35, 0.5);
        tile.setDepth(-3);
      }
    }

    // Colosseum walls (oval shape)
    const wallOuter = this.add.ellipse(W / 2, H / 2, W - 100, H - 100);
    wallOuter.setStrokeStyle(20, 0x8B7355, 0.8);
    wallOuter.setDepth(-2);

    // Arches on walls
    for (let angle = 0; angle < Math.PI * 2; angle += 0.3) {
      const x = W / 2 + Math.cos(angle) * (W / 2 - 60);
      const y = H / 2 + Math.sin(angle) * (H / 2 - 60);
      const arch = this.add.rectangle(x, y, 25, 35, 0x4a3a25, 0.8);
      arch.setRotation(angle);
      arch.setDepth(-1);
    }

    // Central arena floor (darker)
    const arenaFloor = this.add.ellipse(W / 2, H / 2, 300, 200, 0x6a5a45, 0.5);
    arenaFloor.setDepth(-2);

    // Lion gate entrances
    this.add.rectangle(60, H / 2, 60, 80, 0x3a2a15, 0.9).setDepth(-1);
    this.add.rectangle(W - 60, H / 2, 60, 80, 0x3a2a15, 0.9).setDepth(-1);
    this.add.text(60, H / 2, '🦁', { fontSize: '24px' }).setOrigin(0.5);
    this.add.text(W - 60, H / 2, '🦁', { fontSize: '24px' }).setOrigin(0.5);

    // Spike trap warning zones
    this.spikeZones = this.add.container(0, 0);
    this.spikeZones.setDepth(5);
  }

  createVolcanoEffects() {
    const W = GAME_CONFIG.WIDTH;
    const H = GAME_CONFIG.HEIGHT;

    // Volcanic ground (dark with cracks)
    for (let i = 0; i < 20; i++) {
      const crack = this.add.graphics();
      crack.lineStyle(2, 0xff4400, 0.4);
      const startX = Math.random() * W;
      const startY = Math.random() * H;
      crack.moveTo(startX, startY);
      for (let j = 0; j < 5; j++) {
        crack.lineTo(
          startX + (Math.random() - 0.5) * 150,
          startY + Math.random() * 80
        );
      }
      crack.strokePath();
      crack.setDepth(-2);
    }

    // Central lava pool (permanent)
    const lavaPool = this.add.ellipse(W / 2, H / 2 - 30, 180, 80, 0xff4400, 0.8);
    lavaPool.setDepth(-1);
    this.tweens.add({
      targets: lavaPool,
      fillColor: 0xff6600,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Lava bubbles
    for (let i = 0; i < 5; i++) {
      const bubble = this.add.circle(
        W / 2 + (Math.random() - 0.5) * 120,
        H / 2 - 30 + (Math.random() - 0.5) * 50,
        8, 0xffaa00, 0.8
      );
      bubble.setDepth(0);
      this.tweens.add({
        targets: bubble,
        y: bubble.y - 30,
        alpha: 0,
        scale: 1.5,
        duration: 1000 + Math.random() * 500,
        repeat: -1,
        delay: Math.random() * 1000,
      });
    }

    // Volcano crater rim
    const craterRim = this.add.ellipse(W / 2, 50, 300, 60, 0x4a3a30, 0.9);
    craterRim.setDepth(-1);

    // Smoke rising from crater
    for (let i = 0; i < 8; i++) {
      const smoke = this.add.circle(
        W / 2 + (Math.random() - 0.5) * 200,
        80,
        30 + Math.random() * 20,
        0x666666, 0.3
      );
      smoke.setDepth(-1);
      this.tweens.add({
        targets: smoke,
        y: -50,
        alpha: 0,
        scale: 2,
        duration: 3000 + Math.random() * 2000,
        repeat: -1,
        delay: Math.random() * 2000,
      });
    }

    // Warning text
    this.add.text(W / 2, H - 30, '⚠️ ZONA VOLCANICA - PELIGRO ⚠️', {
      fontSize: '16px',
      fill: '#ff4400',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(200);

    // Dynamic hazard containers
    this.lavaPools = this.add.container(0, 0);
    this.lavaPools.setDepth(5);
    this.fallingRocks = this.add.container(0, 0);
    this.fallingRocks.setDepth(50);
  }

  createCongresoEffects() {
    const W = GAME_CONFIG.WIDTH;
    const H = GAME_CONFIG.HEIGHT;

    // ===== EL CONGRESO BUILDING (Greco-Roman style) =====

    // Main building base (gray granite)
    const buildingBase = this.add.rectangle(W / 2, 70, 800, 90, 0x6a6a7a, 0.95);
    buildingBase.setStrokeStyle(3, 0x4a4a5a);

    // Left wing
    this.add.rectangle(W / 2 - 300, 80, 200, 70, 0x5a5a6a, 0.9).setStrokeStyle(2, 0x4a4a5a);
    // Right wing
    this.add.rectangle(W / 2 + 300, 80, 200, 70, 0x5a5a6a, 0.9).setStrokeStyle(2, 0x4a4a5a);

    // Central pediment (triangular top)
    const pediment = this.add.triangle(W / 2, 25, W / 2 - 150, 45, W / 2 + 150, 45, 0x7a7a8a);
    pediment.setStrokeStyle(2, 0x5a5a6a);

    // GREEN DOME (iconic bronze-green color like US Capitol)
    const domeBase = this.add.ellipse(W / 2, 35, 120, 40, 0x2d5a4a, 0.95);
    domeBase.setStrokeStyle(2, 0x1a3a2a);
    const dome = this.add.ellipse(W / 2, 15, 80, 50, 0x3d7a5a, 0.95);
    dome.setStrokeStyle(3, 0x2d5a4a);
    // Dome top lantern
    this.add.rectangle(W / 2, -5, 20, 25, 0x4d8a6a).setStrokeStyle(1, 0x3d7a5a);

    // QUADRIGA (Victory chariot with 4 horses) on top
    this.add.text(W / 2, -20, '🏛️', { fontSize: '20px' }).setOrigin(0.5); // Chariot symbol
    // Horses silhouette
    for (let i = 0; i < 4; i++) {
      const horse = this.add.ellipse(W / 2 - 30 + i * 20, -8, 12, 8, 0xc9a227, 0.9);
    }

    // CORINTHIAN COLUMNS (tall, ornate)
    for (let i = 0; i < 10; i++) {
      const colX = W / 2 - 200 + i * 45;
      // Column shaft
      const col = this.add.rectangle(colX, 75, 14, 70, 0x8a8a9a);
      col.setStrokeStyle(1, 0x6a6a7a);
      // Column capital (top decoration)
      this.add.rectangle(colX, 38, 20, 8, 0x9a9aaa).setStrokeStyle(1, 0x7a7a8a);
      // Column base
      this.add.rectangle(colX, 108, 18, 6, 0x7a7a8a);
    }

    // Building entrance (dark doorway)
    this.add.rectangle(W / 2, 95, 60, 40, 0x1a1a2a, 0.9);

    // Argentine flag on dome
    this.add.text(W / 2, -35, '🇦🇷', { fontSize: '18px' }).setOrigin(0.5);

    // ===== PLAZA DEL CONGRESO =====

    // Plaza fountain (Monumento de los Dos Congresos)
    const fountain = this.add.ellipse(W / 2, H - 100, 100, 40, 0x4a7aaa, 0.4);
    fountain.setStrokeStyle(2, 0x3a5a7a);
    // Fountain spray effect
    for (let i = 0; i < 5; i++) {
      const spray = this.add.ellipse(W / 2 - 30 + i * 15, H - 115, 4, 15, 0x6aaacc, 0.5);
      this.tweens.add({
        targets: spray,
        scaleY: 1.3,
        alpha: 0.2,
        duration: 500 + i * 100,
        yoyo: true,
        repeat: -1,
      });
    }

    // ===== PROTEST ATMOSPHERE =====

    // Burning barricades (tires on fire)
    const barricadePositions = [150, 350, 550, 750, 950, 1130];
    for (const bx of barricadePositions) {
      // Tire stack
      this.add.ellipse(bx, H - 50, 50, 25, 0x1a1a1a, 0.9).setStrokeStyle(2, 0x000000);
      this.add.ellipse(bx, H - 65, 40, 20, 0x2a2a2a, 0.9);

      // Flames
      for (let j = 0; j < 4; j++) {
        const flame = this.add.ellipse(
          bx + (Math.random() - 0.5) * 30,
          H - 80 - Math.random() * 20,
          8 + Math.random() * 8,
          15 + Math.random() * 15,
          j % 2 === 0 ? 0xff4400 : 0xffaa00,
          0.8
        );
        flame.setDepth(-1);
        this.tweens.add({
          targets: flame,
          scaleY: 1.5,
          scaleX: 0.6,
          alpha: 0.3,
          y: flame.y - 30,
          duration: 300 + Math.random() * 400,
          yoyo: true,
          repeat: -1,
        });
      }
    }

    // Tear gas / smoke clouds
    for (let i = 0; i < 12; i++) {
      const smoke = this.add.circle(
        100 + Math.random() * (W - 200),
        150 + Math.random() * 300,
        40 + Math.random() * 50,
        0x888888,
        0.15
      );
      smoke.setDepth(-2);
      this.tweens.add({
        targets: smoke,
        x: smoke.x + (Math.random() - 0.5) * 150,
        y: smoke.y - 50,
        alpha: 0.02,
        scale: 1.5,
        duration: 4000 + Math.random() * 3000,
        yoyo: true,
        repeat: -1,
      });
    }

    // Protest banners and flags on ground
    const bannerTexts = ['¡FUERA!', 'BASTA', 'NO+', '✊', '🇦🇷'];
    for (let i = 0; i < 8; i++) {
      // Banner pole
      const poleX = 120 + Math.random() * (W - 240);
      const poleY = 200 + Math.random() * 300;
      this.add.rectangle(poleX, poleY, 4, 40, 0x8B4513, 0.7);
      // Banner
      const banner = this.add.text(poleX, poleY - 30, bannerTexts[i % bannerTexts.length], {
        fontSize: '14px',
        fill: i % 2 === 0 ? '#ff4444' : '#ffffff',
        backgroundColor: i % 2 === 0 ? '#ffffff88' : '#ff444488',
        padding: { x: 4, y: 2 },
      }).setOrigin(0.5).setRotation((Math.random() - 0.5) * 0.3).setAlpha(0.7);
    }

    // Red flares on ground
    for (let i = 0; i < 4; i++) {
      const flareX = 200 + i * 280;
      const flare = this.add.circle(flareX, H - 150, 8, 0xff0000, 0.9);
      // Flare glow
      const glow = this.add.circle(flareX, H - 150, 25, 0xff0000, 0.2);
      this.tweens.add({
        targets: [flare, glow],
        alpha: 0.4,
        scale: 1.2,
        duration: 200,
        yoyo: true,
        repeat: -1,
      });
      // Flare smoke
      const flareSmoke = this.add.circle(flareX, H - 170, 15, 0xff6666, 0.3);
      this.tweens.add({
        targets: flareSmoke,
        y: H - 250,
        alpha: 0,
        scale: 2,
        duration: 2000,
        repeat: -1,
      });
    }
  }

  createCasaRosadaEffects() {
    const W = GAME_CONFIG.WIDTH;
    const H = GAME_CONFIG.HEIGHT;

    // Large pink building
    const building = this.add.rectangle(W / 2, 50, 800, 80, 0xFFB6C1, 0.85);
    building.setStrokeStyle(4, 0xFF69B4);

    // Central balcony (famous Evita balcony)
    const balcony = this.add.rectangle(W / 2, 90, 150, 30, 0xFFCDD5, 0.9);
    balcony.setStrokeStyle(3, 0xFF69B4);

    // Railing
    for (let i = 0; i < 8; i++) {
      this.add.rectangle(W / 2 - 60 + i * 17, 95, 3, 20, 0xFF69B4, 0.8);
    }

    // Windows
    for (let i = 0; i < 10; i++) {
      const win = this.add.rectangle(W / 2 - 350 + i * 80, 45, 40, 50, 0x5a3a3a, 0.7);
      win.setStrokeStyle(2, 0xFF69B4);
    }

    // Argentine flag
    this.add.text(W / 2, 15, '🇦🇷', { fontSize: '32px' }).setOrigin(0.5);

    // Plaza de Mayo paving pattern
    for (let i = 0; i < 12; i++) {
      for (let j = 0; j < 6; j++) {
        if ((i + j) % 2 === 0) {
          const tile = this.add.rectangle(
            100 + i * 100, 200 + j * 100, 90, 90, 0xcccccc, 0.2
          );
          tile.setDepth(-2);
        }
      }
    }

    // Pots (cacerolas) on the ground
    for (let i = 0; i < 8; i++) {
      this.add.text(
        100 + Math.random() * (W - 200),
        200 + Math.random() * (H - 300),
        '🍳', { fontSize: '16px' }
      ).setAlpha(0.5);
    }
  }

  createBomboneraEffects() {
    const W = GAME_CONFIG.WIDTH;
    const H = GAME_CONFIG.HEIGHT;

    // Large stadium stands on sides - Blue and Gold (Boca colors)
    // Left stand (Blue)
    const leftStand = this.add.rectangle(40, H / 2, 60, H - 80, 0x0000AA, 0.7);
    leftStand.setStrokeStyle(4, 0x000088);

    // Right stand (Gold)
    const rightStand = this.add.rectangle(W - 40, H / 2, 60, H - 80, 0xFFCC00, 0.7);
    rightStand.setStrokeStyle(4, 0xDDAA00);

    // Crowd in stands (dots pattern)
    for (let i = 0; i < 30; i++) {
      // Left blue fans
      this.add.circle(25 + Math.random() * 30, 80 + i * 20, 5, 0x0000FF, 0.6);
      // Right gold fans
      this.add.circle(W - 55 + Math.random() * 30, 80 + i * 20, 5, 0xFFDD00, 0.6);
    }

    // Goal posts
    this.add.rectangle(90, H / 2, 15, 200, 0xffffff, 0.9).setStrokeStyle(2, 0xcccccc);
    this.add.rectangle(W - 90, H / 2, 15, 200, 0xffffff, 0.9).setStrokeStyle(2, 0xcccccc);

    // Goal nets (lines)
    for (let i = 0; i < 6; i++) {
      this.add.rectangle(75, H / 2 - 80 + i * 32, 30, 2, 0xffffff, 0.4);
      this.add.rectangle(W - 75, H / 2 - 80 + i * 32, 30, 2, 0xffffff, 0.4);
    }

    // Center circle
    const circle = this.add.circle(W / 2, H / 2, 80);
    circle.setStrokeStyle(3, 0xffffff, 0.5);
    circle.setFillStyle(0x000000, 0);

    // Center line
    this.add.rectangle(W / 2, H / 2, 4, H - 100, 0xffffff, 0.4);

    // Flying objects (confetti, papers)
    for (let i = 0; i < 15; i++) {
      const confetti = this.add.rectangle(
        Math.random() * W,
        Math.random() * H,
        8, 4,
        i % 2 === 0 ? 0x0000FF : 0xFFCC00, 0.6
      );
      confetti.setRotation(Math.random() * Math.PI);
      this.tweens.add({
        targets: confetti,
        y: confetti.y + 50,
        rotation: confetti.rotation + Math.PI,
        alpha: 0.2,
        duration: 2000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
      });
    }

    // "La 12" text (famous Boca fan group)
    this.add.text(W - 55, H - 50, 'LA 12', {
      fontSize: '14px', fill: '#FFcc00', fontStyle: 'bold',
      stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setRotation(-Math.PI / 2);
  }

  createKremlinEffects() {
    const W = GAME_CONFIG.WIDTH;
    const H = GAME_CONFIG.HEIGHT;

    // Large Kremlin wall at top
    const wall = this.add.rectangle(W / 2, 50, 600, 80, 0x8B0000, 0.85);
    wall.setStrokeStyle(4, 0x550000);

    // Kremlin towers
    for (let i = 0; i < 5; i++) {
      const towerX = W / 2 - 240 + i * 120;
      // Tower base
      this.add.rectangle(towerX, 60, 40, 100, 0x7B0000).setStrokeStyle(2, 0x550000);
      // Tower top (pointed)
      this.add.triangle(towerX, 0, towerX - 25, 30, towerX + 25, 30, 0x006400);

      // Red star on top
      if (i === 2) {
        this.add.text(towerX, 5, '☆', {
          fontSize: '28px', fill: '#ff0000',
          stroke: '#ffff00', strokeThickness: 2
        }).setOrigin(0.5);
      }
    }

    // St. Basil's Cathedral dome colors on sides
    const domeColors = [0xFF0000, 0x0000FF, 0x00FF00, 0xFFFF00, 0xFF00FF];
    for (let i = 0; i < 3; i++) {
      this.add.ellipse(120 + i * 50, 100, 30, 50, domeColors[i], 0.7)
        .setStrokeStyle(2, 0x000000);
      this.add.ellipse(W - 120 - i * 50, 100, 30, 50, domeColors[i + 2], 0.7)
        .setStrokeStyle(2, 0x000000);
    }

    // Red square paving
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 5; j++) {
        const tile = this.add.rectangle(
          150 + i * 100, 200 + j * 100, 80, 80, 0x3a2a2a, 0.3
        );
        tile.setStrokeStyle(1, 0x5a3a3a, 0.3);
        tile.setDepth(-2);
      }
    }

    // Snow particles
    for (let i = 0; i < 20; i++) {
      const snow = this.add.circle(
        Math.random() * W,
        Math.random() * H,
        3, 0xffffff, 0.6
      );
      this.tweens.add({
        targets: snow,
        y: H + 20,
        x: snow.x + (Math.random() - 0.5) * 100,
        duration: 5000 + Math.random() * 3000,
        repeat: -1,
        onRepeat: () => {
          snow.y = -20;
          snow.x = Math.random() * W;
        }
      });
    }

    // Russian text
    this.add.text(W / 2, 120, 'КРАСНАЯ ПЛОЩАДЬ', {
      fontSize: '16px', fill: '#ffff00',
      stroke: '#8B0000', strokeThickness: 3
    }).setOrigin(0.5).setAlpha(0.7);
  }

  createMarALagoEffects() {
    const W = GAME_CONFIG.WIDTH;
    const H = GAME_CONFIG.HEIGHT;

    // Palm trees on sides
    for (let i = 0; i < 6; i++) {
      const treeX = i < 3 ? 60 + i * 60 : W - 180 + (i - 3) * 60;
      // Trunk
      this.add.rectangle(treeX, 150, 15, 120, 0x8B4513, 0.8);
      // Palm leaves
      for (let j = 0; j < 5; j++) {
        const angle = -Math.PI / 2 + (j - 2) * 0.4;
        const leaf = this.add.ellipse(
          treeX + Math.cos(angle) * 40,
          100 + Math.sin(angle) * 20,
          60, 15, 0x228B22, 0.7
        );
        leaf.setRotation(angle);
      }
    }

    // Large sand bunkers
    const bunkerPositions = [
      { x: 300, y: 250 }, { x: 980, y: 250 },
      { x: 300, y: 470 }, { x: 980, y: 470 }
    ];
    for (const pos of bunkerPositions) {
      const bunker = this.add.ellipse(pos.x, pos.y, 120, 70, 0xF4A460, 0.6);
      bunker.setStrokeStyle(3, 0xDEB887);
      bunker.setDepth(-1);
      // Sand texture dots
      for (let i = 0; i < 10; i++) {
        this.add.circle(
          pos.x + (Math.random() - 0.5) * 80,
          pos.y + (Math.random() - 0.5) * 40,
          2, 0xFFE4B5, 0.5
        ).setDepth(-1);
      }
    }

    // Large water hazard (pond)
    const water = this.add.ellipse(W / 2, H - 90, 300, 100, 0x4169E1, 0.5);
    water.setStrokeStyle(3, 0x000080);
    water.setDepth(-1);

    // Water ripples
    for (let i = 0; i < 3; i++) {
      const ripple = this.add.ellipse(W / 2 + (i - 1) * 80, H - 90, 40, 15);
      ripple.setStrokeStyle(2, 0x87CEEB, 0.4);
      ripple.setFillStyle(0x000000, 0);
      this.tweens.add({
        targets: ripple,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0,
        duration: 2000,
        repeat: -1,
        delay: i * 700,
      });
    }

    // Golf flag
    this.add.rectangle(W / 2, 300, 4, 60, 0xffffff);
    this.add.triangle(W / 2 + 15, 280, W / 2, 270, W / 2, 300, 0xff0000);

    // Trump Mar-a-Lago mansion silhouette at top
    const mansion = this.add.rectangle(W / 2, 45, 500, 70, 0xFFE4C4, 0.8);
    mansion.setStrokeStyle(3, 0xDEB887);

    // Mansion details
    for (let i = 0; i < 6; i++) {
      this.add.rectangle(W / 2 - 200 + i * 80, 50, 30, 40, 0x8B4513, 0.6);
    }

    // American flag
    this.add.text(W / 2 + 200, 30, '🇺🇸', { fontSize: '28px' }).setOrigin(0.5);

    // Golf carts scattered (decorative)
    for (let i = 0; i < 3; i++) {
      this.add.text(
        200 + i * 400,
        500 - i * 150,
        '🏎️', { fontSize: '20px' }
      ).setAlpha(0.4);
    }
  }

  showMapName() {
    const mapName = this.mapConfig.name;
    const text = this.add.text(GAME_CONFIG.WIDTH / 2, 100, mapName.toUpperCase(), {
      fontSize: '36px',
      fill: this.mapConfig.color,
      fontFamily: 'Courier New',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0).setScrollFactor(0).setDepth(200);

    // Fade in and out
    this.tweens.add({
      targets: text,
      alpha: 1,
      duration: 500,
      yoyo: true,
      hold: 2000,
      onComplete: () => text.destroy(),
    });
  }

  createUI() {
    const W = GAME_CONFIG.WIDTH;
    const H = GAME_CONFIG.HEIGHT;
    const centerX = W / 2;

    // Score panel
    const scoreBg = this.add.rectangle(70, 30, 120, 40, 0x000000, 0.7);
    scoreBg.setStrokeStyle(2, 0xffff00);
    scoreBg.setScrollFactor(0);

    this.scoreText = this.add
      .text(70, 30, '0', {
        fontSize: '24px',
        fill: '#ffff00',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    // Ultimate bar
    const ultBg = this.add.rectangle(centerX, H - 50, 200, 20, 0x000000, 0.7);
    ultBg.setStrokeStyle(2, 0xff00ff);
    ultBg.setScrollFactor(0);

    this.ultimateBarFill = this.add.rectangle(centerX - 98, H - 50, 0, 16, 0xff00ff);
    this.ultimateBarFill.setOrigin(0, 0.5);
    this.ultimateBarFill.setScrollFactor(0);

    this.ultimateText = this.add
      .text(centerX, H - 50, '[Q] ULTIMATE: 0%', {
        fontSize: '16px',
        fill: '#ffffff',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    // Kill streak indicator
    this.killStreakText = this.add
      .text(W - 70, 30, '', {
        fontSize: '20px',
        fill: '#ff8800',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    // Game timer (Arena mode only)
    const timerBg = this.add.rectangle(centerX, 30, 100, 40, 0x000000, 0.7);
    timerBg.setStrokeStyle(2, 0x00ffff);
    timerBg.setScrollFactor(0);

    this.gameTimerText = this.add
      .text(centerX, 30, '3:00', {
        fontSize: '24px',
        fill: '#00ffff',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    this.timerBg = timerBg;

    // Instructions
    this.add
      .text(centerX, H - 20, 'WASD: Mover | Click: Disparar | SPACE: Esquivar | SHIFT: Habilidad | Q: Ultimate | TAB: Puntajes', {
        fontSize: '14px',
        fill: '#666666',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    // Scoreboard (TAB)
    this.scoreboard = this.add.container(centerX, H / 2);
    this.scoreboard.setVisible(false);
    this.scoreboard.setDepth(300);

    this.input.keyboard.on('keydown-TAB', (event) => {
      event.preventDefault();
      this.scoreboard.setVisible(true);
    });

    this.input.keyboard.on('keyup-TAB', () => {
      this.scoreboard.setVisible(false);
    });

    // Control hints that fade out after 10 seconds
    this.createControlHints();

    // Wave survival UI (only created in WAVE_SURVIVAL mode)
    if (this.gameMode === 'WAVE_SURVIVAL') {
      this.createWaveSurvivalUI();
    }

    // Infinite Horde UI
    if (this.gameMode === 'INFINITE_HORDE') {
      this.createInfiniteHordeUI();
    }
  }

  createWaveSurvivalUI() {
    const W = GAME_CONFIG.WIDTH;
    const H = GAME_CONFIG.HEIGHT;
    const centerX = W / 2;

    // Wave counter (top center)
    const waveBg = this.add.rectangle(centerX, 30, 200, 50, 0x000000, 0.8);
    waveBg.setStrokeStyle(2, 0x00ffff);
    waveBg.setScrollFactor(0);
    waveBg.setDepth(200);

    this.waveText = this.add
      .text(centerX, 25, 'WAVE 1', {
        fontSize: '28px',
        fill: '#00ffff',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(201);

    this.mobsRemainingText = this.add
      .text(centerX, 45, 'Mobs: 0', {
        fontSize: '14px',
        fill: '#88ffff',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(201);

    // Modifiers display (right side)
    this.modifiersContainer = this.add.container(W - 100, 80);
    this.modifiersContainer.setScrollFactor(0);
    this.modifiersContainer.setDepth(200);
    this.createModifiersDisplay();

    // Perks display (left side below score)
    this.perksContainer = this.add.container(15, 80);
    this.perksContainer.setScrollFactor(0);
    this.perksContainer.setDepth(200);

    // Perk selection overlay (hidden by default)
    this.perkSelectionContainer = this.add.container(centerX, H / 2);
    this.perkSelectionContainer.setScrollFactor(0);
    this.perkSelectionContainer.setDepth(500);
    this.perkSelectionContainer.setVisible(false);

    // Game over overlay (hidden by default)
    this.gameOverContainer = this.add.container(centerX, H / 2);
    this.gameOverContainer.setScrollFactor(0);
    this.gameOverContainer.setDepth(600);
    this.gameOverContainer.setVisible(false);

    // Fog of war overlay (if modifier active)
    if (this.activeModifiers.includes('FOG_OF_WAR')) {
      this.createFogOfWar();
    }
  }

  createModifiersDisplay() {
    // Clear existing
    this.modifiersContainer.removeAll(true);

    if (this.activeModifiers.length === 0) return;

    // Title
    const title = this.add.text(0, 0, 'MODIFIERS', fontStyle('small', COLORS.warning)).setOrigin(0.5);
    this.modifiersContainer.add(title);

    // List modifiers
    this.activeModifiers.forEach((modId, i) => {
      const mod = MAP_MODIFIERS[modId];
      if (!mod) return;

      const modText = this.add.text(0, 20 + i * 20, mod.name, fontStyle('small', mod.color || COLORS.text)).setOrigin(0.5);
      this.modifiersContainer.add(modText);
    });
  }

  createInfiniteHordeUI() {
    const W = GAME_CONFIG.WIDTH;
    const H = GAME_CONFIG.HEIGHT;
    const centerX = W / 2;

    // Wave counter (top center)
    const waveBg = this.add.rectangle(centerX, 30, 200, 50, 0x000000, 0.8);
    waveBg.setStrokeStyle(2, 0xff4400);
    waveBg.setScrollFactor(0);
    waveBg.setDepth(200);

    this.waveText = this.add
      .text(centerX, 25, 'WAVE 1', {
        fontSize: '28px',
        fill: '#ff4400',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(201);

    this.mobsRemainingText = this.add
      .text(centerX, 45, 'Mobs: 0', {
        fontSize: '14px',
        fill: '#ff8844',
        fontFamily: 'Courier New',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(201);

    // Boss health bar (hidden by default, shown when boss spawns)
    this.bossHealthContainer = this.add.container(centerX, 80);
    this.bossHealthContainer.setScrollFactor(0);
    this.bossHealthContainer.setDepth(250);
    this.bossHealthContainer.setVisible(false);

    const bossBarBg = this.add.rectangle(0, 0, 400, 25, 0x000000, 0.9);
    bossBarBg.setStrokeStyle(3, 0xff0000);
    this.bossHealthContainer.add(bossBarBg);

    this.bossHealthBarFill = this.add.rectangle(-198, 0, 396, 21, 0xff4400);
    this.bossHealthBarFill.setOrigin(0, 0.5);
    this.bossHealthContainer.add(this.bossHealthBarFill);

    this.bossNameText = this.add.text(0, -25, 'BOSS', {
      fontSize: '18px',
      fill: '#ff4400',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    this.bossHealthContainer.add(this.bossNameText);

    this.bossHealthText = this.add.text(0, 0, '', {
      fontSize: '14px',
      fill: '#ffffff',
      fontFamily: 'Courier New',
    }).setOrigin(0.5);
    this.bossHealthContainer.add(this.bossHealthText);

    // Modifiers display (right side)
    this.modifiersContainer = this.add.container(W - 100, 80);
    this.modifiersContainer.setScrollFactor(0);
    this.modifiersContainer.setDepth(200);
    this.createModifiersDisplay();

    // Perks display (left side below score)
    this.perksContainer = this.add.container(15, 80);
    this.perksContainer.setScrollFactor(0);
    this.perksContainer.setDepth(200);

    // Perk selection overlay (hidden by default)
    this.perkSelectionContainer = this.add.container(centerX, H / 2);
    this.perkSelectionContainer.setScrollFactor(0);
    this.perkSelectionContainer.setDepth(500);
    this.perkSelectionContainer.setVisible(false);

    // Game over overlay (hidden by default)
    this.gameOverContainer = this.add.container(centerX, H / 2);
    this.gameOverContainer.setScrollFactor(0);
    this.gameOverContainer.setDepth(600);
    this.gameOverContainer.setVisible(false);

    // Fog of war overlay (if modifier active)
    if (this.activeModifiers.includes('FOG_OF_WAR')) {
      this.createFogOfWar();
    }
  }

  // Boss event handlers
  onBossSpawn(data) {
    this.activeBoss = data;
    this.isBossWave = true;

    // Show boss health bar
    if (this.bossHealthContainer) {
      this.bossHealthContainer.setVisible(true);
      this.bossNameText.setText(data.bossConfig?.name || 'BOSS');
      this.bossHealthText.setText(`${data.health} / ${data.maxHealth}`);
      this.bossHealthBarFill.setScale(1, 1);
    }

    // Boss wave announcement
    this.showBossWaveAnnouncement(data);

    // Screen shake
    this.cameras.main.shake(500, 0.02);
  }

  showBossWaveAnnouncement(data) {
    const centerX = GAME_CONFIG.WIDTH / 2;
    const centerY = GAME_CONFIG.HEIGHT / 2;

    // Warning text
    const warning = this.add
      .text(centerX, centerY - 50, '⚠ BOSS WAVE ⚠', {
        fontSize: '48px',
        fill: '#ff0000',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(400)
      .setAlpha(0)
      .setScale(0.5);

    // Boss name
    const bossName = this.add
      .text(centerX, centerY + 20, data.bossConfig?.name || 'UNKNOWN BOSS', {
        fontSize: '36px',
        fill: '#ff4400',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(400)
      .setAlpha(0);

    // Animate in
    this.tweens.add({
      targets: [warning, bossName],
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Pulse effect
        this.tweens.add({
          targets: warning,
          scale: 1.1,
          duration: 200,
          yoyo: true,
          repeat: 2,
          onComplete: () => {
            this.time.delayedCall(500, () => {
              this.tweens.add({
                targets: [warning, bossName],
                alpha: 0,
                y: '-=30',
                duration: 300,
                onComplete: () => {
                  warning.destroy();
                  bossName.destroy();
                },
              });
            });
          },
        });
      },
    });

    // Red flash
    this.cameras.main.flash(200, 255, 0, 0);
  }

  onBossDeath(data) {
    this.activeBoss = null;

    // Hide boss health bar
    if (this.bossHealthContainer) {
      this.bossHealthContainer.setVisible(false);
    }

    // Victory announcement
    const centerX = GAME_CONFIG.WIDTH / 2;
    const centerY = GAME_CONFIG.HEIGHT / 2;

    const victory = this.add
      .text(centerX, centerY, '💀 BOSS DEFEATED! 💀', {
        fontSize: '42px',
        fill: '#00ff00',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(400)
      .setScale(0);

    this.tweens.add({
      targets: victory,
      scale: 1.2,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: victory,
          scale: 1,
          alpha: 0,
          y: centerY - 50,
          duration: 1500,
          delay: 1000,
          onComplete: () => victory.destroy(),
        });
      },
    });

    // Green flash + screen shake
    this.cameras.main.flash(300, 0, 255, 0);
    this.cameras.main.shake(300, 0.015);
  }

  onBossCharge(data) {
    const mob = this.mobs[data.mobId];
    if (!mob) return;

    // Warning indicator at charge destination
    const warning = this.add.circle(data.targetX, data.targetY, 40, 0xff0000, 0.3);
    warning.setStrokeStyle(3, 0xff0000);
    warning.setDepth(50);

    this.tweens.add({
      targets: warning,
      scale: 1.5,
      alpha: 0,
      duration: 500,
      onComplete: () => warning.destroy(),
    });

    // Flash the boss
    if (mob.container) {
      this.tweens.add({
        targets: mob.container,
        scaleX: mob.container.scaleX * 1.2,
        scaleY: mob.container.scaleY * 0.8,
        duration: 100,
        yoyo: true,
      });
    }
  }

  onMobCharge(data) {
    const mob = this.mobs[data.mobId];
    if (!mob) return;

    // Warning line from mob to target
    const line = this.add.graphics();
    line.lineStyle(3, 0xff4444, 0.8);
    line.setDepth(45);

    const startX = mob.container ? mob.container.x : data.targetX;
    const startY = mob.container ? mob.container.y : data.targetY;

    line.moveTo(startX, startY);
    line.lineTo(data.targetX, data.targetY);
    line.strokePath();

    // Target circle
    const targetCircle = this.add.circle(data.targetX, data.targetY, 25, 0xff4444, 0.2);
    targetCircle.setStrokeStyle(2, 0xff4444);
    targetCircle.setDepth(45);

    this.tweens.add({
      targets: [line, targetCircle],
      alpha: 0,
      duration: 400,
      onComplete: () => {
        line.destroy();
        targetCircle.destroy();
      },
    });

    // Flash the mob
    if (mob.container) {
      this.tweens.add({
        targets: mob.container,
        scaleX: 1.3,
        scaleY: 0.7,
        duration: 80,
        yoyo: true,
      });
    }

    // Dust particles at start
    for (let i = 0; i < 5; i++) {
      const dust = this.add.circle(
        startX + (Math.random() - 0.5) * 20,
        startY + 15,
        3 + Math.random() * 3,
        0x8B7355,
        0.7
      );
      dust.setDepth(44);

      this.tweens.add({
        targets: dust,
        y: dust.y - 20 - Math.random() * 15,
        alpha: 0,
        scale: 0.3,
        duration: 300 + Math.random() * 200,
        onComplete: () => dust.destroy(),
      });
    }
  }

  onBossShoot(data) {
    const mob = this.mobs[data.mobId];
    if (!mob) return;

    // Muzzle flash effect
    const flash = this.add.circle(mob.container.x + 30, mob.container.y, 15, 0xffff00, 1);
    flash.setDepth(100);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2,
      duration: 150,
      onComplete: () => flash.destroy(),
    });
  }

  // Dynamic hazard handlers
  onCarSpawn(data) {
    if (!this.trafficCars) return;

    // Create car visual
    const car = this.add.container(data.x, data.y);

    // Car body
    const body = this.add.rectangle(0, 0, data.width, data.height, 0xffff00);
    body.setStrokeStyle(2, 0x000000);

    // Wheels
    this.add.circle(-25, 15, 8, 0x333333).setStrokeStyle(2, 0x000000);
    this.add.circle(25, 15, 8, 0x333333).setStrokeStyle(2, 0x000000);
    this.add.circle(-25, -15, 8, 0x333333).setStrokeStyle(2, 0x000000);
    this.add.circle(25, -15, 8, 0x333333).setStrokeStyle(2, 0x000000);

    // Windshield
    const windshield = this.add.rectangle(data.speed > 0 ? 20 : -20, 0, 15, 25, 0x87CEEB, 0.7);

    car.add([body, windshield]);
    car.setData('carId', data.id);
    car.setData('speed', data.speed);

    this.trafficCars.add(car);

    // Animate car across screen
    const targetX = data.speed > 0 ? GAME_CONFIG.WIDTH + 100 : -100;
    const duration = Math.abs(targetX - data.x) / Math.abs(data.speed) * 1000;

    this.tweens.add({
      targets: car,
      x: targetX,
      duration,
      onComplete: () => car.destroy(),
    });
  }

  onHazardWarning(data) {
    // Warning indicator before hazard
    const warning = this.add.container(data.x, data.y);
    warning.setDepth(100);

    // Warning circle
    const circle = this.add.circle(0, 0, data.radius, 0xff0000, 0.2);
    circle.setStrokeStyle(3, 0xff0000, 0.8);
    warning.add(circle);

    // Warning icon
    const icon = this.add.text(0, 0, '⚠️', { fontSize: '32px' }).setOrigin(0.5);
    warning.add(icon);

    // Warning text
    let hazardName = data.type;
    if (data.type === 'ERUPTION') hazardName = 'LAVA';
    if (data.type === 'FALLING_ROCKS') hazardName = 'ROCAS';
    if (data.type === 'RISING_SPIKES') hazardName = 'PINCHOS';

    const text = this.add.text(0, -50, hazardName, {
      fontSize: '14px',
      fill: '#ff0000',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    warning.add(text);

    // Pulse animation
    this.tweens.add({
      targets: circle,
      scale: 1.2,
      alpha: 0.1,
      duration: 300,
      yoyo: true,
      repeat: Math.floor(data.warningTime / 600),
    });

    // Remove after warning time
    this.time.delayedCall(data.warningTime, () => {
      this.tweens.add({
        targets: warning,
        alpha: 0,
        duration: 200,
        onComplete: () => warning.destroy(),
      });
    });
  }

  onLavaPoolSpawn(data) {
    if (!this.lavaPools) {
      this.lavaPools = this.add.container(0, 0);
      this.lavaPools.setDepth(5);
    }

    // Create lava pool
    const pool = this.add.container(data.x, data.y);
    pool.setData('poolId', data.id);

    // Lava circle
    const lava = this.add.circle(0, 0, data.radius, 0xff4400, 0.8);
    lava.setStrokeStyle(3, 0xff0000);
    pool.add(lava);

    // Bubbling effect
    for (let i = 0; i < 4; i++) {
      const bubble = this.add.circle(
        (Math.random() - 0.5) * data.radius,
        (Math.random() - 0.5) * data.radius,
        5, 0xffaa00, 0.9
      );
      pool.add(bubble);

      this.tweens.add({
        targets: bubble,
        y: bubble.y - 20,
        alpha: 0,
        scale: 1.5,
        duration: 500,
        repeat: -1,
        delay: Math.random() * 500,
      });
    }

    // Pulsing glow
    this.tweens.add({
      targets: lava,
      fillColor: 0xff6600,
      duration: 400,
      yoyo: true,
      repeat: -1,
    });

    this.lavaPools.add(pool);

    // Screen shake
    this.cameras.main.shake(200, 0.01);
  }

  onLavaPoolExpire(data) {
    if (!this.lavaPools) return;

    const pools = this.lavaPools.getAll();
    for (const pool of pools) {
      if (pool.getData('poolId') === data.id) {
        this.tweens.add({
          targets: pool,
          alpha: 0,
          scale: 0.5,
          duration: 500,
          onComplete: () => pool.destroy(),
        });
        break;
      }
    }
  }

  onRockImpact(data) {
    // Rock impact effect
    const impact = this.add.container(data.x, data.y);
    impact.setDepth(100);

    // Impact circle
    const circle = this.add.circle(0, 0, data.radius, 0x8B4513, 0.6);
    circle.setStrokeStyle(4, 0x4a2a13);
    impact.add(circle);

    // Rock debris
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const rock = this.add.circle(0, 0, 8 + Math.random() * 8, 0x6a4a33);
      impact.add(rock);

      this.tweens.add({
        targets: rock,
        x: Math.cos(angle) * (data.radius + 50),
        y: Math.sin(angle) * (data.radius + 50),
        alpha: 0,
        duration: 500,
      });
    }

    // Screen shake
    this.cameras.main.shake(300, 0.02);

    // Fade out
    this.tweens.add({
      targets: impact,
      alpha: 0,
      duration: 1000,
      delay: 500,
      onComplete: () => impact.destroy(),
    });
  }

  onSpikeRise(data) {
    // Spike rise effect
    const spikes = this.add.container(data.x, data.y);
    spikes.setDepth(100);

    // Spike circle
    const base = this.add.circle(0, 0, data.radius, 0x444444, 0.4);
    base.setStrokeStyle(3, 0x333333);
    spikes.add(base);

    // Spike triangles
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const dist = data.radius * 0.6;
      const spike = this.add.triangle(
        Math.cos(angle) * dist,
        Math.sin(angle) * dist,
        0, 0, 10, 25, -10, 25,
        0x666666
      );
      spike.setRotation(angle + Math.PI);
      spike.setScale(0);
      spikes.add(spike);

      // Spike rise animation
      this.tweens.add({
        targets: spike,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
        delay: i * 50,
      });
    }

    // Screen shake
    this.cameras.main.shake(200, 0.015);

    // Retract after delay
    this.time.delayedCall(1500, () => {
      this.tweens.add({
        targets: spikes,
        alpha: 0,
        scaleY: 0,
        duration: 300,
        onComplete: () => spikes.destroy(),
      });
    });
  }

  onComboHit(data) {
    // Show combo hit effect
    const comboColors = {
      2: '#ffff00',
      3: '#ff8800',
      4: '#ff0000',
    };

    const color = comboColors[Math.min(data.comboCount, 4)] || '#ffff00';

    // Combo text
    const comboText = this.add.text(data.x, data.y - 40, `COMBO x${data.comboCount}!`, {
      fontSize: '20px',
      fill: color,
      fontFamily: 'Courier New',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(150);

    // Bonus damage text
    if (data.bonusDamage > 0) {
      const bonusText = this.add.text(data.x, data.y - 60, `+${data.bonusDamage}`, {
        fontSize: '16px',
        fill: '#00ff00',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(150);

      this.tweens.add({
        targets: bonusText,
        y: bonusText.y - 30,
        alpha: 0,
        duration: 800,
        onComplete: () => bonusText.destroy(),
      });
    }

    // Animate combo text
    this.tweens.add({
      targets: comboText,
      y: comboText.y - 50,
      alpha: 0,
      scale: 1.5,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => comboText.destroy(),
    });

    // Ring effect for x4 combo
    if (data.comboCount >= 4) {
      const ring = this.add.circle(data.x, data.y, 20, 0xff0000, 0);
      ring.setStrokeStyle(4, 0xff0000);
      ring.setDepth(100);

      this.tweens.add({
        targets: ring,
        scale: 3,
        alpha: 0,
        duration: 500,
        onComplete: () => ring.destroy(),
      });
    }
  }

  createFogOfWar() {
    // Dark overlay with cutout around local player
    this.fogGraphics = this.add.graphics();
    this.fogGraphics.setScrollFactor(0);
    this.fogGraphics.setDepth(100);
    this.updateFogOfWar();
  }

  updateFogOfWar() {
    if (!this.fogGraphics) return;

    const W = GAME_CONFIG.WIDTH;
    const H = GAME_CONFIG.HEIGHT;
    const localPlayer = this.localPlayers[SocketManager.playerId];

    this.fogGraphics.clear();
    this.fogGraphics.fillStyle(0x000000, 0.7);
    this.fogGraphics.fillRect(0, 0, W, H);

    if (localPlayer && localPlayer.alive) {
      // Cut out a circle around the player
      this.fogGraphics.fillStyle(0x000000, 0);
      // Use blend mode to create cutout
      const radius = 200;
      const gradient = this.add.graphics();
      gradient.setScrollFactor(0);
      gradient.setDepth(100);

      // Create radial gradient effect
      for (let r = radius; r > 0; r -= 5) {
        const alpha = 0.7 * (r / radius);
        this.fogGraphics.fillStyle(0x000000, alpha);
        this.fogGraphics.fillCircle(localPlayer.sprite.x, localPlayer.sprite.y, r);
      }
      this.fogGraphics.fillStyle(0x000000, 0);
      this.fogGraphics.fillCircle(localPlayer.sprite.x, localPlayer.sprite.y, 100);
    }
  }

  showPerkSelection(perks, timeRemaining) {
    this.perkSelectionActive = true;
    this.selectedPerkId = null;
    this.perkSelectionContainer.removeAll(true);
    this.perkSelectionContainer.setVisible(true);

    const W = GAME_CONFIG.WIDTH;
    const H = GAME_CONFIG.HEIGHT;

    // Dark overlay (depth -1 so cards render on top)
    const overlay = this.add.rectangle(0, 0, W, H, 0x000000, 0.8);
    overlay.setDepth(-1);
    this.perkSelectionContainer.add(overlay);

    // Title
    const title = this.add.text(0, -180, t('game.choosePerk'), {
      fontSize: '32px',
      fill: '#00ffff',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.perkSelectionContainer.add(title);

    // Timer
    this.perkTimerText = this.add.text(0, -140, `${t('game.time')} ${Math.ceil(timeRemaining / 1000)}s`, {
      fontSize: '18px',
      fill: '#ffff00',
      fontFamily: 'Courier New',
    }).setOrigin(0.5);
    this.perkSelectionContainer.add(this.perkTimerText);

    // Perk cards
    const cardWidth = 180;
    const cardSpacing = 200;
    const startX = -(perks.length - 1) * cardSpacing / 2;

    perks.forEach((perkData, i) => {
      const perkId = perkData.id || perkData;
      const perk = PERKS[perkId] || perkData;
      if (!perk) return;

      const cardX = startX + i * cardSpacing;
      this.createPerkCard(cardX, 0, perkId, perk, cardWidth);
    });
  }

  createPerkCard(x, y, perkId, perk, width) {
    const height = 220;

    // Background - add directly to scene, not container
    const bg = this.add.rectangle(x, y, width, height, 0x222244, 1);
    bg.setStrokeStyle(3, 0x00ffff);
    bg.setScrollFactor(0);
    bg.setDepth(501);

    // Adjust position relative to screen center
    const centerX = GAME_CONFIG.WIDTH / 2;
    const centerY = GAME_CONFIG.HEIGHT / 2;
    bg.setPosition(centerX + x, centerY + y);

    // Icon
    const iconColors = {
      DAMAGE_BOOST: 0xff4444,
      HEALTH_BOOST: 0x44ff44,
      SPEED_BOOST: 0x44ffff,
      FIRE_RATE_BOOST: 0xffff44,
      COOLDOWN_REDUCTION: 0x8844ff,
      VAMPIRISM: 0xff44aa,
      EXPLOSIVE_KILLS: 0xff8800,
      SHIELD_ON_WAVE: 0x4488ff,
      PROJECTILE_SIZE: 0xaaaaaa,
      ULTIMATE_CHARGE: 0xff00ff,
    };
    const icon = this.add.circle(centerX + x, centerY + y - 70, 25, iconColors[perkId] || 0xffffff);
    icon.setScrollFactor(0);
    icon.setDepth(502);

    // Name
    const nameText = this.add.text(centerX + x, centerY + y - 30, perk.name, {
      fontSize: '14px',
      fill: '#ffffff',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
      wordWrap: { width: width - 20 },
      align: 'center',
    }).setOrigin(0.5);
    nameText.setScrollFactor(0);
    nameText.setDepth(502);

    // Description
    const descText = this.add.text(centerX + x, centerY + y + 30, perk.description, {
      ...fontStyle('small', COLORS.textMuted),
      wordWrap: { width: width - 20 },
      align: 'center',
    }).setOrigin(0.5);
    descText.setScrollFactor(0);
    descText.setDepth(502);

    // Add to container for easy cleanup
    this.perkSelectionContainer.add([bg, icon, nameText, descText]);

    // Make bg rectangle interactive
    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerover', () => {
      bg.setStrokeStyle(3, 0xffff00);
    });
    bg.on('pointerout', () => {
      bg.setStrokeStyle(3, 0x00ffff);
    });
    bg.on('pointerdown', () => {
      if (!this.selectedPerkId) {
        this.selectedPerkId = perkId;
        SocketManager.selectPerk(perkId);
        bg.setFillStyle(0x004444);
        bg.setStrokeStyle(3, 0x00ff00);
      }
    });
  }

  hidePerkSelection() {
    this.perkSelectionActive = false;
    this.perkSelectionContainer.setVisible(false);
  }

  showWaveStartAnimation(waveNumber, isBossWave = false) {
    const centerX = GAME_CONFIG.WIDTH / 2;
    const centerY = GAME_CONFIG.HEIGHT / 2;

    const color = isBossWave ? '#ff4400' : (this.gameMode === 'INFINITE_HORDE' ? '#ff4400' : '#00ffff');

    const waveAnnounce = this.add
      .text(centerX, centerY, `WAVE ${waveNumber}`, {
        fontSize: '64px',
        fill: color,
        fontFamily: 'Courier New',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(400)
      .setAlpha(0)
      .setScale(0.5);

    this.tweens.add({
      targets: waveAnnounce,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(1000, () => {
          this.tweens.add({
            targets: waveAnnounce,
            alpha: 0,
            scale: 1.5,
            duration: 300,
            onComplete: () => waveAnnounce.destroy(),
          });
        });
      },
    });
  }

  showGameOver(finalWave, stats) {
    this.gameOverContainer.removeAll(true);
    this.gameOverContainer.setVisible(true);

    const W = GAME_CONFIG.WIDTH;
    const H = GAME_CONFIG.HEIGHT;

    // Dark overlay
    const overlay = this.add.rectangle(0, 0, W, H, 0x000000, 0.9);
    this.gameOverContainer.add(overlay);

    // Title
    const title = this.add.text(0, -150, t('game.gameOver'), {
      fontSize: '48px',
      fill: '#ff4444',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.gameOverContainer.add(title);

    // Final wave
    const waveText = this.add.text(0, -80, `${t('game.finalWave')} ${finalWave}`, {
      fontSize: '28px',
      fill: '#00ffff',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.gameOverContainer.add(waveText);

    // Stats
    const statsText = this.add.text(0, 0, [
      `${t('game.totalKills')} ${stats.totalKills || 0}`,
      `${t('game.perksCollected')} ${stats.perksCollected || 0}`,
      `${t('game.timeSurvived')} ${Math.floor((stats.timeSurvived || 0) / 1000)}s`,
    ].join('\n'), {
      fontSize: '18px',
      fill: '#ffffff',
      fontFamily: 'Courier New',
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5);
    this.gameOverContainer.add(statsText);

    // Return to lobby button
    const btnBg = this.add.rectangle(0, 120, 200, 50, 0x444488);
    btnBg.setStrokeStyle(2, 0x00ffff);
    btnBg.setInteractive({ useHandCursor: true });
    this.gameOverContainer.add(btnBg);

    const btnText = this.add.text(0, 120, t('game.returnLobby'), {
      fontSize: '16px',
      fill: '#ffffff',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.gameOverContainer.add(btnText);

    btnBg.on('pointerover', () => btnBg.setFillStyle(0x6666aa));
    btnBg.on('pointerout', () => btnBg.setFillStyle(0x444488));
    btnBg.on('pointerdown', () => {
      SoundManager.stopDubstep();
      this.scene.start('LobbyScene');
    });
  }

  updatePlayerPerksDisplay() {
    if (!this.perksContainer) return;

    this.perksContainer.removeAll(true);

    const localPlayer = this.localPlayers[SocketManager.playerId];
    if (!localPlayer || !localPlayer.perks) return;

    const perkIds = Object.keys(localPlayer.perks);
    if (perkIds.length === 0) return;

    // Title
    const title = this.add.text(0, 0, 'PERKS', fontStyle('small', COLORS.success));
    this.perksContainer.add(title);

    // List perks
    perkIds.forEach((perkId, i) => {
      const perk = PERKS[perkId];
      const stacks = localPlayer.perks[perkId];
      if (!perk || !stacks) return;

      const perkText = this.add.text(0, 18 + i * 16, `${perk.name} x${stacks}`, fontStyle('small', COLORS.success));
      this.perksContainer.add(perkText);
    });
  }

  // Wave event handlers
  onWaveStart(data) {
    this.waveNumber = data.waveNumber;
    this.mobsRemaining = data.mobCount;
    this.isBossWave = data.isBossWave || false;

    // Track game start time on first wave
    if (this.waveNumber === 1 && !this.gameStartTime) {
      this.gameStartTime = Date.now();
    }

    // Increase music intensity with each wave
    SoundManager.setWaveIntensity(this.waveNumber);

    if (this.waveText) {
      this.waveText.setText(`WAVE ${this.waveNumber}`);
    }
    if (this.mobsRemainingText) {
      this.mobsRemainingText.setText(`Mobs: ${this.mobsRemaining}`);
    }

    this.hidePerkSelection();

    // Show boss wave or regular wave animation
    if (this.isBossWave && this.gameMode === 'INFINITE_HORDE') {
      // Boss wave will be announced when boss spawns
      this.showWaveStartAnimation(this.waveNumber, true);
    } else {
      this.showWaveStartAnimation(this.waveNumber, false);
    }
  }

  onWaveComplete(data) {
    // Just update UI, perk selection comes separately
    if (this.mobsRemainingText) {
      this.mobsRemainingText.setText('WAVE COMPLETE!');
    }
  }

  onPerkOffer(data) {
    this.showPerkSelection(data.perks, data.timeRemaining);
  }

  onPerkSelected(data) {
    // Could show notification for other players
  }

  onWaveGameOver(data) {
    const localPlayer = this.localPlayers[SocketManager.playerId];
    const perksCount = localPlayer?.perks ? Object.keys(localPlayer.perks).length : 0;
    const timeSurvived = this.gameStartTime ? Date.now() - this.gameStartTime : 0;

    const stats = {
      totalKills: data.totalMobsKilled || 0,
      perksCollected: perksCount,
      timeSurvived: timeSurvived,
    };
    if (data.finalKill) {
      this.showFinalKill(data.finalKill, () => {
        this.showGameOver(data.finalWave, stats);
      });
    } else {
      this.showGameOver(data.finalWave, stats);
    }
  }

  onArenaGameEnd(data) {
    if (this.gameEnded) return;
    this.gameEnded = true;

    if (data.finalKill) {
      this.showFinalKill(data.finalKill, () => {
        this.showArenaResults(data.winner, data.scores);
      });
    } else {
      this.showArenaResults(data.winner, data.scores);
    }
  }

  showFinalKill(killData, onComplete) {
    const W = GAME_CONFIG.WIDTH;
    const H = GAME_CONFIG.HEIGHT;

    this.finalKillContainer = this.add.container(W / 2, H / 2);
    this.finalKillContainer.setDepth(600);

    // Dark overlay with red tint
    const overlay = this.add.rectangle(0, 0, W, H, 0x110000, 0.85);
    this.finalKillContainer.add(overlay);

    // "FINAL KILL" title with dramatic effect
    const finalKillText = this.add.text(0, -100, t('game.finalKill'), {
      fontSize: '64px',
      fill: '#ff0000',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
      stroke: '#ffff00',
      strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);
    this.finalKillContainer.add(finalKillText);

    // Killer info
    const killerClass = PLAYER_CLASSES[killData.killerClass];
    const killerColor = killerClass ? killerClass.color : '#ffffff';
    const killerText = this.add.text(0, 0, killData.killerName, {
      fontSize: '36px',
      fill: killerColor,
      fontFamily: 'Courier New',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);
    this.finalKillContainer.add(killerText);

    // VS arrow
    const vsText = this.add.text(0, 45, '▼', {
      fontSize: '24px',
      fill: '#ff4444',
      fontFamily: 'Courier New',
    }).setOrigin(0.5).setAlpha(0);
    this.finalKillContainer.add(vsText);

    // Victim info (eliminated player)
    const victimClass = PLAYER_CLASSES[killData.victimClass];
    const victimColor = victimClass ? victimClass.color : '#888888';
    const victimText = this.add.text(0, 90, `☠ ${killData.victimName}`, {
      fontSize: '28px',
      fill: victimColor,
      fontFamily: 'Courier New',
    }).setOrigin(0.5).setAlpha(0);
    this.finalKillContainer.add(victimText);

    // Dramatic screen shake
    this.cameras.main.shake(500, 0.02);

    // Animate elements in sequence
    this.tweens.add({
      targets: finalKillText,
      alpha: 1,
      scale: { from: 2, to: 1 },
      duration: 400,
      ease: 'Back.easeOut',
    });

    this.tweens.add({
      targets: killerText,
      alpha: 1,
      y: { from: 30, to: 0 },
      duration: 300,
      delay: 400,
      ease: 'Power2',
    });

    this.tweens.add({
      targets: vsText,
      alpha: 1,
      duration: 200,
      delay: 600,
    });

    this.tweens.add({
      targets: victimText,
      alpha: 1,
      y: { from: 60, to: 90 },
      duration: 300,
      delay: 700,
      ease: 'Power2',
    });

    // Flash red
    this.cameras.main.flash(300, 255, 0, 0);

    // After 3 seconds, fade out and show results
    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: this.finalKillContainer,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          if (this.finalKillContainer) {
            this.finalKillContainer.destroy();
            this.finalKillContainer = null;
          }
          if (onComplete) onComplete();
        },
      });
    });
  }

  showArenaResults(winner, scores) {
    const W = GAME_CONFIG.WIDTH;
    const H = GAME_CONFIG.HEIGHT;

    // Create game over container
    this.arenaResultsContainer = this.add.container(W / 2, H / 2);
    this.arenaResultsContainer.setDepth(500);

    // Dark overlay
    const overlay = this.add.rectangle(0, 0, W, H, 0x000000, 0.9);
    this.arenaResultsContainer.add(overlay);

    // Title
    const isWinner = winner && winner.id === SocketManager.playerId;
    const titleText = isWinner ? t('game.victory') : t('game.gameOver');
    const titleColor = isWinner ? '#00ff88' : '#ff4444';

    const title = this.add.text(0, -150, titleText, {
      fontSize: '48px',
      fill: titleColor,
      fontFamily: 'Courier New',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.arenaResultsContainer.add(title);

    // Winner info
    if (winner) {
      const winnerText = this.add.text(0, -80, `${t('game.winner')}: ${winner.name} (${winner.score} pts)`, {
        fontSize: '24px',
        fill: '#ffff00',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      this.arenaResultsContainer.add(winnerText);
    }

    // Scoreboard
    const scoreTitle = this.add.text(0, -30, t('game.finalScores'), {
      fontSize: '20px',
      fill: '#00ffff',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.arenaResultsContainer.add(scoreTitle);

    scores.forEach((player, i) => {
      const isMe = player.id === SocketManager.playerId;
      const color = isMe ? '#00ff88' : '#ffffff';
      const scoreText = this.add.text(0, 10 + i * 25, `${i + 1}. ${player.name}: ${player.score}`, {
        fontSize: '16px',
        fill: color,
        fontFamily: 'Courier New',
      }).setOrigin(0.5);
      this.arenaResultsContainer.add(scoreText);
    });

    // Buttons
    const btnY = 120 + Math.min(scores.length * 25, 100);

    // Play Again button
    const playAgainBg = this.add.rectangle(-110, btnY, 180, 50, 0x448844);
    playAgainBg.setStrokeStyle(2, 0x00ff88);
    playAgainBg.setInteractive({ useHandCursor: true });
    this.arenaResultsContainer.add(playAgainBg);

    const playAgainText = this.add.text(-110, btnY, t('game.playAgain'), {
      fontSize: '16px',
      fill: '#ffffff',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.arenaResultsContainer.add(playAgainText);

    playAgainBg.on('pointerover', () => playAgainBg.setFillStyle(0x66aa66));
    playAgainBg.on('pointerout', () => playAgainBg.setFillStyle(0x448844));
    playAgainBg.on('pointerdown', () => {
      SocketManager.playAgain();
    });

    // Return to lobby button
    const lobbyBg = this.add.rectangle(110, btnY, 180, 50, 0x444488);
    lobbyBg.setStrokeStyle(2, 0x00ffff);
    lobbyBg.setInteractive({ useHandCursor: true });
    this.arenaResultsContainer.add(lobbyBg);

    const lobbyText = this.add.text(110, btnY, t('game.returnLobby'), {
      fontSize: '16px',
      fill: '#ffffff',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.arenaResultsContainer.add(lobbyText);

    lobbyBg.on('pointerover', () => lobbyBg.setFillStyle(0x6666aa));
    lobbyBg.on('pointerout', () => lobbyBg.setFillStyle(0x444488));
    lobbyBg.on('pointerdown', () => {
      SoundManager.stopDubstep();
      this.scene.start('LobbyScene');
    });
  }

  createControlHints() {
    const hints = [
      'WASD - Move',
      'Mouse - Aim',
      'Click - Shoot',
      'SHIFT - Ability',
      'Q - Ultimate',
      'SPACE - Dodge',
    ];

    const hintsContainer = this.add.container(15, GAME_CONFIG.HEIGHT - 140);
    hintsContainer.setScrollFactor(0);
    hintsContainer.setDepth(200);

    // Background
    const bg = this.add.rectangle(60, hints.length * 9, 130, hints.length * 18 + 10, 0x000000, 0.6);
    bg.setStrokeStyle(1, 0x444444);
    hintsContainer.add(bg);

    hints.forEach((hint, i) => {
      const text = this.add.text(5, i * 18, hint, fontStyle('small', COLORS.textMuted));
      hintsContainer.add(text);
    });

    // Fade out after 8 seconds
    this.time.delayedCall(8000, () => {
      this.tweens.add({
        targets: hintsContainer,
        alpha: 0,
        duration: 2000,
        onComplete: () => hintsContainer.destroy(),
      });
    });
  }

  updateUltimateUI() {
    const myPlayer = this.localPlayers[SocketManager.playerId];
    if (!myPlayer) return;

    const charge = myPlayer.ultimateCharge || 0;
    const fillWidth = (charge / 100) * 196;
    this.ultimateBarFill.width = fillWidth;

    if (charge >= 100) {
      this.ultimateText.setText('[Q] ULTIMATE: READY!');
      this.ultimateText.setStyle({ fill: '#00ff00' });
    } else {
      this.ultimateText.setText(`[Q] ULTIMATE: ${Math.floor(charge)}%`);
      this.ultimateText.setStyle({ fill: '#ffffff' });
    }

    // Kill streak display
    if (myPlayer.killStreak >= 2) {
      const streakInfo = KILL_STREAKS[myPlayer.killStreak] || KILL_STREAKS[Math.min(myPlayer.killStreak, 10)];
      if (streakInfo) {
        this.killStreakText.setText(`${myPlayer.killStreak}x STREAK`);
        this.killStreakText.setStyle({ fill: streakInfo.color });
      }
    } else {
      this.killStreakText.setText('');
    }
  }

  updateScoreboard(scores) {
    this.scoreboard.removeAll(true);

    const bg = this.add.rectangle(0, 0, 350, 300, 0x000000, 0.9);
    bg.setStrokeStyle(3, 0xff00ff);
    this.scoreboard.add(bg);

    const title = this.add
      .text(0, -120, 'PUNTAJES', {
        fontSize: '28px',
        fill: '#ffff00',
        fontFamily: 'Courier New',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.scoreboard.add(title);

    let y = -80;
    const sortedScores = Object.entries(scores).sort((a, b) => b[1].score - a[1].score);

    sortedScores.forEach(([id, data], index) => {
      const isMe = id === SocketManager.playerId;
      const medal = index === 0 ? '1ro' : index === 1 ? '2do' : index === 2 ? '3ro' : `${index + 1}to`;
      const stats = PLAYER_CLASSES[data.classType || 'MESSI'];
      const classColor = stats?.color || '#75aaff';

      const text = this.add
        .text(-140, y, `${medal}`, {
          fontSize: '18px',
          fill: index < 3 ? '#ffff00' : '#888888',
          fontFamily: 'Courier New',
        })
        .setOrigin(0, 0.5);

      const nameText = this.add
        .text(-90, y, data.name, {
          fontSize: '18px',
          fill: isMe ? '#ffff00' : '#ffffff',
          fontFamily: 'Courier New',
        })
        .setOrigin(0, 0.5);

      const classText = this.add
        .text(60, y, data.classType || 'MESSI', {
          fontSize: '14px',
          fill: classColor,
          fontFamily: 'Courier New',
        })
        .setOrigin(0, 0.5);

      const scoreText = this.add
        .text(140, y, `${data.score}`, {
          fontSize: '18px',
          fill: '#00ff88',
          fontFamily: 'Courier New',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      this.scoreboard.add([text, nameText, classText, scoreText]);
      y += 35;
    });

    // Update local score display
    const myScore = scores[SocketManager.playerId];
    if (myScore) {
      this.scoreText.setText(`${myScore.score}`);
    }
  }

  sendInput() {
    const pointer = this.input.activePointer;
    const myPlayer = this.localPlayers[SocketManager.playerId];

    if (!myPlayer || !myPlayer.alive) return;

    const angle = Phaser.Math.Angle.Between(
      myPlayer.sprite.x,
      myPlayer.sprite.y,
      pointer.worldX,
      pointer.worldY
    );

    // Movement keys
    const moveUp = this.cursors.up.isDown;
    const moveDown = this.cursors.down.isDown;
    const moveLeft = this.cursors.left.isDown;
    const moveRight = this.cursors.right.isDown;
    const isMoving = moveUp || moveDown || moveLeft || moveRight;

    // Space + movement direction = dodge
    const wantsToDodge = this.spaceKey.isDown && isMoving;

    const input = {
      up: moveUp,
      down: moveDown,
      left: moveLeft,
      right: moveRight,
      angle,
      dodge: wantsToDodge && (Date.now() - this.lastDodgeTime >= this.dodgeCooldown),
      dodgeDirection: wantsToDodge ? {
        up: moveUp,
        down: moveDown,
        left: moveLeft,
        right: moveRight,
      } : null,
    };

    SocketManager.sendInput(input);
  }

  handleShoot() {
    const pointer = this.input.activePointer;
    const myPlayer = this.localPlayers[SocketManager.playerId];

    if (!myPlayer || !myPlayer.alive) return;

    const angle = Phaser.Math.Angle.Between(
      myPlayer.sprite.x,
      myPlayer.sprite.y,
      pointer.worldX,
      pointer.worldY
    );

    SocketManager.shoot(angle);
  }

  handleAbility() {
    const myPlayer = this.localPlayers[SocketManager.playerId];
    if (!myPlayer || !myPlayer.alive) return;

    SocketManager.useAbility();
  }

  handleUltimate() {
    const myPlayer = this.localPlayers[SocketManager.playerId];
    if (!myPlayer || !myPlayer.alive) return;

    SocketManager.useUltimate();
  }

  updateGameTimer() {
    // Only show for Arena mode with valid time
    if (this.gameMode !== 'ARENA' || this.serverTimeRemaining === null || this.serverTimeRemaining === undefined) {
      if (this.gameTimerText) {
        this.gameTimerText.setVisible(false);
        this.timerBg.setVisible(false);
      }
      return;
    }

    // Show timer
    this.gameTimerText.setVisible(true);
    this.timerBg.setVisible(true);

    const remaining = Math.max(0, this.serverTimeRemaining);
    const seconds = Math.ceil(remaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    const timeStr = `${minutes}:${secs.toString().padStart(2, '0')}`;
    this.gameTimerText.setText(timeStr);

    // Flash red when low time
    if (seconds <= 30) {
      this.gameTimerText.setFill('#ff4444');
      if (seconds <= 10 && seconds > 0) {
        this.gameTimerText.setScale(1 + Math.sin(Date.now() / 100) * 0.1);
      }
    } else {
      this.gameTimerText.setFill('#00ffff');
      this.gameTimerText.setScale(1);
    }
  }

  update(time, delta) {
    const dt = delta / 1000;
    const myId = SocketManager.playerId;

    // Update game timer (Arena mode)
    this.updateGameTimer();

    // Update player positions
    for (const [id, player] of Object.entries(this.localPlayers)) {
      if (!player.alive) continue;

      const isLocalPlayer = id === myId;

      if (isLocalPlayer) {
        // Client-side prediction: move local player immediately based on input
        const speed = PLAYER_CLASSES[player.classType]?.speed || 200;
        let vx = 0;
        let vy = 0;

        if (this.cursors.left.isDown) vx -= 1;
        if (this.cursors.right.isDown) vx += 1;
        if (this.cursors.up.isDown) vy -= 1;
        if (this.cursors.down.isDown) vy += 1;

        // Normalize diagonal movement
        if (vx !== 0 && vy !== 0) {
          const mag = Math.sqrt(vx * vx + vy * vy);
          vx /= mag;
          vy /= mag;
        }

        // Apply predicted movement
        player.sprite.x += vx * speed * dt;
        player.sprite.y += vy * speed * dt;

        // Clamp to world bounds
        player.sprite.x = Phaser.Math.Clamp(player.sprite.x, 20, GAME_CONFIG.WIDTH - 20);
        player.sprite.y = Phaser.Math.Clamp(player.sprite.y, 20, GAME_CONFIG.HEIGHT - 20);

        // Reconcile with server position (soft correction to avoid snapping)
        const dx = player.serverX - player.sprite.x;
        const dy = player.serverY - player.sprite.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Only correct if too far from server (tolerance of 50px)
        if (dist > 50) {
          player.sprite.x = Phaser.Math.Linear(player.sprite.x, player.serverX, 0.15);
          player.sprite.y = Phaser.Math.Linear(player.sprite.y, player.serverY, 0.15);
        }
      } else {
        // Remote players: interpolate to server position
        const lerpFactor = 0.4; // Increased from 0.3 for snappier response
        player.sprite.x = Phaser.Math.Linear(player.sprite.x, player.serverX, lerpFactor);
        player.sprite.y = Phaser.Math.Linear(player.sprite.y, player.serverY, lerpFactor);
      }

      // Update UI positions
      player.healthBarBg.setPosition(player.sprite.x, player.sprite.y - 40);
      player.healthBarFill.setPosition(player.sprite.x - 36, player.sprite.y - 40);
      player.nameTag.setPosition(player.sprite.x, player.sprite.y - 55);
      player.classIndicator.setPosition(player.sprite.x, player.sprite.y + 35);
      player.shieldEffect.setPosition(player.sprite.x, player.sprite.y);
      player.spawnProtection.setPosition(player.sprite.x, player.sprite.y);
    }

    // Update bullets
    for (const bullet of Object.values(this.bullets)) {
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
    }

    // Update grenades
    for (const grenade of Object.values(this.grenades)) {
      grenade.x += grenade.vx * dt;
      grenade.y += grenade.vy * dt;
      grenade.vx *= 0.98;
      grenade.vy *= 0.98;
    }

    // Interpolate mob positions
    for (const mob of Object.values(this.mobs)) {
      const lerpFactor = 0.35; // Increased from 0.2 for snappier response
      mob.container.x = Phaser.Math.Linear(mob.container.x, mob.serverX, lerpFactor);
      mob.container.y = Phaser.Math.Linear(mob.container.y, mob.serverY, lerpFactor);

      // Update UI positions (health bar and name follow the container)
      mob.healthBarBg.setPosition(mob.container.x, mob.container.y - 45);
      mob.healthBarFill.setPosition(mob.container.x - 19, mob.container.y - 45);
      mob.nameTag.setPosition(mob.container.x, mob.container.y - 55);
    }
  }

  shutdown() {
    SoundManager.stopDubstep();

    // Remove all socket listeners
    const events = [
      'game:state', 'game:start', 'game:end', 'bullet:spawn', 'bullet:destroy', 'bullet:ricochet',
      'grenade:spawn', 'grenade:explode', 'player:hit', 'player:death',
      'player:respawn', 'player:heal', 'player:dash', 'player:dodge', 'player:bounce',
      'player:chainsaw', 'killStreak', 'powerup:spawn', 'powerup:collected',
      'turret:spawn', 'turret:shoot', 'turret:destroy', 'bear:spawn',
      'barrier:spawn', 'barrier:destroy', 'barrel:explode',
      'healZone:spawn', 'healZone:destroy', 'ultimate:activate',
      'carpetBomb:explosion', 'lifeSwap',
      'mob:spawn', 'mob:hit', 'mob:death', 'mob:attack',
      'wave:start', 'wave:complete', 'wave:perkOffer', 'wave:perkSelected', 'wave:gameOver',
    ];

    events.forEach(event => SocketManager.off(event));
  }
}
