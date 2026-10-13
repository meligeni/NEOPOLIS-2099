import React, { useState } from 'react';
import {
  X,
  Zap,
  Coffee,
  Sparkles,
  Flame,
  UtensilsCrossed,
  BatteryCharging,
  CupSoda,
  Soup,
  Coins,
  CheckCircle2,
  Package,
  AlertCircle,
} from 'lucide-react';
import { VENDING_ITEMS, VendingItem } from '../data/vendingItems';
import { sound } from '../utils/audio';

interface VendingMachineModalProps {
  playerCredits: number;
  playerEnergy: number;
  playerMaxEnergy: number;
  initialCategory?: 'all' | 'drink' | 'snack' | 'meal';
  onClose: () => void;
  onBuyAndConsume: (item: VendingItem) => void;
  onBuyToInventory: (item: VendingItem) => void;
}

export const VendingMachineModal: React.FC<VendingMachineModalProps> = ({
  playerCredits,
  playerEnergy,
  playerMaxEnergy,
  initialCategory = 'all',
  onClose,
  onBuyAndConsume,
  onBuyToInventory,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'drink' | 'snack' | 'meal'>(initialCategory);
  const [hoveredItem, setHoveredItem] = useState<VendingItem | null>(null);
  const [dispenseMessage, setDispenseMessage] = useState<{ text: string; energy?: number } | null>(null);
  const [isDispensing, setIsDispensing] = useState<boolean>(false);

  // Icon mapping
  const renderItemIcon = (iconName: string, color: string) => {
    const iconProps = { className: 'w-7 h-7', style: { color } };
    switch (iconName) {
      case 'Zap':
        return <Zap {...iconProps} />;
      case 'Coffee':
        return <Coffee {...iconProps} />;
      case 'Sparkles':
        return <Sparkles {...iconProps} />;
      case 'Flame':
        return <Flame {...iconProps} />;
      case 'UtensilsCrossed':
        return <UtensilsCrossed {...iconProps} />;
      case 'BatteryCharging':
        return <BatteryCharging {...iconProps} />;
      case 'CupSoda':
        return <CupSoda {...iconProps} />;
      case 'Soup':
        return <Soup {...iconProps} />;
      default:
        return <Zap {...iconProps} />;
    }
  };

  const filteredItems = VENDING_ITEMS.filter(
    item => selectedCategory === 'all' || item.category === selectedCategory
  );

  const handleAction = (item: VendingItem, consumeImmediately: boolean) => {
    if (playerCredits < item.cost) {
      sound.playHackBeep(false);
      setDispenseMessage({ text: 'Insufficient Credits! Hack terminals or complete gigs for CR.' });
      setTimeout(() => setDispenseMessage(null), 3000);
      return;
    }

    setIsDispensing(true);
    sound.playVendingVend();

    if (consumeImmediately) {
      onBuyAndConsume(item);
      const actualRecovered = Math.min(item.energyRestore, playerMaxEnergy - playerEnergy);
      setDispenseMessage({
        text: `Vended & Consumed ${item.name}!`,
        energy: actualRecovered > 0 ? actualRecovered : item.energyRestore,
      });
    } else {
      onBuyToInventory(item);
      setDispenseMessage({
        text: `Stored ${item.name} in your inventory bag.`,
      });
    }

    setTimeout(() => {
      setIsDispensing(false);
    }, 600);

    setTimeout(() => {
      setDispenseMessage(null);
    }, 3500);
  };

  // Preview energy calculation
  const previewEnergy = hoveredItem
    ? Math.min(playerMaxEnergy, playerEnergy + hoveredItem.energyRestore)
    : playerEnergy;
  const energyDiff = previewEnergy - playerEnergy;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Campus Vending Machine"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl bg-slate-950 border-2 border-cyan-500/80 rounded-2xl shadow-2xl shadow-cyan-500/30 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Neon Marquee Header */}
        <div className="relative bg-gradient-to-r from-slate-900 via-cyan-950/60 to-slate-900 border-b border-cyan-500/40 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Zap className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-pixel text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  MODEL VEND-2077
                </span>
                <span className="text-[10px] text-emerald-400 font-mono tracking-wider animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> ONLINE
                </span>
              </div>
              <h2 className="text-lg font-bold text-white font-pixel tracking-wide flex items-center gap-2">
                Neo-Akademia Nutrient Dispenser
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-red-500 hover:bg-red-950/50 flex items-center justify-center transition-all cursor-pointer"
            title="Exit Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live HUD: Credits and Energy Gauge */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-5 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Player Credits */}
          <div className="flex items-center justify-between bg-slate-950/70 border border-amber-500/30 rounded-xl px-3.5 py-2">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-400" />
              <span className="text-xs text-slate-400 font-pixel">YOUR CREDITS:</span>
            </div>
            <span className="text-base font-bold font-mono text-amber-300">
              {playerCredits.toLocaleString()} <span className="text-xs text-amber-500">CR</span>
            </span>
          </div>

          {/* Player Energy Gauge with Live Preview */}
          <div className="flex flex-col justify-center bg-slate-950/70 border border-cyan-500/30 rounded-xl px-3.5 py-2">
            <div className="flex items-center justify-between text-xs font-pixel mb-1.5">
              <span className="text-slate-400 flex items-center gap-1.5">
                <BatteryCharging className="w-4 h-4 text-cyan-400" />
                BIO-ENERGY LEVEL:
              </span>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="text-cyan-300 font-bold">
                  {playerEnergy} / {playerMaxEnergy}
                </span>
                {energyDiff > 0 && (
                  <span className="text-emerald-400 font-bold animate-pulse text-[11px]">
                    (➔ {previewEnergy})
                  </span>
                )}
              </div>
            </div>

            {/* Gauge Bar */}
            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden relative border border-slate-800">
              {/* Base Energy */}
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                style={{ width: `${(playerEnergy / playerMaxEnergy) * 100}%` }}
              />
              {/* Preview Boost */}
              {energyDiff > 0 && (
                <div
                  className="absolute top-0 bottom-0 bg-emerald-400/80 animate-pulse transition-all duration-300"
                  style={{
                    left: `${(playerEnergy / playerMaxEnergy) * 100}%`,
                    width: `${(energyDiff / playerMaxEnergy) * 100}%`,
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="px-5 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
          {(
            [
              { id: 'all', label: 'All Items' },
              { id: 'drink', label: 'Cold Drinks' },
              { id: 'snack', label: 'Quick Snacks' },
              { id: 'meal', label: 'Hot Meals' },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                sound.playChirp(1.2);
                setSelectedCategory(tab.id);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-pixel whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === tab.id
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dispense Feedback Banner */}
        {dispenseMessage && (
          <div
            className={`mx-5 mt-3 px-4 py-2 rounded-xl text-xs font-pixel flex items-center justify-between border ${
              dispenseMessage.energy
                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200'
                : 'bg-amber-950/80 border-amber-500/60 text-amber-200'
            } animate-fade-in`}
          >
            <div className="flex items-center gap-2">
              {dispenseMessage.energy ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400" />
              )}
              <span>{dispenseMessage.text}</span>
            </div>
            {dispenseMessage.energy && (
              <span className="font-bold text-emerald-300 font-mono">
                +{dispenseMessage.energy} ENERGY RECOVERED!
              </span>
            )}
          </div>
        )}

        {/* Vending Grid Display */}
        <div className="p-5 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredItems.map(item => {
            const canAfford = playerCredits >= item.cost;
            const isFullEnergy = playerEnergy >= playerMaxEnergy;

            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredItem(item)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`relative bg-slate-900/80 border rounded-xl p-3.5 flex flex-col justify-between transition-all ${
                  canAfford
                    ? 'border-slate-800 hover:border-cyan-500/60 hover:bg-slate-900 shadow-md hover:shadow-cyan-500/10'
                    : 'border-slate-800/60 opacity-70'
                }`}
              >
                {/* Header: Slot Code + Icon + Name + Cost */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-11 h-11 rounded-lg bg-slate-950 border flex items-center justify-center shrink-0 shadow-inner"
                        style={{ borderColor: `${item.color}50` }}
                      >
                        {renderItemIcon(item.iconName, item.color)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono px-1 py-0.2 bg-slate-950 border border-slate-700 text-slate-300 rounded">
                            {item.slotCode}
                          </span>
                          <span className="text-[10px] uppercase font-pixel tracking-wider text-slate-400">
                            {item.category}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white leading-tight mt-0.5">
                          {item.name}
                        </h3>
                      </div>
                    </div>

                    {/* Price Tag */}
                    <div className="bg-amber-950/60 border border-amber-500/40 rounded-lg px-2 py-1 text-right shrink-0">
                      <span className="text-xs font-bold font-mono text-amber-300">
                        {item.cost} <span className="text-[10px] text-amber-500">CR</span>
                      </span>
                    </div>
                  </div>

                  {/* Energy Recovery Highlight */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                      <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                      +{item.energyRestore} Energy
                    </span>
                    {item.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 font-pixel hidden sm:inline-block"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-slate-400 leading-snug mb-1">
                    {item.description}
                  </p>
                  <p className="text-[11px] text-cyan-400/80 italic font-mono mb-3">
                    {item.flavor}
                  </p>
                </div>

                {/* Purchase Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  {/* Primary: Buy & Consume for Immediate Energy */}
                  <button
                    disabled={!canAfford || isDispensing}
                    onClick={() => handleAction(item, true)}
                    className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-pixel font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      canAfford && !isDispensing
                        ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 hover:brightness-110 shadow-md shadow-cyan-500/20 active:scale-95'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                    title="Deduct credits and recover energy immediately"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{isFullEnergy ? 'Drink / Eat Now' : 'Consume (+Energy)'}</span>
                  </button>

                  {/* Secondary: Store in Bag */}
                  <button
                    disabled={!canAfford || isDispensing}
                    onClick={() => handleAction(item, false)}
                    className={`py-2 px-2.5 rounded-lg text-xs font-pixel border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      canAfford && !isDispensing
                        ? 'bg-slate-950 border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 hover:bg-slate-900'
                        : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                    title="Purchase and store in your inventory bag"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">To Bag</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Machine Dispenser Footer Tray */}
        <div className="bg-slate-950 border-t border-slate-800 px-5 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-pixel">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isDispensing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
              }`}
            />
            <span>
              {isDispensing
                ? 'MECHANICAL DISPENSER ACTIVE...'
                : 'DISPENSER READY // SELECT ITEM OR PRESS ESC TO EXIT'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 text-xs font-pixel transition-all cursor-pointer"
          >
            Exit Dispenser
          </button>
        </div>
      </div>
    </div>
  );
};
