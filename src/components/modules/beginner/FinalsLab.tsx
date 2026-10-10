import React, { useState } from 'react';
import { Volume2, Info, AlertCircle } from 'lucide-react';
import {
  BEGINNER_SIMPLE_FINALS,
  BEGINNER_COMPOUND_FINALS,
  BEGINNER_NASAL_FINALS,
  BEGINNER_RETROFLEX_FINAL,
  BeginnerPhoneticItem,
} from '../../../data/pinyin/beginnerPhoneticsData';
import { SagittalVocalTract } from './illustrations/SagittalVocalTract';
import { LipShapeDiagram } from './illustrations/LipShapeDiagram';
import { NasalAirflowDiagram } from './illustrations/NasalAirflowDiagram';
import { RetroflexErDiagram } from './illustrations/RetroflexErDiagram';
import { audioManager } from '../../../services/audio/index';

type FinalsSubtab = 'simple' | 'compound' | 'nasal' | 'retroflex';

interface FinalsLabProps {
  className?: string;
}

export const FinalsLab: React.FC<FinalsLabProps> = ({ className = '' }) => {
  const [activeSubtab, setActiveSubtab] = useState<FinalsSubtab>('simple');
  const [selectedId, setSelectedId] = useState<string>('final_a');

  // Select item list based on subtab
  const getItemsForSubtab = (): BeginnerPhoneticItem[] => {
    switch (activeSubtab) {
      case 'simple':
        return BEGINNER_SIMPLE_FINALS;
      case 'compound':
        return BEGINNER_COMPOUND_FINALS;
      case 'nasal':
        return BEGINNER_NASAL_FINALS;
      case 'retroflex':
        return [BEGINNER_RETROFLEX_FINAL];
      default:
        return BEGINNER_SIMPLE_FINALS;
    }
  };

  const currentItems = getItemsForSubtab();
  const currentItem =
    currentItems.find((i) => i.id === selectedId) || currentItems[0] || BEGINNER_SIMPLE_FINALS[0];

  const handleSwitchTab = (tab: FinalsSubtab) => {
    setActiveSubtab(tab);
    if (tab === 'simple') setSelectedId('final_a');
    else if (tab === 'compound') setSelectedId('final_ai');
    else if (tab === 'nasal') setSelectedId('final_an');
    else if (tab === 'retroflex') setSelectedId('final_er');
  };

  const handlePlaySound = (text: string) => {
    audioManager.playText(text);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            36 Vận Mẫu Tiếng Trung (韵母)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gồm 6 Vận mẫu đơn, 13 Vận mẫu kép, 16 Vận mẫu mũi và 1 Vận mẫu uốn lưỡi đặc biệt (er).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
            36/36 Nguyên âm & Vần
          </span>
        </div>
      </div>

      {/* 4 Subtabs (Matching Infographic Sections 3, 4, 8) */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => handleSwitchTab('simple')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeSubtab === 'simple'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Vận mẫu đơn (6 âm)
        </button>
        <button
          onClick={() => handleSwitchTab('compound')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeSubtab === 'compound'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Vận mẫu kép (13 âm)
        </button>
        <button
          onClick={() => handleSwitchTab('nasal')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeSubtab === 'nasal'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Vận mẫu mũi (16 âm)
        </button>
        <button
          onClick={() => handleSwitchTab('retroflex')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeSubtab === 'retroflex'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Vận mẫu er (1 âm)
        </button>
      </div>

      {/* Retroflex Lab View override */}
      {activeSubtab === 'retroflex' ? (
        <RetroflexErDiagram />
      ) : (
        <>
          {/* Symbol Selector Grid */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Chọn vận mẫu:
            </div>
            <div className="flex flex-wrap gap-2">
              {currentItems.map((item) => {
                const isSelected = item.id === currentItem.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`px-4 py-2 rounded-xl font-mono text-sm font-bold transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-md scale-105 ring-2 ring-emerald-300 dark:ring-emerald-800'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-750'
                    }`}
                  >
                    {item.symbol}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Inspection View: Infographic Section 3 & 4 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (5 cols): Vocal tract & Lip movement */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {currentItem.symbol}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Vận mẫu {currentItem.symbol}
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white font-mono">
                      {currentItem.ipa}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handlePlaySound(currentItem.huduYin || currentItem.symbol)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
                  title={`Nghe vận mẫu "${currentItem.symbol}"`}
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Phát âm</span>
                </button>
              </div>

              {/* Vocal Tract SVG */}
              <div className="w-full flex justify-center py-2 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl mb-4 border border-slate-100 dark:border-slate-800/60">
                <SagittalVocalTract
                  config={currentItem.vocalTractConfig}
                  symbol={currentItem.symbol}
                  size="md"
                />
              </div>

              {/* Lip Shape SVG */}
              <div className="w-full">
                <LipShapeDiagram
                  lipShape={currentItem.vocalTractConfig.lipShape}
                  steps={currentItem.vocalTractConfig.lipSteps}
                  size="md"
                />
              </div>
            </div>

            {/* Right Column (7 cols): Articulation Guide, Comparison & Examples */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Hướng dẫn khẩu hình & vị trí lưỡi
                  </h3>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {currentItem.categoryVi}
                  </span>
                </div>

                {/* Bullets (Matching Infographic) */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                  <div className="flex items-start gap-2.5 text-xs text-slate-800 dark:text-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <strong>Độ mở miệng & Môi:</strong> {currentItem.mouthGuide}
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-slate-800 dark:text-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <strong>Độ nâng & Vị trí lưỡi:</strong> {currentItem.tongueGuide}
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-slate-800 dark:text-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <strong>Đặc tính âm thanh:</strong> {currentItem.articulationType}
                    </div>
                  </div>
                </div>

                {/* Vietnamese comparison card */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 flex items-start gap-3">
                  <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    <strong className="text-emerald-800 dark:text-emerald-300 block mb-0.5">
                      So sánh với Tiếng Việt:
                    </strong>
                    {currentItem.vietnameseComparison}
                  </div>
                </div>

                {/* Common errors */}
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    <strong className="text-rose-800 dark:text-rose-300 block mb-0.5">
                      Lưu ý quan trọng:
                    </strong>
                    {currentItem.commonErrors}
                  </div>
                </div>
              </div>

              {/* Example Words Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
                  Ví dụ từ vựng thực tế ({currentItem.examples.length} từ)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {currentItem.examples.map((ex, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between hover:bg-emerald-50/50 dark:hover:bg-slate-750 transition-colors group"
                    >
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
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
                        onClick={() => handlePlaySound(ex.audioText)}
                        className="p-2 rounded-full bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white shadow-2xs transition-colors"
                        title={`Nghe: ${ex.pinyin}`}
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* If nasal subtab, also display the nasal airflow comparison banner */}
              {activeSubtab === 'nasal' && (
                <div className="pt-2">
                  <NasalAirflowDiagram />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
