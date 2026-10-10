import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Volume2, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { useToast } from '../ui/Toast.tsx';
import { audioManager } from '../../services/audio/index.ts';
import { lessonRepository } from '../../data/repositories';

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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
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
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const startRecording = async () => {
    setState('PERMISSION');
    setErrorMessage(null);
    setAudioUrl(null);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt của bạn chưa hỗ trợ ghi âm trực tiếp qua Web Audio');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setState('LISTENING');
      setDurationSeconds(0);

      // Start Duration Timer
      const startTime = Date.now();
      timerRef.current = window.setInterval(() => {
        setDurationSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 500);

      // Setup AudioContext & Analyser for real volume visualization
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateMeter = () => {
          if (analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setVolumeLevel(Math.min(100, Math.round((avg / 128) * 100)));
            animationFrameRef.current = requestAnimationFrame(updateMeter);
          }
        };
        updateMeter();
      } catch {
        // Visualizer fallback
      }

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Stop audio tracks
        stream.getTracks().forEach((track) => track.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        setVolumeLevel(0);

        setState('PROCESSING');

        setTimeout(() => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          setState('RESULT');
          showToast('Đã thu âm xong câu luyện nói!', 'success');
        }, 600);
      };

      mediaRecorder.start();
    } catch (err: unknown) {
      console.warn('Microphone error:', err);
      setState('ERROR');
      const msg = err instanceof Error ? err.message : 'Không thể kết nối microphone';
      setErrorMessage(
        msg.includes('Permission denied') || msg.includes('NotAllowedError')
          ? 'Quyền truy cập Microphone bị từ chối. Vui lòng cấp quyền trong cài đặt trình duyệt để tiếp tục luyện nói.'
          : `Không thể kết nối microphone: ${msg}`
      );
      showToast('Chưa thể mở microphone trên thiết bị', 'warning');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
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
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Luyện phát âm & Ghi âm bản xứ</h1>
            <p className="text-xs text-text-secondary mt-0.5">
              Tích hợp ghi âm thời gian thực với phân tích âm lượng và phát lại trung thực
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
                <span>Nghe mẫu</span>
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
                    title="Dừng ghi âm"
                  >
                    <Square className="w-7 h-7 fill-white" />
                  </button>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-bold text-secondary animate-pulse">
                    Đang lắng nghe ({durationSeconds}s)...
                  </p>
                  <p className="text-xs text-text-muted">Nói to rõ câu tiếng Trung ở trên</p>
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
                <p className="text-xs font-semibold text-text-secondary">Đang trích xuất và xử lý âm thanh...</p>
              </div>
            ) : state === 'RESULT' ? (
              /* Recorded Result & Playback */
              <div className="w-full space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-status-success/20 text-status-success flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-text-primary">Đã thu âm xong ({durationSeconds} giây)</p>
                    <p className="text-xs text-text-muted">Đã ghi âm — chưa có hệ thống chấm phát âm tự động. Bạn có thể nghe lại bản thu âm của mình.</p>
                  </div>
                </div>

                {/* Playback Audio Controls */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handleTogglePlayRecorded}
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-primary-hover flex items-center gap-2 btn-motion"
                  >
                    {isPlayingRecorded ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                    <span>{isPlayingRecorded ? 'Tạm dừng' : 'Nghe lại giọng bạn'}</span>
                  </button>
                  <button
                    onClick={startRecording}
                    className="px-4 py-2 bg-surface text-text-secondary hover:text-text-primary text-xs font-semibold rounded-xl border border-border-subtle flex items-center gap-2 btn-motion"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Thu âm lại</span>
                  </button>
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
                  <p className="text-xs text-text-muted mt-0.5">Hệ thống sẽ thu âm và lưu lại bản phát âm của bạn</p>
                </div>
              </div>
            )}

            {/* Error Message if Denied */}
            {errorMessage && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2 max-w-md text-left">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Sentence Selector */}
        <div className="bg-surface rounded-2xl border border-border-subtle p-4 sm:p-5 shadow-2xs space-y-3 card-motion">
          <div className="flex items-center justify-between pb-2 border-b border-divider-line">
            <h2 className="text-sm font-bold text-text-primary">Kho Câu Luyện Phát Âm</h2>
            <span className="text-xs text-text-muted">{availableSentences.length} câu</span>
          </div>

          {/* Level Filter Pills */}
          <div className="flex flex-wrap gap-1.5 pb-1">
            {[0, 1, 2, 3, 4, 5, 6].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all btn-motion ${
                  selectedLevel === lvl
                    ? 'bg-primary text-white shadow-2xs'
                    : 'bg-surface-secondary text-text-secondary hover:text-text-primary border border-border-subtle'
                }`}
              >
                {lvl === 0 ? 'Tất cả' : `HSK ${lvl}`}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm câu theo chữ Hán, Pinyin hoặc nghĩa..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border-subtle bg-surface-secondary/50 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <div className="space-y-2 max-h-[440px] overflow-y-auto custom-scrollbar pr-1">
            {availableSentences.length === 0 ? (
              <div className="py-8 text-center text-xs text-text-muted">
                Không tìm thấy câu phù hợp. Thử đổi bộ lọc hoặc từ khóa.
              </div>
            ) : (
              availableSentences.map((s) => {
                const isSelected = selectedSentence.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedSentence(s);
                      setState('READY');
                      setAudioUrl(null);
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all btn-motion ${
                      isSelected
                        ? 'bg-primary-soft border-primary text-primary shadow-2xs'
                        : 'bg-surface hover:bg-surface-secondary border-border-subtle text-text-primary'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-secondary text-text-muted">
                          HSK {s.level}
                        </span>
                        {s.lessonTitle && (
                          <span className="text-[10px] text-text-muted truncate max-w-[120px]">
                            {s.lessonTitle}
                          </span>
                        )}
                      </div>
                      {isSelected && <span className="text-[10px] font-bold text-primary">Đang chọn</span>}
                    </div>
                    <p className="font-hanzi text-sm font-bold">{s.hanzi}</p>
                    <p className="text-xs font-semibold text-primary/80 mt-0.5">{s.pinyin}</p>
                    <p className="text-xs text-text-muted truncate mt-0.5">{s.vietnamese}</p>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
