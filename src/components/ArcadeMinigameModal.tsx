import React, { useState, useEffect, useRef } from 'react';
import { Gamepad2, Trophy, Coins, X, RefreshCw } from 'lucide-react';
import { sound } from '../utils/audio';

interface ArcadeMinigameProps {
  onWinCredits: (credits: number, exp: number) => void;
  onClose: () => void;
}

export const ArcadeMinigameModal: React.FC<ArcadeMinigameProps> = ({
  onWinCredits,
  onClose,
}) => {
  const [score, setScore] = useState(0);
  const [creditsEarned, setCreditsEarned] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(120);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playerLaneRef = useRef(1); // 0, 1, 2
  const obstaclesRef = useRef<{ lane: number; y: number; type: 'car' | 'coin' }[]>([]);
  const speedRef = useRef(3.5);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let localScore = 0;
    let localCredits = 0;

    const lanePositions = [60, 140, 220]; // 3 lanes on 280w canvas

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        playerLaneRef.current = Math.max(0, playerLaneRef.current - 1);
        sound.playStep();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        playerLaneRef.current = Math.min(2, playerLaneRef.current + 1);
        sound.playStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const loop = () => {
      frameRef.current++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Cyber Road background
      ctx.fillStyle = '#090a15';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Lane dividers (scrolling)
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 12]);
      ctx.lineDashOffset = -frameRef.current * speedRef.current;

      ctx.beginPath();
      ctx.moveTo(100, 0);
      ctx.lineTo(100, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(180, 0);
      ctx.lineTo(180, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Spawn obstacles/coins
      if (frameRef.current % 45 === 0) {
        const lane = Math.floor(Math.random() * 3);
        const isCoin = Math.random() > 0.45;
        obstaclesRef.current.push({
          lane,
          y: -30,
          type: isCoin ? 'coin' : 'car',
        });
      }

      // Update & Draw Obstacles
      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const ob = obstaclesRef.current[i];
        ob.y += speedRef.current;

        const ox = lanePositions[ob.lane];
        if (ob.type === 'car') {
          // Drone blocker
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(ox - 14, ob.y - 14, 28, 28);
          ctx.fillStyle = '#fee2e2';
          ctx.fillRect(ox - 8, ob.y - 8, 16, 6);
        } else {
          // Neon credit coin
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.arc(ox, ob.y, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.fillText('$', ox - 3, ob.y + 3);
        }

        // Collision check with player
        const playerY = canvas.height - 40;
        const playerX = lanePositions[playerLaneRef.current];

        if (Math.abs(ob.y - playerY) < 22 && ob.lane === playerLaneRef.current) {
          if (ob.type === 'coin') {
            sound.playCredit();
            localScore += 20;
            localCredits += 15;
            setScore(localScore);
            setCreditsEarned(localCredits);
            obstaclesRef.current.splice(i, 1);
          } else {
            // Hit car -> game over
            sound.playHackBeep(false);
            setGameOver(true);
            onWinCredits(localCredits + 50, Math.floor(localScore / 2));
            return;
          }
        } else if (ob.y > canvas.height + 30) {
          obstaclesRef.current.splice(i, 1);
          localScore += 5;
          setScore(localScore);
        }
      }

      // Draw Player Bike / Speeder
      const px = lanePositions[playerLaneRef.current];
      const py = canvas.height - 40;

      // Glow trail
      ctx.fillStyle = 'rgba(236, 72, 153, 0.4)';
      ctx.fillRect(px - 10, py + 16, 20, 16);

      // Cyber Bike body
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(px - 12, py - 18, 24, 34);

      // Windshield
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(px - 6, py - 12, 12, 10);

      // Headlight beams
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.moveTo(px - 8, py - 18);
      ctx.lineTo(px - 20, 0);
      ctx.lineTo(px + 20, 0);
      ctx.lineTo(px + 8, py - 18);
      ctx.closePath();
      ctx.fill();

      // Slightly increase speed
      if (frameRef.current % 300 === 0) {
        speedRef.current += 0.4;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md bg-slate-950 border-4 border-amber-500 rounded-3xl p-5 text-amber-300 shadow-2xl overflow-hidden flex flex-col items-center">
        {/* Arcade Cabinet Header */}
        <div className="w-full flex items-center justify-between border-b-2 border-amber-500/40 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-amber-400 animate-bounce" />
            <span className="font-pixel text-xs text-amber-200">NEON DRIFT // ARCADE</span>
          </div>
          <button
            onClick={onClose}
            className="text-amber-400 hover:text-white p-1 hover:bg-slate-900 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* HUD */}
        <div className="w-full flex justify-between items-center bg-slate-900/90 px-4 py-2 rounded-xl mb-3 border border-amber-500/30 text-xs font-mono font-bold">
          <div className="flex items-center gap-1.5 text-amber-300">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>SCORE: {score}</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-300">
            <Coins className="w-4 h-4 text-emerald-400" />
            <span>WON: +{creditsEarned} CR</span>
          </div>
        </div>

        {/* Screen */}
        <div className="relative border-4 border-slate-800 rounded-xl overflow-hidden shadow-inner shadow-black">
          <canvas
            ref={canvasRef}
            width={280}
            height={340}
            className="block pixelated bg-slate-950"
          />

          {gameOver && (
            <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 text-center">
              <h3 className="font-pixel text-base text-red-400 mb-2">GAME OVER</h3>
              <p className="text-xs font-mono text-slate-300 mb-4">
                Total Credits Won: <strong className="text-emerald-400 font-pixel">+{creditsEarned + 50} CR</strong>
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-pixel text-xs rounded-lg font-bold"
              >
                COLLECT PAYOUT
              </button>
            </div>
          )}
        </div>

        {/* Arcade Controls Hint */}
        <div className="mt-3 flex items-center justify-between w-full text-[11px] font-mono text-slate-400 px-2">
          <span>Controls: [A] / [D] or Left / Right Arrows</span>
          <div className="flex gap-1">
            <button
              onClick={() => {
                playerLaneRef.current = Math.max(0, playerLaneRef.current - 1);
                sound.playStep();
              }}
              className="px-3 py-1 bg-slate-900 border border-slate-700 text-amber-300 rounded font-bold"
            >
              ◄
            </button>
            <button
              onClick={() => {
                playerLaneRef.current = Math.min(2, playerLaneRef.current + 1);
                sound.playStep();
              }}
              className="px-3 py-1 bg-slate-900 border border-slate-700 text-amber-300 rounded font-bold"
            >
              ►
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
