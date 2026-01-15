// Programmatic pixel art sprite generator - FAMOUS PERSONALITIES EDITION!

export class SpriteGenerator {
  static generateAll(scene) {
    // Characters
    this.generateMessi(scene);
    this.generateMilei(scene);
    this.generateTrump(scene);
    this.generateBiden(scene);
    this.generatePutin(scene);

    // Projectiles
    this.generateSoccerBall(scene);
    this.generatePeso(scene);
    this.generateTweet(scene);
    this.generateIceCream(scene);
    this.generateMissile(scene);
    this.generateExplosion(scene);

    // Environment
    this.generateArena(scene);
    this.generateBarrel(scene);
    this.generateLava(scene);
    this.generateBouncePad(scene);

    // Buildables
    this.generateTurret(scene);
    this.generateBarrier(scene);
    this.generateHealZone(scene);
    this.generateBear(scene);

    // Powerups
    this.generatePowerups(scene);

    // UI
    this.generateHealthBar(scene);
    this.generateUltimateBar(scene);
    this.generateParticles(scene);
    this.generateShieldEffect(scene);
  }

  static generateMessi(scene) {
    const size = 48;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Shadow
    ctx.fillStyle = '#00000044';
    ctx.beginPath();
    ctx.ellipse(24, 44, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body - Argentina jersey (blue and white stripes)
    ctx.fillStyle = '#75aaff';
    ctx.fillRect(16, 16, 16, 22);

    // White stripes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(18, 16, 3, 22);
    ctx.fillRect(24, 16, 3, 22);
    ctx.fillRect(30, 16, 2, 22);

    // Head
    ctx.fillStyle = '#d4a574';
    ctx.fillRect(18, 4, 12, 14);

    // Dark curly hair (beard too)
    ctx.fillStyle = '#2a1810';
    ctx.fillRect(17, 2, 14, 7);
    ctx.fillRect(16, 4, 3, 5);
    ctx.fillRect(29, 4, 3, 5);
    // Beard
    ctx.fillRect(19, 14, 10, 4);

    // Eyes
    ctx.fillStyle = '#000000';
    ctx.fillRect(20, 8, 2, 2);
    ctx.fillRect(26, 8, 2, 2);

    // #10 on back (implied from front)
    ctx.fillStyle = '#000000';
    ctx.font = '8px Arial';

    // Legs (white shorts)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(18, 38, 5, 6);
    ctx.fillRect(25, 38, 5, 6);

    // Cleats
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(17, 44, 6, 4);
    ctx.fillRect(25, 44, 6, 4);

    // Soccer ball in hand
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(38, 28, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(38, 28, 2, 0, Math.PI * 2);
    ctx.fill();

    scene.textures.addCanvas('messi', canvas);
  }

  static generateMilei(scene) {
    const size = 48;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Shadow
    ctx.fillStyle = '#00000044';
    ctx.beginPath();
    ctx.ellipse(24, 44, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body - Black suit
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(14, 16, 20, 22);

    // Yellow/libertarian tie
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(22, 18, 4, 16);

    // White shirt collar
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(19, 16, 4, 4);
    ctx.fillRect(25, 16, 4, 4);

    // Head
    ctx.fillStyle = '#e8c4a0';
    ctx.fillRect(16, 2, 16, 16);

    // WILD HAIR (signature look)
    ctx.fillStyle = '#3d2817';
    // Main wild mane
    ctx.fillRect(12, 0, 24, 8);
    ctx.fillRect(10, 2, 6, 10);
    ctx.fillRect(32, 2, 6, 10);
    // Spiky top
    ctx.fillRect(14, -2, 4, 4);
    ctx.fillRect(22, -3, 4, 5);
    ctx.fillRect(30, -2, 4, 4);

    // Sideburns (ICONIC)
    ctx.fillRect(14, 8, 4, 10);
    ctx.fillRect(30, 8, 4, 10);

    // Intense eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(18, 8, 4, 4);
    ctx.fillRect(26, 8, 4, 4);
    ctx.fillStyle = '#000000';
    ctx.fillRect(19, 9, 2, 2);
    ctx.fillRect(27, 9, 2, 2);

    // Mouth (yelling AFUERA!)
    ctx.fillStyle = '#8b0000';
    ctx.fillRect(20, 14, 8, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(21, 14, 6, 2);

    // CHAINSAW
    ctx.fillStyle = '#ff6600';
    ctx.fillRect(36, 14, 4, 20);
    ctx.fillStyle = '#888888';
    ctx.fillRect(34, 16, 12, 4);
    ctx.fillRect(34, 30, 12, 4);
    // Blade
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(40, 10, 3, 26);
    // Teeth
    ctx.fillStyle = '#666666';
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(43, 12 + i * 4, 2, 2);
    }

    // Legs
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(16, 38, 7, 8);
    ctx.fillRect(25, 38, 7, 8);

    // Shoes
    ctx.fillStyle = '#000000';
    ctx.fillRect(14, 44, 9, 4);
    ctx.fillRect(25, 44, 9, 4);

    scene.textures.addCanvas('milei', canvas);
  }

  static generateTrump(scene) {
    const size = 48;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Shadow
    ctx.fillStyle = '#00000044';
    ctx.beginPath();
    ctx.ellipse(24, 44, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body - Navy suit (bulky)
    ctx.fillStyle = '#1a2744';
    ctx.fillRect(12, 16, 24, 22);

    // Red tie (LONG)
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(21, 18, 6, 18);
    ctx.fillRect(22, 36, 4, 4);

    // White shirt
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(18, 16, 5, 5);
    ctx.fillRect(25, 16, 5, 5);

    // Head (orange tint)
    ctx.fillStyle = '#ffb366';
    ctx.fillRect(16, 2, 16, 16);

    // THE HAIR (iconic blonde combover)
    ctx.fillStyle = '#f5d742';
    ctx.fillRect(14, 0, 20, 8);
    ctx.fillRect(12, 2, 6, 6);
    ctx.fillRect(30, 2, 6, 6);
    // Swoosh
    ctx.fillStyle = '#e8c730';
    ctx.fillRect(16, 1, 16, 4);

    // Eyes (squinting)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(18, 8, 4, 3);
    ctx.fillRect(26, 8, 4, 3);
    ctx.fillStyle = '#4a90d9';
    ctx.fillRect(19, 9, 2, 2);
    ctx.fillRect(27, 9, 2, 2);

    // Mouth (pursed)
    ctx.fillStyle = '#cc8866';
    ctx.fillRect(21, 14, 6, 2);

    // Phone in hand (tweeting)
    ctx.fillStyle = '#333333';
    ctx.fillRect(36, 22, 8, 14);
    ctx.fillStyle = '#1da1f2';
    ctx.fillRect(37, 24, 6, 10);

    // Legs
    ctx.fillStyle = '#1a2744';
    ctx.fillRect(14, 38, 8, 8);
    ctx.fillRect(26, 38, 8, 8);

    // Shoes
    ctx.fillStyle = '#000000';
    ctx.fillRect(12, 44, 10, 4);
    ctx.fillRect(26, 44, 10, 4);

    scene.textures.addCanvas('trump', canvas);
  }

  static generateBiden(scene) {
    const size = 48;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Shadow
    ctx.fillStyle = '#00000044';
    ctx.beginPath();
    ctx.ellipse(24, 44, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body - Blue suit
    ctx.fillStyle = '#3d5a99';
    ctx.fillRect(14, 16, 20, 22);

    // Blue tie
    ctx.fillStyle = '#1a3a6e';
    ctx.fillRect(22, 18, 4, 14);

    // White shirt
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(18, 16, 5, 4);
    ctx.fillRect(25, 16, 5, 4);

    // Head (older skin tone)
    ctx.fillStyle = '#f5dcc8';
    ctx.fillRect(16, 4, 16, 14);

    // White hair
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(14, 2, 20, 7);
    ctx.fillRect(12, 4, 5, 5);
    ctx.fillRect(31, 4, 5, 5);

    // AVIATOR SUNGLASSES (iconic)
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(16, 8, 7, 5);
    ctx.fillRect(25, 8, 7, 5);
    // Lenses
    ctx.fillStyle = '#2a4a2a';
    ctx.fillRect(17, 9, 5, 3);
    ctx.fillRect(26, 9, 5, 3);
    // Bridge
    ctx.fillStyle = '#888888';
    ctx.fillRect(23, 9, 2, 2);

    // Friendly smile
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(20, 14, 8, 2);
    ctx.fillStyle = '#cc8888';
    ctx.fillRect(20, 16, 8, 1);

    // ICE CREAM CONE in hand
    ctx.fillStyle = '#d4a574';
    ctx.beginPath();
    ctx.moveTo(40, 20);
    ctx.lineTo(44, 36);
    ctx.lineTo(36, 36);
    ctx.closePath();
    ctx.fill();
    // Ice cream scoops
    ctx.fillStyle = '#f5deb3';
    ctx.beginPath();
    ctx.arc(40, 18, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8b4513';
    ctx.beginPath();
    ctx.arc(40, 12, 4, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.fillStyle = '#3d5a99';
    ctx.fillRect(16, 38, 7, 8);
    ctx.fillRect(25, 38, 7, 8);

    // Shoes
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(14, 44, 9, 4);
    ctx.fillRect(25, 44, 9, 4);

    scene.textures.addCanvas('biden', canvas);
  }

  static generatePutin(scene) {
    const size = 48;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Shadow
    ctx.fillStyle = '#00000044';
    ctx.beginPath();
    ctx.ellipse(24, 44, 15, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body - Military-style jacket
    ctx.fillStyle = '#4a5d23';
    ctx.fillRect(12, 16, 24, 22);

    // Medals
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(14, 20, 4, 4);
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(14, 26, 4, 4);
    ctx.fillStyle = '#cd7f32';
    ctx.fillRect(14, 32, 4, 4);

    // Epaulettes
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(10, 16, 6, 4);
    ctx.fillRect(32, 16, 6, 4);

    // Head (stern)
    ctx.fillStyle = '#e8d4c4';
    ctx.fillRect(16, 2, 16, 16);

    // Bald/short hair
    ctx.fillStyle = '#a89080';
    ctx.fillRect(16, 2, 16, 5);

    // Stern eyes
    ctx.fillStyle = '#88aacc';
    ctx.fillRect(18, 8, 4, 3);
    ctx.fillRect(26, 8, 4, 3);
    ctx.fillStyle = '#000000';
    ctx.fillRect(19, 9, 2, 2);
    ctx.fillRect(27, 9, 2, 2);
    // Furrowed brow
    ctx.fillStyle = '#c4a898';
    ctx.fillRect(17, 7, 5, 1);
    ctx.fillRect(26, 7, 5, 1);

    // Stern mouth
    ctx.fillStyle = '#cc9988';
    ctx.fillRect(21, 14, 6, 2);

    // Nuclear button / missile launcher
    ctx.fillStyle = '#555555';
    ctx.fillRect(36, 18, 10, 16);
    ctx.fillStyle = '#cc0000';
    ctx.beginPath();
    ctx.arc(41, 24, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#333333';
    ctx.fillRect(38, 28, 6, 4);

    // Legs
    ctx.fillStyle = '#4a5d23';
    ctx.fillRect(14, 38, 8, 8);
    ctx.fillRect(26, 38, 8, 8);

    // Military boots
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(12, 44, 10, 4);
    ctx.fillRect(26, 44, 10, 4);

    scene.textures.addCanvas('putin', canvas);
  }

  // PROJECTILES

  static generateSoccerBall(scene) {
    const size = 16;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Ball
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(8, 8, 6, 0, Math.PI * 2);
    ctx.fill();

    // Pentagon pattern
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(8, 8, 2, 0, Math.PI * 2);
    ctx.fill();
    // Small pentagons around
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const x = 8 + Math.cos(angle) * 4;
      const y = 8 + Math.sin(angle) * 4;
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glow
    ctx.strokeStyle = '#75aaff66';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(8, 8, 7, 0, Math.PI * 2);
    ctx.stroke();

    scene.textures.addCanvas('soccer_ball', canvas);
    scene.textures.addCanvas('bullet', canvas); // Default bullet
  }

  static generatePeso(scene) {
    const size = 16;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Coin shape
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(8, 8, 6, 0, Math.PI * 2);
    ctx.fill();

    // Inner circle
    ctx.fillStyle = '#ffec8b';
    ctx.beginPath();
    ctx.arc(8, 8, 4, 0, Math.PI * 2);
    ctx.fill();

    // $ symbol
    ctx.fillStyle = '#b8860b';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', 8, 9);

    // Glow
    ctx.strokeStyle = '#ffcc0066';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(8, 8, 7, 0, Math.PI * 2);
    ctx.stroke();

    scene.textures.addCanvas('peso', canvas);
  }

  static generateTweet(scene) {
    const size = 18;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Blue bird (Twitter style)
    ctx.fillStyle = '#1da1f2';

    // Body
    ctx.beginPath();
    ctx.ellipse(9, 10, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(12, 7, 4, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.moveTo(15, 7);
    ctx.lineTo(18, 8);
    ctx.lineTo(15, 9);
    ctx.closePath();
    ctx.fill();

    // Wing
    ctx.fillStyle = '#0d8ecf';
    ctx.beginPath();
    ctx.ellipse(7, 9, 4, 3, -0.5, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(13, 6, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(13, 6, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Glow
    ctx.strokeStyle = '#1da1f266';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(9, 9, 8, 0, Math.PI * 2);
    ctx.stroke();

    scene.textures.addCanvas('tweet', canvas);
  }

  static generateIceCream(scene) {
    const size = 16;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Cone
    ctx.fillStyle = '#d4a574';
    ctx.beginPath();
    ctx.moveTo(8, 6);
    ctx.lineTo(12, 15);
    ctx.lineTo(4, 15);
    ctx.closePath();
    ctx.fill();

    // Waffle pattern
    ctx.strokeStyle = '#b8956e';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(6, 10);
    ctx.lineTo(10, 10);
    ctx.moveTo(5, 12);
    ctx.lineTo(11, 12);
    ctx.stroke();

    // Ice cream scoop
    ctx.fillStyle = '#f5deb3';
    ctx.beginPath();
    ctx.arc(8, 5, 5, 0, Math.PI * 2);
    ctx.fill();

    // Cherry on top
    ctx.fillStyle = '#cc0000';
    ctx.beginPath();
    ctx.arc(8, 1, 2, 0, Math.PI * 2);
    ctx.fill();

    // Glow
    ctx.strokeStyle = '#3d5a9966';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(8, 8, 7, 0, Math.PI * 2);
    ctx.stroke();

    scene.textures.addCanvas('ice_cream', canvas);
  }

  static generateMissile(scene) {
    const size = 20;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Missile body
    ctx.fillStyle = '#4a5d23';
    ctx.fillRect(3, 7, 12, 6);

    // Nose cone
    ctx.fillStyle = '#cc0000';
    ctx.beginPath();
    ctx.moveTo(15, 7);
    ctx.lineTo(19, 10);
    ctx.lineTo(15, 13);
    ctx.closePath();
    ctx.fill();

    // Fins
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.moveTo(3, 7);
    ctx.lineTo(0, 4);
    ctx.lineTo(5, 7);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(3, 13);
    ctx.lineTo(0, 16);
    ctx.lineTo(5, 13);
    ctx.closePath();
    ctx.fill();

    // Exhaust flame
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.moveTo(3, 8);
    ctx.lineTo(-2, 10);
    ctx.lineTo(3, 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.moveTo(3, 9);
    ctx.lineTo(0, 10);
    ctx.lineTo(3, 11);
    ctx.closePath();
    ctx.fill();

    // Red star
    ctx.fillStyle = '#cc0000';
    ctx.beginPath();
    ctx.arc(9, 10, 2, 0, Math.PI * 2);
    ctx.fill();

    scene.textures.addCanvas('missile', canvas);
    scene.textures.addCanvas('grenade', canvas); // Use as grenade too
  }

  static generateExplosion(scene) {
    const frameCount = 12;
    const maxSize = 96;

    for (let frame = 0; frame < frameCount; frame++) {
      const canvas = document.createElement('canvas');
      canvas.width = maxSize;
      canvas.height = maxSize;
      const ctx = canvas.getContext('2d');

      const progress = frame / (frameCount - 1);
      const radius = maxSize * 0.45 * (0.2 + progress * 0.8);

      const gradient = ctx.createRadialGradient(
        maxSize / 2, maxSize / 2, 0,
        maxSize / 2, maxSize / 2, radius * 1.3
      );
      gradient.addColorStop(0, progress < 0.3 ? '#ffffff' : '#ffff00');
      gradient.addColorStop(0.3, '#ff8800');
      gradient.addColorStop(0.6, '#ff4400');
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(maxSize / 2, maxSize / 2, radius * 1.3, 0, Math.PI * 2);
      ctx.fill();

      if (progress < 0.7) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(maxSize / 2, maxSize / 2, radius * 0.3 * (1 - progress), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#ffff00';
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2 + progress * 3;
        const dist = radius * (0.5 + Math.random() * 0.5 + progress * 0.3);
        const x = maxSize / 2 + Math.cos(angle) * dist;
        const y = maxSize / 2 + Math.sin(angle) * dist;
        const sparkSize = 4 * (1 - progress);
        ctx.fillRect(x - sparkSize / 2, y - sparkSize / 2, sparkSize, sparkSize);
      }

      if (progress > 0.4) {
        ctx.strokeStyle = `rgba(100, 100, 100, ${0.5 * (1 - progress)})`;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(maxSize / 2, maxSize / 2, radius * 0.8, 0, Math.PI * 2);
        ctx.stroke();
      }

      scene.textures.addCanvas(`explosion_${frame}`, canvas);
    }
  }

  static generateBarrel(scene) {
    const size = 40;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#00000044';
    ctx.beginPath();
    ctx.ellipse(20, 38, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#cc0000';
    ctx.fillRect(6, 8, 28, 28);

    ctx.fillStyle = '#990000';
    ctx.fillRect(6, 8, 8, 28);
    ctx.fillStyle = '#ff2222';
    ctx.fillRect(26, 8, 8, 28);

    ctx.fillStyle = '#444444';
    ctx.fillRect(6, 10, 28, 4);
    ctx.fillRect(6, 30, 28, 4);

    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.moveTo(20, 14);
    ctx.lineTo(28, 26);
    ctx.lineTo(12, 26);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.fillRect(18, 18, 4, 5);
    ctx.beginPath();
    ctx.arc(20, 24, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#880000';
    ctx.beginPath();
    ctx.ellipse(20, 8, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    scene.textures.addCanvas('barrel', canvas);
  }

  static generateLava(scene) {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ff4400';
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#cc2200';
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.beginPath();
      ctx.arc(x, y, 8 + Math.random() * 8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#ffaa00';
    for (let i = 0; i < 6; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.beginPath();
      ctx.arc(x, y, 4 + Math.random() * 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#ffff00';
    for (let i = 0; i < 4; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.beginPath();
      ctx.arc(x, y, 2 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#ff880088';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, size, size);

    scene.textures.addCanvas('lava', canvas);
  }

  static generateBouncePad(scene) {
    const size = 48;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#00aaff';
    ctx.fillRect(4, 30, 40, 14);

    const gradient = ctx.createLinearGradient(0, 20, 0, 34);
    gradient.addColorStop(0, '#00ffff');
    gradient.addColorStop(1, '#0088cc');
    ctx.fillStyle = gradient;
    ctx.fillRect(4, 20, 40, 14);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(24, 8);
    ctx.lineTo(32, 18);
    ctx.lineTo(28, 18);
    ctx.lineTo(28, 22);
    ctx.lineTo(20, 22);
    ctx.lineTo(20, 18);
    ctx.lineTo(16, 18);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#00ffff88';
    ctx.beginPath();
    ctx.moveTo(24, 0);
    ctx.lineTo(30, 8);
    ctx.lineTo(18, 8);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;
    ctx.strokeRect(4, 20, 40, 24);
    ctx.shadowBlur = 0;

    scene.textures.addCanvas('bounce_pad', canvas);
  }

  static generateTurret(scene) {
    const size = 40;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#00000044';
    ctx.beginPath();
    ctx.ellipse(20, 36, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#555555';
    ctx.fillRect(8, 28, 24, 10);
    ctx.fillStyle = '#444444';
    ctx.beginPath();
    ctx.ellipse(20, 28, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff6b35';
    ctx.fillRect(12, 14, 16, 16);
    ctx.fillStyle = '#cc5020';
    ctx.fillRect(12, 14, 4, 16);
    ctx.fillStyle = '#ff8855';
    ctx.fillRect(24, 14, 4, 16);

    ctx.fillStyle = '#666666';
    ctx.fillRect(28, 18, 12, 6);
    ctx.fillStyle = '#444444';
    ctx.fillRect(28, 18, 12, 2);

    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(20, 20, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(20, 19, 1.5, 0, Math.PI * 2);
    ctx.fill();

    scene.textures.addCanvas('turret', canvas);
  }

  static generateBarrier(scene) {
    const size = 48;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#00000044';
    ctx.fillRect(4, 42, 40, 6);

    // Trump wall style - brick pattern
    ctx.fillStyle = '#c4a882';
    ctx.fillRect(4, 4, 40, 40);

    // Bricks
    ctx.fillStyle = '#a88860';
    for (let row = 0; row < 5; row++) {
      const offset = (row % 2) * 10;
      for (let col = 0; col < 3; col++) {
        ctx.strokeStyle = '#8a7050';
        ctx.lineWidth = 1;
        ctx.strokeRect(4 + offset + col * 20, 4 + row * 8, 18, 7);
      }
    }

    // Metal frame
    ctx.fillStyle = '#666666';
    ctx.fillRect(4, 4, 40, 3);
    ctx.fillRect(4, 41, 40, 3);
    ctx.fillRect(4, 4, 3, 40);
    ctx.fillRect(41, 4, 3, 40);

    scene.textures.addCanvas('barrier', canvas);
  }

  static generateHealZone(scene) {
    const size = 80;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Ice cream themed heal zone
    const gradient = ctx.createRadialGradient(40, 40, 0, 40, 40, 40);
    gradient.addColorStop(0, '#f5deb344');
    gradient.addColorStop(0.7, '#3d5a9922');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(40, 40, 40, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#3d5a99';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(40, 40, 30, 0, Math.PI * 2);
    ctx.stroke();

    // Ice cream cone symbol
    ctx.fillStyle = '#3d5a9988';
    ctx.beginPath();
    ctx.moveTo(40, 25);
    ctx.lineTo(50, 55);
    ctx.lineTo(30, 55);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(40, 25, 10, 0, Math.PI * 2);
    ctx.fill();

    scene.textures.addCanvas('heal_zone', canvas);
  }

  static generateBear(scene) {
    const size = 40;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Shadow
    ctx.fillStyle = '#00000044';
    ctx.beginPath();
    ctx.ellipse(20, 36, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bear body (brown)
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(10, 16, 20, 20);

    // Bear head
    ctx.fillStyle = '#8b4513';
    ctx.beginPath();
    ctx.arc(20, 12, 10, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    ctx.beginPath();
    ctx.arc(12, 6, 4, 0, Math.PI * 2);
    ctx.arc(28, 6, 4, 0, Math.PI * 2);
    ctx.fill();

    // Snout
    ctx.fillStyle = '#d2691e';
    ctx.beginPath();
    ctx.ellipse(20, 14, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(20, 12, 2, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(16, 10, 2, 0, Math.PI * 2);
    ctx.arc(24, 10, 2, 0, Math.PI * 2);
    ctx.fill();

    // Soviet star on chest
    ctx.fillStyle = '#cc0000';
    ctx.beginPath();
    const starX = 20, starY = 26;
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI / 5) - Math.PI / 2;
      const x = starX + Math.cos(angle) * 5;
      const y = starY + Math.sin(angle) * 5;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    scene.textures.addCanvas('bear', canvas);
  }

  static generatePowerups(scene) {
    const powerupTypes = [
      { key: 'powerup_speed', color: '#00ffff', symbol: '>' },
      { key: 'powerup_damage', color: '#ff0000', symbol: '!' },
      { key: 'powerup_shield', color: '#0088ff', symbol: 'O' },
      { key: 'powerup_rapid', color: '#ffff00', symbol: '*' },
      { key: 'powerup_health', color: '#00ff00', symbol: '+' },
      { key: 'powerup_ricochet', color: '#ff8800', symbol: '~' },
    ];

    powerupTypes.forEach(({ key, color, symbol }) => {
      const size = 32;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, color + '88');
      gradient.addColorStop(0.6, color + '44');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(16, 16, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000000aa';
      ctx.fillRect(6, 6, 20, 20);

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(6, 6, 20, 20);

      ctx.fillStyle = color;
      ctx.font = 'bold 14px Courier New';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(symbol, 16, 17);

      scene.textures.addCanvas(key, canvas);
    });
  }

  static generateArena(scene) {
    const width = 800;
    const height = 600;
    const tileSize = 40;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Dark political arena background
    const bgGradient = ctx.createRadialGradient(400, 300, 0, 400, 300, 500);
    bgGradient.addColorStop(0, '#2a2a3a');
    bgGradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = '#ffffff11';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Gold border (political/prestigious feel)
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 20;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    ctx.strokeStyle = '#cc0000';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#cc0000';
    ctx.strokeRect(20, 20, width - 40, height - 40);

    ctx.shadowBlur = 0;

    // Center decoration - world map suggestion
    ctx.strokeStyle = '#ffd70044';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(400, 300, 80, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(400, 300, 40, 0, Math.PI * 2);
    ctx.stroke();

    // Corner flags (representing different nations)
    const corners = [
      { x: 50, y: 50, color: '#75aaff' }, // Argentina
      { x: width - 50, y: 50, color: '#cc0000' }, // Russia
      { x: 50, y: height - 50, color: '#3d5a99' }, // USA Blue
      { x: width - 50, y: height - 50, color: '#ff6b35' }, // USA Orange
    ];

    corners.forEach(corner => {
      ctx.fillStyle = corner.color + '44';
      ctx.beginPath();
      ctx.arc(corner.x, corner.y, 30, 0, Math.PI * 2);
      ctx.fill();
    });

    scene.textures.addCanvas('arena', canvas);
  }

  static generateHealthBar(scene) {
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = 48;
    bgCanvas.height = 8;
    const bgCtx = bgCanvas.getContext('2d');
    bgCtx.fillStyle = '#000000';
    bgCtx.fillRect(0, 0, 48, 8);
    bgCtx.strokeStyle = '#ffffff44';
    bgCtx.strokeRect(0, 0, 48, 8);
    scene.textures.addCanvas('healthbar_bg', bgCanvas);

    const fillCanvas = document.createElement('canvas');
    fillCanvas.width = 48;
    fillCanvas.height = 8;
    const fillCtx = fillCanvas.getContext('2d');
    const gradient = fillCtx.createLinearGradient(0, 0, 48, 0);
    gradient.addColorStop(0, '#00ff00');
    gradient.addColorStop(1, '#88ff88');
    fillCtx.fillStyle = gradient;
    fillCtx.fillRect(0, 0, 48, 8);
    scene.textures.addCanvas('healthbar_fill', fillCanvas);
  }

  static generateUltimateBar(scene) {
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = 100;
    bgCanvas.height = 12;
    const bgCtx = bgCanvas.getContext('2d');
    bgCtx.fillStyle = '#000000';
    bgCtx.fillRect(0, 0, 100, 12);
    bgCtx.strokeStyle = '#ffd70044';
    bgCtx.lineWidth = 2;
    bgCtx.strokeRect(0, 0, 100, 12);
    scene.textures.addCanvas('ultimate_bg', bgCanvas);

    const fillCanvas = document.createElement('canvas');
    fillCanvas.width = 100;
    fillCanvas.height = 12;
    const fillCtx = fillCanvas.getContext('2d');
    const gradient = fillCtx.createLinearGradient(0, 0, 100, 0);
    gradient.addColorStop(0, '#ffd700');
    gradient.addColorStop(0.5, '#ffec8b');
    gradient.addColorStop(1, '#fff8dc');
    fillCtx.fillStyle = gradient;
    fillCtx.fillRect(0, 0, 100, 12);
    scene.textures.addCanvas('ultimate_fill', fillCanvas);
  }

  static generateShieldEffect(scene) {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(32, 32, 20, 32, 32, 32);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.7, '#ffd70044');
    gradient.addColorStop(1, '#ffd70088');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(32, 32, 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.stroke();

    scene.textures.addCanvas('shield_effect', canvas);
  }

  static generateParticles(scene) {
    const hitCanvas = document.createElement('canvas');
    hitCanvas.width = 8;
    hitCanvas.height = 8;
    const hitCtx = hitCanvas.getContext('2d');
    hitCtx.fillStyle = '#ff0000';
    hitCtx.beginPath();
    hitCtx.arc(4, 4, 3, 0, Math.PI * 2);
    hitCtx.fill();
    scene.textures.addCanvas('particle_hit', hitCanvas);

    const sparkCanvas = document.createElement('canvas');
    sparkCanvas.width = 6;
    sparkCanvas.height = 6;
    const sparkCtx = sparkCanvas.getContext('2d');
    sparkCtx.fillStyle = '#ffd700';
    sparkCtx.fillRect(1, 1, 4, 4);
    scene.textures.addCanvas('particle_spark', sparkCanvas);

    const smokeCanvas = document.createElement('canvas');
    smokeCanvas.width = 16;
    smokeCanvas.height = 16;
    const smokeCtx = smokeCanvas.getContext('2d');
    smokeCtx.fillStyle = '#66666688';
    smokeCtx.beginPath();
    smokeCtx.arc(8, 8, 6, 0, Math.PI * 2);
    smokeCtx.fill();
    scene.textures.addCanvas('particle_smoke', smokeCanvas);

    const dashCanvas = document.createElement('canvas');
    dashCanvas.width = 12;
    dashCanvas.height = 12;
    const dashCtx = dashCanvas.getContext('2d');
    dashCtx.fillStyle = '#75aaff88';
    dashCtx.beginPath();
    dashCtx.arc(6, 6, 5, 0, Math.PI * 2);
    dashCtx.fill();
    scene.textures.addCanvas('particle_dash', dashCanvas);

    const bloodCanvas = document.createElement('canvas');
    bloodCanvas.width = 8;
    bloodCanvas.height = 8;
    const bloodCtx = bloodCanvas.getContext('2d');
    bloodCtx.fillStyle = '#cc0000';
    bloodCtx.beginPath();
    bloodCtx.arc(4, 4, 3, 0, Math.PI * 2);
    bloodCtx.fill();
    scene.textures.addCanvas('particle_blood', bloodCanvas);

    // Money particle for Milei
    const moneyCanvas = document.createElement('canvas');
    moneyCanvas.width = 10;
    moneyCanvas.height = 10;
    const moneyCtx = moneyCanvas.getContext('2d');
    moneyCtx.fillStyle = '#00aa00';
    moneyCtx.fillRect(1, 1, 8, 8);
    moneyCtx.fillStyle = '#ffffff';
    moneyCtx.font = '8px Arial';
    moneyCtx.textAlign = 'center';
    moneyCtx.fillText('$', 5, 8);
    scene.textures.addCanvas('particle_money', moneyCanvas);
  }
}
