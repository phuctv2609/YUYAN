import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { TopNavbar } from './components/layout/TopNavbar.tsx';
import { MobileBottomNav } from './components/layout/MobileBottomNav.tsx';
import { SearchModal } from './components/layout/SearchModal.tsx';
import { DashboardView } from './components/dashboard/DashboardView.tsx';
import { LessonView } from './components/lesson/LessonView.tsx';
import { WritingPracticeView } from './components/modules/WritingPracticeView.tsx';
import { SpeakingPracticeView } from './components/modules/SpeakingPracticeView.tsx';
import { ListeningPracticeView } from './components/modules/ListeningPracticeView.tsx';
import { RadicalView } from './components/modules/RadicalView.tsx';
import { HanziView } from './components/modules/HanziView.tsx';
import { MistakeBookView } from './components/modules/MistakeBookView.tsx';
import { SentenceOrderingView } from './components/modules/SentenceOrderingView.tsx';
import { ExamView } from './components/modules/ExamView.tsx';
import { DictionaryView } from './components/modules/DictionaryView.tsx';
import { HskVocabularyView } from './components/modules/HskVocabularyView.tsx';
import { GrammarPracticeView } from './components/modules/GrammarPracticeView.tsx';
import { PinyinPracticeView } from './components/modules/PinyinPracticeView.tsx';
import { BeginnerView } from './components/modules/BeginnerView.tsx';
import { ProgressView } from './components/modules/ProgressView.tsx';
import { SettingsView } from './components/modules/SettingsView.tsx';
import { AiConversationView } from './components/modules/AiConversationView.tsx';
import { SpecializedVocabularyView } from './components/modules/SpecializedVocabularyView.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { ToastProvider, useToast } from './components/ui/Toast.tsx';
import { ErrorBoundary } from './components/ui/ErrorBoundary.tsx';
import { MandarinVoiceHelpModal } from './components/ui/MandarinVoiceHelpModal.tsx';
import { YuyanAIProvider } from './context/YuyanAIContext.tsx';
import { YuyanAIFloatingButton } from './components/ai/YuyanAIFloatingButton.tsx';
import { YuyanChatPanel } from './components/ai/YuyanChatPanel.tsx';
import { YuyanVoiceModal } from './components/ai/YuyanVoiceModal.tsx';
import { YuyanLanguageModal } from './components/ai/YuyanLanguageModal.tsx';
import { YuyanVoiceSettingsModal } from './components/ai/YuyanVoiceSettingsModal.tsx';
import { lessonRepository } from './data/hsk/lessonRepository.ts';
import { BookOpen, AlertCircle } from 'lucide-react';

interface RouteState {
  tab: string;
  level: number;
  lessonNumber: number;
  isNotFound: boolean;
  char?: string;
  radicalNum?: number;
  word?: string;
}

const STORAGE_KEY = 'yuyan_study_state_v1';

