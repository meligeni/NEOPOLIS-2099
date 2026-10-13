import React, { useState, useEffect } from 'react';
import { Terminal, ShieldAlert, Cpu, CheckCircle2, X, RefreshCw, HelpCircle, Sparkles, ArrowRight } from 'lucide-react';
import { sound } from '../utils/audio';

interface HackingMinigameProps {
  onSuccess: (credits: number, exp: number) => void;
  onClose: () => void;
  playerHackingLevel: number;
}

const HEX_CHARS = ['1C', '55', 'BD', 'E9', '7A', 'FF'];

interface PathStep {
  r: number;
  c: number;
  code: string;
}

export const HackingMinigameModal: React.FC<HackingMinigameProps> = ({
  onSuccess,
  onClose,
  playerHackingLevel,
}) => {
  const [grid, setGrid] = useState<string[][]>([]);
  const [targetSequence, setTargetSequence] = useState<string[]>([]);
  const [solutionPath, setSolutionPath] = useState<PathStep[]>([]);
  const [userBuffer, setUserBuffer] = useState<string[]>([]);
  const [isRowTurn, setIsRowTurn] = useState<boolean>(true); // true = select from activeRow, false = select from activeCol
  const [activeRow, setActiveRow] = useState<number>(0);
  const [activeCol, setActiveCol] = useState<number | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);
  const [usedCoords, setUsedCoords] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState<number>(35 + playerHackingLevel * 5);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [resultSuccess, setResultSuccess] = useState<boolean | null>(null);
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // Maximum buffer slots (more slots for higher hacking skill)
  const maxBufferSlots = Math.min(6, 4 + Math.max(1, Math.floor(playerHackingLevel / 2)));

  // Generate guaranteed-solvable 4x4 matrix and valid target sequence
  const generateSolvableGame = () => {
    // 1. Build a 4x4 grid of random hex codes
    const newGrid: string[][] = [];
    for (let r = 0; r < 4; r++) {
      const row: string[] = [];
      for (let c = 0; c < 4; c++) {
        row.push(HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)]);
      }
      newGrid.push(row);
    }

    // 2. Generate a guaranteed valid 3-step solution path:
    // Step 1: Start at Row 0, pick a random column c1
    const c1 = Math.floor(Math.random() * 4);
    const step1: PathStep = { r: 0, c: c1, code: newGrid[0][c1] };

    // Step 2: In column c1, pick a row r2 (where r2 != 0)
    const otherRows = [1, 2, 3];
    const r2 = otherRows[Math.floor(Math.random() * otherRows.length)];
    const step2: PathStep = { r: r2, c: c1, code: newGrid[r2][c1] };

    // Step 3: In row r2, pick a column c3 (where c3 != c1)
    const otherCols = [0, 1, 2, 3].filter(c => c !== c1);
    const c3 = otherCols[Math.floor(Math.random() * otherCols.length)];
    const step3: PathStep = { r: r2, c: c3, code: newGrid[r2][c3] };

    const validPath = [step1, step2, step3];
    const validSeq = [step1.code, step2.code, step3.code];

    setGrid(newGrid);
    setSolutionPath(validPath);
    setTargetSequence(validSeq);
    setUserBuffer([]);
    setUsedCoords(new Set());
    setIsRowTurn(true);
    setActiveRow(0);
    setActiveCol(null);
    setHoveredCell(null);
    setIsFinished(false);
    setResultSuccess(null);
    setTimeLeft(35 + playerHackingLevel * 5);
    sound.playHackBeep(true);
  };

  useEffect(() => {
    generateSolvableGame();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFailure('TIMEOUT');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isFinished]);

  // Compute how many items of target sequence match the end of userBuffer
  const getMatchedCount = (buffer: string[]): number => {
    // Check if target sequence is fully contained
    const bufStr = buffer.join('-');
    const targetStr = targetSequence.join('-');
    if (bufStr.includes(targetStr)) return targetSequence.length;

    // Check partial progress at the tail of the buffer
    for (let len = targetSequence.length - 1; len >= 1; len--) {
      const prefix = targetSequence.slice(0, len).join('-');
      if (bufStr.endsWith(prefix)) {
        return len;
      }
    }
    return 0;
  };

  const matchedCount = getMatchedCount(userBuffer);

  const handleCellClick = (r: number, c: number) => {
    if (isFinished) return;
    const coordKey = `${r},${c}`;
    if (usedCoords.has(coordKey)) return;

    // Strict row/col turn constraint
    if (isRowTurn && r !== activeRow) return;
    if (!isRowTurn && c !== activeCol) return;

    const code = grid[r][c];
    sound.playChirp(1.2);

    const nextBuffer = [...userBuffer, code];
    setUserBuffer(nextBuffer);

    const nextUsed = new Set(usedCoords);
    nextUsed.add(coordKey);
    setUsedCoords(nextUsed);

    // Check if sequence is now solved
    const nextBufStr = nextBuffer.join('-');
    const targetStr = targetSequence.join('-');

    if (nextBufStr.includes(targetStr)) {
      handleSuccess(nextBuffer.length);
      return;
    }

    if (nextBuffer.length >= maxBufferSlots) {
      handleFailure('BUFFER_FULL');
      return;
    }

    // Advance to next alternating axis
    if (isRowTurn) {
      setActiveCol(c);
      setIsRowTurn(false);
    } else {
      setActiveRow(r);
      setIsRowTurn(true);
    }
  };

  const handleSuccess = (stepsTaken: number) => {
    setIsFinished(true);
    setResultSuccess(true);
    sound.playHackBeep(true);
    const bonusCredits = 180 + playerHackingLevel * 35 + (maxBufferSlots - stepsTaken) * 30;
    const bonusExp = 70 + playerHackingLevel * 20;
    setTimeout(() => {
      onSuccess(bonusCredits, bonusExp);
    }, 1200);
  };

  const handleFailure = (reason: string) => {
    setIsFinished(true);
    setResultSuccess(false);
    sound.playHackBeep(false);
  };

  // Reset Buffer (Emergency Flush with 5s time cost)
  const handleResetBuffer = () => {
    if (isFinished) return;
    sound.playHackBeep(false);
    setUserBuffer([]);
    setUsedCoords(new Set());
    setIsRowTurn(true);
    setActiveRow(0);
    setActiveCol(null);
    setTimeLeft(prev => Math.max(5, prev - 5));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-xl bg-slate-950 border-2 border-emerald-500/80 rounded-2xl shadow-2xl p-6 text-emerald-400 font-mono overflow-hidden">
        {/* Scanline overlay */}
        <div className="scanlines absolute inset-0 pointer-events-none opacity-40" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-500/40 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-500/20 border border-emerald-400 rounded-lg">
              <Terminal className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-wider font-pixel text-emerald-300">
                CYBER_BREACH // PROTOCOL v4.5
              </h2>
              <p className="text-[10px] text-emerald-500/80 uppercase">
                District 7 Public Data Port • Guaranteed Path Solvable
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="p-1.5 text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-950 rounded border border-emerald-500/30 transition-colors"
              title="How to Play"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-950 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* How to Play Help Accordion */}
        {showHelp && (
          <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-400/60 rounded-xl text-xs space-y-1.5 text-emerald-200">
            <div className="font-bold text-emerald-300 uppercase flex items-center gap-1 font-pixel text-[10px]">
              <Sparkles className="w-3.5 h-3.5" /> How Matrix Breach Works:
            </div>
            <p>1. <strong>Alternating Turns:</strong> Start by picking any code in <strong>Row #1</strong> (highlighted in cyan).</p>
            <p>2. Your next pick MUST be in the <strong>Column</strong> of the cell you clicked.</p>
            <p>3. Your next pick alternates back to that cell's <strong>Row</strong>.</p>
            <p>4. Match the <strong>Target Sequence</strong> to unlock credits & extraction exp!</p>
          </div>
        )}

        {/* Target Sequence & Buffer Tracker */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs">
          {/* Target Sequence Card */}
          <div className="bg-emerald-950/50 border border-emerald-500/40 p-3 rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
                Target Code Sequence:
              </span>
              <span className="text-[10px] font-mono text-emerald-400/70">
                {matchedCount}/{targetSequence.length} Matched
              </span>
            </div>

            <div className="flex items-center gap-2">
              {targetSequence.map((code, idx) => {
                const isMatched = idx < matchedCount;
                const isCurrentNeeded = idx === matchedCount;

                return (
                  <div
                    key={idx}
                    className={`flex-1 py-1.5 px-2 rounded-lg border text-center font-mono font-bold text-sm transition-all relative ${
                      isMatched
                        ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-md shadow-emerald-500/50 font-black'
                        : isCurrentNeeded
                        ? 'bg-emerald-950/90 text-emerald-200 border-emerald-400 ring-2 ring-emerald-400/50 animate-pulse'
                        : 'bg-slate-900/80 text-emerald-500/50 border-emerald-900/50'
                    }`}
                  >
                    <span>{code}</span>
                    {isMatched && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-300 text-slate-950 rounded-full text-[8px] flex items-center justify-center font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Buffer & ICE Timer */}
          <div className="bg-emerald-950/50 border border-emerald-500/40 p-3 rounded-xl flex items-center justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
                  Memory Buffer:
                </span>
                <span className="text-[10px] text-emerald-400/70 font-mono">
                  {userBuffer.length}/{maxBufferSlots}
                </span>
              </div>

              <div className="flex gap-1.5">
                {Array.from({ length: maxBufferSlots }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-7 h-7 flex items-center justify-center border rounded-lg text-xs font-bold font-mono transition-colors ${
                      userBuffer[i]
                        ? 'border-emerald-400 bg-emerald-500/25 text-emerald-200 shadow-sm'
                        : 'border-emerald-500/20 bg-slate-900/60 text-slate-600'
                    }`}
                  >
                    {userBuffer[i] || '•'}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-right pl-2 border-l border-emerald-500/30">
              <div className="text-emerald-400/70 uppercase text-[10px]">ICE Lock</div>
              <div
                className={`text-xl font-bold font-pixel tracking-wider ${
                  timeLeft <= 10 ? 'text-red-400 animate-ping' : 'text-emerald-300'
                }`}
              >
                {timeLeft}s
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Selection Indicator */}
        <div className="mb-2 px-3 py-1.5 bg-slate-900/90 border border-emerald-500/30 rounded-lg flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>
              SELECTING:{' '}
              <strong className="text-emerald-200 underline">
                {isRowTurn ? `ROW #${activeRow + 1}` : `COLUMN #${(activeCol ?? 0) + 1}`}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Netrunner deck hint for high-level runners */}
            {playerHackingLevel >= 2 && solutionPath.length > 0 && !isFinished && (
              <span className="text-[10px] text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-400/40">
                Deck Scan: Start at [{solutionPath[0].code}]
              </span>
            )}

            <button
              onClick={handleResetBuffer}
              disabled={isFinished || userBuffer.length === 0}
              className="text-[10px] text-amber-300 hover:text-amber-200 flex items-center gap-1 hover:underline disabled:opacity-40 cursor-pointer"
              title="Clears buffer and costs 5 seconds"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Flush Buffer (-5s)</span>
            </button>
          </div>
        </div>

        {/* 4x4 Code Matrix */}
        <div className="bg-slate-900/95 border-2 border-emerald-500/40 rounded-xl p-3.5 mb-4 shadow-inner">
          <div className="grid grid-cols-4 gap-2">
            {grid.map((row, r) =>
              row.map((code, c) => {
                const isUsed = usedCoords.has(`${r},${c}`);
                const isSelectable =
                  !isUsed &&
                  ((isRowTurn && r === activeRow) || (!isRowTurn && c === activeCol));

                // Deck hint highlight for starting step if level >= 2
                const isHintStep =
                  playerHackingLevel >= 2 &&
                  userBuffer.length === 0 &&
                  solutionPath[0]?.r === r &&
                  solutionPath[0]?.c === c;

                // Preview next axis when hovering over selectable cell
                const isHoveredColOrRow =
                  hoveredCell &&
                  !isUsed &&
                  ((isRowTurn && c === hoveredCell.c && r !== activeRow) ||
                    (!isRowTurn && r === hoveredCell.r && c !== activeCol));

                return (
                  <button
                    key={`${r}-${c}`}
                    disabled={isFinished || !isSelectable}
                    onClick={() => handleCellClick(r, c)}
                    onMouseEnter={() => isSelectable && setHoveredCell({ r, c })}
                    onMouseLeave={() => setHoveredCell(null)}
                    className={`h-12 rounded-xl border text-sm font-bold font-mono transition-all flex items-center justify-center relative ${
                      isUsed
                        ? 'bg-slate-950/90 border-slate-800 text-slate-700 line-through cursor-not-allowed'
                        : isSelectable
                        ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 hover:bg-emerald-400 hover:text-slate-950 hover:shadow-lg hover:shadow-emerald-500/50 cursor-pointer font-bold scale-[1.02]'
                        : isHoveredColOrRow
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-600'
                        : 'bg-slate-950/50 border-emerald-950/40 text-emerald-900 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <span>{code}</span>

                    {/* Hint badge */}
                    {isHintStep && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Success Banner */}
        {resultSuccess === true && (
          <div className="bg-emerald-950/90 border-2 border-emerald-400 p-3 rounded-xl text-center text-emerald-200 font-pixel text-xs animate-bounce shadow-xl shadow-emerald-500/30">
            <CheckCircle2 className="inline w-5 h-5 mr-2 text-emerald-300" />
            ACCESS GRANTED! SECURE BUFFER BYPASSED!
          </div>
        )}

        {/* Failure Banner */}
        {resultSuccess === false && (
          <div className="bg-red-950/90 border-2 border-red-500 p-3.5 rounded-xl text-center text-red-300 font-pixel text-xs shadow-xl shadow-red-500/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <span>BREACH FAILED // FIREWALL LOCKED</span>
            </div>
            <div className="flex justify-center gap-2 mt-3 font-cyber">
              <button
                onClick={generateSolvableGame}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Hack</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Exit Terminal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
