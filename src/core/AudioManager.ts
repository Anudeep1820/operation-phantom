export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isUnlocked: boolean = false;
  private masterVol: number = 0.8;
  private sfxVol: number = 0.8;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  public init(): void {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.masterGain.gain.setValueAtTime(this.masterVol, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);

      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.isUnlocked = true;
    } catch (e) {
      console.warn('AudioContext failed to initialize:', e);
    }
  }

  public unlock(): void {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        this.isUnlocked = true;
      });
    }
  }

  public setVolumes(master: number, sfx: number): void {
    this.masterVol = THREE_clamp(master, 0, 1);
    this.sfxVol = THREE_clamp(sfx, 0, 1);
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.masterVol, this.ctx.currentTime);
    }
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
    }
  }

  // --- Procedural Gunshot Synthesizers ---
  public playGunshot(type: 'VIPER9' | 'AR7' | 'LONGSHOT'): void {
    if (!this.ctx || !this.sfxGain || !this.isUnlocked) return;
    const now = this.ctx.currentTime;

    if (type === 'VIPER9') {
      // Snappy pistol crack
      this.createNoiseBurst(now, 0.12, 1200, 200, 0.7);
      this.createSubPunch(now, 160, 45, 0.1, 0.6);
    } else if (type === 'AR7') {
      // Punchy tactical rifle fire
      this.createNoiseBurst(now, 0.18, 900, 150, 0.85);
      this.createSubPunch(now, 130, 40, 0.15, 0.8);
      this.createMechClick(now + 0.05, 0.03, 3000, 0.3);
    } else if (type === 'LONGSHOT') {
      // High-caliber sniper blast
      this.createNoiseBurst(now, 0.45, 600, 80, 1.0);
      this.createSubPunch(now, 90, 25, 0.35, 1.0);
      this.createEchoTail(now + 0.1, 0.35, 0.3);
    }
  }

  public playReload(type: 'magOut' | 'magIn' | 'boltRack'): void {
    if (!this.ctx || !this.sfxGain || !this.isUnlocked) return;
    const now = this.ctx.currentTime;
    if (type === 'magOut') {
      this.createMechClick(now, 0.08, 1800, 0.4);
    } else if (type === 'magIn') {
      this.createMechClick(now, 0.1, 1400, 0.5);
      this.createSubPunch(now + 0.02, 180, 70, 0.06, 0.3);
    } else if (type === 'boltRack') {
      this.createMechClick(now, 0.06, 2800, 0.4);
      this.createMechClick(now + 0.08, 0.07, 2200, 0.5);
    }
  }

  public playEmptyClick(): void {
    if (!this.ctx || !this.sfxGain || !this.isUnlocked) return;
    this.createMechClick(this.ctx.currentTime, 0.04, 3200, 0.4);
  }

  public playHitmarker(isHeadshot: boolean = false): void {
    if (!this.ctx || !this.sfxGain || !this.isUnlocked) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (isHeadshot) {
      // High crisp headshot chime
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2400, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    } else {
      // Crisp body hitmarker tick
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.08);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    }

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + (isHeadshot ? 0.16 : 0.09));
  }

  public playFootstep(): void {
    if (!this.ctx || !this.sfxGain || !this.isUnlocked) return;
    const now = this.ctx.currentTime;
    this.createNoiseBurst(now, 0.05, 400, 80, 0.25);
  }

  public playHurt(): void {
    if (!this.ctx || !this.sfxGain || !this.isUnlocked) return;
    const now = this.ctx.currentTime;
    this.createSubPunch(now, 110, 40, 0.18, 0.6);
    this.createNoiseBurst(now, 0.12, 500, 100, 0.3);
  }

  public playElimination(): void {
    if (!this.ctx || !this.sfxGain || !this.isUnlocked) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  // --- Synthesis Utilities ---
  private createNoiseBurst(start: number, duration: number, filterFreq: number, q: number, vol: number): void {
    if (!this.ctx || !this.sfxGain) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, start);
    filter.frequency.exponentialRampToValueAtTime(100, start + duration);
    filter.Q.value = q;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(start);
    noise.stop(start + duration);
  }

  private createSubPunch(start: number, startFreq: number, endFreq: number, duration: number, vol: number): void {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, start);
    osc.frequency.exponentialRampToValueAtTime(endFreq, start + duration);

    gain.gain.setValueAtTime(vol, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(start);
    osc.stop(start + duration);
  }

  private createMechClick(start: number, duration: number, freq: number, vol: number): void {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, start);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.4, start + duration);

    gain.gain.setValueAtTime(vol, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(start);
    osc.stop(start + duration);
  }

  private createEchoTail(start: number, duration: number, vol: number): void {
    if (!this.ctx || !this.sfxGain) return;
    this.createNoiseBurst(start, duration, 350, 40, vol);
  }
}

function THREE_clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
