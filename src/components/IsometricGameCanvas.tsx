import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  Camera,
  TILE_WIDTH,
  TILE_HEIGHT,
  isoToScreen,
  screenToIso,
  drawIsoTile,
  drawCharacter,
  drawFurniture,
  drawBuildingFacade,
  drawRain,
  drawWeatherOverlay,
  getWeatherAtmosphere,
  drawVolumetricLight,
  drawAcademyComplex,
  drawHackerKiosk,
  drawHoloLectureStage,
  drawCyberTree,
  drawCyberBench,
  drawSteamGrate,
  drawParkedHovercar,
  drawSurveillanceDrone,
  drawCyberStreetLamp,
  drawCyberVendingMachine,
  drawCampusSignpost,
  drawMovingTrafficVehicle,
  drawSkyscraperTower,
  drawMetroStation,
  drawHoloBillboard,
  drawTrafficLightSignal,
  drawPedestrianSkybridge,
  drawCyberFountain,
  drawTrashBinAndHydrant,
  applyChromaticAberration,
  drawCRTOverlay,
  TrafficVehicleType,
  TrafficDirection,
} from '../utils/pixelRenderer';
import {
  CharacterAppearance,
  FurnitureDef,
  GameState,
  HouseProperty,
  NPC,
  NPCEstablishment,
  NPCScheduleSlot,
  PlacedFurniture,
  FloatingText,
  WorldPlant,
  TrafficLightState,
} from '../types/game';
import { FURNITURE_CATALOG, getNPCScheduleForHour, NPC_ESTABLISHMENTS } from '../data/gameData';
import { sound } from '../utils/audio';

interface IsometricGameCanvasProps {
  gameState: GameState;
  isDecorateMode: boolean;
  selectedPlacedId: string | null;
  selectedCatalogItem: FurnitureDef | null;
  onInteractNPC: (npc: NPC) => void;
  onInteractTerminal: () => void;
  onInteractArcade: () => void;
  onInteractBed: () => void;
  onInteractPlant: () => void;
  onInteractRepairBot: () => void;
  onEnterHouse: (houseId?: string) => void;
  onExitHouse: () => void;
  onEnterInterior?: (interiorId: string) => void;
  onExitInterior?: () => void;
  onConsumeEnergy?: (amount: number, reason: string) => boolean;
  onPlaceFurnitureAt: (x: number, y: number) => void;
  onSelectPlaced: (instanceId: string | null) => void;
  onActionReward: (credits: number, exp: number, message: string) => void;
  onInteractVendingMachine: (category?: 'all' | 'drink' | 'snack') => void;
  onOpenStoreTab?: (tab: 'cosmetics' | 'furniture' | 'realty') => void;
}

interface CitizenWalker {
  id: string;
  name: string;
  x: number;
  y: number;
  dir: 'SE' | 'SW' | 'NE' | 'NW';
  speed: number;
  appearance: CharacterAppearance;
  greeting: string;
  pauseTicks: number;
  waypoints: Array<{ x: number; y: number }>;
  waypointIndex: number;
}

interface TrafficCar {
  id: string;
  lane: 'avenue_south' | 'avenue_north' | 'boulevard_east' | 'boulevard_west';
  x: number;
  y: number;
  speed: number;
  type: TrafficVehicleType;
  dir: TrafficDirection;
}

interface StoryNPCWalker {
  id: string;
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
  dir: 'SE' | 'SW' | 'NE' | 'NW';
  isWalking: boolean;
  speed: number;
  pauseTicks: number;
  currentSlot?: NPCScheduleSlot;
  statusMessage: string;
}

// ============================================================================
// PROCEDURAL GENERATION ENGINE (BSP Tree & PRNG)
// ============================================================================

const createPRNG = (seedStr: string) => {
  let h = 0xdeadbeef;
  for (let i = 0; i < seedStr.length; i++) h = Math.imul(h ^ seedStr.charCodeAt(i), 2654435761);
  let state = h;
  return () => {
    state = (state * 1664525 + 1013904223) | 0;
    return (state >>> 0) / 4294967296;
  };
};

interface CityLot { x: number; y: number; w: number; h: number; cx: number; cy: number; type: string; color?: string; }
interface CityInteractable { x: number; y: number; id: string; type: string; label: string; actionData?: any; }
interface CityMap {
  tiles: number[][]; 
  buildings: CityLot[];
  interactables: CityInteractable[];
  props: { x: number; y: number; type: string; color?: string }[];
  validWalkTiles: { x: number; y: number }[];
}

const TOWN_SIZE = 46;

function generateProceduralCity(seed: string): CityMap {
  const rng = createPRNG(seed);
  const tiles: number[][] = Array(TOWN_SIZE).fill(0).map(() => Array(TOWN_SIZE).fill(2));
  const validWalkTiles: { x: number; y: number }[] = [];
  
  for (let x = 0; x < TOWN_SIZE; x++) {
    for (let y = 0; y < TOWN_SIZE; y++) {
      const isAvenue = x >= 21 && x <= 24;
      const isBoulevard = y >= 21 && y <= 24;
      const isIntersection = isAvenue && isBoulevard;
      const isCrosswalk = (isAvenue && ((y >= 19 && y <= 20) || (y >= 25 && y <= 26))) || 
                          (isBoulevard && ((x >= 19 && x <= 20) || (x >= 25 && x <= 26)));
      
      if (isIntersection) tiles[x][y] = 0;
      else if (isCrosswalk) tiles[x][y] = 1;
      else if (isAvenue || isBoulevard) tiles[x][y] = 0;
    }
  }

  const getLots = (x: number, y: number, w: number, h: number): any[] => {
    if (w < 13 && h < 13) return [{ x, y, w, h }];
    let splitHoriz = rng() > 0.5;
    if (w > h * 1.4) splitHoriz = false;
    if (h > w * 1.4) splitHoriz = true;

    if (splitHoriz) {
      let splitY = Math.floor(rng() * (h - 10)) + 5;
      let t = getLots(x, y, w, splitY);
      let b = getLots(x, y + splitY + 2, w, h - splitY - 2);
      return [...t, ...b];
    } else {
      let splitX = Math.floor(rng() * (w - 10)) + 5;
      let l = getLots(x, y, splitX, h);
      let r = getLots(x + splitX + 2, y, w - splitX - 2, h);
      return [...l, ...r];
    }
  };

  const q1Lots = getLots(2, 2, 17, 17);
  const q2Lots = getLots(27, 2, 17, 17);
  const q3Lots = getLots(2, 27, 17, 17);
  const q4Lots = getLots(27, 27, 17, 17);
  const allLots = [...q1Lots, ...q2Lots, ...q3Lots, ...q4Lots];

  const uniqueFeatures = [
    { type: 'ramen', id: 'ramen_bistro', label: "Entrar: Bistrô de Ramen do Chef Bao", color: '#ef4444' },
    { type: 'clinic', id: 'ripperdoc_clinic', label: "Entrar: Clínica Ripperdoc do Dex", color: '#06b6d4' },
    { type: 'robotics', id: 'robotics_garage', label: "Entrar: Oficina de Drones da Sparks", color: '#f59e0b' },
    { type: 'netrunner', id: 'netrunner_den', label: "Entrar: Santuário Netrunner da Nyx", color: '#c084fc' },
    { type: 'haute', id: 'haute_boutique', label: "Entrar: Boutique de Luxo do Vane", color: '#ec4899' },
    { type: 'bazaar', id: 'furniture', label: "Glitch & Grind Bazaar (Móveis)", color: '#f59e0b' },
    { type: 'blackice', id: 'arcade', label: "The Black Ice Arcade (-10⚡)", color: '#c084fc' },
    { type: 'realty', id: 'realty', label: "Apex Real Estate (Imóveis)", color: '#eab308' },
    { type: 'greenhouse', id: 'greenhouse', label: "Colheita Flora-Synth (-10⚡, +45 CR)", color: '#10b981' },
    { type: 'metro', id: 'metro', label: "Neo-Metro Rapid Transit (+30⚡, +Exp)", color: '#00f0ff' },
    { type: 'academy', id: 'academy', label: "Enter Academy Residence", color: '#38bdf8' },
    { type: 'megapod', id: 'megapod', label: "Enter Capsule Residence", color: '#ef4444' },
    { type: 'fountain', id: 'fountain', label: "Meditar na Fonte Quântica (+25⚡)", color: '#00f0ff' },
    { type: 'kiosk', id: 'terminal', label: "Hack Workstation Alpha", color: '#ff2a85' },
    { type: 'kiosk', id: 'terminal', label: "Hack Workstation Beta", color: '#ff2a85' },
    { type: 'lecture', id: 'lecture', label: "Attend AI Holo-Lecture (+50 CR)", color: '#00f0ff' }
  ];

  for (let i = uniqueFeatures.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [uniqueFeatures[i], uniqueFeatures[j]] = [uniqueFeatures[j], uniqueFeatures[i]];
  }

  const buildings: CityLot[] = [];
  const interactables: CityInteractable[] = [];
  const props: { x: number; y: number; type: string; color?: string }[] = [];

  allLots.forEach(lot => {
    for (let lx = lot.x; lx < lot.x + lot.w; lx++) {
      for (let ly = lot.y; ly < lot.y + lot.h; ly++) tiles[lx][ly] = 10;
    }
    const cx = Math.floor(lot.x + lot.w / 2);
    const cy = Math.floor(lot.y + lot.h / 2);
    const feature = uniqueFeatures.pop() || { type: 'generic', id: '', label: '', color: '#1e293b' };
    
    buildings.push({ ...lot, cx, cy, type: feature.type, color: feature.color });

    if (feature.id) {
      interactables.push({ x: cx, y: cy, id: feature.id, type: feature.type, label: feature.label });
    }
  });

  const lampColors = ['#00f0ff', '#ff2a85', '#f59e0b', '#a855f7'];
  for (let x = 2; x < TOWN_SIZE - 2; x++) {
    for (let y = 2; y < TOWN_SIZE - 2; y++) {
      if (tiles[x][y] === 2) {
        const isAlley = tiles[x-1][y] === 10 && tiles[x+1][y] === 10 || tiles[x][y-1] === 10 && tiles[x][y+1] === 10;
        if (isAlley) tiles[x][y] = 3;
        
        validWalkTiles.push({ x, y });

        if (tiles[x][y] === 3 && rng() < 0.04) {
          props.push({ x, y, type: 'steam' });
        } else if (tiles[x][y] === 2 && rng() < 0.02) {
          props.push({ x, y, type: 'lamp', color: lampColors[Math.floor(rng() * lampColors.length)] });
        } else if (tiles[x][y] === 2 && rng() < 0.015) {
          props.push({ x, y, type: 'bench' });
        } else if (tiles[x][y] === 2 && rng() < 0.01) {
          props.push({ x, y, type: 'vending', color: rng() > 0.5 ? 'drinks' : 'snacks' });
          interactables.push({ x, y, id: 'vending', type: 'vending', label: "Open Cyber-Dispenser" });
        }
      }
    }
  }

  const walkTile1 = validWalkTiles[Math.floor(rng() * validWalkTiles.length)];
  if (walkTile1) {
    interactables.push({ x: walkTile1.x, y: walkTile1.y, id: 'repair', type: 'repair', label: "Reparar Drone (-15⚡)" });
    props.push({ x: walkTile1.x, y: walkTile1.y, type: 'drone' });
  }

  const walkTile2 = validWalkTiles[Math.floor(rng() * validWalkTiles.length)];
  if (walkTile2) {
    props.push({ x: walkTile2.x, y: walkTile2.y, type: 'signpost' });
  }

  return { tiles, buildings, interactables, props, validWalkTiles };
}

