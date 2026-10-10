import React, { useState } from 'react';
import { Volume2, Music, Sparkles, CheckCircle2, RotateCcw, HelpCircle } from 'lucide-react';
import { useToast } from '../ui/Toast.tsx';
import { audioManager } from '../../services/audio/index.ts';
import { pinyinRepository } from '../../data/repositories/pinyinRepository.ts';
import { PinyinItem, PinyinMouthCategory } from '../../data/models/pinyin.ts';

type PinyinTab = 'simple_finals' | 'compound_finals' | 'nasal_finals' | 'retroflex' | 'mouth_categories' | 'initials' | 'tones' | 'test';

export const PinyinPracticeView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PinyinTab>('simple_finals');
  const [selectedItem, setSelectedItem] = useState<PinyinItem>(() => pinyinRepository.getBySymbol('e') || pinyinRepository.getSimpleFinals()[0]);
  const [activeMouthCat, setActiveMouthCat] = useState<PinyinMouthCategory>('open');
  const [testAnswers, setTestAnswers] = useState<Record<string, string>>({});
  const [testSubmitted, setTestSubmitted] = useState<boolean>(false);
  const { showToast } = useToast();

  const simpleFinals = pinyinRepository.getSimpleFinals();
  const compoundFinals = pinyinRepository.getCompoundFinals();
  const nasalFront = pinyinRepository.getNasalFinals('front');
  const nasalBack = pinyinRepository.getNasalFinals('back');
  const retroflexAndSpecial = pinyinRepository.getRetroflexAndSpecial();
  const initials = pinyinRepository.getInitials();

  // Strict rule: playing a pinyin item plays the symbol, NEVER an example word!
  const handlePlayPinyinTarget = async (item: PinyinItem) => {
    try {
      await audioManager.playTarget(
        {
          type: item.type === 'initial' ? 'initial' : 'final',
          text: item.audioTarget,
          pinyin: item.symbol,
          itemId: item.id,
        },
        { rate: 0.9 }
      );
      showToast(`Đang phát âm: ${item.symbol}`, 'info');
    } catch (err: any) {
      showToast(err?.message || 'Không thể phát âm thanh', 'warning');
    }
  };

  // Distinct supplemental player for example words
  const handlePlayExampleWord = async (hanzi: string, pinyin: string) => {
    try {
      await audioManager.playTarget(
        {
          type: 'word',
          text: hanzi,
          pinyin,
        },
        { rate: 0.9 }
      );
      showToast(`Đang phát âm từ ví dụ: ${hanzi} (${pinyin})`, 'info');
    } catch (err: any) {
      showToast(err?.message || 'Không thể phát âm thanh', 'warning');
    }
  };

  const tones = [
    { tone: 'Thanh 1 (Âm Bình / 阴平)', mark: 'ā', contour: '5-5', desc: 'Cao, bằng phẳng, kéo dài đều, không hạ giọng' },
    { tone: 'Thanh 2 (Dương Bình / 阳平)', mark: 'á', contour: '3-5', desc: 'Đi từ vừa lên cao, tương tự dấu sắc tiếng Việt' },
    { tone: 'Thanh 3 (Thượng Thanh / 上声)', mark: 'ǎ', contour: '2-1-4', desc: 'Xuống thấp rồi hơi đưa lên cao, tương tự dấu hỏi kéo dài' },
    { tone: 'Thanh 4 (Khứ Thanh / 去声)', mark: 'à', contour: '5-1', desc: 'Rơi nhanh từ cao nhất xuống thấp nhất, dứt khoát' },
  ];

  const mouthCategoryDefinitions: { id: PinyinMouthCategory; nameVi: string; nameZh: string; desc: string; symbols: string[] }[] = [
    {
      id: 'open',
      nameVi: 'Âm mở miệng',
      nameZh: '开口呼 (Kāikǒuhū)',
      desc: 'Không có nguyên âm i, u, ü đứng đầu. Khẩu hình mở tự nhiên hoặc dẹt ngang.',
      symbols: ['a', 'o', 'e', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng'],
    },
    {
      id: 'even_teeth',
      nameVi: 'Âm đều răng',
      nameZh: '齐齿呼 (Qíchǐhū)',
      desc: 'Bắt đầu bằng nguyên âm "i". Răng trên và răng dưới khép gần chạm nhau, khóe miệng kéo dẹt.',
      symbols: ['i', 'ia', 'ie', 'iao', 'iou', 'ian', 'in', 'iang', 'ing'],
    },
    {
      id: 'closed',
      nameVi: 'Âm ngậm miệng',
      nameZh: '合口呼 (Hékǒuhū)',
      desc: 'Bắt đầu bằng nguyên âm "u". Môi chu tròn nhỏ, khóe môi khép lại.',
      symbols: ['u', 'ua', 'uo', 'uai', 'uei', 'uan', 'uen', 'uang', 'ueng', 'ong'],
    },
    {
      id: 'rounded',
      nameVi: 'Âm chụm miệng',
      nameZh: '撮口呼 (Zuǒkǒuhū)',
      desc: 'Bắt đầu bằng nguyên âm "ü". Môi chu tròn chụm lại như huýt sáo suốt quá trình phát âm.',
      symbols: ['ü', 'üe', 'üan', 'ün', 'iong'],
    },
  ];

  // Comprehensive Pinyin Drills / Tests
  const pinyinQuestions = [
    {
      id: 'q1',
      question: 'Khi phát âm vận mẫu đơn "e", khẩu hình và vị trí lưỡi như thế nào?',
      options: [
        'Miệng mở vừa, khóe môi hơi kéo sang hai bên, gốc lưỡi nâng cao về phía ngạc mềm',
        'Chu môi thật tròn như huýt sáo',
        'Răng trên cắn chặt môi dưới',
        'Đầu lưỡi uốn ngược chạm ngạc cứng',
      ],
      correct: 'Miệng mở vừa, khóe môi hơi kéo sang hai bên, gốc lưỡi nâng cao về phía ngạc mềm',
      explanation: 'Vận mẫu đơn "e" [ɤ] phát âm miệng hơi dẹt, không chu môi, gốc lưỡi nâng cao về phía ngạc mềm.',
    },
    {
      id: 'q2',
      question: 'Những vận mẫu nào sau đây thuộc nhóm "Âm chụm miệng (撮口呼)"?',
      options: [
        'ü, üe, üan, ün, iong',
        'a, o, e, ai, ei',
        'i, ia, ie, iao',
        'u, ua, uo, uai',
      ],
      correct: 'ü, üe, üan, ün, iong',
      explanation: 'Âm chụm miệng (撮口呼) là các vận mẫu bắt đầu bằng hoặc chứa âm "ü", môi chu tròn chụm lại.',
    },
    {
      id: 'q3',
      question: 'Âm "er" và "ng" trong hệ thống ngữ âm tiếng Trung có đặc điểm gì?',
      options: [
        '"er" là âm cong lưỡi đặc biệt, còn "ng" là đuôi âm mũi sau trong ang, eng, ing, ong',
        'Cả hai đều là thanh mẫu đầu câu bình thường',
        '"er" là vận mẫu đơn, "ng" là nguyên âm kép',
        'Không được dùng trong tiếng phổ thông Bắc Kinh',
      ],
      correct: '"er" là âm cong lưỡi đặc biệt, còn "ng" là đuôi âm mũi sau trong ang, eng, ing, ong',
      explanation: '"er" là âm tiết uốn lưỡi (儿化), còn "ng" là đuôi khép mũi sau của 4 vận mẫu mũi ang, eng, ing, ong.',
    },
    {
      id: 'q4',
      question: 'Quy tắc biến điệu khi 2 âm tiết thanh 3 đi liền nhau là gì?',
      options: [
        'Âm thứ nhất đọc thành thanh 2 (3 + 3 ➔ 2 + 3)',
        'Cả hai đọc thành thanh 1',
        'Âm thứ hai đọc thành thanh 4',
        'Giữ nguyên không thay đổi',
      ],
      correct: 'Âm thứ nhất đọc thành thanh 2 (3 + 3 ➔ 2 + 3)',
      explanation: 'Ví dụ: 你好 (nǐ hǎo) đọc biến điệu thành [ní hǎo].',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-surface rounded-3xl border border-border-subtle p-6 sm:p-8 shadow-2xs space-y-3 card-motion light-beam-shimmer">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center font-bold shadow-2xs">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-soft text-primary text-xs font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chương trình Ngữ âm Pinyin Chuẩn HSK 1–6</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
              Bảng Ngữ âm Pinyin Toàn diện & 4 Thanh điệu
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
              Tách bạch chuẩn xác âm mục tiêu và từ ví dụ, khẩu hình, vị trí lưỡi và 4 phân loại mở miệng
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-divider-line">
          {[
            { id: 'simple_finals', label: 'Vận mẫu đơn (6 âm)' },
            { id: 'compound_finals', label: 'Vận mẫu phức (13 âm)' },
            { id: 'nasal_finals', label: 'Vận mẫu mũi (16 âm)' },
            { id: 'retroflex', label: 'Âm cong lưỡi (er) & "ng"' },
            { id: 'mouth_categories', label: '4 Nhóm mở miệng' },
            { id: 'initials', label: 'Thanh mẫu (21 âm)' },
            { id: 'tones', label: '4 Thanh điệu & Biến điệu' },
            { id: 'test', label: 'Kiểm tra nhận diện' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as PinyinTab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all btn-motion ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-2xs'
                  : 'bg-surface-secondary text-text-secondary hover:text-text-primary hover:bg-border-subtle'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'simple_finals' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-primary-soft/50 border border-primary/20 text-xs text-text-primary space-y-1">
            <span className="font-bold text-primary block text-sm">Vận mẫu đơn (单韵母)</span>
            <p>
              "Vận mẫu đơn do 1 nguyên âm cấu thành được gọi là vận mẫu đơn. Cách phát âm: Vị trí lưỡi và khẩu hình giữ nguyên không thay đổi trong suốt quá trình phiên âm."
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Detail Preview Card */}
            <div className="bg-surface rounded-2xl border border-border-subtle p-6 shadow-2xs space-y-4 card-motion">
              <span className="text-xs font-bold text-primary px-2.5 py-1 rounded bg-primary-soft">
                Đang chọn: {selectedItem.category}
              </span>

              <div className="text-center py-4">
                <span className="font-sans text-6xl font-black text-text-primary block">{selectedItem.symbol}</span>
                <p className="text-xs text-text-muted mt-2">Ký hiệu IPA: {selectedItem.ipa}</p>
                {selectedItem.mouthCategoryNameVi && (
                  <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-semibold">
                    {selectedItem.mouthCategoryNameVi}
                  </span>
                )}
              </div>

              {/* Strict Audio Button: plays ONLY target sound */}
              <button
                onClick={() => handlePlayPinyinTarget(selectedItem)}
                className="w-full py-3 bg-primary text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 hover:bg-primary-hover btn-motion transition-colors"
                title={`Phát âm chuẩn âm: ${selectedItem.symbol}`}
              >
                <Volume2 className="w-4 h-4" />
                <span>Nghe phát âm chuẩn: "{selectedItem.symbol}"</span>
              </button>

              <div className="p-4 rounded-xl bg-surface-secondary border border-border-subtle space-y-2 text-xs">
                <p className="font-bold text-text-primary">Hướng dẫn phát âm chuẩn sư phạm:</p>
                <p className="text-text-secondary leading-relaxed">{selectedItem.pronunciationGuide}</p>
                <div className="pt-2 border-t border-divider-line space-y-1 text-text-muted">
                  <p><strong className="text-text-primary">Khẩu hình:</strong> {selectedItem.mouthGuide}</p>
                  <p><strong className="text-text-primary">Vị trí lưỡi:</strong> {selectedItem.tongueGuide}</p>
                </div>
              </div>

              {/* Supplemental Example Words: clearly separated */}
              {selectedItem.exampleWords && selectedItem.exampleWords.length > 0 && (
                <div className="p-4 rounded-xl bg-surface-secondary/70 border border-border-subtle space-y-2 text-xs">
                  <span className="font-bold text-text-muted text-[11px] uppercase tracking-wider block">
                    Từ ví dụ minh họa (Tham khảo thêm):
                  </span>
                  <div className="space-y-2">
                    {selectedItem.exampleWords.map((ex, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border-subtle">
                        <div>
                          <span className="font-hanzi font-bold text-base text-primary mr-2">{ex.hanzi}</span>
                          <span className="font-sans text-xs text-deep-blue font-semibold mr-2">{ex.pinyin}</span>
                          <span className="text-[11px] text-text-muted">({ex.meaning})</span>
                        </div>
                        <button
                          onClick={() => handlePlayExampleWord(ex.hanzi, ex.pinyin)}
                          className="p-1.5 rounded-lg bg-surface-secondary hover:bg-primary hover:text-white text-primary transition-colors"
                          title={`Nghe từ ví dụ: ${ex.hanzi}`}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Grid of Simple Finals */}
            <div className="lg:col-span-2 bg-surface rounded-2xl border border-border-subtle p-6 shadow-2xs space-y-4 card-motion">
              <h2 className="text-sm font-bold text-text-primary">6 Vận mẫu đơn (Bấm để chọn và nghe phát âm độc lập)</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {simpleFinals.map((item) => {
                  const isSelected = selectedItem.symbol === item.symbol;
                  return (
                    <div
                      key={item.symbol}
                      onClick={() => setSelectedItem(item)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-primary-soft border-primary text-primary shadow-xs ring-2 ring-primary/20 scale-102'
                          : 'bg-surface hover:bg-surface-secondary border-border-subtle text-text-primary'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-sans text-3xl font-black">{item.symbol}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(item);
                            handlePlayPinyinTarget(item);
                          }}
                          className="p-2 rounded-xl bg-primary text-white hover:bg-primary-hover shadow-2xs btn-motion"
                          title={`Nghe âm: ${item.symbol}`}
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-[11px] text-text-muted block">{item.ipa}</span>
                      <span className="text-[10px] text-secondary font-medium block mt-1">{item.mouthCategoryNameVi}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Compound Finals */}
      {activeTab === 'compound_finals' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-primary-soft/50 border border-primary/20 text-xs text-text-primary space-y-1">
            <span className="font-bold text-primary block text-sm">13 Vận mẫu phức (复韵母)</span>
            <p>
              Gồm 2 hoặc 3 nguyên âm kết hợp với nhau. Khi phát âm, khẩu hình trượt mượt mà từ nguyên âm đầu sang nguyên âm sau.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {compoundFinals.map((item) => (
              <div
                key={item.symbol}
                className="bg-surface rounded-2xl border border-border-subtle p-5 shadow-2xs space-y-3 card-motion flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-sans text-3xl font-black text-text-primary">{item.symbol}</span>
                      <span className="text-xs text-text-muted ml-2">{item.ipa}</span>
                    </div>
                    <button
                      onClick={() => handlePlayPinyinTarget(item)}
                      className="p-2 rounded-xl bg-primary text-white hover:bg-primary-hover shadow-2xs btn-motion"
                      title={`Nghe phát âm chuẩn: ${item.symbol}`}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-[11px] text-secondary font-semibold block mt-1">{item.mouthCategoryNameVi}</span>
                  <p className="text-xs text-text-secondary mt-2 leading-relaxed">{item.pronunciationGuide}</p>
                </div>

                {item.exampleWords && item.exampleWords.length > 0 && (
                  <div className="pt-3 border-t border-divider-line space-y-1.5">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Ví dụ từ:</span>
                    <div className="flex flex-wrap gap-2">
                      {item.exampleWords.map((ex, idx) => (
                        <button
                          key={idx}
                          onClick={() => handlePlayExampleWord(ex.hanzi, ex.pinyin)}
                          className="px-2.5 py-1 rounded-lg bg-surface-secondary hover:bg-primary-soft text-text-primary hover:text-primary text-xs font-semibold border border-border-subtle flex items-center gap-1 transition-colors"
                        >
                          <span className="font-hanzi font-bold">{ex.hanzi}</span>
                          <span className="text-[11px] text-deep-blue">({ex.pinyin})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Nasal Finals */}
      {activeTab === 'nasal_finals' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-primary-soft/50 border border-primary/20 text-xs text-text-primary space-y-1">
            <span className="font-bold text-primary block text-sm">16 Vận mẫu mũi (鼻韵母)</span>
            <p>
              Gồm 8 vận mẫu mũi trước (kết thúc bằng âm ngậm đầu lưỡi "-n") và 8 vận mẫu mũi sau (kết thúc bằng âm ngạc mềm "-ng").
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-bold text-text-primary">8 Vận mẫu mũi trước (-n)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {nasalFront.map((item) => (
                <div key={item.symbol} className="bg-surface rounded-2xl border border-border-subtle p-4 shadow-2xs space-y-2 card-motion">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-2xl font-black text-text-primary">{item.symbol}</span>
                    <button
                      onClick={() => handlePlayPinyinTarget(item)}
                      className="p-1.5 rounded-lg bg-primary text-white hover:bg-primary-hover shadow-2xs"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-[11px] text-text-muted block">{item.ipa}</span>
                  <p className="text-xs text-text-secondary leading-snug">{item.pronunciationGuide}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-divider-line">
            <h2 className="text-sm font-bold text-text-primary">8 Vận mẫu mũi sau (-ng)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {nasalBack.map((item) => (
                <div key={item.symbol} className="bg-surface rounded-2xl border border-border-subtle p-4 shadow-2xs space-y-2 card-motion">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-2xl font-black text-text-primary">{item.symbol}</span>
                    <button
                      onClick={() => handlePlayPinyinTarget(item)}
                      className="p-1.5 rounded-lg bg-primary text-white hover:bg-primary-hover shadow-2xs"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-[11px] text-text-muted block">{item.ipa}</span>
                  <p className="text-xs text-text-secondary leading-snug">{item.pronunciationGuide}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Retroflex & Special */}
      {activeTab === 'retroflex' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {retroflexAndSpecial.map((item) => (
              <div key={item.id} className="bg-surface rounded-3xl border border-border-subtle p-6 sm:p-8 shadow-2xs space-y-4 card-motion">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-sans text-4xl font-black text-primary">{item.symbol}</span>
                    <span className="text-xs text-text-muted ml-2">{item.ipa}</span>
                  </div>
                  <button
                    onClick={() => handlePlayPinyinTarget(item)}
                    className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover shadow-xs btn-motion"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-base font-bold text-text-primary">{item.category}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{item.pronunciationGuide}</p>

                <div className="p-4 rounded-xl bg-surface-secondary border border-border-subtle space-y-1.5 text-xs">
                  <p><strong className="text-text-primary">Mẹo khẩu hình:</strong> {item.mouthGuide}</p>
                  <p><strong className="text-text-primary">Vị trí lưỡi:</strong> {item.tongueGuide}</p>
                  {item.notes && <p className="pt-1 text-secondary font-medium">{item.notes}</p>}
                </div>

                {item.exampleWords && (
                  <div className="pt-2 flex flex-wrap gap-2">
                    {item.exampleWords.map((ex, idx) => (
                      <button
                        key={idx}
                        onClick={() => handlePlayExampleWord(ex.hanzi, ex.pinyin)}
                        className="px-3 py-1.5 rounded-xl bg-surface-secondary hover:bg-primary-soft text-text-primary hover:text-primary text-xs font-semibold border border-border-subtle flex items-center gap-1.5 transition-colors"
                      >
                        <span className="font-hanzi font-bold">{ex.hanzi}</span>
                        <span className="text-deep-blue">({ex.pinyin})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Four Mouth Classifications */}
      {activeTab === 'mouth_categories' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {mouthCategoryDefinitions.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveMouthCat(cat.id)}
                className={`p-4 rounded-2xl border text-left transition-all btn-motion ${
                  activeMouthCat === cat.id
                    ? 'bg-primary-soft border-primary text-primary shadow-2xs font-bold'
                    : 'bg-surface hover:bg-surface-secondary border-border-subtle text-text-primary'
                }`}
              >
                <span className="text-sm font-bold block">{cat.nameVi}</span>
                <span className="text-xs text-text-muted block mt-0.5">{cat.nameZh}</span>
                <span className="text-[11px] text-secondary font-semibold block mt-2">
                  {cat.symbols.length} vận mẫu
                </span>
              </button>
            ))}
          </div>

          {/* Active Mouth Category View */}
          {(() => {
            const currentCat = mouthCategoryDefinitions.find((c) => c.id === activeMouthCat)!;
            return (
              <div className="bg-surface rounded-2xl border border-border-subtle p-6 shadow-2xs space-y-4 card-motion">
                <div>
                  <h3 className="text-base font-bold text-text-primary">{currentCat.nameVi} - {currentCat.nameZh}</h3>
                  <p className="text-xs text-text-secondary mt-1">{currentCat.desc}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-2">
                  {currentCat.symbols.map((sym) => {
                    const item = pinyinRepository.getBySymbol(sym);
                    return (
                      <button
                        key={sym}
                        onClick={() => {
                          if (item) handlePlayPinyinTarget(item);
                          else audioManager.playTarget({ type: 'final', text: sym });
                        }}
                        className="p-3 rounded-xl bg-surface-secondary hover:bg-primary-soft text-text-primary hover:text-primary border border-border-subtle flex items-center justify-between transition-colors group"
                      >
                        <span className="font-sans text-xl font-bold">{sym}</span>
                        <Volume2 className="w-3.5 h-3.5 text-text-muted group-hover:text-primary" />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Tab: Initials */}
      {activeTab === 'initials' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2.5">
            {initials.map((item) => (
              <div
                key={item.symbol}
                className="p-3.5 bg-surface rounded-2xl border border-border-subtle shadow-2xs space-y-2 card-motion text-center flex flex-col justify-between"
              >
                <div>
                  <span className="font-sans text-3xl font-black text-text-primary block">{item.symbol}</span>
                  <span className="text-[10px] text-text-muted block">{item.ipa}</span>
                </div>
                <button
                  onClick={() => handlePlayPinyinTarget(item)}
                  className="w-full py-1.5 bg-primary text-white rounded-xl text-xs font-bold shadow-2xs flex items-center justify-center gap-1 hover:bg-primary-hover btn-motion"
                  title={`Phát âm: ${item.symbol}`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{item.symbol}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Tones & Sandhi */}
      {activeTab === 'tones' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tones.map((t, idx) => (
              <div
                key={idx}
                className="bg-surface rounded-2xl border border-border-subtle p-5 shadow-2xs space-y-3 card-motion flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-secondary px-2.5 py-0.5 rounded bg-coral-soft">
                      {t.contour}
                    </span>
                    <span className="font-sans text-3xl font-black text-primary">{t.mark}</span>
                  </div>
                  <h3 className="text-sm font-bold text-text-primary">{t.tone}</h3>
                  <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Interactive Test */}
      {activeTab === 'test' && (
        <div className="bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-2xs space-y-6 card-motion">
          <div className="flex items-center justify-between pb-3 border-b border-divider-line">
            <div>
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                <span>Kiểm tra nhận diện & quy tắc phát âm Pinyin</span>
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Đảm bảo phân biệt chính xác âm mục tiêu và nắm vững lý thuyết ngữ âm
              </p>
            </div>
            {testSubmitted && (
              <div className="px-3 py-1 rounded-full text-xs font-bold bg-primary-soft text-primary">
                Điểm: {pinyinQuestions.filter((q) => testAnswers[q.id] === q.correct).length} / {pinyinQuestions.length}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {pinyinQuestions.map((q, qIdx) => {
              const selected = testAnswers[q.id];
              const isCorrect = selected === q.correct;
              return (
                <div key={q.id} className="p-5 rounded-2xl bg-surface-secondary border border-border-subtle space-y-3">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-primary">Câu hỏi {qIdx + 1}</span>
                    <p className="text-sm font-semibold text-text-primary">{q.question}</p>
                  </div>

                  <div className="space-y-2 pt-1">
                    {q.options.map((opt) => {
                      const isChosen = selected === opt;
                      let btnStyle = 'bg-surface hover:bg-border-subtle border-border-subtle text-text-primary';
                      if (testSubmitted) {
                        if (opt === q.correct) {
                          btnStyle = 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold';
                        } else if (isChosen && !isCorrect) {
                          btnStyle = 'bg-red-500/15 border-red-500 text-red-700 dark:text-red-400';
                        }
                      } else if (isChosen) {
                        btnStyle = 'bg-primary-soft border-primary text-primary font-bold shadow-2xs';
                      }

                      return (
                        <button
                          key={opt}
                          disabled={testSubmitted}
                          onClick={() => setTestAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                          className={`w-full p-3 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {testSubmitted && opt === q.correct && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {testSubmitted && (
                    <div className="p-3 rounded-xl bg-surface border border-border-subtle text-xs text-text-secondary leading-relaxed">
                      <span className="font-bold text-text-primary">Giải thích: </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-divider-line">
            {testSubmitted ? (
              <button
                onClick={() => {
                  setTestAnswers({});
                  setTestSubmitted(false);
                }}
                className="px-4 py-2 bg-surface-secondary hover:bg-border-subtle text-text-primary rounded-xl text-xs font-bold flex items-center gap-2 btn-motion transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Làm lại bài kiểm tra</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (Object.keys(testAnswers).length < pinyinQuestions.length) {
                    showToast('Vui lòng chọn đáp án cho tất cả câu hỏi', 'warning');
                    return;
                  }
                  setTestSubmitted(true);
                  showToast('Đã nộp bài kiểm tra thành công!', 'success');
                }}
                className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-xs hover:bg-primary-hover btn-motion transition-colors"
              >
                Nộp bài & Xem kết quả
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
