import React, { useState } from 'react';
import { Volume2, Search } from 'lucide-react';
import { audioManager } from '../../../services/audio/index';

interface SyllableItem {
  pinyin: string;
  hanzi: string;
  meaning: string;
  initial: string;
  final: string;
  tone: number;
}

const COMMON_SYLLABLES: SyllableItem[] = [
  // b
  { pinyin: 'bā', hanzi: '八', meaning: 'số 8', initial: 'b', final: 'a', tone: 1 },
  { pinyin: 'bá', hanzi: '拔', meaning: 'nhổ', initial: 'b', final: 'a', tone: 2 },
  { pinyin: 'bǎ', hanzi: '把', meaning: 'nắm, chiếc', initial: 'b', final: 'a', tone: 3 },
  { pinyin: 'bà', hanzi: '爸', meaning: 'bố', initial: 'b', final: 'a', tone: 4 },
  { pinyin: 'bái', hanzi: '白', meaning: 'trắng', initial: 'b', final: 'ai', tone: 2 },
  { pinyin: 'bāo', hanzi: '包', meaning: 'bao, gói', initial: 'b', final: 'ao', tone: 1 },
  // p
  { pinyin: 'pā', hanzi: '趴', meaning: 'nằm sấp', initial: 'p', final: 'a', tone: 1 },
  { pinyin: 'pá', hanzi: '爬', meaning: 'bò, leo', initial: 'p', final: 'a', tone: 2 },
  { pinyin: 'pà', hanzi: '怕', meaning: 'sợ', initial: 'p', final: 'a', tone: 4 },
  { pinyin: 'pán', hanzi: '盘', meaning: 'đĩa', initial: 'p', final: 'an', tone: 2 },
  { pinyin: 'péng', hanzi: '朋', meaning: 'bạn', initial: 'p', final: 'eng', tone: 2 },
  // m
  { pinyin: 'mā', hanzi: '妈', meaning: 'mẹ', initial: 'm', final: 'a', tone: 1 },
  { pinyin: 'má', hanzi: '麻', meaning: 'gai', initial: 'm', final: 'a', tone: 2 },
  { pinyin: 'mǎ', hanzi: '马', meaning: 'ngựa', initial: 'm', final: 'a', tone: 3 },
  { pinyin: 'mà', hanzi: '骂', meaning: 'mắng', initial: 'm', final: 'a', tone: 4 },
  { pinyin: 'máng', hanzi: '忙', meaning: 'bận', initial: 'm', final: 'ang', tone: 2 },
  { pinyin: 'mǐ', hanzi: '米', meaning: 'gạo, mét', initial: 'm', final: 'i', tone: 3 },
  // f
  { pinyin: 'fā', hanzi: '发', meaning: 'phát', initial: 'f', final: 'a', tone: 1 },
  { pinyin: 'fēi', hanzi: '飞', meaning: 'bay', initial: 'f', final: 'ei', tone: 1 },
  { pinyin: 'fáng', hanzi: '房', meaning: 'nhà', initial: 'f', final: 'ang', tone: 2 },
  // d
  { pinyin: 'dà', hanzi: '大', meaning: 'lớn, to', initial: 'd', final: 'a', tone: 4 },
  { pinyin: 'dài', hanzi: '带', meaning: 'mang, đai', initial: 'd', final: 'ai', tone: 4 },
  { pinyin: 'dào', hanzi: '到', meaning: 'đến', initial: 'd', final: 'ao', tone: 4 },
  { pinyin: 'dì', hanzi: '弟', meaning: 'em trai', initial: 'd', final: 'i', tone: 4 },
  { pinyin: 'dōng', hanzi: '东', meaning: 'phương đông', initial: 'd', final: 'ong', tone: 1 },
  // t
  { pinyin: 'tā', hanzi: '他', meaning: 'anh ấy', initial: 't', final: 'a', tone: 1 },
  { pinyin: 'tiān', hanzi: '天', meaning: 'trời, ngày', initial: 't', final: 'ian', tone: 1 },
  { pinyin: 'tīng', hanzi: '听', meaning: 'nghe', initial: 't', final: 'ing', tone: 1 },
  // n
  { pinyin: 'nǐ', hanzi: '你', meaning: 'bạn', initial: 'n', final: 'i', tone: 3 },
  { pinyin: 'nán', hanzi: '南', meaning: 'phương nam', initial: 'n', final: 'an', tone: 2 },
  { pinyin: 'nǚ', hanzi: '女', meaning: 'nữ', initial: 'n', final: 'ü', tone: 3 },
  // l
  { pinyin: 'lǎo', hanzi: '老', meaning: 'già, cũ', initial: 'l', final: 'ao', tone: 3 },
  { pinyin: 'lǐ', hanzi: '里', meaning: 'trong', initial: 'l', final: 'i', tone: 3 },
  { pinyin: 'lù', hanzi: '路', meaning: 'đường', initial: 'l', final: 'u', tone: 4 },
  { pinyin: 'lǜ', hanzi: '绿', meaning: 'xanh lục', initial: 'l', final: 'ü', tone: 4 },
  // g
  { pinyin: 'gē', hanzi: '哥', meaning: 'anh trai', initial: 'g', final: 'e', tone: 1 },
  { pinyin: 'gāo', hanzi: '高', meaning: 'cao', initial: 'g', final: 'ao', tone: 1 },
  { pinyin: 'guó', hanzi: '国', meaning: 'đất nước', initial: 'g', final: 'uo', tone: 2 },
  // k
  { pinyin: 'kàn', hanzi: '看', meaning: 'nhìn, xem', initial: 'k', final: 'an', tone: 4 },
  { pinyin: 'kě', hanzi: '可', meaning: 'có thể', initial: 'k', final: 'e', tone: 3 },
  { pinyin: 'kǒu', hanzi: '口', meaning: 'miệng', initial: 'k', final: 'ou', tone: 3 },
  // h
  { pinyin: 'hǎo', hanzi: '好', meaning: 'tốt, đẹp', initial: 'h', final: 'ao', tone: 3 },
  { pinyin: 'hē', hanzi: '喝', meaning: 'uống', initial: 'h', final: 'e', tone: 1 },
  { pinyin: 'hóng', hanzi: '红', meaning: 'đỏ', initial: 'h', final: 'ong', tone: 2 },
  // j
  { pinyin: 'jī', hanzi: '鸡', meaning: 'con gà', initial: 'j', final: 'i', tone: 1 },
  { pinyin: 'jīn', hanzi: '金', meaning: 'vàng', initial: 'j', final: 'in', tone: 1 },
  { pinyin: 'jiā', hanzi: '家', meaning: 'nhà', initial: 'j', final: 'ia', tone: 1 },
  // q
  { pinyin: 'qī', hanzi: '七', meaning: 'số 7', initial: 'q', final: 'i', tone: 1 },
  { pinyin: 'qù', hanzi: '去', meaning: 'đi', initial: 'q', final: 'u', tone: 4 },
  { pinyin: 'qián', hanzi: '钱', meaning: 'tiền', initial: 'q', final: 'ian', tone: 2 },
  // x
  { pinyin: 'xià', hanzi: '下', meaning: 'dưới', initial: 'x', final: 'ia', tone: 4 },
  { pinyin: 'xiè', hanzi: '谢', meaning: 'cảm ơn', initial: 'x', final: 'ie', tone: 4 },
  { pinyin: 'xīn', hanzi: '新', meaning: 'mới', initial: 'x', final: 'in', tone: 1 },
  // zh
  { pinyin: 'zhōng', hanzi: '中', meaning: 'trung', initial: 'zh', final: 'ong', tone: 1 },
  { pinyin: 'zhè', hanzi: '这', meaning: 'này, đây', initial: 'zh', final: 'e', tone: 4 },
  { pinyin: 'zhī', hanzi: '知', meaning: 'biết', initial: 'zh', final: 'i', tone: 1 },
  // ch
  { pinyin: 'chī', hanzi: '吃', meaning: 'ăn', initial: 'ch', final: 'i', tone: 1 },
  { pinyin: 'chē', hanzi: '车', meaning: 'xe', initial: 'ch', final: 'e', tone: 1 },
  { pinyin: 'chá', hanzi: '茶', meaning: 'trà', initial: 'ch', final: 'a', tone: 2 },
  // sh
  { pinyin: 'shān', hanzi: '山', meaning: 'núi', initial: 'sh', final: 'an', tone: 1 },
  { pinyin: 'shū', hanzi: '书', meaning: 'sách', initial: 'sh', final: 'u', tone: 1 },
  { pinyin: 'shì', hanzi: '是', meaning: 'là, phải', initial: 'sh', final: 'i', tone: 4 },
  // r
  { pinyin: 'rén', hanzi: '人', meaning: 'người', initial: 'r', final: 'en', tone: 2 },
  { pinyin: 'rè', hanzi: '热', meaning: 'nóng', initial: 'r', final: 'e', tone: 4 },
  { pinyin: 'rì', hanzi: '日', meaning: 'ngày, mặt trời', initial: 'r', final: 'i', tone: 4 },
  // z
  { pinyin: 'zǎo', hanzi: '早', meaning: 'sớm', initial: 'z', final: 'ao', tone: 3 },
  { pinyin: 'zài', hanzi: '在', meaning: 'ở, tại', initial: 'z', final: 'ai', tone: 4 },
  { pinyin: 'zǒu', hanzi: '走', meaning: 'đi', initial: 'z', final: 'ou', tone: 3 },
  // c
  { pinyin: 'cài', hanzi: '菜', meaning: 'rau, món ăn', initial: 'c', final: 'ai', tone: 4 },
  { pinyin: 'cóng', hanzi: '从', meaning: 'từ', initial: 'c', final: 'ong', tone: 2 },
  // s
  { pinyin: 'sān', hanzi: '三', meaning: 'số 3', initial: 's', final: 'an', tone: 1 },
  { pinyin: 'sì', hanzi: '四', meaning: 'số 4', initial: 's', final: 'i', tone: 4 },
];

