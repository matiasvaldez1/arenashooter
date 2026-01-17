// Procedural sound effects and DUBSTEP generator using Web Audio API

class SoundManagerClass {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.isPlaying = false;
    this.dubstepInterval = null;
    this.bassOsc = null;
    this.currentStep = 0;
    this.volume = 0.5;
  }

  init() {
    if (this.audioContext) return;

    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Master gain
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = this.volume;
    this.masterGain.connect(this.audioContext.destination);

    // Music gain
    this.musicGain = this.audioContext.createGain();
    this.musicGain.gain.value = 0.4;
    this.musicGain.connect(this.masterGain);

    // SFX gain
    this.sfxGain = this.audioContext.createGain();
    this.sfxGain.gain.value = 0.6;
    this.sfxGain.connect(this.masterGain);

    // Compressor for that punchy dubstep sound
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;
    this.compressor.connect(this.musicGain);
  }

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  getVolume() {
    return this.volume;
  }

  // ==================== DUBSTEP GENERATOR ====================

  startDubstep() {
    if (this.isPlaying) return;
    this.init();
    this.isPlaying = true;
    this.currentStep = 0;

    // BPM for dubstep (140 is classic)
    const bpm = 140;
    const stepTime = (60 / bpm) / 4; // 16th notes

    // Dubstep pattern
    this.dubstepInterval = setInterval(() => {
      this.playDubstepStep(this.currentStep);
      this.currentStep = (this.currentStep + 1) % 32;
    }, stepTime * 1000);

    // Start the wobble bass
    this.startWobbleBass();
  }

  stopDubstep() {
    this.isPlaying = false;
    if (this.dubstepInterval) {
      clearInterval(this.dubstepInterval);
      this.dubstepInterval = null;
    }
    if (this.bassOsc) {
      this.bassOsc.stop();
      this.bassOsc = null;
    }
  }

  playDubstepStep(step) {
    const time = this.audioContext.currentTime;

    // Kick on 1 and 9 (half notes)
    if (step % 8 === 0) {
      this.playKick(time);
    }

    // Snare on 5 and 13
    if (step % 8 === 4) {
      this.playSnare(time);
    }

    // Hi-hats
    if (step % 2 === 0) {
      this.playHiHat(time, step % 4 === 0 ? 0.3 : 0.15);
    }

    // Wobble modulation
    if (this.wobbleLFO) {
      // Change wobble rate for variation
      const wobbleRates = [4, 8, 16, 8, 4, 2, 8, 16];
      const rateIndex = Math.floor(step / 4) % wobbleRates.length;
      this.wobbleLFO.frequency.setValueAtTime(wobbleRates[rateIndex], time);
    }

    // Bass note changes
    if (step % 8 === 0) {
      const bassNotes = [55, 55, 73.42, 65.41]; // A1, A1, D2, C2
      const noteIndex = Math.floor(step / 8) % bassNotes.length;
      if (this.bassOsc) {
        this.bassOsc.frequency.setValueAtTime(bassNotes[noteIndex], time);
      }
    }
  }

  startWobbleBass() {
    const time = this.audioContext.currentTime;

    // Bass oscillator
    this.bassOsc = this.audioContext.createOscillator();
    this.bassOsc.type = 'sawtooth';
    this.bassOsc.frequency.value = 55; // A1

    // Filter for wobble
    this.wobbleFilter = this.audioContext.createBiquadFilter();
    this.wobbleFilter.type = 'lowpass';
    this.wobbleFilter.frequency.value = 400;
    this.wobbleFilter.Q.value = 15;

    // LFO for wobble
    this.wobbleLFO = this.audioContext.createOscillator();
    this.wobbleLFO.type = 'sine';
    this.wobbleLFO.frequency.value = 8;

    // LFO gain
    const lfoGain = this.audioContext.createGain();
    lfoGain.gain.value = 1500;

    // Distortion
    const distortion = this.createDistortion(50);

    // Bass gain
    const bassGain = this.audioContext.createGain();
    bassGain.gain.value = 0.5;

    // Connect wobble
    this.wobbleLFO.connect(lfoGain);
    lfoGain.connect(this.wobbleFilter.frequency);

    // Connect bass chain
    this.bassOsc.connect(this.wobbleFilter);
    this.wobbleFilter.connect(distortion);
    distortion.connect(bassGain);
    bassGain.connect(this.compressor);

    this.bassOsc.start(time);
    this.wobbleLFO.start(time);
  }

  createDistortion(amount) {
    const distortion = this.audioContext.createWaveShaper();
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }

    distortion.curve = curve;
    distortion.oversample = '4x';
    return distortion;
  }

  playKick(time) {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(30, time + 0.1);

    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

    osc.connect(gain);
    gain.connect(this.compressor);

    osc.start(time);
    osc.stop(time + 0.3);
  }

  playSnare(time) {
    // Noise
    const bufferSize = this.audioContext.sampleRate * 0.2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.audioContext.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;

    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.8, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.compressor);

    // Body
    const osc = this.audioContext.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 180;

    const oscGain = this.audioContext.createGain();
    oscGain.gain.setValueAtTime(0.7, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

    osc.connect(oscGain);
    oscGain.connect(this.compressor);

    noise.start(time);
    noise.stop(time + 0.2);
    osc.start(time);
    osc.stop(time + 0.1);
  }

  playHiHat(time, volume = 0.2) {
    const bufferSize = this.audioContext.sampleRate * 0.05;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 8000;

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.compressor);

    noise.start(time);
    noise.stop(time + 0.05);
  }

  // ==================== GAME SOUND EFFECTS ====================

  playShoot() {
    this.init();
    const time = this.audioContext.currentTime;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800, time);
    osc.frequency.exponentialRampToValueAtTime(200, time + 0.1);

    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.1);
  }

  playExplosion() {
    this.init();
    const time = this.audioContext.currentTime;

    // Noise burst
    const bufferSize = this.audioContext.sampleRate * 0.5;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, time);
    filter.frequency.exponentialRampToValueAtTime(100, time + 0.5);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    // Low boom
    const osc = this.audioContext.createOscillator();
    const oscGain = this.audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, time);
    osc.frequency.exponentialRampToValueAtTime(20, time + 0.4);
    oscGain.gain.setValueAtTime(0.8, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);

    noise.start(time);
    noise.stop(time + 0.5);
    osc.start(time);
    osc.stop(time + 0.4);
  }

  playHit() {
    this.init();
    const time = this.audioContext.currentTime;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, time);
    osc.frequency.exponentialRampToValueAtTime(100, time + 0.08);

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.08);
  }

  playDeath() {
    this.init();
    const time = this.audioContext.currentTime;

    // Descending tone
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, time);
    osc.frequency.exponentialRampToValueAtTime(50, time + 0.5);

    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.5);
  }

  playRespawn() {
    this.init();
    const time = this.audioContext.currentTime;

    // Ascending arpeggio
    const notes = [200, 300, 400, 600];
    notes.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'square';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, time + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.2, time + i * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, time + i * 0.1 + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(time + i * 0.1);
      osc.stop(time + i * 0.1 + 0.15);
    });
  }

  playUIClick() {
    this.init();
    const time = this.audioContext.currentTime;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'square';
    osc.frequency.value = 600;

    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  playUIHover() {
    this.init();
    const time = this.audioContext.currentTime;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.value = 400;

    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.03);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.03);
  }

  // ==================== ABILITY SOUND EFFECTS ====================

  playAbility(characterType, abilityName) {
    const abilityMap = {
      MESSI: () => this.playMessiDash(),
      MILEI: () => this.playMileiChainsaw(),
      TRUMP: () => abilityName === 'TURRET' ? this.playTrumpTurret() : this.playTrumpWall(),
      BIDEN: () => this.playBidenHeal(),
      PUTIN: () => abilityName === 'BEAR' ? this.playPutinBear() : this.playPutinMissile(),
    };

    if (abilityMap[characterType]) {
      abilityMap[characterType]();
    }
  }

  playMessiDash() {
    this.init();
    const time = this.audioContext.currentTime;

    // Whoosh sound
    const bufferSize = this.audioContext.sampleRate * 0.2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const progress = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.sin(progress * Math.PI) * 0.5;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, time);
    filter.frequency.exponentialRampToValueAtTime(500, time + 0.2);
    filter.Q.value = 2;

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(time);
    noise.stop(time + 0.2);

    // Football kick thump
    const kick = this.audioContext.createOscillator();
    const kickGain = this.audioContext.createGain();

    kick.type = 'sine';
    kick.frequency.setValueAtTime(200, time + 0.05);
    kick.frequency.exponentialRampToValueAtTime(60, time + 0.15);

    kickGain.gain.setValueAtTime(0.3, time + 0.05);
    kickGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

    kick.connect(kickGain);
    kickGain.connect(this.sfxGain);

    kick.start(time + 0.05);
    kick.stop(time + 0.15);
  }

  playMileiChainsaw() {
    this.init();
    const time = this.audioContext.currentTime;

    // Revving motor
    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';

    osc1.frequency.setValueAtTime(60, time);
    osc1.frequency.linearRampToValueAtTime(200, time + 0.15);
    osc1.frequency.linearRampToValueAtTime(150, time + 0.4);

    osc2.frequency.setValueAtTime(120, time);
    osc2.frequency.linearRampToValueAtTime(400, time + 0.15);
    osc2.frequency.linearRampToValueAtTime(300, time + 0.4);

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.setValueAtTime(0.5, time + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

    const distortion = this.createDistortion(30);

    osc1.connect(distortion);
    osc2.connect(distortion);
    distortion.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(time);
    osc1.stop(time + 0.4);
    osc2.start(time);
    osc2.stop(time + 0.4);

    // Slash noise
    const bufferSize = this.audioContext.sampleRate * 0.15;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const slashGain = this.audioContext.createGain();
    slashGain.gain.setValueAtTime(0.3, time + 0.2);
    slashGain.gain.exponentialRampToValueAtTime(0.01, time + 0.35);

    noise.connect(slashGain);
    slashGain.connect(this.sfxGain);

    noise.start(time + 0.2);
    noise.stop(time + 0.35);
  }

  playTrumpWall() {
    this.init();
    const time = this.audioContext.currentTime;

    // Construction clang
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, time);
    osc.frequency.exponentialRampToValueAtTime(200, time + 0.3);

    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.3);

    // Metallic ring
    const ring = this.audioContext.createOscillator();
    const ringGain = this.audioContext.createGain();

    ring.type = 'sine';
    ring.frequency.value = 1200;

    ringGain.gain.setValueAtTime(0.2, time);
    ringGain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    ring.connect(ringGain);
    ringGain.connect(this.sfxGain);

    ring.start(time);
    ring.stop(time + 0.5);
  }

  playTrumpTurret() {
    this.init();
    const time = this.audioContext.currentTime;

    // Deployment beep sequence
    const beepFreqs = [600, 800, 1000];
    beepFreqs.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'square';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.2, time + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, time + i * 0.08 + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(time + i * 0.08);
      osc.stop(time + i * 0.08 + 0.05);
    });

    // Mechanical whirr
    const whirr = this.audioContext.createOscillator();
    const whirrGain = this.audioContext.createGain();

    whirr.type = 'sawtooth';
    whirr.frequency.setValueAtTime(100, time + 0.25);
    whirr.frequency.linearRampToValueAtTime(300, time + 0.5);

    whirrGain.gain.setValueAtTime(0.15, time + 0.25);
    whirrGain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    whirr.connect(whirrGain);
    whirrGain.connect(this.sfxGain);

    whirr.start(time + 0.25);
    whirr.stop(time + 0.5);
  }

  playBidenHeal() {
    this.init();
    const time = this.audioContext.currentTime;

    // Gentle chime arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, time + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.15, time + i * 0.1 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.01, time + i * 0.1 + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(time + i * 0.1);
      osc.stop(time + i * 0.1 + 0.3);
    });

    // Sparkle shimmer
    const bufferSize = this.audioContext.sampleRate * 0.3;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.1 * Math.sin((i / bufferSize) * Math.PI);
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 5000;

    const sparkleGain = this.audioContext.createGain();
    sparkleGain.gain.value = 0.15;

    noise.connect(filter);
    filter.connect(sparkleGain);
    sparkleGain.connect(this.sfxGain);

    noise.start(time + 0.1);
    noise.stop(time + 0.4);
  }

  playPutinBear() {
    this.init();
    const time = this.audioContext.currentTime;

    // Bear growl
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, time);
    osc.frequency.linearRampToValueAtTime(60, time + 0.2);
    osc.frequency.linearRampToValueAtTime(100, time + 0.4);
    osc.frequency.linearRampToValueAtTime(50, time + 0.6);

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.linearRampToValueAtTime(0.5, time + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.6);

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(time);
    osc.stop(time + 0.6);

    // Heavy thud
    const thud = this.audioContext.createOscillator();
    const thudGain = this.audioContext.createGain();

    thud.type = 'sine';
    thud.frequency.setValueAtTime(100, time + 0.5);
    thud.frequency.exponentialRampToValueAtTime(30, time + 0.7);

    thudGain.gain.setValueAtTime(0.5, time + 0.5);
    thudGain.gain.exponentialRampToValueAtTime(0.01, time + 0.7);

    thud.connect(thudGain);
    thudGain.connect(this.sfxGain);

    thud.start(time + 0.5);
    thud.stop(time + 0.7);
  }

  playPutinMissile() {
    this.init();
    const time = this.audioContext.currentTime;

    // Rocket launch whoosh
    const bufferSize = this.audioContext.sampleRate * 0.4;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const progress = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * (0.3 + progress * 0.7);
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(200, time);
    filter.frequency.exponentialRampToValueAtTime(2000, time + 0.4);
    filter.Q.value = 1;

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.linearRampToValueAtTime(0.5, time + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(time);
    noise.stop(time + 0.4);

    // Low rumble
    const rumble = this.audioContext.createOscillator();
    const rumbleGain = this.audioContext.createGain();

    rumble.type = 'sine';
    rumble.frequency.setValueAtTime(60, time);
    rumble.frequency.linearRampToValueAtTime(100, time + 0.3);

    rumbleGain.gain.setValueAtTime(0.4, time);
    rumbleGain.gain.exponentialRampToValueAtTime(0.01, time + 0.35);

    rumble.connect(rumbleGain);
    rumbleGain.connect(this.sfxGain);

    rumble.start(time);
    rumble.stop(time + 0.35);
  }

  // ==================== ULTIMATE SOUND EFFECTS ====================

  playUltimate(ultimateType) {
    const ultimateMap = {
      GOLDEN_BALL: () => this.playGoldenBall(),
      DOLLARIZATION: () => this.playDollarization(),
      MAGA_MECH: () => this.playMagaMech(),
      EXECUTIVE_ORDER: () => this.playExecutiveOrder(),
      NUCLEAR_STRIKE: () => this.playNuclearStrike(),
    };

    if (ultimateMap[ultimateType]) {
      ultimateMap[ultimateType]();
    }
  }

  playGoldenBall() {
    this.init();
    const time = this.audioContext.currentTime;

    // Stadium crowd roar (filtered noise)
    const bufferSize = this.audioContext.sampleRate * 1.5;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const progress = i / bufferSize;
      const envelope = Math.sin(progress * Math.PI);
      data[i] = (Math.random() * 2 - 1) * envelope;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.5;

    const crowdGain = this.audioContext.createGain();
    crowdGain.gain.value = 0.4;

    noise.connect(filter);
    filter.connect(crowdGain);
    crowdGain.connect(this.sfxGain);

    noise.start(time);
    noise.stop(time + 1.5);

    // Whistle
    const whistle = this.audioContext.createOscillator();
    const whistleGain = this.audioContext.createGain();

    whistle.type = 'sine';
    whistle.frequency.setValueAtTime(3000, time + 0.3);
    whistle.frequency.setValueAtTime(2500, time + 0.5);
    whistle.frequency.setValueAtTime(3000, time + 0.7);

    whistleGain.gain.setValueAtTime(0, time + 0.3);
    whistleGain.gain.linearRampToValueAtTime(0.3, time + 0.35);
    whistleGain.gain.setValueAtTime(0.3, time + 0.7);
    whistleGain.gain.exponentialRampToValueAtTime(0.01, time + 0.9);

    whistle.connect(whistleGain);
    whistleGain.connect(this.sfxGain);

    whistle.start(time + 0.3);
    whistle.stop(time + 0.9);
  }

  playDollarization() {
    this.init();
    const time = this.audioContext.currentTime;

    // Cash register ding
    const ding = this.audioContext.createOscillator();
    const dingGain = this.audioContext.createGain();

    ding.type = 'sine';
    ding.frequency.value = 2000;

    dingGain.gain.setValueAtTime(0.4, time);
    dingGain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    ding.connect(dingGain);
    dingGain.connect(this.sfxGain);

    ding.start(time);
    ding.stop(time + 0.5);

    // Money rain shimmer
    for (let i = 0; i < 8; i++) {
      const coin = this.audioContext.createOscillator();
      const coinGain = this.audioContext.createGain();

      coin.type = 'triangle';
      coin.frequency.value = 1500 + Math.random() * 1000;

      const delay = 0.1 + Math.random() * 0.5;
      coinGain.gain.setValueAtTime(0.15, time + delay);
      coinGain.gain.exponentialRampToValueAtTime(0.01, time + delay + 0.1);

      coin.connect(coinGain);
      coinGain.connect(this.sfxGain);

      coin.start(time + delay);
      coin.stop(time + delay + 0.1);
    }

    // AFUERA bass hit
    const bass = this.audioContext.createOscillator();
    const bassGain = this.audioContext.createGain();

    bass.type = 'sawtooth';
    bass.frequency.value = 80;

    bassGain.gain.setValueAtTime(0.5, time + 0.1);
    bassGain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

    bass.connect(bassGain);
    bassGain.connect(this.sfxGain);

    bass.start(time + 0.1);
    bass.stop(time + 0.4);
  }

  playMagaMech() {
    this.init();
    const time = this.audioContext.currentTime;

    // Transformer mechanical sound
    const mech1 = this.audioContext.createOscillator();
    const mech2 = this.audioContext.createOscillator();
    const mechGain = this.audioContext.createGain();

    mech1.type = 'sawtooth';
    mech2.type = 'square';

    mech1.frequency.setValueAtTime(100, time);
    mech1.frequency.linearRampToValueAtTime(300, time + 0.3);
    mech1.frequency.linearRampToValueAtTime(150, time + 0.6);

    mech2.frequency.setValueAtTime(150, time);
    mech2.frequency.linearRampToValueAtTime(500, time + 0.3);
    mech2.frequency.linearRampToValueAtTime(200, time + 0.6);

    mechGain.gain.setValueAtTime(0.4, time);
    mechGain.gain.exponentialRampToValueAtTime(0.01, time + 0.6);

    const distortion = this.createDistortion(20);

    mech1.connect(distortion);
    mech2.connect(distortion);
    distortion.connect(mechGain);
    mechGain.connect(this.sfxGain);

    mech1.start(time);
    mech1.stop(time + 0.6);
    mech2.start(time);
    mech2.stop(time + 0.6);

    // Eagle screech
    const screech = this.audioContext.createOscillator();
    const screechGain = this.audioContext.createGain();

    screech.type = 'sawtooth';
    screech.frequency.setValueAtTime(1500, time + 0.5);
    screech.frequency.linearRampToValueAtTime(2500, time + 0.7);
    screech.frequency.linearRampToValueAtTime(1200, time + 1.0);

    screechGain.gain.setValueAtTime(0.25, time + 0.5);
    screechGain.gain.exponentialRampToValueAtTime(0.01, time + 1.0);

    const screechFilter = this.audioContext.createBiquadFilter();
    screechFilter.type = 'bandpass';
    screechFilter.frequency.value = 2000;
    screechFilter.Q.value = 5;

    screech.connect(screechFilter);
    screechFilter.connect(screechGain);
    screechGain.connect(this.sfxGain);

    screech.start(time + 0.5);
    screech.stop(time + 1.0);
  }

  playExecutiveOrder() {
    this.init();
    const time = this.audioContext.currentTime;

    // Stamp thunk
    const stamp = this.audioContext.createOscillator();
    const stampGain = this.audioContext.createGain();

    stamp.type = 'sine';
    stamp.frequency.setValueAtTime(300, time);
    stamp.frequency.exponentialRampToValueAtTime(80, time + 0.15);

    stampGain.gain.setValueAtTime(0.5, time);
    stampGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

    stamp.connect(stampGain);
    stampGain.connect(this.sfxGain);

    stamp.start(time);
    stamp.stop(time + 0.15);

    // Paper rustle
    const bufferSize = this.audioContext.sampleRate * 0.1;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.2;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;

    const rustleGain = this.audioContext.createGain();
    rustleGain.gain.setValueAtTime(0.2, time + 0.1);
    rustleGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    noise.connect(filter);
    filter.connect(rustleGain);
    rustleGain.connect(this.sfxGain);

    noise.start(time + 0.1);
    noise.stop(time + 0.2);

    // Gavel hit
    const gavel = this.audioContext.createOscillator();
    const gavelGain = this.audioContext.createGain();

    gavel.type = 'triangle';
    gavel.frequency.setValueAtTime(500, time + 0.25);
    gavel.frequency.exponentialRampToValueAtTime(100, time + 0.4);

    gavelGain.gain.setValueAtTime(0.4, time + 0.25);
    gavelGain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

    gavel.connect(gavelGain);
    gavelGain.connect(this.sfxGain);

    gavel.start(time + 0.25);
    gavel.stop(time + 0.4);
  }

  playNuclearStrike() {
    this.init();
    const time = this.audioContext.currentTime;

    // Air raid siren
    const siren = this.audioContext.createOscillator();
    const sirenGain = this.audioContext.createGain();

    siren.type = 'sawtooth';
    siren.frequency.setValueAtTime(400, time);
    siren.frequency.linearRampToValueAtTime(800, time + 0.5);
    siren.frequency.linearRampToValueAtTime(400, time + 1.0);
    siren.frequency.linearRampToValueAtTime(800, time + 1.5);

    sirenGain.gain.setValueAtTime(0.3, time);
    sirenGain.gain.setValueAtTime(0.3, time + 1.3);
    sirenGain.gain.exponentialRampToValueAtTime(0.01, time + 1.5);

    siren.connect(sirenGain);
    sirenGain.connect(this.sfxGain);

    siren.start(time);
    siren.stop(time + 1.5);

    // Massive explosion
    const explodeTime = time + 1.2;

    const bufferSize = this.audioContext.sampleRate * 1.0;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, explodeTime);
    filter.frequency.exponentialRampToValueAtTime(100, explodeTime + 1.0);

    const explodeGain = this.audioContext.createGain();
    explodeGain.gain.setValueAtTime(0.8, explodeTime);
    explodeGain.gain.exponentialRampToValueAtTime(0.01, explodeTime + 1.0);

    noise.connect(filter);
    filter.connect(explodeGain);
    explodeGain.connect(this.sfxGain);

    // Deep boom
    const boom = this.audioContext.createOscillator();
    const boomGain = this.audioContext.createGain();

    boom.type = 'sine';
    boom.frequency.setValueAtTime(50, explodeTime);
    boom.frequency.exponentialRampToValueAtTime(20, explodeTime + 0.8);

    boomGain.gain.setValueAtTime(0.7, explodeTime);
    boomGain.gain.exponentialRampToValueAtTime(0.01, explodeTime + 0.8);

    boom.connect(boomGain);
    boomGain.connect(this.sfxGain);

    noise.start(explodeTime);
    noise.stop(explodeTime + 1.0);
    boom.start(explodeTime);
    boom.stop(explodeTime + 0.8);
  }

  playDodge() {
    this.init();
    const time = this.audioContext.currentTime;

    // Quick whoosh
    const bufferSize = this.audioContext.sampleRate * 0.15;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const progress = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.sin(progress * Math.PI) * 0.4;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1500, time);
    filter.frequency.exponentialRampToValueAtTime(600, time + 0.15);
    filter.Q.value = 2;

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(time);
    noise.stop(time + 0.15);
  }

  playPowerup() {
    this.init();
    const time = this.audioContext.currentTime;

    // Ascending power chord
    const notes = [261.63, 329.63, 392.00, 523.25];
    notes.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'square';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, time + i * 0.05);
      gain.gain.linearRampToValueAtTime(0.15, time + i * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, time + i * 0.05 + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(time + i * 0.05);
      osc.stop(time + i * 0.05 + 0.2);
    });
  }
}

export const SoundManager = new SoundManagerClass();
