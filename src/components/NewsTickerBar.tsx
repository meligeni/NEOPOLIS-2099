import React, { useState, useEffect } from 'react';
import { Radio, Newspaper, ChevronRight, X, Sparkles } from 'lucide-react';
import { NewsStory } from '../data/newsFeed';
import { sound } from '../utils/audio';

interface NewsTickerBarProps {
  stories: NewsStory[];
  day: number;
  onOpenFullNews: () => void;
}

export const NewsTickerBar: React.FC<NewsTickerBarProps> = ({
  stories,
  day,
  onOpenFullNews,
}) => {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(true);

  // Cycle headline every 9 seconds
  useEffect(() => {
    if (!stories || stories.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % stories.length);
    }, 9000);
    return () => clearInterval(interval);
  }, [stories]);

  if (!isVisible || !stories || stories.length === 0) return null;

  const activeStory = stories[currentIdx] || stories[0];

  return (
    <div className="w-full bg-[#0d1120]/95 border-2 border-[#2b334d] rounded-2xl shadow-2xl backdrop-blur-md px-3.5 py-1.5 text-xs select-none z-20 transition-all flex items-center justify-between gap-3 text-slate-300">
      {/* Clickable Main Ticker Headline */}
      <button
        onClick={() => {
          sound.playChirp(1.1);
          onOpenFullNews();
        }}
        className="flex-1 flex items-center gap-2 overflow-hidden text-left group hover:opacity-95 transition-opacity"
        title="Click to open full Neo-City News Feed broadcast"
      >
        {/* Live Indicator */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#ff2a85]/15 border border-[#ff2a85]/40 text-[#ff2a85] text-[10px] font-mono font-bold shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff2a85] animate-ping" />
          <span>WIRE</span>
        </div>

        {/* Day tag */}
        <span className="text-[10px] font-mono text-[#38bdf8] font-bold shrink-0 hidden sm:inline">
          DAY {day}
        </span>

        {/* Category Pill */}
        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[9px] font-mono text-slate-300 shrink-0 border border-slate-700">
          {activeStory.category}
        </span>

        {/* Headline text with truncation */}
        <div className="truncate font-sans text-xs text-white group-hover:text-[#00f0ff] transition-colors flex items-center gap-1.5">
          <span className="font-bold">{activeStory.headline}</span>
          <span className="text-slate-400 hidden md:inline text-[11px]">— {activeStory.subhead}</span>
        </div>

        <ChevronRight className="w-3.5 h-3.5 text-[#00f0ff] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </button>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => {
            sound.playChirp(1.2);
            onOpenFullNews();
          }}
          className="px-2 py-0.5 rounded bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 text-[10px] font-mono font-semibold transition-colors flex items-center gap-1"
        >
          <Newspaper className="w-3 h-3" />
          <span className="hidden sm:inline">Full Wire</span>
        </button>

        <button
          onClick={() => setIsVisible(false)}
          className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300 transition-colors"
          title="Dismiss ticker for today"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
