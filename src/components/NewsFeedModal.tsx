import React, { useState, useEffect } from 'react';
import {
  Radio,
  X,
  Newspaper,
  ChevronRight,
  ChevronLeft,
  Zap,
  Coins,
  TrendingUp,
  TrendingDown,
  CloudRain,
  CloudFog,
  Sun,
  ShieldAlert,
  Flame,
  Globe,
  Clock,
  Sparkles,
} from 'lucide-react';
import { NewsStory, DEFAULT_MARKET_TICKERS } from '../data/newsFeed';
import { WeatherType } from '../types/game';
import { sound } from '../utils/audio';

interface NewsFeedModalProps {
  day: number;
  weather: WeatherType;
  stories: NewsStory[];
  onClose: () => void;
  stipendAmount?: number;
}

export const NewsFeedModal: React.FC<NewsFeedModalProps> = ({
  day,
  weather,
  stories,
  onClose,
  stipendAmount = 20,
}) => {
  const [activeStoryIdx, setActiveStoryIdx] = useState<number>(0);
  const currentStory = stories[activeStoryIdx] || stories[0];

  useEffect(() => {
    sound.playNewsBroadcast();
  }, []);

  // Keyboard shortcut: Escape or Space to advance/dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        setActiveStoryIdx(prev => (prev + 1) % stories.length);
        sound.playChirp(1.2);
      } else if (e.key === 'ArrowLeft') {
        setActiveStoryIdx(prev => (prev - 1 + stories.length) % stories.length);
        sound.playChirp(0.9);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stories.length, onClose]);

  const handleNextStory = () => {
    sound.playChirp(1.2);
    setActiveStoryIdx(prev => (prev + 1) % stories.length);
  };

  const handlePrevStory = () => {
    sound.playChirp(0.9);
    setActiveStoryIdx(prev => (prev - 1 + stories.length) % stories.length);
  };

  const getWeatherDisplay = () => {
    switch (weather) {
      case 'neon_rain':
        return { label: 'Neon Rain', icon: <CloudRain className="w-3.5 h-3.5 text-[#00f0ff]" />, color: 'text-[#00f0ff]' };
      case 'acid_fog':
        return { label: 'Acid Fog', icon: <CloudFog className="w-3.5 h-3.5 text-[#a3e635]" />, color: 'text-[#a3e635]' };
      case 'glitch_storm':
        return { label: 'Glitch Storm', icon: <Zap className="w-3.5 h-3.5 text-[#ff2a85]" />, color: 'text-[#ff2a85]' };
      case 'cyber_clear':
      default:
        return { label: 'Cyber Clear', icon: <Sun className="w-3.5 h-3.5 text-[#38bdf8]" />, color: 'text-[#38bdf8]' };
    }
  };

  const weatherInfo = getWeatherDisplay();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      {/* Outer Hologram Container */}
      <div className="relative w-full max-w-2xl bg-[#0b0f1a] border-2 border-[#00f0ff]/60 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.25)] flex flex-col max-h-[92vh] overflow-hidden text-slate-200">
        
        {/* CRT Scanline & Grid Effect */}
        <div className="absolute inset-0 bg-[radial-gradient(#00f0ff_1px,transparent_1px)] [background-size:24px_24px] opacity-5 pointer-events-none" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-[#00f0ff]/5 to-transparent pointer-events-none opacity-40 animate-pulse" />

        {/* Decorative Cyber Corner Brackets */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#00f0ff] pointer-events-none" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#00f0ff] pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#00f0ff] pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#00f0ff] pointer-events-none" />

        {/* =========================================================================
            HEADER: Broadcast Brand & Day Time Stamp
           ========================================================================= */}
        <div className="relative z-10 px-5 pt-4 pb-3 border-b border-[#1e293b] bg-[#0f1424]/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative p-2 bg-[#ff2a85]/15 border border-[#ff2a85]/40 rounded-xl text-[#ff2a85]">
              <Radio className="w-5 h-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#00f0ff] rounded-full animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-widest text-[#00f0ff] uppercase">
                  NEO-CITY HOLO-WIRE // MORNING EDITION
                </span>
                <span className="px-1.5 py-0.2 bg-[#ff2a85]/20 border border-[#ff2a85]/40 rounded text-[9px] font-mono text-[#ff2a85] font-bold">
                  LIVE FEED
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                <span className="text-[#38bdf8] font-bold">DAY {day}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  08:00 AM REBOOT
                </span>
                <span>•</span>
                <span className={`flex items-center gap-1 font-semibold ${weatherInfo.color}`}>
                  {weatherInfo.icon}
                  {weatherInfo.label}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-700"
            title="Dismiss Morning Briefing"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* =========================================================================
            MORNING REBOOT NOTIFICATION (Energy Restored & Daily Stipend)
           ========================================================================= */}
        <div className="relative z-10 mx-5 mt-3 p-2.5 rounded-xl bg-linear-to-r from-[#0284c7]/20 via-[#00f0ff]/10 to-[#9333ea]/20 border border-[#00f0ff]/30 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Zap className="w-3.5 h-3.5 fill-emerald-400" />
            </div>
            <div>
              <span className="font-cyber font-bold text-emerald-300">Bio-Metrics 100% Restored</span>
              <span className="text-slate-400 text-[10px] block">Full night sleep recharged nanite batteries</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Coins className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-mono font-bold text-amber-300">+{stipendAmount} CR Morning Stipend</span>
              <span className="text-slate-400 text-[10px] block">Credited to your net-wallet</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            NEWS STORY WIRE SELECTOR TABS
           ========================================================================= */}
        <div className="relative z-10 px-5 pt-3 pb-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {stories.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => {
                sound.playChirp(1 + idx * 0.1);
                setActiveStoryIdx(idx);
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider font-bold transition-all flex items-center gap-1.5 whitespace-nowrap border ${
                idx === activeStoryIdx
                  ? 'bg-[#00f0ff]/20 text-[#00f0ff] border-[#00f0ff] shadow-sm shadow-[#00f0ff]/30'
                  : 'bg-[#121626] text-slate-400 border-[#2b334d] hover:text-white hover:border-slate-500'
              }`}
            >
              <span>{`[0${idx + 1}]`}</span>
              <span>{s.category}</span>
              {s.urgency === 'BREAKING' && (
                <span className="w-1.5 h-1.5 bg-[#ff2a85] rounded-full animate-ping" />
              )}
            </button>
          ))}
        </div>

        {/* =========================================================================
            MAIN ARTICLE DISPLAY
           ========================================================================= */}
        <div className="relative z-10 flex-1 px-5 py-3 overflow-y-auto space-y-3.5">
          {/* Urgency & Category Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border ${
                  currentStory.urgency === 'BREAKING'
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                    : currentStory.urgency === 'ALERT'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                }`}
              >
                {currentStory.urgency}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-[10px] font-mono text-slate-300">
                {currentStory.category}
              </span>
              <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                <Globe className="w-3 h-3 text-slate-500" />
                {currentStory.district}
              </span>
            </div>

            <div className="text-[10px] font-mono text-slate-400 italic">
              {currentStory.source}
            </div>
          </div>

          {/* Headline */}
          <div className="p-3.5 rounded-xl bg-[#101424] border border-[#2b334d]/80 relative overflow-hidden shadow-inner">
            <div
              className="absolute left-0 top-0 bottom-0 w-1.5"
              style={{ backgroundColor: currentStory.accentColor || '#00f0ff' }}
            />
            <h2 className="text-base sm:text-lg font-black font-cyber text-white tracking-wide leading-snug">
              {currentStory.headline}
            </h2>
            <p className="mt-1.5 text-xs text-slate-300 font-sans leading-relaxed border-t border-[#1e293b] pt-2">
              {currentStory.subhead}
            </p>
          </div>

          {/* Body Article */}
          <div className="p-3.5 rounded-xl bg-[#0d111e]/90 border border-[#1e293b] text-xs text-slate-300 leading-relaxed font-sans">
            <p className="whitespace-pre-line">{currentStory.body}</p>

            {/* Street Intel / Survival Flavor Tip */}
            {currentStory.flavorTip && (
              <div className="mt-3 pt-2.5 border-t border-[#1e293b] flex items-start gap-2 text-[11px] text-[#38bdf8]">
                <Sparkles className="w-3.5 h-3.5 text-[#00f0ff] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#00f0ff] uppercase tracking-wide font-mono">
                    Holo-Wire Intel:
                  </span>{' '}
                  <span className="text-slate-300">{currentStory.flavorTip}</span>
                </div>
              </div>
            )}
          </div>

          {/* Story Specific Market Quotes */}
          {currentStory.marketTicker && currentStory.marketTicker.length > 0 && (
            <div className="flex items-center gap-2 text-[11px] font-mono">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                Related Stocks:
              </span>
              {currentStory.marketTicker.map((tick, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded bg-[#101424] border ${
                    tick.positive ? 'border-emerald-500/30 text-emerald-400' : 'border-rose-500/30 text-rose-400'
                  }`}
                >
                  <span className="text-slate-300">{tick.symbol}</span>
                  {tick.positive ? (
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-rose-400" />
                  )}
                  <span className="font-bold">{tick.change}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* =========================================================================
            FINANCIAL INDEX TICKER TAPE (Continuous Marquee)
           ========================================================================= */}
        <div className="relative z-10 bg-[#070a12] border-y border-[#1e293b] py-1.5 px-3 overflow-hidden">
          <div className="flex items-center gap-4 text-[10px] font-mono whitespace-nowrap overflow-x-auto no-scrollbar">
            <span className="text-[#00f0ff] font-bold shrink-0 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-ping" />
              NEO-MARKET INDEX:
            </span>
            {DEFAULT_MARKET_TICKERS.map((t, idx) => (
              <div key={idx} className="flex items-center gap-1 shrink-0 text-slate-300">
                <span className="font-semibold text-slate-400">{t.symbol}</span>
                <span>{t.price}</span>
                <span
                  className={`font-bold flex items-center ${
                    t.positive ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {t.positive ? '▲' : '▼'} {t.change}
                </span>
                <span className="text-slate-700 mx-1">|</span>
              </div>
            ))}
          </div>
        </div>

        {/* =========================================================================
            FOOTER CONTROLS
           ========================================================================= */}
        <div className="relative z-10 px-5 py-3 border-t border-[#1e293b] bg-[#0f1424]/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevStory}
              className="px-2.5 py-1.5 rounded-xl bg-[#121626] border border-[#2b334d] hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition-colors flex items-center gap-1"
              title="Previous Story (Left Arrow)"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>
            <span className="text-[10px] font-mono text-slate-400">
              Story {activeStoryIdx + 1} / {stories.length}
            </span>
            <button
              onClick={handleNextStory}
              className="px-2.5 py-1.5 rounded-xl bg-[#121626] border border-[#2b334d] hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition-colors flex items-center gap-1"
              title="Next Story (Right Arrow)"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-linear-to-r from-[#00f0ff] to-[#38bdf8] hover:from-[#38bdf8] hover:to-[#00f0ff] text-slate-950 font-cyber font-bold text-xs tracking-wider uppercase transition-all shadow-md shadow-[#00f0ff]/30 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Step Into Neo-City (Dismiss)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
