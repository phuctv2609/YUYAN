import React, { useState, useEffect, useMemo } from 'react';
import { lessonRepository } from '../../data/hsk/lessonRepository.ts';
import { Lesson } from '../../data/hsk/types.ts';
import { LessonHeader } from './LessonHeader.tsx';
import { StudyControls, StudyMode, FontSize, ReadingLayout } from './StudyControls.tsx';
import { SentenceItem } from './SentenceItem.tsx';
import { LockedReadingFrame } from './LockedReadingFrame.tsx';
import { AudioBar } from './AudioBar.tsx';
import { RightPedagogicalPanel } from './RightPedagogicalPanel.tsx';
import { VocabularyView } from './VocabularyView.tsx';
import { ReadingView } from './ReadingView.tsx';
import { LessonQuizView } from './LessonQuizView.tsx';
import { GrammarView } from './GrammarView.tsx';
import { TheoryView } from './TheoryView.tsx';
import { PracticeView } from './PracticeView.tsx';
import { useToast } from '../ui/Toast.tsx';

interface LessonViewProps {
  initialLevel?: number;
  initialLessonNumber?: number;
  onBackToDashboard?: () => void;
}

export const LessonView: React.FC<LessonViewProps> = ({
  initialLevel = 1,
  initialLessonNumber = 1,
  onBackToDashboard,
}) => {
  const [currentLevel, setCurrentLevel] = useState<number>(initialLevel);
  const [currentLessonNumber, setCurrentLessonNumber] = useState<number>(initialLessonNumber);
  const [currentLesson, setCurrentLesson] = useState<Lesson | undefined>(undefined);
  const [selectedSentenceIndex, setSelectedSentenceIndex] = useState<number>(1);

  // Visibility & Study Mode States
  const [studyMode, setStudyMode] = useState<StudyMode>('learn');
  const [showHanzi, setShowHanzi] = useState<boolean>(true);
  const [showPinyin, setShowPinyin] = useState<boolean>(true);
  const [showVietnamese, setShowVietnamese] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState<FontSize>('md');
  const [readingLayout, setReadingLayout] = useState<ReadingLayout>('list');
  const [activeModuleTab, setActiveModuleTab] = useState<string>('bài khóa');

  const { showToast } = useToast();

  // Sync props to internal state when route changes
  useEffect(() => {
    setCurrentLevel(initialLevel);
    setCurrentLessonNumber(initialLessonNumber);
  }, [initialLevel, initialLessonNumber]);

  // Sync internal state to URL for bookmarkability and browser history
  useEffect(() => {
    const url = `/hsk/${currentLevel}/lesson/${currentLessonNumber}`;
    if (window.location.pathname !== url && window.location.pathname.startsWith('/hsk/')) {
      window.history.replaceState({}, '', url);
    }
  }, [currentLevel, currentLessonNumber]);

  // Load lesson dynamically from repository
  useEffect(() => {
    const lesson = lessonRepository.getLesson(currentLevel, currentLessonNumber);
    if (lesson) {
      setCurrentLesson(lesson);
      setSelectedSentenceIndex(1);
    } else {
      // Fallback: first lesson in level
      const firstInLvl = lessonRepository.getLessonsByLevel(currentLevel)[0];
      if (firstInLvl) {
        setCurrentLesson(firstInLvl);
        setCurrentLessonNumber(firstInLvl.lessonNumber);
        setSelectedSentenceIndex(1);
      }
    }
  }, [currentLevel, currentLessonNumber]);

  // Retrieve authentic Vocabulary and Reading data
  const vocabData = useMemo(() => {
    return lessonRepository.getLessonVocabulary(currentLevel, currentLessonNumber);
  }, [currentLevel, currentLessonNumber]);

  const readingData = useMemo(() => {
    return lessonRepository.getParsedLessonReading(currentLevel, currentLessonNumber);
  }, [currentLevel, currentLessonNumber]);

  if (!currentLesson) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="p-8 bg-surface rounded-2xl border border-border-subtle max-w-md shadow-2xs">
          <p className="text-lg font-bold text-text-primary">Không tìm thấy bài học</p>
          <p className="text-xs text-text-muted mt-1">HSK {currentLevel} Bài {currentLessonNumber}</p>
          <button
            onClick={() => {
              setCurrentLevel(1);
              setCurrentLessonNumber(1);
            }}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            Quay lại HSK 1 Bài 01
          </button>
        </div>
      </div>
    );
  }

  const lessonsInLevel = lessonRepository.getLessonsByLevel(currentLevel);
  const totalLessonsInLevel = lessonsInLevel.length;
  const adjacent = lessonRepository.getAdjacentLessons(currentLesson.lessonId);

  const handlePrevious = () => {
    if (adjacent.previous) {
      setCurrentLevel(adjacent.previous.level);
      setCurrentLessonNumber(adjacent.previous.lessonNumber);
      showToast(`Đã chuyển đến HSK ${adjacent.previous.level} Bài ${adjacent.previous.lessonNumber}: ${adjacent.previous.title}`, 'info');
    }
  };

  const handleNext = () => {
    if (adjacent.next) {
      setCurrentLevel(adjacent.next.level);
      setCurrentLessonNumber(adjacent.next.lessonNumber);
      showToast(`Đã chuyển đến HSK ${adjacent.next.level} Bài ${adjacent.next.lessonNumber}: ${adjacent.next.title}`, 'info');
    }
  };

  const handleModeChange = (newMode: StudyMode) => {
    // If clicking same active mode, allow toggle back to 'learn'
    if (studyMode === newMode && newMode !== 'learn') {
      setStudyMode('learn');
      setShowHanzi(true);
      setShowPinyin(true);
      setShowVietnamese(true);
      return;
    }

    setStudyMode(newMode);
    if (newMode === 'learn') {
      setShowHanzi(true);
      setShowPinyin(true);
      setShowVietnamese(true);
    } else if (newMode === 'self') {
      setShowHanzi(true);
      setShowPinyin(false);
      setShowVietnamese(false);
      setReadingLayout('frame');
    } else if (newMode === 'test') {
      setShowHanzi(true);
      setShowPinyin(false);
      setShowVietnamese(false);
    }
  };

  // Normalize tab alias
  const normalizedTab = activeModuleTab === 'từ vựng' ? 'từ mới' : activeModuleTab;

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 pb-[144px] md:pb-[92px]">
      {/* Lesson Header Navigation */}
      <LessonHeader
        lesson={currentLesson}
        totalLessonsInLevel={totalLessonsInLevel}
        hasPrevious={Boolean(adjacent.previous)}
        hasNext={Boolean(adjacent.next)}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onBackToCourse={() => {
          if (onBackToDashboard) onBackToDashboard();
        }}
        activeModuleTab={normalizedTab}
        onSelectModuleTab={(tab) => {
          const norm = tab === 'từ vựng' ? 'từ mới' : tab;
          setActiveModuleTab(norm);
        }}
        onSelectLevel={(lvl) => {
          setCurrentLevel(lvl);
          setCurrentLessonNumber(1);
        }}
        onSelectLessonNumber={(n) => {
          setCurrentLessonNumber(n);
        }}
        vocabCount={vocabData?.vocabulary?.length}
        hasReading={Boolean(readingData?.hanzi)}
      />

      {/* Main Workspace Content Area */}
      <div className="w-full max-w-[1440px] mx-auto p-3 sm:p-6 flex-1 min-h-0">
        {normalizedTab === 'bài khóa' ? (
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            {/* Left Reading Canvas */}
            <section className="flex-1 flex flex-col bg-surface rounded-2xl border border-border-subtle shadow-2xs card-motion light-beam-shimmer">
              {/* Study Modes & Visibility Toggles */}
              <StudyControls
                mode={studyMode}
                onModeChange={handleModeChange}
                showHanzi={showHanzi}
                onToggleHanzi={() => setShowHanzi(!showHanzi)}
                showPinyin={showPinyin}
                onTogglePinyin={() => setShowPinyin(!showPinyin)}
                showVietnamese={showVietnamese}
                onToggleVietnamese={() => setShowVietnamese(!showVietnamese)}
                fontSize={fontSize}
                onFontSizeChange={setFontSize}
                layoutMode={readingLayout}
                onLayoutModeChange={(layout) => setReadingLayout(layout)}
              />

              {/* Reading Content Area: Locked Single-Sentence Frame OR Full Document List */}
              <div className="p-3 sm:p-6">
                {readingLayout === 'frame' || studyMode === 'self' ? (
                  <LockedReadingFrame
                    sentences={currentLesson.lessonText}
                    selectedSentenceIndex={selectedSentenceIndex}
                    onSelectSentence={(idx) => setSelectedSentenceIndex(idx)}
                    showHanzi={showHanzi}
                    showPinyin={showPinyin}
                    showVietnamese={showVietnamese}
                    fontSize={fontSize}
                    onTogglePinyin={() => setShowPinyin(!showPinyin)}
                    onToggleVietnamese={() => setShowVietnamese(!showVietnamese)}
                  />
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {currentLesson.lessonText.map((sentence) => (
                      <SentenceItem
                        key={sentence.index}
                        sentence={sentence}
                        isSelected={selectedSentenceIndex === sentence.index}
                        onSelect={() => setSelectedSentenceIndex(sentence.index)}
                        showHanzi={showHanzi}
                        showPinyin={showPinyin}
                        showVietnamese={showVietnamese}
                        fontSize={fontSize}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Right Pedagogical Context Panel (desktop side-by-side) */}
            <div className="hidden lg:flex flex-shrink-0">
              <RightPedagogicalPanel
                lesson={currentLesson}
                onNavigateTab={(tab) => {
                  const norm = tab.toLowerCase() === 'từ vựng' ? 'từ mới' : tab.toLowerCase();
                  setActiveModuleTab(norm);
                }}
              />
            </div>
          </div>
        ) : normalizedTab === 'từ mới' ? (
          <VocabularyView
            level={currentLevel}
            lessonNumber={currentLessonNumber}
            lessonTitle={currentLesson.title}
            vocabularyData={vocabData}
          />
        ) : normalizedTab === 'đoạn văn' ? (
          <ReadingView
            level={currentLevel}
            lessonNumber={currentLessonNumber}
            lessonTitle={currentLesson.title}
            readingData={readingData}
          />
        ) : normalizedTab === 'ngữ pháp' ? (
          <GrammarView lesson={currentLesson} />
        ) : normalizedTab === 'lý thuyết' ? (
          <TheoryView lesson={currentLesson} />
        ) : normalizedTab === 'luyện tập' ? (
          <PracticeView lesson={currentLesson} />
        ) : normalizedTab === 'kiểm tra' ? (
          <LessonQuizView lesson={currentLesson} vocabData={vocabData} />
        ) : (
          <div className="p-8 text-center bg-surface rounded-2xl border border-border-subtle">
            <p className="text-sm font-semibold text-text-muted">Chuyên mục đang được hoàn thiện</p>
          </div>
        )}
      </div>

      {/* Dedicated Floating Audio Player Bar */}
      <AudioBar
        sentences={currentLesson.lessonText}
        selectedSentenceIndex={selectedSentenceIndex}
        onSelectSentence={(idx) => setSelectedSentenceIndex(idx)}
        level={currentLevel}
        lessonNumber={currentLessonNumber}
      />
    </div>
  );
};
