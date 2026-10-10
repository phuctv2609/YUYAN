import React, { useState } from 'react';
import {
  GraduationCap,
  Volume2,
  BookOpen,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  HelpCircle,
} from 'lucide-react';
import { useToast } from '../ui/Toast.tsx';
import { audioManager } from '../../services/audio/index.ts';

type BeginnerTab = 'pinyin' | 'tones' | 'conversation' | 'quiz';

interface InitialsItem {
  pinyin: string;
  ipa: string;
  exampleHanzi: string;
  examplePinyin: string;
  meaning: string;
  tip: string;
}

const INITIALS: InitialsItem[] = [
  { pinyin: 'b', ipa: '[p]', exampleHanzi: '爸爸', examplePinyin: 'bàba', meaning: 'Bố', tip: 'Âm 2 môi, không bật hơi, giống "p" nhẹ tiếng Việt' },
  { pinyin: 'p', ipa: '[pʰ]', exampleHanzi: '朋友', examplePinyin: 'péngyou', meaning: 'Bạn bè', tip: 'Âm 2 môi, bật hơi mạnh luồng gió dứt khoát' },
  { pinyin: 'm', ipa: '[m]', exampleHanzi: '妈妈', examplePinyin: 'māma', meaning: 'Mẹ', tip: 'Âm mũi 2 môi, phát âm như "m" tiếng Việt' },
  { pinyin: 'f', ipa: '[f]', exampleHanzi: '飞机', examplePinyin: 'fēijī', meaning: 'Máy bay', tip: 'Răng trên chạm môi dưới, phát âm như "ph" tiếng Việt' },
  { pinyin: 'd', ipa: '[t]', exampleHanzi: '弟弟', examplePinyin: 'dìdi', meaning: 'Em trai', tip: 'Đầu lưỡi chạm răng trên, không bật hơi, giống "t" tiếng Việt' },
  { pinyin: 't', ipa: '[tʰ]', exampleHanzi: '天气', examplePinyin: 'tiānqì', meaning: 'Thời tiết', tip: 'Bật hơi mạnh, giống "th" tiếng Việt' },
  { pinyin: 'n', ipa: '[n]', exampleHanzi: '你好', examplePinyin: 'nǐhǎo', meaning: 'Xin chào', tip: 'Âm mũi đầu lưỡi, phát âm như "n" tiếng Việt' },
  { pinyin: 'l', ipa: '[l]', exampleHanzi: '老师', examplePinyin: 'lǎoshī', meaning: 'Thầy/Cô giáo', tip: 'Đầu lưỡi uốn nhẹ, phát âm như "l" tiếng Việt' },
  { pinyin: 'g', ipa: '[k]', exampleHanzi: '哥哥', examplePinyin: 'gēge', meaning: 'Anh trai', tip: 'Gốc lưỡi chạm ngạc mềm, không bật hơi, giống "c/k" tiếng Việt' },
  { pinyin: 'k', ipa: '[kʰ]', exampleHanzi: '看书', examplePinyin: 'kànshū', meaning: 'Đọc sách', tip: 'Gốc lưỡi bật hơi mạnh, giống "kh" mạnh trong tiếng Việt' },
  { pinyin: 'h', ipa: '[x]', exampleHanzi: '喝水', examplePinyin: 'hēshuǐ', meaning: 'Uống nước', tip: 'Hơi ma sát nhẹ ở cuống họng, giữa "h" và "kh"' },
  { pinyin: 'j', ipa: '[tɕ]', exampleHanzi: '今天', examplePinyin: 'jīntiān', meaning: 'Hôm nay', tip: 'Mặt lưỡi áp ngạc cứng, không bật hơi, giống "ch" nhẹ' },
  { pinyin: 'q', ipa: '[tɕʰ]', exampleHanzi: '七', examplePinyin: 'qī', meaning: 'Số 7', tip: 'Mặt lưỡi ép sát rồi bật hơi luồng gió mạnh' },
  { pinyin: 'x', ipa: '[ɕ]', exampleHanzi: '谢谢', examplePinyin: 'xièxie', meaning: 'Cảm ơn', tip: 'Mặt lưỡi đưa sát ngạc cứng, luồng hơi xát ra, giống "x"' },
  { pinyin: 'zh', ipa: '[tʂ]', exampleHanzi: '中国', examplePinyin: 'zhōngguó', meaning: 'Trung Quốc', tip: 'Uốn đầu lưỡi lên ngạc cứng, không bật hơi, giống "tr"' },
  { pinyin: 'ch', ipa: '[tʂʰ]', exampleHanzi: '吃饭', examplePinyin: 'chīfàn', meaning: 'Ăn cơm', tip: 'Uốn đầu lưỡi và bật hơi thật mạnh' },
  { pinyin: 'sh', ipa: '[ʂ]', exampleHanzi: '什么是', examplePinyin: 'shénme', meaning: 'Cái gì', tip: 'Uốn cong đầu lưỡi, xát mạnh luồng hơi, giống "s" nặng' },
  { pinyin: 'r', ipa: '[ʐ]', exampleHanzi: '热', examplePinyin: 'rè', meaning: 'Nóng', tip: 'Uốn lưỡi rung nhẹ dây thanh, lai giữa "r" và "d"' },
  { pinyin: 'z', ipa: '[ts]', exampleHanzi: '早上', examplePinyin: 'zǎoshang', meaning: 'Buổi sáng', tip: 'Đầu lưỡi thẳng chạm mặt sau răng trên, không bật hơi' },
  { pinyin: 'c', ipa: '[tsʰ]', exampleHanzi: '菜', examplePinyin: 'cài', meaning: 'Món ăn', tip: 'Đầu lưỡi chạm răng trên rồi bật hơi mạnh' },
  { pinyin: 's', ipa: '[s]', exampleHanzi: '三', examplePinyin: 'sān', meaning: 'Số 3', tip: 'Đầu lưỡi thẳng xát nhẹ qua kẽ răng, giống "x" nhẹ' },
];

