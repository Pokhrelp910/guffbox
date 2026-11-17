// GuffBox Cricket Studio — Web Audio API Stadium Sound Synthesizer

class StadiumSoundSynthesizer {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Wooden bat strike crack
  public playBatHit(power: 'soft' | 'medium' | 'hard' = 'medium') {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const baseFreq = power === 'hard' ? 420 : power === 'medium' ? 320 : 220;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.8, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Four boundary celebration sound
  public playFour() {
    this.playBatHit('hard');
    try {
      const ctx = this.getContext();
      // Fanfare chords
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + idx * 0.08 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + 0.95);
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // Six maximum celebration sound
  public playSix() {
    this.playBatHit('hard');
    try {
      const ctx = this.getContext();
      // Powerful swelling synth brass
      [261.63, 329.63, 392.00, 523.25].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.6);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.3);
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // Wicket crash & dramatic hit
  public playWicket() {
    try {
      const ctx = this.getContext();
      // Impact crash
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.9, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.42);

      // Warning siren
      const siren = ctx.createOscillator();
      const sirenGain = ctx.createGain();
      siren.type = 'sine';
      siren.frequency.setValueAtTime(800, ctx.currentTime + 0.1);
      siren.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.6);

      sirenGain.gain.setValueAtTime(0.3, ctx.currentTime + 0.1);
      sirenGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      siren.connect(sirenGain);
      sirenGain.connect(ctx.destination);
      siren.start(ctx.currentTime + 0.1);
      siren.stop(ctx.currentTime + 0.85);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // Extra buzzer for Wide / No-ball
  public playBuzzer() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, ctx.currentTime);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // Milestone Fanfare (50, 100, 5w haul, match win)
  public playFanfare() {
    try {
      const ctx = this.getContext();
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

        gain.gain.setValueAtTime(0.35, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.65);
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // ═════════════════════════════════════════════════════════════
  // ─── AMBIENT CONTINUOUS STADIUM CROWD ENGINE ───
  // ═════════════════════════════════════════════════════════════

  private ambientNode: AudioBufferSourceNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientLfo: OscillatorNode | null = null;
  private isAmbientPlaying: boolean = false;

  public startAmbientCrowd(volume: number = 0.12) {
    if (this.isAmbientPlaying) {
      this.setAmbientVolume(volume);
      return;
    }

    try {
      const ctx = this.getContext();
      // Generate 4-second seamless looping pinkish crowd murmur noise
      const bufferSize = ctx.sampleRate * 4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2) * 0.18;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // Bandpass filter to simulate human voices & stadium reverberation
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(650, ctx.currentTime);
      filter.Q.setValueAtTime(1.2, ctx.currentTime);

      // Low frequency oscillator for natural swell
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.25, ctx.currentTime); // 4-second gentle swell
      lfoGain.gain.setValueAtTime(0.04, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(Math.max(0.01, Math.min(1, volume)), ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      lfo.start();

      this.ambientNode = noise;
      this.ambientGain = gain;
      this.ambientLfo = lfo;
      this.isAmbientPlaying = true;
    } catch (e) {
      console.warn('Ambient crowd start error:', e);
    }
  }

  public stopAmbientCrowd() {
    if (!this.isAmbientPlaying) return;
    try {
      if (this.ambientGain && this.ctx) {
        this.ambientGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      }
      setTimeout(() => {
        try {
          this.ambientNode?.stop();
          this.ambientLfo?.stop();
          this.ambientNode?.disconnect();
          this.ambientGain?.disconnect();
          this.ambientLfo?.disconnect();
        } catch {
          // ignore cleanup errors
        }
        this.ambientNode = null;
        this.ambientGain = null;
        this.ambientLfo = null;
        this.isAmbientPlaying = false;
      }, 550);
    } catch (e) {
      console.warn('Ambient stop error:', e);
      this.isAmbientPlaying = false;
    }
  }

  public isAmbientCrowdActive(): boolean {
    return this.isAmbientPlaying;
  }

  public setAmbientVolume(volume: number) {
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(Math.max(0.01, Math.min(1, volume)), this.ctx.currentTime);
    }
  }

  // ═════════════════════════════════════════════════════════════
  // ─── BROADCAST SOUNDBOARD SPECIAL EFFECTS ───
  // ═════════════════════════════════════════════════════════════

  // Roaring crowd cheer & applause
  public playCrowdCheer() {
    try {
      const ctx = this.getContext();
      const bufferSize = ctx.sampleRate * 2.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.4;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(1400, ctx.currentTime + 0.8);
      filter.frequency.linearRampToValueAtTime(800, ctx.currentTime + 2.4);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noise.stop(ctx.currentTime + 2.5);
    } catch (e) {
      console.warn('Cheer sound error:', e);
    }
  }

  // Stadium Airhorn / Trumpet Anthem (ta-ta-ta-ta-ta-ta DHOOM!)
  public playAirhorn() {
    try {
      const ctx = this.getContext();
      // Notes pattern: G4, G4, G4, G4, G4, C5
      const notes = [
        { f: 392.00, t: 0.00, d: 0.12 },
        { f: 392.00, t: 0.14, d: 0.12 },
        { f: 392.00, t: 0.28, d: 0.12 },
        { f: 392.00, t: 0.44, d: 0.15 },
        { f: 392.00, t: 0.62, d: 0.15 },
        { f: 523.25, t: 0.80, d: 0.60 }, // Climax high C5
      ];

      notes.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(n.f, ctx.currentTime + n.t);

        gain.gain.setValueAtTime(0, ctx.currentTime + n.t);
        gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + n.t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.t + n.d);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + n.t);
        osc.stop(ctx.currentTime + n.t + n.d + 0.05);
      });
    } catch (e) {
      console.warn('Airhorn error:', e);
    }
  }

  // Crowd Appeal "HOWZAT!" Surge
  public playAppeal() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(550, ctx.currentTime + 0.3);
      osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.8);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.95);
    } catch (e) {
      console.warn('Appeal error:', e);
    }
  }

  // Rhythmic Stadium Hand Claps (Clap... Clap... Clap-Clap-Clap!)
  public playClapping() {
    try {
      const ctx = this.getContext();
      const clapTimes = [0.0, 0.4, 0.8, 1.0, 1.2, 1.4];
      clapTimes.forEach((t) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, ctx.currentTime + t);
        osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + t + 0.08);

        gain.gain.setValueAtTime(0.4, ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.09);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.1);
      });
    } catch (e) {
      console.warn('Clap error:', e);
    }
  }

  // Sharp Umpire / Referee Whistle
  public playWhistle() {
    try {
      const ctx = this.getContext();
      [2400, 2450].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.38);
      });
    } catch (e) {
      console.warn('Whistle error:', e);
    }
  }
}

export const stadiumAudio = new StadiumSoundSynthesizer();