function parseUrl(pathname: string): RouteState {
  const path = pathname.replace(/\/+$/, '') || '/';

  if (path === '/' || path === '/dashboard') {
    return { tab: 'dashboard', level: 1, lessonNumber: 1, isNotFound: false };
  }

  // Support /thi-hsk as alias for /exam
  if (path === '/thi-hsk') {
    return { tab: 'exam', level: 1, lessonNumber: 1, isNotFound: false };
  }

  // Support /tu-dien alias
  if (path === '/tu-dien') {
    return { tab: 'dictionary', level: 1, lessonNumber: 1, isNotFound: false };
  }

  // Support /profile, /account, /profile/settings, /ho-so aliases
  if (
    path === '/profile' ||
    path === '/account' ||
    path === '/ho-so' ||
    path === '/profile/settings' ||
    path === '/profile/edit' ||
    path === '/settings/profile'
  ) {
    return { tab: 'profile', level: 1, lessonNumber: 1, isNotFound: false };
  }

  // Support /lesson/hskX-baiYY or /lesson/hskX-lessonYY
  const matchLessonSlug = path.match(/^\/lesson\/hsk([1-6])-(?:bai|lesson)(\d+)$/i);
  if (matchLessonSlug) {
    const level = parseInt(matchLessonSlug[1], 10);
    const lessonNumber = parseInt(matchLessonSlug[2], 10);
    const lesson = lessonRepository.getLesson(level, lessonNumber);
    if (!lesson) {
      return { tab: 'lesson', level, lessonNumber, isNotFound: true };
    }
    return { tab: 'lesson', level, lessonNumber, isNotFound: false };
  }

  // /hsk/:lvl/lesson/:num
  const matchLesson = path.match(/^\/hsk\/([1-6])\/lesson\/(\d+)$/);
  if (matchLesson) {
    const level = parseInt(matchLesson[1], 10);
    const lessonNumber = parseInt(matchLesson[2], 10);
    const lesson = lessonRepository.getLesson(level, lessonNumber);
    if (!lesson) {
      return { tab: 'lesson', level, lessonNumber, isNotFound: true };
    }
    return { tab: 'lesson', level, lessonNumber, isNotFound: false };
  }

  // /hsk/:lvl
  const matchLevel = path.match(/^\/hsk\/([1-6])$/);
  if (matchLevel) {
    const level = parseInt(matchLevel[1], 10);
    return { tab: 'lesson', level, lessonNumber: 1, isNotFound: false };
  }

  // Invalid /hsk/...
  if (path.startsWith('/hsk/')) {
    return { tab: 'lesson', level: 1, lessonNumber: 1, isNotFound: true };
  }

  // Standard modules
  const validTabs = [
    'beginner',
    'vocabulary',
    'specialized',
    'grammar',
    'listening',
    'speaking',
    'writing',
    'hanzi',
    'radicals',
    'sentence-ordering',
    'mistakes',
    'pinyin',
    'exam',
    'ai',
    'dictionary',
    'progress',
    'community',
    'settings',
    'profile',
    'account',
  ];
  const tabName = path.replace(/^\//, '');
  if (validTabs.includes(tabName)) {
    return { tab: tabName, level: 1, lessonNumber: 1, isNotFound: false };
  }

  // Unknown route
  return { tab: '404', level: 1, lessonNumber: 1, isNotFound: true };
}

const AppContent: React.FC = () => {
  const [route, setRoute] = useState<RouteState>(() => parseUrl(window.location.pathname));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const { showToast } = useToast();

  // Load last studied lesson on clean startup if at root
  useEffect(() => {
    if (window.location.pathname === '/' || window.location.pathname === '') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed.level === 'number' && typeof parsed.lessonNumber === 'number') {
            const exists = lessonRepository.getLesson(parsed.level, parsed.lessonNumber);
            if (exists) {
              setRoute((r) => ({ ...r, level: parsed.level, lessonNumber: parsed.lessonNumber }));
            }
          }
        }
      } catch (e) {
        console.warn('Storage corrupted, resetting gracefully:', e);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Listen to popstate (Browser Back / Forward)
  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseUrl(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigate helper updating URL and State
  const navigate = useCallback(
    (newRoute: Partial<RouteState>, replace = false) => {
      setRoute((prev) => {
        const next: RouteState = { ...prev, ...newRoute, isNotFound: false };
        let url = '/';

        if (next.tab === 'dashboard') {
          url = '/';
        } else if (next.tab === 'lesson') {
          url = `/hsk/${next.level}/lesson/${next.lessonNumber}`;
        } else if (next.tab === 'profile' || next.tab === 'account') {
          url = '/profile';
        } else {
          url = `/${next.tab}`;
        }

        if (replace) {
          window.history.replaceState({}, '', url);
        } else if (window.location.pathname !== url) {
          window.history.pushState({}, '', url);
        }

        // Save last visited lesson
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ level: next.level, lessonNumber: next.lessonNumber })
          );
        } catch (e) {
          // ignore storage error
        }

        return next;
      });
    },
    []
  );

  const handleStartLesson = (level: number, lessonNum: number) => {
    navigate({ tab: 'lesson', level, lessonNumber: lessonNum });
    showToast(`Đang mở Giáo trình HSK ${level} Bài ${lessonNum}`, 'info');
  };

  const handleOpenPractice = (practiceType: string) => {
    navigate({ tab: practiceType });
  };

  const handleSelectTab = (tab: string) => {
    navigate({ tab });
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background-canvas relative">
      {/* Ambient Lighting Glow Layer */}
      <div className="ambient-glow-layer pointer-events-none select-none">
        <div className="ambient-orb w-[500px] h-[500px] -top-32 -left-32 bg-primary/10 dark:bg-primary/15" />
        <div className="ambient-orb w-[450px] h-[450px] top-1/2 -right-32 bg-secondary/10 dark:bg-secondary/15" />
        <div className="ambient-orb w-[400px] h-[400px] -bottom-32 left-1/3 bg-sky-400/10 dark:bg-sky-500/15" />
      </div>

      {/* Desktop Sidebar & Mobile Drawer */}
      <Sidebar
        currentTab={route.tab}
        onSelectTab={handleSelectTab}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Top Navbar with Search Modal trigger & Theme Switcher */}
      <TopNavbar
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenSearchModal={() => setIsSearchModalOpen(true)}
        onSelectTab={handleSelectTab}
      />

      {/* Global Search Dialog (Ctrl+K) */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectLesson={(level, lessonNumber) => {
          navigate({ tab: 'lesson', level, lessonNumber });
        }}
        onNavigateTab={(tab) => {
          navigate({ tab });
        }}
      />

      {/* Mandarin Voice Help Modal for missing zh-CN system speech package */}
      <MandarinVoiceHelpModal />

      {/* Main Single Document Scroll Container */}
      <main
        id="main-scroll-container"
        className="flex-1 md:ml-[260px] pt-[68px] pb-0 h-full overflow-y-auto overscroll-y-contain custom-scrollbar relative z-10"
      >
        {route.isNotFound ? (
          /* Friendly 404 Not Found Page */
          <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-6 text-center">
            <div className="bg-surface p-8 sm:p-10 rounded-3xl border border-border-subtle shadow-md max-w-md w-full card-motion">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2">Không tìm thấy trang</h2>
              <p className="text-xs text-text-secondary mb-6 leading-relaxed">
                Đường dẫn bài học hoặc chuyên mục không tồn tại trong hệ thống giáo trình HSK 1–6.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => navigate({ tab: 'dashboard' })}
                  className="px-4 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary-hover transition-colors btn-motion"
                >
                  Về Trang chủ
                </button>
                <button
                  onClick={() => navigate({ tab: 'lesson', level: 1, lessonNumber: 1 })}
                  className="px-4 py-2.5 bg-surface-secondary text-text-secondary text-xs font-bold rounded-xl hover:bg-border-subtle transition-colors btn-motion"
                >
                  Học HSK 1 Bài 01
                </button>
              </div>
            </div>
          </div>
        ) : route.tab === 'dashboard' ? (
          <div className="w-full pb-20 md:pb-8">
            <DashboardView onStartLesson={handleStartLesson} onOpenPractice={handleOpenPractice} />
          </div>
        ) : route.tab === 'lesson' ? (
          <div className="w-full flex flex-col">
            <LessonView
              key={`${route.level}-${route.lessonNumber}`}
              initialLevel={route.level}
              initialLessonNumber={route.lessonNumber}
              onBackToDashboard={() => navigate({ tab: 'dashboard' })}
            />
          </div>
        ) : route.tab === 'hanzi' ? (
          <div className="w-full pb-24 md:pb-12">
            <HanziView
              initialChar={route.char || '学'}
              onOpenRadical={(radNum) => navigate({ tab: 'radicals', radicalNum: radNum })}
              onOpenWord={(word) => navigate({ tab: 'dictionary', word })}
            />
          </div>
        ) : route.tab === 'radicals' ? (
          <div className="w-full pb-24 md:pb-12">
            <RadicalView
              onOpenHanzi={(char) => navigate({ tab: 'hanzi', char })}
              onOpenWord={(word) => navigate({ tab: 'dictionary', word })}
            />
          </div>
        ) : route.tab === 'listening' ? (
          <div className="w-full pb-24 md:pb-12">
            <ListeningPracticeView />
          </div>
        ) : route.tab === 'speaking' ? (
          <div className="w-full pb-24 md:pb-12">
            <SpeakingPracticeView />
          </div>
        ) : route.tab === 'writing' ? (
          <div className="w-full pb-24 md:pb-12">
            <WritingPracticeView />
          </div>
        ) : route.tab === 'sentence-ordering' ? (
          <div className="w-full pb-24 md:pb-12">
            <SentenceOrderingView />
          </div>
        ) : route.tab === 'mistakes' ? (
          <div className="w-full pb-24 md:pb-12">
            <MistakeBookView />
          </div>
        ) : route.tab === 'exam' ? (
          <div className="w-full pb-24 md:pb-12">
            <ExamView />
          </div>
        ) : route.tab === 'vocabulary' ? (
          <div className="w-full pb-24 md:pb-12">
            <HskVocabularyView
              onOpenLesson={(lvl, num) => navigate({ tab: 'lesson', level: lvl, lessonNumber: num })}
              onOpenHanzi={(char) => navigate({ tab: 'hanzi', char })}
              onOpenDictionary={(word) => navigate({ tab: 'dictionary', word })}
            />
          </div>
        ) : route.tab === 'dictionary' ? (
          <div className="w-full pb-24 md:pb-12">
            <DictionaryView
              initialQuery={route.word}
              onOpenLesson={(lvl, num) => navigate({ tab: 'lesson', level: lvl, lessonNumber: num })}
              onOpenHanzi={(char) => navigate({ tab: 'hanzi', char })}
              onOpenSpecialized={(_domain) => navigate({ tab: 'specialized' })}
            />
          </div>
        ) : route.tab === 'specialized' ? (
          <div className="w-full pb-24 md:pb-12">
            <SpecializedVocabularyView />
          </div>
        ) : route.tab === 'grammar' ? (
          <div className="w-full pb-24 md:pb-12">
            <GrammarPracticeView />
          </div>
        ) : route.tab === 'pinyin' ? (
          <div className="w-full pb-24 md:pb-12">
            <PinyinPracticeView />
          </div>
        ) : route.tab === 'beginner' ? (
          <div className="w-full pb-24 md:pb-12">
            <BeginnerView onStartHsk1={() => navigate({ tab: 'lesson', level: 1, lessonNumber: 1 })} />
          </div>
        ) : route.tab === 'progress' ? (
          <div className="w-full pb-24 md:pb-12">
            <ProgressView />
          </div>
        ) : route.tab === 'settings' || route.tab === 'profile' || route.tab === 'account' ? (
          <div className="w-full pb-24 md:pb-12">
            <SettingsView />
          </div>
        ) : route.tab === 'ai' ? (
          <div className="w-full pb-24 md:pb-12">
            <AiConversationView />
          </div>
        ) : (
          /* Secondary Fallback Page with Live HSK Lesson Link */
          <div className="min-h-[calc(100vh-160px)] p-6 max-w-4xl mx-auto flex flex-col items-center justify-center text-center pb-24 md:pb-12">
            <div className="bg-surface p-8 sm:p-10 rounded-3xl border border-border-subtle shadow-sm max-w-lg w-full card-motion">
              <div className="w-14 h-14 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mx-auto mb-4 font-bold text-xl">
                <BookOpen className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-text-primary capitalize mb-2">
                Chuyên mục: {route.tab}
              </h2>
              <p className="text-xs text-text-secondary mb-6 leading-relaxed">
                Module này đồng bộ với 146 bài học HSK 1–6 chính thức. Dữ liệu ngữ pháp, bài tập và từ vựng được nạp trực tiếp theo từng bài học.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate({ tab: 'lesson', level: route.level, lessonNumber: route.lessonNumber })}
                  className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary-hover transition-colors btn-motion"
                >
                  Học bài khóa HSK {route.level} Bài {route.lessonNumber}
                </button>
                <button
                  onClick={() => navigate({ tab: 'dashboard' })}
                  className="px-5 py-2.5 bg-surface-secondary text-text-secondary text-xs font-bold rounded-xl hover:bg-border-subtle transition-colors btn-motion"
                >
                  Về trang chủ
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav currentTab={route.tab} onSelectTab={handleSelectTab} />

      {/* Global Yuyan AI Floating Assistant & Interactive Modals */}
      <YuyanAIFloatingButton />
      <YuyanChatPanel onNavigateToWorkspace={() => navigate({ tab: 'ai' })} />
      <YuyanVoiceModal />
      <YuyanLanguageModal />
      <YuyanVoiceSettingsModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <YuyanAIProvider>
            <AppContent />
          </YuyanAIProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
