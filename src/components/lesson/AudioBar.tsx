import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RotateCcw, SkipBack, SkipForward, Play, Pause, Repeat, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '../ui/Toast.tsx';
import { Sentence } from '../../data/hsk/types.ts';
import { parseDialogueSentence } from '../../data/hsk/dialogueParser.ts';
import { audioManager } from '../../services/audio/index.ts';
import { AudioTrackMetadata, AudioPlaybackEvent } from '../../services/audio/audioTypes.ts';

interface AudioBarProps {
  sentences: Sentence[];
  selectedSentenceIndex: number;
  onSelectSentence: (index: number) => void;
  level: number;
  lessonNumber: number;
}

export const AudioBar: React.FC<AudioBarProps> = ({
  sentences,
  selectedSentenceIndex,
  onSelectSentence,
  level,
  lessonNumber,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number>(selectedSentenceIndex);
  const isLoopingRef = useRef(isLooping);
  isLoopingRef.current = isLooping;

  const { showToast } = useToast();

  // Keep internal state aligned with selected sentence
  useEffect(() => {
    setCurrentIndex(selectedSentenceIndex);
  }, [selectedSentenceIndex]);

  // Construct audio tracks from lesson sentences
  const tracks: AudioTrackMetadata[] = useMemo(() => {
    return (sentences || []).map((s) => {
      const parsed = parseDialogueSentence(s);
      return {
        id: `hsk_${level}_l${lessonNumber}_s${s.index}`,
        text: parsed.spokenContent.hanzi,
        pinyin: parsed.spokenContent.pinyin,
        entityType: 'sentence',
        entityId: String(s.index),
        lang: 'zh-CN',
      };
    });
  }, [sentences, level, lessonNumber]);

  // Cleanup audio when switching lesson or unmounting
  useEffect(() => {
    audioManager.cleanup();
    setIsPlaying(false);
    return () => {
      audioManager.cleanup();
    };
  }, [level, lessonNumber]);

  // Subscribe to audioManager state updates
  useEffect(() => {
    const unsubscribe = audioManager.subscribe((event: AudioPlaybackEvent) => {
      if (event.state === 'playing') {
        setIsPlaying(true);
        if (event.track?.entityId) {
          const sentIdx = parseInt(event.track.entityId, 10);
          if (!isNaN(sentIdx)) {
            setCurrentIndex(sentIdx);
            onSelectSentence(sentIdx);
          }
        }
      } else if (event.state === 'paused') {
        setIsPlaying(false);
      } else if (event.state === 'ended') {
        if (isLoopingRef.current && event.track) {
          // Replay current track in loop mode
          setTimeout(() => {
            if (event.track) {
              audioManager.playTrack(event.track);
            }
          }, 300);
        } else {
          setIsPlaying(false);
        }
      } else if (event.state === 'stopped' || event.state === 'idle' || event.state === 'error') {
        setIsPlaying(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [onSelectSentence]);

  const handlePlayToggle = async () => {
    if (isPlaying) {
      audioManager.pause();
      setIsPlaying(false);
      return;
    }

    if (tracks.length === 0) {
      showToast('Bài học hiện chưa có dữ liệu câu hội thoại', 'warning');
      return;
    }

    const state = audioManager.getState();
    if (state === 'paused') {
      audioManager.resume();
      setIsPlaying(true);
      return;
    }

    // Start sequential queue playback from currently selected sentence
    const startIndex = Math.max(0, currentIndex - 1);
    try {
      await audioManager.playQueue(tracks, startIndex, true);
      setIsPlaying(true);
      showToast(`Đang phát tuần tự từ câu ${currentIndex}`, 'info');
    } catch (err: any) {
      showToast(err?.message || 'Không thể bắt đầu phát âm thanh', 'warning');
    }
  };

  const handleNext = async () => {
    if (currentIndex < tracks.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      onSelectSentence(nextIdx);
      const targetTrack = tracks[nextIdx - 1];
      if (targetTrack) {
        await audioManager.playTrack(targetTrack);
      }
    } else {
      showToast('Đã đến câu thoại cuối cùng của bài', 'info');
    }
  };

  const handlePrevious = async () => {
    if (currentIndex > 1) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      onSelectSentence(prevIdx);
      const targetTrack = tracks[prevIdx - 1];
      if (targetTrack) {
        await audioManager.playTrack(targetTrack);
      }
    } else {
      showToast('Đang ở câu thoại đầu tiên', 'info');
    }
  };

  const handleReplayCurrent = async () => {
    const targetTrack = tracks[currentIndex - 1];
    if (targetTrack) {
      await audioManager.playTrack(targetTrack);
      showToast(`Phát lại câu ${currentIndex}`, 'info');
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    audioManager.setPlaybackRate(newSpeed);
    showToast(`Tốc độ phát âm: ${newSpeed}x`, 'info');
  };

  const handleLoopToggle = () => {
    const nextVal = !isLooping;
    setIsLooping(nextVal);
    showToast(nextVal ? 'Đã bật chế độ lặp lại câu hiện tại' : 'Đã tắt chế độ lặp lại', 'info');
  };

  const progressPercent = tracks.length > 0 ? (currentIndex / tracks.length) * 100 : 0;

  return (
    <div
      id="yuyan-audio-controller"
      className="fixed bottom-[60px] md:bottom-0 left-0 right-0 md:left-[260px] z-30 h-[68px] bg-surface/95 backdrop-blur-md border-t border-border-subtle shadow-lg flex items-center justify-between px-3 sm:px-6 select-none"
    >
      {/* Playback Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <button
          onClick={handleReplayCurrent}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-secondary btn-motion transition-colors"
          title="Phát lại câu hiện tại"
          aria-label="Phát lại câu hiện tại"
        >
          <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <button
          onClick={handlePrevious}
          disabled={currentIndex <= 1}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-secondary disabled:opacity-40 disabled:pointer-events-none btn-motion transition-colors"
          title="Câu trước đó"
          aria-label="Câu trước đó"
        >
          <SkipBack className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <button
          data-testid="audiobar-play-btn"
          aria-label={isPlaying ? 'Tạm dừng bài học' : 'Phát bài học'}
          onClick={handlePlayToggle}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary-hover btn-motion active:scale-95 transition-all"
          title={isPlaying ? 'Tạm dừng (Pause)' : 'Phát bài khóa (Play)'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-white" />
          ) : (
            <Play className="w-5 h-5 fill-white ml-0.5" />
          )}
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex >= tracks.length}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-secondary disabled:opacity-40 disabled:pointer-events-none btn-motion transition-colors"
          title="Câu tiếp theo"
          aria-label="Câu tiếp theo"
        >
          <SkipForward className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* Progress & Status Indicator */}
      <div className="flex-1 flex items-center gap-2 sm:gap-3 min-w-0 max-w-xl mx-2 sm:mx-4">
        <div className="flex items-center gap-1.5 text-xs text-text-muted flex-shrink-0">
          {isPlaying ? (
            <span className="flex items-center gap-1 text-primary font-semibold">
              <Volume2 className="w-3.5 h-3.5 animate-pulse text-primary" />
              <span className="hidden sm:inline">Đang phát câu {currentIndex}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-text-muted">
              <VolumeX className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sẵn sàng phát</span>
            </span>
          )}
        </div>

        <div className="relative flex-1 h-2 bg-surface-secondary rounded-full overflow-hidden border border-border-subtle">
          <div
            className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <span className="text-xs text-text-muted font-medium flex-shrink-0">
          {currentIndex} / {tracks.length} câu
        </span>
      </div>

      {/* Speed & Loop Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <div className="flex items-center bg-surface-secondary rounded-lg p-0.5 border border-border-subtle text-xs font-semibold">
          {[0.75, 1.0, 1.25, 1.5].map((s) => (
            <button
              key={s}
              onClick={() => handleSpeedChange(s)}
              className={`px-1.5 sm:px-2 py-0.5 rounded transition-colors ${
                speed === s
                  ? 'bg-surface text-primary shadow-2xs font-bold'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        <button
          onClick={handleLoopToggle}
          className={`p-1.5 sm:p-2 rounded-lg border transition-colors btn-motion ${
            isLooping
              ? 'text-primary bg-primary-soft border-primary/30 shadow-2xs'
              : 'text-text-secondary border-border-subtle hover:bg-surface-secondary'
          }`}
          title={isLooping ? 'Chế độ lặp lại đang BẬT' : 'Bật chế độ lặp lại câu'}
          aria-label="Lặp lại câu"
        >
          <Repeat className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  );
};
