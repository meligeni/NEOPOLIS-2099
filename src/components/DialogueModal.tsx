import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, Briefcase, ShoppingBag, Gift, X, Calendar, Clock, MapPin, Wrench, Utensils, BookOpen, Coffee, Moon, Compass } from 'lucide-react';
import { NPC, Quest, InventoryItem, NPCScheduleSlot } from '../types/game';
import { getNPCScheduleForHour } from '../data/gameData';
import { sound } from '../utils/audio';

interface DialogueModalProps {
  npc: NPC;
  quests: Quest[];
  inventory: InventoryItem[];
  currentTimeHour?: number;
  onClose: () => void;
  onAcceptQuest: (questId: string) => void;
  onCompleteQuest: (questId: string) => void;
  onOpenShop: (shopType: string) => void;
  onGiveGift: (item: InventoryItem) => void;
  onEarnCredits: (amount: number, reason: string) => void;
}

export const DialogueModal: React.FC<DialogueModalProps> = ({
  npc,
  quests,
  inventory,
  currentTimeHour = 12,
  onClose,
  onAcceptQuest,
  onCompleteQuest,
  onOpenShop,
  onGiveGift,
  onEarnCredits,
}) => {
  const currentSlot = getNPCScheduleForHour(npc, currentTimeHour);
  const initialDialogue = currentSlot?.contextDialogue?.[0] || npc.dialogueLines[0] || 'Hello runner.';

  const [displayText, setDisplayText] = useState('');
  const [fullText, setFullText] = useState(initialDialogue);
  const [showGiftSelector, setShowGiftSelector] = useState(false);
  const [showScheduleDrawer, setShowScheduleDrawer] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  // Find quests related to this NPC
  const availableQuest = quests.find(q => q.giverId === npc.id && q.status === 'available');
  const activeQuest = quests.find(q => q.giverId === npc.id && q.status === 'active');
  const canCompleteQuest = activeQuest && activeQuest.currentProgress >= activeQuest.maxProgress;

  // Typewriter effect
  useEffect(() => {
    let i = 0;
    setDisplayText('');
    const timer = setInterval(() => {
      if (i < fullText.length) {
        setDisplayText(prev => prev + fullText.charAt(i));
        if (i % 2 === 0) {
          sound.playChirp(0.9 + (i % 5) * 0.1);
        }
        i++;
      } else {
        clearInterval(timer);
      }
    }, 25);
    return () => clearInterval(timer);
  }, [fullText]);

  const handleAskGig = () => {
    if (availableQuest) {
      setFullText(`I have a job for you: "${availableQuest.title}". ${availableQuest.description} Reward is ${availableQuest.rewardCredits} Credits.`);
    } else if (activeQuest) {
      setFullText(`How is progress on "${activeQuest.title}"? Keep at it!`);
    } else {
      setFullText('No new contracts right now, but keeping the streets clean always earns rep. Here is a 25 Credit tip for checking in!');
      if (!rewardClaimed) {
        onEarnCredits(25, 'Street Tip from ' + npc.name);
        setRewardClaimed(true);
      }
    }
  };

  const handleGiftItem = (item: InventoryItem) => {
    onGiveGift(item);
    setShowGiftSelector(false);
    setFullText(`Whoa, a ${item.name}?! You really know how to treat a runner right. Thank you!`);
    sound.playCredit();
  };

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-4"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-cyan-500/70 rounded-2xl shadow-2xl p-6 text-slate-100 overflow-hidden">
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl border-2 border-cyan-400 bg-slate-950 flex items-center justify-center shadow-lg relative overflow-hidden">
              {/* Pixel Avatar Representation */}
              <div
                className="w-7 h-7 rounded-full"
                style={{ backgroundColor: npc.portraitColor }}
              />
              <div
                className="absolute top-1 left-2 w-4 h-2 rounded"
                style={{ backgroundColor: npc.avatarStyle.hair }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-cyber text-cyan-300">{npc.name}</h2>
                {npc.schedule && (
                  <button
                    onClick={() => {
                      sound.playChirp(1.0);
                      setShowScheduleDrawer(!showScheduleDrawer);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase flex items-center gap-1 border transition-colors ${
                      showScheduleDrawer
                        ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-cyan-500'
                    }`}
                  >
                    <Calendar className="w-3 h-3 text-cyan-400" />
                    <span>Daily Schedule</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                <span>{npc.role}</span>
                <span className="text-slate-600">•</span>
                <span className="text-cyan-400/90">{currentSlot ? currentSlot.locationName : npc.locationName}</span>
              </p>
              {currentSlot && (
                <div className="mt-1 text-[11px] text-amber-300/90 flex items-center gap-1.5 font-mono">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>Now: {currentSlot.activity}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Affinity Hearts */}
            <div className="flex items-center gap-1 bg-slate-950/80 px-2.5 py-1 rounded-full border border-pink-500/30">
              {[0, 1, 2, 3, 4].map(idx => (
                <Heart
                  key={idx}
                  className={`w-3.5 h-3.5 transition-colors ${
                    idx < npc.affinity ? 'text-pink-500 fill-pink-500 animate-pulse' : 'text-slate-700'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Schedule Routine Drawer (when opened) */}
        {showScheduleDrawer && npc.schedule && (
          <div className="mb-4 p-3 bg-slate-950 border border-cyan-500/40 rounded-xl space-y-2 max-h-48 overflow-y-auto">
            <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-300 flex items-center justify-between">
              <span>{npc.name} • 24-Hour Schedule Routine</span>
              <span className="text-slate-400">Hour {String(currentTimeHour).padStart(2, '0')}:00</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {npc.schedule.map((slot, idx) => {
                const isCurrent =
                  slot.startHour <= slot.endHour
                    ? currentTimeHour >= slot.startHour && currentTimeHour < slot.endHour
                    : currentTimeHour >= slot.startHour || currentTimeHour < slot.endHour;

                return (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg border text-xs flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-cyan-950/60 border-cyan-400 text-white'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-cyan-400">{slot.timeLabel}</span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.2 bg-cyan-400 text-slate-950 rounded text-[9px] font-bold">
                          NOW
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-slate-200 mt-1 truncate">{slot.locationName}</div>
                    <div className="text-[10px] text-slate-400 truncate">{slot.activity}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dialogue Box Text */}
        <div className="bg-slate-950/90 border border-cyan-500/40 rounded-xl p-4 min-h-[90px] mb-4 text-sm font-cyber leading-relaxed text-slate-200">
          <p>{displayText}</p>
        </div>

        {/* Quests Available Notice */}
        {availableQuest && (
          <div className="mb-4 p-3 bg-cyan-950/50 border border-cyan-400/50 rounded-lg flex items-center justify-between">
            <div className="text-xs">
              <span className="font-bold text-cyan-300 uppercase tracking-wide">New Mission:</span>{' '}
              <span className="text-slate-200">{availableQuest.title}</span>
              <span className="ml-2 text-amber-400 font-mono">+{availableQuest.rewardCredits} Credits</span>
            </div>
            <button
              onClick={() => {
                onAcceptQuest(availableQuest.id);
                setFullText(`Contract accepted: ${availableQuest.title}. Get it done, runner!`);
              }}
              className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded text-xs transition-colors"
            >
              Accept Gig
            </button>
          </div>
        )}

        {/* Turn in completed quest */}
        {canCompleteQuest && (
          <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-400 rounded-lg flex items-center justify-between animate-pulse">
            <div className="text-xs">
              <span className="font-bold text-emerald-300 uppercase tracking-wide">Mission Complete!</span>{' '}
              <span className="text-slate-200">{activeQuest.title}</span>
            </div>
            <button
              onClick={() => {
                onCompleteQuest(activeQuest.id);
                setFullText(`Outstanding work! Here are your ${activeQuest.rewardCredits} Credits!`);
              }}
              className="px-4 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded text-xs shadow-lg shadow-emerald-500/40 transition-colors"
            >
              Claim Reward (+{activeQuest.rewardCredits} CR)
            </button>
          </div>
        )}

        {/* Dialogue Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs font-semibold">
          <button
            onClick={() => {
              const allLines = [
                ...(currentSlot?.contextDialogue || []),
                ...npc.dialogueLines,
              ];
              const randomLine = allLines[Math.floor(Math.random() * allLines.length)];
              setFullText(randomLine);
              onEarnCredits(10, 'Chat with ' + npc.name);
            }}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-800 hover:bg-cyan-900/60 border border-slate-700 hover:border-cyan-500 rounded-lg transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <span>Chat (+10 CR)</span>
          </button>

          <button
            onClick={handleAskGig}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-800 hover:bg-amber-900/50 border border-slate-700 hover:border-amber-500 rounded-lg transition-colors"
          >
            <Briefcase className="w-4 h-4 text-amber-400" />
            <span>Ask for Gigs</span>
          </button>

          <button
            onClick={() => onOpenShop(npc.id)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-800 hover:bg-pink-900/50 border border-slate-700 hover:border-pink-500 rounded-lg transition-colors"
          >
            <ShoppingBag className="w-4 h-4 text-pink-400" />
            <span>Browse Shop</span>
          </button>

          <button
            onClick={() => setShowGiftSelector(!showGiftSelector)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-800 hover:bg-purple-900/50 border border-slate-700 hover:border-purple-500 rounded-lg transition-colors"
          >
            <Gift className="w-4 h-4 text-purple-400" />
            <span>Give Gift</span>
          </button>
        </div>

        {/* Gift Selector Drawer */}
        {showGiftSelector && (
          <div className="mt-3 p-3 bg-slate-950 border border-purple-500/40 rounded-xl">
            <h4 className="text-xs font-bold text-purple-300 mb-2">Select Item to Gift:</h4>
            {inventory.length === 0 ? (
              <p className="text-xs text-slate-500">Your inventory is empty.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {inventory.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleGiftItem(item)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-purple-900/80 border border-purple-500/30 rounded text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <span>{item.name}</span>
                    <span className="text-purple-400 font-mono">x{item.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer with Clear Exit/Leave Button */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">Press ESC to exit</span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-cyber font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Leave Conversation
          </button>
        </div>
      </div>
    </div>
  );
};
