import React, { useState } from 'react';
import { Volume2, Sparkles, CheckCircle2, XCircle, ArrowLeftRight } from 'lucide-react';
import { BEGINNER_MINIMAL_PAIRS } from '../../../data/pinyin/beginnerPhoneticsData';
import { audioManager } from '../../../services/audio/index';
import { NasalAirflowDiagram } from './illustrations/NasalAirflowDiagram';

interface MinimalPairsLabProps {
  className?: string;
}

export const MinimalPairsLab: React.FC<MinimalPairsLabProps> = ({ className = '' }) => {
  const [selectedPairId, setSelectedPairId] = useState<string>('contrast_b_vs_p');

  // Mini-game state
  const [gamePlayed, setGamePlayed] = useState<boolean>(false);
  const [targetSound, setTargetSound] = useState<'A' | 'B' | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<'A' | 'B' | null>(null);

  const currentPair =
    BEGINNER_MINIMAL_PAIRS.find((p) => p.id === selectedPairId) ||
    BEGINNER_MINIMAL_PAIRS[0];

  const handlePlaySound = (text: string) => {
    audioManager.playText(text);
  };

  const handleStartDiscrimination = () => {
    // Pick A or B randomly
    const pick: 'A' | 'B' = Math.random() < 0.5 ? 'A' : 'B';
    setTargetSound(pick);
    setSelectedChoice(null);
    setGamePlayed(true);

    const soundText = pick === 'A' ? currentPair.soundA.sample : currentPair.soundB.sample;
    audioManager.playText(soundText);
  };

  const handleReplaySound = () => {
    if (!targetSound) return;
    const soundText = targetSound === 'A' ? currentPair.soundA.sample : currentPair.soundB.sample;
    audioManager.playText(soundText);
  };

  const handleSelectChoice = (choice: 'A' | 'B') => {
    if (selectedChoice !== null) return;
    setSelectedChoice(choice);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            Phân Biệt Cặp Âm Dễ Nhầm Lẫn (Minimal Pairs)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            So sánh đối chiếu trực diện khẩu hình, cơ chế bật hơi và luyện tai phân biệt âm nhạy bén.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
            {BEGINNER_MINIMAL_PAIRS.length} cặp âm then chốt
          </span>
        </div>
      </div>

      {/* Pair Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        {BEGINNER_MINIMAL_PAIRS.map((pair) => {
          const isSelected = pair.id === selectedPairId;
          return (
            <button
              key={pair.id}
              onClick={() => {
                setSelectedPairId(pair.id);
                setGamePlayed(false);
                setTargetSound(null);
                setSelectedChoice(null);
              }}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md scale-102 ring-2 ring-indigo-300 dark:ring-indigo-800'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className="font-mono font-black">{pair.soundA.symbol}</span>
              <ArrowLeftRight className="w-3.5 h-3.5 opacity-60" />
              <span className="font-mono font-black">{pair.soundB.symbol}</span>
            </button>
          );
        })}
      </div>

      {/* Side-by-Side Comparison (Exact Match to Infographic Section 5) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {currentPair.title}
          </h3>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
            {currentPair.keyDifference}
          </p>
        </div>

        {/* If this is n vs ng, embed the specialized anatomical diagram */}
        {currentPair.id === 'contrast_n_vs_ng' ? (
          <NasalAirflowDiagram />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sound A Box */}
            <div className="flex flex-col items-center bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl p-6 border border-blue-200/60 dark:border-blue-900/40 relative">
              <span className="absolute top-4 left-4 text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2.5 py-0.5 rounded-full">
                {currentPair.soundA.tag}
              </span>

              <div className="my-3 flex items-center gap-3">
                <span className="text-5xl font-black text-blue-600 dark:text-blue-400 font-mono">
                  {currentPair.soundA.symbol}
                </span>
                <button
                  onClick={() => handlePlaySound(currentPair.soundA.sample)}
                  className="p-3 rounded-full bg-blue-600 text-white hover:scale-105 active:scale-95 shadow-sm transition-transform"
                  title={`Nghe mẫu ${currentPair.soundA.symbol}`}
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-center text-slate-600 dark:text-slate-300 min-h-[40px] px-2 leading-relaxed">
                {currentPair.soundA.desc}
              </p>

              {/* Example word card */}
              <div className="w-full mt-4 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-2xs">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold text-blue-600 dark:text-blue-400 font-mono">
                      {currentPair.soundA.sample}
                    </span>
                    <span className="text-xl font-bold text-slate-900 dark:text-white">
                      {currentPair.soundA.hanzi}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {currentPair.soundA.meaning}
                  </span>
                </div>
                <button
                  onClick={() => handlePlaySound(currentPair.soundA.sample)}
                  className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 hover:bg-blue-600 hover:text-white transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sound B Box */}
            <div className="flex flex-col items-center bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl p-6 border border-rose-200/60 dark:border-rose-900/40 relative">
              <span className="absolute top-4 left-4 text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/50 px-2.5 py-0.5 rounded-full">
                {currentPair.soundB.tag}
              </span>

              <div className="my-3 flex items-center gap-3">
                <span className="text-5xl font-black text-rose-600 dark:text-rose-400 font-mono">
                  {currentPair.soundB.symbol}
                </span>
                <button
                  onClick={() => handlePlaySound(currentPair.soundB.sample)}
                  className="p-3 rounded-full bg-rose-600 text-white hover:scale-105 active:scale-95 shadow-sm transition-transform"
                  title={`Nghe mẫu ${currentPair.soundB.symbol}`}
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-center text-slate-600 dark:text-slate-300 min-h-[40px] px-2 leading-relaxed">
                {currentPair.soundB.desc}
              </p>

              {/* Example word card */}
              <div className="w-full mt-4 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-2xs">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold text-rose-600 dark:text-rose-400 font-mono">
                      {currentPair.soundB.sample}
                    </span>
                    <span className="text-xl font-bold text-slate-900 dark:text-white">
                      {currentPair.soundB.hanzi}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {currentPair.soundB.meaning}
                  </span>
                </div>
                <button
                  onClick={() => handlePlaySound(currentPair.soundB.sample)}
                  className="p-2 rounded-full bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 hover:bg-rose-600 hover:text-white transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Discrimination Mini-Game: "Luyện tai phân biệt âm" */}
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800/80 dark:to-slate-850/80 rounded-2xl p-5 border border-indigo-100 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  Thử thách luyện tai phân biệt âm
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Hệ thống sẽ phát ngẫu nhiên 1 trong 2 âm. Hãy lắng nghe và chọn đúng!
                </p>
              </div>

              {!gamePlayed ? (
                <button
                  onClick={handleStartDiscrimination}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 active:scale-95 transition-all shadow-xs"
                >
                  Bắt đầu nghe
                </button>
              ) : (
                <button
                  onClick={handleReplaySound}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 text-xs font-semibold border border-indigo-200 dark:border-slate-600 hover:bg-indigo-50 transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Nghe lại âm thanh
                </button>
              )}
            </div>

            {gamePlayed && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                  <button
                    onClick={() => handleSelectChoice('A')}
                    disabled={selectedChoice !== null}
                    className={`py-3.5 px-4 rounded-xl font-bold font-mono text-lg transition-all flex flex-col items-center justify-center gap-1 ${
                      selectedChoice === null
                        ? 'bg-white dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-650 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600'
                        : selectedChoice === 'A'
                        ? targetSound === 'A'
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'bg-rose-500 text-white shadow-md'
                        : targetSound === 'A'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 opacity-50 text-slate-500'
                    }`}
                  >
                    <span>{currentPair.soundA.symbol}</span>
                    <span className="text-xs font-normal">({currentPair.soundA.sample})</span>
                  </button>

                  <button
                    onClick={() => handleSelectChoice('B')}
                    disabled={selectedChoice !== null}
                    className={`py-3.5 px-4 rounded-xl font-bold font-mono text-lg transition-all flex flex-col items-center justify-center gap-1 ${
                      selectedChoice === null
                        ? 'bg-white dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-650 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600'
                        : selectedChoice === 'B'
                        ? targetSound === 'B'
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'bg-rose-500 text-white shadow-md'
                        : targetSound === 'B'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 opacity-50 text-slate-500'
                    }`}
                  >
                    <span>{currentPair.soundB.symbol}</span>
                    <span className="text-xs font-normal">({currentPair.soundB.sample})</span>
                  </button>
                </div>

                {selectedChoice !== null && (
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      {selectedChoice === targetSound ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            Chính xác! Bạn đã phân biệt đúng âm {targetSound === 'A' ? currentPair.soundA.symbol : currentPair.soundB.symbol}.
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-rose-500" />
                          <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                            Chưa đúng! Âm vừa phát là {targetSound === 'A' ? currentPair.soundA.symbol : currentPair.soundB.symbol}.
                          </span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={handleStartDiscrimination}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
                    >
                      Lượt tiếp theo
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
