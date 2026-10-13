import React, { useState, useEffect } from 'react';
import {
  Coins,
  BatteryCharging,
  Cpu,
  Zap,
  Calendar,
  Music,
  ShoppingBag,
  Package,
  Target,
  Home,
  Sparkles,
  CloudRain,
  CloudFog,
  Sun,
  Radio,
  Newspaper,
  SlidersHorizontal,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import { GameState } from '../types/game';

interface TopBarProps {
  gameState: GameState;
  isDecorateMode: boolean;
  onToggleMusic: () => void;
  onOpenQuests: () => void;
  onOpenInventory: () => void;
  onOpenShop: () => void;
  onToggleHouseScene: () => void;
  onToggleDecorate: () => void;
  onCycleWeather: () => void;
  onQuickAction?: (actionKey: string) => void;
  onOpenNewsFeed?: () => void;
  onOpenSchedules?: () => void;
  onReturnToMenu?: () => void;
  newsTickerElement?: React.ReactNode;
}

export const TopBar: React.FC<TopBarProps> = ({
  gameState,
  isDecorateMode,
  onToggleMusic,
  onOpenQuests,
  onOpenInventory,
  onOpenShop,
  onToggleHouseScene,
  onToggleDecorate,
  onCycleWeather,
  onQuickAction,
  onOpenNewsFeed,
  onOpenSchedules,
  onReturnToMenu,
  newsTickerElement,
}) => {
  const [activeHotbarIndex, setActiveHotbarIndex] = useState<number>(0);


  // Keyboard shortcut listener for hotbar numbers 1-7
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      const keyNum = parseInt(e.key, 10);
      if (keyNum >= 1 && keyNum <= 7) {
        setActiveHotbarIndex(keyNum - 1);
        handleSlotClick(keyNum - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSlotClick = (index: number) => {
    setActiveHotbarIndex(index);
    if (onQuickAction) {
      const actions = ['deck', 'ram', 'medkit', 'stim', 'syringe', 'visor', 'cable'];
      onQuickAction(actions[index]);
    } else {
      if (index === 0) onOpenShop(); // Cyberdeck / shop
      else if (index === 1) onOpenQuests(); // RAM / quests
      else if (index === 2) onOpenInventory(); // Medkit
      else if (index === 5) onOpenInventory(); // Visor
    }
  };

  const energyPercent = Math.min(100, Math.round((gameState.stats.energy / gameState.stats.maxEnergy) * 100));
  const hackPercent = Math.min(100, Math.round((gameState.stats.exp / gameState.stats.maxExp) * 100));

  // Time format matching image: "03:46"
  const formattedTime = `${String(gameState.timeHour).padStart(2, '0')}:${String(gameState.timeMinute).padStart(2, '0')}`;

  return (
    <>
      {/* =========================================================================
          TOP HUD (EXACT PIXEL ART BEZEL DESIGN FROM REFERENCE IMAGE)
         ========================================================================= */}
      <header className="absolute top-0 left-0 right-0 z-30 p-2 sm:p-3 pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-start justify-between gap-3 pointer-events-auto">

          {/* 1. TOP-LEFT: CHARACTER PORTRAIT & DUAL CYBER STAT BARS */}
          <div className="flex items-start gap-2 bg-[#121626]/95 border-2 border-[#2b334d] p-2 rounded-2xl shadow-2xl backdrop-blur-md">
            {/* Portrait Frame */}
            <div className="flex flex-col items-center">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-[#0f1322] border-2 border-[#00f0ff] rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                {/* Pixel Avatar Inspired by Reference Image (Pink Hair, Cyan Visor, Headphones) */}
                <div className="relative w-12 h-12 flex items-center justify-center">
                  {/* Cyber Headset Ear Cups */}
                  <div className="absolute top-3 left-0 w-2 h-5 bg-[#00f0ff] rounded-xs shadow-sm shadow-[#00f0ff]" />
                  <div className="absolute top-3 right-0 w-2 h-5 bg-[#00f0ff] rounded-xs shadow-sm shadow-[#00f0ff]" />
                  {/* Headband */}
                  <div className="absolute top-1 left-2 right-2 h-1.5 bg-[#00f0ff]" />

                  {/* Pink Hair Base */}
                  <div className="w-9 h-10 bg-[#ff2a85] rounded-t-xl relative overflow-hidden flex flex-col items-center pt-2">
                    {/* Face */}
                    <div className="w-7 h-6 bg-[#fed7aa] rounded-sm relative flex items-center justify-center">
                      {/* Cyan Glowing Visor */}
                      <div className="w-8 h-3 bg-[#00f0ff] rounded-xs border border-white/50 flex items-center justify-end pr-1 shadow-sm shadow-[#00f0ff]">
                        <div className="w-2 h-0.5 bg-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* "level 1" badge beneath portrait */}
              <div className="mt-1 px-2 py-0.5 bg-[#0f1422] border border-[#2b334d] rounded-md text-[9px] font-pixel text-[#00f0ff] tracking-tight uppercase">
                level {gameState.stats.level}
              </div>
            </div>

            {/* Dual Cyber Status Bars */}
            <div className="flex flex-col justify-center min-w-[150px] sm:min-w-[210px] space-y-2 pt-0.5 pr-1">
              {/* Bar 1: Energy / Nanites (Electric Cyan) */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-cyber font-bold mb-0.5 text-[#38bdf8]">
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-[#00f0ff] fill-[#00f0ff]" />
                    <span>Energy/Nanites</span>
                  </div>
                  <span className="font-mono text-[9px] text-[#00f0ff]">{gameState.stats.energy}/{gameState.stats.maxEnergy}</span>
                </div>
                <div className="w-full h-3 bg-[#090d18] border border-[#1e293b] rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div
                    className="h-full bg-linear-to-r from-[#0284c7] via-[#00f0ff] to-[#38bdf8] rounded-full transition-all duration-300 shadow-sm shadow-[#00f0ff]"
                    style={{ width: `${energyPercent}%` }}
                  />
                </div>
              </div>

              {/* Bar 2: Hacking / Cyber-affinity (Vibrant Magenta/Pink) */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-cyber font-bold mb-0.5 text-[#f43f5e]">
                  <div className="flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-[#ff2a85]" />
                    <span>Hacking/Cyber-affinity</span>
                  </div>
                  <span className="font-mono text-[9px] text-[#ff2a85]">{gameState.stats.exp}/{gameState.stats.maxExp}</span>
                </div>
                <div className="w-full h-3 bg-[#090d18] border border-[#1e293b] rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div
                    className="h-full bg-linear-to-r from-[#9333ea] via-[#ff2a85] to-[#f43f5e] rounded-full transition-all duration-300 shadow-sm shadow-[#ff2a85]"
                    style={{ width: `${hackPercent}%` }}
                  />
                </div>
              </div>

              {/* Credits & Rank Sub-Row */}
              <div className="flex items-center justify-between pt-0.5 text-[10px] font-mono">
                <div className="flex items-center gap-1 text-amber-300 font-bold bg-[#090d18] px-2 py-0.5 rounded-md border border-amber-500/30">
                  <Coins className="w-3 h-3 text-amber-400" />
                  <span>{gameState.stats.credits.toLocaleString()} CR</span>
                </div>
                <span className="text-[#94a3b8] font-cyber text-[9px] hidden sm:inline uppercase">
                  {gameState.stats.rankTitle}
                </span>
              </div>
            </div>
          </div>

          {/* 2. TOP-RIGHT: DIGITAL CLOCK & CIRCULAR CYBER RADAR SCANNER */}
          <div className="flex items-center gap-2">
            {/* Clock & Scanner Box */}
            <div className="flex items-center gap-2.5 bg-[#121626]/95 border-2 border-[#2b334d] p-1.5 sm:p-2 rounded-2xl shadow-2xl backdrop-blur-md">
              {/* Digital Clock Box */}
              <div className="flex flex-col items-center">
                <button
                  onClick={onOpenSchedules}
                  className="bg-[#090d18] border-2 border-[#1e293b] hover:border-[#00f0ff]/60 px-3 py-1.5 rounded-xl shadow-inner text-center cursor-pointer transition-colors group"
                  title="Click to view Neopolis Citizen Daily Schedules"
                >
                  <div className="text-sm sm:text-base font-pixel text-[#00f0ff] tracking-widest neon-text-cyan flex items-center justify-center gap-1 group-hover:scale-105 transition-transform">
                    {formattedTime}
                  </div>
                </button>

                {/* Day / Location Badge */}
                <div className="mt-1 text-center font-pixel text-[8px] sm:text-[9px] text-[#94a3b8] bg-[#090d18] px-2 py-0.5 rounded border border-[#1e293b]">
                  <div className="text-[#38bdf8]">DAY {gameState.day} // D-7</div>
                  <div className="text-[7px] text-[#64748b] truncate max-w-[90px]">ACADEMY PLAZA</div>
                </div>
              </div>

              {/* Circular Cyber Mini-Radar Scanner */}
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#070b14] border-2 border-[#00f0ff] overflow-hidden flex items-center justify-center shadow-lg shadow-[#00f0ff]/20">
                {/* Concentric Grid Rings */}
                <div className="absolute inset-1 rounded-full border border-[#00f0ff]/25" />
                <div className="absolute inset-3 rounded-full border border-[#00f0ff]/20" />
                {/* Crosshairs */}
                <div className="absolute inset-x-0 top-1/2 h-px bg-[#00f0ff]/30" />
                <div className="absolute inset-y-0 left-1/2 w-px bg-[#00f0ff]/30" />

                {/* Rotating Sweep Beam */}
                <div className="absolute inset-0 bg-conic from-transparent via-[#00f0ff]/25 to-transparent animate-spin rounded-full pointer-events-none" />

                {/* Target Blips */}
                <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-[#ff2a85] animate-ping" />
                <div className="absolute bottom-4 left-5 w-1.5 h-1.5 rounded-full bg-[#00f0ff]" />
                <div className="absolute top-5 left-4 w-1.5 h-1.5 rounded-full bg-[#10b981]" />

                {/* Center dot (Player) */}
                <div className="relative w-2 h-2 rounded-full bg-white shadow-sm shadow-white" />
              </div>
            </div>

            {/* Quick Action Navigation Dock */}
            <div className="flex flex-col sm:flex-row items-center gap-1 bg-[#121626]/95 border border-[#2b334d] p-1 rounded-2xl shadow-xl backdrop-blur-md">
              <button
                onClick={onOpenQuests}
                className="p-1.5 hover:bg-slate-800 rounded-xl text-[#00f0ff] hover:text-white transition-colors relative"
                title="Missions & Evolution"
              >
                <Target className="w-4 h-4" />
                {gameState.quests.some(q => q.status === 'active' && q.currentProgress >= q.maxProgress) && (
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                )}
              </button>

              <button
                onClick={onOpenShop}
                className="p-1.5 hover:bg-slate-800 rounded-xl text-amber-400 hover:text-white transition-colors"
                title="Stores & Real Estate"
              >
                <ShoppingBag className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenInventory}
                className="p-1.5 hover:bg-slate-800 rounded-xl text-[#ff2a85] hover:text-white transition-colors"
                title="Inventory & Cosmetics"
              >
                <Package className="w-4 h-4" />
              </button>

              <button
                onClick={onToggleHouseScene}
                className={`p-1.5 rounded-xl transition-all ${
                  gameState.currentScene === 'house'
                    ? 'bg-purple-600 text-white'
                    : 'text-purple-400 hover:bg-slate-800 hover:text-white'
                }`}
                title={gameState.currentScene === 'house' ? 'Go to Academy Plaza' : 'Enter Residence'}
              >
                <Home className="w-4 h-4" />
              </button>

              {gameState.currentScene === 'house' && (
                <button
                  onClick={onToggleDecorate}
                  className={`p-1.5 rounded-xl transition-all ${
                    isDecorateMode ? 'bg-[#00f0ff] text-slate-950 animate-pulse' : 'text-[#00f0ff] hover:bg-slate-800'
                  }`}
                  title="Apartment Decorate Mode"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={onCycleWeather}
                className="p-1.5 hover:bg-slate-800 rounded-xl text-[#38bdf8] hover:text-white transition-colors"
                title={`Weather: ${gameState.weather.replace('_', ' ')}. Click to cycle atmosphere!`}
              >
                {gameState.weather === 'neon_rain' && <CloudRain className="w-4 h-4 text-[#00f0ff]" />}
                {gameState.weather === 'acid_fog' && <CloudFog className="w-4 h-4 text-[#a3e635]" />}
                {gameState.weather === 'glitch_storm' && <Zap className="w-4 h-4 text-[#ff2a85]" />}
                {gameState.weather === 'cyber_clear' && <Sun className="w-4 h-4 text-[#38bdf8]" />}
              </button>

              {onOpenNewsFeed && (
                <button
                  onClick={onOpenNewsFeed}
                  className="p-1.5 hover:bg-slate-800 rounded-xl text-[#00f0ff] hover:text-white transition-colors relative"
                  title="Daily Holo-Net News Feed & World Briefing"
                >
                  <Newspaper className="w-4 h-4" />
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-[#00f0ff] rounded-full animate-ping" />
                </button>
              )}

              {onOpenSchedules && (
                <button
                  onClick={onOpenSchedules}
                  className="p-1.5 hover:bg-slate-800 rounded-xl text-amber-300 hover:text-white transition-colors relative"
                  title="Citizen Schedules & Live Routine Tracker"
                >
                  <Calendar className="w-4 h-4 text-amber-300" />
                </button>
              )}

              <button
                onClick={onToggleMusic}
                className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
                title={gameState.musicEnabled ? 'Mute Music' : 'Play Music'}
              >
                <Music className={`w-4 h-4 ${gameState.musicEnabled ? 'text-[#ff2a85] animate-pulse' : 'text-slate-600'}`} />
              </button>

              {onReturnToMenu && (
                <button
                  onClick={onReturnToMenu}
                  className="p-1.5 hover:bg-rose-950/60 rounded-xl text-rose-400 hover:text-rose-200 border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1 group"
                  title="Voltar ao Menu Principal & Tela Inicial"
                >
                  <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-pixel hidden xl:inline">MENU</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            NEWS TICKER SUB-ROW: SEAMLESSLY POSITIONED BENEATH TOP HUD (NO OVERLAP)
           ========================================================================= */}
        {newsTickerElement && (
          <div className="max-w-7xl mx-auto mt-2 pointer-events-auto">
            {newsTickerElement}
          </div>
        )}
      </header>

      {/* =========================================================================
          3. BOTTOM-CENTER: 7-SLOT PIXEL HOTBAR (DIRECTLY MATCHING REFERENCE IMAGE)
         ========================================================================= */}
      <nav aria-label="Quick Item Hotbar" className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        <div className="flex items-center gap-1.5 sm:gap-2 bg-[#101424]/95 border-2 border-[#2b334d] px-2.5 py-2 rounded-2xl shadow-2xl backdrop-blur-md">
          {[
            {
              id: 'deck',
              label: 'Cyberdeck',
              iconColor: '#ff2a85',
              bgColor: '#1e162d',
              badge: undefined,
              renderIcon: (
                <div className="w-6 h-6 bg-[#ff2a85] rounded-xs border border-[#00f0ff] flex items-center justify-center p-0.5">
                  <div className="w-full h-full bg-[#0f1422] rounded-2xs flex items-center justify-center text-[7px] text-[#00f0ff] font-pixel">
                    DK
                  </div>
                </div>
              ),
            },
            {
              id: 'ram',
              label: 'RAM Slate',
              iconColor: '#00f0ff',
              bgColor: '#0f202f',
              badge: undefined,
              renderIcon: (
                <div className="w-6 h-6 bg-[#00f0ff] rounded-xs border border-white/40 flex items-center justify-center p-0.5">
                  <div className="w-full h-full bg-[#0a1220] rounded-2xs flex flex-col justify-between p-0.5">
                    <div className="w-full h-0.5 bg-[#00f0ff]" />
                    <div className="w-full h-0.5 bg-[#00f0ff]" />
                  </div>
                </div>
              ),
            },
            {
              id: 'medkit',
              label: 'Nanite Kit',
              iconColor: '#ef4444',
              bgColor: '#2a1618',
              badge: '2',
              renderIcon: (
                <div className="w-6 h-6 bg-[#ef4444] rounded-xs border border-white/40 flex items-center justify-center text-white font-bold text-xs">
                  +
                </div>
              ),
            },
            {
              id: 'stim',
              label: 'Neural Stim',
              iconColor: '#ff2a85',
              bgColor: '#271120',
              badge: undefined,
              renderIcon: (
                <div className="w-2.5 h-6 bg-[#ff2a85] rounded-full border border-white/40 flex flex-col items-center justify-center">
                  <div className="w-1.5 h-2 bg-white/70 rounded-full" />
                </div>
              ),
            },
            {
              id: 'syringe',
              label: 'Cryo-Syringe',
              iconColor: '#00f0ff',
              bgColor: '#0c222b',
              badge: undefined,
              renderIcon: (
                <div className="w-2.5 h-6 bg-[#00f0ff] rounded-t-sm border border-white/40 flex flex-col items-center justify-end">
                  <div className="w-1 h-3 bg-white/80" />
                  <div className="w-0.5 h-1.5 bg-[#00f0ff]" />
                </div>
              ),
            },
            {
              id: 'visor',
              label: 'Visor HUD',
              iconColor: '#10b981',
              bgColor: '#0c221a',
              badge: '2',
              renderIcon: (
                <div className="w-6 h-4 bg-[#10b981] rounded-xs border border-white/40 flex items-center justify-around px-0.5">
                  <div className="w-2 h-2 rounded-full bg-[#0f172a]" />
                  <div className="w-2 h-2 rounded-full bg-[#0f172a]" />
                </div>
              ),
            },
            {
              id: 'cable',
              label: 'Fiber Coil',
              iconColor: '#f59e0b',
              bgColor: '#281d0c',
              badge: '2',
              renderIcon: (
                <div className="w-6 h-6 rounded-full border-2 border-[#f59e0b] border-dashed flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                </div>
              ),
            },
          ].map((slot, idx) => {
            const isSelected = activeHotbarIndex === idx;

            return (
              <button
                key={slot.id}
                onClick={() => handleSlotClick(idx)}
                className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? 'border-2 border-[#00f0ff] shadow-lg shadow-[#00f0ff]/40 scale-105 ring-1 ring-white/60'
                    : 'border border-[#2b334d] hover:border-[#00f0ff]/60 hover:scale-102'
                }`}
                style={{ backgroundColor: slot.bgColor }}
                title={`[${idx + 1}] ${slot.label}`}
              >
                {/* Slot Icon */}
                {slot.renderIcon}

                {/* Hotkey number in top-left */}
                <span className="absolute top-0.5 left-1 text-[8px] font-pixel text-slate-400">
                  {idx + 1}
                </span>

                {/* Quantity badge in bottom-right if any */}
                {slot.badge && (
                  <span className="absolute bottom-0.5 right-1 text-[9px] font-pixel text-white bg-black/60 px-1 rounded-xs">
                    {slot.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
