import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  CharacterAppearance,
  FurnitureDef,
  GameDifficulty,
  GameState,
  HouseProperty,
  InventoryItem,
  NPC,
  Quest,
  WeatherType,
} from './types/game';
import {
  INITIAL_HOUSES,
  INITIAL_NPCS,
  INITIAL_QUESTS,
  COSMETICS_SHOP_ITEMS,
  FURNITURE_CATALOG,
} from './data/gameData';
import { TitleMenu } from './components/TitleMenu';
import { CharacterCreator } from './components/CharacterCreator';
import { IsometricGameCanvas } from './components/IsometricGameCanvas';
import { TopBar } from './components/TopBar';
import { DialogueModal } from './components/DialogueModal';
import { HackingMinigameModal } from './components/HackingMinigameModal';
import { ArcadeMinigameModal } from './components/ArcadeMinigameModal';
import { StoresModal } from './components/StoresModal';
import { QuestsModal } from './components/QuestsModal';
import { InventoryModal } from './components/InventoryModal';
import { HouseCustomizer } from './components/HouseCustomizer';
import { VendingMachineModal } from './components/VendingMachineModal';
import { NewsFeedModal } from './components/NewsFeedModal';
import { NewsTickerBar } from './components/NewsTickerBar';
import { CityScheduleModal } from './components/CityScheduleModal';
import { VendingItem } from './data/vendingItems';
import { generateDailyNews, NewsStory } from './data/newsFeed';
import { sound } from './utils/audio';

