import React, { useState } from 'react';
import { ShoppingBag, Sparkles, Home, Shirt, Armchair, Check, X, Coins, ShieldCheck, LogOut, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { FurnitureDef, HouseProperty, InventoryItem } from '../types/game';
import { COSMETICS_SHOP_ITEMS, FURNITURE_CATALOG } from '../data/gameData';
import { sound } from '../utils/audio';

interface StoresModalProps {
  initialTab?: 'cosmetics' | 'furniture' | 'realty';
  playerCredits: number;
  houses: HouseProperty[];
  playerInventory: InventoryItem[];
  onClose: () => void;
  onBuyItem: (item: InventoryItem) => void;
  onBuyFurniture: (furniture: FurnitureDef) => void;
  onBuyHouse: (houseId: string, price: number) => void;
}

export const StoresModal: React.FC<StoresModalProps> = ({
  initialTab = 'cosmetics',
  playerCredits,
  houses,
  playerInventory,
  onClose,
  onBuyItem,
  onBuyFurniture,
  onBuyHouse,
}) => {
  const [activeTab, setActiveTab] = useState<'cosmetics' | 'furniture' | 'realty'>(initialTab);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const ownedItemIds = new Set(playerInventory.map(i => i.id));

  const handleBuyCosmetic = (item: InventoryItem) => {
    if (playerCredits < item.value) {
      sound.playHackBeep(false);
      return;
    }
    sound.playCredit();
    onBuyItem(item);
  };

  const handleBuyFurn = (furn: FurnitureDef) => {
    if (playerCredits < furn.price) {
      sound.playHackBeep(false);
      return;
    }
    sound.playPlace();
    onBuyFurniture(furn);
  };

  const handleBuyProperty = (house: HouseProperty) => {
    if (playerCredits < house.price) {
      sound.playHackBeep(false);
      return;
    }
    sound.playLevelUp();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    onBuyHouse(house.id, house.price);
  };

  // ESC key to close
  React.useEffect(() => {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <div className="relative w-full max-w-4xl bg-slate-950 border-2 border-pink-500/80 rounded-2xl shadow-2xl p-6 text-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-pink-500/30 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-pink-500/20 border border-pink-400 rounded-xl">
              <ShoppingBag className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-cyber text-pink-300">
                NEOPOLIS MEGABAZAAR & REALTY
              </h2>
              <p className="text-xs text-slate-400">
                Upgrade your chrome, furnish your residence, or acquire luxury real estate.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900 border border-amber-500/50 px-3 py-1.5 rounded-full font-mono font-bold text-amber-300">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>{playerCredits.toLocaleString()} CR</span>
            </div>

            {/* Clear Exit Shop Button in Header */}
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-pink-950 border border-pink-500/40 hover:border-pink-400 text-pink-300 hover:text-pink-200 rounded-xl text-xs font-bold font-cyber transition-all cursor-pointer shadow-md"
            >
              <X className="w-4 h-4" />
              <span>Exit Shop</span>
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-2 border-b border-slate-800 pb-3 mb-4">
          <button
            onClick={() => setActiveTab('cosmetics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold font-cyber transition-all ${
              activeTab === 'cosmetics'
                ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Shirt className="w-4 h-4" />
            <span>Cosmetics & Implants</span>
          </button>

          <button
            onClick={() => setActiveTab('furniture')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold font-cyber transition-all ${
              activeTab === 'furniture'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Armchair className="w-4 h-4" />
            <span>Apartment Furniture</span>
          </button>

          <button
            onClick={() => setActiveTab('realty')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold font-cyber transition-all ${
              activeTab === 'realty'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Apex Real Estate</span>
          </button>
        </div>

        {/* Tab Content: Cosmetics */}
        {activeTab === 'cosmetics' && (
          <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {COSMETICS_SHOP_ITEMS.map(item => {
              const alreadyOwned = ownedItemIds.has(item.id);
              const canAfford = playerCredits >= item.value;

              return (
                <div
                  key={item.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-pink-500/60 p-4 rounded-xl flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs px-2 py-0.5 rounded font-bold uppercase bg-pink-950/80 text-pink-400 border border-pink-500/40">
                        {item.slot || item.type}
                      </span>
                      <div className="flex items-center gap-1 font-mono text-amber-300 text-xs font-bold">
                        <Coins className="w-3.5 h-3.5" />
                        <span>{item.value} CR</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-sm text-slate-100 font-cyber">{item.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    {alreadyOwned ? (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <Check className="w-4 h-4" /> Owned
                      </span>
                    ) : (
                      <button
                        onClick={() => handleBuyCosmetic(item)}
                        disabled={!canAfford}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold font-cyber flex items-center justify-center gap-1.5 transition-colors ${
                          canAfford
                            ? 'bg-pink-500 hover:bg-pink-400 text-white cursor-pointer shadow-md shadow-pink-500/30'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{canAfford ? 'Purchase' : 'Need More Credits'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab Content: Furniture */}
        {activeTab === 'furniture' && (
          <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {FURNITURE_CATALOG.map(furn => {
              const canAfford = playerCredits >= furn.price;

              return (
                <div
                  key={furn.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/60 p-4 rounded-xl flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs px-2 py-0.5 rounded font-bold uppercase bg-cyan-950/80 text-cyan-400 border border-cyan-500/40">
                        {furn.category}
                      </span>
                      <div className="flex items-center gap-1 font-mono text-amber-300 text-xs font-bold">
                        <Coins className="w-3.5 h-3.5" />
                        <span>{furn.price} CR</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: furn.color }}
                      />
                      <h3 className="font-bold text-sm text-slate-100 font-cyber">{furn.name}</h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{furn.description}</p>
                    <div className="text-[10px] text-cyan-400/80 mt-1 font-mono">
                      Footprint: {furn.width}x{furn.height} tiles
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <button
                      onClick={() => handleBuyFurn(furn)}
                      disabled={!canAfford}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold font-cyber flex items-center justify-center gap-1.5 transition-colors ${
                        canAfford
                          ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer shadow-md shadow-cyan-500/30'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Armchair className="w-3.5 h-3.5" />
                      <span>{canAfford ? 'Buy to Storage' : 'Need More Credits'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab Content: Real Estate */}
        {activeTab === 'realty' && (
          <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            {houses.map(house => {
              const canAfford = playerCredits >= house.price;

              return (
                <div
                  key={house.id}
                  className={`bg-slate-900 border-2 rounded-2xl p-5 flex flex-col justify-between transition-all ${
                    house.owned
                      ? 'border-emerald-500/60 bg-emerald-950/20'
                      : 'border-amber-500/40 hover:border-amber-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-950 text-amber-300 border border-amber-500/30">
                        {house.tier}
                      </span>
                      {house.owned ? (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="w-4 h-4" /> OWNED
                        </span>
                      ) : (
                        <div className="flex items-center gap-1 font-mono text-amber-300 font-bold text-sm">
                          <Coins className="w-4 h-4" />
                          <span>{house.price.toLocaleString()} CR</span>
                        </div>
                      )}
                    </div>

                    <h3 className="font-bold text-base text-slate-100 font-cyber mb-1">
                      {house.name}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{house.description}</p>

                    <div className="mt-4 p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-1 font-mono text-slate-400">
                      <div>Interior Area: <span className="text-cyan-300 font-bold">{house.gridWidth}x{house.gridHeight} ({house.gridWidth * house.gridHeight} tiles)</span></div>
                      <div>Default Flooring: <span className="text-slate-200 capitalize">{house.floorTheme}</span></div>
                      <div>Wall Vista: <span className="text-slate-200 capitalize">{house.wallTheme.replace('_', ' ')}</span></div>
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-slate-800">
                    {house.owned ? (
                      <div className="text-center py-2 bg-emerald-950/50 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs font-bold font-cyber">
                        ✓ Primary Residence Keycard Acquired
                      </div>
                    ) : (
                      <button
                        onClick={() => handleBuyProperty(house)}
                        disabled={!canAfford}
                        className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold font-cyber flex items-center justify-center gap-2 transition-all ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow-lg shadow-amber-500/40'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <Home className="w-4 h-4" />
                        <span>{canAfford ? 'Purchase Property' : 'Insufficient Credits'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Bar with prominent Exit Shop button */}
        <div className="mt-4 pt-3 border-t border-slate-800/90 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-mono hidden sm:flex items-center gap-2">
            <span>Press <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-400">ESC</kbd> or click outside to exit</span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-pink-950/80 border-2 border-pink-500/50 hover:border-pink-400 text-pink-200 hover:text-white rounded-xl text-xs font-bold font-cyber flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-pink-500/10 hover:scale-[1.02]"
          >
            <ArrowLeft className="w-4 h-4 text-pink-400" />
            <span>EXIT SHOP // RETURN TO DISTRICT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
