import React, { useState } from 'react';
import { Volume2, AlertCircle, Info } from 'lucide-react';
import { BEGINNER_INITIALS } from '../../../data/pinyin/beginnerPhoneticsData';
import { SagittalVocalTract } from './illustrations/SagittalVocalTract';
import { LipShapeDiagram } from './illustrations/LipShapeDiagram';
import { audioManager } from '../../../services/audio/index';

interface InitialsLabProps {
  className?: string;
}

export const InitialsLab: React.FC<InitialsLabProps> = ({ className = '' }) => {
  const [selectedId, setSelectedId] = useState<string>('initial_b');

  const currentItem =
    BEGINNER_INITIALS.find((i) => i.id === selectedId) || BEGINNER_INITIALS[0];

  const handlePlayInitial = () => {
    // Play canonical Mandarin Hūdùyīn (e.g. 玻 for b, 坡 for p)
    audioManager.playText(currentItem.huduYin);
  };

  const handlePlayExample = (text: string) => {
    audioManager.playText(text);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            21 Thanh Mẫu Tiếng Trung (声母)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Phân tích giải phẫu học thanh quản, khẩu hình 3 bước và phát âm Hán ngữ chuẩn tắc (呼读音).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
            21/21 Phụ âm đầu
          </span>
        </div>
      </div>

      {/* Articulation Selector Grid */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Chọn thanh mẫu để xem khẩu hình:
        </div>
        <div className="grid grid-cols-7 sm:grid-cols-11 md:grid-cols-21 gap-1.5">
          {BEGINNER_INITIALS.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl font-mono text-base font-bold transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md scale-105 ring-2 ring-blue-300 dark:ring-blue-800'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-750'
                }`}
              >
                <span>{item.symbol}</span>
                <span className={`text-[10px] font-normal ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                  {item.ipa}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Focus Detail: Infographic Section 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Vocal tract & Lip movements */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <span className="text-4xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {currentItem.symbol}
              </span>
              <div>
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Thanh mẫu {currentItem.symbol}
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white font-mono">
                  {currentItem.ipa}
                </div>
              </div>
            </div>

            {/* Pronounce Initial button */}
            <button
              onClick={handlePlayInitial}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
              title={`Phát âm chuẩn âm "${currentItem.symbol}"`}
            >
              <Volume2 className="w-4 h-4" />
              <span>Phát âm</span>
            </button>
          </div>

          {/* Sagittal Cross-section diagram */}
          <div className="w-full flex justify-center py-2 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl mb-4 border border-slate-100 dark:border-slate-800/60">
            <SagittalVocalTract
              config={currentItem.vocalTractConfig}
              symbol={currentItem.symbol}
              size="md"
            />
          </div>

          {/* 3-Step Lip Shape Breakdown */}
          <div className="w-full">
            <LipShapeDiagram
              lipShape={currentItem.vocalTractConfig.lipShape}
              steps={currentItem.vocalTractConfig.lipSteps}
              size="md"
            />
          </div>
        </div>

        {/* Right Column (7 cols): Articulation Guide, Common Errors & Examples */}
        <div className="lg:col-span-7 space-y-4">
          {/* Guide Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Cách phát âm chuẩn xác
              </h3>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  currentItem.aspiration === 'aspirated'
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                    : currentItem.aspiration === 'non_aspirated'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                }`}
              >
                {currentItem.aspiration === 'aspirated'
                  ? 'Bật hơi mạnh (Aspirated)'
                  : currentItem.aspiration === 'non_aspirated'
                  ? 'Không bật hơi (Unaspirated)'
                  : currentItem.aspiration}
              </span>
            </div>

            {/* Step Bullets (Exact match to Infographic) */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
              <div className="flex items-start gap-2.5 text-xs text-slate-800 dark:text-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <div>
                  <strong>Khẩu hình môi:</strong> {currentItem.mouthGuide}
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-800 dark:text-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <div>
                  <strong>Vị trí lưỡi & vòm họng:</strong> {currentItem.tongueGuide}
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-800 dark:text-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <div>
                  <strong>Cơ chế luồng hơi:</strong> {currentItem.articulationType}
                </div>
              </div>
            </div>

            {/* Vietnamese comparison warning box */}
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong className="text-amber-800 dark:text-amber-300 block mb-0.5">
                  So sánh với Tiếng Việt:
                </strong>
                {currentItem.vietnameseComparison}
              </div>
            </div>

            {/* Common Errors */}
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong className="text-rose-800 dark:text-rose-300 block mb-0.5">
                  Lỗi phát âm người Việt hay mắc:
                </strong>
                {currentItem.commonErrors}
              </div>
            </div>
          </div>

          {/* Example Words Card (Matching Infographic Column Right) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
              Ví dụ từ vựng thực tế ({currentItem.examples.length} từ)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {currentItem.examples.map((ex, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between hover:bg-blue-50/50 dark:hover:bg-slate-750 transition-colors group"
                >
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-bold text-blue-600 dark:text-blue-400 font-mono">
                        {ex.pinyin}
                      </span>
                      <span className="text-xl font-bold text-slate-900 dark:text-white">
                        {ex.hanzi}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {ex.meaning}
                    </div>
                  </div>
                  <button
                    onClick={() => handlePlayExample(ex.audioText)}
                    className="p-2 rounded-full bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white shadow-2xs transition-colors"
                    title={`Nghe: ${ex.pinyin}`}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
