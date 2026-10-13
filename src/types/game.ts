export type OriginClass = 'netrunner' | 'mechanic' | 'alchemist' | 'courier';

export interface CharacterAppearance {
  name: string;
  gender: 'neutral' | 'fem' | 'masc';
  origin: OriginClass;
  skinTone: string; // color hex or key
  hairStyle: string; // 'pixie' | 'spiky' | 'dreads' | 'bob' | 'mohawk' | 'slick'
  hairColor: string; // hex
  implant: string; // 'none' | 'visor' | 'optic_ring' | 'neural_jack' | 'cyber_tattoo' | 'chrome_jaw'
  implantColor: string;
  outfitStyle: string; // 'duster' | 'bomber' | 'hoodie' | 'biosuit'
  outfitColor: string;
  droneCompanion: 'none' | 'holo_cat' | 'nano_drone' | 'spark_bot';
}

export interface PlayerStats {
  level: number;
  exp: number;
  maxExp: number;
  credits: number;
  energy: number;
  maxEnergy: number;
  hacking: number;
  engineering: number;
  synthBotany: number;
  streetCred: number;
  rankTitle: string; // 'Scrap Rat' | 'Script Kiddie' | 'Neon Runner' | 'Chrome Legend'
}

export type ItemType = 'cosmetic' | 'furniture' | 'seed' | 'consumable' | 'tech';

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  icon: string;
  value: number;
  slot?: 'hair' | 'outfit' | 'implant' | 'drone';
  cosmeticKey?: string;
  cosmeticColor?: string;
  furnitureId?: string;
  count: number;
}

export interface FurnitureDef {
  id: string;
  name: string;
  category: 'bed' | 'terminal' | 'plant' | 'lighting' | 'arcade' | 'decor' | 'seating';
  width: number; // tile grid size
  height: number;
  price: number;
  description: string;
  color: string;
  glowColor?: string;
  interactiveType?: 'bed' | 'arcade' | 'terminal' | 'plant';
}

export interface PlacedFurniture {
  instanceId: string;
  furnitureId: string;
  x: number; // grid coordinate
  y: number;
  rotation: 0 | 1 | 2 | 3;
}

export interface HouseProperty {
  id: string;
  name: string;
  tier: 'starter' | 'loft' | 'penthouse';
  price: number;
  description: string;
  gridWidth: number;
  gridHeight: number;
  owned: boolean;
  floorTheme: 'tatami' | 'hologrid' | 'darkmetal' | 'cyberwood' | 'goldchrome';
  wallTheme: 'brick_neon' | 'cyber_glass' | 'industrial' | 'synth_bamboo';
  placedFurniture: PlacedFurniture[];
}

export interface NPCScheduleSlot {
  startHour: number; // 0-23
  endHour: number; // 0-23 (if endHour < startHour, wraps midnight)
  timeLabel: string; // e.g. "06:00 - 12:00"
  period: 'morning' | 'afternoon' | 'evening' | 'night';
  locationName: string;
  district: string;
  x: number;
  y: number;
  activity: string;
  activityIcon: 'work' | 'eat' | 'rest' | 'commute' | 'study' | 'relax';
  contextDialogue: string[];
}

export interface NPC {
  id: string;
  name: string;
  role: string;
  locationName: string;
  x: number; // world tile coordinate
  y: number;
  portraitColor: string;
  portraitHair: string;
  portraitImplant: string;
  dialogueLines: string[];
  affinity: number; // 0 to 5 hearts
  currentQuestId?: string;
  avatarStyle: {
    skin: string;
    hair: string;
    hairStyle: string;
    outfit: string;
  };
  schedule?: NPCScheduleSlot[];
  currentActivity?: string;
}

export interface Quest {
  id: string;
  title: string;
  giverId: string;
  giverName: string;
  description: string;
  category: 'story' | 'bounty' | 'social';
  rewardCredits: number;
  rewardExp: number;
  rewardItemName?: string;
  status: 'available' | 'active' | 'completed';
  type: 'talk' | 'hack' | 'plant' | 'buy_cosmetic' | 'buy_house' | 'reach_rank';
  targetValue?: string | number;
  currentProgress: number;
  maxProgress: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  createdAt: number;
}

export interface WorldPlant {
  id: string;
  x: number;
  y: number;
  seedType: string;
  stage: number; // 0 to 2
  plantedTime: number;
  isReady: boolean;
}

export type WeatherType = 'neon_rain' | 'acid_fog' | 'cyber_clear' | 'glitch_storm';

export type GameDifficulty = 'easy' | 'normal' | 'hard';

export type TrafficLightState = 'avenue_green' | 'avenue_yellow' | 'boulevard_green' | 'boulevard_yellow';

export interface NPCEstablishment {
  id: string;
  npcId: string;
  name: string;
  tagline: string;
  exteriorEntrance: { x: number; y: number };
  interiorSize: { width: number; height: number };
  themeColor: string;
  placedFurniture: PlacedFurniture[];
}

export interface GameState {
  player: CharacterAppearance;
  stats: PlayerStats;
  inventory: InventoryItem[];
  equippedCosmetics: {
    hairStyle: string;
    hairColor: string;
    outfitStyle: string;
    outfitColor: string;
    implant: string;
    drone: string;
  };
  houses: HouseProperty[];
  currentHouseId: string;
  currentScene: 'town' | 'house' | 'interior';
  currentInteriorId?: string;
  difficulty?: GameDifficulty;
  day: number;
  timeHour: number; // 0-23
  timeMinute: number;
  weather: WeatherType;
  npcs: Record<string, NPC>;
  quests: Quest[];
  worldPlants: WorldPlant[];
  hackedTerminalsToday: string[];
  soundEnabled: boolean;
  musicEnabled: boolean;
  unlockedRanks: string[];
}

