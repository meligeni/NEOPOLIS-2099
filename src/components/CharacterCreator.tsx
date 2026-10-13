import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Dna, Cpu, Shield, ArrowRight, RefreshCw, Palette } from 'lucide-react';
import { CharacterAppearance, OriginClass } from '../types/game';
import { drawCharacter } from '../utils/pixelRenderer';
import { sound } from '../utils/audio';

interface CharacterCreatorProps {
  onComplete: (char: CharacterAppearance) => void;
}

const SKIN_TONES = [
  { label: 'Cyber Pale', value: '#fed7aa' },
  { label: 'Synth Porcelain', value: '#e2e8f0' },
  { label: 'Neon Tan', value: '#fbd0b4' },
  { label: 'Bronze', value: '#c28859' },
  { label: 'Deep Chrome', value: '#78350f' },
  { label: 'Metallic Silver', value: '#94a3b8' },
];

const HAIR_STYLES = [
  { id: 'pixie', label: 'Neon Pixie' },
  { id: 'spiky', label: 'Street Spiky' },
  { id: 'bob', label: 'Cyber Bob' },
  { id: 'mohawk', label: 'Punk Mohawk' },
  { id: 'slick', label: 'Slick Synth' },
];

const HAIR_COLORS = [
  { label: 'Magenta Pink', value: '#ec4899' },
  { label: 'Electric Cyan', value: '#06b6d4' },
  { label: 'Toxic Lime', value: '#10b981' },
  { label: 'Solar Amber', value: '#f59e0b' },
  { label: 'Chrome White', value: '#f8fafc' },
  { label: 'Void Black', value: '#09090b' },
  { label: 'Ultra Violet', value: '#a855f7' },
];

const IMPLANTS = [
  { id: 'none', label: 'Natural / No Implant' },
  { id: 'visor', label: 'Kiroshi Optic Visor' },
  { id: 'optic_ring', label: 'Retinal Scanner Eye' },
  { id: 'neural_jack', label: 'Neck Neural Port' },
  { id: 'cyber_tattoo', label: 'Bioluminescent Circuitry' },
];

const OUTFITS = [
  { id: 'duster', label: 'Netrunner Trench Duster' },
  { id: 'bomber', label: 'Street Samurai Bomber' },
  { id: 'hoodie', label: 'Waterproof Techwear Hoodie' },
  { id: 'biosuit', label: 'Synth-Alchemist Bio-Suit' },
];

const OUTFIT_COLORS = [
  { label: 'Obsidian Black', value: '#18181b' },
  { label: 'Crimson Red', value: '#e11d48' },
  { label: 'Neon Cyan', value: '#0284c7' },
  { label: 'Emerald Tech', value: '#059669' },
  { label: 'Royal Purple', value: '#7c3aed' },
];

const DRONES = [
  { id: 'none', label: 'No Companion' },
  { id: 'holo_cat', label: 'Holo-Pixel Cat' },
  { id: 'nano_drone', label: 'Recon Nano Drone' },
];

const CLASS_DESCRIPTIONS: Record<OriginClass, { title: string; desc: string; perks: string }> = {
  netrunner: {
    title: 'Netrunner',
    desc: 'Specialist in cyber-matrix security bypass and remote terminal siphons.',
    perks: '+2 Hacking, +100 bonus starting credits',
  },
  mechanic: {
    title: 'Cyber-Mechanic',
    desc: 'Hardware genius who calibrates street bots, repairable drones, and constructs home furnishings.',
    perks: '+2 Engineering, starts with Omnitool',
  },
  alchemist: {
    title: 'Synth-Alchemist',
    desc: 'Grower of rare bio-luminescent flora inside concrete urban greenhouse basins.',
    perks: '+2 Synth-Botany, starts with Rare Seed Pack',
  },
  courier: {
    title: 'Neon Courier',
    desc: 'Agile rooftop runner with rapid transit contacts and high street charisma.',
    perks: '+15% Move Speed, +2 Street Cred',
  },
};

const RANDOM_NAMES = ['VEX-09', 'KIRA-X', 'ZERO', 'ECHO', 'CHROME-FOX', 'NOVA', 'KAGE', 'SPARK', 'BLITZ'];

