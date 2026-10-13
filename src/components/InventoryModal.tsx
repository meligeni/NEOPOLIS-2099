import React from 'react';
import { Package, Shirt, Armchair, Zap, Check, X, Shield, Sparkles } from 'lucide-react';
import { InventoryItem, PlayerStats } from '../types/game';
import { sound } from '../utils/audio';

interface InventoryModalProps {
  inventory: InventoryItem[];
  stats: PlayerStats;
  equippedCosmetics: {
    hairStyle: string;
    hairColor: string;
    outfitStyle: string;
    outfitColor: string;
    implant: string;
    drone: string;
  };
  onClose: () => void;
  onEquipCosmetic: (item: InventoryItem) => void;
  onUseConsumable: (item: InventoryItem) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  inventory,
  stats,
  equippedCosmetics,
  onClose,
  onEquipCosmetic,
  onUseConsumable,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-3xl bg-slate-950 border-2 border-pink-500/80 rounded-2xl shadow-2xl p-6 text-slate-100 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-pink-500/30 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-pink-500/20 border border-pink-400 rounded-xl">
              <Package className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-cyber text-pink-300">
                RUNNER INVENTORY & GEAR
              </h2>
              <p className="text-xs text-slate-400">
                Equip customized cosmetics, consume rations, and inspect cyber stats.
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

        {/* Stats Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs font-mono">
          <div className="p-2 bg-slate-950 rounded border border-cyan-500/30">
            <div className="text-cyan-400 text-[10px] uppercase">Hacking Skill</div>
            <div className="text-base font-bold text-cyan-200">Lv. {stats.hacking}</div>
          </div>
          <div className="p-2 bg-slate-950 rounded border border-amber-500/30">
            <div className="text-amber-400 text-[10px] uppercase">Engineering</div>
            <div className="text-base font-bold text-amber-200">Lv. {stats.engineering}</div>
          </div>
          <div className="p-2 bg-slate-950 rounded border border-emerald-500/30">
            <div className="text-emerald-400 text-[10px] uppercase">Synth-Botany</div>
            <div className="text-base font-bold text-emerald-200">Lv. {stats.synthBotany}</div>
          </div>
          <div className="p-2 bg-slate-950 rounded border border-purple-500/30">
            <div className="text-purple-400 text-[10px] uppercase">Street Cred</div>
            <div className="text-base font-bold text-purple-200">Lv. {stats.streetCred}</div>
          </div>
        </div>

        {/* Inventory Items List */}
        <div className="flex-1 overflow-y-auto pr-2">
          {inventory.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-cyber">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
              Your backpack is currently empty. Visit the Neopolis Bazaar to purchase items!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {inventory.map(item => {
                const isEquipped =
                  (item.slot === 'outfit' && equippedCosmetics.outfitStyle === item.cosmeticKey) ||
                  (item.slot === 'implant' && equippedCosmetics.implant === item.cosmeticKey) ||
                  (item.slot === 'drone' && equippedCosmetics.drone === item.cosmeticKey);

                return (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-900 border border-slate-800 hover:border-pink-500/40 rounded-xl flex items-center justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-slate-100 font-cyber">{item.name}</span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>
                    </div>

                    <div>
                      {item.type === 'cosmetic' && (
                        <button
                          onClick={() => {
                            sound.playChirp(1.2);
                            onEquipCosmetic(item);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-cyber transition-all ${
                            isEquipped
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                              : 'bg-pink-500 hover:bg-pink-400 text-white cursor-pointer'
                          }`}
                        >
                          {isEquipped ? 'Equipped ✓' : 'Equip'}
                        </button>
                      )}

                      {item.type === 'consumable' && (
                        <button
                          onClick={() => {
                            sound.playCredit();
                            onUseConsumable(item);
                          }}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs font-cyber cursor-pointer"
                        >
                          Consume
                        </button>
                      )}

                      {item.type === 'furniture' && (
                        <span className="text-xs text-cyan-400 font-mono px-2 py-1 bg-cyan-950 rounded border border-cyan-500/30">
                          Storage x{item.count}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