interface FinalsItem {
  pinyin: string;
  exampleHanzi: string;
  examplePinyin: string;
  meaning: string;
}

const FINALS: FinalsItem[] = [
  { pinyin: 'a', exampleHanzi: '大', examplePinyin: 'dà', meaning: 'Lớn, to' },
  { pinyin: 'o', exampleHanzi: '我', examplePinyin: 'wǒ', meaning: 'Tôi, mình' },
  { pinyin: 'e', exampleHanzi: '喝', examplePinyin: 'hē', meaning: 'Uống' },
  { pinyin: 'i', exampleHanzi: '你', examplePinyin: 'nǐ', meaning: 'Bạn, anh, chị' },
  { pinyin: 'u', exampleHanzi: '五', examplePinyin: 'wǔ', meaning: 'Số 5' },
  { pinyin: 'ü', exampleHanzi: '绿', examplePinyin: 'lǜ', meaning: 'Màu xanh lục' },
  { pinyin: 'ai', exampleHanzi: '白', examplePinyin: 'bái', meaning: 'Màu trắng' },
  { pinyin: 'ei', exampleHanzi: '飞', examplePinyin: 'fēi', meaning: 'Bay' },
  { pinyin: 'ao', exampleHanzi: '高', examplePinyin: 'gāo', meaning: 'Cao' },
  { pinyin: 'ou', exampleHanzi: '口', examplePinyin: 'kǒu', meaning: 'Miệng' },
  { pinyin: 'an', exampleHanzi: '三', examplePinyin: 'sān', meaning: 'Số 3' },
  { pinyin: 'en', exampleHanzi: '门', examplePinyin: 'mén', meaning: 'Cửa' },
  { pinyin: 'ang', exampleHanzi: '忙', examplePinyin: 'máng', meaning: 'Bận rộn' },
  { pinyin: 'eng', exampleHanzi: '冷', examplePinyin: 'lěng', meaning: 'Lạnh' },
  { pinyin: 'ong', exampleHanzi: '红', examplePinyin: 'hóng', meaning: 'Màu đỏ' },
];

interface ConversationItem {
  hanzi: string;
  pinyin: string;
  vietnamese: string;
  category: string;
}

