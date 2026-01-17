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
  }

  init() {
    if (this.audioContext) return;

    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Master gain
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.7;
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
}

export const SoundManager = new SoundManagerClass();