const STORAGE_KEY = 'neopolis_cyber_lifesim_save_v1';

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure npcs receive latest 24h schedule arrays
        const mergedNpcs: Record<string, NPC> = {};
        Object.entries(INITIAL_NPCS).forEach(([id, initNpc]) => {
          const existing = parsed.npcs?.[id];
          mergedNpcs[id] = {
            ...initNpc,
            ...(existing || {}),
            schedule: initNpc.schedule,
          };
        });
        return {
          ...parsed,
          npcs: mergedNpcs,
        };
      }
    } catch {
      // Fallback
    }
    return null;
  });

  // Modal states
  const [activeDialogueNPC, setActiveDialogueNPC] = useState<NPC | null>(null);
  const [showHackingModal, setShowHackingModal] = useState<boolean>(false);
  const [showArcadeModal, setShowArcadeModal] = useState<boolean>(false);
  const [showStoreModal, setShowStoreModal] = useState<boolean>(false);
  const [storeTab, setStoreTab] = useState<'cosmetics' | 'furniture' | 'realty'>('cosmetics');
  const [showQuestsModal, setShowQuestsModal] = useState<boolean>(false);
  const [showInventoryModal, setShowInventoryModal] = useState<boolean>(false);
  const [showVendingModal, setShowVendingModal] = useState<boolean>(false);
  const [vendingCategory, setVendingCategory] = useState<'all' | 'drink' | 'snack' | 'meal'>('all');
  const [showNewsFeedModal, setShowNewsFeedModal] = useState<boolean>(false);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [currentNewsStories, setCurrentNewsStories] = useState<NewsStory[]>(() => {
    return generateDailyNews(1, 'cyber_clear');
  });
  const [isSleepingTransition, setIsSleepingTransition] = useState<boolean>(false);
  const [inTitleMenu, setInTitleMenu] = useState<boolean>(true);
  const [isCreatingCharacter, setIsCreatingCharacter] = useState<boolean>(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<GameDifficulty>('normal');
  const [energyWarning, setEnergyWarning] = useState<string | null>(null);

  // Energy & Nanite Consumption Handler (Grounded in Game Difficulty & Sleep Balance)
  const handleConsumeEnergy = useCallback((cost: number, actionName: string): boolean => {
    if (!gameState) return false;
    const diff = gameState.difficulty || 'normal';
    const mult = diff === 'easy' ? 0.65 : diff === 'hard' ? 1.25 : 1.0;
    const actualCost = Math.max(1, Math.round(cost * mult));

    if (gameState.stats.energy < actualCost) {
      sound.playChirp(0.5);
      setEnergyWarning(`⚠️ NANITES INSUFICIENTES (${gameState.stats.energy}/${actualCost}⚡)! Ação "${actionName}" bloqueada. Descanse na sua cápsula para recarregar 100% ou coma no Bistrô do Bao!`);
      setTimeout(() => setEnergyWarning(null), 4500);
      return false;
    }

    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        stats: {
          ...prev.stats,
          energy: Math.max(0, prev.stats.energy - actualCost),
        },
      };
    });
    return true;
  }, [gameState]);

  // Specialized NPC Establishment Interior Scene Transitions
  const handleEnterInterior = (interiorId: string) => {
    sound.playChirp(1.1);
    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        currentScene: 'interior',
        currentInteriorId: interiorId,
      };
    });
  };

  const handleExitInterior = () => {
    sound.playChirp(0.9);
    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        currentScene: 'town',
        currentInteriorId: undefined,
      };
    });
  };

  // House Decoration states
  const [isDecorateMode, setIsDecorateMode] = useState<boolean>(false);
  const [selectedPlacedId, setSelectedPlacedId] = useState<string | null>(null);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<FurnitureDef | null>(null);

  // Auto-save to localStorage
  useEffect(() => {
    if (gameState) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    }
  }, [gameState]);

  // Ambient world time clock & atmospheric weather drift
  useEffect(() => {
    if (!gameState) return;
    const interval = setInterval(() => {
      setGameState(prev => {
        if (!prev) return null;
        let newMin = prev.timeMinute + 5;
        let newHour = prev.timeHour;
        let newDay = prev.day;
        let newWeather = prev.weather;

        if (newMin >= 60) {
          newMin = 0;
          newHour += 1;
          if (newHour >= 24) {
            newHour = 0;
            newDay += 1;
          }
          // Shift weather every few hours (25% chance per hour rollover)
          if (Math.random() < 0.25) {
            const weatherList: WeatherType[] = ['neon_rain', 'acid_fog', 'cyber_clear', 'glitch_storm'];
            const choices = weatherList.filter(w => w !== prev.weather);
            newWeather = choices[Math.floor(Math.random() * choices.length)];
          }
        }

        return {
          ...prev,
          timeMinute: newMin,
          timeHour: newHour,
          day: newDay,
          weather: newWeather,
        };
      });
    }, 4500); // 4.5 real seconds advances 5 in-game minutes

    return () => clearInterval(interval);
  }, [gameState ? true : false]);

  // Handle Character Creation Complete with Difficulty Scaling
  const handleCharacterCreated = (char: CharacterAppearance, diff: GameDifficulty = selectedDifficulty) => {
    const starterCredits = char.origin === 'netrunner' ? 350 : 250;
    const initialHacking = char.origin === 'netrunner' ? 3 : 1;
    const initialEng = char.origin === 'mechanic' ? 3 : 1;
    const initialBotany = char.origin === 'alchemist' ? 3 : 1;

    // Difficulty balancing
    const maxEnergyVal = diff === 'easy' ? 150 : diff === 'hard' ? 85 : 100;
    const creditBonus = diff === 'easy' ? 100 : diff === 'hard' ? -50 : 0;

    const initialInventory: InventoryItem[] = [
      {
        id: 'starter_jacket',
        name: 'Streetwear Runner Jacket',
        description: 'Standard issue synthetic weatherproof jacket.',
        type: 'cosmetic',
        icon: 'Shirt',
        value: 100,
        slot: 'outfit',
        cosmeticKey: char.outfitStyle,
        cosmeticColor: char.outfitColor,
        count: 1,
      },
      {
        id: 'starter_ramen',
        name: 'Chef Bao Spicy Cyber Ramen',
        description: 'Steaming noodles. Consuming immediately grants +30 Energy and +50 Credits!',
        type: 'consumable',
        icon: 'Soup',
        value: 40,
        count: 2,
      },
      {
        id: 'starter_seed',
        name: 'Neon Lotus Seed Packet',
        description: 'A packet of bio-engineered cyber seeds ready for hydroponic basins.',
        type: 'seed',
        icon: 'Sprout',
        value: 50,
        count: 2,
      },
    ];

    const newGame: GameState = {
      player: char,
      stats: {
        level: 1,
        exp: 0,
        maxExp: 200,
        credits: Math.max(100, starterCredits + creditBonus),
        energy: maxEnergyVal,
        maxEnergy: maxEnergyVal,
        hacking: initialHacking,
        engineering: initialEng,
        synthBotany: initialBotany,
        streetCred: 1,
        rankTitle: 'Scrap Rat',
      },
      inventory: initialInventory,
      equippedCosmetics: {
        hairStyle: char.hairStyle,
        hairColor: char.hairColor,
        outfitStyle: char.outfitStyle,
        outfitColor: char.outfitColor,
        implant: char.implant,
        drone: char.droneCompanion,
      },
      houses: INITIAL_HOUSES,
      currentHouseId: 'capsule_404',
      currentScene: 'town',
      currentInteriorId: undefined,
      difficulty: diff,
      day: 1,
      timeHour: 20,
      timeMinute: 30,
      weather: 'neon_rain',
      npcs: INITIAL_NPCS,
      quests: INITIAL_QUESTS,
      worldPlants: [],
      hackedTerminalsToday: [],
      soundEnabled: true,
      musicEnabled: true,
      unlockedRanks: ['Scrap Rat'],
    };

    setGameState(newGame);
    setIsCreatingCharacter(false);
    setInTitleMenu(false);
    sound.startAmbientMusic();
  };

  // Grant Credits & EXP helper with level-up check
  const awardAction = useCallback((credits: number, exp: number, reason: string) => {
    setGameState(prev => {
      if (!prev) return null;
      let newCredits = prev.stats.credits + credits;
      let newExp = prev.stats.exp + exp;
      let newLevel = prev.stats.level;
      let newMaxExp = prev.stats.maxExp;
      let newRank = prev.stats.rankTitle;

      // Check level up
      if (newExp >= newMaxExp) {
        newExp = newExp - newMaxExp;
        newLevel += 1;
        newMaxExp = Math.round(newMaxExp * 1.5);
        sound.playLevelUp();
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.5 },
        });

        if (newLevel >= 5) newRank = 'Cyber Overlord';
        else if (newLevel >= 4) newRank = 'Chrome Legend';
        else if (newLevel >= 3) newRank = 'Neon Runner';
        else if (newLevel >= 2) newRank = 'Script Kiddie';
      }

      // Check quests that listen to ranks or credits
      const updatedQuests = prev.quests.map(q => {
        if (q.status === 'active' && q.type === 'reach_rank') {
          return { ...q, currentProgress: Math.min(q.maxProgress, newLevel) };
        }
        return q;
      });

      return {
        ...prev,
        stats: {
          ...prev.stats,
          credits: newCredits,
          exp: newExp,
          level: newLevel,
          maxExp: newMaxExp,
          rankTitle: newRank,
          hacking: prev.stats.hacking + (reason.includes('Hack') ? 1 : 0),
          engineering: prev.stats.engineering + (reason.includes('Repair') ? 1 : 0),
          synthBotany: prev.stats.synthBotany + (reason.includes('Harvest') ? 1 : 0),
        },
        quests: updatedQuests,
      };
    });
  }, []);

  // Handle Quest Acceptance (consumes energy for contract sync)
  const handleAcceptQuest = (questId: string) => {
    if (!handleConsumeEnergy(12, 'Aceitar Missão')) return;
    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        quests: prev.quests.map(q => (q.id === questId ? { ...q, status: 'active' } : q)),
      };
    });
  };

  // Handle Quest Completion
  const handleCompleteQuest = (questId: string) => {
    setGameState(prev => {
      if (!prev) return null;
      const quest = prev.quests.find(q => q.id === questId);
      if (!quest) return prev;

      sound.playLevelUp();
      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.6 },
      });

      awardAction(quest.rewardCredits, quest.rewardExp, 'Quest Complete: ' + quest.title);

      return {
        ...prev,
        quests: prev.quests.map(q => (q.id === questId ? { ...q, status: 'completed' } : q)),
      };
    });
  };

  // NPC Shop open handler
  const handleOpenNPCShop = (npcId: string) => {
    setActiveDialogueNPC(null);
    if (npcId === 'dex') setStoreTab('cosmetics');
    else if (npcId === 'sparks') setStoreTab('furniture');
    else setStoreTab('cosmetics');
    setShowStoreModal(true);
  };

  // Give Gift to NPC
  const handleGiveGift = (item: InventoryItem) => {
    if (!activeDialogueNPC) return;
    setGameState(prev => {
      if (!prev) return null;
      const updatedNpc = {
        ...prev.npcs[activeDialogueNPC.id],
        affinity: Math.min(5, prev.npcs[activeDialogueNPC.id].affinity + 1),
      };

      // Remove item from inventory
      const updatedInv = prev.inventory
        .map(i => (i.id === item.id ? { ...i, count: i.count - 1 } : i))
        .filter(i => i.count > 0);

      return {
        ...prev,
        npcs: { ...prev.npcs, [activeDialogueNPC.id]: updatedNpc },
        inventory: updatedInv,
      };
    });
  };

  // Buy Cosmetic Item
  const handleBuyItem = (item: InventoryItem) => {
    setGameState(prev => {
      if (!prev) return null;
      if (prev.stats.credits < item.value) return prev;

      const existing = prev.inventory.find(i => i.id === item.id);
      let nextInv: InventoryItem[];

      if (existing) {
        nextInv = prev.inventory.map(i => (i.id === item.id ? { ...i, count: i.count + 1 } : i));
      } else {
        nextInv = [...prev.inventory, { ...item, count: 1 }];
      }

      // Check buy cosmetic quest
      const updatedQuests = prev.quests.map(q => {
        if (q.status === 'active' && q.type === 'buy_cosmetic') {
          return { ...q, currentProgress: 1 };
        }
        return q;
      });

      return {
        ...prev,
        stats: { ...prev.stats, credits: prev.stats.credits - item.value },
        inventory: nextInv,
        quests: updatedQuests,
      };
    });
  };

  // Buy Furniture
  const handleBuyFurniture = (furn: FurnitureDef) => {
    setGameState(prev => {
      if (!prev) return null;
      if (prev.stats.credits < furn.price) return prev;

      const furnItem: InventoryItem = {
        id: 'inv_furn_' + furn.id + '_' + Date.now(),
        name: furn.name,
        description: furn.description,
        type: 'furniture',
        icon: 'Armchair',
        value: furn.price,
        furnitureId: furn.id,
        count: 1,
      };

      return {
        ...prev,
        stats: { ...prev.stats, credits: prev.stats.credits - furn.price },
        inventory: [...prev.inventory, furnItem],
      };
    });
  };

  // Buy Real Estate House
  const handleBuyHouse = (houseId: string, price: number) => {
    setGameState(prev => {
      if (!prev) return null;
      if (prev.stats.credits < price) return prev;

      const updatedHouses = prev.houses.map(h => (h.id === houseId ? { ...h, owned: true } : h));

      // Advance quest
      const updatedQuests = prev.quests.map(q => {
        if (q.status === 'active' && q.type === 'buy_house' && q.targetValue === houseId) {
          return { ...q, currentProgress: 1 };
        }
        return q;
      });

      return {
        ...prev,
        stats: { ...prev.stats, credits: prev.stats.credits - price },
        houses: updatedHouses,
        currentHouseId: houseId,
        quests: updatedQuests,
      };
    });
  };

  // Equip Cosmetic Item
  const handleEquipCosmetic = (item: InventoryItem) => {
    setGameState(prev => {
      if (!prev) return null;
      const nextEquipped = { ...prev.equippedCosmetics };

      if (item.slot === 'outfit' && item.cosmeticKey) {
        nextEquipped.outfitStyle = item.cosmeticKey;
        if (item.cosmeticColor) nextEquipped.outfitColor = item.cosmeticColor;
      } else if (item.slot === 'implant' && item.cosmeticKey) {
        nextEquipped.implant = item.cosmeticKey;
      } else if (item.slot === 'drone' && item.cosmeticKey) {
        nextEquipped.drone = item.cosmeticKey;
      }

      return { ...prev, equippedCosmetics: nextEquipped };
    });
  };

  // Consume Food / Consumables
  const handleUseConsumable = (item: InventoryItem) => {
    sound.playDrink();
    setGameState(prev => {
      if (!prev) return null;
      const updatedInv = prev.inventory
        .map(i => (i.id === item.id ? { ...i, count: i.count - 1 } : i))
        .filter(i => i.count > 0);

      // Match item energy if vending item
      let energyGain = 35;
      if (item.id === 'vend_ionfuel') energyGain = 80;
      else if (item.id === 'vend_steambao') energyGain = 58;
      else if (item.id === 'vend_ramen_can') energyGain = 50;
      else if (item.id === 'vend_jerky') energyGain = 42;
      else if (item.id === 'vend_espresso') energyGain = 36;
      else if (item.id === 'vend_matcha') energyGain = 28;
      else if (item.id === 'vend_soda_blue') energyGain = 22;
      else if (item.id === 'vend_gummies') energyGain = 16;

      return {
        ...prev,
        inventory: updatedInv,
        stats: {
          ...prev.stats,
          energy: Math.min(prev.stats.maxEnergy, prev.stats.energy + energyGain),
          credits: prev.stats.credits + (item.id === 'starter_ramen' ? 50 : 0),
        },
      };
    });
  };

  // Open Interactive Vending Machine Menu
  const handleOpenVendingMachine = (category?: 'all' | 'drink' | 'snack') => {
    sound.playChirp(1.1);
    setVendingCategory(category || 'all');
    setShowVendingModal(true);
  };

  // Buy & Consume cheap food item for immediate energy recovery
  const handleBuyAndConsumeVending = (item: VendingItem) => {
    setGameState(prev => {
      if (!prev || prev.stats.credits < item.cost) return prev;
      sound.playDrink();
      const newEnergy = Math.min(prev.stats.maxEnergy, prev.stats.energy + item.energyRestore);
      const newCredits = prev.stats.credits - item.cost;
      return {
        ...prev,
        stats: {
          ...prev.stats,
          credits: newCredits,
          energy: newEnergy,
        },
      };
    });
  };

  // Buy cheap consumable to backpack inventory
  const handleBuyToInventoryVending = (item: VendingItem) => {
    setGameState(prev => {
      if (!prev || prev.stats.credits < item.cost) return prev;
      const newCredits = prev.stats.credits - item.cost;
      const existing = prev.inventory.find(i => i.id === item.id);
      let updatedInv: InventoryItem[];

      if (existing) {
        updatedInv = prev.inventory.map(i =>
          i.id === item.id ? { ...i, count: i.count + 1 } : i
        );
      } else {
        const newItem: InventoryItem = {
          id: item.id,
          name: item.name,
          description: `${item.description} Consuming recovers +${item.energyRestore} Energy!`,
          type: 'consumable',
          icon: item.iconName,
          value: item.cost,
          count: 1,
        };
        updatedInv = [...prev.inventory, newItem];
      }

      return {
        ...prev,
        inventory: updatedInv,
        stats: {
          ...prev.stats,
          credits: newCredits,
        },
      };
    });
  };

  // House Furniture Placement & Modification
  const handlePlaceFurnitureAt = (x: number, y: number) => {
    if (!selectedCatalogItem || !gameState) return;
    sound.playPlace();

    setGameState(prev => {
      if (!prev) return null;
      const currentHouse = prev.houses.find(h => h.id === prev.currentHouseId) || prev.houses[0];

      const newPlaced: HouseProperty['placedFurniture'][0] = {
        instanceId: 'placed_' + Date.now(),
        furnitureId: selectedCatalogItem.id,
        x,
        y,
        rotation: 0,
      };

      const updatedHouses = prev.houses.map(h =>
        h.id === currentHouse.id
          ? { ...h, placedFurniture: [...h.placedFurniture, newPlaced] }
          : h
      );

      // Evolve credit reward for decorating
      awardAction(25, 15, 'Interior Decorating');

      return {
        ...prev,
        houses: updatedHouses,
      };
    });

    setSelectedCatalogItem(null);
  };

  const handleRotateSelected = () => {
    if (!selectedPlacedId || !gameState) return;
    sound.playPlace();
    setGameState(prev => {
      if (!prev) return null;
      const currentHouse = prev.houses.find(h => h.id === prev.currentHouseId) || prev.houses[0];

      const updatedPlaced = currentHouse.placedFurniture.map(p => {
        if (p.instanceId === selectedPlacedId) {
          const nextRot = ((p.rotation + 1) % 4) as 0 | 1 | 2 | 3;
          return { ...p, rotation: nextRot };
        }
        return p;
      });

      return {
        ...prev,
        houses: prev.houses.map(h => (h.id === currentHouse.id ? { ...h, placedFurniture: updatedPlaced } : h)),
      };
    });
  };

  const handleRemoveFurniture = (instanceId: string) => {
    if (!gameState) return;
    sound.playPlace();
    setGameState(prev => {
      if (!prev) return null;
      const currentHouse = prev.houses.find(h => h.id === prev.currentHouseId) || prev.houses[0];

      const updatedPlaced = currentHouse.placedFurniture.filter(p => p.instanceId !== instanceId);
      return {
        ...prev,
        houses: prev.houses.map(h => (h.id === currentHouse.id ? { ...h, placedFurniture: updatedPlaced } : h)),
      };
    });
    setSelectedPlacedId(null);
  };

  const handleChangeFloor = (floorTheme: HouseProperty['floorTheme']) => {
    if (!gameState) return;
    sound.playPlace();
    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        houses: prev.houses.map(h => (h.id === prev.currentHouseId ? { ...h, floorTheme } : h)),
      };
    });
  };

  const handleChangeWall = (wallTheme: HouseProperty['wallTheme']) => {
    if (!gameState) return;
    sound.playPlace();
    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        houses: prev.houses.map(h => (h.id === prev.currentHouseId ? { ...h, wallTheme } : h)),
      };
    });
  };

  // Interactive world handlers
  const handleSleepInBed = () => {
    sound.playLevelUp();
    setIsSleepingTransition(true);

    const weatherList: WeatherType[] = ['neon_rain', 'acid_fog', 'cyber_clear', 'glitch_storm'];
    const nextWeather = weatherList[Math.floor(Math.random() * weatherList.length)];

    setTimeout(() => {
      setGameState(prev => {
        if (!prev) return null;
        const nextDay = prev.day + 1;
        const newStories = generateDailyNews(nextDay, nextWeather);
        setCurrentNewsStories(newStories);
        return {
          ...prev,
          day: nextDay,
          timeHour: 8,
          timeMinute: 0,
          weather: nextWeather,
          stats: {
            ...prev.stats,
            energy: prev.stats.maxEnergy,
            credits: prev.stats.credits + 20, // daily stipend
          },
        };
      });

      setIsSleepingTransition(false);
      setShowNewsFeedModal(true);
      awardAction(20, 10, 'Morning Rest Stipend');
    }, 650);
  };

  const handleCycleWeather = () => {
    sound.playChirp(1.2);
    setGameState(prev => {
      if (!prev) return null;
      const order: WeatherType[] = ['neon_rain', 'acid_fog', 'cyber_clear', 'glitch_storm'];
      const curIdx = order.indexOf(prev.weather);
      const nextWeather = order[(curIdx + 1) % order.length];
      return {
        ...prev,
        weather: nextWeather,
      };
    });
  };

  const handleTendPlants = () => {
    if (!handleConsumeEnergy(10, 'Colheita Hidropônica')) return;
    sound.playCredit();
    awardAction(75, 40, 'Plant Harvest');
    // Check flora quest
    setGameState(prev => {
      if (!prev) return null;
      const updatedQuests = prev.quests.map(q => {
        if (q.status === 'active' && q.type === 'plant') {
          return { ...q, currentProgress: 1 };
        }
        return q;
      });
      return { ...prev, quests: updatedQuests };
    });
  };

  const handleRepairDrone = () => {
    if (!handleConsumeEnergy(15, 'Reparo de Drone')) return;
    sound.playHackBeep(true);
    awardAction(60, 30, 'Repair Drone');
  };

  // 1. Initial Screen: Title Menu with Lore Prologue, Settings, Difficulty & Copyright
  if (inTitleMenu) {
    return (
      <TitleMenu
        hasSaveGame={!!gameState}
        onContinueGame={() => {
          if (gameState) {
            setInTitleMenu(false);
            if (gameState.musicEnabled) sound.startAmbientMusic();
          }
        }}
        onNewGame={(diff) => {
          setSelectedDifficulty(diff);
          setIsCreatingCharacter(true);
          setInTitleMenu(false);
        }}
        musicEnabled={gameState?.musicEnabled ?? true}
        onToggleMusic={() => {
          if (gameState) {
            if (gameState.musicEnabled) {
              sound.stopAmbientMusic();
              setGameState(p => (p ? { ...p, musicEnabled: false } : null));
            } else {
              sound.startAmbientMusic();
              setGameState(p => (p ? { ...p, musicEnabled: true } : null));
            }
          }
        }}
      />
    );
  }

  // 2. Character Creator (when starting a new game or if no save exists)
  if (isCreatingCharacter || !gameState) {
    return <CharacterCreator onComplete={(char) => handleCharacterCreated(char, selectedDifficulty)} />;
  }

  const currentHouse = gameState.houses.find(h => h.id === gameState.currentHouseId) || gameState.houses[0];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 font-cyber select-none">
      {/* Top HUD with Cleanly Docked News Ticker & Return-to-Menu button (NO OVERLAP) */}
      <TopBar
        gameState={gameState}
        isDecorateMode={isDecorateMode}
        onReturnToMenu={() => {
          sound.playChirp(0.9);
          setInTitleMenu(true);
        }}
        newsTickerElement={
          <NewsTickerBar
            stories={currentNewsStories}
            day={gameState.day}
            onOpenFullNews={() => setShowNewsFeedModal(true)}
          />
        }
        onToggleMusic={() => {
          if (gameState.musicEnabled) {
            sound.stopAmbientMusic();
            setGameState(p => (p ? { ...p, musicEnabled: false } : null));
          } else {
            sound.startAmbientMusic();
            setGameState(p => (p ? { ...p, musicEnabled: true } : null));
          }
        }}
        onOpenQuests={() => setShowQuestsModal(true)}
        onOpenInventory={() => setShowInventoryModal(true)}
        onOpenShop={() => {
          setStoreTab('cosmetics');
          setShowStoreModal(true);
        }}
        onToggleHouseScene={() => {
          sound.playChirp(1.0);
          setIsDecorateMode(false);
          setGameState(p => {
            if (!p) return null;
            return {
              ...p,
              currentScene: p.currentScene === 'house' ? 'town' : 'house',
            };
          });
        }}
        onToggleDecorate={() => {
          sound.playPlace();
          setIsDecorateMode(!isDecorateMode);
        }}
        onCycleWeather={handleCycleWeather}
        onOpenNewsFeed={() => setShowNewsFeedModal(true)}
        onOpenSchedules={() => {
          sound.playChirp(1.1);
          setShowScheduleModal(true);
        }}
      />

      {/* Energy Depletion Warning Toast Banner */}
      {energyWarning && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[90%] bg-rose-950/95 border-2 border-rose-500 rounded-xl px-4 py-2.5 shadow-2xl backdrop-blur-md animate-bounce pointer-events-auto">
          <div className="flex items-center gap-2 text-rose-200 text-xs font-mono">
            <span>{energyWarning}</span>
          </div>
        </div>
      )}

      {/* Main Isometric Game Canvas */}
      <main className="w-full h-full flex-1 relative overflow-hidden">
        <IsometricGameCanvas
          gameState={gameState}
          isDecorateMode={isDecorateMode}
          selectedPlacedId={selectedPlacedId}
          selectedCatalogItem={selectedCatalogItem}
          onInteractNPC={npc => {
            sound.playChirp(1.0);
            setActiveDialogueNPC(npc);
          }}
          onInteractTerminal={() => {
            if (!handleConsumeEnergy(20, 'Hackear Terminal')) return;
            setShowHackingModal(true);
          }}
          onInteractArcade={() => {
            if (!handleConsumeEnergy(10, 'Fliperama Black Ice')) return;
            setShowArcadeModal(true);
          }}
          onInteractBed={handleSleepInBed}
          onInteractPlant={handleTendPlants}
          onInteractRepairBot={handleRepairDrone}
          onEnterHouse={houseId => {
            sound.playChirp(1.1);
            setGameState(p => {
              if (!p) return null;
              return {
                ...p,
                currentScene: 'house',
                currentHouseId: houseId || p.currentHouseId,
              };
            });
          }}
          onExitHouse={() => {
            sound.playChirp(0.9);
            setIsDecorateMode(false);
            setGameState(p => (p ? { ...p, currentScene: 'town' } : null));
          }}
          onEnterInterior={handleEnterInterior}
          onExitInterior={handleExitInterior}
          onConsumeEnergy={handleConsumeEnergy}
          onPlaceFurnitureAt={handlePlaceFurnitureAt}
          onSelectPlaced={setSelectedPlacedId}
          onActionReward={awardAction}
          onInteractVendingMachine={handleOpenVendingMachine}
          onOpenStoreTab={tab => {
            sound.playChirp(1.0);
            setStoreTab(tab);
            setShowStoreModal(true);
          }}
        />
      </main>

      {/* House Customization Toolbar (active when inside house and Decorate mode on) */}
      {gameState.currentScene === 'house' && isDecorateMode && (
        <HouseCustomizer
          house={currentHouse}
          playerInventory={gameState.inventory}
          selectedPlacedId={selectedPlacedId}
          selectedCatalogItem={selectedCatalogItem}
          onSelectPlaced={setSelectedPlacedId}
          onSelectCatalogItem={setSelectedCatalogItem}
          onRotateSelected={handleRotateSelected}
          onRemoveFurniture={handleRemoveFurniture}
          onChangeFloor={handleChangeFloor}
          onChangeWall={handleChangeWall}
          onCloseDecorate={() => setIsDecorateMode(false)}
        />
      )}

      {/* NPC Dialogue Modal */}
      {activeDialogueNPC && (
        <DialogueModal
          npc={activeDialogueNPC}
          quests={gameState.quests}
          inventory={gameState.inventory}
          currentTimeHour={gameState.timeHour}
          onClose={() => setActiveDialogueNPC(null)}
          onAcceptQuest={handleAcceptQuest}
          onCompleteQuest={handleCompleteQuest}
          onOpenShop={handleOpenNPCShop}
          onGiveGift={handleGiveGift}
          onEarnCredits={(amount, reason) => awardAction(amount, 10, reason)}
        />
      )}

      {/* Terminal Hacking Minigame Modal */}
      {showHackingModal && (
        <HackingMinigameModal
          playerHackingLevel={gameState.stats.hacking}
          onSuccess={(credits, exp) => {
            setShowHackingModal(false);
            awardAction(credits, exp, 'Terminal Hack');

            // Check terminal quest
            setGameState(prev => {
              if (!prev) return null;
              const updatedQuests = prev.quests.map(q => {
                if (q.status === 'active' && q.type === 'hack') {
                  return { ...q, currentProgress: 1 };
                }
                return q;
              });
              return { ...prev, quests: updatedQuests };
            });
          }}
          onClose={() => setShowHackingModal(false)}
        />
      )}

      {/* Arcade Minigame Modal */}
      {showArcadeModal && (
        <ArcadeMinigameModal
          onWinCredits={(credits, exp) => {
            awardAction(credits, exp, 'Arcade High Score');
            setShowArcadeModal(false);
          }}
          onClose={() => setShowArcadeModal(false)}
        />
      )}

      {/* Stores Modal (Cosmetics, Furniture, Real Estate) */}
      {showStoreModal && (
        <StoresModal
          initialTab={storeTab}
          playerCredits={gameState.stats.credits}
          houses={gameState.houses}
          playerInventory={gameState.inventory}
          onClose={() => setShowStoreModal(false)}
          onBuyItem={handleBuyItem}
          onBuyFurniture={handleBuyFurniture}
          onBuyHouse={handleBuyHouse}
        />
      )}

      {/* Mission Log & Evolution Modal */}
      {showQuestsModal && (
        <QuestsModal
          quests={gameState.quests}
          stats={gameState.stats}
          onClose={() => setShowQuestsModal(false)}
          onCompleteQuest={handleCompleteQuest}
        />
      )}

      {/* Inventory & Wardrobe Modal */}
      {showInventoryModal && (
        <InventoryModal
          inventory={gameState.inventory}
          stats={gameState.stats}
          equippedCosmetics={gameState.equippedCosmetics}
          onClose={() => setShowInventoryModal(false)}
          onEquipCosmetic={handleEquipCosmetic}
          onUseConsumable={handleUseConsumable}
        />
      )}

      {/* Interactive Cyber Vending Machine Modal */}
      {showVendingModal && (
        <VendingMachineModal
          playerCredits={gameState.stats.credits}
          playerEnergy={gameState.stats.energy}
          playerMaxEnergy={gameState.stats.maxEnergy}
          initialCategory={vendingCategory}
          onClose={() => setShowVendingModal(false)}
          onBuyAndConsume={handleBuyAndConsumeVending}
          onBuyToInventory={handleBuyToInventoryVending}
        />
      )}

      {/* Morning Holo-Net News Feed & World Briefing Modal */}
      {showNewsFeedModal && (
        <NewsFeedModal
          day={gameState.day}
          weather={gameState.weather}
          stories={currentNewsStories}
          onClose={() => setShowNewsFeedModal(false)}
          stipendAmount={20}
        />
      )}

      {/* Neo-City Citizen Schedule Directory Modal */}
      {showScheduleModal && (
        <CityScheduleModal
          gameState={gameState}
          onClose={() => setShowScheduleModal(false)}
        />
      )}

      {/* Cinematic Sleep Cycle Transition Screen */}
      {isSleepingTransition && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center text-center p-4 animate-fade-in pointer-events-none">
          <div className="p-6 rounded-2xl bg-[#0f1424] border border-[#00f0ff]/40 shadow-[0_0_50px_rgba(0,240,255,0.25)] max-w-sm w-full space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#00f0ff]/20 border border-[#00f0ff] flex items-center justify-center text-[#00f0ff] animate-pulse">
              <span className="font-mono font-bold text-sm">ZZZ</span>
            </div>
            <div className="font-cyber font-bold text-base text-[#00f0ff] tracking-widest uppercase">
              ENTERING SLEEP CYCLE
            </div>
            <div className="text-xs font-mono text-slate-400 space-y-1.5 pt-1">
              <div className="text-emerald-400 font-semibold">⚡ RECHARGING BIO-METRIC RESERVES (100%)...</div>
              <div>SYNCHRONIZING NEURAL TELEMETRY</div>
              <div className="text-[#38bdf8]">FETCHING MORNING HOLO-NET BROADCAST...</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
