/**
 * Advanced Procedural Audio & Music Synthesizer Engine for Coffee Crawl Mini.
 * 100% Web Audio API procedural synthesis with zero audio files / 0 KB footprint.
 * Features:
 * - Real Drum Synthesizer (Punchy Kick, Snappy Snare, Open/Closed Hi-Hats)
 * - Acid/Funk Moog Filtered Bassline
 * - Neo-Soul / Future Funk Polyphonic Chords
 * - Stereo Echo Delay Effect for Arcade Melodies
 * - 4 Rich Multi-Bar Tracks + High-Energy 138 BPM DISCO OVERDRIVE
 * - Dynamic tempo/pacing scaling with levels and Fast Mode
 */

interface TrackDef {
  name: string;
  bpm: number;
  kickPattern: number[];
  snarePattern: number[];
  hihatPattern: number[]; // 0: none, 1: closed, 2: open
  chords: number[][];
  bass: number[];
  lead: number[];
}

export class AudioManager {
  private ctx: AudioContext | null = null;
  public isMuted = false;

  // Master Gain & Effects
  private masterGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedbackGain: GainNode | null = null;
  private delayFilter: BiquadFilterNode | null = null;

  // Sequencer State
  private bgmInterval: number | null = null;
  private isBgmPlaying = false;
  private currentLevel = 1;
  private isFastMode = false;
  private isDiscoMode = false;
  private currentTrackIndex = -1;
  private currentStep = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isMuted = localStorage.getItem('coffeecrawl_muted') === 'true';
    }
  }

  public getContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.initEffectsGraph();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private initEffectsGraph() {
    if (!this.ctx) return;

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.24, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Stereo Echo Delay Loop (Dotted 8th-note style arcade echo)
    this.delayNode = this.ctx.createDelay(1.0);
    this.delayNode.delayTime.setValueAtTime(0.22, this.ctx.currentTime);

    this.delayFeedbackGain = this.ctx.createGain();
    this.delayFeedbackGain.gain.setValueAtTime(0.32, this.ctx.currentTime);

    this.delayFilter = this.ctx.createBiquadFilter();
    this.delayFilter.type = 'lowpass';
    this.delayFilter.frequency.setValueAtTime(2400, this.ctx.currentTime);

    // Feedback Loop: Delay -> Filter -> FeedbackGain -> Delay
    this.delayNode.connect(this.delayFilter);
    this.delayFilter.connect(this.delayFeedbackGain);
    this.delayFeedbackGain.connect(this.delayNode);

    // Delay Output -> Master Gain
    this.delayNode.connect(this.masterGain);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('coffeecrawl_muted', this.isMuted ? 'true' : 'false');
    }
    if (this.isMuted) {
      this.stopMusic();
    } else {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.startMusic(this.currentLevel, false);
    }
    return this.isMuted;
  }

  /* ===================== PROCEDURAL SFX ===================== */

  public playCollect(isGold = false) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isGold ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isGold ? 784 : 587.33, now); // G5 / D5
    osc.frequency.exponentialRampToValueAtTime(isGold ? 1568 : 1174.66, now + 0.09);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playHoney() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    notes.forEach((freq, idx) => {
      const t = ctx.currentTime + idx * 0.05;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(t);
      osc.stop(t + 0.22);
    });
  }

  public playHit() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    // Low rumble
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.28);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    // Noise burst
    const noiseLen = Math.floor(ctx.sampleRate * 0.08);
    const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / noiseLen, 1.6);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);
    noise.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.28);
    noise.start(now);
    noise.stop(now + 0.08);
  }

  public playLevelUp() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, idx) => {
      const t = ctx.currentTime + idx * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(t);
      osc.stop(t + 0.28);
    });
  }

  public playGameOver() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const notes = [440, 392, 349.23, 261.63, 196];
    notes.forEach((freq, idx) => {
      const t = ctx.currentTime + idx * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(t);
      osc.stop(t + 0.32);
    });
  }

  /* ===================== PROCEDURAL DRUM SYNTHESIZERS ===================== */

  private triggerKick(time: number, velocity = 1.0) {
    if (!this.ctx || !this.masterGain) return;

    // Body: Exponential pitch drop (160Hz -> 38Hz)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(36, time + 0.085);

    gain.gain.setValueAtTime(0.48 * velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.12);

    // Transient click for punch
    const clickLen = Math.floor(this.ctx.sampleRate * 0.015);
    const clickBuf = this.ctx.createBuffer(1, clickLen, this.ctx.sampleRate);
    const d = clickBuf.getChannelData(0);
    for (let i = 0; i < clickLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / clickLen, 3);
    const clickSrc = this.ctx.createBufferSource();
    clickSrc.buffer = clickBuf;

    const clickGain = this.ctx.createGain();
    clickGain.gain.setValueAtTime(0.25 * velocity, time);
    clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.015);

    const clickFilter = this.ctx.createBiquadFilter();
    clickFilter.type = 'bandpass';
    clickFilter.frequency.setValueAtTime(3200, time);

    clickSrc.connect(clickGain);
    clickGain.connect(clickFilter);
    clickFilter.connect(this.masterGain);

    clickSrc.start(time);
    clickSrc.stop(time + 0.015);
  }

  private triggerSnare(time: number, velocity = 1.0) {
    if (!this.ctx || !this.masterGain) return;

    // Tone layer
    const osc = this.ctx.createOscillator();
    const toneGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.05);

    toneGain.gain.setValueAtTime(0.35 * velocity, time);
    toneGain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);

    osc.connect(toneGain);
    toneGain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.07);

    // Snappy noise burst
    const noiseLen = Math.floor(this.ctx.sampleRate * 0.14);
    const noiseBuf = this.ctx.createBuffer(1, noiseLen, this.ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / noiseLen, 2);
    const noiseSrc = this.ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.38 * velocity, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'highpass';
    bpf.frequency.setValueAtTime(1400, time);

    noiseSrc.connect(noiseGain);
    noiseGain.connect(bpf);
    bpf.connect(this.masterGain);

    noiseSrc.start(time);
    noiseSrc.stop(time + 0.14);
  }

  private triggerHiHat(time: number, isOpen = false) {
    if (!this.ctx || !this.masterGain) return;

    const duration = isOpen ? 0.16 : 0.038;
    const noiseLen = Math.floor(this.ctx.sampleRate * duration);
    const noiseBuf = this.ctx.createBuffer(1, noiseLen, this.ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / noiseLen, isOpen ? 1.5 : 2.5);
    const noiseSrc = this.ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(isOpen ? 0.22 : 0.14, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    const hpf = this.ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.setValueAtTime(7500, time);

    noiseSrc.connect(noiseGain);
    noiseGain.connect(hpf);
    hpf.connect(this.masterGain);

    noiseSrc.start(time);
    noiseSrc.stop(time + duration);
  }

  /* ===================== PROCEDURAL SYNTH INSTRUMENTS ===================== */

  private triggerBass(time: number, freq: number, duration: number, isDisco = false) {
    if (!this.ctx || !this.masterGain || freq <= 0) return;

    // Sawtooth + Sub Triangle
    const saw = this.ctx.createOscillator();
    saw.type = isDisco ? 'sawtooth' : 'sawtooth';
    saw.frequency.setValueAtTime(freq, time);

    const sub = this.ctx.createOscillator();
    sub.type = 'triangle';
    sub.frequency.setValueAtTime(freq / 2, time);

    const gain = this.ctx.createGain();
    const vol = isDisco ? 0.32 : 0.26;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration * 1.5);

    // Resonant lowpass filter sweep (Moog funk pluck)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(4.2, time);
    filter.frequency.setValueAtTime(isDisco ? 1800 : 1300, time);
    filter.frequency.exponentialRampToValueAtTime(160, time + duration * 0.8);

    saw.connect(gain);
    sub.connect(gain);
    gain.connect(filter);
    filter.connect(this.masterGain);

    saw.start(time);
    saw.stop(time + duration * 1.5);
    sub.start(time);
    sub.stop(time + duration * 1.5);
  }

  private triggerChord(time: number, freqs: number[], duration: number, isDisco = false) {
    if (!this.ctx || !this.masterGain || !freqs.length) return;

    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = isDisco ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, time);

      const vol = isDisco ? 0.12 : 0.08;
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration * 2.8);

      const panner = this.ctx!.createStereoPanner();
      panner.pan.setValueAtTime(-0.4 + idx * 0.26, time);

      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.masterGain!);

      osc.start(time);
      osc.stop(time + duration * 2.8);
    });
  }

  private triggerLead(time: number, freq: number, duration: number, isDisco = false) {
    if (!this.ctx || !this.masterGain || freq <= 0) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isDisco ? 'sawtooth' : 'square';
    osc.frequency.setValueAtTime(freq, time);

    const vol = isDisco ? 0.14 : 0.09;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration * 1.2);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isDisco ? 2800 : 2000, time);

    const panner = this.ctx.createStereoPanner();
    panner.pan.setValueAtTime(Math.sin(this.currentStep * 0.4) * 0.5, time);

    osc.connect(gain);
    gain.connect(filter);
    filter.connect(panner);
    panner.connect(this.masterGain);

    // Also route lead to Stereo Echo Delay
    if (this.delayNode) {
      panner.connect(this.delayNode);
    }

    osc.start(time);
    osc.stop(time + duration * 1.2);
  }

  /* ===================== SEQUENCER & MUSIC ENGINE ===================== */

  public startMusic(level = 1, forceNewTrack = true) {
    this.currentLevel = level;
    this.isDiscoMode = false;
    this.isFastMode = false;
    this.currentStep = 0;

    if (forceNewTrack || this.currentTrackIndex === -1) {
      let next = Math.floor(Math.random() * 4);
      if (next === this.currentTrackIndex) {
        next = (next + 1) % 4;
      }
      this.currentTrackIndex = next;
    }

    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.isBgmPlaying = true;
    this.scheduleNextBgmLoop();
  }

  public updatePacing(level: number, isFast = false) {
    if (this.currentLevel === level && this.isFastMode === isFast) return;
    this.currentLevel = level;
    this.isFastMode = isFast;
    if (this.isBgmPlaying && !this.isMuted) {
      this.scheduleNextBgmLoop();
    }
  }

  public startDiscoMusic() {
    if (this.isDiscoMode) return;
    this.isDiscoMode = true;
    this.currentStep = 0;
    if (this.isBgmPlaying && !this.isMuted) {
      this.scheduleNextBgmLoop();
    }
  }

  public stopDiscoMusic() {
    if (!this.isDiscoMode) return;
    this.isDiscoMode = false;
    this.currentStep = 0;
    if (this.isBgmPlaying && !this.isMuted) {
      this.scheduleNextBgmLoop();
    }
  }

  public stopMusic() {
    if (!this.isBgmPlaying) return;
    this.isBgmPlaying = false;

    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  private getTracks(): TrackDef[] {
    return [
      // 1. FUTURE FUNK ARCADE (D Minor) — Uplifting funk groove with slap bass & echo leads
      {
        name: 'Future Funk Arcade',
        bpm: 126,
        kickPattern:  [1, 0, 0, 0,  0, 0, 1, 0,  1, 0, 0, 0,  0, 1, 0, 0,  1, 0, 0, 0,  0, 0, 1, 0,  1, 0, 0, 0,  0, 1, 1, 0],
        snarePattern: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 1],
        hihatPattern: [1, 1, 2, 1,  1, 1, 2, 1,  1, 1, 2, 1,  1, 1, 2, 1,  1, 1, 2, 1,  1, 1, 2, 1,  1, 1, 2, 1,  1, 1, 2, 2],
        chords: [
          [293.66, 349.23, 440.00, 523.25], // Dm9
          [246.94, 329.63, 392.00, 493.88], // G13
          [261.63, 329.63, 392.00, 523.25], // Cmaj7
          [220.00, 277.18, 329.63, 440.00]  // A7#9
        ],
        bass: [
          146.83, 0, 146.83, 174.61,  0, 146.83, 0, 220.00,  196.00, 0, 196.00, 0,  246.94, 0, 196.00, 0,
          130.81, 0, 130.81, 164.81,  0, 130.81, 0, 196.00,  110.00, 0, 110.00, 130.81,  146.83, 0, 164.81, 174.61
        ],
        lead: [
          587.33, 0, 659.25, 783.99,  880.00, 0, 783.99, 659.25,  783.99, 0, 659.25, 587.33,  523.25, 0, 587.33, 0,
          659.25, 0, 783.99, 880.00,  1046.5, 0, 880.00, 783.99,  880.00, 0, 783.99, 659.25,  587.33, 659.25, 783.99, 880.00
        ]
      },

      // 2. CYBER RUNNER (E Minor) — Driving Synthwave & Fast 16th bass
      {
        name: 'Cyber Runner',
        bpm: 130,
        kickPattern:  [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 1, 0],
        snarePattern: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0],
        hihatPattern: [1, 1, 1, 1,  1, 1, 2, 1,  1, 1, 1, 1,  1, 1, 2, 1,  1, 1, 1, 1,  1, 1, 2, 1,  1, 1, 1, 1,  1, 1, 2, 2],
        chords: [
          [329.63, 392.00, 493.88, 587.33], // Em7
          [261.63, 329.63, 392.00, 523.25], // Cmaj7
          [196.00, 246.94, 293.66, 392.00], // G
          [293.66, 369.99, 440.00, 587.33]  // D
        ],
        bass: [
          164.81, 164.81, 0, 164.81,  164.81, 0, 196.00, 164.81,  130.81, 130.81, 0, 130.81,  130.81, 0, 164.81, 130.81,
          98.00,  98.00,  0, 98.00,   98.00,  0, 130.81, 98.00,   146.83, 146.83, 0, 146.83,  146.83, 0, 164.81, 146.83
        ],
        lead: [
          659.25, 783.99, 987.77, 1174.66, 987.77, 783.99, 659.25, 0, 523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 523.25, 0,
          392.00, 493.88, 587.33, 783.99,  587.33, 493.88, 392.00, 0, 587.33, 739.99, 880.00, 1174.66, 880.00, 739.99, 587.33, 659.25
        ]
      },

      // 3. MOCHA BOUNCE (A Minor) — Cheerful Electro-Pop with bouncy syncopation
      {
        name: 'Mocha Bounce',
        bpm: 128,
        kickPattern:  [1, 0, 0, 1,  0, 0, 1, 0,  1, 0, 0, 1,  0, 0, 1, 0,  1, 0, 0, 1,  0, 0, 1, 0,  1, 0, 0, 1,  0, 1, 0, 1],
        snarePattern: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 1, 0],
        hihatPattern: [1, 2, 1, 2,  1, 2, 1, 2,  1, 2, 1, 2,  1, 2, 1, 2,  1, 2, 1, 2,  1, 2, 1, 2,  1, 2, 1, 2,  1, 2, 2, 2],
        chords: [
          [220.00, 261.63, 329.63, 440.00], // Am
          [174.61, 220.00, 261.63, 349.23], // F
          [261.63, 329.63, 392.00, 523.25], // C
          [196.00, 246.94, 293.66, 392.00]  // G
        ],
        bass: [
          110.00, 0, 110.00, 0,  130.81, 0, 110.00, 0,  87.31,  0, 87.31,  0,  110.00, 0, 87.31,  0,
          130.81, 0, 130.81, 0,  146.83, 0, 130.81, 0,  98.00,  0, 98.00,  0,  110.00, 0, 123.47, 0
        ],
        lead: [
          880.00, 0, 783.99, 0,  659.25, 0, 523.25, 0,  698.46, 0, 659.25, 0,  523.25, 0, 440.00, 0,
          783.99, 0, 659.25, 0,  523.25, 0, 392.00, 0,  587.33, 0, 659.25, 0,  783.99, 0, 880.00, 0
        ]
      },

      // 4. MIDNIGHT COFFEE LOUNGE (F Major) — Smooth Lo-Fi Chill & Warm Bass
      {
        name: 'Midnight Coffee Lounge',
        bpm: 122,
        kickPattern:  [1, 0, 0, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 1, 0, 0],
        snarePattern: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0],
        hihatPattern: [1, 0, 1, 0,  1, 0, 2, 0,  1, 0, 1, 0,  1, 0, 2, 0,  1, 0, 1, 0,  1, 0, 2, 0,  1, 0, 1, 0,  1, 1, 2, 2],
        chords: [
          [349.23, 440.00, 523.25, 659.25], // Fmaj7
          [329.63, 392.00, 493.88, 587.33], // Em7
          [293.66, 349.23, 440.00, 523.25], // Dm7
          [261.63, 329.63, 392.00, 523.25]  // Cmaj7
        ],
        bass: [
          87.31,  0, 0, 87.31,  0, 0, 110.00, 0,  82.41,  0, 0, 82.41,  0, 0, 98.00,  0,
          73.42,  0, 0, 73.42,  0, 0, 87.31,  0,  65.41,  0, 0, 65.41,  0, 0, 73.42,  87.31
        ],
        lead: [
          659.25, 0, 523.25, 0,  440.00, 0, 349.23, 0,  587.33, 0, 493.88, 0,  392.00, 0, 329.63, 0,
          523.25, 0, 440.00, 0,  349.23, 0, 293.66, 0,  392.00, 0, 440.00, 0,  523.25, 0, 659.25, 0
        ]
      }
    ];
  }

  // 5. HIGH-ENERGY DISCO OVERDRIVE TRACK (138 BPM, Pure Four-on-the-Floor Club Groove)
  private getDiscoTrack(): TrackDef {
    return {
      name: 'DISCO OVERDRIVE',
      bpm: 138,
      kickPattern:  [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0],
      snarePattern: [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 1, 1],
      hihatPattern: [0, 0, 2, 0,  0, 0, 2, 0,  0, 0, 2, 0,  0, 0, 2, 0,  0, 0, 2, 0,  0, 0, 2, 0,  0, 0, 2, 0,  2, 2, 2, 2],
      chords: [
        [349.23, 440.00, 523.25, 659.25], // Fmaj7
        [392.00, 493.88, 587.33, 698.46], // G7
        [440.00, 523.25, 659.25, 783.99], // Am7
        [523.25, 659.25, 783.99, 1046.50] // C
      ],
      bass: [
        87.31, 174.61, 87.31, 174.61,  98.00, 196.00, 98.00, 196.00,  110.00, 220.00, 110.00, 220.00,  130.81, 261.63, 130.81, 261.63,
        87.31, 174.61, 87.31, 174.61,  98.00, 196.00, 98.00, 196.00,  110.00, 220.00, 110.00, 220.00,  146.83, 293.66, 164.81, 329.63
      ],
      lead: [
        698.46, 783.99, 880.00, 1046.50,  1318.51, 1046.50, 880.00, 783.99,  880.00, 1046.50, 1318.51, 1567.98,  1318.51, 1046.50, 880.00, 783.99,
        698.46, 783.99, 880.00, 1046.50,  1318.51, 1046.50, 880.00, 783.99,  1046.50, 1318.51, 1567.98, 1760.00, 1567.98, 1318.51, 1046.50, 880.00
      ]
    };
  }

  private scheduleNextBgmLoop() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    if (!this.isBgmPlaying) return;

    const allTracks = this.getTracks();
    const activeTrack = this.isDiscoMode
      ? this.getDiscoTrack()
      : allTracks[this.currentTrackIndex >= 0 ? (this.currentTrackIndex % allTracks.length) : 0];

    // Tempo adjustments based on level and Fast mode
    let bpm = activeTrack.bpm;
    if (this.currentLevel >= 4 && this.currentLevel <= 7) bpm += 4;
    else if (this.currentLevel >= 8 && this.currentLevel <= 14) bpm += 8;
    else if (this.currentLevel >= 15) bpm += 12;

    if (this.isFastMode) bpm += 24; // Immediate thrilling boost in Fast Mode

    const stepDuration = 60 / bpm / 4; // 16th note step in seconds

    const playStep = () => {
      if (!this.isBgmPlaying || !this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      const step = this.currentStep % 32;
      const barIndex = Math.floor(step / 8) % activeTrack.chords.length;

      // 1. KICK DRUM
      if (activeTrack.kickPattern[step]) {
        this.triggerKick(now, step % 8 === 0 ? 1.0 : 0.85);
      }

      // 2. SNARE DRUM / CLAP
      if (activeTrack.snarePattern[step]) {
        this.triggerSnare(now, 1.0);
      }

      // 3. HI-HAT (Closed / Open)
      const hatType = activeTrack.hihatPattern[step];
      if (hatType === 1) {
        this.triggerHiHat(now, false);
      } else if (hatType === 2) {
        this.triggerHiHat(now, true);
      }

      // 4. BASSLINE
      const bassFreq = activeTrack.bass[step];
      if (bassFreq > 0) {
        this.triggerBass(now, bassFreq, stepDuration, this.isDiscoMode);
      }

      // 5. CHORDS (Stabs on off-beats and beat 2 & 4)
      if (step === 4 || step === 12 || step === 20 || step === 28 || (this.isDiscoMode && step % 4 === 0)) {
        const chord = activeTrack.chords[barIndex];
        this.triggerChord(now, chord, stepDuration, this.isDiscoMode);
      }

      // 6. MELODIC LEAD SYNTH WITH STEREO DELAY ECHO
      const leadFreq = activeTrack.lead[step];
      if (leadFreq > 0) {
        this.triggerLead(now, leadFreq, stepDuration, this.isDiscoMode);
      }

      this.currentStep++;
    };

    this.bgmInterval = window.setInterval(playStep, stepDuration * 1000);
  }
}

export const audioManager = new AudioManager();