const BASIC_CONVERSATIONS: ConversationItem[] = [
  { hanzi: '你好！', pinyin: 'Nǐ hǎo!', vietnamese: 'Xin chào!', category: 'Chào hỏi' },
  { hanzi: '早上好！', pinyin: 'Zǎoshang hǎo!', vietnamese: 'Chào buổi sáng!', category: 'Chào hỏi' },
  { hanzi: '谢谢！', pinyin: 'Xièxie!', vietnamese: 'Cảm ơn!', category: 'Xã giao' },
  { hanzi: '不客气。', pinyin: 'Bú kèqi.', vietnamese: 'Đừng khách sáo (Không có chi).', category: 'Xã giao' },
  { hanzi: '对不起！', pinyin: 'Duìbuqǐ!', vietnamese: 'Xin lỗi!', category: 'Xã giao' },
  { hanzi: '没关系。', pinyin: 'Méi guānxi.', vietnamese: 'Không sao đâu.', category: 'Xã giao' },
  { hanzi: '再见！', pinyin: 'Zàijiàn!', vietnamese: 'Tạm biệt!', category: 'Chào hỏi' },
  { hanzi: '你叫什么名字？', pinyin: 'Nǐ jiào shénme míngzi?', vietnamese: 'Bạn tên là gì?', category: 'Giới thiệu' },
  { hanzi: '我叫李明。', pinyin: 'Wǒ jiào Lǐ Míng.', vietnamese: 'Tôi tên là Lý Minh.', category: 'Giới thiệu' },
  { hanzi: '很高兴认识你！', pinyin: 'Hěn gāoxìng rènshi nǐ!', vietnamese: 'Rất vui được quen biết bạn!', category: 'Giới thiệu' },
  { hanzi: '你是哪国人？', pinyin: 'Nǐ shì nǎ guó rén?', vietnamese: 'Bạn là người nước nào?', category: 'Giới thiệu' },
  { hanzi: '我是越南人。', pinyin: 'Wǒ shì Yuènán rén.', vietnamese: 'Tôi là người Việt Nam.', category: 'Giới thiệu' },
];

