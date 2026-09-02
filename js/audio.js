class BirthdayAudioEngine {
  constructor() {
    this.ctx = null;
    this.isPlayingMusic = false;
    this.isMuted = false;
    this.masterVolume = 0.75;
    this.currentTimeout = null;
    this.melodyIndex = 0;
    this.tempo = 125;
    this.onStateChange = null;

    this.melody = [
      { note: 'D4', dur: 0.75 },
      { note: 'D4', dur: 0.25 },
      { note: 'E4', dur: 1.0 },
      { note: 'D4', dur: 1.0 },
      { note: 'G4', dur: 1.0 },
      { note: 'F#4', dur: 2.0 },
      { note: 'REST', dur: 0.5 },

      { note: 'D4', dur: 0.75 },
      { note: 'D4', dur: 0.25 },
      { note: 'E4', dur: 1.0 },
      { note: 'D4', dur: 1.0 },
      { note: 'A4', dur: 1.0 },
      { note: 'G4', dur: 2.0 },
      { note: 'REST', dur: 0.5 },

      { note: 'D4', dur: 0.75 },
      { note: 'D4', dur: 0.25 },
      { note: 'D5', dur: 1.0 },
      { note: 'B4', dur: 1.0 },
      { note: 'G4', dur: 1.0 },
      { note: 'F#4', dur: 1.0 },
      { note: 'E4', dur: 2.0 },
      { note: 'REST', dur: 0.5 },

      { note: 'C5', dur: 0.75 },
      { note: 'C5', dur: 0.25 },
      { note: 'B4', dur: 1.0 },
      { note: 'G4', dur: 1.0 },
      { note: 'A4', dur: 1.0 },
      { note: 'G4', dur: 2.5 },
      { note: 'REST', dur: 1.5 }
    ];

    this.noteFreqs = {
      'REST': 0,
      'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
      'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'E5': 659.25, 'F#5': 739.99, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
      'C6': 1046.50, 'D6': 1174.66
    };
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMusic() {
    this.init();
    if (this.isPlayingMusic) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
    return this.isPlayingMusic;
  }

  startMusic() {
    this.init();
    this.isPlayingMusic = true;
    this.melodyIndex = 0;
    this.playNextNote();
    if (this.onStateChange) this.onStateChange(true);
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
    if (this.onStateChange) this.onStateChange(false);
  }

  playNextNote() {
    if (!this.isPlayingMusic || !this.ctx) return;

    const item = this.melody[this.melodyIndex];
    const beatSec = 60 / this.tempo;
    const duration = item.dur * beatSec;

    if (item.note !== 'REST' && !this.isMuted) {
      const freq = this.noteFreqs[item.note] || 440;
      this.playMusicBoxNote(freq, duration);
      if (item.dur >= 1.0) {
        this.playMusicBoxNote(freq * 0.5, duration * 1.2, 0.15);
      }
    }

    this.melodyIndex = (this.melodyIndex + 1) % this.melody.length;
    this.currentTimeout = setTimeout(() => {
      this.playNextNote();
    }, duration * 1000);
  }

  playMusicBoxNote(freq, duration, volumeMult = 0.28) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, now);

    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0.2, now);
    osc2.connect(gain2);

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.exponentialRampToValueAtTime(this.masterVolume * volumeMult, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(duration * 1.5, 0.4));

    osc1.connect(gainNode);
    gain2.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);

    osc1.stop(now + Math.max(duration * 1.5, 0.4));
    osc2.stop(now + Math.max(duration * 1.5, 0.4));
  }

  playConfetti() {
    this.init();
    if (this.isMuted) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.18);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  playBlowCandles() {
    this.init();
    if (this.isMuted) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.6;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(150, now + 0.5);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);

    const chord = [523.25, 659.25, 783.99, 1046.50];
    chord.forEach((freq, idx) => {
      setTimeout(() => {
        this.playMusicBoxNote(freq, 0.8, 0.25);
      }, 350 + idx * 80);
    });
  }

  playGiftOpen() {
    this.init();
    if (this.isMuted) return;

    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51, 1760];
    notes.forEach((freq, index) => {
      setTimeout(() => {
        this.playMusicBoxNote(freq, 0.6, 0.22);
      }, index * 45);
    });
  }

  playBalloonPop() {
    this.init();
    if (this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

    gain.gain.setValueAtTime(0.5 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  playFirework() {
    this.init();
    if (this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);

    gain.gain.setValueAtTime(0.12 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);

    setTimeout(() => {
      if (!this.ctx || this.isMuted) return;
      const burstTime = this.ctx.currentTime;

      const bufferSize = this.ctx.sampleRate * 0.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.15));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, burstTime);
      filter.frequency.exponentialRampToValueAtTime(80, burstTime + 0.45);

      const burstGain = this.ctx.createGain();
      burstGain.gain.setValueAtTime(0.45 * this.masterVolume, burstTime);
      burstGain.gain.exponentialRampToValueAtTime(0.001, burstTime + 0.45);

      noise.connect(filter);
      filter.connect(burstGain);
      burstGain.connect(this.ctx.destination);
      noise.start(burstTime);
    }, 380);
  }

  playLanternSound() {
    this.init();
    if (this.isMuted) return;
    this.playMusicBoxNote(528, 1.8, 0.3);
    setTimeout(() => {
      this.playMusicBoxNote(792, 1.5, 0.2);
    }, 150);
  }

  playClick() {
    this.init();
    if (this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.04);

    gain.gain.setValueAtTime(0.15 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }
}

window.birthdayAudio = new BirthdayAudioEngine();
