import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  AlertCircle,
  CheckCircle2,
  Search,
  Sparkles,
  Award,
} from 'lucide-react';
import { useToast } from '../ui/Toast.tsx';
import { audioManager, audioRecordingService, AudioRecordingService } from '../../services/audio/index.ts';
import { lessonRepository } from '../../data/repositories';
import { learningProgressService } from '../../services/progress/learningProgressService';
import { aiApiService, PronunciationEvaluation } from '../../services/ai/aiApiService';

type SpeakingState = 'READY' | 'PERMISSION' | 'LISTENING' | 'PROCESSING' | 'RESULT' | 'ERROR';

interface PracticeSentence {
  id: string;
  hanzi: string;
  pinyin: string;
  vietnamese: string;
  level: number;
  lessonTitle?: string;
}

const DEFAULT_SENTENCE: PracticeSentence = {
  id: 'hsk1-s001',
  hanzi: '你好，很高兴认识你。',
  pinyin: 'Nǐ hǎo, hěn gāoxìng rènshí nǐ.',
  vietnamese: 'Xin chào, rất vui được làm quen với bạn.',
  level: 1,
  lessonTitle: 'Chào hỏi cơ bản',
};

export const SpeakingPracticeView: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<number>(0); // 0 = all
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSentence, setSelectedSentence] = useState<PracticeSentence>(DEFAULT_SENTENCE);
  const [state, setState] = useState<SpeakingState>('READY');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<PronunciationEvaluation | null>(null);

  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const { showToast } = useToast();

  // Load authentic dialogue sentences dynamically from lesson repository
  const availableSentences: PracticeSentence[] = React.useMemo(() => {
    const rawSentences = lessonRepository.getPracticeSentences(
      selectedLevel > 0 ? selectedLevel : undefined,
      100
    );
    if (!searchQuery.trim()) return rawSentences;
    const q = searchQuery.toLowerCase().trim();
    return rawSentences.filter(
      (s) =>
        s.hanzi.toLowerCase().includes(q) ||
        s.pinyin.toLowerCase().includes(q) ||
        s.vietnamese.toLowerCase().includes(q)
    );
  }, [selectedLevel, searchQuery]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioRecordingService.cancelRecording();
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
    };
  }, []);

  const startRecording = async () => {
    setState('PERMISSION');
    setErrorMessage(null);
    setAudioUrl(null);
    setEvaluation(null);
    setDurationSeconds(0);

    try {
      await audioRecordingService.startRecording({
        onVolume: (vol) => setVolumeLevel(vol),
        onDuration: (secs) => setDurationSeconds(secs),
        onStateChange: (recState) => {
          if (recState === 'recording') setState('LISTENING');
          else if (recState === 'requesting') setState('PERMISSION');
        },
      });
      setState('LISTENING');
    } catch (err: any) {
      console.warn('Audio recording failed:', err);
      setState('ERROR');
      setErrorMessage(err?.message || 'Không thể kết nối microphone.');
      showToast('Chưa thể mở microphone trên thiết bị', 'warning');
    }
  };

  const stopRecording = async () => {
    setState('PROCESSING');
    try {
      const result = await audioRecordingService.stopRecording();
      setAudioUrl(result.url);
      setVolumeLevel(0);

      // Perform authentic AI Pronunciation Evaluation
      let base64Data: string | undefined;
      try {
        base64Data = await AudioRecordingService.blobToBase64(result.blob);
      } catch {
        // Safe fallback
      }

      const evalResult = await aiApiService.evaluatePronunciation({
        targetHanzi: selectedSentence.hanzi,
        targetPinyin: selectedSentence.pinyin,
        audioBase64: base64Data,
        audioMimeType: result.mimeType,
        level: selectedSentence.level,
      });

      setEvaluation(evalResult);
      setState('RESULT');
      showToast(`Chấm phát âm hoàn tất: ${evalResult.score}/100 điểm!`, 'success');

      // Record study activity
      void learningProgressService.recordExerciseCompleted({
        type: 'speaking',
        entityId: selectedSentence.id,
        score: evalResult.score,
        durationMinutes: Math.max(1, Math.round(result.durationMs / 60000)),
      });
    } catch (err: any) {
      setState('ERROR');
      setErrorMessage(err?.message || 'Lỗi khi xử lý bản ghi âm.');
      showToast('Không thể hoàn tất phân tích giọng nói', 'warning');
    }
  };

  const handleTogglePlayRecorded = () => {
    if (!audioUrl) return;

    if (!audioElementRef.current) {
      audioElementRef.current = new Audio(audioUrl);
      audioElementRef.current.onended = () => setIsPlayingRecorded(false);
    }

    if (isPlayingRecorded) {
      audioElementRef.current.pause();
      setIsPlayingRecorded(false);
    } else {
      audioElementRef.current.play().then(() => setIsPlayingRecorded(true)).catch(() => {});
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-4 sm:p-6 rounded-2xl border border-border-subtle shadow-2xs card-motion">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-secondary-fixed text-secondary flex items-center justify-center font-bold shadow-2xs">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Luyện phát âm & Chấm điểm AI</h1>
            <p className="text-xs text-text-secondary mt-0.5">
              Phân tích thanh mẫu, vận mẫu, thanh điệu 4 mức và hướng dẫn chỉnh sửa khẩu hình chuyên sâu
            </p>
          </div>
        </div>

        <span className="text-xs px-3 py-1 rounded-full bg-surface-secondary text-text-muted border border-border-subtle">
          Trạng thái: {state}
        </span>
      </div>

      {/* Main Practice Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Target Sentence & Recording Console */}
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-border-subtle p-5 sm:p-7 shadow-2xs space-y-6 card-motion">
          {/* Target Sentence Card */}
          <div className="p-5 rounded-2xl bg-primary-ultra-soft border border-primary-soft space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary px-2.5 py-0.5 rounded bg-primary-soft">
                HSK {selectedSentence.level} • Câu luyện đọc
              </span>
              <button
                onClick={() =>
                  audioManager.playText(selectedSentence.hanzi, {
                    id: `speaking_ref_${selectedSentence.id}`,
                    entityType: 'sentence',
                    entityId: String(selectedSentence.id),
                    pinyin: selectedSentence.pinyin,
                  })
                }
                className="text-xs text-text-secondary hover:text-primary flex items-center gap-1 font-semibold btn-motion"
                title="Nghe phát âm tiếng Trung chuẩn"
              >
                <Volume2 className="w-4 h-4" />
                <span>Nghe giọng bản xứ</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="font-hanzi text-2xl sm:text-3xl font-bold text-text-primary tracking-wide">
                {selectedSentence.hanzi}
              </div>
              <div className="font-sans text-base text-deep-blue font-semibold">
                {selectedSentence.pinyin}
              </div>
              <p className="text-xs sm:text-sm text-text-secondary">
                {selectedSentence.vietnamese}
              </p>
            </div>
          </div>

          {/* Interactive Microphone & Waveform Area */}
          <div className="p-8 rounded-2xl bg-surface-secondary/70 border border-border-subtle flex flex-col items-center justify-center text-center space-y-4">
            {state === 'LISTENING' ? (
              /* Active Recording Visualizer */
              <div className="space-y-3 flex flex-col items-center">
                <div className="relative">
                  <div
                    className="absolute inset-0 rounded-full bg-secondary/25 animate-ping"
                    style={{ transform: `scale(${1 + volumeLevel / 100})` }}
                  />
                  <button
                    onClick={stopRecording}
                    className="relative w-20 h-20 rounded-full bg-secondary text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                    title="Dừng ghi âm và chấm điểm AI"
                  >
                    <Square className="w-7 h-7 fill-white" />
                  </button>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-bold text-secondary animate-pulse">
                    Đang lắng nghe ({durationSeconds}s)...
                  </p>
                  <p className="text-xs text-text-muted">Nói to rõ câu tiếng Trung ở trên, sau đó bấm để chấm điểm</p>
                </div>

                {/* Real Sound Wave Bar */}
                <div className="w-48 h-3 bg-surface rounded-full overflow-hidden border border-border-subtle p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-100"
                    style={{ width: `${Math.max(8, volumeLevel)}%` }}
                  />
                </div>
              </div>
            ) : state === 'PROCESSING' ? (
              /* Processing State */
              <div className="py-6 space-y-3">
                <div className="w-12 h-12 rounded-full border-3 border-primary border-t-transparent animate-spin mx-auto" />
                <p className="text-xs font-semibold text-text-secondary">
                  AI đang đối chiếu thanh mẫu, vận mẫu và cao độ thanh điệu...
                </p>
              </div>
            ) : state === 'RESULT' && evaluation ? (
              /* Real AI Evaluation Results Card */
              <div className="w-full space-y-5 text-left">
                {/* Score & Rating Top Banner */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border-subtle">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-xs ${
                        evaluation.score >= 85
                          ? 'bg-status-success/15 text-status-success border border-status-success/30'
                          : evaluation.score >= 70
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                      }`}
                    >
                      {evaluation.score}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-text-primary">
                          Đánh giá: {evaluation.accuracy}
                        </span>
                        <span className="text-2xs px-2 py-0.5 rounded-full bg-secondary-fixed text-secondary font-bold">
                          {evaluation.toneAccuracy}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        Bản ghi: {durationSeconds}s • Pinyin nhận dạng: <span className="font-mono text-primary font-bold">{evaluation.pinyinDetected}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleTogglePlayRecorded}
                      className="px-3 py-2 bg-surface-secondary hover:bg-border-subtle text-text-primary text-xs font-bold rounded-xl border border-border-subtle flex items-center gap-1.5 transition-colors"
                      title="Nghe lại bản thu của bạn"
                    >
                      {isPlayingRecorded ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isPlayingRecorded ? 'Dừng' : 'Nghe giọng bạn'}</span>
                    </button>
                    <button
                      onClick={startRecording}
                      className="px-3 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Đọc lại</span>
                    </button>
                  </div>
                </div>

                {/* Phonetics Analysis Breakdown */}
                <div className="space-y-3 bg-surface p-4 rounded-2xl border border-border-subtle text-xs">
                  {/* Correct phonemes */}
                  {evaluation.correctParts && evaluation.correctParts.length > 0 && (
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-status-success shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-status-success">Điểm phát âm tốt: </strong>
                        <span className="text-text-secondary">{evaluation.correctParts.join('; ')}</span>
                      </div>
                    </div>
                  )}

                  {/* Main mistake */}
                  {evaluation.mainMistake && (
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-amber-600 dark:text-amber-400">Lỗi cần lưu ý ({evaluation.affectedSyllable}): </strong>
                        <span className="text-text-secondary">{evaluation.mainMistake}</span>
                      </div>
                    </div>
                  )}

                  {/* Mouth shape & tongue guidance */}
                  {evaluation.recommendation && (
                    <div className="p-3 bg-surface-secondary rounded-xl text-text-primary leading-relaxed">
                      <div className="flex items-center gap-1.5 font-bold text-primary mb-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Mẹo khẩu hình & luồng hơi (Sư phạm Hán ngữ):</span>
                      </div>
                      <p className="text-text-secondary">{evaluation.recommendation}</p>
                    </div>
                  )}

                  {/* Drill prompt */}
                  {evaluation.drillPrompt && (
                    <div className="p-2.5 bg-primary-soft/40 border border-primary-soft rounded-xl text-primary font-semibold flex items-center justify-between">
                      <span>Bài tập củng cố: {evaluation.drillPrompt}</span>
                      <button
                        onClick={() => audioManager.playText(selectedSentence.hanzi)}
                        className="text-2xs underline hover:text-primary-hover"
                      >
                        Nghe lại mẫu chuẩn
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Ready State */
              <div className="space-y-3 flex flex-col items-center">
                <button
                  onClick={startRecording}
                  className="w-20 h-20 rounded-full bg-secondary hover:bg-coral-hover text-white flex items-center justify-center shadow-md active:scale-95 transition-transform btn-motion"
                  title="Bấm để bắt đầu thu âm"
                >
                  <Mic className="w-8 h-8" />
                </button>
                <div>
                  <p className="text-sm font-bold text-text-primary">Bấm microphone để bắt đầu đọc</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Hệ thống sẽ thu âm và AI sẽ chấm điểm thanh mẫu, vận mẫu, thanh điệu tức thì
                  </p>
                </div>
              </div>
            )}

            {/* Error Message if Denied */}
            {errorMessage && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2 max-w-md text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Sentence Selection Drawer */}
        <div className="bg-surface rounded-2xl border border-border-subtle p-5 shadow-2xs space-y-4 card-motion">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Award className="w-4 h-4 text-secondary" />
            <span>Kho câu luyện nói HSK 1–6</span>
          </h3>

          {/* Level Filter Tabs */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedLevel(0)}
              className={`px-2.5 py-1 text-2xs font-bold rounded-lg transition-colors ${
                selectedLevel === 0 ? 'bg-primary text-white' : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
              }`}
            >
              Tất cả
            </button>
            {[1, 2, 3, 4, 5, 6].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-2 py-1 text-2xs font-bold rounded-lg transition-colors ${
                  selectedLevel === lvl ? 'bg-primary text-white' : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
                }`}
              >
                HSK {lvl}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo chữ Hán, Pinyin..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-secondary rounded-xl border border-border-subtle focus:outline-hidden focus:border-primary"
            />
          </div>

          {/* Sentence List */}
          <div className="space-y-2 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
            {availableSentences.slice(0, 40).map((s) => {
              const isSelected = selectedSentence.id === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    setSelectedSentence(s);
                    setAudioUrl(null);
                    setEvaluation(null);
                    setState('READY');
                  }}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-primary-soft/50 border-primary shadow-xs'
                      : 'bg-surface-secondary/40 border-border-subtle hover:bg-surface-secondary hover:border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xs font-bold px-1.5 py-0.5 rounded bg-surface text-text-muted border border-border-subtle">
                      HSK {s.level}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        audioManager.playText(s.hanzi);
                      }}
                      className="p-1 hover:text-primary transition-colors"
                      title="Nghe thử"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="font-hanzi font-bold text-text-primary truncate">{s.hanzi}</p>
                  <p className="text-2xs text-text-muted font-mono truncate">{s.pinyin}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
