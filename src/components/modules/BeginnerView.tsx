import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  Volume2,
  BookOpen,
  Layers,
  ArrowLeftRight,
  Award,
  Compass,
  LayoutGrid,
} from 'lucide-react';
import { BeginnerDashboard } from './beginner/BeginnerDashboard';
import { InitialsLab } from './beginner/InitialsLab';
import { FinalsLab } from './beginner/FinalsLab';
import { TonesLab } from './beginner/TonesLab';
import { MinimalPairsLab } from './beginner/MinimalPairsLab';
import { PinyinRulesLab } from './beginner/PinyinRulesLab';
import { SyllableChartLab } from './beginner/SyllableChartLab';
import { BeginnerAssessmentView } from './beginner/assessment/BeginnerAssessmentView';
import { BeginnerRoadmap } from './beginner/BeginnerRoadmap';

export type BeginnerViewTab =
  | 'dashboard'
  | 'initials'
  | 'finals'
  | 'tones'
  | 'minimal_pairs'
  | 'rules'
  | 'syllables'
  | 'assessment'
  | 'roadmap';

export interface BeginnerViewProps {
  onStartHsk1?: () => void;
}

export const BeginnerView: React.FC<BeginnerViewProps> = ({ onStartHsk1: _onStartHsk1 }) => {
  const [activeTab, setActiveTab] = useState<BeginnerViewTab>('dashboard');

  const navItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutGrid, count: null },
    { id: 'initials', label: '21 Thanh mẫu', icon: Volume2, count: '21' },
    { id: 'finals', label: '36 Vận mẫu', icon: BookOpen, count: '36' },
    { id: 'tones', label: 'Thanh điệu & Biến điệu', icon: Sparkles, count: '4+3' },
    { id: 'minimal_pairs', label: 'Cặp âm dễ nhầm', icon: ArrowLeftRight, count: '7' },
    { id: 'rules', label: 'Quy tắc Pinyin', icon: Layers, count: '4' },
    { id: 'syllables', label: 'Ghép âm tiết', icon: Compass, count: null },
    { id: 'assessment', label: 'Kiểm tra 30 câu', icon: Award, count: '30' },
    { id: 'roadmap', label: 'Lộ trình 9 bước', icon: GraduationCap, count: null },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16">
      {/* Top Navigation Bar with Pill Tabs */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1.5 overflow-x-auto py-3 no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as BeginnerViewTab)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300 dark:ring-blue-800'
                      : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.count && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main View Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <BeginnerDashboard onNavigateTab={(tab) => setActiveTab(tab as BeginnerViewTab)} />
        )}

        {activeTab === 'initials' && <InitialsLab />}

        {activeTab === 'finals' && <FinalsLab />}

        {activeTab === 'tones' && <TonesLab />}

        {activeTab === 'minimal_pairs' && <MinimalPairsLab />}

        {activeTab === 'rules' && <PinyinRulesLab />}

        {activeTab === 'syllables' && <SyllableChartLab />}

        {activeTab === 'assessment' && (
          <BeginnerAssessmentView onGoDashboard={() => setActiveTab('dashboard')} />
        )}

        {activeTab === 'roadmap' && (
          <BeginnerRoadmap onNavigateTab={(tab) => setActiveTab(tab as BeginnerViewTab)} />
        )}
      </div>
    </div>
  );
};

export default BeginnerView;
