import React, { useState } from 'react';
import { Armchair, RotateCw, Trash2, Check, X, Palette, Sparkles, Box } from 'lucide-react';
import { FurnitureDef, HouseProperty, PlacedFurniture, InventoryItem } from '../types/game';
import { FURNITURE_CATALOG } from '../data/gameData';
import { sound } from '../utils/audio';

interface HouseCustomizerProps {
  house: HouseProperty;
  playerInventory: InventoryItem[];
  selectedPlacedId: string | null;
  selectedCatalogItem: FurnitureDef | null;
  onSelectPlaced: (instanceId: string | null) => void;
  onSelectCatalogItem: (furn: FurnitureDef | null) => void;
  onRotateSelected: () => void;
  onRemoveFurniture: (instanceId: string) => void;
  onChangeFloor: (theme: HouseProperty['floorTheme']) => void;
  onChangeWall: (theme: HouseProperty['wallTheme']) => void;
  onCloseDecorate: () => void;
}

export const HouseCustomizer: React.FC<HouseCustomizerProps> = ({
  house,
  playerInventory,
  selectedPlacedId,
  selectedCatalogItem,
  onSelectPlaced,
  onSelectCatalogItem,
  onRotateSelected,
  onRemoveFurniture,
  onChangeFloor,
  onChangeWall,
  onCloseDecorate,
}) => {
  const [decorTab, setDecorTab] = useState<'inventory' | 'theme'>('inventory');

  // Find furniture items player currently holds in inventory or available catalog
  const inventoryFurniture = playerInventory.filter(item => item.type === 'furniture');

  // Also include base catalog items that player owns or can place
  const catalogLookup = new Map<string, FurnitureDef>();
  FURNITURE_CATALOG.forEach(f => catalogLookup.set(f.id, f));

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 max-w-4xl mx-auto bg-slate-950/95 border-2 border-cyan-400 rounded-2xl shadow-2xl p-4 text-slate-100 backdrop-blur-md">
      {/* Top action bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-cyan-500/30">
        <div className="flex items-center gap-2">
          <Armchair className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold font-pixel text-cyan-300">
            DECORATION MODE // {house.name}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Active selection controls */}
          {selectedPlacedId && (
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 px-2 py-1 rounded-lg">
              <button
                onClick={onRotateSelected}
                className="p-1 hover:bg-cyan-950 text-cyan-300 rounded text-xs flex items-center gap-1 font-cyber"
                title="Rotate 90 degrees"
              >
                <RotateCw className="w-4 h-4" />
                <span>Rotate</span>
              </button>
              <button
                onClick={() => onRemoveFurniture(selectedPlacedId)}
                className="p-1 hover:bg-red-950 text-red-400 rounded text-xs flex items-center gap-1 font-cyber"
                title="Remove back to storage"
              >
                <Trash2 className="w-4 h-4" />
                <span>Store</span>
              </button>
            </div>
          )}

          <div className="flex gap-1 border-l border-slate-800 pl-2">
            <button
              onClick={() => setDecorTab('inventory')}
              className={`px-3 py-1 rounded-lg text-xs font-bold font-cyber ${
                decorTab === 'inventory' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-400'
              }`}
            >
              Furniture
            </button>
            <button
              onClick={() => setDecorTab('theme')}
              className={`px-3 py-1 rounded-lg text-xs font-bold font-cyber ${
                decorTab === 'theme' ? 'bg-pink-500 text-white' : 'bg-slate-900 text-slate-400'
              }`}
            >
              Floors & Walls
            </button>
          </div>

          <button
            onClick={onCloseDecorate}
            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs font-pixel flex items-center gap-1.5 transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Finish</span>
          </button>
        </div>
      </div>

      {/* Tab: Furniture items */}
      {decorTab === 'inventory' && (
        <div>
          <div className="text-xs text-slate-400 mb-2 flex items-center justify-between">
            <span>Click any furniture below to place on the isometric floor grid:</span>
            {selectedCatalogItem && (
              <span className="text-cyan-300 font-bold">
                Placing: {selectedCatalogItem.name} (Click room grid to drop)
              </span>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {FURNITURE_CATALOG.map(furn => {
              const isSelected = selectedCatalogItem?.id === furn.id;

              return (
                <button
                  key={furn.id}
                  onClick={() => {
                    sound.playChirp(1.1);
                    onSelectPlaced(null);
                    onSelectCatalogItem(isSelected ? null : furn);
                  }}
                  className={`min-w-[130px] p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'bg-cyan-950/80 border-cyan-400 shadow-md shadow-cyan-500/30 ring-1 ring-cyan-400'
                      : 'bg-slate-900/90 border-slate-800 hover:border-cyan-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/30"
                      style={{ backgroundColor: furn.color }}
                    />
                    <span className="text-[10px] font-mono text-cyan-400">
                      {furn.width}x{furn.height}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-slate-200 truncate font-cyber">
                    {furn.name}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize">{furn.category}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Flooring & Wall Styles */}
      {decorTab === 'theme' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-cyan-300 uppercase mb-2">
              Flooring Finish:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'tatami', label: 'Tatami Straw' },
                { id: 'hologrid', label: 'Holo Grid' },
                { id: 'cyberwood', label: 'Cyber Wood' },
                { id: 'darkmetal', label: 'Dark Metal' },
                { id: 'goldchrome', label: 'Gold Chrome' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => onChangeFloor(f.id as HouseProperty['floorTheme'])}
                  className={`py-1.5 px-2 rounded-lg text-xs font-cyber border capitalize ${
                    house.floorTheme === f.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-pink-300 uppercase mb-2">
              Wall & Skyline Vista:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'brick_neon', label: 'Brick & Neon' },
                { id: 'cyber_glass', label: 'Skyline Glass' },
                { id: 'industrial', label: 'Industrial Steel' },
                { id: 'synth_bamboo', label: 'Synth Bamboo' },
              ].map(w => (
                <button
                  key={w.id}
                  onClick={() => onChangeWall(w.id as HouseProperty['wallTheme'])}
                  className={`py-1.5 px-2 rounded-lg text-xs font-cyber border capitalize ${
                    house.wallTheme === w.id
                      ? 'bg-pink-500/20 border-pink-400 text-pink-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
