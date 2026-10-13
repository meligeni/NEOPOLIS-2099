import React from 'react';
import { Target, Award, CheckCircle2, CircleDot, ChevronRight, X, Coins, Sparkles, Zap } from 'lucide-react';
import { Quest, PlayerStats } from '../types/game';
import { sound } from '../utils/audio';

interface QuestsModalProps {
  quests: Quest[];
  stats: PlayerStats;
  onClose: () => void;
  onCompleteQuest: (questId: string) => void;
}

const RANKS = [
  { level: 1, title: 'Scrap Rat', desc: 'Newcomer in the gutters of Neopolis.' },
  { level: 2, title: 'Script Kiddie', desc: 'Can crack standard security matrices.' },
  { level: 3, title: 'Neon Runner', desc: 'Respected operative in District 7.' },
  { level: 4, title: 'Chrome Legend', desc: 'Feared and renowed across high-spire mega-corps.' },
  { level: 5, title: 'Cyber Overlord', desc: 'Owns sky-penthouses and dictates city datastreams.' },
];

export const QuestsModal: React.FC<QuestsModalProps> = ({
  quests,
  stats,
  onClose,
  onCompleteQuest,
}) => {
  const activeQuests = quests.filter(q => q.status === 'active');
  const availableQuests = quests.filter(q => q.status === 'available');
  const completedQuests = quests.filter(q => q.status === 'completed');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-3xl bg-slate-950 border-2 border-cyan-500/80 rounded-2xl shadow-2xl p-6 text-slate-100 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/20 border border-cyan-400 rounded-xl">
              <Target className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-cyber text-cyan-300">
                MISSION LOG & RUNNER EVOLUTION
              </h2>
              <p className="text-xs text-slate-400">
                Complete contracts to raise your street rank, evolve skills, and unlock districts.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Runner Rank Evolution Banner */}
        <div className="bg-slate-900 border border-purple-500/40 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              <span className="text-xs font-bold font-pixel text-purple-300">
                CURRENT RANK: {stats.rankTitle.toUpperCase()} (LVL {stats.level})
              </span>
            </div>
            <div className="text-xs font-mono text-cyan-300">
              EXP: {stats.exp} / {stats.maxExp}
            </div>
          </div>

          {/* EXP Bar */}
          <div className="w-full h-2.5 bg-slate-950 rounded-full border border-purple-500/30 overflow-hidden mb-3">
            <div
              className="h-full bg-linear-to-r from-purple-500 via-pink-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${Math.min(100, (stats.exp / stats.maxExp) * 100)}%` }}
            />
          </div>

          {/* Ranks Steps */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-center">
            {RANKS.map((r, i) => {
              const reached = stats.level >= r.level;
              return (
                <div
                  key={i}
                  className={`p-1.5 rounded-lg border text-[10px] font-cyber ${
                    reached
                      ? 'bg-purple-950/70 border-purple-400 text-purple-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="font-bold">{r.title}</div>
                  <div className="font-mono text-[9px] text-slate-400">Lvl {r.level}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quests List */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {/* Active Quests */}
          <div>
            <h3 className="text-xs font-bold font-pixel text-cyan-400 uppercase mb-2 flex items-center gap-1.5">
              <CircleDot className="w-4 h-4 text-cyan-400 animate-pulse" />
              Active Contracts ({activeQuests.length})
            </h3>

            {activeQuests.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-900/50 rounded-xl">
                No active contracts. Speak to Dex, Nyx, or Madame Vane in District 7!
              </p>
            ) : (
              activeQuests.map(q => {
                const isReady = q.currentProgress >= q.maxProgress;

                return (
                  <div
                    key={q.id}
                    className="p-3.5 bg-slate-900 border border-cyan-500/40 rounded-xl flex items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-cyan-200 font-cyber">{q.title}</span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                          {q.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mb-2">{q.description}</p>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="text-amber-400 flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5" /> +{q.rewardCredits} CR
                        </span>
                        <span className="text-purple-400 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5" /> +{q.rewardExp} EXP
                        </span>
                        {q.rewardItemName && (
                          <span className="text-pink-400 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" /> {q.rewardItemName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      {isReady ? (
                        <button
                          onClick={() => {
                            sound.playLevelUp();
                            onCompleteQuest(q.id);
                          }}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs font-cyber shadow-lg shadow-emerald-500/40 animate-bounce"
                        >
                          Complete!
                        </button>
                      ) : (
                        <div className="text-right">
                          <div className="text-[11px] font-mono text-cyan-300">
                            Progress: {q.currentProgress} / {q.maxProgress}
                          </div>
                          <span className="text-[10px] text-slate-400">In Progress</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Completed Quests */}
          {completedQuests.length > 0 && (
            <div className="pt-2">
              <h3 className="text-xs font-bold font-pixel text-emerald-400 uppercase mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Completed Contracts ({completedQuests.length})
              </h3>
              <div className="space-y-2">
                {completedQuests.map(q => (
                  <div
                    key={q.id}
                    className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between text-xs opacity-75"
                  >
                    <span className="line-through text-slate-400 font-cyber">{q.title}</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      +{q.rewardCredits} CR Rewarded
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