export const SyllableChartLab: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTone, setFilterTone] = useState<number | null>(null);

  const filtered = COMMON_SYLLABLES.filter((item) => {
    const matchSearch =
      item.pinyin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.hanzi.includes(searchQuery) ||
      item.meaning.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTone = filterTone === null || item.tone === filterTone;
    return matchSearch && matchTone;
  });

  const handlePlay = (text: string) => {
    audioManager.playText(text);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
            Bảng Ghép Âm Tiết Pinyin Phổ Biến (拼音音节表)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ghép thanh mẫu + vận mẫu + thanh điệu tạo thành âm tiết hoàn chỉnh. Bấm vào âm tiết để nghe phát âm.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300">
            {COMMON_SYLLABLES.length} âm tiết thông dụng
          </span>
        </div>
      </div>

      {/* Filter controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo pinyin, chữ Hán, nghĩa..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterTone(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterTone === null
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Tất cả
          </button>
          {[1, 2, 3, 4].map((t) => (
            <button
              key={t}
              onClick={() => setFilterTone(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterTone === t
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              Thanh {t}
            </button>
          ))}
        </div>
      </div>

      {/* Syllables Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
        {filtered.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handlePlay(item.hanzi)}
            className="flex flex-col items-center p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-600 hover:shadow-md transition-all group relative"
          >
            <span className="text-base font-bold text-cyan-600 dark:text-cyan-400 font-mono">
              {item.pinyin}
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white my-0.5">
              {item.hanzi}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-full">
              {item.meaning}
            </span>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Volume2 className="w-3.5 h-3.5 text-cyan-500" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
