import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  BookOpen,
  Shield,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  Cpu,
  ChevronRight,
  User,
  Sliders,
  CheckCircle2,
  Award,
} from 'lucide-react';
import { GameDifficulty } from '../types/game';
import { sound } from '../utils/audio';

interface TitleMenuProps {
  hasSaveGame: boolean;
  onContinueGame: () => void;
  onNewGame: (difficulty: GameDifficulty) => void;
  musicEnabled: boolean;
  onToggleMusic: () => void;
}

export const TitleMenu: React.FC<TitleMenuProps> = ({
  hasSaveGame,
  onContinueGame,
  onNewGame,
  musicEnabled,
  onToggleMusic,
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<GameDifficulty>('normal');
  const [activeTab, setActiveTab] = useState<'main' | 'story' | 'config' | 'credits'>('main');

  const difficulties: {
    id: GameDifficulty;
    name: string;
    badge: string;
    desc: string;
    color: string;
    borderColor: string;
    perks: string[];
  }[] = [
    {
      id: 'easy',
      name: 'STREET RUNNER (FÁCIL)',
      badge: 'RELAXADO',
      desc: 'Mais Nanites no biorreator e rendimento ampliado. Ideal para explorar a vida urbana e decorar sua residência sem pressão.',
      color: 'text-cyan-300',
      borderColor: 'border-cyan-400',
      perks: [
        '⚡ +50% Capacidade de Energia (150 Nanites)',
        '🔋 Consumo reduzido em 35% ao trabalhar e hackear',
        '💰 +25% de Créditos em contratos e minigames',
      ],
    },
    {
      id: 'normal',
      name: 'CYBER MERCENÁRIO (NORMAL)',
      badge: 'EQUILIBRADO',
      desc: 'A experiência autêntica de sobrevivência e reputação em Neopolis. Equilibre ciclos de trabalho, alimentação e descanso.',
      color: 'text-amber-300',
      borderColor: 'border-amber-400',
      perks: [
        '⚡ 100 Nanites padrão de energia biotecnológica',
        '⚖️ Consumo realista em todas as atividades urbanas',
        '🍜 Recuperação via refeições no Ramen e descanso no leito',
      ],
    },
    {
      id: 'hard',
      name: 'SAMURAI URBANO (DIFÍCIL)',
      badge: 'DESAFIO',
      desc: 'Recursos escassos, desgaste acelerado de Nanites e corporações implacáveis. Cada ação exige cálculo e rotina de sono estrita.',
      color: 'text-rose-400',
      borderColor: 'border-rose-500',
      perks: [
        '⚡ 80 Nanites de reserva bioenergética',
        '⚠️ Esgotamento acelerado em hacks e missões complexas',
        '📉 Economia severa: contratos exigem máximo desempenho',
      ],
    },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 font-cyber select-none flex items-center justify-center">
      {/* Dynamic Cyberpunk Animated Backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#180e2b] via-[#0b0f1a] to-[#04060c] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0, 240, 255, 0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.25) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Ambient Neon Blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#ff2a85]/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#00f0ff]/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#9333ea]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Quick Utilities (Audio toggle & Copyright header) */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-auto">
        {/* Creator Rights & Copyright Header Pill */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-lg shadow-black/40">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#00f0ff] to-[#ff2a85] flex items-center justify-center shadow-sm shadow-[#00f0ff]">
            <Shield className="w-3.5 h-3.5 text-black" />
          </div>
          <div className="text-left">
            <div className="text-[10px] font-pixel text-slate-200 tracking-wider">
              PROPRIEDADE INTELECTUAL & COPYRIGHT
            </div>
            <div className="text-[9px] font-mono text-cyan-400">
              © 2026 TODOS OS DIREITOS RESERVADOS
            </div>
          </div>
        </div>

        {/* Music Sound Toggle Button */}
        <button
          onClick={() => {
            sound.playChirp(1.2);
            onToggleMusic();
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
            musicEnabled
              ? 'bg-[#ff2a85]/20 border-[#ff2a85] text-pink-300 shadow-md shadow-[#ff2a85]/30'
              : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white'
          }`}
          title={musicEnabled ? 'Desativar Música Lo-Fi' : 'Ativar Trilha Sonora Lo-Fi'}
        >
          {musicEnabled ? <Volume2 className="w-4 h-4 text-[#ff2a85] animate-pulse" /> : <VolumeX className="w-4 h-4" />}
          <span className="text-xs font-mono font-bold uppercase tracking-wider hidden sm:inline">
            {musicEnabled ? 'Lo-Fi Chill: ON' : 'Música: OFF'}
          </span>
        </button>
      </div>

      {/* Main Center Modal Container */}
      <div className="relative z-10 w-full max-w-4xl max-h-[92vh] overflow-y-auto px-4 py-6 flex flex-col items-center">
        {/* 1. GAME TITLE & LOGO BADGE */}
        <div className="text-center mb-6 space-y-2">
          {/* Cyber Brand Emblem */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/90 border border-cyan-400/40 text-[10px] font-mono tracking-widest text-cyan-300 shadow-lg shadow-cyan-500/20 mb-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>NEURAL MATRIX INTERFACE // BUILD 2099.4</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black font-cyber tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] via-[#ff2a85] to-[#f59e0b] drop-shadow-[0_0_35px_rgba(0,240,255,0.4)]">
            NEOPOLIS 2099
          </h1>
          <p className="text-sm sm:text-base font-pixel text-slate-300 tracking-widest uppercase">
            Cyber Protocol // Isometric Life Simulation RPG
          </p>
        </div>

        {/* 2. TAB NAVIGATION */}
        <div className="flex items-center gap-2 p-1 bg-slate-900/90 border border-slate-700 rounded-2xl backdrop-blur-md mb-6 shadow-xl">
          <button
            onClick={() => {
              sound.playChirp(1.0);
              setActiveTab('main');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-cyber tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'main'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>INICIAR JOGO</span>
          </button>

          <button
            onClick={() => {
              sound.playChirp(1.0);
              setActiveTab('story');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-cyber tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'story'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>HISTÓRIA DE NEOPOLIS</span>
          </button>

          <button
            onClick={() => {
              sound.playChirp(1.0);
              setActiveTab('config');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-cyber tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'config'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>DIFICULDADE & REGRAS</span>
          </button>

          <button
            onClick={() => {
              sound.playChirp(1.0);
              setActiveTab('credits');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-cyber tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'credits'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>DIREITOS & CRÉDITOS</span>
          </button>
        </div>

        {/* 3. TAB CONTENT */}

        {/* TAB A: MAIN MENU PLAY */}
        {activeTab === 'main' && (
          <div className="w-full max-w-xl space-y-4 animate-fade-in">
            {/* Quick Difficulty Selector Badge */}
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Dificuldade Selecionada:</span>
              <button
                onClick={() => setActiveTab('config')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-cyan-300 font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>{difficulties.find(d => d.id === selectedDifficulty)?.name}</span>
                <ChevronRight className="w-3 h-3 text-cyan-400" />
              </button>
            </div>

            {/* CONTINUE GAME (If save exists) */}
            {hasSaveGame && (
              <button
                onClick={() => {
                  sound.playLevelUp();
                  onContinueGame();
                }}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#00f0ff]/20 via-[#00f0ff]/10 to-transparent border-2 border-[#00f0ff] hover:bg-[#00f0ff]/30 text-white shadow-xl shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#00f0ff] flex items-center justify-center text-black shadow-lg shadow-cyan-400/50">
                    <RotateCcw className="w-6 h-6 animate-spin-slow" />
                  </div>
                  <div className="text-left">
                    <div className="font-cyber font-black text-lg text-cyan-300 tracking-wide flex items-center gap-2">
                      <span>CONTINUAR JORNADA</span>
                      <span className="px-1.5 py-0.5 rounded bg-cyan-900/60 border border-cyan-400 text-[10px] font-mono text-cyan-200">
                        SAVE ATIVO
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-300">
                      Retomar sua vida em Neopolis do ponto exato onde você parou
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-cyan-300 group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            {/* NEW GAME */}
            <button
              onClick={() => {
                sound.playCredit();
                onNewGame(selectedDifficulty);
              }}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#ff2a85]/20 via-[#ff2a85]/10 to-transparent border-2 border-[#ff2a85] hover:bg-[#ff2a85]/30 text-white shadow-xl shadow-pink-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#ff2a85] flex items-center justify-center text-white shadow-lg shadow-pink-500/50">
                  <Play className="w-6 h-6 fill-white" />
                </div>
                <div className="text-left">
                  <div className="font-cyber font-black text-lg text-pink-300 tracking-wide">
                    NOVA PARTIDA // CRIAR PERSONAGEM
                  </div>
                  <div className="text-xs font-mono text-slate-300">
                    Personalize sua classe, implantes neurais, drone e comece do zero
                  </div>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-pink-300 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* QUICK STORY & LORE SHORTCUT */}
            <button
              onClick={() => {
                sound.playChirp(1.1);
                setActiveTab('story');
              }}
              className="w-full p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-cyber font-bold text-sm text-slate-200">
                    PRÓLOGO E LORE DA CIDADE
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Conheça a história dos distritos, megacorporações e Nanites
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* TAB B: STORY & LORE PROLOGUE */}
        {activeTab === 'story' && (
          <div className="w-full max-w-2xl bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-6 backdrop-blur-md shadow-2xl space-y-4 text-left animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-cyber font-bold text-cyan-300 tracking-wider">
                  ARQUIVO HISTÓRICO: O NASCIMENTO DE NEOPOLIS 2099
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                LORE OFICIAL
              </span>
            </div>

            <div className="space-y-3 text-xs sm:text-sm font-sans text-slate-300 leading-relaxed max-h-[50vh] overflow-y-auto pr-2">
              <p>
                <strong className="text-cyan-300 font-cyber">O Cenário:</strong> No ano de 2099, a megalópole vertical de <span className="text-pink-400 font-semibold">Neopolis</span> ergue-se entre nuvens de chuva ácida e tempestades eletromagnéticas. A cidade é dividida em quatro grandes distritos funcionais: o animado <span className="text-cyan-400">Boulevard Comercial Neon</span>, o campus tecnológico <span className="text-pink-400">Neo-Akademia</span>, o setor residencial <span className="text-amber-400">Cápsulas de Stasis</span> e a praça cívica do <span className="text-purple-400">Metrô Quântico</span>.
              </p>

              <p>
                <strong className="text-cyan-300 font-cyber">A Matriz de Nanites:</strong> Cada cidadão de Neopolis possui em sua corrente sanguínea um biorreator de <strong className="text-cyan-400">Nanites (Energia Bio-Sintética)</strong>. Cada atividade relevante — desde invasões a terminais cibernéticos, reparo de drones autônomos, até o cultivo em hidroponia e a execução de contratos para figuras da cidade — consome sua cota de Nanites diária.
              </p>

              <p>
                <strong className="text-cyan-300 font-cyber">A Rotina e a Sobrevivência:</strong> Quando seus Nanites se esgotam, o sistema entra em esgotamento: você precisa retornar ao seu apartamento cápsula para um <strong className="text-emerald-400">ciclo completo de sono restaurador</strong> ou recarregar as energias saboreando um autêntico ramen hipernutritivo no bistrô do Chef Bao ou comprando tônicos energéticos nas máquinas de venda.
              </p>

              <p>
                <strong className="text-cyan-300 font-cyber">As Figuras de Neopolis:</strong> Cada especialista da cidade tem seu próprio estabelecimento temático. O lendário <span className="text-amber-400 font-semibold">Chef Bao</span> comanda seu Bistrô de Ramen a vapor; o ripperdoc <span className="text-cyan-400 font-semibold">Dex Mercer</span> atende na Clínica Chrome com cirurgias estéticas e ópticas; a brilhante <span className="text-orange-400 font-semibold">Sparks</span> forja drones em sua oficina mecânica; a misteriosa netrunner <span className="text-purple-400 font-semibold">Nyx</span> gerencia servidores criptografados no subsolo; e o executivo <span className="text-pink-400 font-semibold">Vane Cross</span> dita as regras da alta sociedade corporativa.
              </p>

              <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-xs font-mono text-cyan-200">
                ⚡ <em>"Em Neopolis, seu estilo é sua identidade, seu tráfego obedece aos semáforos da rede neural, e sua lenda começa agora."</em>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playChirp(1.0);
                setActiveTab('main');
              }}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-cyber font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              RETORNAR AO MENU PRINCIPAL
            </button>
          </div>
        )}

        {/* TAB C: CONFIGURATION & DIFFICULTY */}
        {activeTab === 'config' && (
          <div className="w-full max-w-2xl bg-slate-900/90 border border-amber-500/30 rounded-2xl p-6 backdrop-blur-md shadow-2xl space-y-4 text-left animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-cyber font-bold text-amber-300 tracking-wider">
                  CONFIGURAÇÕES DA PARTIDA // NÍVEL DE DIFICULDADE
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40">
                BALANCEAMENTO
              </span>
            </div>

            <div className="space-y-3">
              {difficulties.map(diff => {
                const isSelected = selectedDifficulty === diff.id;
                return (
                  <div
                    key={diff.id}
                    onClick={() => {
                      sound.playChirp(1.1);
                      setSelectedDifficulty(diff.id);
                    }}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? `bg-slate-800/90 ${diff.borderColor} shadow-lg shadow-amber-500/10`
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-cyber font-bold text-sm ${diff.color}`}>
                          {diff.name}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[9px] font-mono text-slate-300 border border-slate-700">
                          {diff.badge}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-1 text-emerald-400 text-xs font-mono font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>ATIVO</span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 mb-2 leading-relaxed">{diff.desc}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                      {diff.perks.map((p, idx) => (
                        <span key={idx} className="bg-slate-950/60 px-2 py-1 rounded">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  sound.playCredit();
                  onNewGame(selectedDifficulty);
                }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-cyber font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                APLICAR & COMEÇAR NOVA PARTIDA
              </button>
              <button
                onClick={() => setActiveTab('main')}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-cyber font-bold text-xs uppercase transition-colors cursor-pointer"
              >
                VOLTAR
              </button>
            </div>
          </div>
        )}

        {/* TAB D: CREDITS & COPYRIGHT ASSERTION */}
        {activeTab === 'credits' && (
          <div className="w-full max-w-2xl bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-6 backdrop-blur-md shadow-2xl space-y-4 text-left animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-cyber font-bold text-emerald-300 tracking-wider">
                  REGISTRO DE DIREITOS AUTORAIS & CRÉDITOS
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                PROPRIEDADE REGISTRADA
              </span>
            </div>

            {/* Shield & Ownership Seal */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-emerald-950/30 border border-emerald-500/30 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center text-slate-950 shadow-xl shadow-emerald-500/30 shrink-0">
                <Award className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="font-cyber font-black text-base text-emerald-300 tracking-wide">
                  CERTIFICADO DE PROPRIEDADE INTELECTUAL
                </div>
                <div className="text-xs font-mono text-slate-300">
                  Neopolis 2099: Cyber Protocol Life Simulation
                </div>
                <div className="text-[11px] font-mono text-emerald-400 font-semibold">
                  © 2026 Desenvolvido e Licenciado pelo Criador Titular dos Direitos
                </div>
              </div>
            </div>

            <div className="text-xs font-sans text-slate-300 space-y-2 leading-relaxed">
              <p>
                Todos os elementos de design, lógica isométrica, trilha sonora sintetizada Lo-Fi Cyberpunk, sistema de tráfego com semáforos, simulação de Nanites e personagens com estabelecimentos próprios foram concebidos e integrados sob titularidade autoral exclusiva.
              </p>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-slate-400 space-y-1">
                <div>• Código-fonte, interfaces e design: <strong>Licenciados e Protegidos</strong></div>
                <div>• Motor de Áudio: <strong>Web Audio Synthesizer Lo-Fi Cyberpunk 2099</strong></div>
                <div>• Status do Registro: <strong>Autoral Confirmado • Todos os Direitos Reservados</strong></div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('main')}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-cyber font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              RETORNAR AO MENU
            </button>
          </div>
        )}

        {/* 4. FOOTER COPYRIGHT BRANDING BAR */}
        <div className="mt-8 text-center text-slate-500 text-[11px] font-mono space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-slate-400">
              © 2026 NEOPOLIS 2099 • TODOS OS DIREITOS RESERVADOS AO CRIADOR E TITULAR
            </span>
          </div>
          <div className="text-[10px] text-slate-600">
            Versão 2.4 // Modo Isométrico 46x46 // Cidade Viva com Tráfego, Semáforos e Estabelecimentos
          </div>
        </div>
      </div>
    </div>
  );
};
