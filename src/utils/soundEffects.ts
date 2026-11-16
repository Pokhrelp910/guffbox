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
}

export const stadiumAudio = new StadiumSoundSynthesizer();