export const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onComplete }) => {
  const [name, setName] = useState('VEX-09');
  const [origin, setOrigin] = useState<OriginClass>('netrunner');
  const [skinTone, setSkinTone] = useState(SKIN_TONES[2].value);
  const [hairStyle, setHairStyle] = useState('pixie');
  const [hairColor, setHairColor] = useState(HAIR_COLORS[0].value);
  const [implant, setImplant] = useState('visor');
  const [implantColor, setImplantColor] = useState('#06b6d4');
  const [outfitStyle, setOutfitStyle] = useState('duster');
  const [outfitColor, setOutfitColor] = useState(OUTFIT_COLORS[0].value);
  const [droneCompanion, setDroneCompanion] = useState<'none' | 'holo_cat' | 'nano_drone'>('holo_cat');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animated canvas preview
  useEffect(() => {
    let animId: number;
    let tick = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Cyber backdrop circle
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Neon grid floor
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.lineWidth = 1;
      for (let i = -100; i < 300; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 150, canvas.height);
        ctx.stroke();
      }

      // Draw character centered
      drawCharacter(
        ctx,
        canvas.width / 2,
        canvas.height / 2 + 30,
        {
          name,
          skinTone,
          hairStyle,
          hairColor,
          implant,
          implantColor,
          outfitStyle,
          outfitColor,
          droneCompanion,
        },
        'SE',
        true, // walking preview!
        tick,
        1.8 // scale up preview
      );

      tick += 0.04;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [name, skinTone, hairStyle, hairColor, implant, implantColor, outfitStyle, outfitColor, droneCompanion]);

  const handleRandomize = () => {
    sound.playChirp(1.2);
    setName(RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)]);
    setSkinTone(SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)].value);
    setHairStyle(HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)].id);
    setHairColor(HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)].value);
    setImplant(IMPLANTS[Math.floor(Math.random() * IMPLANTS.length)].id);
    setOutfitStyle(OUTFITS[Math.floor(Math.random() * OUTFITS.length)].id);
    setOutfitColor(OUTFIT_COLORS[Math.floor(Math.random() * OUTFIT_COLORS.length)].value);
  };

  const handleFinish = () => {
    sound.playLevelUp();
    onComplete({
      name: name.trim() || 'Runner',
      gender: 'neutral',
      origin,
      skinTone,
      hairStyle,
      hairColor,
      implant,
      implantColor,
      outfitStyle,
      outfitColor,
      droneCompanion,
    });
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 font-cyber relative overflow-hidden">
      {/* Background glow and scanlines */}
      <div className="absolute inset-0 bg-radial from-cyan-950/40 via-slate-950 to-black pointer-events-none" />
      <div className="scanlines absolute inset-0 pointer-events-none opacity-30" />

      <div className="relative w-full max-w-5xl bg-slate-900/90 border-2 border-cyan-500/70 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md flex flex-col md:flex-row">
        {/* Left Side: Live Character Pixel Viewport */}
        <div className="w-full md:w-2/5 p-6 bg-slate-950/80 border-b md:border-b-0 md:border-r border-cyan-500/30 flex flex-col items-center justify-between">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-400 animate-pulse" />
              <span className="font-pixel text-xs text-pink-300">AVATAR PREVIEW</span>
            </div>
            <button
              onClick={handleRandomize}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-cyan-950 border border-cyan-500/40 rounded-full text-xs text-cyan-300 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Randomize</span>
            </button>
          </div>

          <div className="relative my-4 p-2 bg-slate-900 border-2 border-cyan-400 rounded-2xl shadow-inner shadow-cyan-500/20">
            <canvas
              ref={canvasRef}
              width={260}
              height={260}
              className="rounded-xl pixelated block"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/80 border border-pink-500/50 rounded-full text-[10px] font-mono text-pink-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live Isometric Rig
            </div>
          </div>

          {/* Class Card */}
          <div className="w-full bg-slate-900/90 border border-cyan-500/30 p-3.5 rounded-xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs uppercase font-bold text-cyan-300">
                {CLASS_DESCRIPTIONS[origin].title}
              </span>
              <span className="text-[10px] font-mono text-emerald-400">CLASS PERKS</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-2">
              {CLASS_DESCRIPTIONS[origin].desc}
            </p>
            <div className="text-[11px] font-mono text-emerald-300 bg-emerald-950/50 px-2 py-1 rounded border border-emerald-500/30">
              ⚡ {CLASS_DESCRIPTIONS[origin].perks}
            </div>
          </div>
        </div>

        {/* Right Side: Customization Controls */}
        <div className="w-full md:w-3/5 p-6 flex flex-col justify-between max-h-[85vh] overflow-y-auto">
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-cyan-300 tracking-wider font-pixel mb-1">
                NEOPOLIS // IDENTITY MATRIX
              </h1>
              <p className="text-xs text-slate-400">
                Craft your runner before stepping onto the rainy streets of District 7.
              </p>
            </div>

            {/* Handle Name */}
            <div>
              <label className="block text-xs font-bold text-cyan-300 uppercase mb-1">
                Cyber Handle / Name:
              </label>
              <input
                type="text"
                value={name}
                maxLength={18}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-cyan-500/50 rounded-lg text-white font-mono focus:outline-none focus:border-pink-500 transition-colors"
                placeholder="Enter handle..."
              />
            </div>

            {/* Class Origin */}
            <div>
              <label className="block text-xs font-bold text-cyan-300 uppercase mb-2">
                Origin Background:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['netrunner', 'mechanic', 'alchemist', 'courier'] as OriginClass[]).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setOrigin(c);
                      sound.playChirp(1.1);
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all text-left capitalize ${
                      origin === c
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Hair Style & Color */}
            <div>
              <label className="block text-xs font-bold text-cyan-300 uppercase mb-2">
                Hairstyle & Neon Dye:
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {HAIR_STYLES.map(h => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => {
                      setHairStyle(h.id);
                      sound.playChirp(1.0);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                      hairStyle === h.id
                        ? 'bg-pink-500/30 border-pink-400 text-pink-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>

              {/* Color Swatches */}
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-slate-500" />
                <div className="flex gap-2">
                  {HAIR_COLORS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => {
                        setHairColor(c.value);
                        sound.playChirp(1.2);
                      }}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        hairColor === c.value ? 'scale-125 border-white shadow-lg' : 'border-transparent hover:scale-110'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Cybernetic Implant */}
            <div>
              <label className="block text-xs font-bold text-cyan-300 uppercase mb-2">
                Cyberware & Implants:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {IMPLANTS.map(imp => (
                  <button
                    key={imp.id}
                    type="button"
                    onClick={() => {
                      setImplant(imp.id);
                      sound.playChirp(1.1);
                    }}
                    className={`p-2 rounded-lg text-xs border text-left transition-all ${
                      implant === imp.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {imp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Outfit Style */}
            <div>
              <label className="block text-xs font-bold text-cyan-300 uppercase mb-2">
                Streetwear Outfit:
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {OUTFITS.map(o => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => {
                      setOutfitStyle(o.id);
                      sound.playChirp(1.0);
                    }}
                    className={`p-2 rounded-lg text-xs border text-left transition-all ${
                      outfitStyle === o.id
                        ? 'bg-purple-500/20 border-purple-400 text-purple-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>

              {/* Outfit color swatch */}
              <div className="flex gap-2">
                {OUTFIT_COLORS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setOutfitColor(c.value)}
                    className={`w-6 h-6 rounded-md border-2 ${
                      outfitColor === c.value ? 'scale-110 border-white' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Companion Drone */}
            <div>
              <label className="block text-xs font-bold text-cyan-300 uppercase mb-2">
                Companion Pet Drone:
              </label>
              <div className="flex gap-2">
                {DRONES.map(d => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      setDroneCompanion(d.id as 'none' | 'holo_cat' | 'nano_drone');
                      sound.playChirp(1.2);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                      droneCompanion === d.id
                        ? 'bg-pink-500/20 border-pink-400 text-pink-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-8 pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={handleFinish}
              className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-pixel text-xs rounded-xl shadow-lg shadow-cyan-500/40 hover:scale-105 transition-all cursor-pointer"
            >
              <span>JACK INTO NEOPOLIS</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
