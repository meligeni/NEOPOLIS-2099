/**
 * Web Audio API synthesizer for retro cyberpunk life-sim sound effects and lo-fi synth background music
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicOsc1: OscillatorNode | null = null;
  private musicOsc2: OscillatorNode | null = null;
  private musicGain: GainNode | null = null;
  private isMusicPlaying = false;
  private musicTimer: number | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Credit earned sound - sparkling cyber arpeggio
  playCredit() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);

        gain.gain.setValueAtTime(0, now + i * 0.05);
        gain.gain.linearRampToValueAtTime(0.12, now + i * 0.05 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.25);
      });
    } catch {
      // Audio might be blocked by browser policy until interaction
    }
  }

  // Soft footstep
  playStep() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.06);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // ignore
    }
  }

  // Retro speech chirp (like Witchbrook/Animal Crossing cute bleeps)
  playChirp(pitchVariation = 1.0) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const baseFreq = 480 * pitchVariation;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.3, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // ignore
    }
  }

  // General UI Click
  playClick(pitchVariation = 1.0) {
    this.playChirp(pitchVariation);
  }

  // Hack tech terminal click / glitch
  playHackBeep(success = true) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      if (success) {
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1320, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      } else {
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.setValueAtTime(140, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch {
      // ignore
    }
  }

  // Level Up / Mission Complete fanfare
  playLevelUp() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // Synthesized bright cyberpunk fanfare: C4, G4, C5, E5, G5
      const notes = [261.63, 392.00, 523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.07, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.35);
      });
    } catch {
      // ignore
    }
  }

  // Furniture placement snap sound
  playPlace() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.1);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // ignore
    }
  }

  // Gentle soothing chime for resting on benches or bed
  playRest() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [329.63, 392.00, 493.88, 659.25]; // E4, G4, B4, E5
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0, now + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.08, now + i * 0.08 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.4);
      });
    } catch {
      // ignore
    }
  }

  // Refreshing cyber beverage sound
  playDrink() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [659.25, 880.00, 1174.66]; // E5, A5, D6
      notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);

        gain.gain.setValueAtTime(0.09, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.18);
      });
    } catch {
      // ignore
    }
  }

  // Mechanical vending machine servo buzz, item drop clunk, and electronic chime
  playVendingVend() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 1. Servo motor buzz
      const buzz = this.ctx.createOscillator();
      const buzzGain = this.ctx.createGain();
      buzz.type = 'sawtooth';
      buzz.frequency.setValueAtTime(140, now);
      buzz.frequency.linearRampToValueAtTime(190, now + 0.12);
      buzzGain.gain.setValueAtTime(0.06, now);
      buzzGain.gain.linearRampToValueAtTime(0.001, now + 0.14);
      buzz.connect(buzzGain);
      buzzGain.connect(this.ctx.destination);
      buzz.start(now);
      buzz.stop(now + 0.15);

      // 2. Chute drop clunk
      const clunk = this.ctx.createOscillator();
      const clunkGain = this.ctx.createGain();
      clunk.type = 'triangle';
      clunk.frequency.setValueAtTime(220, now + 0.11);
      clunk.frequency.exponentialRampToValueAtTime(60, now + 0.22);
      clunkGain.gain.setValueAtTime(0.14, now + 0.11);
      clunkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      clunk.connect(clunkGain);
      clunkGain.connect(this.ctx.destination);
      clunk.start(now + 0.11);
      clunk.stop(now + 0.25);

      // 3. Electronic chime
      const chimeNotes = [784, 1046.5]; // G5, C6
      chimeNotes.forEach((freq, idx) => {
        const chime = this.ctx!.createOscillator();
        const chimeGain = this.ctx!.createGain();
        chime.type = 'sine';
        chime.frequency.setValueAtTime(freq, now + 0.18 + idx * 0.07);
        chimeGain.gain.setValueAtTime(0.08, now + 0.18 + idx * 0.07);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18 + idx * 0.07 + 0.25);
        chime.connect(chimeGain);
        chimeGain.connect(this.ctx!.destination);
        chime.start(now + 0.18 + idx * 0.07);
        chime.stop(now + 0.18 + idx * 0.07 + 0.25);
      });
    } catch {
      // ignore
    }
  }

  // Futuristic morning news holographic broadcast fanfare
  playNewsBroadcast() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Broadcast alert triad: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.5)
      const broadcastNotes = [523.25, 659.25, 783.99, 1046.5];
      broadcastNotes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.09);

        gain.gain.setValueAtTime(0, now + i * 0.09);
        gain.gain.linearRampToValueAtTime(0.12, now + i * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.36);
      });

      // Subtle radio data teletype bursts
      for (let t = 0; t < 3; t++) {
        const blip = this.ctx.createOscillator();
        const blipGain = this.ctx.createGain();
        blip.type = 'square';
        blip.frequency.setValueAtTime(1400 + t * 200, now + 0.42 + t * 0.06);
        blipGain.gain.setValueAtTime(0.03, now + 0.42 + t * 0.06);
        blipGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42 + t * 0.06 + 0.04);
        blip.connect(blipGain);
        blipGain.connect(this.ctx.destination);
        blip.start(now + 0.42 + t * 0.06);
        blip.stop(now + 0.42 + t * 0.06 + 0.05);
      }
    } catch {
      // ignore
    }
  }

  // Rich Lo-Fi Cyberpunk Background Music Synthesizer (Chords, Lo-fi Drums, Sub Bass & Vinyl Crackle)
  private noiseNode: AudioNode | null = null;
  private noiseGain: GainNode | null = null;
  private lofiMasterGain: GainNode | null = null;

  startAmbientMusic() {
    if (this.isMusicPlaying) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      this.isMusicPlaying = true;

      // Master gain for ambient music
      this.lofiMasterGain = this.ctx.createGain();
      this.lofiMasterGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      this.lofiMasterGain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 1.2);
      this.lofiMasterGain.connect(this.ctx.destination);

      // 1. Vinyl Crackle Generator
      try {
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          let crackle = 0;
          if (Math.random() < 0.0015) {
            crackle = (Math.random() - 0.5) * 0.8;
          }
          output[i] = (b0 + b1 + b2) * 0.035 + crackle;
        }
        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);

        this.noiseGain = this.ctx.createGain();
        this.noiseGain.gain.setValueAtTime(0.045, this.ctx.currentTime);

        whiteNoise.connect(noiseFilter);
        noiseFilter.connect(this.noiseGain);
        this.noiseGain.connect(this.lofiMasterGain);
        whiteNoise.start();
        this.noiseNode = whiteNoise;
      } catch {
        // vinyl crackle fallback
      }

      // 2. Chords progression: Fm9 -> Dbmaj7 -> Bbm9 -> C7alt
      const chords = [
        {
          name: 'Fm9',
          bass: 87.31, // F2
          notes: [174.61, 261.63, 311.13, 392.00, 523.25], // F3, C4, Eb4, G4, C5
          arps: [523.25, 392.00, 311.13, 392.00],
        },
        {
          name: 'Dbmaj7',
          bass: 69.30, // Db2
          notes: [138.59, 207.65, 261.63, 329.63, 415.30], // Db3, Ab3, C4, E4, Ab4
          arps: [415.30, 329.63, 261.63, 329.63],
        },
        {
          name: 'Bbm9',
          bass: 58.27, // Bb1
          notes: [116.54, 174.61, 233.08, 277.18, 349.23], // Bb2, F3, Bb3, Db4, F4
          arps: [349.23, 277.18, 233.08, 277.18],
        },
        {
          name: 'C7alt',
          bass: 65.41, // C2
          notes: [130.81, 196.00, 246.94, 311.13, 392.00], // C3, G3, B3, Eb4, G4
          arps: [392.00, 311.13, 246.94, 311.13],
        },
      ];

      let chordIndex = 0;
      const bpm = 74;
      const beatSec = 60 / bpm; // ~0.81s per beat, 4 beats per bar = 3.24s per chord
      const barDuration = beatSec * 4;

      const playDrumHit = (type: 'kick' | 'snare' | 'hat', time: number) => {
        if (!this.ctx || !this.isMusicPlaying) return;
        if (type === 'kick') {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(95, time);
          osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);
          gain.gain.setValueAtTime(0.22, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
          osc.connect(gain);
          gain.connect(this.lofiMasterGain!);
          osc.start(time);
          osc.stop(time + 0.23);
        } else if (type === 'snare') {
          // Low-pass filtered noise snare / rimshot
          const osc = this.ctx.createOscillator();
          const oscGain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(180, time);
          osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);
          oscGain.gain.setValueAtTime(0.08, time);
          oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
          osc.connect(oscGain);
          oscGain.connect(this.lofiMasterGain!);
          osc.start(time);
          osc.stop(time + 0.13);

          // White noise component
          const bufferSize = Math.floor(this.ctx.sampleRate * 0.1);
          const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const data = noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
          const noise = this.ctx.createBufferSource();
          noise.buffer = noiseBuffer;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1200, time);
          const nGain = this.ctx.createGain();
          nGain.gain.setValueAtTime(0.09, time);
          nGain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);
          noise.connect(filter);
          filter.connect(nGain);
          nGain.connect(this.lofiMasterGain!);
          noise.start(time);
        } else if (type === 'hat') {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(5400, time);
          gain.gain.setValueAtTime(0.025, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
          osc.connect(gain);
          gain.connect(this.lofiMasterGain!);
          osc.start(time);
          osc.stop(time + 0.045);
        }
      };

      const scheduleBar = () => {
        if (!this.isMusicPlaying || !this.ctx) return;
        const now = this.ctx.currentTime;
        const chord = chords[chordIndex];

        // Sub Bass (Warm low triangle)
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(chord.bass, now);
        bassGain.gain.setValueAtTime(0, now);
        bassGain.gain.linearRampToValueAtTime(0.18, now + 0.08);
        bassGain.gain.exponentialRampToValueAtTime(0.09, now + barDuration * 0.85);
        bassGain.gain.linearRampToValueAtTime(0.001, now + barDuration);
        bassOsc.connect(bassGain);
        bassGain.connect(this.lofiMasterGain!);
        bassOsc.start(now);
        bassOsc.stop(now + barDuration);

        // Synth / Rhodes chords with gentle vibrato and filter
        chord.notes.forEach((freq, idx) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          const filter = this.ctx!.createBiquadFilter();

          osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, now);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1100, now);
          filter.frequency.exponentialRampToValueAtTime(650, now + barDuration * 0.8);

          // Gentle velocity variation per note
          const vel = 0.028 + (idx === 0 ? 0.012 : 0);
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(vel, now + 0.35);
          gain.gain.linearRampToValueAtTime(vel * 0.75, now + barDuration - 0.4);
          gain.gain.linearRampToValueAtTime(0.0001, now + barDuration);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.lofiMasterGain!);
          osc.start(now);
          osc.stop(now + barDuration);
        });

        // Atmospheric Arpeggio / Melodic Notes
        chord.arps.forEach((arpFreq, arpIdx) => {
          const arpTime = now + (arpIdx + 0.5) * (beatSec * 0.9);
          const aOsc = this.ctx!.createOscillator();
          const aGain = this.ctx!.createGain();
          aOsc.type = 'sine';
          aOsc.frequency.setValueAtTime(arpFreq, arpTime);
          aGain.gain.setValueAtTime(0, arpTime);
          aGain.gain.linearRampToValueAtTime(0.032, arpTime + 0.04);
          aGain.gain.exponentialRampToValueAtTime(0.001, arpTime + 0.65);
          aOsc.connect(aGain);
          aGain.connect(this.lofiMasterGain!);
          aOsc.start(arpTime);
          aOsc.stop(arpTime + 0.66);
        });

        // Lo-fi Drum Groove: Kick on 1 & 3.5, Snare on 2 & 4, swung Hi-hats on 8ths
        // Beat 1: Kick
        playDrumHit('kick', now);
        playDrumHit('hat', now);
        playDrumHit('hat', now + beatSec * 0.55); // slight swing

        // Beat 2: Snare
        playDrumHit('snare', now + beatSec);
        playDrumHit('hat', now + beatSec);
        playDrumHit('hat', now + beatSec * 1.55);

        // Beat 3: Kick
        playDrumHit('kick', now + beatSec * 2);
        playDrumHit('hat', now + beatSec * 2);
        playDrumHit('kick', now + beatSec * 2.5); // off-beat kick
        playDrumHit('hat', now + beatSec * 2.55);

        // Beat 4: Snare
        playDrumHit('snare', now + beatSec * 3);
        playDrumHit('hat', now + beatSec * 3);
        playDrumHit('hat', now + beatSec * 3.55);

        chordIndex = (chordIndex + 1) % chords.length;
        this.musicTimer = window.setTimeout(scheduleBar, (barDuration - 0.15) * 1000);
      };

      scheduleBar();
    } catch {
      // ignore
    }
  }

  stopAmbientMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.noiseNode) {
      try {
        (this.noiseNode as AudioBufferSourceNode).stop();
      } catch {
        // ignore
      }
      this.noiseNode = null;
    }
    if (this.lofiMasterGain && this.ctx) {
      try {
        this.lofiMasterGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      } catch {
        // ignore
      }
    }
  }
}

export const sound = new SoundEngine();