interface BeginnerQuizItem {
  id: number;
  question: string;
  audioText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

const BEGINNER_QUIZZES: BeginnerQuizItem[] = [
  {
    id: 1,
    question: 'Nghe âm thanh và chọn phiên âm Pinyin đúng:',
    audioText: 'māma',
    options: ['bàba', 'māma', 'gēge', 'dìdi'],
    correctAnswer: 'māma',
    explanation: 'Từ vừa phát là "māma" (妈妈 - Mẹ), bắt đầu bằng thanh mẫu m.',
  },
  {
    id: 2,
    question: 'Nghe âm thanh và xác định thanh điệu của từ:',
    audioText: 'hǎo',
    options: ['Thanh 1 (mā)', 'Thanh 2 (má)', 'Thanh 3 (mǎ / hǎo)', 'Thanh 4 (mà)'],
    correctAnswer: 'Thanh 3 (mǎ / hǎo)',
    explanation: 'Từ vừa phát là "hǎo" (好 - Tốt), mang thanh 3 với cao độ xuống trầm rồi hơi ngước lên (2-1-4).',
  },
  {
    id: 3,
    question: 'Nghe câu chào và chọn câu dịch tiếng Việt đúng:',
    audioText: '谢谢',
    options: ['Xin chào', 'Tạm biệt', 'Cảm ơn', 'Xin lỗi'],
    correctAnswer: 'Cảm ơn',
    explanation: '"谢谢" (Xièxie) có nghĩa là "Cảm ơn".',
  },
  {
    id: 4,
    question: 'Nghe câu hỏi và chọn mẫu câu đối ứng:',
    audioText: '你叫什么名字？',
    options: ['我叫李明。', '我是越南人。', '早上好！', '不客气。'],
    correctAnswer: '我叫李明。',
    explanation: 'Câu hỏi là "Nǐ jiào shénme míngzi?" (Bạn tên là gì?), câu trả lời thích hợp là "Wǒ jiào Lǐ Míng." (Tôi tên là Lý Minh).',
  },
];

interface BeginnerViewProps {
  onStartHsk1?: () => void;
}

export const BeginnerView: React.FC<BeginnerViewProps> = ({ onStartHsk1 }) => {
  const [activeTab, setActiveTab] = useState<BeginnerTab>('pinyin');
  const [selectedInitial, setSelectedInitial] = useState<InitialsItem>(INITIALS[0]);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const { showToast } = useToast();

  const handlePlayTarget = async (type: 'initial' | 'final' | 'word' | 'sentence', text: string) => {
    try {
      await audioManager.playTarget({ type, text }, { rate: 0.85 });
      showToast(`Đang phát âm: ${text}`, 'info');
    } catch (err: any) {
      showToast(err?.message || 'Không thể phát âm thanh', 'warning');
    }
  };

  const handlePlayChinese = async (text: string) => {
    try {
      await audioManager.playText(text, { rate: 0.85 });
      showToast(`Đang phát âm: ${text}`, 'info');
    } catch (err: any) {
      showToast(err?.message || 'Không thể phát âm thanh', 'warning');
    }
  };

  const handleSelectQuizOption = (quizId: number, option: string) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({ ...prev, [quizId]: option }));
  };

  const handleResetQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
  };

  const calculateScore = () => {
    let correct = 0;
    BEGINNER_QUIZZES.forEach((q) => {
      if (quizAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-surface rounded-3xl border border-border-subtle p-6 sm:p-8 shadow-2xs space-y-4 card-motion light-beam-shimmer">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-primary-container text-white flex items-center justify-center font-bold shadow-sm flex-shrink-0">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-soft text-primary text-xs font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nền tảng người mới bắt đầu (Zero to One)</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Khởi đầu Tiếng Trung chuẩn bản ngữ</h1>
              <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                Nắm vững Pinyin, 4 thanh điệu, khẩu hình chuẩn và các mẫu câu giao tiếp căn bản trước khi vào HSK 1.
              </p>
            </div>
          </div>

          {onStartHsk1 && (
            <button
              onClick={onStartHsk1}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold shadow-xs hover:bg-primary-hover flex items-center justify-center gap-2 btn-motion transition-all flex-shrink-0"
            >
              <BookOpen className="w-4 h-4" />
              <span>Vào học HSK 1 Bài 01</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-divider-line">
          {[
            { id: 'pinyin', label: 'Bảng Pinyin (21 Thanh mẫu & Vận mẫu)' },
            { id: 'tones', label: '4 Thanh điệu & Biến điệu' },
            { id: 'conversation', label: '12 Mẫu câu vỡ lòng' },
            { id: 'quiz', label: 'Luyện tập & Kiểm tra' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as BeginnerTab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all btn-motion ${
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

      {/* Tab 1: Pinyin Initials & Finals */}
      {activeTab === 'pinyin' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Detail card */}
            <div className="bg-surface rounded-2xl border border-border-subtle p-6 shadow-2xs space-y-4 card-motion">
              <span className="text-xs font-bold text-primary px-2.5 py-1 rounded bg-primary-soft">
                Chi tiết thanh mẫu (Phụ âm đầu)
              </span>
              <div className="text-center py-4">
                <span className="font-sans text-6xl font-black text-text-primary block">{selectedInitial.pinyin}</span>
                <p className="text-xs text-text-muted mt-2">Ký hiệu phiên âm quốc tế: {selectedInitial.ipa}</p>
              </div>

              <div className="p-4 rounded-xl bg-surface-secondary border border-border-subtle space-y-2 text-xs">
                <p className="font-bold text-text-primary">Ví dụ từ trong bài:</p>
                <div className="flex items-center justify-between">
                  <span className="font-hanzi text-2xl font-bold text-primary">{selectedInitial.exampleHanzi}</span>
                  <span className="font-sans text-sm font-semibold text-deep-blue">{selectedInitial.examplePinyin}</span>
                </div>
                <p className="text-text-secondary">Nghĩa: {selectedInitial.meaning}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs leading-relaxed">
                <p className="font-bold mb-1">Mẹo khẩu hình:</p>
                <p>{selectedInitial.tip}</p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => handlePlayTarget('initial', selectedInitial.pinyin)}
                  className="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 hover:bg-primary-hover btn-motion transition-colors"
                  title={`Phát âm chuẩn thanh mẫu "${selectedInitial.pinyin}"`}
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Nghe phát âm thanh mẫu: "{selectedInitial.pinyin}"</span>
                </button>

                <button
                  onClick={() => handlePlayTarget('word', selectedInitial.exampleHanzi)}
                  className="w-full py-2 bg-surface-secondary text-text-secondary hover:text-text-primary rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  title={`Nghe từ ví dụ "${selectedInitial.exampleHanzi}"`}
                >
                  <Volume2 className="w-3.5 h-3.5 text-text-muted" />
                  <span>Nghe từ ví dụ: {selectedInitial.exampleHanzi} ({selectedInitial.examplePinyin})</span>
                </button>
              </div>
            </div>

            {/* Initials Grid */}
            <div className="lg:col-span-2 bg-surface rounded-2xl border border-border-subtle p-5 sm:p-6 shadow-2xs space-y-4 card-motion">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-text-primary">21 Thanh mẫu tiếng Trung (Bấm để nghe & xem mẹo)</h2>
                <span className="text-xs text-text-muted">Giọng đọc chuẩn Bắc Kinh</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {INITIALS.map((item) => {
                  const isSelected = selectedInitial.pinyin === item.pinyin;
                  return (
                    <button
                      key={item.pinyin}
                      onClick={() => {
                        setSelectedInitial(item);
                        handlePlayTarget('initial', item.pinyin);
                      }}
                      className={`p-3 rounded-xl border text-center transition-all btn-motion ${
                        isSelected
                          ? 'bg-primary-soft border-primary text-primary font-bold shadow-2xs scale-105'
                          : 'bg-surface hover:bg-surface-secondary border-border-subtle text-text-primary'
                      }`}
                    >
                      <span className="font-sans text-xl font-black block">{item.pinyin}</span>
                      <span className="text-[10px] text-text-muted block mt-0.5">{item.ipa}</span>
                    </button>
                  );
                })}
              </div>

              {/* Finals Section */}
              <div className="pt-4 border-t border-divider-line space-y-3">
                <h3 className="text-sm font-bold text-text-primary">Các vận mẫu cơ bản (Bấm để nghe âm mục tiêu)</h3>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {FINALS.map((f) => (
                    <button
                      key={f.pinyin}
                      onClick={() => handlePlayTarget('final', f.pinyin)}
                      className="p-2.5 rounded-xl border border-border-subtle hover:border-primary-container bg-surface-secondary text-center hover:bg-surface transition-all btn-motion group"
                      title={`Nghe phát âm vận mẫu "${f.pinyin}"`}
                    >
                      <span className="font-sans text-base font-bold text-primary group-hover:scale-105 block transition-transform">
                        {f.pinyin}
                      </span>
                      <span className="text-[10px] text-text-muted font-hanzi block mt-0.5">
                        {f.exampleHanzi} ({f.examplePinyin})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Tones & Sandhi */}
      {activeTab === 'tones' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                tone: 'Thanh 1 (Âm Bình)',
                mark: 'ā',
                example: 'mā (妈)',
                meaning: 'Mẹ',
                contour: '5-5',
                desc: 'Cao độ 5-5, giữ bằng phẳng, ngân dài đều, không hạ giọng.',
              },
              {
                tone: 'Thanh 2 (Dương Bình)',
                mark: 'á',
                example: 'má (麻)',
                meaning: 'Cây gai / Tê',
                contour: '3-5',
                desc: 'Đi từ vừa lên cao, tương tự dấu sắc tiếng Việt nhưng nhẹ hơn.',
              },
              {
                tone: 'Thanh 3 (Thượng Thanh)',
                mark: 'ǎ',
                example: 'mǎ (马)',
                meaning: 'Con ngựa',
                contour: '2-1-4',
                desc: 'Xuống thấp nhất rồi đưa nhẹ lên cao, tương tự dấu hỏi kéo dài.',
              },
              {
                tone: 'Thanh 4 (Khứ Thanh)',
                mark: 'à',
                example: 'mà (骂)',
                meaning: 'Mắng mỏ',
                contour: '5-1',
                desc: 'Rơi nhanh từ cao nhất xuống thấp nhất, dứt khoát như ra lệnh.',
              },
            ].map((t, idx) => (
              <div
                key={idx}
                className="bg-surface rounded-2xl border border-border-subtle p-5 shadow-2xs space-y-3 card-motion flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-secondary px-2.5 py-0.5 rounded bg-coral-soft">
                      Cao độ: {t.contour}
                    </span>
                    <span className="font-sans text-3xl font-black text-primary">{t.mark}</span>
                  </div>
                  <h3 className="text-sm font-bold text-text-primary">{t.tone}</h3>
                  <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">{t.desc}</p>
                </div>

                <div className="pt-3 border-t border-divider-line">
                  <button
                    onClick={() => handlePlayChinese(t.example.split(' ')[0])}
                    className="w-full py-2 bg-surface-secondary hover:bg-primary-soft text-text-primary hover:text-primary rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors btn-motion"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Mẫu: {t.example} ({t.meaning})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Tone Sandhi Rules */}
          <div className="bg-surface rounded-2xl border border-border-subtle p-6 shadow-2xs space-y-4 card-motion">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Các quy tắc biến điệu quan trọng (Tone Sandhi)</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-surface-secondary border border-border-subtle space-y-1.5">
                <span className="font-bold text-primary block text-sm">1. Hai thanh 3 đi liền nhau</span>
                <p className="text-text-secondary leading-relaxed">
                  Khi hai âm tiết thanh 3 đi liền nhau, âm thứ nhất đọc thành thanh 2 (3 + 3 ➔ 2 + 3).
                </p>
                <div className="pt-2 flex items-center justify-between font-bold">
                  <span>Ví dụ: 你好 (nǐ hǎo)</span>
                  <button
                    onClick={() => handlePlayChinese('你好')}
                    className="p-1 rounded bg-surface hover:text-primary transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-text-muted italic">Đọc là: [ní hǎo]</p>
              </div>

              <div className="p-4 rounded-xl bg-surface-secondary border border-border-subtle space-y-1.5">
                <span className="font-bold text-primary block text-sm">2. Biến điệu của chữ "不" (bù)</span>
                <p className="text-text-secondary leading-relaxed">
                  "不" vốn mang thanh 4, nhưng khi đứng trước một âm tiết mang thanh 4 thì đọc thành thanh 2 "bú".
                </p>
                <div className="pt-2 flex items-center justify-between font-bold">
                  <span>Ví dụ: 不是 (bù shì)</span>
                  <button
                    onClick={() => handlePlayChinese('不是')}
                    className="p-1 rounded bg-surface hover:text-primary transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-text-muted italic">Đọc là: [bú shì]</p>
              </div>

              <div className="p-4 rounded-xl bg-surface-secondary border border-border-subtle space-y-1.5">
                <span className="font-bold text-primary block text-sm">3. Biến điệu của chữ "一" (yī)</span>
                <p className="text-text-secondary leading-relaxed">
                  "一" vốn mang thanh 1. Trước thanh 4 đọc thành thanh 2 (yí). Trước thanh 1, 2, 3 đọc thành thanh 4 (yì).
                </p>
                <div className="pt-2 flex items-center justify-between font-bold">
                  <span>Ví dụ: 一个 (yī gè)</span>
                  <button
                    onClick={() => handlePlayChinese('一个')}
                    className="p-1 rounded bg-surface hover:text-primary transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-text-muted italic">Đọc là: [yí gè]</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Basic Conversations */}
      {activeTab === 'conversation' && (
        <div className="space-y-4">
          <div className="bg-surface rounded-2xl border border-border-subtle p-6 shadow-2xs space-y-4 card-motion">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-text-primary">12 Mẫu câu vỡ lòng thông dụng nhất</h2>
                <p className="text-xs text-text-muted mt-0.5">Bấm vào biểu tượng loa để nghe phát âm từng câu</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary-soft text-primary">
                12 câu mẫu
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {BASIC_CONVERSATIONS.map((c, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-surface-secondary border border-border-subtle hover:border-primary-container flex items-center justify-between gap-3 transition-colors group"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface text-text-muted border border-border-subtle">
                        {c.category}
                      </span>
                      <span className="font-hanzi text-lg font-bold text-text-primary group-hover:text-primary transition-colors">
                        {c.hanzi}
                      </span>
                    </div>
                    <p className="font-sans text-xs font-semibold text-deep-blue">{c.pinyin}</p>
                    <p className="text-xs text-text-secondary">{c.vietnamese}</p>
                  </div>

                  <button
                    onClick={() => handlePlayChinese(c.hanzi)}
                    className="w-9 h-9 rounded-full bg-surface border border-border-subtle text-primary hover:bg-primary hover:text-white flex items-center justify-center flex-shrink-0 shadow-2xs btn-motion transition-all"
                    title={`Nghe phát âm: ${c.hanzi}`}
                    aria-label={`Nghe phát âm ${c.hanzi}`}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Interactive Quiz & Mini Drills */}
      {activeTab === 'quiz' && (
        <div className="bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-2xs space-y-6 card-motion">
          <div className="flex items-center justify-between pb-3 border-b border-divider-line">
            <div>
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                <span>Trắc nghiệm nhận diện âm & ngữ nghĩa vỡ lòng</span>
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Kiểm tra khả năng phân biệt thanh điệu, phụ âm và phản xạ nghĩa tiếng Trung
              </p>
            </div>
            {quizSubmitted && (
              <div className="px-3 py-1 rounded-full text-xs font-bold bg-primary-soft text-primary">
                Điểm số: {calculateScore()} / {BEGINNER_QUIZZES.length}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {BEGINNER_QUIZZES.map((quiz, qIdx) => {
              const selectedOpt = quizAnswers[quiz.id];
              const isCorrect = selectedOpt === quiz.correctAnswer;

              return (
                <div
                  key={quiz.id}
                  className="p-5 rounded-2xl bg-surface-secondary border border-border-subtle space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-primary">Câu hỏi {qIdx + 1}</span>
                      <p className="text-sm font-semibold text-text-primary">{quiz.question}</p>
                    </div>

                    <button
                      onClick={() => handlePlayChinese(quiz.audioText)}
                      className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs hover:bg-primary-hover btn-motion transition-colors"
                      title="Bấm để nghe âm thanh câu hỏi"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Nghe âm thanh</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {quiz.options.map((opt) => {
                      const isChosen = selectedOpt === opt;
                      let btnStyle = 'bg-surface hover:bg-border-subtle border-border-subtle text-text-primary';

                      if (quizSubmitted) {
                        if (opt === quiz.correctAnswer) {
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
                          disabled={quizSubmitted}
                          onClick={() => handleSelectQuizOption(quiz.id, opt)}
                          className={`p-3 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {quizSubmitted && opt === quiz.correctAnswer && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          )}
                          {quizSubmitted && isChosen && !isCorrect && (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {quizSubmitted && (
                    <div className="p-3 rounded-xl bg-surface border border-border-subtle text-xs text-text-secondary leading-relaxed">
                      <span className="font-bold text-text-primary">Giải thích: </span>
                      {quiz.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-divider-line">
            {quizSubmitted ? (
              <button
                onClick={handleResetQuiz}
                className="px-4 py-2 bg-surface-secondary hover:bg-border-subtle text-text-primary rounded-xl text-xs font-bold flex items-center gap-2 btn-motion transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Làm lại bài kiểm tra</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (Object.keys(quizAnswers).length < BEGINNER_QUIZZES.length) {
                    showToast('Vui lòng hoàn thành tất cả câu hỏi trước khi nộp bài', 'warning');
                    return;
                  }
                  setQuizSubmitted(true);
                  showToast(`Đã chấm điểm: ${calculateScore()} / ${BEGINNER_QUIZZES.length} câu đúng!`, 'success');
                }}
                className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-xs hover:bg-primary-hover btn-motion transition-colors"
              >
                Nộp bài & Xem kết quả
              </button>
            )}

            {onStartHsk1 && (
              <button
                onClick={onStartHsk1}
                className="px-4 py-2 bg-secondary text-white rounded-xl text-xs font-bold shadow-xs hover:bg-coral-hover flex items-center gap-1.5 btn-motion transition-colors"
              >
                <span>Bắt đầu HSK 1 Bài 01</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
