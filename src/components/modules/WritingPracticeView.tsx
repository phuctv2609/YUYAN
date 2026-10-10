import React, { useState, useMemo } from 'react';
import {
  PenTool,
  Search,
  CheckCircle2,
  Volume2,
  Sparkles,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import { useToast } from '../ui/Toast.tsx';
import { HanziStrokeWriter } from '../hanzi/HanziStrokeWriter.tsx';
import { hanziRepository } from '../../data/repositories';
import { audioManager } from '../../services/audio/audioManager';
import { learningProgressService } from '../../services/progress/learningProgressService';

interface Character {
  hanzi: string;
  traditional?: string;
  pinyin: string;
  hanViet?: string;
  meaning: string;
  strokes: number;
  radical?: string;
  radicalNumber?: number;
  level: number;
  vocabularyIds?: string[];
}

const DEFAULT_CHARACTER: Character = {
  hanzi: '你',
  traditional: '你',
  pinyin: 'nǐ',
  hanViet: 'Nhĩ',
  meaning: 'bạn, anh, chị (đại từ nhân xưng ngôi thứ 2)',
  strokes: 7,
  radical: '亻',
  radicalNumber: 9,
  level: 1,
  vocabularyIds: ['你好', '你们'],
};

export const WritingPracticeView: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<number>(0); // 0 = all
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedChar, setSelectedChar] = useState<Character>(DEFAULT_CHARACTER);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const { showToast } = useToast();

  // Load characters dynamically from authoritative HSK repository
  const availableCharacters: Character[] = useMemo(() => {
    const rawList = hanziRepository.getAll();
    return rawList
      .filter((h) => {
        if (selectedLevel > 0 && !h.hskLevels.includes(selectedLevel)) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchChar = h.char.includes(q);
          const matchPinyin = h.pinyin.some((p) => p.toLowerCase().includes(q));
          const matchMeaning = h.meanings.some((m) => m.toLowerCase().includes(q));
          const matchHanViet = h.hanViet ? h.hanViet.toLowerCase().includes(q) : false;
          return matchChar || matchPinyin || matchMeaning || matchHanViet;
        }
        return true;
      })
      .map((h) => ({
        hanzi: h.char,
        traditional: h.traditional || h.char,
        pinyin: h.pinyin[0] || '',
        hanViet: h.hanViet,
        meaning: h.meanings[0] || 'Chữ Hán chuẩn hóa',
        strokes: h.strokeCount,
        radical: h.radical,
        radicalNumber: h.radicalNumber,
        level: h.hskLevels[0] || 1,
        vocabularyIds: h.vocabularyIds || [],
      }));
  }, [selectedLevel, searchQuery]);

  const handlePlayAudio = (char: Character) => {
    setIsPlayingAudio(true);
    audioManager.playText(char.hanzi, {
      id: `hanzi_${char.hanzi}`,
      entityType: 'vocabulary',
      pinyin: char.pinyin,
    });
    setTimeout(() => {
      setIsPlayingAudio(false);
    }, 1200);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface p-5 sm:p-6 rounded-3xl border border-border-subtle shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center font-bold shadow-xs">
            <PenTool className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                Luyện Viết Chữ Hán Chuẩn Nét
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                HSK 1–6
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Thực hành thứ tự nét bút chuẩn theo từ vựng giáo trình HSK với hoạt họa từng nét và kiểm tra tương tác.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary bg-surface-secondary px-3.5 py-2 rounded-2xl border border-border-subtle self-start sm:self-auto">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>Đồng bộ từ vựng HSK ({availableCharacters.length} chữ)</span>
        </div>
      </div>

      {/* Main Grid: Interactive Stroke Writer (Left 2 cols) + Character Selector (Right col) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Interactive Hanzi Writer & Character Details */}
        <div className="lg:col-span-7 bg-surface rounded-3xl border border-border-subtle p-5 sm:p-6 shadow-sm space-y-5">
          {/* Target Character Metadata Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-secondary/70 p-4 rounded-2xl border border-border-subtle">
            <div className="flex items-center gap-4">
              <span className="font-chinese text-4xl sm:text-5xl font-extrabold text-text-primary">
                {selectedChar.hanzi}
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary text-base sm:text-lg">
                    {selectedChar.pinyin}
                  </span>
                  <button
                    onClick={() => handlePlayAudio(selectedChar)}
                    title="Nghe phát âm chuẩn"
                    className={`p-1.5 rounded-xl transition-all ${
                      isPlayingAudio
                        ? 'bg-primary text-white scale-110 shadow-sm'
                        : 'bg-primary-soft text-primary hover:bg-primary hover:text-white'
                    }`}
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                  </button>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-white font-bold">
                    HSK {selectedChar.level}
                  </span>
                  {selectedChar.hanViet && (
                    <span className="text-[11px] text-text-muted">
                      Hán-Việt: <strong className="text-text-primary">{selectedChar.hanViet}</strong>
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-secondary font-medium">
                  {selectedChar.meaning}
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-border-subtle text-right">
              <div>
                <span className="text-[11px] text-text-muted">Số nét: </span>
                <strong className="text-sm font-extrabold text-text-primary">{selectedChar.strokes} nét</strong>
              </div>
              {selectedChar.radical && (
                <div className="text-[11px] text-text-muted mt-0.5">
                  Bộ thủ: <strong className="text-text-primary font-chinese">{selectedChar.radical}</strong>
                  {selectedChar.radicalNumber ? ` (#${selectedChar.radicalNumber})` : ''}
                </div>
              )}
            </div>
          </div>

          {/* Interactive Stroke Writer Component */}
          <div className="flex flex-col items-center py-6 px-4 bg-surface-secondary/30 rounded-2xl border border-border-subtle shadow-inner">
            <HanziStrokeWriter
              character={selectedChar.hanzi}
              size={280}
              onCompleteQuiz={(summary) => {
                void learningProgressService.markHanziMastered(selectedChar.hanzi);
                showToast(
                  `Tuyệt vời! Bạn đã hoàn thành chữ "${selectedChar.hanzi}" (${summary.totalMistakes} lỗi).`,
                  'success'
                );
              }}
            />
          </div>

          {/* Related HSK Words */}
          {selectedChar.vocabularyIds && selectedChar.vocabularyIds.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border-subtle">
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                <span>Từ vựng HSK chứa chữ &ldquo;{selectedChar.hanzi}&rdquo;:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedChar.vocabularyIds.map((word, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl bg-surface-secondary text-text-primary border border-border-subtle text-xs font-chinese font-semibold"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 5 Cols: Character Palette Selector */}
        <div className="lg:col-span-5 bg-surface rounded-3xl border border-border-subtle p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-text-primary">Kho Chữ Hán HSK</h2>
            </div>
            <span className="text-xs font-semibold text-text-muted">
              {availableCharacters.length} chữ
            </span>
          </div>

          {/* Level Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {[0, 1, 2, 3, 4, 5, 6].map((lvl) => (
              <button
                key={lvl}
                data-testid={`writing-lvl-tab-${lvl}`}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  selectedLevel === lvl
                    ? 'bg-primary text-white shadow-xs'
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
              data-testid="writing-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm chữ Hán, Pinyin hoặc nghĩa tiếng Việt..."
              className="w-full pl-9 pr-3 py-2 rounded-2xl border border-border-subtle bg-surface-secondary/50 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-muted hover:text-text-primary"
              >
                Xóa
              </button>
            )}
          </div>

          {/* Character Cards List */}
          <div className="grid grid-cols-2 gap-2 max-h-[500px] overflow-y-auto scrollbar-thin pr-1">
            {availableCharacters.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-text-muted space-y-1">
                <div>Không tìm thấy chữ Hán phù hợp.</div>
                <div className="text-[11px]">Hãy thử chọn cấp độ khác hoặc từ khóa khác.</div>
              </div>
            ) : (
              availableCharacters.map((c) => {
                const isSelected = selectedChar.hanzi === c.hanzi;
                return (
                  <button
                    key={c.hanzi}
                    data-testid={`char-card-${c.hanzi}`}
                    onClick={() => setSelectedChar(c)}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-start justify-between gap-1 group ${
                      isSelected
                        ? 'bg-primary/10 border-primary text-primary shadow-xs'
                        : 'bg-surface hover:bg-surface-secondary border-border-subtle text-text-primary'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-chinese text-2xl font-extrabold block">
                          {c.hanzi}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-surface-secondary text-text-muted font-bold border border-border-subtle">
                          HSK {c.level}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-primary block truncate">
                        {c.pinyin}
                      </span>
                      <span className="text-[11px] text-text-muted truncate block max-w-[130px]">
                        {c.meaning}
                      </span>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-1" />}
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

export default WritingPracticeView;
