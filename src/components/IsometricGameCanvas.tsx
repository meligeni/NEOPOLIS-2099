import React, { useRef, useEffect, useState, useCallback } from 'react';
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

export const IsometricGameCanvas: React.FC<IsometricGameCanvasProps> = (props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const propsRef = useRef(props);

  useEffect(() => {
    propsRef.current = props;
  }, [props]);

  const TOWN_SIZE = 46;

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

  // Timing seguro - Inicializado a zero para evitar erros de Delta Time no primeiro frame
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

  const citizensRef = useRef<CitizenWalker[]>([
    { id: 'cit_1', name: 'Cipher', x: 6, y: 9, dir: 'SE', speed: 0.045, pauseTicks: 0, waypointIndex: 0, waypoints: [{ x: 6, y: 9 }, { x: 10, y: 9 }, { x: 15, y: 9 }, { x: 15, y: 15 }, { x: 8, y: 15 }], appearance: { name: 'Cipher', gender: 'neutral', origin: 'netrunner', skinTone: '#fbcfe8', hairStyle: 'mohawk', hairColor: '#00f0ff', implant: 'visor', implantColor: '#00f0ff', outfitStyle: 'duster', outfitColor: '#1e1b4b', droneCompanion: 'none' }, greeting: 'Cipher: "Watch the crosswalks! Those hover-taxis take corners at full throttle."' },
    { id: 'cit_2', name: 'Kira', x: 10, y: 6, dir: 'SW', speed: 0.04, pauseTicks: 20, waypointIndex: 0, waypoints: [{ x: 10, y: 6 }, { x: 10, y: 12 }, { x: 5, y: 12 }, { x: 5, y: 6 }], appearance: { name: 'Kira', gender: 'fem', origin: 'courier', skinTone: '#fed7aa', hairStyle: 'bob', hairColor: '#ff2a85', implant: 'optic_ring', implantColor: '#ff2a85', outfitStyle: 'bomber', outfitColor: '#f43f5e', droneCompanion: 'none' }, greeting: 'Kira: "Bao’s cyber-ramen has real synth-chili oil today. Best fuel in District 1!"' },
    { id: 'cit_3', name: 'Zero', x: 14, y: 8, dir: 'NE', speed: 0.042, pauseTicks: 0, waypointIndex: 0, waypoints: [{ x: 14, y: 8 }, { x: 17, y: 8 }, { x: 17, y: 16 }, { x: 12, y: 16 }], appearance: { name: 'Zero', gender: 'masc', origin: 'mechanic', skinTone: '#e2e8f0', hairStyle: 'spiky', hairColor: '#facc15', implant: 'chrome_jaw', implantColor: '#94a3b8', outfitStyle: 'hoodie', outfitColor: '#0f172a', droneCompanion: 'none' }, greeting: 'Zero: "Glitch & Grind got a shipment of quantum cyberdecks this morning."' },
    { id: 'cit_4', name: 'Vex', x: 19, y: 19, dir: 'SE', speed: 0.05, pauseTicks: 0, waypointIndex: 0, waypoints: [{ x: 18, y: 19 }, { x: 26, y: 19 }, { x: 28, y: 14 }, { x: 26, y: 19 }, { x: 18, y: 19 }], appearance: { name: 'Vex', gender: 'neutral', origin: 'netrunner', skinTone: '#cbd5e1', hairStyle: 'dreads', hairColor: '#a855f7', implant: 'visor', implantColor: '#a855f7', outfitStyle: 'duster', outfitColor: '#090d16', droneCompanion: 'none' }, greeting: 'Vex: "Heading across the avenue to the Academy lecture. Late again!"' },
    { id: 'cit_5', name: 'Aero', x: 26, y: 26, dir: 'NW', speed: 0.048, pauseTicks: 0, waypointIndex: 0, waypoints: [{ x: 26, y: 26 }, { x: 18, y: 26 }, { x: 14, y: 32 }, { x: 18, y: 26 }, { x: 26, y: 26 }], appearance: { name: 'Aero', gender: 'masc', origin: 'courier', skinTone: '#fed7aa', hairStyle: 'slick', hairColor: '#38bdf8', implant: 'neural_jack', implantColor: '#38bdf8', outfitStyle: 'bomber', outfitColor: '#0284c7', droneCompanion: 'none' }, greeting: 'Aero: "Courier delivery run to the Capsule Towers. 5 minutes on the clock!"' },
    { id: 'cit_6', name: 'Lyra', x: 30, y: 10, dir: 'SE', speed: 0.038, pauseTicks: 30, waypointIndex: 0, waypoints: [{ x: 30, y: 10 }, { x: 35, y: 10 }, { x: 35, y: 16 }, { x: 30, y: 16 }], appearance: { name: 'Lyra', gender: 'fem', origin: 'alchemist', skinTone: '#fbcfe8', hairStyle: 'pixie', hairColor: '#10b981', implant: 'optic_ring', implantColor: '#10b981', outfitStyle: 'biosuit', outfitColor: '#064e3b', droneCompanion: 'none' }, greeting: 'Lyra: "The synth-flora spores near the campus quad have high biocell density today."' },
    { id: 'cit_7', name: 'Shin', x: 36, y: 14, dir: 'NE', speed: 0.04, pauseTicks: 0, waypointIndex: 0, waypoints: [{ x: 36, y: 14 }, { x: 42, y: 14 }, { x: 42, y: 8 }, { x: 36, y: 8 }], appearance: { name: 'Shin', gender: 'masc', origin: 'mechanic', skinTone: '#fcd34d', hairStyle: 'spiky', hairColor: '#f97316', implant: 'cyber_tattoo', implantColor: '#f97316', outfitStyle: 'hoodie', outfitColor: '#7c2d12', droneCompanion: 'none' }, greeting: 'Shin: "The maintenance drones keep getting ionized by the acid rain."' },
    { id: 'cit_8', name: 'Rook', x: 8, y: 33, dir: 'SE', speed: 0.042, pauseTicks: 15, waypointIndex: 0, waypoints: [{ x: 8, y: 33 }, { x: 15, y: 33 }, { x: 15, y: 40 }, { x: 8, y: 40 }], appearance: { name: 'Rook', gender: 'masc', origin: 'mechanic', skinTone: '#94a3b8', hairStyle: 'mohawk', hairColor: '#ef4444', implant: 'chrome_jaw', implantColor: '#ef4444', outfitStyle: 'bomber', outfitColor: '#18181b', droneCompanion: 'none' }, greeting: 'Rook: "Capsule Pod 404 is a tight squeeze, but nothing beats that rooftop rain sound."' },
    { id: 'cit_9', name: 'Maya', x: 12, y: 36, dir: 'SW', speed: 0.039, pauseTicks: 25, waypointIndex: 0, waypoints: [{ x: 12, y: 36 }, { x: 6, y: 36 }, { x: 6, y: 42 }, { x: 12, y: 42 }], appearance: { name: 'Maya', gender: 'fem', origin: 'netrunner', skinTone: '#fed7aa', hairStyle: 'bob', hairColor: '#c084fc', implant: 'visor', implantColor: '#c084fc', outfitStyle: 'duster', outfitColor: '#312e81', droneCompanion: 'none' }, greeting: 'Maya: "The skybridge between blocks has an incredible view of the neon highway below."' },
    { id: 'cit_10', name: 'Tate', x: 32, y: 33, dir: 'SE', speed: 0.046, pauseTicks: 0, waypointIndex: 0, waypoints: [{ x: 32, y: 33 }, { x: 38, y: 33 }, { x: 38, y: 39 }, { x: 32, y: 39 }], appearance: { name: 'Tate', gender: 'neutral', origin: 'courier', skinTone: '#fbcfe8', hairStyle: 'slick', hairColor: '#00f0ff', implant: 'optic_ring', implantColor: '#00f0ff', outfitStyle: 'duster', outfitColor: '#0f172a', droneCompanion: 'none' }, greeting: 'Tate: "Next train on Line 01 arrives in 2 minutes. Neopolis transit never sleeps."' },
    { id: 'cit_11', name: 'Orion', x: 35, y: 37, dir: 'NE', speed: 0.035, pauseTicks: 40, waypointIndex: 0, waypoints: [{ x: 35, y: 37 }, { x: 41, y: 37 }, { x: 41, y: 43 }, { x: 35, y: 43 }], appearance: { name: 'Orion', gender: 'masc', origin: 'alchemist', skinTone: '#e2e8f0', hairStyle: 'dreads', hairColor: '#22c55e', implant: 'neural_jack', implantColor: '#22c55e', outfitStyle: 'biosuit', outfitColor: '#064e3b', droneCompanion: 'none' }, greeting: 'Orion: "The holographic light fountain is charged by the city’s quantum grid. Mesmerizing."' },
    { id: 'cit_12', name: 'Echo', x: 40, y: 34, dir: 'SW', speed: 0.041, pauseTicks: 10, waypointIndex: 0, waypoints: [{ x: 40, y: 34 }, { x: 33, y: 34 }, { x: 33, y: 42 }, { x: 40, y: 42 }], appearance: { name: 'Echo', gender: 'fem', origin: 'netrunner', skinTone: '#cbd5e1', hairStyle: 'pixie', hairColor: '#f43f5e', implant: 'visor', implantColor: '#f43f5e', outfitStyle: 'bomber', outfitColor: '#881337', droneCompanion: 'none' }, greeting: 'Echo: "Check the giant holo-billboard across the plaza—they’re running Arasaka stock updates."' },
  ]);

  const addFloatingText = useCallback((text: string, color = '#38bdf8') => {
    floatingTextsRef.current.push({
      id: Math.random().toString(),
      text,
      x: playerRef.current.x,
      y: playerRef.current.y,
      color,
      createdAt: Date.now(),
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
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // 3. MAIN ANIMATION LOOP (INDESTRUTÍVEL)
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = (time: number) => {
      try {
        // Correção de estabilidade Delta Time (evita frames negativos ou congelamentos enormes)
        if (lastTimeRef.current === 0) {
          lastTimeRef.current = time;
          return;
        }
        
        let dt = (time - lastTimeRef.current) / 1000;
        lastTimeRef.current = time;
        
        if (dt > 0.1) dt = 0.016; // Teto para evitar saltos quânticos se mudares de aba
        if (dt <= 0) dt = 0.001;  // Evita timeScale negativo e matemática corrompida

        const timeScale = dt * 60; 
        tickRef.current += 0.035 * timeScale;
        const tick = tickRef.current;
        const now = Date.now();

        const pProps = propsRef.current;
        const { gameState } = pProps;
        
        // Verifica se gameState é válido para evitar crashes
        if (!gameState) return;

        const currentHouse = gameState.houses?.find(h => h.id === gameState.currentHouseId) || gameState.houses?.[0];

        // Cleanup floating texts
        floatingTextsRef.current = floatingTextsRef.current.filter(t => now - t.createdAt < 1800);

        // Weather Particle & Physics Simulation
        if (gameState.weather === 'neon_rain' || gameState.weather === 'glitch_storm') {
          if (Math.random() < (gameState.weather === 'glitch_storm' ? 0.35 : 0.2) * timeScale) {
            ripplesRef.current.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, progress: 0 });
          }
          ripplesRef.current.forEach(r => { r.progress += 0.045 * timeScale; });
          ripplesRef.current = ripplesRef.current.filter(r => r.progress < 1.0);
        } else {
          ripplesRef.current = [];
        }

        if (gameState.weather === 'glitch_storm') {
          if (now > nextLightningTimeRef.current) {
            lightningFlashRef.current = 1.0;
            nextLightningTimeRef.current = now + 3500 + Math.random() * 4500;
          } else {
            lightningFlashRef.current = Math.max(0, lightningFlashRef.current - 0.07 * timeScale);
          }
        } else {
          lightningFlashRef.current = 0;
        }

        // 1. Process Player Movement
        let dx = 0;
        let dy = 0;
        const speed = 0.085 * timeScale;

        if (keysPressed.current.has('w') || keysPressed.current.has('arrowup')) { dx -= speed; dy -= speed; }
        if (keysPressed.current.has('s') || keysPressed.current.has('arrowdown')) { dx += speed; dy += speed; }
        if (keysPressed.current.has('a') || keysPressed.current.has('arrowleft')) { dx -= speed; dy += speed; }
        if (keysPressed.current.has('d') || keysPressed.current.has('arrowright')) { dx += speed; dy -= speed; }

        const isWalking = dx !== 0 || dy !== 0;
        playerRef.current.isMoving = isWalking;

        if (isWalking) {
          if (now - lastStepSoundTimeRef.current > 320) {
            sound.playStep();
            lastStepSoundTimeRef.current = now;
          }

          if (dx > 0 && dy >= 0) playerRef.current.dir = 'SE';
          else if (dx < 0 && dy <= 0) playerRef.current.dir = 'NW';
          else if (dy > 0 && dx <= 0) playerRef.current.dir = 'SW';
          else if (dy < 0 && dx >= 0) playerRef.current.dir = 'NE';

          let nextX = playerRef.current.x + dx;
          let nextY = playerRef.current.y + dy;

          if (gameState.currentScene === 'town') {
            nextX = Math.max(1, Math.min(TOWN_SIZE - 2, nextX));
            nextY = Math.max(1, Math.min(TOWN_SIZE - 2, nextY));
          } else if (gameState.currentScene === 'interior') {
            const est = NPC_ESTABLISHMENTS[gameState.currentInteriorId || 'ramen_bistro'];
            const maxW = est ? est.interiorSize.width : 8;
            const maxH = est ? est.interiorSize.height : 8;
            nextX = Math.max(0.5, Math.min(maxW - 0.8, nextX));
            nextY = Math.max(0.5, Math.min(maxH - 0.8, nextY));
          } else if (currentHouse) {
            nextX = Math.max(0.5, Math.min(currentHouse.gridWidth - 0.8, nextX));
            nextY = Math.max(0.5, Math.min(currentHouse.gridHeight - 0.8, nextY));
          }

          playerRef.current.x = nextX;
          playerRef.current.y = nextY;
        }

        // 2. Camera Tracking
        const playerScreen = {
          x: (playerRef.current.x - playerRef.current.y) * (TILE_WIDTH / 2),
          y: (playerRef.current.x + playerRef.current.y) * (TILE_HEIGHT / 2),
        };
        cameraRef.current.x += (playerScreen.x - cameraRef.current.x) * (0.1 * timeScale);
        cameraRef.current.y += (playerScreen.y - cameraRef.current.y) * (0.1 * timeScale);

        // 3. Render Setup
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
            const sx = ((i * 137) % canvas.width);
            const sy = ((i * 89) % Math.max(120, canvas.height * 0.45));
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
            let shouldStop = false;
            const adjustedSpeed = veh.speed * timeScale;
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

        // 5. Render Floor
        if (gameState.currentScene === 'town') {
          for (let x = 0; x < TOWN_SIZE; x++) {
            for (let y = 0; y < TOWN_SIZE; y++) {
              const screen = isoToScreen(x, y, cameraRef.current, canvas.width, canvas.height);
              if (screen.x < -64 || screen.x > canvas.width + 64 || screen.y < -64 || screen.y > canvas.height + 64) continue;
              const isAvenue = x >= 21 && x <= 24; const isBoulevard = y >= 21 && y <= 24; const isRoad = isAvenue || isBoulevard; const isIntersection = isAvenue && isBoulevard;
              const isCrosswalk = (isAvenue && ((y >= 19 && y <= 20) || (y >= 25 && y <= 26))) || (isBoulevard && ((x >= 19 && x <= 20) || (x >= 25 && x <= 26)));
              const isCurb = (x === 20 || x === 25 || y === 20 || y === 25) && !isRoad;
              let fillColor = '#101524'; let strokeColor = 'rgba(28, 38, 59, 0.45)';
              if (gameState.weather === 'acid_fog') { fillColor = '#0d1611'; strokeColor = 'rgba(163, 230, 53, 0.16)'; } else if (gameState.weather === 'neon_rain' || gameState.weather === 'glitch_storm') { fillColor = '#080d1a'; strokeColor = 'rgba(0, 240, 255, 0.2)'; }

              if (isRoad) {
                fillColor = isIntersection ? '#060913' : '#080c18'; strokeColor = 'rgba(30, 41, 59, 0.35)';
                drawIsoTile(ctx, screen.x, screen.y, fillColor, strokeColor);
                if ((x === 22 || x === 23) && isAvenue && !isCrosswalk && !isIntersection && y % 3 === 0) drawIsoTile(ctx, screen.x, screen.y, 'rgba(0, 240, 255, 0.35)', '#00f0ff');
                else if ((y === 22 || y === 23) && isBoulevard && !isCrosswalk && !isIntersection && x % 3 === 0) drawIsoTile(ctx, screen.x, screen.y, 'rgba(245, 158, 11, 0.35)', '#f59e0b');
                if (isCrosswalk && (x + y) % 2 === 0) drawIsoTile(ctx, screen.x, screen.y, 'rgba(0, 240, 255, 0.55)', '#00f0ff');
              } else {
                if (isCurb) { fillColor = '#1c2438'; strokeColor = 'rgba(255, 42, 133, 0.5)'; }
                else if (x < 20 && y < 20) { fillColor = (x + y) % 2 === 0 ? '#141a2c' : '#111625'; strokeColor = 'rgba(0, 240, 255, 0.25)'; }
                else if (x > 25 && y < 20) { const isCQ = x >= 30 && x <= 38 && y >= 8 && y <= 16; fillColor = isCQ ? ((x + y) % 2 === 0 ? '#182035' : '#141a2c') : '#111625'; strokeColor = isCQ ? 'rgba(255, 42, 133, 0.35)' : 'rgba(0, 240, 255, 0.2)'; }
                else if (x < 20 && y > 25) { fillColor = (x + y) % 2 === 0 ? '#121727' : '#0e1320'; strokeColor = 'rgba(56, 189, 248, 0.25)'; }
                else if (x > 25 && y > 25) { fillColor = (x + y) % 2 === 0 ? '#161d31' : '#13192a'; strokeColor = 'rgba(168, 85, 247, 0.3)'; }
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

        // 6. Depth Sorted Render Queue
        interface DepthItem { depth: number; draw: () => void; }
        const renderQueue: DepthItem[] = [];

        if (gameState.currentScene === 'town') {
          renderQueue.push({ depth: 4 + 2, draw: () => { const s = isoToScreen(4, 2, cameraRef.current, canvas.width, canvas.height); drawSkyscraperTower(ctx, s.x, s.y, 'QUANTUM CORP', 6, tick, 1, '#00f0ff'); } });
          renderQueue.push({ depth: 4 + 8, draw: () => { const s = isoToScreen(4, 8, cameraRef.current, canvas.width, canvas.height); drawVolumetricLight(ctx, s.x, s.y - 30, 45, 'rgba(245, 158, 11, 0.3)', gameState.weather); drawBuildingFacade(ctx, s.x, s.y, 'bazaar', 1); } });
          renderQueue.push({ depth: 4 + 15, draw: () => { const s = isoToScreen(4, 15, cameraRef.current, canvas.width, canvas.height); drawVolumetricLight(ctx, s.x, s.y - 30, 45, 'rgba(6, 182, 212, 0.3)', gameState.weather); drawBuildingFacade(ctx, s.x, s.y, 'clinic', 1); } });
          renderQueue.push({ depth: 10 + 6, draw: () => { const s = isoToScreen(10, 6, cameraRef.current, canvas.width, canvas.height); drawVolumetricLight(ctx, s.x, s.y - 30, 45, 'rgba(239, 68, 68, 0.3)', gameState.weather); drawBuildingFacade(ctx, s.x, s.y, 'ramen', 1); } });
          renderQueue.push({ depth: 10 + 14, draw: () => { const s = isoToScreen(10, 14, cameraRef.current, canvas.width, canvas.height); drawVolumetricLight(ctx, s.x, s.y - 30, 45, 'rgba(192, 132, 252, 0.3)', gameState.weather); drawBuildingFacade(ctx, s.x, s.y, 'blackice', 1); } });
          renderQueue.push({ depth: 16 + 6, draw: () => { const s = isoToScreen(16, 6, cameraRef.current, canvas.width, canvas.height); drawVolumetricLight(ctx, s.x, s.y - 30, 45, 'rgba(234, 179, 8, 0.3)', gameState.weather); drawBuildingFacade(ctx, s.x, s.y, 'realty', 1); } });
          renderQueue.push({ depth: 16 + 14, draw: () => { const s = isoToScreen(16, 14, cameraRef.current, canvas.width, canvas.height); drawVolumetricLight(ctx, s.x, s.y - 30, 45, 'rgba(16, 185, 129, 0.3)', gameState.weather); drawBuildingFacade(ctx, s.x, s.y, 'greenhouse', 1); } });
          renderQueue.push({ depth: 8 + 11, draw: () => { const s = isoToScreen(8, 11, cameraRef.current, canvas.width, canvas.height); drawVolumetricLight(ctx, s.x, s.y - 20, 35, 'rgba(0, 240, 255, 0.28)', gameState.weather); drawCyberVendingMachine(ctx, s.x, s.y, tick, 1, 'drinks'); } });

          [{ x: 6, y: 5, color: '#00f0ff' }, { x: 6, y: 12, color: '#ff2a85' }, { x: 14, y: 5, color: '#00f0ff' }, { x: 14, y: 12, color: '#f59e0b' }].forEach(l => {
            renderQueue.push({ depth: l.x + l.y, draw: () => { const s = isoToScreen(l.x, l.y, cameraRef.current, canvas.width, canvas.height); drawCyberStreetLamp(ctx, s.x, s.y, tick, 1, l.color); } });
          });
          [{ x: 10, y: 10, student: false }, { x: 14, y: 9, student: true }].forEach(b => {
            renderQueue.push({ depth: b.x + b.y, draw: () => { const s = isoToScreen(b.x, b.y, cameraRef.current, canvas.width, canvas.height); drawCyberBench(ctx, s.x, s.y, b.student, tick, 1); } });
          });
          renderQueue.push({ depth: 7 + 7, draw: () => { const s = isoToScreen(7, 7, cameraRef.current, canvas.width, canvas.height); drawTrashBinAndHydrant(ctx, s.x, s.y, 1); } });

          renderQueue.push({ depth: 38 + 7, draw: () => { const s = isoToScreen(38, 7, cameraRef.current, canvas.width, canvas.height); drawVolumetricLight(ctx, s.x + 35, s.y - 40, 65, 'rgba(0, 240, 255, 0.35)', gameState.weather); drawVolumetricLight(ctx, s.x - 40, s.y - 95, 60, 'rgba(255, 42, 133, 0.35)', gameState.weather); drawAcademyComplex(ctx, s.x, s.y, tick, 1); } });
          renderQueue.push({ depth: 33 + 13, draw: () => { const s = isoToScreen(33, 13, cameraRef.current, canvas.width, canvas.height); drawVolumetricLight(ctx, s.x, s.y - 25, 60, 'rgba(0, 240, 255, 0.35)', gameState.weather); drawHoloLectureStage(ctx, s.x, s.y, tick, 1); } });
          renderQueue.push({ depth: 28 + 7, draw: () => { const s = isoToScreen(28, 7, cameraRef.current, canvas.width, canvas.height); drawVolumetricLight(ctx, s.x, s.y - 30, 45, 'rgba(255, 42, 133, 0.35)', gameState.weather); drawHackerKiosk(ctx, s.x, s.y, tick, 1, true); } });
          renderQueue.push({ depth: 28 + 14, draw: () => { const s = isoToScreen(28, 14, cameraRef.current, canvas.width, canvas.height); drawVolumetricLight(ctx, s.x, s.y - 30, 45, 'rgba(255, 42, 133, 0.35)', gameState.weather); drawHackerKiosk(ctx, s.x, s.y, tick, 1, true); } });

          [{ x: 33, y: 6 }, { x: 38, y: 16 }, { x: 42, y: 11 }].forEach(t => {
            renderQueue.push({ depth: t.x + t.y, draw: () => { const s = isoToScreen(t.x, t.y, cameraRef.current, canvas.width, canvas.height); drawVolumetricLight(ctx, s.x, s.y - 35, 40, 'rgba(0, 245, 212, 0.28)', gameState.weather); drawCyberTree(ctx, s.x, s.y, tick, 1); } });
          });

          renderQueue.push({ depth: 29 + 11, draw: () => { const s = isoToScreen(29, 11, cameraRef.current, canvas.width, canvas.height); drawCampusSignpost(ctx, s.x, s.y, tick, 1); } });
          renderQueue.push({ depth: 40 + 14, draw: () => { const s = isoToScreen(40, 14, cameraRef.current, canvas.width, canvas.height); ctx.fillStyle = '#f59e0b'; ctx.fillRect(s.x - 7, s.y - 16 + Math.sin(tick * 4) * 2, 14, 12); if (Math.random() > 0.6) { ctx.fillStyle = '#ffffff'; ctx.fillRect(s.x + (Math.random() * 8 - 4), s.y - 22, 2, 2); ctx.fillStyle = '#00f0ff'; ctx.fillRect(s.x + (Math.random() * 8 - 4), s.y - 18, 2, 2); } } });

          [{ x: 27, y: 5, color: '#00f0ff' }, { x: 35, y: 5, color: '#ff2a85' }, { x: 27, y: 17, color: '#00f0ff' }].forEach(l => {
            renderQueue.push({ depth: l.x + l.y, draw: () => { const s = isoToScreen(l.x, l.y, cameraRef.current, canvas.width, canvas.height); drawCyberStreetLamp(ctx, s.x, s.y, tick, 1, l.color); } });
          });

          renderQueue.push({ depth: 5 + 28, draw: () => { const s = isoToScreen(5, 28, cameraRef.current, canvas.width, canvas.height); drawSkyscraperTower(ctx, s.x, s.y, 'ARASAKA MEGAPOD', 5, tick, 1, '#ef4444'); } });
          renderQueue.push({ depth: 14 + 28, draw: () => { const s = isoToScreen(14, 28, cameraRef.current, canvas.width, canvas.height); drawSkyscraperTower(ctx, s.x, s.y, 'CAPSULE RESIDENCE', 4, tick, 1, '#38bdf8'); } });
          renderQueue.push({ depth: 9 + 28, draw: () => { const s = isoToScreen(9, 28, cameraRef.current, canvas.width, canvas.height); drawPedestrianSkybridge(ctx, s.x, s.y, tick, 1); } });
          renderQueue.push({ depth: 7 + 36, draw: () => { const s = isoToScreen(7, 36, cameraRef.current, canvas.width, canvas.height); drawVolumetricLight(ctx, s.x, s.y, 45, 'rgba(139, 92, 246, 0.3)', gameState.weather); drawParkedHovercar(ctx, s.x, s.y, '#8b5cf6', 1); } });
          renderQueue.push({ depth: 14 + 36, draw: () => { const s = isoToScreen(14, 36, cameraRef.current, canvas.width, canvas.height); drawVolumetricLight(ctx, s.x, s.y, 45, 'rgba(6, 182, 212, 0.3)', gameState.weather); drawParkedHovercar(ctx, s.x, s.y, '#06b6d4', 1); } });
          renderQueue.push({ depth: 10 + 41, draw: () => { const s = isoToScreen(10, 41, cameraRef.current, canvas.width, canvas.height); drawVolumetricLight(ctx, s.x, s.y - 20, 35, 'rgba(245, 158, 11, 0.28)', gameState.weather); drawCyberVendingMachine(ctx, s.x, s.y, tick, 1, 'snacks'); } });

          [{ x: 6, y: 33, color: '#38bdf8' }, { x: 14, y: 33, color: '#ff2a85' }, { x: 6, y: 42, color: '#38bdf8' }].forEach(l => {
            renderQueue.push({ depth: l.x + l.y, draw: () => { const s = isoToScreen(l.x, l.y, cameraRef.current, canvas.width, canvas.height); drawCyberStreetLamp(ctx, s.x, s.y, tick, 1, l.color); } });
          });
          renderQueue.push({ depth: 11 + 35, draw: () => { const s = isoToScreen(11, 35, cameraRef.current, canvas.width, canvas.height); drawSteamGrate(ctx, s.x, s.y, tick, 1); } });

          renderQueue.push({ depth: 35 + 29, draw: () => { const s = isoToScreen(35, 29, cameraRef.current, canvas.width, canvas.height); drawVolumetricLight(ctx, s.x, s.y - 25, 55, 'rgba(0, 240, 255, 0.35)', gameState.weather); drawMetroStation(ctx, s.x, s.y, tick, 1); } });
          renderQueue.push({ depth: 33 + 38, draw: () => { const s = isoToScreen(33, 38, cameraRef.current, canvas.width, canvas.height); drawVolumetricLight(ctx, s.x, s.y - 20, 50, 'rgba(0, 240, 255, 0.35)', gameState.weather); drawCyberFountain(ctx, s.x, s.y, tick, 1); } });
          renderQueue.push({ depth: 42 + 32, draw: () => { const s = isoToScreen(42, 32, cameraRef.current, canvas.width, canvas.height); drawVolumetricLight(ctx, s.x, s.y - 50, 60, 'rgba(0, 240, 255, 0.35)', gameState.weather); drawHoloBillboard(ctx, s.x, s.y, tick, 1); } });
          renderQueue.push({ depth: 42 + 39, draw: () => { const s = isoToScreen(42, 39, cameraRef.current, canvas.width, canvas.height); drawCyberVendingMachine(ctx, s.x - 14, s.y, tick, 1, 'drinks'); drawCyberVendingMachine(ctx, s.x + 14, s.y, tick, 1, 'snacks'); } });

          [{ x: 28, y: 36, student: false }, { x: 38, y: 40, student: true }].forEach(b => {
            renderQueue.push({ depth: b.x + b.y, draw: () => { const s = isoToScreen(b.x, b.y, cameraRef.current, canvas.width, canvas.height); drawCyberBench(ctx, s.x, s.y, b.student, tick, 1); } });
          });
          [{ x: 27, y: 31, color: '#a855f7' }, { x: 38, y: 31, color: '#00f0ff' }, { x: 27, y: 42, color: '#a855f7' }].forEach(l => {
            renderQueue.push({ depth: l.x + l.y, draw: () => { const s = isoToScreen(l.x, l.y, cameraRef.current, canvas.width, canvas.height); drawCyberStreetLamp(ctx, s.x, s.y, tick, 1, l.color); } });
          });

          const trafficSecNow = (now / 1000) % 16;
          const avenueLightNow = trafficSecNow < 6 ? 'green' : trafficSecNow < 8 ? 'yellow' : 'red';
          const boulevardLightNow = (trafficSecNow >= 8 && trafficSecNow < 14) ? 'green' : (trafficSecNow >= 14 ? 'yellow' : 'red');
          const avenueWalk = boulevardLightNow === 'green';
          const boulevardWalk = avenueLightNow === 'green';

          [{ x: 20, y: 20, l1: avenueLightNow, w: boulevardWalk }, { x: 25, y: 20, l1: boulevardLightNow, w: avenueWalk }, { x: 20, y: 25, l1: boulevardLightNow, w: avenueWalk }, { x: 25, y: 25, l1: avenueLightNow, w: boulevardWalk }].forEach(post => {
            renderQueue.push({ depth: post.x + post.y, draw: () => { const s = isoToScreen(post.x, post.y, cameraRef.current, canvas.width, canvas.height); drawTrafficLightSignal(ctx, s.x, s.y, post.l1 as any, post.w, 1); } });
          });

          const droneIsoX = 22.5 + Math.sin(tick * 0.7) * 4.5;
          const droneIsoY = 22.5 + Math.cos(tick * 0.7) * 4.5;
          renderQueue.push({ depth: Math.floor(droneIsoX + droneIsoY) + 1, draw: () => { const s = isoToScreen(droneIsoX, droneIsoY, cameraRef.current, canvas.width, canvas.height); drawSurveillanceDrone(ctx, s.x, s.y - 32, tick, 1); } });

          trafficVehiclesRef.current.forEach(veh => {
            renderQueue.push({ depth: veh.x + veh.y, draw: () => { const s = isoToScreen(veh.x, veh.y, cameraRef.current, canvas.width, canvas.height); drawMovingTrafficVehicle(ctx, s.x, s.y, veh.type, veh.dir, tick, 1); } });
          });

          citizensRef.current.forEach(cit => {
            renderQueue.push({ depth: cit.x + cit.y, draw: () => { const s = isoToScreen(cit.x, cit.y, cameraRef.current, canvas.width, canvas.height); drawCharacter(ctx, s.x, s.y, cit.appearance, cit.dir, cit.pauseTicks <= 0, tick, 1); } });
          });

          Object.values(gameState.npcs || {}).forEach(npc => {
            if (!npc) return;
            const walker = storyNPCWalkersRef.current[npc.id] || { id: npc.id, currentX: npc.x, currentY: npc.y, targetX: npc.x, targetY: npc.y, dir: 'SE', isWalking: false, speed: 0.045, pauseTicks: 0, currentSlot: getNPCScheduleForHour(npc, gameState.timeHour), statusMessage: npc.role };
            const posX = walker.currentX;
            const posY = walker.currentY;

            renderQueue.push({
              depth: posX + posY,
              draw: () => {
                const s = isoToScreen(posX, posY, cameraRef.current, canvas.width, canvas.height);
                drawCharacter(ctx, s.x, s.y, { 
                  name: npc.name?.split(' ')[0] || 'NPC', 
                  skinTone: npc.avatarStyle?.skin || '#fbcfe8', 
                  hairStyle: npc.avatarStyle?.hairStyle || 'slick', 
                  hairColor: npc.avatarStyle?.hair || '#00f0ff', 
                  implant: npc.portraitImplant || 'visor', 
                  implantColor: npc.portraitColor || '#00f0ff', 
                  outfitStyle: npc.avatarStyle?.outfit || 'duster', 
                  outfitColor: npc.portraitColor || '#0f172a' 
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
                  ctx.lineWidth = 1;
                  ctx.beginPath();
                  ctx.roundRect(s.x - badgeWidth / 2, badgeY - 12, badgeWidth, 20, 4);
                  ctx.fill();
                  ctx.stroke();

                  ctx.fillStyle = npc.portraitColor || '#00f0ff';
                  ctx.fillText(nameText, s.x, badgeY - 2);
                  ctx.font = '7.5px monospace';
                  ctx.fillStyle = walker.isWalking ? '#fbbf24' : '#94a3b8';
                  ctx.fillText(roleText, s.x, badgeY + 6);

                  if (distToPlayer < 3.5 && walker.currentSlot) {
                    const actText = walker.isWalking ? `En route: ${walker.currentSlot.locationName}` : walker.currentSlot.activity;
                    ctx.font = '8px monospace';
                    const actWidth = ctx.measureText(actText).width + 12;
                    const bubbleY = s.y - 70;
                    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
                    ctx.strokeStyle = '#00f0ff';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.roundRect(s.x - actWidth / 2, bubbleY - 9, actWidth, 16, 4);
                    ctx.fill();
                    ctx.stroke();
                    ctx.fillStyle = '#00f0ff';
                    ctx.fillText(actText, s.x, bubbleY + 2);
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
                  ctx.save();
                  ctx.textAlign = 'center';
                  ctx.font = 'bold 9px "Chakra Petch", sans-serif';
                  ctx.fillStyle = npc.portraitColor || '#00f0ff';
                  ctx.fillText(npc.name, s.x, s.y - 48);
                  ctx.font = '8px monospace';
                  ctx.fillStyle = '#fbbf24';
                  ctx.fillText(`★ ${npc.role}`, s.x, s.y - 36);
                  ctx.restore();
                },
              });
            }

            const exitX = est.interiorSize.width - 1;
            const exitY = est.interiorSize.height - 1;
            renderQueue.push({
              depth: exitX + exitY + 0.1,
              draw: () => {
                const s = isoToScreen(exitX, exitY, cameraRef.current, canvas.width, canvas.height);
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(s.x - 14, s.y - 22, 28, 22);
                ctx.fillStyle = '#ffffff';
                ctx.font = '700 8px "Chakra Petch", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('SAIR', s.x, s.y - 12);
                ctx.fillText('NEOPOLIS', s.x, s.y - 4);
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
                if (isSelected) {
                  ctx.strokeStyle = '#06b6d4';
                  ctx.lineWidth = 2;
                  ctx.strokeRect(s.x - 20, s.y - 24, 40, 28);
                }
              },
            });
          });

          const exitX = currentHouse.gridWidth - 1;
          const exitY = currentHouse.gridHeight - 1;
          renderQueue.push({
            depth: exitX + exitY + 0.1,
            draw: () => {
              const s = isoToScreen(exitX, exitY, cameraRef.current, canvas.width, canvas.height);
              ctx.fillStyle = '#ef4444';
              ctx.fillRect(s.x - 12, s.y - 20, 24, 20);
              ctx.fillStyle = '#ffffff';
              ctx.font = '700 8px "Chakra Petch", sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('EXIT TO CITY', s.x, s.y - 12);
            },
          });
        }

        // 7. Player Character - BLINDADO CONTRA PROPRIEDADES NULAS NO ESTADO
        renderQueue.push({
          depth: playerRef.current.x + playerRef.current.y,
          draw: () => {
            const s = isoToScreen(playerRef.current.x, playerRef.current.y, cameraRef.current, canvas.width, canvas.height);
            drawCharacter(
              ctx, s.x, s.y,
              {
                name: gameState.player?.name || 'Player',
                skinTone: gameState.player?.skinTone || '#fbcfe8',
                hairStyle: gameState.equippedCosmetics?.hairStyle || gameState.player?.hairStyle || 'slick',
                hairColor: gameState.equippedCosmetics?.hairColor || gameState.player?.hairColor || '#00f0ff',
                implant: gameState.equippedCosmetics?.implant || gameState.player?.implant || 'visor',
                implantColor: gameState.player?.implantColor || '#00f0ff',
                outfitStyle: gameState.equippedCosmetics?.outfitStyle || gameState.player?.outfitStyle || 'duster',
                outfitColor: gameState.equippedCosmetics?.outfitColor || gameState.player?.outfitColor || '#0f172a',
                droneCompanion: (gameState.equippedCosmetics?.drone as any) || gameState.player?.droneCompanion || 'none',
              },
              playerRef.current.dir,
              playerRef.current.isMoving,
              tick,
              1
            );
          },
        });

        renderQueue.sort((a, b) => a.depth - b.depth);
        renderQueue.forEach(item => item.draw());

        if (pProps.isDecorateMode && pProps.selectedCatalogItem && currentHouse) {
          const mx = Math.floor(mouseIsoRef.current.x);
          const my = Math.floor(mouseIsoRef.current.y);
          if (mx >= 0 && mx < currentHouse.gridWidth && my >= 0 && my < currentHouse.gridHeight) {
            const s = isoToScreen(mx + pProps.selectedCatalogItem.width / 2, my + pProps.selectedCatalogItem.height / 2, cameraRef.current, canvas.width, canvas.height);
            ctx.save();
            ctx.globalAlpha = 0.65;
            drawFurniture(ctx, s.x, s.y, pProps.selectedCatalogItem, 0, 1);
            ctx.restore();
          }
        }

        drawWeatherOverlay(ctx, canvas.width, canvas.height, tick, gameState.weather, lightningFlashRef.current, ripplesRef.current, gameState.timeHour);

        floatingTextsRef.current.forEach(ft => {
          const age = now - ft.createdAt;
          const ageRatio = age / 1800;
          const s = isoToScreen(ft.x, ft.y, cameraRef.current, canvas.width, canvas.height);
          const floatY = s.y - 35 - ageRatio * 45;

          ctx.save();
          ctx.globalAlpha = 1 - ageRatio;
          ctx.font = 'bold 12px "Press Start 2P", monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = ft.color;
          ctx.shadowColor = ft.color;
          ctx.shadowBlur = 8;
          ctx.fillText(ft.text, s.x, floatY);
          ctx.restore();
        });

        // 11. CÁLCULO DE PROMPTS & SINCRONIZAÇÃO UI
        let foundPrompt = null;
        const px = playerRef.current.x;
        const py = playerRef.current.y;

        if (gameState.currentScene === 'town') {
          Object.values(gameState.npcs || {}).forEach(npc => {
            if (!npc) return;
            const walker = storyNPCWalkersRef.current[npc.id];
            const posX = walker ? walker.currentX : npc.x;
            const posY = walker ? walker.currentY : npc.y;
            if (Math.hypot(px - posX, py - posY) < 2.2 && !foundPrompt) {
              const s = isoToScreen(posX, posY, cameraRef.current, canvas.width, canvas.height);
              foundPrompt = {
                text: `[E] Talk with ${npc.name} (${walker?.isWalking ? `Commuting to ${walker.currentSlot?.locationName || 'Station'}` : (walker?.currentSlot?.activity || npc.role)})`,
                action: () => pProps.onInteractNPC({ ...npc, locationName: walker?.currentSlot?.locationName || npc.locationName, currentActivity: walker?.currentSlot?.activity, x: posX, y: posY }),
                x: s.x, y: s.y - 50,
              };
            }
          });

          if (!foundPrompt) {
            const storefronts = [
              { x: 10, y: 7, label: "Entrar: Bistrô de Ramen do Chef Bao", action: () => { sound.playChirp(1.1); pProps.onEnterInterior?.('ramen_bistro'); } },
              { x: 4, y: 15, label: 'Entrar: Clínica Ripperdoc do Dex', action: () => { sound.playChirp(1.1); pProps.onEnterInterior?.('ripperdoc_clinic'); } },
              { x: 40, y: 14, label: "Entrar: Oficina de Drones da Sparks", action: () => { sound.playChirp(1.1); pProps.onEnterInterior?.('robotics_garage'); } },
              { x: 14, y: 6, label: 'Entrar: Santuário Netrunner da Nyx', action: () => { sound.playChirp(1.1); pProps.onEnterInterior?.('netrunner_den'); } },
              { x: 38, y: 35, label: 'Entrar: Boutique de Luxo do Vane', action: () => { sound.playChirp(1.1); pProps.onEnterInterior?.('haute_boutique'); } },
              { x: 4, y: 8, label: 'Glitch & Grind Bazaar (Móveis)', action: () => pProps.onOpenStoreTab?.('furniture') },
              { x: 10, y: 14, label: 'The Black Ice Arcade (-10⚡)', action: () => { if (pProps.onConsumeEnergy && !pProps.onConsumeEnergy(10, 'Arcade Game')) { addFloatingText('⚠️ NANITES ESGOTADOS!', '#ef4444'); sound.playChirp(0.6); return; } pProps.onInteractArcade(); } },
              { x: 16, y: 6, label: 'Apex Real Estate (Imóveis)', action: () => pProps.onOpenStoreTab?.('realty') },
              { x: 16, y: 14, label: 'Colheita Flora-Synth (-10⚡, +45 CR)', action: () => { if (pProps.onConsumeEnergy && !pProps.onConsumeEnergy(10, 'Colheita Hidropônica')) { addFloatingText('⚠️ NANITES ESGOTADOS!', '#ef4444'); sound.playChirp(0.6); return; } sound.playCredit(); addFloatingText('+45 CR', '#10b981'); pProps.onActionReward(45, 20, 'Colheita em Estufa'); } },
              { x: 35, y: 29, label: 'Neo-Metro Rapid Transit (+30⚡, +Exp)', action: () => { sound.playNewsBroadcast(); addFloatingText('TRANSIT PASS // +30 ENERGIA', '#00f0ff'); pProps.onActionReward(30, 25, 'Rode Neo-Metro'); } },
              { x: 33, y: 38, label: 'Meditar na Fonte Quântica (+25⚡)', action: () => { sound.playRest(); addFloatingText('+25 Energia', '#c084fc'); pProps.onActionReward(25, 20, 'Refletiu na Fonte Cívica'); } },
            ];
            for (const store of storefronts) {
              if (Math.hypot(px - store.x, py - store.y) < 2.2) {
                const s = isoToScreen(store.x, store.y, cameraRef.current, canvas.width, canvas.height);
                foundPrompt = { text: `[E] ${store.label}`, action: store.action, x: s.x, y: s.y - 45 };
                break;
              }
            }
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

          if (!foundPrompt) {
            [{ x: 28, y: 7, label: 'Workstation Alpha' }, { x: 28, y: 14, label: 'Workstation Beta' }].forEach(k => {
              if (Math.hypot(px - k.x, py - k.y) < 1.8) {
                const s = isoToScreen(k.x, k.y, cameraRef.current, canvas.width, canvas.height);
                foundPrompt = { text: `[E] Hack ${k.label} (+Credits)`, action: pProps.onInteractTerminal, x: s.x, y: s.y - 40 };
              }
            });
          }

          if (!foundPrompt && currentHouse && Math.hypot(px - 38, py - 7) < 2.5) {
            const s = isoToScreen(38, 7, cameraRef.current, canvas.width, canvas.height);
            foundPrompt = { text: `[E] Enter Academy Residence (${currentHouse.name})`, action: () => pProps.onEnterHouse(currentHouse.id), x: s.x, y: s.y - 50 };
          }

          if (!foundPrompt && Math.hypot(px - 33, py - 13) < 2.2) {
            const s = isoToScreen(33, 13, cameraRef.current, canvas.width, canvas.height);
            foundPrompt = { text: '[E] Attend AI Holo-Lecture (+50 CR, +25 Cyber-EXP)', action: () => { sound.playLevelUp(); addFloatingText('+50 CR', '#00f0ff'); pProps.onActionReward(50, 25, 'Attended AI Holo-Lecture'); }, x: s.x, y: s.y - 45 };
          }

          if (!foundPrompt) {
            [{ x: 8, y: 11, n: 'Synth-Drink Dispenser', c: 'drink' }, { x: 10, y: 41, n: 'Cyber-Snack Dispenser', c: 'snack' }, { x: 42, y: 39, n: 'Plaza Vending Station', c: 'all' }].forEach(v => {
              if (Math.hypot(px - v.x, py - v.y) < 2.0) {
                const s = isoToScreen(v.x, v.y, cameraRef.current, canvas.width, canvas.height);
                foundPrompt = { text: `[E] Open ${v.n}`, action: () => pProps.onInteractVendingMachine(v.c as any), x: s.x, y: s.y - 35 };
              }
            });
          }

          if (!foundPrompt) {
            [{ x: 10, y: 10 }, { x: 14, y: 9 }, { x: 28, y: 36 }, { x: 38, y: 40 }].forEach(b => {
              if (Math.hypot(px - b.x, py - b.y) < 1.8) {
                const s = isoToScreen(b.x, b.y, cameraRef.current, canvas.width, canvas.height);
                foundPrompt = { text: '[E] Rest on Cyber-Bench (+25 Energy)', action: () => { sound.playRest(); addFloatingText('+25 Energy', '#38bdf8'); pProps.onActionReward(0, 10, 'Rested on Bench'); }, x: s.x, y: s.y - 35 };
              }
            });
          }

          if (!foundPrompt && Math.hypot(px - 40, py - 14) < 1.9) {
            const s = isoToScreen(40, 14, cameraRef.current, canvas.width, canvas.height);
            foundPrompt = { text: '[E] Reparar Drone (-15⚡, +60 CR, +30 Eng)', action: () => { if (pProps.onConsumeEnergy && !pProps.onConsumeEnergy(15, 'Reparo de Drone')) { addFloatingText('⚠️ NANITES ESGOTADOS!', '#ef4444'); return; } pProps.onInteractRepairBot(); }, x: s.x, y: s.y - 35 };
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

        const currentFloorX = Math.floor(px);
        const currentFloorY = Math.floor(py);
        if (currentFloorX !== lastFloorCoordsRef.current.x || currentFloorY !== lastFloorCoordsRef.current.y) {
          lastFloorCoordsRef.current = { x: currentFloorX, y: currentFloorY };
          setUiCoords({ x: currentFloorX, y: currentFloorY });
        }
      } catch (error) {
        console.error("⛔ CRASH FATAL EVITADO NO GAME LOOP:", error);
      } finally {
        // A garantia de vida. Mesmo que o loop estoure um erro, ele pede o frame seguinte.
        animId = requestAnimationFrame(gameLoop);
      }
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth || 800;
        canvas.height = canvas.parentElement.clientHeight || 600;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const iso = screenToIso(e.clientX - rect.left, e.clientY - rect.top, cameraRef.current, canvas.width, canvas.height);

    if (props.isDecorateMode) {
      const tileX = Math.floor(iso.x);
      const tileY = Math.floor(iso.y);
      if (props.selectedCatalogItem) {
        props.onPlaceFurnitureAt(tileX, tileY);
      } else {
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseIsoRef.current = screenToIso(e.clientX - rect.left, e.clientY - rect.top, cameraRef.current, canvas.width, canvas.height);
  };

  const getCurrentDistrictBadge = () => {
    if (props.gameState?.currentScene === 'interior') {
      const est = NPC_ESTABLISHMENTS[props.gameState.currentInteriorId || 'ramen_bistro'];
      return { badge: 'ESTABELECIMENTO', name: (est?.name || 'INTERIOR').toUpperCase(), color: 'text-pink-400 border-pink-500/40' };
    }
    if (props.gameState?.currentScene !== 'town') {
      const currentHouse = props.gameState?.houses?.find(h => h.id === props.gameState.currentHouseId) || props.gameState?.houses?.[0];
      return { badge: 'RESIDENCE', name: (currentHouse?.name || 'CASA').toUpperCase(), color: 'text-cyan-400 border-cyan-500/40' };
    }

    const { x, y } = uiCoords;
    const isHighway = (x >= 21 && x <= 24) || (y >= 21 && y <= 24);

    if (isHighway) return { badge: 'CENTRAL AXIS', name: 'NEO-HIGHWAY & TRANSIT CORRIDOR', color: 'text-amber-400 border-amber-500/40' };
    if (x < 21 && y < 21) return { badge: 'DISTRICT 01', name: 'NEON COMMERCIAL BOULEVARD', color: 'text-cyan-400 border-cyan-500/40' };
    if (x > 24 && y < 21) return { badge: 'DISTRICT 02', name: 'NEO-AKADEMIA CAMPUS & LABS', color: 'text-pink-400 border-pink-500/40' };
    if (x < 21 && y > 24) return { badge: 'DISTRICT 03', name: 'CAPSULE RESIDENTIAL SECTOR', color: 'text-blue-400 border-blue-500/40' };
    return { badge: 'DISTRICT 04', name: 'CIVIC METRO & TRANSIT PLAZA', color: 'text-purple-400 border-purple-500/40' };
  };

  const currentDistrict = getCurrentDistrictBadge();

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
