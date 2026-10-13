import { CharacterAppearance, FurnitureDef, HouseProperty, NPC, PlacedFurniture, WorldPlant, WeatherType } from '../types/game';
import { FURNITURE_CATALOG } from '../data/gameData';

export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export function isoToScreen(
  isoX: number,
  isoY: number,
  camera: Camera,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  const screenX = (isoX - isoY) * (TILE_WIDTH / 2);
  const screenY = (isoX + isoY) * (TILE_HEIGHT / 2);
  return {
    x: Math.round(canvasWidth / 2 + (screenX - camera.x) * camera.zoom),
    y: Math.round(canvasHeight / 2 + (screenY - camera.y) * camera.zoom),
  };
}

export function screenToIso(
  screenX: number,
  screenY: number,
  camera: Camera,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  const normX = (screenX - canvasWidth / 2) / camera.zoom + camera.x;
  const normY = (screenY - canvasHeight / 2) / camera.zoom + camera.y;

  const isoX = (normX / (TILE_WIDTH / 2) + normY / (TILE_HEIGHT / 2)) / 2;
  const isoY = (normY / (TILE_HEIGHT / 2) - normX / (TILE_WIDTH / 2)) / 2;

  return { x: isoX, y: isoY };
}

// Draw an isometric diamond tile
export function drawIsoTile(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  fillColor: string,
  strokeColor?: string,
  zoom = 1
) {
  const hw = (TILE_WIDTH / 2) * zoom;
  const hh = (TILE_HEIGHT / 2) * zoom;

  ctx.beginPath();
  ctx.moveTo(screenX, screenY - hh);
  ctx.lineTo(screenX + hw, screenY);
  ctx.lineTo(screenX, screenY + hh);
  ctx.lineTo(screenX - hw, screenY);
  ctx.closePath();

  ctx.fillStyle = fillColor;
  ctx.fill();

  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// Weather atmospheric configurations
export interface WeatherAtmosphere {
  skyGradTop: string;
  skyGradBottom: string;
  ambientTint: string;
  ambientIntensity: number; // 0.4 to 1.2
  fogDensity: number;
  label: string;
}

export function getWeatherAtmosphere(weather: WeatherType, timeHour: number = 21): WeatherAtmosphere {
  const isNight = timeHour >= 19 || timeHour < 6;

  switch (weather) {
    case 'neon_rain':
      return {
        skyGradTop: isNight ? '#040713' : '#081226',
        skyGradBottom: isNight ? '#0b1329' : '#142548',
        ambientTint: 'rgba(6, 182, 212, 0.08)',
        ambientIntensity: 0.78,
        fogDensity: 0.35,
        label: 'NEON RAIN',
      };
    case 'acid_fog':
      return {
        skyGradTop: isNight ? '#080d09' : '#101a11',
        skyGradBottom: isNight ? '#142215' : '#1e331c',
        ambientTint: 'rgba(163, 230, 53, 0.12)',
        ambientIntensity: 0.62,
        fogDensity: 0.85,
        label: 'ACID FOG',
      };
    case 'glitch_storm':
      return {
        skyGradTop: '#0a0518',
        skyGradBottom: '#190a36',
        ambientTint: 'rgba(217, 70, 239, 0.14)',
        ambientIntensity: 0.52,
        fogDensity: 0.55,
        label: 'GLITCH STORM',
      };
    case 'cyber_clear':
    default:
      return {
        skyGradTop: isNight ? '#020308' : '#0a0d20',
        skyGradBottom: isNight ? '#080c1d' : '#151d3b',
        ambientTint: 'rgba(56, 189, 248, 0.04)',
        ambientIntensity: 1.05,
        fogDensity: 0.05,
        label: 'CYBER CLEAR',
      };
  }
}

// Draw dynamic day/night atmospheric lighting & weather overlays
export function drawWeatherOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  weather: WeatherType,
  lightningFlash: number = 0,
  ripples: { x: number; y: number; progress: number }[] = [],
  timeHour: number = 21
) {
  ctx.save();

  if (timeHour >= 5 && timeHour < 9) {
    const dawnGrad = ctx.createLinearGradient(0, 0, 0, height);
    dawnGrad.addColorStop(0, 'rgba(255, 140, 60, 0.18)');
    dawnGrad.addColorStop(0.5, 'rgba(251, 191, 36, 0.10)');
    dawnGrad.addColorStop(1, 'rgba(14, 165, 233, 0.08)');
    ctx.fillStyle = dawnGrad;
    ctx.fillRect(0, 0, width, height);
  } else if (timeHour >= 9 && timeHour < 18) {
    ctx.fillStyle = 'rgba(224, 242, 254, 0.04)';
    ctx.fillRect(0, 0, width, height);
  } else if (timeHour >= 18 && timeHour < 21) {
    const duskGrad = ctx.createLinearGradient(0, 0, 0, height);
    duskGrad.addColorStop(0, 'rgba(217, 70, 239, 0.22)');
    duskGrad.addColorStop(0.5, 'rgba(147, 51, 234, 0.20)');
    duskGrad.addColorStop(1, 'rgba(249, 115, 22, 0.15)');
    ctx.fillStyle = duskGrad;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.fillStyle = 'rgba(4, 7, 20, 0.62)';
    ctx.fillRect(0, 0, width, height);
  }

  if (weather === 'neon_rain' || weather === 'glitch_storm') {
    const count = weather === 'glitch_storm' ? 110 : 75;
    const rainSpeed = weather === 'glitch_storm' ? 680 : 490;
    const windTilt = weather === 'glitch_storm' ? -9 : -6;
    const dropLength = weather === 'glitch_storm' ? 20 : 15;

    ctx.lineWidth = weather === 'glitch_storm' ? 1.6 : 1.2;

    for (let i = 0; i < count; i++) {
      const rx = ((i * 43 + time * (windTilt * 30)) % (width + 60)) - 30;
      const ry = (i * 71 + time * rainSpeed) % (height + 30);

      if (i % 3 === 0) {
        ctx.strokeStyle = weather === 'glitch_storm' ? 'rgba(236, 72, 153, 0.5)' : 'rgba(236, 72, 153, 0.35)';
      } else {
        ctx.strokeStyle = weather === 'glitch_storm' ? 'rgba(56, 189, 248, 0.55)' : 'rgba(6, 182, 212, 0.4)';
      }

      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + windTilt, ry + dropLength);
      ctx.stroke();
    }

    ripples.forEach(rip => {
      const alpha = Math.max(0, 1 - rip.progress);
      const radius = rip.progress * 18;
      ctx.beginPath();
      ctx.ellipse(rip.x, rip.y, radius, radius * 0.5, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(6, 182, 212, ${alpha * 0.55})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });
  }

  if (weather === 'acid_fog') {
    const fogCount = 8;
    for (let i = 0; i < fogCount; i++) {
      const fx = ((i * 180 + time * 38) % (width + 260)) - 130;
      const fy = ((i * 110 + Math.sin(time * 0.8 + i) * 35) % (height + 80));
      const rad = 150 + (i % 3) * 55;

      const fogGrad = ctx.createRadialGradient(fx, fy, 10, fx, fy, rad);
      fogGrad.addColorStop(0, 'rgba(163, 230, 53, 0.22)');
      fogGrad.addColorStop(0.5, 'rgba(101, 163, 13, 0.12)');
      fogGrad.addColorStop(1, 'rgba(20, 83, 45, 0)');

      ctx.fillStyle = fogGrad;
      ctx.beginPath();
      ctx.arc(fx, fy, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(163, 230, 53, 0.08)';
    ctx.fillRect(0, height * 0.35, width, height * 0.65);
  }

  if (weather === 'cyber_clear') {
    for (let i = 0; i < 32; i++) {
      const px = ((i * 79 + Math.sin(time * 0.5 + i) * 20) % width);
      const py = (height - ((i * 47 + time * 28) % height));
      const sparkle = (Math.sin(time * 3 + i) + 1) / 2;

      ctx.fillStyle = i % 2 === 0 ? `rgba(6, 182, 212, ${0.35 + sparkle * 0.55})` : `rgba(236, 72, 153, ${0.35 + sparkle * 0.55})`;
      ctx.beginPath();
      ctx.arc(px, py, 1.5 + sparkle, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (weather === 'glitch_storm' && lightningFlash > 0) {
    ctx.fillStyle = `rgba(240, 253, 250, ${lightningFlash * 0.5})`;
    ctx.fillRect(0, 0, width, height);

    const sliceY = (Math.sin(time * 20) * 0.5 + 0.5) * height;
    ctx.fillStyle = `rgba(236, 72, 153, ${lightningFlash * 0.4})`;
    ctx.fillRect(0, sliceY, width, 22);
  }

  ctx.restore();
}

export function drawVolumetricLight(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  radius: number,
  color: string,
  weather: WeatherType
) {
  ctx.save();
  const mult = weather === 'acid_fog' ? 1.6 : weather === 'neon_rain' ? 1.2 : 1.0;
  const rad = radius * mult;

  const grad = ctx.createRadialGradient(screenX, screenY, 2, screenX, screenY, rad);
  grad.addColorStop(0, color);
  grad.addColorStop(0.4, color.replace(/[\d\.]+\)$/, '0.12)'));
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(screenX, screenY, rad, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawRain(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  drawWeatherOverlay(ctx, width, height, time, 'neon_rain', 0, []);
}

export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  appearance: {
    skinTone: string;
    hairStyle: string;
    hairColor: string;
    implant: string;
    implantColor?: string;
    outfitStyle: string;
    outfitColor: string;
    droneCompanion?: string;
    name?: string;
  },
  direction: 'NE' | 'SE' | 'SW' | 'NW',
  isMoving: boolean,
  animTick: number,
  zoom: number = 1
) {
  const z = zoom;
  ctx.save();

  ctx.beginPath();
  ctx.ellipse(screenX, screenY + 4 * z, 10 * z, 5 * z, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fill();

  const bob = isMoving ? Math.sin(animTick * 8) * 2 * z : 0;
  const legSwing = isMoving ? Math.sin(animTick * 8) * 3 * z : 0;
  const charBaseY = screenY - 20 * z + bob;

  ctx.fillStyle = '#1e1b4b'; 
  ctx.fillRect(screenX - 4 * z + legSwing, charBaseY + 14 * z, 3 * z, 7 * z);
  ctx.fillRect(screenX + 1 * z - legSwing, charBaseY + 14 * z, 3 * z, 7 * z);

  ctx.fillStyle = appearance.implantColor || '#06b6d4';
  ctx.fillRect(screenX - 4 * z + legSwing, charBaseY + 20 * z, 4 * z, 2 * z);
  ctx.fillRect(screenX + 1 * z - legSwing, charBaseY + 20 * z, 4 * z, 2 * z);

  ctx.fillStyle = appearance.outfitColor || '#3b82f6';
  ctx.fillRect(screenX - 6 * z, charBaseY + 6 * z, 12 * z, 9 * z);

  if (appearance.outfitStyle === 'duster') {
    ctx.fillStyle = appearance.outfitColor || '#18181b';
    ctx.fillRect(screenX - 7 * z, charBaseY + 10 * z, 3 * z, 8 * z);
    ctx.fillRect(screenX + 4 * z, charBaseY + 10 * z, 3 * z, 8 * z);
  } else if (appearance.outfitStyle === 'hoodie') {
    ctx.fillStyle = '#374151';
    ctx.fillRect(screenX - 4 * z, charBaseY + 4 * z, 8 * z, 4 * z);
  }

  ctx.fillStyle = appearance.skinTone || '#fbd0b4';
  ctx.fillRect(screenX - 5 * z, charBaseY - 4 * z, 10 * z, 10 * z);

  const isFacingSouth = direction === 'SE' || direction === 'SW';
  const eyeOffset = direction === 'SE' ? 1 * z : direction === 'SW' ? -1 * z : 0;

  if (isFacingSouth) {
    if (appearance.implant === 'visor') {
      ctx.fillStyle = appearance.implantColor || '#f43f5e';
      ctx.fillRect(screenX - 5 * z + eyeOffset, charBaseY - 1 * z, 9 * z, 3 * z);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(screenX - 2 * z + eyeOffset, charBaseY - 1 * z, 2 * z, 1 * z);
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(screenX - 3 * z + eyeOffset, charBaseY - 1 * z, 2 * z, 2 * z);
      ctx.fillRect(screenX + 1 * z + eyeOffset, charBaseY - 1 * z, 2 * z, 2 * z);

      if (appearance.implant === 'optic_ring') {
        ctx.fillStyle = appearance.implantColor || '#06b6d4';
        ctx.fillRect(screenX - 4 * z + eyeOffset, charBaseY - 2 * z, 4 * z, 4 * z);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(screenX - 3 * z + eyeOffset, charBaseY - 1 * z, 2 * z, 2 * z);
      } else if (appearance.implant === 'cyber_tattoo') {
        ctx.fillStyle = appearance.implantColor || '#10b981';
        ctx.fillRect(screenX + 3 * z + eyeOffset, charBaseY, 2 * z, 3 * z);
      }
    }
  }

  ctx.fillStyle = appearance.hairColor || '#ec4899';
  if (appearance.hairStyle === 'pixie') {
    ctx.fillRect(screenX - 6 * z, charBaseY - 7 * z, 12 * z, 5 * z);
    ctx.fillRect(screenX - 6 * z, charBaseY - 3 * z, 2 * z, 4 * z);
  } else if (appearance.hairStyle === 'spiky') {
    ctx.fillRect(screenX - 5 * z, charBaseY - 8 * z, 10 * z, 5 * z);
    ctx.fillRect(screenX - 3 * z, charBaseY - 10 * z, 6 * z, 3 * z);
  } else if (appearance.hairStyle === 'bob') {
    ctx.fillRect(screenX - 6 * z, charBaseY - 7 * z, 12 * z, 5 * z);
    ctx.fillRect(screenX - 7 * z, charBaseY - 3 * z, 3 * z, 7 * z);
    ctx.fillRect(screenX + 4 * z, charBaseY - 3 * z, 3 * z, 7 * z);
  } else if (appearance.hairStyle === 'mohawk') {
    ctx.fillRect(screenX - 2 * z, charBaseY - 10 * z, 4 * z, 8 * z);
  } else {
    ctx.fillRect(screenX - 5 * z, charBaseY - 6 * z, 10 * z, 4 * z);
    ctx.fillRect(screenX - 6 * z, charBaseY - 4 * z, 2 * z, 4 * z);
  }

  if (appearance.droneCompanion && appearance.droneCompanion !== 'none') {
    const droneY = charBaseY - 10 * z + Math.sin(animTick * 6) * 3 * z;
    const droneX = screenX + 14 * z;

    if (appearance.droneCompanion === 'holo_cat') {
      ctx.fillStyle = 'rgba(236, 72, 153, 0.85)';
      ctx.fillRect(droneX - 3 * z, droneY - 3 * z, 6 * z, 5 * z);
      ctx.fillRect(droneX - 3 * z, droneY - 5 * z, 2 * z, 2 * z);
      ctx.fillRect(droneX + 1 * z, droneY - 5 * z, 2 * z, 2 * z);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(droneX - 2 * z, droneY - 1 * z, 1 * z, 1 * z);
      ctx.fillRect(droneX + 1 * z, droneY - 1 * z, 1 * z, 1 * z);
    } else {
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(droneX - 4 * z, droneY - 2 * z, 8 * z, 4 * z);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(droneX - 1 * z, droneY - 1 * z, 2 * z, 2 * z);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
      ctx.beginPath();
      ctx.moveTo(droneX, droneY + 2 * z);
      ctx.lineTo(droneX, screenY);
      ctx.stroke();
    }
  }

  if (appearance.name) {
    ctx.font = '600 10px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(screenX - 24 * z, charBaseY - 16 * z, 48 * z, 12 * z);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(appearance.name, screenX, charBaseY - 7 * z);
  }

  ctx.restore();
}

export function drawFurniture(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  furniture: FurnitureDef,
  rotation: number = 0,
  zoom = 1,
  isGhost = false
) {
  const z = zoom;
  ctx.save();

  if (isGhost) {
    ctx.globalAlpha = 0.65;
  }

  const { category, color, glowColor } = furniture;
  const isRug = furniture.id.includes('rug') || furniture.category === 'decor' && furniture.name.toLowerCase().includes('rug');

  if (!isRug) {
    ctx.beginPath();
    ctx.ellipse(screenX, screenY + 4 * z, 18 * z, 9 * z, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fill();
  }

  if (isRug) {
    const rw = (furniture.width * 24 - 4) * z;
    const rh = (furniture.height * 12 - 2) * z;
    ctx.beginPath();
    ctx.moveTo(screenX, screenY - rh);
    ctx.lineTo(screenX + rw, screenY);
    ctx.lineTo(screenX, screenY + rh);
    ctx.lineTo(screenX - rw, screenY);
    ctx.closePath();
    ctx.fillStyle = color || '#0f172a';
    ctx.fill();
    ctx.strokeStyle = glowColor || '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = glowColor ? glowColor.replace(/[\d\.]+\)$/, '0.35)') : 'rgba(0,240,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(screenX, screenY - rh * 0.5);
    ctx.lineTo(screenX + rw * 0.5, screenY);
    ctx.lineTo(screenX, screenY + rh * 0.5);
    ctx.lineTo(screenX - rw * 0.5, screenY);
    ctx.closePath();
    ctx.stroke();
  } else if (category === 'bed') {
    const isCryo = furniture.id.includes('deluxe') || furniture.id.includes('cryo');

    if (isCryo) {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(screenX, screenY - 14 * z);
      ctx.lineTo(screenX + 24 * z, screenY);
      ctx.lineTo(screenX, screenY + 16 * z);
      ctx.lineTo(screenX - 24 * z, screenY);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(screenX, screenY - 8 * z);
      ctx.lineTo(screenX + 18 * z, screenY + 3 * z);
      ctx.lineTo(screenX, screenY + 13 * z);
      ctx.lineTo(screenX - 18 * z, screenY + 3 * z);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(screenX, screenY - 10 * z, 14 * z, Math.PI, 0);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#050b14';
      ctx.fillRect(screenX - 10 * z, screenY - 26 * z, 20 * z, 10 * z);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(screenX - 8 * z, screenY - 21 * z);
      ctx.lineTo(screenX - 3 * z, screenY - 21 * z);
      ctx.lineTo(screenX - 1 * z, screenY - 25 * z);
      ctx.lineTo(screenX + 2 * z, screenY - 17 * z);
      ctx.lineTo(screenX + 4 * z, screenY - 21 * z);
      ctx.lineTo(screenX + 8 * z, screenY - 21 * z);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.moveTo(screenX, screenY - 8 * z);
      ctx.lineTo(screenX + 22 * z, screenY + 3 * z);
      ctx.lineTo(screenX, screenY + 14 * z);
      ctx.lineTo(screenX - 22 * z, screenY + 3 * z);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(screenX, screenY - 3 * z);
      ctx.lineTo(screenX + 18 * z, screenY + 6 * z);
      ctx.lineTo(screenX, screenY + 15 * z);
      ctx.lineTo(screenX - 18 * z, screenY + 6 * z);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(screenX - 10 * z, screenY - 9 * z, 8 * z, 5 * z);
      ctx.fillRect(screenX + 2 * z, screenY - 9 * z, 8 * z, 5 * z);

      if (glowColor) {
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(screenX - 20 * z, screenY + 4 * z);
        ctx.lineTo(screenX, screenY + 14 * z);
        ctx.lineTo(screenX + 20 * z, screenY + 4 * z);
        ctx.stroke();
      }
    }
  } else if (category === 'terminal') {
    const isBattlestation = furniture.id.includes('battlestation');

    if (isBattlestation) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(screenX - 24 * z, screenY - 16 * z, 48 * z, 16 * z);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1;
      ctx.strokeRect(screenX - 24 * z, screenY - 16 * z, 48 * z, 16 * z);

      ctx.fillStyle = '#090d16';
      ctx.fillRect(screenX - 14 * z, screenY - 38 * z, 28 * z, 18 * z);
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(screenX - 14 * z, screenY - 38 * z, 28 * z, 18 * z);

      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(screenX - 12 * z, screenY - 35 * z, 24 * z, 2 * z);
      ctx.fillRect(screenX - 12 * z, screenY - 31 * z, 18 * z, 2 * z);
      ctx.fillRect(screenX - 12 * z, screenY - 27 * z, 22 * z, 2 * z);

      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(screenX - 26 * z, screenY - 35 * z, 11 * z, 15 * z);
      ctx.fillRect(screenX + 15 * z, screenY - 35 * z, 11 * z, 15 * z);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(screenX - 24 * z, screenY - 32 * z, 7 * z, 2 * z);
      ctx.fillRect(screenX + 17 * z, screenY - 32 * z, 7 * z, 2 * z);

      ctx.fillStyle = '#ff2a85';
      ctx.fillRect(screenX - 10 * z, screenY - 11 * z, 20 * z, 4 * z);
    } else {
      ctx.fillStyle = '#111827';
      ctx.fillRect(screenX - 16 * z, screenY - 14 * z, 32 * z, 14 * z);

      ctx.fillStyle = glowColor || '#10b981';
      ctx.fillRect(screenX - 14 * z, screenY - 26 * z, 12 * z, 10 * z);
      ctx.fillRect(screenX, screenY - 28 * z, 14 * z, 12 * z);

      ctx.fillStyle = '#374151';
      ctx.fillRect(screenX - 10 * z, screenY - 8 * z, 20 * z, 4 * z);
      ctx.fillStyle = glowColor || '#34d399';
      ctx.fillRect(screenX - 8 * z, screenY - 7 * z, 16 * z, 2 * z);
    }
  } else if (category === 'arcade') {
    ctx.fillStyle = '#18181b';
    ctx.fillRect(screenX - 10 * z, screenY - 34 * z, 20 * z, 36 * z);

    ctx.fillStyle = color;
    ctx.fillRect(screenX - 9 * z, screenY - 33 * z, 18 * z, 6 * z);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 5px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DRIFT', screenX, screenY - 28.5 * z);

    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(screenX - 8 * z, screenY - 25 * z, 16 * z, 12 * z);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(screenX - 6 * z, screenY - 22 * z, 8 * z, 2 * z);

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(screenX - 4 * z, screenY - 11 * z, 2 * z, 3 * z);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(screenX + 2 * z, screenY - 11 * z, 3 * z, 2 * z);
  } else if (category === 'plant') {
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(screenX - 9 * z, screenY - 6 * z, 18 * z, 10 * z);
    ctx.strokeStyle = '#374151';
    ctx.strokeRect(screenX - 9 * z, screenY - 6 * z, 18 * z, 10 * z);

    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(screenX, screenY - 6 * z);
    ctx.lineTo(screenX - 3 * z, screenY - 14 * z);
    ctx.lineTo(screenX + 2 * z, screenY - 20 * z);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(screenX - 4 * z, screenY - 18 * z, 10 * z, 0, Math.PI * 2);
    ctx.arc(screenX + 6 * z, screenY - 16 * z, 9 * z, 0, Math.PI * 2);
    ctx.arc(screenX, screenY - 24 * z, 8 * z, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = glowColor || '#a7f3d0';
    ctx.fillRect(screenX - 4 * z, screenY - 20 * z, 3 * z, 3 * z);
    ctx.fillRect(screenX + 4 * z, screenY - 15 * z, 3 * z, 3 * z);
    ctx.fillRect(screenX, screenY - 26 * z, 2 * z, 2 * z);
  } else if (category === 'lighting') {
    ctx.fillStyle = '#334155';
    ctx.fillRect(screenX - 2 * z, screenY - 28 * z, 4 * z, 28 * z);

    ctx.fillStyle = glowColor || '#f43f5e';
    ctx.beginPath();
    ctx.arc(screenX, screenY - 30 * z, 7 * z, 0, Math.PI * 2);
    ctx.fill();

    const halo = ctx.createRadialGradient(screenX, screenY - 30 * z, 2 * z, screenX, screenY - 30 * z, 24 * z);
    halo.addColorStop(0, 'rgba(244, 63, 94, 0.45)');
    halo.addColorStop(1, 'rgba(244, 63, 94, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(screenX, screenY - 30 * z, 24 * z, 0, Math.PI * 2);
    ctx.fill();
  } else if (category === 'seating') {
    ctx.fillStyle = color;
    ctx.fillRect(screenX - 18 * z, screenY - 12 * z, 36 * z, 14 * z);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(screenX - 20 * z, screenY - 14 * z, 4 * z, 16 * z);
    ctx.fillRect(screenX + 16 * z, screenY - 14 * z, 4 * z, 16 * z);

    ctx.strokeStyle = glowColor || '#818cf8';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(screenX - 18 * z, screenY - 12 * z, 36 * z, 14 * z);
  } else if (furniture.id.includes('vending')) {
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(screenX - 10 * z, screenY - 32 * z, 20 * z, 32 * z);
    ctx.strokeStyle = '#f87171';
    ctx.lineWidth = 1;
    ctx.strokeRect(screenX - 10 * z, screenY - 32 * z, 20 * z, 32 * z);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(screenX - 8 * z, screenY - 26 * z, 16 * z, 14 * z);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(screenX - 6 * z, screenY - 23 * z, 5 * z, 4 * z);
    ctx.fillRect(screenX + 1 * z, screenY - 23 * z, 5 * z, 4 * z);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(screenX - 6 * z, screenY - 8 * z, 12 * z, 6 * z);
  } else if (furniture.id.includes('heart')) {
    ctx.fillStyle = '#f43f5e';
    ctx.font = '700 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('♥', screenX, screenY - 16 * z);
    const heartGlow = ctx.createRadialGradient(screenX, screenY - 20 * z, 2, screenX, screenY - 20 * z, 18 * z);
    heartGlow.addColorStop(0, 'rgba(244, 63, 94, 0.4)');
    heartGlow.addColorStop(1, 'rgba(244, 63, 94, 0)');
    ctx.fillStyle = heartGlow;
    ctx.beginPath();
    ctx.arc(screenX, screenY - 20 * z, 18 * z, 0, Math.PI * 2);
    ctx.fill();
  } else if (furniture.id.includes('aquarium')) {
    ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
    ctx.fillRect(screenX - 14 * z, screenY - 22 * z, 28 * z, 18 * z);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(screenX - 14 * z, screenY - 22 * z, 28 * z, 18 * z);

    ctx.fillStyle = '#ff2a85';
    ctx.beginPath();
    ctx.arc(screenX - 4 * z, screenY - 14 * z, 3 * z, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(screenX + 5 * z, screenY - 12 * z, 2.5 * z, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = color || '#1e293b';
    ctx.fillRect(screenX - 10 * z, screenY - 20 * z, 20 * z, 20 * z);
    if (glowColor) {
      ctx.fillStyle = glowColor;
      ctx.fillRect(screenX - 8 * z, screenY - 16 * z, 16 * z, 4 * z);
    }
  }

  ctx.restore();
}

export function drawBuildingFacade(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  type: 'clinic' | 'greenhouse' | 'bazaar' | 'blackice' | 'ramen' | 'realty',
  zoom = 1
) {
  const z = zoom;
  ctx.save();

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(screenX - 32 * z, screenY - 60 * z, 64 * z, 56 * z);

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(screenX - 34 * z, screenY - 64 * z, 68 * z, 6 * z);

  if (type === 'clinic') {
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(screenX - 24 * z, screenY - 56 * z, 48 * z, 14 * z);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 8px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CHROME & NEEDLE', screenX, screenY - 47 * z);
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(screenX - 2 * z, screenY - 38 * z, 4 * z, 12 * z);
    ctx.fillRect(screenX - 6 * z, screenY - 34 * z, 12 * z, 4 * z);
  } else if (type === 'greenhouse') {
    ctx.fillStyle = '#10b981';
    ctx.fillRect(screenX - 24 * z, screenY - 56 * z, 48 * z, 14 * z);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 8px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FLORA SYNTH', screenX, screenY - 47 * z);
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.arc(screenX, screenY - 30 * z, 8 * z, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'bazaar') {
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(screenX - 24 * z, screenY - 56 * z, 48 * z, 14 * z);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 8px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GLITCH & GRIND', screenX, screenY - 47 * z);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(screenX - 6 * z, screenY - 36 * z, 12 * z, 12 * z);
  } else if (type === 'blackice') {
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(screenX - 24 * z, screenY - 56 * z, 48 * z, 14 * z);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 8px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('THE BLACK ICE', screenX, screenY - 47 * z);
    ctx.fillStyle = '#ec4899';
    ctx.fillRect(screenX - 5 * z, screenY - 35 * z, 10 * z, 10 * z);
  } else if (type === 'ramen') {
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(screenX - 24 * z, screenY - 56 * z, 48 * z, 14 * z);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 8px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BAO’S STEAM WOK', screenX, screenY - 47 * z);
    ctx.fillStyle = '#f87171';
    ctx.beginPath();
    ctx.arc(screenX, screenY - 32 * z, 6 * z, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#eab308';
    ctx.fillRect(screenX - 24 * z, screenY - 56 * z, 48 * z, 14 * z);
    ctx.fillStyle = '#000000';
    ctx.font = '700 8px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('APEX REAL ESTATE', screenX, screenY - 47 * z);
  }

  ctx.fillStyle = '#0284c7';
  ctx.fillRect(screenX - 8 * z, screenY - 18 * z, 16 * z, 18 * z);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(screenX - 6 * z, screenY - 16 * z, 12 * z, 16 * z);

  ctx.restore();
}

export function drawAcademyComplex(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  time: number,
  zoom = 1
) {
  const z = zoom;
  ctx.save();

  ctx.fillStyle = 'rgba(10, 12, 22, 0.6)';
  ctx.beginPath();
  ctx.ellipse(screenX + 20 * z, screenY + 40 * z, 140 * z, 60 * z, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1e2334';
  ctx.fillRect(screenX - 80 * z, screenY - 140 * z, 180 * z, 140 * z);
  ctx.strokeStyle = '#37415a';
  ctx.lineWidth = 2 * z;
  ctx.strokeRect(screenX - 80 * z, screenY - 140 * z, 180 * z, 140 * z);

  ctx.fillStyle = '#2b3248';
  ctx.fillRect(screenX - 85 * z, screenY - 148 * z, 190 * z, 12 * z);
  ctx.fillStyle = '#3f4968';
  ctx.fillRect(screenX - 83 * z, screenY - 147 * z, 186 * z, 3 * z);

  ctx.save();
  ctx.fillStyle = '#1e3a5f';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(screenX - 45 * z, screenY - 165 * z);
  ctx.lineTo(screenX + 5 * z, screenY - 165 * z);
  ctx.lineTo(screenX - 5 * z, screenY - 148 * z);
  ctx.lineTo(screenX - 55 * z, screenY - 148 * z);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(screenX - 25 * z, screenY - 165 * z);
  ctx.lineTo(screenX - 35 * z, screenY - 148 * z);
  ctx.moveTo(screenX - 10 * z, screenY - 165 * z);
  ctx.lineTo(screenX - 20 * z, screenY - 148 * z);
  ctx.stroke();
  ctx.restore();

  const dishBob = Math.sin(time * 0.8) * 2 * z;
  ctx.fillStyle = '#475569';
  ctx.fillRect(screenX + 45 * z, screenY - 160 * z, 4 * z, 14 * z);
  ctx.beginPath();
  ctx.arc(screenX + 47 * z, screenY - 164 * z + dishBob, 12 * z, -0.6, 2.6);
  ctx.fillStyle = '#64748b';
  ctx.fill();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#00f0ff';
  ctx.beginPath();
  ctx.arc(screenX + 47 * z, screenY - 164 * z + dishBob, 2 * z, 0, Math.PI * 2);
  ctx.fill();

  const crestPulse = 0.7 + Math.sin(time * 2) * 0.25;
  ctx.strokeStyle = `rgba(255, 42, 133, ${crestPulse})`;
  ctx.lineWidth = 2 * z;
  ctx.fillStyle = 'rgba(255, 42, 133, 0.12)';
  ctx.beginPath();
  ctx.moveTo(screenX - 60 * z, screenY - 120 * z);
  ctx.lineTo(screenX - 20 * z, screenY - 120 * z);
  ctx.lineTo(screenX - 20 * z, screenY - 95 * z);
  ctx.lineTo(screenX - 40 * z, screenY - 78 * z);
  ctx.lineTo(screenX - 60 * z, screenY - 95 * z);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeRect(screenX - 46 * z, screenY - 110 * z, 12 * z, 18 * z);

  ctx.strokeStyle = 'rgba(0, 240, 255, 0.85)';
  ctx.fillStyle = 'rgba(0, 240, 255, 0.1)';
  ctx.beginPath();
  ctx.moveTo(screenX + 35 * z, screenY - 80 * z);
  ctx.lineTo(screenX + 75 * z, screenY - 80 * z);
  ctx.lineTo(screenX + 75 * z, screenY - 55 * z);
  ctx.lineTo(screenX + 55 * z, screenY - 40 * z);
  ctx.lineTo(screenX + 35 * z, screenY - 55 * z);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0f1422';
  ctx.fillRect(screenX - 18 * z, screenY - 78 * z, 36 * z, 42 * z);
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 2 * z;
  ctx.strokeRect(screenX - 18 * z, screenY - 78 * z, 36 * z, 42 * z);
  ctx.strokeStyle = '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(screenX, screenY - 78 * z);
  ctx.lineTo(screenX, screenY - 36 * z);
  ctx.stroke();
  ctx.fillStyle = '#ff2a85';
  ctx.fillRect(screenX - 8 * z, screenY - 58 * z, 16 * z, 3 * z);

  const stepCount = 6;
  const startY = screenY - 36 * z;
  for (let i = 0; i < stepCount; i++) {
    const stepW = (38 + i * 8) * z;
    const curY = startY + i * 6 * z;
    const curX = screenX - (i * 4) * z;

    ctx.fillStyle = '#1a1f30';
    ctx.fillRect(curX - stepW / 2, curY, stepW, 6 * z);

    ctx.strokeStyle = i % 2 === 0 ? '#00f0ff' : '#ff2a85';
    ctx.lineWidth = 1.8 * z;
    ctx.beginPath();
    ctx.moveTo(curX - stepW / 2, curY);
    ctx.lineTo(curX + stepW / 2, curY);
    ctx.stroke();
  }

  ctx.strokeStyle = '#ff2a85';
  ctx.lineWidth = 2.5 * z;
  ctx.beginPath();
  ctx.moveTo(screenX - 70 * z, screenY - 20 * z);
  ctx.lineTo(screenX - 45 * z, screenY - 20 * z);
  ctx.lineTo(screenX - 45 * z, screenY);
  ctx.stroke();

  ctx.strokeStyle = '#00f0ff';
  ctx.beginPath();
  ctx.moveTo(screenX + 30 * z, screenY - 25 * z);
  ctx.lineTo(screenX + 50 * z, screenY - 25 * z);
  ctx.lineTo(screenX + 50 * z, screenY + 5 * z);
  ctx.stroke();

  ctx.fillStyle = '#151926';
  ctx.fillRect(screenX - 75 * z, screenY - 70 * z, 20 * z, 36 * z);
  ctx.strokeStyle = '#334155';
  ctx.strokeRect(screenX - 75 * z, screenY - 70 * z, 20 * z, 36 * z);
  for (let r = 0; r < 4; r++) {
    const ledOn = (Math.floor(time * 4) + r) % 3 === 0;
    ctx.fillStyle = ledOn ? '#00f0ff' : '#22c55e';
    ctx.fillRect(screenX - 72 * z, screenY - 65 * z + r * 7 * z, 4 * z, 3 * z);
    ctx.fillStyle = '#475569';
    ctx.fillRect(screenX - 66 * z, screenY - 65 * z + r * 7 * z, 9 * z, 3 * z);
  }

  ctx.restore();
}

export function drawHackerKiosk(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  time: number,
  zoom = 1,
  isOccupied = true
) {
  const z = zoom;
  ctx.save();

  ctx.fillStyle = '#1e2436';
  ctx.fillRect(screenX - 22 * z, screenY - 32 * z, 44 * z, 32 * z);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(screenX - 22 * z, screenY - 32 * z, 44 * z, 32 * z);

  ctx.fillStyle = '#2b334d';
  ctx.fillRect(screenX - 26 * z, screenY - 44 * z, 52 * z, 12 * z);
  ctx.fillStyle = '#ff2a85';
  ctx.fillRect(screenX - 24 * z, screenY - 43 * z, 48 * z, 3 * z);
  ctx.strokeStyle = 'rgba(255, 42, 133, 0.6)';
  ctx.lineWidth = 2 * z;
  ctx.strokeRect(screenX - 26 * z, screenY - 44 * z, 52 * z, 12 * z);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(screenX - 16 * z, screenY - 26 * z, 14 * z, 12 * z);
  ctx.fillStyle = '#00f0ff';
  ctx.fillRect(screenX - 14 * z, screenY - 24 * z, 10 * z, 8 * z);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(screenX - 13 * z, screenY - 22 * z, 6 * z, 1 * z);

  ctx.fillStyle = '#475569';
  ctx.fillRect(screenX - 15 * z, screenY - 12 * z, 12 * z, 4 * z);

  ctx.strokeStyle = '#ff2a85';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(screenX - 10 * z, screenY - 8 * z);
  ctx.lineTo(screenX - 10 * z, screenY + 4 * z);
  ctx.lineTo(screenX - 24 * z, screenY + 10 * z);
  ctx.stroke();

  if (isOccupied) {
    const typeBob = Math.sin(time * 10) * 1 * z;
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(screenX + 2 * z, screenY - 20 * z + typeBob, 10 * z, 12 * z);
    ctx.fillStyle = '#fbd0b4';
    ctx.fillRect(screenX + 3 * z, screenY - 28 * z + typeBob, 8 * z, 8 * z);
    ctx.fillStyle = '#ff2a85';
    ctx.fillRect(screenX + 2 * z, screenY - 30 * z + typeBob, 10 * z, 4 * z);
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(screenX + 7 * z, screenY - 25 * z + typeBob, 4 * z, 2 * z);
  }

  ctx.restore();
}

export function drawHoloLectureStage(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  time: number,
  zoom = 1
) {
  const z = zoom;
  ctx.save();

  ctx.fillStyle = '#181e2e';
  ctx.beginPath();
  ctx.moveTo(screenX, screenY - 16 * z);
  ctx.lineTo(screenX + 44 * z, screenY);
  ctx.lineTo(screenX, screenY + 16 * z);
  ctx.lineTo(screenX - 44 * z, screenY);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#ff2a85';
  ctx.lineWidth = 2.5 * z;
  ctx.stroke();

  ctx.fillStyle = '#101420';
  ctx.fillRect(screenX - 44 * z, screenY, 88 * z, 8 * z);
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 1.5 * z;
  ctx.beginPath();
  ctx.moveTo(screenX - 44 * z, screenY + 8 * z);
  ctx.lineTo(screenX + 44 * z, screenY + 8 * z);
  ctx.stroke();

  const holoFloat = Math.sin(time * 2.5) * 3 * z;
  const holoX = screenX + 16 * z;
  const holoY = screenY - 45 * z + holoFloat;

  ctx.fillStyle = 'rgba(0, 240, 255, 0.22)';
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 1.5;
  ctx.fillRect(holoX - 22 * z, holoY - 16 * z, 44 * z, 28 * z);
  ctx.strokeRect(holoX - 22 * z, holoY - 16 * z, 44 * z, 28 * z);

  ctx.fillStyle = '#00f0ff';
  ctx.font = `bold ${Math.round(11 * z)}px "Chakra Petch", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('AI', holoX, holoY - 2 * z);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(holoX - 16 * z, holoY + 6 * z);
  ctx.lineTo(holoX - 6 * z, holoY + 6 * z);
  ctx.lineTo(holoX, holoY + 2 * z);
  ctx.lineTo(holoX + 8 * z, holoY + 6 * z);
  ctx.lineTo(holoX + 16 * z, holoY + 6 * z);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
  ctx.strokeRect(screenX - 35 * z, screenY - 50 * z, 24 * z, 20 * z);
  for (let g = 1; g < 4; g++) {
    ctx.beginPath();
    ctx.moveTo(screenX - 35 * z + g * 6 * z, screenY - 50 * z);
    ctx.lineTo(screenX - 35 * z + g * 6 * z, screenY - 30 * z);
    ctx.stroke();
  }

  const profBob = Math.sin(time * 3) * 1 * z;
  const profX = screenX - 6 * z;
  const profY = screenY - 14 * z + profBob;

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(profX - 5 * z, profY - 16 * z, 10 * z, 14 * z);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(profX - 2 * z, profY - 16 * z, 4 * z, 8 * z);

  ctx.fillStyle = '#00f0ff';
  ctx.fillRect(profX + 5 * z, profY - 15 * z, 3 * z, 9 * z);

  ctx.fillStyle = '#fed7aa';
  ctx.fillRect(profX - 4 * z, profY - 24 * z, 8 * z, 8 * z);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(profX - 5 * z, profY - 26 * z, 10 * z, 3 * z);
  ctx.fillStyle = '#00f0ff';
  ctx.fillRect(profX - 3 * z, profY - 22 * z, 6 * z, 2 * z);

  ctx.restore();
}

export function drawCyberTree(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  time: number,
  zoom = 1
) {
  const z = zoom;
  ctx.save();

  ctx.fillStyle = '#1c2235';
  ctx.beginPath();
  ctx.ellipse(screenX, screenY + 4 * z, 14 * z, 7 * z, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 2 * z;
  ctx.stroke();

  ctx.fillStyle = '#131826';
  ctx.fillRect(screenX - 14 * z, screenY + 4 * z, 28 * z, 8 * z);
  ctx.beginPath();
  ctx.ellipse(screenX, screenY + 12 * z, 14 * z, 6 * z, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#171a26';
  ctx.fillRect(screenX - 3 * z, screenY - 28 * z, 6 * z, 32 * z);

  ctx.beginPath();
  ctx.moveTo(screenX, screenY - 18 * z);
  ctx.lineTo(screenX - 14 * z, screenY - 34 * z);
  ctx.lineTo(screenX - 12 * z, screenY - 36 * z);
  ctx.lineTo(screenX + 2 * z, screenY - 20 * z);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(screenX, screenY - 20 * z);
  ctx.lineTo(screenX + 16 * z, screenY - 38 * z);
  ctx.lineTo(screenX + 18 * z, screenY - 36 * z);
  ctx.lineTo(screenX + 2 * z, screenY - 18 * z);
  ctx.closePath();
  ctx.fill();

  const leafSway = Math.sin(time * 1.5) * 1.5 * z;
  const leafClusters = [
    { x: screenX - 16 * z + leafSway, y: screenY - 42 * z, r: 12 * z },
    { x: screenX + 16 * z - leafSway, y: screenY - 46 * z, r: 14 * z },
    { x: screenX + leafSway * 0.5, y: screenY - 56 * z, r: 16 * z },
    { x: screenX - 6 * z, y: screenY - 38 * z, r: 10 * z },
  ];

  leafClusters.forEach((cl, i) => {
    ctx.fillStyle = i % 2 === 0 ? '#00b4d8' : '#0077b6';
    ctx.beginPath();
    ctx.arc(cl.x, cl.y, cl.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#00f5d4';
    ctx.beginPath();
    ctx.arc(cl.x - 2 * z, cl.y - 3 * z, cl.r * 0.65, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cl.x - 1 * z, cl.y - 4 * z, 2 * z, 2 * z);
    ctx.fillRect(cl.x + 3 * z, cl.y + 1 * z, 1.5 * z, 1.5 * z);
  });

  ctx.restore();
}

export function drawCyberBench(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  hasStudent = false,
  time = 0,
  zoom = 1
) {
  const z = zoom;
  ctx.save();

  ctx.fillStyle = '#1c2234';
  ctx.fillRect(screenX - 22 * z, screenY - 18 * z, 44 * z, 8 * z);
  for (let f = 0; f < 5; f++) {
    ctx.fillStyle = f % 2 === 0 ? '#00f0ff' : '#ff2a85';
    ctx.beginPath();
    ctx.arc(screenX - 16 * z + f * 8 * z, screenY - 20 * z, 2.5 * z, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#2d3748';
  ctx.fillRect(screenX - 20 * z, screenY - 10 * z, 40 * z, 4 * z);
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(screenX - 20 * z, screenY - 4 * z, 40 * z, 4 * z);

  ctx.fillStyle = '#00f0ff';
  ctx.fillRect(screenX - 18 * z, screenY, 3 * z, 6 * z);
  ctx.fillRect(screenX + 15 * z, screenY, 3 * z, 6 * z);

  if (hasStudent) {
    const studentX = screenX - 4 * z;
    const studentY = screenY - 12 * z;

    ctx.fillStyle = '#6366f1';
    ctx.fillRect(studentX - 4 * z, studentY, 8 * z, 10 * z);
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(studentX - 3 * z, studentY - 8 * z, 6 * z, 7 * z);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(studentX - 4 * z, studentY - 10 * z, 8 * z, 3 * z);

    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(studentX - 5 * z, studentY + 2 * z, 10 * z, 2 * z);
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(studentX - 5 * z, studentY - 3 * z, 10 * z, 5 * z);
  }

  ctx.restore();
}

export function drawSteamGrate(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  time: number,
  zoom = 1
) {
  const z = zoom;
  ctx.save();

  ctx.fillStyle = '#111827';
  ctx.fillRect(screenX - 14 * z, screenY - 6 * z, 28 * z, 12 * z);
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 1;
  ctx.strokeRect(screenX - 14 * z, screenY - 6 * z, 28 * z, 12 * z);

  ctx.strokeStyle = '#00f0ff';
  for (let s = -10; s <= 10; s += 5) {
    ctx.beginPath();
    ctx.moveTo(screenX + s * z, screenY - 4 * z);
    ctx.lineTo(screenX + s * z, screenY + 4 * z);
    ctx.stroke();
  }

  for (let p = 0; p < 3; p++) {
    const steamProgress = ((time * 1.8 + p * 0.33) % 1);
    const steamY = screenY - 4 * z - steamProgress * 30 * z;
    const steamX = screenX + Math.sin(time * 3 + p) * 6 * z;
    const steamRadius = (4 + steamProgress * 12) * z;
    const steamAlpha = (1 - steamProgress) * 0.35;

    ctx.fillStyle = `rgba(186, 230, 253, ${steamAlpha})`;
    ctx.beginPath();
    ctx.arc(steamX, steamY, steamRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawParkedHovercar(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  color = '#8b5cf6',
  zoom = 1
) {
  const z = zoom;
  ctx.save();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.beginPath();
  ctx.ellipse(screenX, screenY + 8 * z, 28 * z, 12 * z, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.fillRect(screenX - 22 * z, screenY - 8 * z, 44 * z, 16 * z);

  ctx.fillStyle = '#6d28d9';
  ctx.beginPath();
  ctx.moveTo(screenX - 22 * z, screenY - 8 * z);
  ctx.lineTo(screenX - 8 * z, screenY - 18 * z);
  ctx.lineTo(screenX + 12 * z, screenY - 18 * z);
  ctx.lineTo(screenX + 22 * z, screenY - 8 * z);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#00f0ff';
  ctx.fillRect(screenX - 6 * z, screenY - 16 * z, 16 * z, 7 * z);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(screenX - 4 * z, screenY - 15 * z, 6 * z, 2 * z);

  ctx.fillStyle = '#fef08a';
  ctx.fillRect(screenX - 20 * z, screenY - 4 * z, 4 * z, 4 * z);
  ctx.fillStyle = '#ff2a85';
  ctx.fillRect(screenX + 18 * z, screenY - 4 * z, 4 * z, 3 * z);

  ctx.fillStyle = '#00f0ff';
  ctx.fillRect(screenX - 16 * z, screenY + 4 * z, 8 * z, 3 * z);
  ctx.fillRect(screenX + 8 * z, screenY + 4 * z, 8 * z, 3 * z);

  ctx.restore();
}

export function drawSurveillanceDrone(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  time: number,
  zoom = 1
) {
  const z = zoom;
  ctx.save();

  const hoverY = screenY + Math.sin(time * 4) * 3 * z;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(screenX, screenY + 16 * z, 8 * z, 4 * z, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(screenX - 6 * z, hoverY - 4 * z, 12 * z, 8 * z);

  ctx.fillStyle = '#475569';
  ctx.fillRect(screenX - 12 * z, hoverY - 6 * z, 6 * z, 2 * z);
  ctx.fillRect(screenX + 6 * z, hoverY - 6 * z, 6 * z, 2 * z);
  ctx.fillRect(screenX - 12 * z, hoverY + 4 * z, 6 * z, 2 * z);
  ctx.fillRect(screenX + 6 * z, hoverY + 4 * z, 6 * z, 2 * z);

  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(screenX - 14 * z, hoverY - 8 * z, 5 * z, 2 * z);
  ctx.strokeRect(screenX + 9 * z, hoverY - 8 * z, 5 * z, 2 * z);

  ctx.fillStyle = '#ff2a85';
  ctx.beginPath();
  ctx.arc(screenX, hoverY, 2 * z, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawCyberStreetLamp(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  time: number,
  zoom = 1,
  color = '#00f0ff'
) {
  const z = zoom;
  ctx.save();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(screenX, screenY + 2 * z, 6 * z, 3 * z, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1e2433';
  ctx.fillRect(screenX - 3 * z, screenY - 4 * z, 6 * z, 6 * z);

  ctx.fillStyle = '#334155';
  ctx.fillRect(screenX - 1.5 * z, screenY - 50 * z, 3 * z, 48 * z);

  ctx.fillStyle = '#475569';
  ctx.fillRect(screenX - 8 * z, screenY - 52 * z, 16 * z, 3 * z);

  ctx.fillStyle = color;
  ctx.fillRect(screenX - 8 * z, screenY - 49 * z, 4 * z, 3 * z);
  ctx.fillRect(screenX + 4 * z, screenY - 49 * z, 4 * z, 3 * z);

  const pulse = 0.85 + Math.sin(time * 3) * 0.15;
  const coneGrad = ctx.createRadialGradient(screenX, screenY, 4 * z, screenX, screenY, 32 * z);
  coneGrad.addColorStop(0, color === '#00f0ff' ? `rgba(0, 240, 255, ${0.28 * pulse})` : `rgba(255, 42, 133, ${0.28 * pulse})`);
  coneGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = coneGrad;
  ctx.beginPath();
  ctx.ellipse(screenX, screenY, 28 * z, 14 * z, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawCyberVendingMachine(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  time: number,
  zoom = 1,
  theme: 'drinks' | 'snacks' = 'drinks'
) {
  const z = zoom;
  ctx.save();

  const isSnack = theme === 'snacks';
  const primaryNeon = isSnack ? '#f59e0b' : '#00f0ff';
  const headerNeon = isSnack ? '#f97316' : '#ff2a85';
  const headerLabel = isSnack ? 'CYBER-SNACK' : 'SYNTH-DRINK';

  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.beginPath();
  ctx.ellipse(screenX, screenY + 4 * z, 16 * z, 7 * z, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#111625';
  ctx.fillRect(screenX - 12 * z, screenY - 37 * z, 24 * z, 39 * z);
  ctx.strokeStyle = primaryNeon;
  ctx.lineWidth = 1.5 * z;
  ctx.strokeRect(screenX - 12 * z, screenY - 37 * z, 24 * z, 39 * z);

  ctx.fillStyle = headerNeon;
  ctx.fillRect(screenX - 10 * z, screenY - 35 * z, 20 * z, 6 * z);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(4.8 * z)}px "Chakra Petch", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(headerLabel, screenX, screenY - 30 * z);

  ctx.fillStyle = '#080c18';
  ctx.fillRect(screenX - 10 * z, screenY - 27 * z, 20 * z, 17 * z);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1 * z;
  ctx.strokeRect(screenX - 10 * z, screenY - 27 * z, 20 * z, 17 * z);

  if (isSnack) {
    const snackColors = ['#ef4444', '#f59e0b', '#10b981', '#ec4899'];
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 4; col++) {
        ctx.fillStyle = snackColors[(col + row * 2) % snackColors.length];
        ctx.fillRect(screenX - 8.5 * z + col * 4.5 * z, screenY - 25 * z + row * 7.5 * z, 3.5 * z, 5 * z);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(screenX - 8.5 * z + col * 4.5 * z, screenY - 23 * z + row * 7.5 * z, 3.5 * z, 1.2 * z);
      }
    }
  } else {
    const canColors = ['#00f0ff', '#ff2a85', '#22c55e', '#38bdf8'];
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 4; col++) {
        ctx.fillStyle = canColors[(col + row * 2) % canColors.length];
        ctx.fillRect(screenX - 8 * z + col * 4.5 * z, screenY - 25 * z + row * 7.5 * z, 3 * z, 5.5 * z);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(screenX - 8 * z + col * 4.5 * z, screenY - 25 * z + row * 7.5 * z, 3 * z, 1 * z);
      }
    }
  }

  const pulse = Math.sin(time * 6) > 0;
  ctx.fillStyle = pulse ? '#22c55e' : '#15803d';
  ctx.fillRect(screenX + 6 * z, screenY - 8 * z, 2 * z, 2 * z);

  ctx.fillStyle = '#0a0f1d';
  ctx.fillRect(screenX - 8 * z, screenY - 7 * z, 16 * z, 5 * z);
  ctx.strokeStyle = primaryNeon;
  ctx.lineWidth = 1 * z;
  ctx.strokeRect(screenX - 8 * z, screenY - 7 * z, 16 * z, 5 * z);

  ctx.restore();
}

export function drawCampusSignpost(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  time: number,
  zoom = 1
) {
  const z = zoom;
  ctx.save();

  ctx.fillStyle = '#334155';
  ctx.fillRect(screenX - 1.5 * z, screenY - 32 * z, 3 * z, 32 * z);

  const bob = Math.sin(time * 2) * 1.5 * z;

  ctx.fillStyle = 'rgba(0, 240, 255, 0.25)';
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 1;
  ctx.strokeRect(screenX - 4 * z, screenY - 30 * z + bob, 26 * z, 8 * z);
  ctx.fillRect(screenX - 4 * z, screenY - 30 * z + bob, 26 * z, 8 * z);
  ctx.fillStyle = '#00f0ff';
  ctx.font = `bold ${Math.round(5.5 * z)}px "Chakra Petch", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('ACADEMY ->', screenX + 9 * z, screenY - 24 * z + bob);

  ctx.fillStyle = 'rgba(255, 42, 133, 0.25)';
  ctx.strokeStyle = '#ff2a85';
  ctx.strokeRect(screenX - 22 * z, screenY - 20 * z + bob, 24 * z, 8 * z);
  ctx.fillRect(screenX - 22 * z, screenY - 20 * z + bob, 24 * z, 8 * z);
  ctx.fillStyle = '#ff2a85';
  ctx.fillText('<- LABS', screenX - 10 * z, screenY - 14 * z + bob);

  ctx.restore();
}

export type TrafficVehicleType = 'taxi' | 'speeder' | 'patrol' | 'cargo';
export type TrafficDirection = 'SE' | 'NW' | 'SW' | 'NE';

export function drawMovingTrafficVehicle(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  type: TrafficVehicleType,
  dir: TrafficDirection,
  time: number,
  zoom = 1
) {
  const z = zoom;
  ctx.save();

  const hoverOffset = Math.sin(time * 5 + screenX * 0.05) * 2.5 * z;
  const sy = screenY + hoverOffset;

  ctx.fillStyle = 'rgba(2, 6, 23, 0.65)';
  ctx.beginPath();
  ctx.ellipse(screenX, screenY + 10 * z, 26 * z, 11 * z, 0, 0, Math.PI * 2);
  ctx.fill();

  let bodyColor = '#f59e0b';
  let trimColor = '#00f0ff';
  let underglowColor = 'rgba(0, 240, 255, 0.4)';

  if (type === 'patrol') {
    bodyColor = '#0f172a';
    trimColor = '#38bdf8';
    underglowColor = 'rgba(56, 189, 248, 0.45)';
  } else if (type === 'speeder') {
    bodyColor = '#ec4899';
    trimColor = '#a855f7';
    underglowColor = 'rgba(236, 72, 153, 0.5)';
  } else if (type === 'cargo') {
    bodyColor = '#0284c7';
    trimColor = '#38bdf8';
    underglowColor = 'rgba(14, 165, 233, 0.35)';
  }

  const underglowGrad = ctx.createRadialGradient(screenX, sy + 4 * z, 2 * z, screenX, sy + 6 * z, 24 * z);
  underglowGrad.addColorStop(0, underglowColor);
  underglowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = underglowGrad;
  ctx.beginPath();
  ctx.ellipse(screenX, sy + 6 * z, 26 * z, 12 * z, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = bodyColor;
  ctx.fillRect(screenX - 22 * z, sy - 8 * z, 44 * z, 15 * z);

  ctx.fillStyle = type === 'patrol' ? '#1e293b' : '#1e1b4b';
  ctx.beginPath();
  ctx.moveTo(screenX - 18 * z, sy - 8 * z);
  ctx.lineTo(screenX - 8 * z, sy - 17 * z);
  ctx.lineTo(screenX + 12 * z, sy - 17 * z);
  ctx.lineTo(screenX + 20 * z, sy - 8 * z);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#06b6d4';
  ctx.fillRect(screenX - 6 * z, sy - 15 * z, 16 * z, 6 * z);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(screenX - 4 * z, sy - 14 * z, 6 * z, 1.5 * z);

  ctx.fillStyle = '#00f0ff';
  ctx.fillRect(screenX - 18 * z, sy + 4 * z, 8 * z, 3 * z);
  ctx.fillRect(screenX + 10 * z, sy + 4 * z, 8 * z, 3 * z);

  if (type === 'taxi') {
    ctx.fillStyle = '#0f172a';
    for (let c = 0; c < 5; c++) {
      ctx.fillRect(screenX - 16 * z + c * 7 * z, sy - 3 * z, 3.5 * z, 3 * z);
    }
    ctx.fillStyle = '#000000';
    ctx.fillRect(screenX - 6 * z, sy - 21 * z, 12 * z, 4 * z);
    ctx.fillStyle = '#00f0ff';
    ctx.font = `bold ${Math.round(4 * z)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('TAXI', screenX, sy - 18 * z);
  } else if (type === 'patrol') {
    const strobe = Math.sin(time * 18) > 0;
    ctx.fillStyle = strobe ? '#ef4444' : '#00f0ff';
    ctx.fillRect(screenX - 6 * z, sy - 21 * z, 5 * z, 4 * z);
    ctx.fillStyle = strobe ? '#00f0ff' : '#ef4444';
    ctx.fillRect(screenX + 1 * z, sy - 21 * z, 5 * z, 4 * z);

    ctx.fillStyle = strobe ? 'rgba(239, 68, 68, 0.25)' : 'rgba(0, 240, 255, 0.25)';
    ctx.beginPath();
    ctx.arc(screenX, sy - 19 * z, 16 * z, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'cargo') {
    ctx.fillStyle = '#334155';
    ctx.fillRect(screenX - 20 * z, sy - 20 * z, 18 * z, 12 * z);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(screenX - 20 * z, sy - 20 * z, 18 * z, 12 * z);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(screenX - 19 * z, sy - 10 * z, 16 * z, 2 * z);
  }

  const isFacingForward = dir === 'SE' || dir === 'SW';

  if (isFacingForward) {
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(screenX + 14 * z, sy - 3 * z, 4 * z, 4 * z);
    ctx.fillRect(screenX + 18 * z, sy - 1 * z, 3 * z, 3 * z);

    const beamGrad = ctx.createRadialGradient(screenX + 20 * z, sy, 2 * z, screenX + 50 * z, sy + 18 * z, 36 * z);
    beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
    beamGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.15)');
    beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.ellipse(screenX + 38 * z, sy + 14 * z, 28 * z, 14 * z, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(screenX - 22 * z, sy - 3 * z, 3 * z, 3 * z);
  } else {
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(screenX + 16 * z, sy - 3 * z, 4 * z, 4 * z);

    const beamGrad = ctx.createRadialGradient(screenX - 20 * z, sy, 2 * z, screenX - 50 * z, sy - 18 * z, 36 * z);
    beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.3)');
    beamGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.ellipse(screenX - 38 * z, sy - 14 * z, 28 * z, 14 * z, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawSkyscraperTower(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  name: string,
  floors = 5,
  time = 0,
  zoom = 1,
  accentColor = '#00f0ff'
) {
  const z = zoom;
  ctx.save();

  const towerW = 70 * z;
  const towerH = (80 + floors * 18) * z;
  const baseTop = screenY - towerH;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.beginPath();
  ctx.ellipse(screenX + 10 * z, screenY + 15 * z, 55 * z, 25 * z, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(screenX - towerW / 2, baseTop, towerW, towerH);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2 * z;
  ctx.strokeRect(screenX - towerW / 2, baseTop, towerW, towerH);

  ctx.fillStyle = accentColor;
  ctx.fillRect(screenX - towerW / 2 + 2 * z, baseTop + 10 * z, 2.5 * z, towerH - 20 * z);
  ctx.fillRect(screenX + towerW / 2 - 4.5 * z, baseTop + 10 * z, 2.5 * z, towerH - 20 * z);

  const cols = 5;
  const winRows = Math.floor(floors * 2.5);
  for (let r = 0; r < winRows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = screenX - towerW / 2 + 10 * z + c * 11 * z;
      const wy = baseTop + 24 * z + r * 14 * z;
      const seed = Math.sin(r * 13 + c * 7 + screenX);
      const isLit = seed > -0.2;
      const pulseLit = seed > 0.6 ? 0.6 + Math.sin(time * 2 + r + c) * 0.4 : 1.0;

      if (isLit) {
        ctx.fillStyle = (c + r) % 3 === 0
          ? `rgba(0, 240, 255, ${0.4 * pulseLit})`
          : (c + r) % 3 === 1
          ? `rgba(251, 191, 36, ${0.45 * pulseLit})`
          : `rgba(244, 63, 94, ${0.35 * pulseLit})`;
      } else {
        ctx.fillStyle = '#080d1a';
      }
      ctx.fillRect(wx, wy, 7 * z, 6 * z);
    }
  }

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(screenX - towerW / 2 - 4 * z, baseTop - 8 * z, towerW + 8 * z, 10 * z);
  ctx.fillStyle = accentColor;
  ctx.fillRect(screenX - 2 * z, baseTop - 36 * z, 4 * z, 28 * z);

  const beaconPulse = Math.sin(time * 6) > 0;
  ctx.fillStyle = beaconPulse ? '#ef4444' : '#7f1d1d';
  ctx.beginPath();
  ctx.arc(screenX, baseTop - 38 * z, 3.5 * z, 0, Math.PI * 2);
  ctx.fill();

  if (beaconPulse) {
    ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.beginPath();
    ctx.arc(screenX, baseTop - 38 * z, 10 * z, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fillRect(screenX - 28 * z, baseTop + 6 * z, 56 * z, 14 * z);
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1 * z;
  ctx.strokeRect(screenX - 28 * z, baseTop + 6 * z, 56 * z, 14 * z);

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(6.5 * z)}px "Chakra Petch", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(name.toUpperCase(), screenX, baseTop + 16 * z);

  ctx.restore();
}

export function drawMetroStation(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  time: number,
  zoom = 1
) {
  const z = zoom;
  ctx.save();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.beginPath();
  ctx.ellipse(screenX, screenY + 4 * z, 34 * z, 18 * z, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(screenX - 26 * z, screenY - 26 * z, 52 * z, 28 * z);
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 2 * z;
  ctx.strokeRect(screenX - 26 * z, screenY - 26 * z, 52 * z, 28 * z);

  ctx.fillStyle = '#00f0ff';
  ctx.fillRect(screenX - 24 * z, screenY - 34 * z, 48 * z, 10 * z);
  ctx.fillStyle = '#0f172a';
  ctx.font = `bold ${Math.round(6 * z)}px "Chakra Petch", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('NEO-METRO LINE', screenX, screenY - 27 * z);

  const steps = 4;
  for (let s = 0; s < steps; s++) {
    ctx.fillStyle = s % 2 === 0 ? '#1e293b' : '#334155';
    ctx.fillRect(screenX - 16 * z + s * 2 * z, screenY - 14 * z + s * 4.5 * z, 32 * z - s * 4 * z, 4 * z);
  }

  const subwayGlow = 0.5 + Math.sin(time * 3) * 0.25;
  ctx.fillStyle = `rgba(0, 240, 255, ${subwayGlow})`;
  ctx.fillRect(screenX - 10 * z, screenY + 2 * z, 20 * z, 3 * z);

  const pulseTrain = Math.floor(time * 1.5) % 2 === 0 ? 'LINE 01: ARRIVING' : 'LINE 04: 2 MIN';
  ctx.fillStyle = '#10b981';
  ctx.font = `bold ${Math.round(4.8 * z)}px monospace`;
  ctx.fillText(pulseTrain, screenX, screenY - 18 * z);

  ctx.fillStyle = '#ef4444';
  ctx.fillRect(screenX - 14 * z, screenY - 10 * z, 3 * z, 6 * z);
  ctx.fillStyle = '#10b981';
  ctx.fillRect(screenX + 11 * z, screenY - 10 * z, 3 * z, 6 * z);

  ctx.restore();
}

export function drawHoloBillboard(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  time: number,
  zoom = 1
) {
  const z = zoom;
  ctx.save();

  ctx.fillStyle = '#334155';
  ctx.fillRect(screenX - 18 * z, screenY - 45 * z, 4 * z, 45 * z);
  ctx.fillRect(screenX + 14 * z, screenY - 45 * z, 4 * z, 45 * z);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(screenX - 32 * z, screenY - 78 * z, 64 * z, 34 * z);
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 1.5 * z;
  ctx.strokeRect(screenX - 32 * z, screenY - 78 * z, 64 * z, 34 * z);

  const adIdx = Math.floor(time / 4) % 3;
  let adTitle = 'ARASAKA NEURAL';
  let adSub = 'UPGRADE TODAY';
  let adBg = '#1e1b4b';
  let adColor = '#00f0ff';

  if (adIdx === 1) {
    adTitle = 'SYNTH-RAMEN';
    adSub = 'HOT IN 3 SECONDS';
    adBg = '#450a0a';
    adColor = '#f87171';
  } else if (adIdx === 2) {
    adTitle = 'NIGHT CITY WIRE';
    adSub = 'STAY INFORMED';
    adBg = '#14532d';
    adColor = '#34d399';
  }

  ctx.fillStyle = adBg;
  ctx.fillRect(screenX - 30 * z, screenY - 76 * z, 60 * z, 30 * z);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  for (let y = screenY - 76 * z; y < screenY - 46 * z; y += 3 * z) {
    ctx.fillRect(screenX - 30 * z, y, 60 * z, 1.2 * z);
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(5.5 * z)}px "Chakra Petch", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(adTitle, screenX, screenY - 64 * z);

  ctx.fillStyle = adColor;
  ctx.font = `bold ${Math.round(4.8 * z)}px "Press Start 2P", monospace`;
  ctx.fillText(adSub, screenX, screenY - 54 * z);

  ctx.restore();
}

export function drawTrafficLightSignal(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  state: 'red' | 'yellow' | 'green' = 'green',
  pedestrianWalk: boolean = false,
  zoom = 1
) {
  const z = zoom;
  ctx.save();

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(screenX - 2 * z, screenY - 44 * z, 4 * z, 44 * z);

  ctx.fillStyle = '#334155';
  ctx.fillRect(screenX - 2 * z, screenY - 44 * z, 34 * z, 4 * z);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(screenX + 18 * z, screenY - 46 * z, 14 * z, 18 * z);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1;
  ctx.strokeRect(screenX + 18 * z, screenY - 46 * z, 14 * z, 18 * z);

  const isRed = state === 'red';
  ctx.fillStyle = isRed ? '#ef4444' : '#450a0a';
  ctx.beginPath();
  ctx.arc(screenX + 25 * z, screenY - 41 * z, 3 * z, 0, Math.PI * 2);
  ctx.fill();
  if (isRed) {
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8 * z;
  }

  const isYellow = state === 'yellow';
  ctx.fillStyle = isYellow ? '#f59e0b' : '#451a03';
  ctx.beginPath();
  ctx.arc(screenX + 25 * z, screenY - 35 * z, 3 * z, 0, Math.PI * 2);
  ctx.fill();
  if (isYellow) {
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 8 * z;
  }

  const isGreen = state === 'green';
  ctx.fillStyle = isGreen ? '#10b981' : '#064e3b';
  ctx.beginPath();
  ctx.arc(screenX + 25 * z, screenY - 29 * z, 3 * z, 0, Math.PI * 2);
  ctx.fill();
  if (isGreen) {
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 8 * z;
  }
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#090d16';
  ctx.fillRect(screenX + 3 * z, screenY - 33 * z, 16 * z, 10 * z);
  ctx.strokeStyle = pedestrianWalk ? '#10b981' : '#ef4444';
  ctx.lineWidth = 1;
  ctx.strokeRect(screenX + 3 * z, screenY - 33 * z, 16 * z, 10 * z);

  ctx.fillStyle = pedestrianWalk ? '#10b981' : '#ef4444';
  ctx.font = `bold ${Math.round(4.5 * z)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(pedestrianWalk ? 'WALK' : 'WAIT', screenX + 11 * z, screenY - 26 * z);

  ctx.restore();
}

export function drawPedestrianSkybridge(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  time: number,
  zoom = 1
) {
  const z = zoom;
  ctx.save();

  const spanW = 90 * z;
  const spanH = 22 * z;
  const bridgeY = screenY - 70 * z;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(screenX - spanW / 2, screenY - 6 * z, spanW, 14 * z);

  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(screenX - spanW / 2, bridgeY, spanW, spanH);
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 1.5 * z;
  ctx.strokeRect(screenX - spanW / 2, bridgeY, spanW, spanH);

  ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
  ctx.fillRect(screenX - spanW / 2 + 4 * z, bridgeY + 4 * z, spanW - 8 * z, spanH - 8 * z);

  const silX = screenX + Math.sin(time * 0.8) * 20 * z;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(silX - 2 * z, bridgeY + 8 * z, 4 * z, 8 * z);
  ctx.beginPath();
  ctx.arc(silX, bridgeY + 6 * z, 2 * z, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ff2a85';
  ctx.fillRect(screenX - spanW / 2, bridgeY + spanH, spanW, 2 * z);

  ctx.restore();
}

export function drawCyberFountain(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  time: number,
  zoom = 1
) {
  const z = zoom;
  ctx.save();

  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.ellipse(screenX, screenY, 26 * z, 13 * z, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 1.5 * z;
  ctx.stroke();

  ctx.fillStyle = '#06b6d4';
  ctx.beginPath();
  ctx.ellipse(screenX, screenY, 22 * z, 11 * z, 0, 0, Math.PI * 2);
  ctx.fill();

  const fountainH = 28 * z + Math.sin(time * 4) * 4 * z;
  const colGrad = ctx.createLinearGradient(screenX, screenY, screenX, screenY - fountainH);
  colGrad.addColorStop(0, 'rgba(0, 240, 255, 0.8)');
  colGrad.addColorStop(1, 'rgba(255, 42, 133, 0.1)');
  ctx.fillStyle = colGrad;
  ctx.fillRect(screenX - 3 * z, screenY - fountainH, 6 * z, fountainH);

  const ring1 = (time * 1.5) % 1.0;
  ctx.strokeStyle = `rgba(0, 240, 255, ${1 - ring1})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(screenX, screenY - fountainH * ring1, 16 * z * ring1, 8 * z * ring1, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

export function drawTrashBinAndHydrant(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  zoom = 1
) {
  const z = zoom;
  ctx.save();

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(screenX - 10 * z, screenY - 12 * z, 8 * z, 12 * z);
  ctx.fillStyle = '#10b981';
  ctx.fillRect(screenX - 9 * z, screenY - 10 * z, 6 * z, 2 * z);

  ctx.fillStyle = '#e11d48';
  ctx.fillRect(screenX + 4 * z, screenY - 10 * z, 6 * z, 10 * z);
  ctx.fillStyle = '#00f0ff';
  ctx.beginPath();
  ctx.arc(screenX + 7 * z, screenY - 10 * z, 3 * z, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// =========================================================================
// POST-PROCESSING PIPELINE: CRT & RGB ABERRATION SHADERS
// =========================================================================

export function applyChromaticAberration(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number = 3
) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  const copyData = new Uint8ClampedArray(data);

  for (let i = 0; i < data.length; i += 4) {
    const isRed = i % 4 === 0;
    const isBlue = (i - 2) % 4 === 0;

    if (isRed) {
      const offset = i + (intensity * 4);
      if (offset < data.length) {
        data[i] = copyData[offset];
      }
    } else if (isBlue) {
      const offset = i - (intensity * 4);
      if (offset >= 0) {
        data[i] = copyData[offset];
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

export function drawCRTOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number
) {
  ctx.save();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  for (let y = 0; y < height; y += 3) {
    ctx.fillRect(0, y, width, 1);
  }

  const rollY = (time * 120) % height;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.fillRect(0, rollY, width, 40);

  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.sqrt(cx * cx + cy * cy);
  
  const vignette = ctx.createRadialGradient(cx, cy, maxRadius * 0.4, cx, cy, maxRadius);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.6)');

  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}