// ============================================================================
// COMPONENTE PRINCIPAL (REACT)
// ============================================================================

export const IsometricGameCanvas: React.FC<IsometricGameCanvasProps> = (props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const propsRef = useRef(props);
  useEffect(() => {
    propsRef.current = props;
  }, [props]);

  const seed = props.gameState?.player?.name || 'Neopolis';
  const cityMap = useMemo(() => generateProceduralCity(seed), [seed]);

  const playerRef = useRef({
    x: props.gameState?.currentScene === 'town' ? 10 : 3,
    y: props.gameState?.currentScene === 'town' ? 10 : 3,
    dir: 'SE' as 'SE' | 'SW' | 'NE' | 'NW',
    isMoving: false,
  });

  const floatingTextsRef = useRef<FloatingText[]>([]);
  const [nearbyPrompt, setNearbyPrompt] = useState<{text: string; action: () => void; x: number; y: number;} | null>(null);
  const currentPromptRef = useRef<{text: string; action: () => void; x: number; y: number;} | null>(null);
  const [uiCoords, setUiCoords] = useState({ x: playerRef.current.x, y: playerRef.current.y });
  const lastFloorCoordsRef = useRef({ x: Math.floor(playerRef.current.x), y: Math.floor(playerRef.current.y) });

  const cameraRef = useRef<Camera>({ x: 0, y: 0, zoom: 1 });
  const mouseIsoRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const keysPressed = useRef<Set<string>>(new Set());

  const lastTimeRef = useRef<number>(0);
  const tickRef = useRef<number>(0);
  
  const ripplesRef = useRef<{ x: number; y: number; progress: number }[]>([]);
  const lightningFlashRef = useRef<number>(0);
  const nextLightningTimeRef = useRef<number>(Date.now() + 3500);
  const lastStepSoundTimeRef = useRef<number>(0);

  const storyNPCWalkersRef = useRef<Record<string, StoryNPCWalker>>({});

  const trafficVehiclesRef = useRef<TrafficCar[]>([
    { id: 't1', lane: 'avenue_south', x: 21.5, y: 2, speed: 0.11, type: 'taxi', dir: 'SE' },
    { id: 't2', lane: 'avenue_south', x: 21.5, y: 22, speed: 0.14, type: 'speeder', dir: 'SE' },
    { id: 't3', lane: 'avenue_north', x: 23.5, y: 44, speed: 0.12, type: 'patrol', dir: 'NW' },
    { id: 't4', lane: 'avenue_north', x: 23.5, y: 16, speed: 0.09, type: 'cargo', dir: 'NW' },
    { id: 't5', lane: 'boulevard_east', x: 3, y: 21.5, speed: 0.12, type: 'taxi', dir: 'SW' },
    { id: 't6', lane: 'boulevard_east', x: 28, y: 21.5, speed: 0.10, type: 'cargo', dir: 'SW' },
    { id: 't7', lane: 'boulevard_west', x: 42, y: 23.5, speed: 0.15, type: 'speeder', dir: 'NE' },
    { id: 't8', lane: 'boulevard_west', x: 18, y: 23.5, speed: 0.12, type: 'patrol', dir: 'NE' },
  ]);

  const citizensRef = useRef<CitizenWalker[]>([]);
  useEffect(() => {
    const rng = createPRNG(seed + "_citizens");
    const getWalkTile = () => cityMap.validWalkTiles[Math.floor(rng() * cityMap.validWalkTiles.length)] || { x: 10, y: 10 };
    
    const baseCits = [
      { name: 'Cipher', gender: 'neutral', origin: 'netrunner', hairColor: '#00f0ff', outfitColor: '#1e1b4b', greeting: 'Cipher: "Watch the crosswalks!"' },
      { name: 'Kira', gender: 'fem', origin: 'courier', hairColor: '#ff2a85', outfitColor: '#f43f5e', greeting: 'Kira: "Best fuel in District 1!"' },
      { name: 'Zero', gender: 'masc', origin: 'mechanic', hairColor: '#facc15', outfitColor: '#0f172a', greeting: 'Zero: "Glitch & Grind got a shipment..."' },
      { name: 'Vex', gender: 'neutral', origin: 'netrunner', hairColor: '#a855f7', outfitColor: '#090d16', greeting: 'Vex: "Late to the Academy lecture again!"' },
      { name: 'Aero', gender: 'masc', origin: 'courier', hairColor: '#38bdf8', outfitColor: '#0284c7', greeting: 'Aero: "5 minutes on the clock!"' },
      { name: 'Lyra', gender: 'fem', origin: 'alchemist', hairColor: '#10b981', outfitColor: '#064e3b', greeting: 'Lyra: "High biocell density today."' },
      { name: 'Shin', gender: 'masc', origin: 'mechanic', hairColor: '#f97316', outfitColor: '#7c2d12', greeting: 'Shin: "Maintenance drones are ionized."' },
      { name: 'Rook', gender: 'masc', origin: 'mechanic', hairColor: '#ef4444', outfitColor: '#18181b', greeting: 'Rook: "Capsule Pod 404 is tight."' },
      { name: 'Maya', gender: 'fem', origin: 'netrunner', hairColor: '#c084fc', outfitColor: '#312e81', greeting: 'Maya: "Incredible view of the highway."' },
      { name: 'Tate', gender: 'neutral', origin: 'courier', hairColor: '#00f0ff', outfitColor: '#0f172a', greeting: 'Tate: "Next train in 2 minutes."' },
      { name: 'Orion', gender: 'masc', origin: 'alchemist', hairColor: '#22c55e', outfitColor: '#064e3b', greeting: 'Orion: "Fountain is charged by the grid."' },
      { name: 'Echo', gender: 'fem', origin: 'netrunner', hairColor: '#f43f5e', outfitColor: '#881337', greeting: 'Echo: "Running Arasaka stock updates."' },
    ];

    citizensRef.current = baseCits.map((base, i) => {
      const start = getWalkTile();
      return {
        id: `cit_${i}`,
        name: base.name,
        x: start.x, y: start.y,
        dir: 'SE', speed: 0.035 + rng() * 0.02,
        pauseTicks: Math.floor(rng() * 30),
        waypointIndex: 0,
        waypoints: [start, getWalkTile(), getWalkTile(), getWalkTile()],
        appearance: { 
          name: base.name, gender: base.gender as any, origin: base.origin as any, skinTone: '#fed7aa',
          hairStyle: 'slick', hairColor: base.hairColor, implant: 'visor', implantColor: base.hairColor,
          outfitStyle: 'bomber', outfitColor: base.outfitColor, droneCompanion: 'none'
        },
        greeting: base.greeting
      };
    });
  }, [seed, cityMap]);

  const addFloatingText = useCallback((text: string, color = '#38bdf8') => {
    floatingTextsRef.current.push({
      id: Math.random().toString(), text, x: playerRef.current.x, y: playerRef.current.y, color, createdAt: Date.now(),
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      keysPressed.current.add(e.key.toLowerCase());
      if (e.key === 'e' || e.key === 'E' || e.key === ' ') {
        if (currentPromptRef.current) {
          e.preventDefault();
          currentPromptRef.current.action();
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => keysPressed.current.delete(e.key.toLowerCase());

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, []);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const gameLoop = (time: number) => {
      try {
        if (lastTimeRef.current === 0) { lastTimeRef.current = time; return; }
        
        let dt = (time - lastTimeRef.current) / 1000;
        lastTimeRef.current = time;
        if (dt > 0.1) dt = 0.016;
        if (dt <= 0) dt = 0.001;

        const timeScale = dt * 60; 
        tickRef.current += 0.035 * timeScale;
        const tick = tickRef.current;
        const now = Date.now();

        const pProps = propsRef.current;
        const { gameState } = pProps;
        if (!gameState) return;

        const currentHouse = gameState.houses?.find(h => h.id === gameState.currentHouseId) || gameState.houses?.[0];

        floatingTextsRef.current = floatingTextsRef.current.filter(t => now - t.createdAt < 1800);

        if (gameState.weather === 'neon_rain' || gameState.weather === 'glitch_storm') {
          if (Math.random() < (gameState.weather === 'glitch_storm' ? 0.35 : 0.2) * timeScale) {
            ripplesRef.current.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, progress: 0 });
          }
          ripplesRef.current.forEach(r => { r.progress += 0.045 * timeScale; });
          ripplesRef.current = ripplesRef.current.filter(r => r.progress < 1.0);
        } else { ripplesRef.current = []; }

        if (gameState.weather === 'glitch_storm') {
          if (now > nextLightningTimeRef.current) {
            lightningFlashRef.current = 1.0;
            nextLightningTimeRef.current = now + 3500 + Math.random() * 4500;
          } else {
            lightningFlashRef.current = Math.max(0, lightningFlashRef.current - 0.07 * timeScale);
          }
        } else { lightningFlashRef.current = 0; }

        let dx = 0; let dy = 0; const speed = 0.085 * timeScale;
        if (keysPressed.current.has('w') || keysPressed.current.has('arrowup')) { dx -= speed; dy -= speed; }
        if (keysPressed.current.has('s') || keysPressed.current.has('arrowdown')) { dx += speed; dy += speed; }
        if (keysPressed.current.has('a') || keysPressed.current.has('arrowleft')) { dx -= speed; dy += speed; }
        if (keysPressed.current.has('d') || keysPressed.current.has('arrowright')) { dx += speed; dy -= speed; }

        const isWalking = dx !== 0 || dy !== 0;
        playerRef.current.isMoving = isWalking;

        if (isWalking) {
          if (now - lastStepSoundTimeRef.current > 320) { sound.playStep(); lastStepSoundTimeRef.current = now; }
          if (dx > 0 && dy >= 0) playerRef.current.dir = 'SE';
          else if (dx < 0 && dy <= 0) playerRef.current.dir = 'NW';
          else if (dy > 0 && dx <= 0) playerRef.current.dir = 'SW';
          else if (dy < 0 && dx >= 0) playerRef.current.dir = 'NE';

          let nextX = playerRef.current.x + dx; let nextY = playerRef.current.y + dy;
          if (gameState.currentScene === 'town') {
            nextX = Math.max(1, Math.min(TOWN_SIZE - 2, nextX));
            nextY = Math.max(1, Math.min(TOWN_SIZE - 2, nextY));
          } else if (gameState.currentScene === 'interior') {
            const est = NPC_ESTABLISHMENTS[gameState.currentInteriorId || 'ramen_bistro'];
            const maxW = est ? est.interiorSize.width : 8; const maxH = est ? est.interiorSize.height : 8;
            nextX = Math.max(0.5, Math.min(maxW - 0.8, nextX));
            nextY = Math.max(0.5, Math.min(maxH - 0.8, nextY));
          } else if (currentHouse) {
            nextX = Math.max(0.5, Math.min(currentHouse.gridWidth - 0.8, nextX));
            nextY = Math.max(0.5, Math.min(currentHouse.gridHeight - 0.8, nextY));
          }
          playerRef.current.x = nextX; playerRef.current.y = nextY;
        }

        const playerScreen = {
          x: (playerRef.current.x - playerRef.current.y) * (TILE_WIDTH / 2),
          y: (playerRef.current.x + playerRef.current.y) * (TILE_HEIGHT / 2),
        };
        cameraRef.current.x += (playerScreen.x - cameraRef.current.x) * (0.1 * timeScale);
        cameraRef.current.y += (playerScreen.y - cameraRef.current.y) * (0.1 * timeScale);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const atmosphere = getWeatherAtmosphere(gameState.weather, gameState.timeHour);
        const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGrad.addColorStop(0, atmosphere.skyGradTop);
        skyGrad.addColorStop(1, atmosphere.skyGradBottom);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (gameState.weather === 'cyber_clear') {
          ctx.fillStyle = '#ffffff';
          for (let i = 0; i < 40; i++) {
            const sx = ((i * 137) % canvas.width); const sy = ((i * 89) % Math.max(120, canvas.height * 0.45));
            const twinkle = (Math.sin(tick * 2 + i) + 1) / 2;
            ctx.globalAlpha = 0.2 + twinkle * 0.65;
            ctx.fillRect(sx, sy, 1.5, 1.5);
          }
          ctx.globalAlpha = 1.0;
        }

        let trafficState: TrafficLightState = 'avenue_green';
        if (gameState.currentScene === 'town') {
          const trafficSec = (now / 1000) % 16;
          if (trafficSec < 6) trafficState = 'avenue_green';
          else if (trafficSec < 8) trafficState = 'avenue_yellow';
          else if (trafficSec < 14) trafficState = 'boulevard_green';
          else trafficState = 'boulevard_yellow';

          const isAvenueOpen = trafficState === 'avenue_green';
          const isBoulevardOpen = trafficState === 'boulevard_green';

          trafficVehiclesRef.current.forEach(veh => {
            let shouldStop = false; const adjustedSpeed = veh.speed * timeScale;
            if (veh.lane === 'avenue_south') {
              if (!isAvenueOpen && veh.y >= 17.5 && veh.y <= 20.2) shouldStop = true;
              if (trafficVehiclesRef.current.find(o => o.id !== veh.id && o.lane === 'avenue_south' && o.y > veh.y && o.y - veh.y < 4.0)) shouldStop = true;
              if (!shouldStop) { veh.y += adjustedSpeed; if (veh.y > TOWN_SIZE + 2) veh.y = -2; }
            } else if (veh.lane === 'avenue_north') {
              if (!isAvenueOpen && veh.y <= 27.5 && veh.y >= 24.8) shouldStop = true;
              if (trafficVehiclesRef.current.find(o => o.id !== veh.id && o.lane === 'avenue_north' && o.y < veh.y && veh.y - o.y < 4.0)) shouldStop = true;
              if (!shouldStop) { veh.y -= adjustedSpeed; if (veh.y < -2) veh.y = TOWN_SIZE + 2; }
            } else if (veh.lane === 'boulevard_east') {
              if (!isBoulevardOpen && veh.x >= 17.5 && veh.x <= 20.2) shouldStop = true;
              if (trafficVehiclesRef.current.find(o => o.id !== veh.id && o.lane === 'boulevard_east' && o.x > veh.x && o.x - veh.x < 4.0)) shouldStop = true;
              if (!shouldStop) { veh.x += adjustedSpeed; if (veh.x > TOWN_SIZE + 2) veh.x = -2; }
            } else if (veh.lane === 'boulevard_west') {
              if (!isBoulevardOpen && veh.x <= 27.5 && veh.x >= 24.8) shouldStop = true;
              if (trafficVehiclesRef.current.find(o => o.id !== veh.id && o.lane === 'boulevard_west' && o.x < veh.x && veh.x - o.x < 4.0)) shouldStop = true;
              if (!shouldStop) { veh.x -= adjustedSpeed; if (veh.x < -2) veh.x = TOWN_SIZE + 2; }
            }
          });

          citizensRef.current.forEach(cit => {
            if (cit.pauseTicks > 0) { cit.pauseTicks -= timeScale; return; }
            const target = cit.waypoints[cit.waypointIndex];
            const dist = Math.hypot(target.x - cit.x, target.y - cit.y);

            const wantsToCrossAvenue = ((cit.x <= 20.8 && target.x > 20.8) || (cit.x >= 24.2 && target.x < 24.2)) && ((cit.y >= 18.5 && cit.y <= 21) || (cit.y >= 24.5 && cit.y <= 27));
            if (wantsToCrossAvenue && (trafficState === 'avenue_green' || trafficState === 'avenue_yellow')) { cit.pauseTicks = 20; return; }
            const wantsToCrossBoulevard = ((cit.y <= 20.8 && target.y > 20.8) || (cit.y >= 24.2 && target.y < 24.2)) && ((cit.x >= 18.5 && cit.x <= 21) || (cit.x >= 24.5 && cit.x <= 27));
            if (wantsToCrossBoulevard && (trafficState === 'boulevard_green' || trafficState === 'boulevard_yellow')) { cit.pauseTicks = 20; return; }

            if (dist < 0.25) {
              cit.waypointIndex = (cit.waypointIndex + 1) % cit.waypoints.length;
              cit.pauseTicks = Math.floor(35 + Math.random() * 45);
            } else {
              const angle = Math.atan2(target.y - cit.y, target.x - cit.x);
              const cdx = Math.cos(angle) * cit.speed * timeScale;
              const cdy = Math.sin(angle) * cit.speed * timeScale;
              cit.x += cdx; cit.y += cdy;
              if (cdx > 0 && cdy >= 0) cit.dir = 'SE'; else if (cdx < 0 && cdy <= 0) cit.dir = 'NW'; else if (cdy > 0 && cdx <= 0) cit.dir = 'SW'; else if (cdy < 0 && cdx >= 0) cit.dir = 'NE';
            }
          });

          Object.values(gameState.npcs || {}).forEach(npc => {
            if (!npc) return;
            let walker = storyNPCWalkersRef.current[npc.id];
            const slot = getNPCScheduleForHour(npc, gameState.timeHour);
            const targetX = slot ? slot.x : npc.x;
            const targetY = slot ? slot.y : npc.y;

            if (!walker) {
              walker = { id: npc.id, currentX: targetX, currentY: targetY, targetX: targetX, targetY: targetY, dir: 'SE', isWalking: false, speed: 0.045, pauseTicks: 0, currentSlot: slot, statusMessage: slot?.activity || npc.role };
              storyNPCWalkersRef.current[npc.id] = walker;
            } else {
              if (walker.targetX !== targetX || walker.targetY !== targetY) { walker.targetX = targetX; walker.targetY = targetY; walker.currentSlot = slot; }
            }
            const cdx = walker.targetX - walker.currentX;
            const cdy = walker.targetY - walker.currentY;
            const dist = Math.hypot(cdx, cdy);
            if (dist > 0.18) {
              walker.isWalking = true;
              const step = Math.min(dist, walker.speed * timeScale);
              walker.currentX += (cdx / dist) * step;
              walker.currentY += (cdy / dist) * step;
              if (cdx > 0 && cdy >= 0) walker.dir = 'SE'; else if (cdx < 0 && cdy <= 0) walker.dir = 'NW'; else if (cdy > 0 && cdx <= 0) walker.dir = 'SW'; else if (cdy < 0 && cdx >= 0) walker.dir = 'NE';
              walker.statusMessage = `Heading to ${slot?.locationName || 'destination'}`;
            } else {
              walker.isWalking = false;
              walker.currentX = walker.targetX;
              walker.currentY = walker.targetY;
              walker.statusMessage = slot?.activity || npc.role;
            }
          });
        }

        if (gameState.currentScene === 'town') {
          for (let x = 0; x < TOWN_SIZE; x++) {
            for (let y = 0; y < TOWN_SIZE; y++) {
              const screen = isoToScreen(x, y, cameraRef.current, canvas.width, canvas.height);
              if (screen.x < -64 || screen.x > canvas.width + 64 || screen.y < -64 || screen.y > canvas.height + 64) continue;
              
              const tileType = cityMap.tiles[x][y];
              let fillColor = '#101524'; let strokeColor = 'rgba(28, 38, 59, 0.45)';
              
              if (gameState.weather === 'acid_fog') { fillColor = '#0d1611'; strokeColor = 'rgba(163, 230, 53, 0.16)'; } 
              else if (gameState.weather === 'neon_rain' || gameState.weather === 'glitch_storm') { fillColor = '#080d1a'; strokeColor = 'rgba(0, 240, 255, 0.2)'; }

              if (tileType === 0) { 
                fillColor = '#080c18'; strokeColor = 'rgba(30, 41, 59, 0.35)';
                drawIsoTile(ctx, screen.x, screen.y, fillColor, strokeColor);
                if ((x === 22 || x === 23) && y % 3 === 0) drawIsoTile(ctx, screen.x, screen.y, 'rgba(0, 240, 255, 0.35)', '#00f0ff');
                else if ((y === 22 || y === 23) && x % 3 === 0) drawIsoTile(ctx, screen.x, screen.y, 'rgba(245, 158, 11, 0.35)', '#f59e0b');
              } else if (tileType === 1) { 
                drawIsoTile(ctx, screen.x, screen.y, '#080c18', 'rgba(30, 41, 59, 0.35)');
                if ((x + y) % 2 === 0) drawIsoTile(ctx, screen.x, screen.y, 'rgba(0, 240, 255, 0.55)', '#00f0ff');
              } else {
                if (tileType === 3) { fillColor = '#0f172a'; strokeColor = 'rgba(168, 85, 247, 0.15)'; } 
                else if (tileType >= 10) { fillColor = (x + y) % 2 === 0 ? '#141a2c' : '#111625'; strokeColor = 'rgba(0, 240, 255, 0.15)'; } 
                
                drawIsoTile(ctx, screen.x, screen.y, fillColor, strokeColor);
                if ((gameState.weather === 'neon_rain' || gameState.weather === 'glitch_storm') && (x + y) % 4 === 0) {
                  const sheen = (Math.sin(tick * 3.5 + x * 2 + y) + 1) / 2;
                  drawIsoTile(ctx, screen.x, screen.y, `rgba(0, 240, 255, ${0.08 + sheen * 0.16})`);
                }
              }
            }
          }
        } else if (gameState.currentScene === 'interior') {
          const est = NPC_ESTABLISHMENTS[gameState.currentInteriorId || 'ramen_bistro'];
          const gw = est ? est.interiorSize.width : 8;
          const gh = est ? est.interiorSize.height : 8;
          for (let x = 0; x < gw; x++) {
            for (let y = 0; y < gh; y++) {
              const screen = isoToScreen(x, y, cameraRef.current, canvas.width, canvas.height);
              let fillColor = '#101524'; let strokeColor = 'rgba(28, 38, 59, 0.45)';
              if (est?.id === 'ramen_bistro') { fillColor = (x + y) % 2 === 0 ? '#261214' : '#1a0b0d'; strokeColor = 'rgba(239, 68, 68, 0.4)'; }
              else if (est?.id === 'ripperdoc_clinic') { fillColor = (x + y) % 2 === 0 ? '#0b1928' : '#08121f'; strokeColor = 'rgba(0, 240, 255, 0.35)'; }
              else if (est?.id === 'robotics_garage') { fillColor = (x + y) % 2 === 0 ? '#241a0d' : '#1a1309'; strokeColor = 'rgba(245, 158, 11, 0.4)'; }
              else if (est?.id === 'netrunner_den') { fillColor = (x + y) % 2 === 0 ? '#1b0e2b' : '#130920'; strokeColor = 'rgba(168, 85, 247, 0.45)'; }
              else if (est?.id === 'haute_boutique') { fillColor = (x + y) % 2 === 0 ? '#260e1d' : '#1c0915'; strokeColor = 'rgba(236, 72, 153, 0.4)'; }
              drawIsoTile(ctx, screen.x, screen.y, fillColor, strokeColor);
            }
          }
        } else if (currentHouse) {
          for (let x = 0; x < currentHouse.gridWidth; x++) {
            for (let y = 0; y < currentHouse.gridHeight; y++) {
              const screen = isoToScreen(x, y, cameraRef.current, canvas.width, canvas.height);
              let fillColor = '#1e293b'; let strokeColor = 'rgba(51, 65, 85, 0.5)';
              if (currentHouse.floorTheme === 'tatami') { fillColor = (x + y) % 2 === 0 ? '#3f382b' : '#332d22'; strokeColor = '#574c38'; }
              else if (currentHouse.floorTheme === 'hologrid') { fillColor = '#0b192c'; strokeColor = 'rgba(6, 182, 212, 0.45)'; }
              else if (currentHouse.floorTheme === 'cyberwood') { fillColor = (x + y) % 2 === 0 ? '#271c19' : '#1f1513'; strokeColor = '#452c25'; }
              else if (currentHouse.floorTheme === 'goldchrome') { fillColor = (x + y) % 2 === 0 ? '#3b2f0e' : '#2b2207'; strokeColor = 'rgba(234, 179, 8, 0.4)'; }
              if (pProps.isDecorateMode && Math.floor(mouseIsoRef.current.x) === x && Math.floor(mouseIsoRef.current.y) === y) { fillColor = 'rgba(6, 182, 212, 0.4)'; strokeColor = '#06b6d4'; }
              drawIsoTile(ctx, screen.x, screen.y, fillColor, strokeColor);
            }
          }
        }

        interface DepthItem { depth: number; draw: () => void; }
        const renderQueue: DepthItem[] = [];

        if (gameState.currentScene === 'town') {
          
          cityMap.buildings.forEach(b => {
            renderQueue.push({
              depth: b.cx + b.cy,
              draw: () => {
                const s = isoToScreen(b.cx, b.cy, cameraRef.current, canvas.width, canvas.height);
                if (b.type === 'academy') drawAcademyComplex(ctx, s.x, s.y, tick, 1);
                else if (b.type === 'megapod') drawSkyscraperTower(ctx, s.x, s.y, 'ARASAKA MEGAPOD', 5, tick, 1, '#ef4444');
                else if (b.type === 'metro') drawMetroStation(ctx, s.x, s.y, tick, 1);
                else if (b.type === 'fountain') drawCyberFountain(ctx, s.x, s.y, tick, 1);
                else if (b.type === 'kiosk') drawHackerKiosk(ctx, s.x, s.y, tick, 1, true);
                else if (b.type === 'lecture') drawHoloLectureStage(ctx, s.x, s.y, tick, 1);
                else if (['ramen', 'clinic', 'bazaar', 'blackice', 'realty', 'greenhouse'].includes(b.type)) {
                  drawBuildingFacade(ctx, s.x, s.y, b.type as any, 1);
                  drawVolumetricLight(ctx, s.x, s.y - 30, 45, `${b.color}40`, gameState.weather);
                }
                else drawSkyscraperTower(ctx, s.x, s.y, 'CORP TOWER', 3, tick, 1, b.color);
              }
            });
          });

          cityMap.props.forEach(p => {
            renderQueue.push({
              depth: p.x + p.y,
              draw: () => {
                const s = isoToScreen(p.x, p.y, cameraRef.current, canvas.width, canvas.height);
                if (p.type === 'steam') drawSteamGrate(ctx, s.x, s.y, tick, 1);
                else if (p.type === 'lamp') drawCyberStreetLamp(ctx, s.x, s.y, tick, 1, p.color);
                else if (p.type === 'bench') drawCyberBench(ctx, s.x, s.y, false, tick, 1);
                else if (p.type === 'vending') {
                  drawVolumetricLight(ctx, s.x, s.y - 20, 35, 'rgba(0, 240, 255, 0.28)', gameState.weather);
                  drawCyberVendingMachine(ctx, s.x, s.y, tick, 1, p.color as any);
                }
                else if (p.type === 'drone') drawSurveillanceDrone(ctx, s.x, s.y - 32, tick, 1);
                else if (p.type === 'signpost') drawCampusSignpost(ctx, s.x, s.y, tick, 1);
              }
            });
          });

          renderQueue.push({ depth: 9 + 28, draw: () => { const s = isoToScreen(9, 28, cameraRef.current, canvas.width, canvas.height); drawPedestrianSkybridge(ctx, s.x, s.y, tick, 1); } });
          renderQueue.push({ depth: 42 + 32, draw: () => { const s = isoToScreen(42, 32, cameraRef.current, canvas.width, canvas.height); drawHoloBillboard(ctx, s.x, s.y, tick, 1); } });

          const trafficSecNow = (now / 1000) % 16;
          const avenueLightNow = trafficSecNow < 6 ? 'green' : trafficSecNow < 8 ? 'yellow' : 'red';
          const boulevardLightNow = (trafficSecNow >= 8 && trafficSecNow < 14) ? 'green' : (trafficSecNow >= 14 ? 'yellow' : 'red');
          const avenueWalk = boulevardLightNow === 'green';
          const boulevardWalk = avenueLightNow === 'green';

          [{ x: 20, y: 20, l1: avenueLightNow, w: boulevardWalk }, { x: 25, y: 20, l1: boulevardLightNow, w: avenueWalk }, { x: 20, y: 25, l1: boulevardLightNow, w: avenueWalk }, { x: 25, y: 25, l1: avenueLightNow, w: boulevardWalk }].forEach(post => {
            renderQueue.push({ depth: post.x + post.y, draw: () => { const s = isoToScreen(post.x, post.y, cameraRef.current, canvas.width, canvas.height); drawTrafficLightSignal(ctx, s.x, s.y, post.l1 as any, post.w, 1); } });
          });

          trafficVehiclesRef.current.forEach(veh => {
            renderQueue.push({ depth: veh.x + veh.y, draw: () => { const s = isoToScreen(veh.x, veh.y, cameraRef.current, canvas.width, canvas.height); drawMovingTrafficVehicle(ctx, s.x, s.y, veh.type, veh.dir, tick, 1); } });
          });

          citizensRef.current.forEach(cit => {
            renderQueue.push({ depth: cit.x + cit.y, draw: () => { const s = isoToScreen(cit.x, cit.y, cameraRef.current, canvas.width, canvas.height); drawCharacter(ctx, s.x, s.y, cit.appearance, cit.dir, cit.pauseTicks <= 0, tick, 1); } });
          });

          Object.values(gameState.npcs || {}).forEach(npc => {
            if (!npc) return;
            const walker = storyNPCWalkersRef.current[npc.id] || { id: npc.id, currentX: npc.x, currentY: npc.y, targetX: npc.x, targetY: npc.y, dir: 'SE', isWalking: false, speed: 0.045, pauseTicks: 0, currentSlot: getNPCScheduleForHour(npc, gameState.timeHour), statusMessage: npc.role };
            const posX = walker.currentX; const posY = walker.currentY;

            renderQueue.push({
              depth: posX + posY,
              draw: () => {
                const s = isoToScreen(posX, posY, cameraRef.current, canvas.width, canvas.height);
                drawCharacter(ctx, s.x, s.y, { 
                  name: npc.name?.split(' ')[0] || 'NPC', skinTone: npc.avatarStyle?.skin || '#fbcfe8', 
                  hairStyle: npc.avatarStyle?.hairStyle || 'slick', hairColor: npc.avatarStyle?.hair || '#00f0ff', 
                  implant: npc.portraitImplant || 'visor', implantColor: npc.portraitColor || '#00f0ff', 
                  outfitStyle: npc.avatarStyle?.outfit || 'duster', outfitColor: npc.portraitColor || '#0f172a' 
                }, walker.dir, walker.isWalking, tick, 1);

                const distToPlayer = Math.hypot(playerRef.current.x - posX, playerRef.current.y - posY);
                if (distToPlayer < 7.5) {
                  ctx.save();
                  ctx.font = 'bold 9px monospace';
                  const nameText = npc.name?.split(' ')[0] || 'NPC';
                  const roleText = walker.isWalking ? '🚶 Commuting' : (walker.currentSlot ? walker.currentSlot.timeLabel : npc.role);
                  ctx.textAlign = 'center';
                  const badgeWidth = Math.max(ctx.measureText(nameText).width, ctx.measureText(roleText).width) + 16;
                  const badgeY = s.y - 48;

                  ctx.fillStyle = 'rgba(6, 11, 25, 0.88)';
                  ctx.strokeStyle = walker.isWalking ? '#f59e0b' : (npc.portraitColor || '#00f0ff');
                  ctx.lineWidth = 1; ctx.beginPath();
                  ctx.roundRect(s.x - badgeWidth / 2, badgeY - 12, badgeWidth, 20, 4);
                  ctx.fill(); ctx.stroke();
                  ctx.fillStyle = npc.portraitColor || '#00f0ff';
                  ctx.fillText(nameText, s.x, badgeY - 2);
                  ctx.font = '7.5px monospace';
                  ctx.fillStyle = walker.isWalking ? '#fbbf24' : '#94a3b8';
                  ctx.fillText(roleText, s.x, badgeY + 6);

                  if (distToPlayer < 3.5 && walker.currentSlot) {
                    const actText = walker.isWalking ? `En route: ${walker.currentSlot.locationName}` : walker.currentSlot.activity;
                    ctx.font = '8px monospace';
                    const actWidth = ctx.measureText(actText).width + 12; const bubbleY = s.y - 70;
                    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)'; ctx.strokeStyle = '#00f0ff';
                    ctx.lineWidth = 1; ctx.beginPath();
                    ctx.roundRect(s.x - actWidth / 2, bubbleY - 9, actWidth, 16, 4);
                    ctx.fill(); ctx.stroke();
                    ctx.fillStyle = '#00f0ff'; ctx.fillText(actText, s.x, bubbleY + 2);
                  }
                  ctx.restore();
                }
              },
            });
          });
        } else if (gameState.currentScene === 'interior') {
          const est = NPC_ESTABLISHMENTS[gameState.currentInteriorId || 'ramen_bistro'];
          if (est) {
            est.placedFurniture?.forEach(item => {
              const furnDef = FURNITURE_CATALOG.find(f => f.id === item.furnitureId);
              if (!furnDef) return;
              renderQueue.push({ depth: item.x + item.y, draw: () => { const s = isoToScreen(item.x + furnDef.width / 2, item.y + furnDef.height / 2, cameraRef.current, canvas.width, canvas.height); drawFurniture(ctx, s.x, s.y, furnDef, item.rotation, 1); } });
            });

            const npc = gameState.npcs?.[est.npcId];
            if (npc) {
              renderQueue.push({
                depth: 3 + 2,
                draw: () => {
                  const s = isoToScreen(3, 2, cameraRef.current, canvas.width, canvas.height);
                  drawCharacter(ctx, s.x, s.y, { name: npc.name, skinTone: npc.avatarStyle?.skin || '#fbd0b4', hairStyle: (npc.avatarStyle?.hairStyle as any) || 'slick', hairColor: npc.portraitHair || '#00f0ff', implant: (npc.portraitImplant as any) || 'visor', implantColor: npc.portraitColor || '#00f0ff', outfitStyle: (npc.avatarStyle?.outfit as any) || 'duster', outfitColor: npc.portraitColor || '#38bdf8', droneCompanion: 'none' }, 'SE', false, tick, 1);
                  ctx.save(); ctx.textAlign = 'center'; ctx.font = 'bold 9px "Chakra Petch", sans-serif';
                  ctx.fillStyle = npc.portraitColor || '#00f0ff'; ctx.fillText(npc.name, s.x, s.y - 48);
                  ctx.font = '8px monospace'; ctx.fillStyle = '#fbbf24'; ctx.fillText(`★ ${npc.role}`, s.x, s.y - 36);
                  ctx.restore();
                },
              });
            }

            const exitX = est.interiorSize.width - 1; const exitY = est.interiorSize.height - 1;
            renderQueue.push({
              depth: exitX + exitY + 0.1,
              draw: () => {
                const s = isoToScreen(exitX, exitY, cameraRef.current, canvas.width, canvas.height);
                ctx.fillStyle = '#ef4444'; ctx.fillRect(s.x - 14, s.y - 22, 28, 22);
                ctx.fillStyle = '#ffffff'; ctx.font = '700 8px "Chakra Petch", sans-serif';
                ctx.textAlign = 'center'; ctx.fillText('SAIR', s.x, s.y - 12); ctx.fillText('NEOPOLIS', s.x, s.y - 4);
              },
            });
          }
        } else if (currentHouse) {
          currentHouse.placedFurniture?.forEach(item => {
            const furnDef = FURNITURE_CATALOG.find(f => f.id === item.furnitureId);
            if (!furnDef) return;
            renderQueue.push({
              depth: item.x + item.y,
              draw: () => {
                const s = isoToScreen(item.x + furnDef.width / 2, item.y + furnDef.height / 2, cameraRef.current, canvas.width, canvas.height);
                const isSelected = pProps.selectedPlacedId === item.instanceId;
                drawFurniture(ctx, s.x, s.y, furnDef, item.rotation, 1);
                if (isSelected) { ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 2; ctx.strokeRect(s.x - 20, s.y - 24, 40, 28); }
              },
            });
          });

          const exitX = currentHouse.gridWidth - 1; const exitY = currentHouse.gridHeight - 1;
          renderQueue.push({
            depth: exitX + exitY + 0.1,
            draw: () => {
              const s = isoToScreen(exitX, exitY, cameraRef.current, canvas.width, canvas.height);
              ctx.fillStyle = '#ef4444'; ctx.fillRect(s.x - 12, s.y - 20, 24, 20);
              ctx.fillStyle = '#ffffff'; ctx.font = '700 8px "Chakra Petch", sans-serif';
              ctx.textAlign = 'center'; ctx.fillText('EXIT TO CITY', s.x, s.y - 12);
            },
          });
        }

        renderQueue.push({
          depth: playerRef.current.x + playerRef.current.y,
          draw: () => {
            const s = isoToScreen(playerRef.current.x, playerRef.current.y, cameraRef.current, canvas.width, canvas.height);
            drawCharacter(
              ctx, s.x, s.y,
              {
                name: gameState.player?.name || 'Player', skinTone: gameState.player?.skinTone || '#fbcfe8',
                hairStyle: gameState.equippedCosmetics?.hairStyle || gameState.player?.hairStyle || 'slick',
                hairColor: gameState.equippedCosmetics?.hairColor || gameState.player?.hairColor || '#00f0ff',
                implant: gameState.equippedCosmetics?.implant || gameState.player?.implant || 'visor',
                implantColor: gameState.player?.implantColor || '#00f0ff',
                outfitStyle: gameState.equippedCosmetics?.outfitStyle || gameState.player?.outfitStyle || 'duster',
                outfitColor: gameState.equippedCosmetics?.outfitColor || gameState.player?.outfitColor || '#0f172a',
                droneCompanion: (gameState.equippedCosmetics?.drone as any) || gameState.player?.droneCompanion || 'none',
              },
              playerRef.current.dir, playerRef.current.isMoving, tick, 1
            );
          },
        });

        renderQueue.sort((a, b) => a.depth - b.depth);
        renderQueue.forEach(item => item.draw());

        if (pProps.isDecorateMode && pProps.selectedCatalogItem && currentHouse) {
          const mx = Math.floor(mouseIsoRef.current.x); const my = Math.floor(mouseIsoRef.current.y);
          if (mx >= 0 && mx < currentHouse.gridWidth && my >= 0 && my < currentHouse.gridHeight) {
            const s = isoToScreen(mx + pProps.selectedCatalogItem.width / 2, my + pProps.selectedCatalogItem.height / 2, cameraRef.current, canvas.width, canvas.height);
            ctx.save(); ctx.globalAlpha = 0.65; drawFurniture(ctx, s.x, s.y, pProps.selectedCatalogItem, 0, 1); ctx.restore();
          }
        }

        drawWeatherOverlay(ctx, canvas.width, canvas.height, tick, gameState.weather, lightningFlashRef.current, ripplesRef.current, gameState.timeHour);

        const glitchIntensity = (gameState.weather === 'glitch_storm') ? 6 : 2;
        applyChromaticAberration(ctx, canvas.width, canvas.height, glitchIntensity);
        drawCRTOverlay(ctx, canvas.width, canvas.height, tick);

        floatingTextsRef.current.forEach(ft => {
          const age = now - ft.createdAt; const ageRatio = age / 1800;
          const s = isoToScreen(ft.x, ft.y, cameraRef.current, canvas.width, canvas.height);
          const floatY = s.y - 35 - ageRatio * 45;

          ctx.save(); ctx.globalAlpha = Math.max(0, 1 - ageRatio); ctx.font = 'bold 12px "Press Start 2P", monospace';
          ctx.textAlign = 'center'; ctx.fillStyle = ft.color; ctx.shadowColor = ft.color;
          ctx.shadowBlur = 8; ctx.fillText(ft.text, s.x, floatY); ctx.restore();
        });

        let foundPrompt = null;
        const px = playerRef.current.x; const py = playerRef.current.y;

        if (gameState.currentScene === 'town') {
          Object.values(gameState.npcs || {}).forEach(npc => {
            if (!npc) return;
            const walker = storyNPCWalkersRef.current[npc.id];
            const posX = walker ? walker.currentX : npc.x; const posY = walker ? walker.currentY : npc.y;
            if (Math.hypot(px - posX, py - posY) < 2.2 && !foundPrompt) {
              const s = isoToScreen(posX, posY, cameraRef.current, canvas.width, canvas.height);
              foundPrompt = {
                text: `[E] Talk with ${npc.name}`,
                action: () => pProps.onInteractNPC({ ...npc, locationName: walker?.currentSlot?.locationName || npc.locationName, currentActivity: walker?.currentSlot?.activity, x: posX, y: posY }),
                x: s.x, y: s.y - 50,
              };
            }
          });

          if (!foundPrompt) {
            cityMap.interactables.forEach(int => {
              if (Math.hypot(px - int.x, py - int.y) < 2.2 && !foundPrompt) {
                const s = isoToScreen(int.x, int.y, cameraRef.current, canvas.width, canvas.height);
                foundPrompt = {
                  text: `[E] ${int.label}`,
                  action: () => {
                    sound.playChirp(1.1);
                    if (['ramen_bistro', 'ripperdoc_clinic', 'robotics_garage', 'netrunner_den', 'haute_boutique'].includes(int.id)) { pProps.onEnterInterior?.(int.id); }
                    else if (int.id === 'furniture' || int.id === 'realty') { pProps.onOpenStoreTab?.(int.id as any); }
                    else if (int.id === 'arcade') { if (pProps.onConsumeEnergy && !pProps.onConsumeEnergy(10, 'Arcade Game')) return addFloatingText('⚠️ NANITES ESGOTADOS!', '#ef4444'); pProps.onInteractArcade(); }
                    else if (int.id === 'greenhouse') { if (pProps.onConsumeEnergy && !pProps.onConsumeEnergy(10, 'Colheita')) return addFloatingText('⚠️ NANITES ESGOTADOS!', '#ef4444'); pProps.onActionReward(45, 20, 'Colheita em Estufa'); }
                    else if (int.id === 'metro') { sound.playNewsBroadcast(); addFloatingText('+30 ENERGIA', '#00f0ff'); pProps.onActionReward(30, 25, 'Metro Ride'); }
                    else if (int.id === 'fountain') { sound.playRest(); addFloatingText('+25 Energia', '#c084fc'); pProps.onActionReward(25, 20, 'Fountain Meditate'); }
                    else if (int.id === 'terminal') { pProps.onInteractTerminal(); }
                    else if (int.id === 'lecture') { sound.playLevelUp(); pProps.onActionReward(50, 25, 'AI Lecture'); }
                    else if (int.id === 'repair') { pProps.onInteractRepairBot(); }
                    else if (int.id === 'vending') { pProps.onInteractVendingMachine(); }
                    else if (int.id === 'academy' || int.id === 'megapod') { pProps.onEnterHouse(pProps.gameState.currentHouseId); }
                  },
                  x: s.x, y: s.y - 45
                };
              }
            });
          }

          if (!foundPrompt) {
            for (const cit of citizensRef.current) {
              if (Math.hypot(px - cit.x, py - cit.y) < 1.8) {
                const s = isoToScreen(cit.x, cit.y, cameraRef.current, canvas.width, canvas.height);
                foundPrompt = { text: `[E] Greet ${cit.name}`, action: () => { sound.playChirp(1.2); addFloatingText(cit.greeting, '#38bdf8'); pProps.onActionReward(10, 5, `Greeted ${cit.name}`); }, x: s.x, y: s.y - 45 };
                break;
              }
            }
          }
        } else if (gameState.currentScene === 'interior') {
          const est = NPC_ESTABLISHMENTS[gameState.currentInteriorId || 'ramen_bistro'];
          if (est) {
            const npc = gameState.npcs?.[est.npcId];
            if (Math.hypot(px - 3, py - 2) < 2.2 && npc && !foundPrompt) {
              const s = isoToScreen(3, 2, cameraRef.current, canvas.width, canvas.height);
              foundPrompt = { text: `[E] Falar com ${npc.name}`, action: () => { sound.playChirp(1.0); pProps.onInteractNPC(npc); }, x: s.x, y: s.y - 50 };
            }
            if (Math.hypot(px - (est.interiorSize.width - 1), py - (est.interiorSize.height - 1)) < 1.8 && !foundPrompt) {
              const s = isoToScreen(est.interiorSize.width - 1, est.interiorSize.height - 1, cameraRef.current, canvas.width, canvas.height);
              foundPrompt = { text: '[E] Sair para Metropolis', action: () => { sound.playChirp(0.9); pProps.onExitInterior ? pProps.onExitInterior() : pProps.onExitHouse(); }, x: s.x, y: s.y - 35 };
            }
          }
        } else if (currentHouse) {
          if (Math.hypot(px - (currentHouse.gridWidth - 1), py - (currentHouse.gridHeight - 1)) < 1.8) {
            const s = isoToScreen(currentHouse.gridWidth - 1, currentHouse.gridHeight - 1, cameraRef.current, canvas.width, canvas.height);
            foundPrompt = { text: '[E] Sair para Metropolis', action: pProps.onExitHouse, x: s.x, y: s.y - 35 };
          }
          currentHouse.placedFurniture?.forEach(item => {
            const furnDef = FURNITURE_CATALOG.find(f => f.id === item.furnitureId);
            if (furnDef && Math.hypot(px - (item.x + furnDef.width / 2), py - (item.y + furnDef.height / 2)) < 1.8) {
              const s = isoToScreen(item.x + furnDef.width / 2, item.y + furnDef.height / 2, cameraRef.current, canvas.width, canvas.height);
              if (furnDef.interactiveType === 'bed') foundPrompt = { text: '[E] Dormir & Descansar', action: pProps.onInteractBed, x: s.x, y: s.y - 30 };
              else if (furnDef.interactiveType === 'arcade') foundPrompt = { text: '[E] Jogar Neon Drift', action: pProps.onInteractArcade, x: s.x, y: s.y - 45 };
              else if (furnDef.interactiveType === 'terminal') foundPrompt = { text: '[E] Terminal Bypass', action: pProps.onInteractTerminal, x: s.x, y: s.y - 35 };
              else if (furnDef.interactiveType === 'plant') foundPrompt = { text: '[E] Cuidar das Plantas', action: pProps.onInteractPlant, x: s.x, y: s.y - 30 };
            }
          });
        }

        if (foundPrompt?.text !== currentPromptRef.current?.text) {
          currentPromptRef.current = foundPrompt;
          setNearbyPrompt(foundPrompt);
        } else if (!foundPrompt && currentPromptRef.current) {
          currentPromptRef.current = null;
          setNearbyPrompt(null);
        }

        const currentFloorX = Math.floor(px); const currentFloorY = Math.floor(py);
        if (currentFloorX !== lastFloorCoordsRef.current.x || currentFloorY !== lastFloorCoordsRef.current.y) {
          lastFloorCoordsRef.current = { x: currentFloorX, y: currentFloorY };
          setUiCoords({ x: currentFloorX, y: currentFloorY });
        }
      } catch (error) { console.error("⛔ CRASH FATAL EVITADO:", error); } 
      finally { animId = requestAnimationFrame(gameLoop); }
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [cityMap]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas && canvas.parentElement) { canvas.width = canvas.parentElement.clientWidth || 800; canvas.height = canvas.parentElement.clientHeight || 600; }
    };
    handleResize(); window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const iso = screenToIso(e.clientX - rect.left, e.clientY - rect.top, cameraRef.current, canvas.width, canvas.height);

    if (props.isDecorateMode) {
      const tileX = Math.floor(iso.x); const tileY = Math.floor(iso.y);
      if (props.selectedCatalogItem) { props.onPlaceFurnitureAt(tileX, tileY); } 
      else {
        const currentHouse = props.gameState.houses?.find(h => h.id === props.gameState.currentHouseId) || props.gameState.houses?.[0];
        const clickedItem = currentHouse?.placedFurniture?.find(item => tileX >= item.x && tileX < item.x + 2 && tileY >= item.y && tileY < item.y + 2);
        props.onSelectPlaced(clickedItem ? clickedItem.instanceId : null);
      }
    } else {
      sound.playStep();
      playerRef.current.x = Math.max(1, Math.min(TOWN_SIZE - 2, iso.x));
      playerRef.current.y = Math.max(1, Math.min(TOWN_SIZE - 2, iso.y));
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseIsoRef.current = screenToIso(e.clientX - rect.left, e.clientY - rect.top, cameraRef.current, canvas.width, canvas.height);
  };

  const currentDistrict = (() => {
    if (props.gameState?.currentScene === 'interior') {
      const est = NPC_ESTABLISHMENTS[props.gameState.currentInteriorId || 'ramen_bistro'];
      return { badge: 'ESTABELECIMENTO', name: (est?.name || 'INTERIOR').toUpperCase(), color: 'text-pink-400 border-pink-500/40' };
    }
    if (props.gameState?.currentScene !== 'town') {
      const currentHouse = props.gameState?.houses?.find(h => h.id === props.gameState.currentHouseId) || props.gameState?.houses?.[0];
      return { badge: 'RESIDENCE', name: (currentHouse?.name || 'CASA').toUpperCase(), color: 'text-cyan-400 border-cyan-500/40' };
    }
    const { x, y } = uiCoords;
    if ((x >= 21 && x <= 24) || (y >= 21 && y <= 24)) return { badge: 'CENTRAL AXIS', name: 'NEO-HIGHWAY CORRIDOR', color: 'text-amber-400 border-amber-500/40' };
    if (x < 21 && y < 21) return { badge: 'DISTRICT 01', name: 'NEON COMMERCIAL BOULEVARD', color: 'text-cyan-400 border-cyan-500/40' };
    if (x > 24 && y < 21) return { badge: 'DISTRICT 02', name: 'NEO-AKADEMIA CAMPUS & LABS', color: 'text-pink-400 border-pink-500/40' };
    if (x < 21 && y > 24) return { badge: 'DISTRICT 03', name: 'CAPSULE RESIDENTIAL SECTOR', color: 'text-blue-400 border-blue-500/40' };
    return { badge: 'DISTRICT 04', name: 'CIVIC METRO & TRANSIT PLAZA', color: 'text-purple-400 border-purple-500/40' };
  })();

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-950">
      <canvas ref={canvasRef} onClick={handleCanvasClick} onMouseMove={handleMouseMove} className="w-full h-full block pixelated cursor-crosshair" />

      {nearbyPrompt && !props.isDecorateMode && (
        <div style={{ left: `${nearbyPrompt.x}px`, top: `${nearbyPrompt.y}px` }} className="absolute -translate-x-1/2 -translate-y-full z-30 pointer-events-auto">
          <button onClick={nearbyPrompt.action} className="px-3.5 py-1.5 bg-slate-950/95 border-2 border-cyan-400 rounded-xl text-cyan-200 text-xs font-bold font-pixel shadow-2xl shadow-cyan-500/40 hover:bg-cyan-950 hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer animate-bounce">
            <span>{nearbyPrompt.text}</span>
          </button>
        </div>
      )}

      <div className="absolute bottom-4 left-4 z-20 pointer-events-none hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-950/85 backdrop-blur-md rounded-xl border border-slate-800 shadow-xl">
        <span className={`text-[9px] font-pixel px-1.5 py-0.5 rounded border ${currentDistrict.color} font-bold`}>{currentDistrict.badge}</span>
        <span className="text-xs font-bold font-cyber text-slate-200 tracking-wider">{currentDistrict.name}</span>
        <span className="text-[10px] font-mono text-slate-500 ml-1">[{uiCoords.x}, {uiCoords.y}]</span>
      </div>

      <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-1 sm:hidden pointer-events-auto">
        <div className="flex justify-center">
          <button onPointerDown={() => keysPressed.current.add('w')} onPointerUp={() => keysPressed.current.delete('w')} className="w-12 h-12 bg-slate-900/80 border border-cyan-500 text-cyan-300 font-bold rounded-xl active:bg-cyan-500 active:text-black flex items-center justify-center text-lg">▲</button>
        </div>
        <div className="flex gap-2">
          <button onPointerDown={() => keysPressed.current.add('a')} onPointerUp={() => keysPressed.current.delete('a')} className="w-12 h-12 bg-slate-900/80 border border-cyan-500 text-cyan-300 font-bold rounded-xl active:bg-cyan-500 active:text-black flex items-center justify-center text-lg">◄</button>
          <button onPointerDown={() => keysPressed.current.add('s')} onPointerUp={() => keysPressed.current.delete('s')} className="w-12 h-12 bg-slate-900/80 border border-cyan-500 text-cyan-300 font-bold rounded-xl active:bg-cyan-500 active:text-black flex items-center justify-center text-lg">▼</button>
          <button onPointerDown={() => keysPressed.current.add('d')} onPointerUp={() => keysPressed.current.delete('d')} className="w-12 h-12 bg-slate-900/80 border border-cyan-500 text-cyan-300 font-bold rounded-xl active:bg-cyan-500 active:text-black flex items-center justify-center text-lg">►</button>
        </div>
      </div>
    </div>
  );
};
