import React, { useState } from 'react';
import {
  X,
  Clock,
  MapPin,
  Calendar,
  Sparkles,
  Heart,
  Briefcase,
  Utensils,
  Moon,
  Coffee,
  Wrench,
  BookOpen,
  Compass,
  Building2,
  ChevronRight,
  Radio,
} from 'lucide-react';
import { GameState, NPC, NPCScheduleSlot } from '../types/game';
import { getNPCScheduleForHour } from '../data/gameData';
import { sound } from '../utils/audio';

interface CityScheduleModalProps {
  gameState: GameState;
  onClose: () => void;
  onSelectNPCToTrack?: (npcId: string) => void;
}

export const CityScheduleModal: React.FC<CityScheduleModalProps> = ({
  gameState,
  onClose,
  onSelectNPCToTrack,
}) => {
  const [selectedNPCId, setSelectedNPCId] = useState<string>('dex');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening' | 'night'>('all');

  const formattedTime = `${String(gameState.timeHour).padStart(2, '0')}:${String(gameState.timeMinute).padStart(2, '0')}`;

  const getTimePeriod = (hour: number) => {
    if (hour >= 5 && hour < 12) return { label: 'Morning Shift', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
    if (hour >= 12 && hour < 18) return { label: 'Afternoon Rush', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' };
    if (hour >= 18 && hour < 23) return { label: 'Evening Promenade', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/30' };
    return { label: 'Night Cycle', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' };
  };

  const currentPeriod = getTimePeriod(gameState.timeHour);

  const getActivityIcon = (type: NPCScheduleSlot['activityIcon']) => {
    switch (type) {
      case 'work':
        return <Wrench className="w-3.5 h-3.5 text-amber-400" />;
      case 'eat':
        return <Utensils className="w-3.5 h-3.5 text-rose-400" />;
      case 'study':
        return <BookOpen className="w-3.5 h-3.5 text-cyan-400" />;
      case 'relax':
        return <Coffee className="w-3.5 h-3.5 text-emerald-400" />;
      case 'rest':
        return <Moon className="w-3.5 h-3.5 text-purple-400" />;
      case 'commute':
        return <Compass className="w-3.5 h-3.5 text-sky-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  const npcsList = Object.values(gameState.npcs);
  const selectedNPC = gameState.npcs[selectedNPCId] || npcsList[0];
  const activeSlot = selectedNPC ? getNPCScheduleForHour(selectedNPC, gameState.timeHour) : undefined;

  return (
    <div
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5"
    >
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border-2 border-cyan-500/70 rounded-2xl shadow-2xl shadow-cyan-950/60 text-slate-100 overflow-hidden font-cyber">
        {/* Holographic Header Bar */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 px-5 py-3.5 bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-inner">
              <Calendar className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-cyan-300 tracking-wider">
                  NEO-CITY CITIZEN SCHEDULE DIRECTORY
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-mono tracking-wider rounded border border-emerald-400/40 text-emerald-300 bg-emerald-950/40">
                  LIVE TRACKING
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Hourly movements, work shifts, leisure routines, and real-time locations across Neopolis
              </p>
            </div>
          </div>

          {/* Current In-game Time Badge */}
          <div className="flex items-center gap-3">
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl border ${currentPeriod.bg}`}>
              <Clock className={`w-4 h-4 ${currentPeriod.color}`} />
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-white">{formattedTime}</div>
                <div className={`text-[10px] font-mono uppercase ${currentPeriod.color}`}>{currentPeriod.label}</div>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playChirp(0.9);
                onClose();
              }}
              className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-cyan-500/20">
          {/* Left Column: NPC Selector Sidebar (4 Cols) */}
          <div className="lg:col-span-4 p-3 sm:p-4 bg-slate-950/60 overflow-y-auto max-h-[35vh] lg:max-h-[calc(92vh-75px)]">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
              <span>Key Neopolis Citizens</span>
              <span className="text-cyan-400">{npcsList.length} Active</span>
            </div>

            <div className="space-y-2">
              {npcsList.map(npc => {
                const isSelected = npc.id === selectedNPCId;
                const slot = getNPCScheduleForHour(npc, gameState.timeHour);

                return (
                  <button
                    key={npc.id}
                    onClick={() => {
                      sound.playChirp(1.1);
                      setSelectedNPCId(npc.id);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 relative overflow-hidden ${
                      isSelected
                        ? 'bg-cyan-950/50 border-cyan-400 shadow-md shadow-cyan-900/30 text-white'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    {/* Active accent strip */}
                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400" />}

                    {/* NPC Portrait */}
                    <div
                      className="w-11 h-11 rounded-lg border-2 flex-shrink-0 flex items-center justify-center relative overflow-hidden"
                      style={{
                        borderColor: isSelected ? '#00f0ff' : npc.portraitColor,
                        backgroundColor: '#0a0e17',
                      }}
                    >
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: npc.portraitColor }}
                      />
                      <div
                        className="absolute top-1 left-1.5 w-4 h-2 rounded"
                        style={{ backgroundColor: npc.avatarStyle.hair }}
                      />
                    </div>

                    {/* NPC Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-bold truncate ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                          {npc.name}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {[0, 1, 2, 3, 4].map(idx => (
                            <Heart
                              key={idx}
                              className={`w-2.5 h-2.5 ${
                                idx < npc.affinity ? 'text-pink-500 fill-pink-500' : 'text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 truncate">{npc.role}</div>

                      {/* Current location pill */}
                      {slot && (
                        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-cyan-400/90 font-mono">
                          <MapPin className="w-3 h-3 flex-shrink-0 text-cyan-400" />
                          <span className="truncate">{slot.locationName}</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick World Tip */}
            <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-cyan-400 mb-1">
                <Radio className="w-3.5 h-3.5" />
                <span>Urban Movement System</span>
              </div>
              Citizens walk along pedestrian walkways when commuting between shifts. Look for them crossing Central Avenue and District boulevards!
            </div>
          </div>

          {/* Right Column: Selected NPC Daily Routine & Live Tracker (8 Cols) */}
          <div className="lg:col-span-8 p-4 sm:p-6 overflow-y-auto max-h-[55vh] lg:max-h-[calc(92vh-75px)] flex flex-col gap-5">
            {/* Active Citizen Overview Card */}
            {selectedNPC && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-slate-950/90 border border-cyan-500/40 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-14 h-14 rounded-xl border-2 flex items-center justify-center relative shadow-lg overflow-hidden flex-shrink-0"
                      style={{
                        borderColor: selectedNPC.portraitColor,
                        backgroundColor: '#050811',
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-full"
                        style={{ backgroundColor: selectedNPC.portraitColor }}
                      />
                      <div
                        className="absolute top-1 left-2 w-5 h-2.5 rounded"
                        style={{ backgroundColor: selectedNPC.avatarStyle.hair }}
                      />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-cyan-300">{selectedNPC.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="text-slate-300">{selectedNPC.role}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-pink-400 flex items-center gap-1">
                          <Heart className="w-3 h-3 fill-pink-500" />
                          Affinity {selectedNPC.affinity}/5
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Real-time Coordinate & Status Badge */}
                  {activeSlot && (
                    <div className="bg-slate-950/80 border border-cyan-500/30 rounded-xl px-3.5 py-2 text-right">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 justify-end">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        ACTIVE COORDINATES
                      </div>
                      <div className="text-sm font-mono font-bold text-white mt-0.5">
                        Tile [{activeSlot.x}, {activeSlot.y}]
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">{activeSlot.district}</div>
                    </div>
                  )}
                </div>

                {/* Current Active Shift Banner */}
                {activeSlot && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-500/40">
                        {getActivityIcon(activeSlot.activityIcon)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-cyan-200">
                          Current Activity: <span className="text-white font-normal">{activeSlot.activity}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          <span>{activeSlot.locationName}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-cyan-400 font-mono">Shift: {activeSlot.timeLabel}</span>
                        </div>
                      </div>
                    </div>

                    {/* Ambient live quote */}
                    {activeSlot.contextDialogue.length > 0 && (
                      <div className="text-[11px] italic text-slate-300 bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-lg max-w-sm">
                        "{activeSlot.contextDialogue[0]}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Timeline Filter Tabs */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>24-Hour Routine Schedule</span>
              </div>

              <div className="flex items-center gap-1">
                {(['all', 'morning', 'afternoon', 'evening', 'night'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => {
                      sound.playChirp(1.0);
                      setSelectedFilter(filter);
                    }}
                    className={`px-2.5 py-1 text-[11px] font-mono uppercase rounded-lg transition-all ${
                      selectedFilter === filter
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule Slot Cards List */}
            {selectedNPC?.schedule && (
              <div className="space-y-3">
                {selectedNPC.schedule
                  .filter(slot => selectedFilter === 'all' || slot.period === selectedFilter)
                  .map((slot, index) => {
                    const isCurrentSlot =
                      slot.startHour <= slot.endHour
                        ? gameState.timeHour >= slot.startHour && gameState.timeHour < slot.endHour
                        : gameState.timeHour >= slot.startHour || gameState.timeHour < slot.endHour;

                    return (
                      <div
                        key={index}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden ${
                          isCurrentSlot
                            ? 'bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-950/50'
                            : 'bg-slate-950/50 border-slate-800 hover:border-slate-700/80'
                        }`}
                      >
                        {/* Current slot glow bar */}
                        {isCurrentSlot && (
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-cyan-400 to-pink-500" />
                        )}

                        <div className="flex items-start sm:items-center gap-3">
                          {/* Time tag & icon */}
                          <div
                            className={`p-2 rounded-xl border flex flex-col items-center justify-center flex-shrink-0 min-w-[68px] ${
                              isCurrentSlot
                                ? 'bg-cyan-900/50 border-cyan-400 text-cyan-300'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            <div className="mb-0.5">{getActivityIcon(slot.activityIcon)}</div>
                            <span className="text-[11px] font-mono font-bold">{slot.timeLabel}</span>
                          </div>

                          {/* Location & Activity Description */}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">{slot.locationName}</span>
                              {isCurrentSlot && (
                                <span className="px-2 py-0.5 text-[9px] font-mono uppercase bg-cyan-400 text-slate-950 font-bold rounded-full">
                                  CURRENT TIME SLOT
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-300 mt-0.5">{slot.activity}</p>

                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-1">
                              <Building2 className="w-3 h-3 text-cyan-400" />
                              <span>{slot.district}</span>
                              <span className="text-slate-600">•</span>
                              <span className="text-cyan-400">Coords: [{slot.x}, {slot.y}]</span>
                            </div>
                          </div>
                        </div>

                        {/* Dialogue Sample */}
                        {slot.contextDialogue.length > 0 && (
                          <div className="sm:max-w-xs text-[11px] italic text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                            "{slot.contextDialogue[0]}"
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-cyan-500/30 px-5 py-3 bg-slate-950 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Time flows at 5 in-game minutes every 4.5 real seconds.</span>
          </div>

          <button
            onClick={() => {
              sound.playChirp(0.9);
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-300 hover:bg-cyan-500/30 font-cyber transition-all"
          >
            Close Directory [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
