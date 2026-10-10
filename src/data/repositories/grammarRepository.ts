/**
 * YUYAN — Authoritative Grammar Repository
 * Built on GF0025-2021 (Standards for Chinese Proficiency in International Chinese Language Education)
 * and Standard HSK 1–6 Curricula.
 * Includes complete formulas (positive, negative, question), bilingual examples,
 * Vietnamese learner common pitfalls, and interactive practice exercises.
 */

import { getSupabaseClient } from '../../services/supabase/client';
import hsk3CatalogData from '../grammar/hsk3GrammarData.json';
import hsk2CatalogData from '../grammar/hsk2GrammarData.json';

export interface GrammarExercise {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface CommonMistake {
  wrong: string;
  correct: string;
  reason: string;
}

export interface GrammarPoint {
  id: string;
  level: number;
  hskVersion?: 'hsk2' | 'hsk3';
  syllabusEdition?: string;
  sourceLevel?: string;
  normalizedLevel?: number;
  bandLabel?: string;
  gfLevel?: string;
  category: string;
  subCategory?: string;
  detailNote?: string;
  lessonId?: string;
  lessonNumber?: number;
  title: string;
  pattern: string;
  positivePattern?: string;
  negativePattern?: string;
  interrogativePattern?: string;
  explanation: string;
  structureSummary?: string;
  meaningVi?: string;
  examples: Array<{
    hanzi: string;
    pinyin?: string;
    vietnamese?: string;
    source?: string;
  }>;
  commonMistakes?: CommonMistake[];
  practiceExercises?: GrammarExercise[];
  notes?: string;
  sortOrder?: number;
  sourceUrl?: string;
  sourceRevision?: string;
  verificationStatus?: 'verified_official_source' | 'verified_curated' | 'source_imported';
}

export const AUTHORITATIVE_GRAMMAR_POINTS: GrammarPoint[] = [
  // ==========================================
  // HSK 1 (GF0025-2021 SƠ CẤP CẤP 1)
  // ==========================================
  {
    id: 'gram_hsk1_01',
    level: 1,
    gfLevel: 'Sơ cấp Cấp 1',
    category: 'Câu phán đoán',
    lessonId: 'hsk1-bai01',
    lessonNumber: 1,
    title: 'Câu phán đoán với 是 (shì) — Là',
    pattern: 'Chủ ngữ + 是 + Danh từ / Đại từ',
    positivePattern: 'S + 是 + N (Ví dụ: 我是学生。)',
    negativePattern: 'S + 不是 + N (Ví dụ: 他不是老师。)',
    interrogativePattern: 'S + 是 + N + 吗？ / S + 是不是 + N？',
    explanation: 'Dùng để khẳng định hoặc xác định danh tính, nghề nghiệp, quốc tịch hoặc quan hệ của một người/sự vật. Thể phủ định bắt buộc dùng 不是 (bù shì).',
    structureSummary: 'S + 是/不是 + N',
    examples: [
      { hanzi: '我是中国人。', pinyin: 'Wǒ shì Zhōngguórén.', vietnamese: 'Tôi là người Trung Quốc.' },
      { hanzi: '他不是老师，他是医生。', pinyin: 'Tā bù shì lǎoshī, tā shì yīshēng.', vietnamese: 'Anh ấy không phải là giáo viên, anh ấy là bác sĩ.' },
      { hanzi: '你是王经理吗？', pinyin: 'Nǐ shì Wáng jīnglǐ ma?', vietnamese: 'Bạn có phải là Giám đốc Vương không?' },
    ],
    commonMistakes: [
      {
        wrong: '今天天气是好。(SAI)',
        correct: '今天天气很好。(ĐÚNG)',
        reason: 'Không dùng 是 trước tính từ để miêu tả tính chất. Trong câu vị ngữ tính từ, dùng phó từ chỉ mức độ (很, 非常, 真) thay vì 是.',
      },
      {
        wrong: '我是不越南人。(SAI)',
        correct: '我不是越南人。(ĐÚNG)',
        reason: 'Phó từ phủ định 不 phải đặt liền trước 是 tạo thành 不是.',
      },
    ],
    practiceExercises: [
      {
        id: 'ex_hsk1_01_1',
        question: 'Chọn câu phủ định đúng của câu: "她是我的汉语老师。"',
        options: ['她没是我的汉语老师。', '她不是我的汉语老师。', '她是不我的汉语老师。', '她不我的汉语老师。'],
        correctAnswer: 1,
        explanation: 'Phủ định của 是 trong câu phán đoán luôn luôn là 不是.',
      },
      {
        id: 'ex_hsk1_01_2',
        question: 'Điền từ thích hợp vào chỗ trống: "这本词典 ___ 爸爸送给我的。"',
        options: ['是', '很', '在', '有'],
        correctAnswer: 0,
        explanation: 'Đây là câu phán đoán quan hệ sở hữu/nguồn gốc, dùng 是.',
      },
    ],
    notes: 'Không dùng 是 trước tính từ để miêu tả trạng thái (dùng 很 + Tính từ).',
    sortOrder: 1,
  },
  {
    id: 'gram_hsk1_02',
    level: 1,
    gfLevel: 'Sơ cấp Cấp 1',
    category: 'Trợ từ nghi vấn',
    lessonId: 'hsk1-bai02',
    lessonNumber: 2,
    title: 'Câu hỏi Yes/No với trợ từ nghi vấn 吗 (ma)',
    pattern: 'Mệnh đề trần thuật + 吗？',
    positivePattern: 'Khẳng định + 吗？ (Ví dụ: 你去学校吗？)',
    negativePattern: 'Phủ định + 吗？ (Ví dụ: 你不喝茶吗？)',
    interrogativePattern: 'Mệnh đề + 吗？',
    explanation: 'Đặt ở cuối một câu trần thuật (khẳng định hoặc phủ định) để biến câu đó thành câu hỏi xác nhận có/không (Có phải ... không?).',
    structureSummary: 'Câu trần thuật + 吗？',
    examples: [
      { hanzi: '你好吗？', pinyin: 'Nǐ hǎo ma?', vietnamese: 'Bạn có khỏe không?' },
      { hanzi: '你是学生吗？', pinyin: 'Nǐ shì xuésheng ma?', vietnamese: 'Bạn có phải là học sinh không?' },
      { hanzi: '明天你来我家吗？', pinyin: 'Míngtiān nǐ lái wǒ jiā ma?', vietnamese: 'Ngày mai bạn có đến nhà tôi không?' },
    ],
    commonMistakes: [
      {
        wrong: '你是谁吗？(SAI)',
        correct: '你是谁？(ĐÚNG)',
        reason: 'Trong câu đã có đại từ nghi vấn (谁, 什么, 哪, 几) thì KHÔNG được thêm 吗 ở cuối câu.',
      },
      {
        wrong: '你好不好吗？(SAI)',
        correct: '你好不好？ hoặc 你好吗？(ĐÚNG)',
        reason: 'Câu hỏi chính phản (好不好) đã mang tính chất nghi vấn, không được dùng kèm 吗.',
      },
    ],
    practiceExercises: [
      {
        id: 'ex_hsk1_02_1',
        question: 'Câu nào sau đây sai ngữ pháp do dùng thừa 吗?',
        options: ['你想吃米饭吗？', '你叫什么名字吗？', '这是你的汉语书吗？', '明天下午你有空吗？'],
        correctAnswer: 1,
        explanation: 'Câu có đại từ nghi vấn 什么 thì không dùng trợ từ 吗.',
      },
    ],
    notes: 'Không dùng 吗 trong câu hỏi chính phản (A不A) hoặc câu đã có đại từ nghi vấn.',
    sortOrder: 2,
  },
  {
    id: 'gram_hsk1_03',
    level: 1,
    gfLevel: 'Sơ cấp Cấp 1',
    category: 'Đại từ nghi vấn',
    lessonId: 'hsk1-bai03',
    lessonNumber: 3,
    title: 'Đại từ nghi vấn 什么 (shénme) — Cái gì',
    pattern: 'Chủ ngữ + Động từ + 什么 + (Danh từ)？',
    positivePattern: 'S + V + 什么？ (Ví dụ: 你看什么？)',
    negativePattern: 'S + 不/没 + V + 什么 (mang nghĩa không ... cái gì)',
    interrogativePattern: 'S + V + 什么 (+ N)？',
    explanation: 'Dùng để hỏi về sự vật, sự việc, tên gọi hoặc tính chất danh từ. Trật tự từ trong câu hỏi tiếng Trung giữ nguyên vị trí như trong câu trần thuật, không đảo ngữ.',
    structureSummary: 'S + V + 什么 (+ N)？',
    examples: [
      { hanzi: '你叫什么名字？', pinyin: 'Nǐ jiào shénme míngzi?', vietnamese: 'Bạn tên là gì?' },
      { hanzi: '这是什么书？', pinyin: 'Zhè shì shénme shū?', vietnamese: 'Đây là sách gì?' },
      { hanzi: '你在看什么？', pinyin: 'Nǐ zài kàn shénme?', vietnamese: 'Bạn đang xem cái gì đấy?' },
    ],
    commonMistakes: [
      {
        wrong: '什么是这？(SAI)',
        correct: '这是什么？(ĐÚNG)',
        reason: 'Tiếng Trung không đảo ngữ như tiếng Anh (What is this?). Vị trí của từ hỏi đúng bằng vị trí của từ trả lời.',
      },
    ],
    practiceExercises: [
      {
        id: 'ex_hsk1_03_1',
        question: 'Sắp xếp các từ thành câu đúng: "名字 / 什么 / 你 / 叫 / ?"',
        options: ['什么你叫名字？', '你叫什么名字？', '叫你名字什么？', '名字叫你什么？'],
        correctAnswer: 1,
        explanation: 'Trật tự câu hỏi: Chủ ngữ (你) + Động từ (叫) + Đại từ hỏi (什么) + Danh từ (名字).',
      },
    ],
    notes: 'Trật tự câu hỏi tiếng Trung tuân theo nguyên tắc trật tự tự nhiên, không đổi vị trí.',
    sortOrder: 3,
  },
  {
    id: 'gram_hsk1_04',
    level: 1,
    gfLevel: 'Sơ cấp Cấp 1',
    category: 'Trợ từ kết cấu',
    lessonId: 'hsk1-bai04',
    lessonNumber: 4,
    title: 'Trợ từ kết cấu 的 (de) — Quan hệ Sở hữu & Định ngữ',
    pattern: 'Định ngữ (Chủ sở hữu / Tính chất) + 的 + Trung tâm ngữ (Danh từ)',
    positivePattern: 'Định ngữ + 的 + Danh từ',
    negativePattern: 'Không có 的 trong câu phủ định của động từ',
    interrogativePattern: '这是谁的 + N？',
    explanation: 'Nối định ngữ với danh từ trung tâm. Biểu thị quan hệ sở hữu (của) hoặc bổ nghĩa miêu tả tính chất. Nếu định ngữ là quan hệ thân thuộc (bố mẹ, anh em) hoặc cơ quan trường học thì có thể lược bỏ 的.',
    structureSummary: 'Định ngữ + 的 + N',
    examples: [
      { hanzi: '这是我的书。', pinyin: 'Zhè shì wǒ de shū.', vietnamese: 'Đây là sách của tôi.' },
      { hanzi: '他的电脑很好用。', pinyin: 'Tā de diànnǎo hěn hǎoyòng.', vietnamese: 'Máy tính của anh ấy rất dễ dùng.' },
      { hanzi: '我（的）爸爸是医生。', pinyin: 'Wǒ (de) bàba shì yīshēng.', vietnamese: 'Bố tôi là bác sĩ (thân thuộc lược bỏ 的).' },
    ],
    commonMistakes: [
      {
        wrong: '书我 (SAI)',
        correct: '我的书 (ĐÚNG)',
        reason: 'Người Việt hay dịch thuận "sách tôi" thành 书我. Trong tiếng Trung, định ngữ sở hữu PHẢI đứng trước danh từ trung tâm.',
      },
    ],
    practiceExercises: [
      {
        id: 'ex_hsk1_04_1',
        question: 'Dịch câu "Bạn học của tôi" sang tiếng Trung:',
        options: ['同学的我', '我的同学', '我同的学', '的我的同学'],
        correctAnswer: 1,
        explanation: 'Định ngữ (我) + 的 + Danh từ trung tâm (同学).',
      },
    ],
    notes: 'Quy tắc vàng: Cái gì sở hữu hoặc miêu tả đứng TRƯỚC, vật được sở hữu đứng SAU.',
    sortOrder: 4,
  },
  {
    id: 'gram_hsk1_05',
    level: 1,
    gfLevel: 'Sơ cấp Cấp 1',
    category: 'Câu tồn hiện',
    lessonId: 'hsk1-bai05',
    lessonNumber: 5,
    title: 'Động từ biểu thị sở hữu và tồn tại 有 (yǒu) — Có',
    pattern: 'Chủ ngữ + 有 + Tân ngữ / Địa điểm + 有 + Sự vật',
    positivePattern: 'S + 有 + O (Ví dụ: 我有一只猫。)',
    negativePattern: 'S + 没有 + O (Tuyệt đối KHÔNG dùng 不有)',
    interrogativePattern: 'S + 有没有 + O？ / S + 有 + O + 吗？',
    explanation: 'Dùng để biểu thị sở hữu (ai có cái gì) hoặc biểu thị sự tồn tại tại một nơi chốn nào đó. Chú ý: Phủ định của 有 BẮT BUỘC là 没有, tuyệt đối không được dùng 不有.',
    structureSummary: 'S + 有/没有 + O',
    examples: [
      { hanzi: '我有一本汉语词典。', pinyin: 'Wǒ yǒu yì běn Hànyǔ cídiǎn.', vietnamese: 'Tôi có một cuốn từ điển tiếng Trung.' },
      { hanzi: '桌子上有一杯热茶。', pinyin: 'Zhuōzi shang yǒu yì bēi rè chá.', vietnamese: 'Trên bàn có một ly trà nóng.' },
      { hanzi: '他没有中国朋友。', pinyin: 'Tā méiyǒu Zhōngguó péngyou.', vietnamese: 'Anh ấy không có bạn người Trung Quốc.' },
    ],
    commonMistakes: [
      {
        wrong: '我不有钱。(SAI HOÀN TOÀN)',
        correct: '我没有钱。(ĐÚNG)',
        reason: 'Trong tiếng Trung không bao giờ tồn tại 不有. Phủ định của 有 duy nhất là 没有.',
      },
    ],
    practiceExercises: [
      {
        id: 'ex_hsk1_05_1',
        question: 'Chọn câu phủ định chính xác:',
        options: ['他不有车。', '他没车。', '他不没有车。', '他没有是不车。'],
        correctAnswer: 1,
        explanation: '他没车 hoặc 他没有车 là đúng. Tuyệt đối không dùng 不有.',
      },
    ],
    notes: 'Phủ định của 有 duy nhất là 没有.',
    sortOrder: 5,
  },

  // ==========================================
  // HSK 2 (GF0025-2021 SƠ CẤP CẤP 2)
  // ==========================================
  {
    id: 'gram_hsk2_01',
    level: 2,
    gfLevel: 'Sơ cấp Cấp 2',
    category: 'Trợ từ động thái',
    lessonId: 'hsk2-bai01',
    lessonNumber: 1,
    title: 'Trợ từ động thái 了 (le) — Hoàn thành hành động',
    pattern: 'Động từ + 了 + (Tân ngữ / Số lượng)',
    positivePattern: 'S + V + 了 + O (Ví dụ: 我吃了早饭。)',
    negativePattern: 'S + 没(有) + V + O (Không dùng 了 trong câu phủ định)',
    interrogativePattern: 'S + V + 了 + O + 没有？ / S + V + O + 了吗？',
    explanation: 'Đặt ngay sau động từ để biểu thị hành động đã hoàn tất hoặc thực hiện xong. Chú ý: Khi phủ định, dùng 没(有) trước động từ và BỎ 了 ở sau.',
    structureSummary: 'S + V + 了 + O',
    examples: [
      { hanzi: '我买了三本书。', pinyin: 'Wǒ mǎi le sān běn shū.', vietnamese: 'Tôi đã mua 3 cuốn sách.' },
      { hanzi: '他喝了两杯咖啡。', pinyin: 'Tā hē le liǎng bēi kāfēi.', vietnamese: 'Anh ấy đã uống 2 ly cà phê.' },
      { hanzi: '我昨天没去上班。', pinyin: 'Wǒ zuótiān méi qù shàngbān.', vietnamese: 'Hôm qua tôi không đi làm (không dùng 了).' },
    ],
    commonMistakes: [
      {
        wrong: '我昨天没去了学校。(SAI)',
        correct: '我昨天没去学校。(ĐÚNG)',
        reason: 'Khi đã có phó từ phủ định 没(有), hành động chưa hoàn thành nên KHÔNG được dùng 了.',
      },
    ],
    practiceExercises: [
      {
        id: 'ex_hsk2_01_1',
        question: 'Chọn câu đúng diễn đạt "Tôi chưa ăn cơm":',
        options: ['我不吃饱了。', '我没吃了饭。', '我没有吃饭。', '我吃饭不了。'],
        correctAnswer: 2,
        explanation: 'Phủ định hành động chưa xảy ra dùng 没有 + V, không dùng 了.',
      },
    ],
    notes: 'Không nhầm lẫn 了 đặt sau động từ (động thái hoàn thành) với 了 ở cuối câu (ngữ khí biến hóa).',
    sortOrder: 6,
  },
  {
    id: 'gram_hsk2_02',
    level: 2,
    gfLevel: 'Sơ cấp Cấp 2',
    category: 'Câu nhấn mạnh',
    lessonId: 'hsk2-bai04',
    lessonNumber: 4,
    title: 'Cấu trúc nhấn mạnh 是……的 (shì... de)',
    pattern: 'Chủ ngữ + 是 + [Thời gian / Địa điểm / Phương thức] + Động từ + 的',
    positivePattern: 'S + 是 + [Nhấn mạnh] + V + 的',
    negativePattern: 'S + 不是 + [Nhấn mạnh] + V + 的',
    interrogativePattern: 'S + 是 + [Từ hỏi] + V + 的？',
    explanation: 'Dùng cho sự việc ĐÃ XẢY RA trong quá khứ nhằm nhấn mạnh thời gian, địa điểm, phương thức, mục đích hoặc người thực hiện hành động. Trong câu khẳng định, 是 có thể lược bỏ, nhưng 的 bắt buộc phải giữ lại. Trong câu phủ định, bắt buộc dùng 不是...的.',
    structureSummary: 'S + (是) + [Nhấn mạnh] + V + 的',
    examples: [
      { hanzi: '我是昨天来的。', pinyin: 'Wǒ shì zuótiān lái de.', vietnamese: 'Tôi tới vào ngày hôm qua (nhấn mạnh thời gian).' },
      { hanzi: '我们是在北京认识的。', pinyin: 'Wǒmen shì zài Běijīng rènshí de.', vietnamese: 'Chúng tôi quen nhau ở Bắc Kinh (nhấn mạnh địa điểm).' },
      { hanzi: '他是坐飞机去的。', pinyin: 'Tā shì zuò fēijī qù de.', vietnamese: 'Anh ấy đi bằng máy bay (nhấn mạnh phương thức).' },
      { hanzi: '这件衣服不是在商场买的。', pinyin: 'Zhè jiàn yīfu bú shì zài shāngchǎng mǎi de.', vietnamese: 'Bộ quần áo này không phải mua ở trung tâm thương mại.' },
    ],
    commonMistakes: [
      {
        wrong: '我是明天去的。(SAI)',
        correct: '我明天去。(ĐÚNG)',
        reason: 'Cấu trúc 是...的 chỉ dùng cho sự việc ĐÃ XẢY RA. Sự việc tương lai không dùng 是...的.',
      },
    ],
    practiceExercises: [
      {
        id: 'ex_hsk2_02_1',
        question: 'Dịch câu "Bạn đến đây bằng cách nào thế?" (nhấn mạnh phương thức):',
        options: ['你是怎么来的？', '你怎么来了？', '你怎么去的吗？', '是你怎么来吗？'],
        correctAnswer: 0,
        explanation: 'Cấu trúc 是...的 với từ hỏi phương thức 怎么: 你是(怎么)来的？',
      },
    ],
    notes: 'Chỉ dùng cho hành động ĐÃ XẢY RA để giải thích rõ chi tiết hoàn cảnh.',
    sortOrder: 7,
  },
  {
    id: 'gram_hsk2_03',
    level: 2,
    gfLevel: 'Sơ cấp Cấp 2',
    category: 'Câu so sánh',
    lessonId: 'hsk2-bai08',
    lessonNumber: 8,
    title: 'Câu so sánh hơn với 比 (bǐ) — Hơn',
    pattern: 'A + 比 + B + Tính từ / (Động từ + Tân ngữ)',
    positivePattern: 'A + 比 + B + Adj (+ 一点儿 / 得多 / 数量)',
    negativePattern: 'A + 没有 + B + (那么/这么) + Adj (Tuyệt đối không dùng A 不比 B)',
    interrogativePattern: 'A + 比 + B + Adj + 吗？ / A 和 B 哪个更 + Adj？',
    explanation: 'So sánh mức độ giữa hai đối tượng A và B. Chú ý: Tuyệt đối KHÔNG dùng các phó từ chỉ mức độ như 很, 非常, 真 trước tính từ trong câu chữ 比. Nếu muốn biểu thị mức độ chênh lệch, đặt 一点儿 (một chút) hoặc 得多 / 多了 (rất nhiều) ở SAU tính từ.',
    structureSummary: 'A + 比 + B + Adj (+ 得多/一点儿)',
    examples: [
      { hanzi: '今天比昨天冷。', pinyin: 'Jīntiān bǐ zuótiān lěng.', vietnamese: 'Hôm nay lạnh hơn hôm qua.' },
      { hanzi: '哥哥比弟弟高得多。', pinyin: 'Gēge bǐ dìdi gāo de duō.', vietnamese: 'Anh trai cao hơn em trai rất nhiều.' },
      { hanzi: '这件衣服比那件贵一点儿。', pinyin: 'Zhè jiàn yīfu bǐ nà jiàn guì yìdiǎnr.', vietnamese: 'Chiếc áo này đắt hơn chiếc kia một chút.' },
    ],
    commonMistakes: [
      {
        wrong: '今天比昨天很冷。(SAI NẶNG)',
        correct: '今天比昨天冷得多。(ĐÚNG)',
        reason: 'Tuyệt đối KHÔNG đặt 很, 非常 trước tính từ trong câu so sánh 比. Phải dùng 得多 hoặc 多了 ở sau tính từ.',
      },
      {
        wrong: '我不比他高。(Nghĩa là "tôi không cao hơn anh ấy", không mang nghĩa phủ định so sánh thường)',
        correct: '我没有他高。(ĐÚNG - Tôi không cao bằng anh ấy)',
        reason: 'Dạng phủ định tự nhiên của câu so sánh là A 没有 B + Adj (A không bằng B).',
      },
    ],
    practiceExercises: [
      {
        id: 'ex_hsk2_03_1',
        question: 'Câu nào sau đây dùng sai ngữ pháp câu so sánh 比?',
        options: ['他比我大两岁。', '汉语比英语很难。', '妹妹比姐姐瘦一点儿。', '这趟高铁比飞机便宜得多。'],
        correctAnswer: 1,
        explanation: 'Không được dùng 很 trước tính từ 难 trong câu có 比.',
      },
    ],
    notes: 'Quy tắc cấm kỵ: Tuyệt đối không dùng 很, 非常, 十分 đứng trước tính từ trong câu chữ 比.',
    sortOrder: 8,
  },

  // ==========================================
  // HSK 3 (GF0025-2021 TRUNG CẤP CẤP 3)
  // ==========================================
  {
    id: 'gram_hsk3_01',
    level: 3,
    gfLevel: 'Trung cấp Cấp 3',
    category: 'Câu chữ 把',
    lessonId: 'hsk3-bai12',
    lessonNumber: 12,
    title: 'Câu chữ 把 (bǎ) — Câu xử lý tân ngữ cơ bản',
    pattern: 'Chủ ngữ + 把 + Tân ngữ + Động từ + Thành phần khác (了/在/到/给...)',
    positivePattern: 'S + 把 + O + V + 成份 khác (Ví dụ: 我把作业做完了。)',
    negativePattern: 'S + 没(有) / 别 + 把 + O + V + 成份 khác (Đặt trước 把)',
    interrogativePattern: 'S + 把 + O + V + Thành phần khác + 了吗？',
    explanation: 'Dùng khi chủ ngữ tác động hoặc xử lý tân ngữ, khiến tân ngữ thay đổi vị trí, trạng thái hoặc kết quả. Điều kiện bắt buộc: Động từ không được đứng đơn độc mà phải có thành phần khác đi kèm (bổ ngữ kết quả, bổ ngữ xu hướng, 了, v.v.). Phó từ phủ định (没, 别) và động từ năng nguyện (想, 要, 能) phải đứng TRƯỚC 把.',
    structureSummary: 'S + (没/想) + 把 + O + V + Bổ ngữ/了',
    examples: [
      { hanzi: '请你把门关上。', pinyin: 'Qǐng nǐ bǎ mén guān shang.', vietnamese: 'Xin bạn hãy đóng cửa lại (关 + xu hướng 上).' },
      { hanzi: '我把作业做完了。', pinyin: 'Wǒ bǎ zuòyè zuò wán le.', vietnamese: 'Tôi đã làm xong bài tập về nhà rồi (做 + kết quả 完).' },
      { hanzi: '他把那本书放在桌子上了。', pinyin: 'Tā bǎ nà běn shū fàng zài zhuōzi shang le.', vietnamese: 'Anh ấy đã để cuốn sách đó ở trên bàn rồi.' },
      { hanzi: '你别把这件事告诉他。', pinyin: 'Nǐ bié bǎ zhè jiàn shì gàosu tā.', vietnamese: 'Bạn đừng nói chuyện này cho anh ấy biết.' },
    ],
    commonMistakes: [
      {
        wrong: '我把作业做。(SAI NẶNG)',
        correct: '我把作业做完了。(ĐÚNG)',
        reason: 'Động từ trong câu chữ 把 tuyệt đối không được đứng trơ trọi một mình. Bắt buộc có kết quả (完, 好) hoặc 了.',
      },
      {
        wrong: '我把药没吃。(SAI)',
        correct: '我没把药吃完。(ĐÚNG)',
        reason: 'Phó từ phủ định (没, 别) và trợ động từ (想, 能, 要) bắt buộc phải đứng TRƯỚC 把.',
      },
    ],
    practiceExercises: [
      {
        id: 'ex_hsk3_01_1',
        question: 'Chọn vị trí đúng của phó từ "没" trong câu: "(A) 他 (B) 把 (C) 衣服洗 (D) 干净。"',
        options: ['Vị trí (A)', 'Vị trí (B)', 'Vị trí (C)', 'Vị trí (D)'],
        correctAnswer: 1,
        explanation: 'Phó từ phủ định 没 phải đứng ngay trước chữ 把 (vị trí B): 他没把衣服洗干净。',
      },
    ],
    notes: 'Quy tắc 3 không của câu chữ 把: 1. Tân ngữ phải xác định. 2. Động từ không đứng trơ trọi. 3. Phủ định và năng nguyện đứng trước 把.',
    sortOrder: 9,
  },
  {
    id: 'gram_hsk3_02',
    level: 3,
    gfLevel: 'Trung cấp Cấp 3',
    category: 'Câu bị động',
    lessonId: 'hsk3-bai15',
    lessonNumber: 15,
    title: 'Câu bị động với 被 (bèi) — Bị / Được',
    pattern: 'Chủ ngữ (Kẻ chịu tác động) + 被 + (Tác nhân) + Động từ + Thành phần khác',
    positivePattern: 'Chịu tác động + 被 + (Tác nhân) + V + Bổ ngữ/了',
    negativePattern: 'Chịu tác động + 没(有) + 被 + (Tác nhân) + V + Bổ ngữ',
    interrogativePattern: 'Chịu tác động + 被 + Tác nhân + V + Thành phần khác + 吗？',
    explanation: 'Biểu thị chủ ngữ bị tác động hoặc gánh chịu một kết quả (thường mang sắc thái không mong muốn, hư hại, mất mát). Tác nhân có thể lược bỏ (ví dụ: 蛋糕被吃了). Động từ cũng không được đứng đơn độc mà phải kèm kết quả hoặc 了. Phó từ phủ định 没(有) phải đứng trước 被.',
    structureSummary: 'O + (没) + 被 + (S) + V + Kết quả/了',
    examples: [
      { hanzi: '我的自行车被小偷偷走了。', pinyin: 'Wǒ de zìxíngchē bèi xiǎotōu tōu zǒu le.', vietnamese: 'Xe đạp của tôi bị kẻ trộm lấy cắp mất rồi.' },
      { hanzi: '桌上的苹果被弟弟吃完了。', pinyin: 'Zhuō shang de píngguǒ bèi dìdi chī wán le.', vietnamese: 'Táo trên bàn đã bị em trai ăn hết rồi.' },
      { hanzi: '钱包被找到了。', pinyin: 'Qiánbāo bèi zhǎodào le.', vietnamese: 'Ví tiền đã được tìm thấy rồi (lược bỏ tác nhân).' },
    ],
    commonMistakes: [
      {
        wrong: '手机被摔坏没有。(SAI)',
        correct: '手机没被摔坏。(ĐÚNG)',
        reason: 'Phủ định câu chữ 被 dùng 没 đứng trước 被, không dùng 沒有 ở cuối câu.',
      },
    ],
    practiceExercises: [
      {
        id: 'ex_hsk3_02_1',
        question: 'Chuyển câu sau sang câu bị động: "小狗吃光了盘子里的肉。"',
        options: [
          '盘子里的肉被小狗吃光了。',
          '小狗被盘子里的肉吃光了。',
          '盘子里的肉吃光了被小狗。',
          '肉被盘子里吃光了小狗。',
        ],
        correctAnswer: 0,
        explanation: 'Chủ thể chịu tác động (盘子里的肉) + 被 + Tác nhân (小狗) + V (吃光了).',
      },
    ],
    notes: 'Khác với tiếng Việt dùng "được" thoải mái, câu chữ 被 tiếng Trung ban đầu dùng cho sắc thái tiêu cực hoặc bất lợi.',
    sortOrder: 10,
  },
  {
    id: 'gram_hsk3_03',
    level: 3,
    gfLevel: 'Trung cấp Cấp 3',
    category: 'Bổ ngữ',
    lessonId: 'hsk3-bai18',
    lessonNumber: 18,
    title: 'Bổ ngữ khả năng: V + 得 / 不 + Bổ ngữ kết quả / xu hướng',
    pattern: 'Khẳng định: V + 得 + C | Phủ định: V + 不 + C',
    positivePattern: 'V + 得 + Kết quả/Xu hướng (Ví dụ: 我看得到。)',
    negativePattern: 'V + 不 + Kết quả/Xu hướng (Ví dụ: 我听不懂。)',
    interrogativePattern: 'V + 得 + C + V + 不 + C？ / V + 得 + C + 吗？',
    explanation: 'Dùng để biểu thị điều kiện chủ quan hoặc khách quan có cho phép hành động đạt được kết quả hay không. Chú ý: Phủ định dùng V + 不 + C, tuyệt đối không dùng 不能 + V + C để thay thế cho thói quen khẩu ngữ.',
    structureSummary: 'V + 得/不 + C (懂, 见, 完, 动, 了)',
    examples: [
      { hanzi: '老师说得太快，我听不懂。', pinyin: 'Lǎoshī shuō de tài kuài, wǒ tīng bu dǒng.', vietnamese: 'Thầy giáo nói nhanh quá, tôi nghe không hiểu.' },
      { hanzi: '这么多菜，你吃得完吗？', pinyin: 'Zhème duō cài, nǐ chī de wán ma?', vietnamese: 'Nhiều món thế này, bạn ăn có hết được không?' },
      { hanzi: '这个箱子太重了，我拿不动。', pinyin: 'Zhè ge xiāngzi tài zhòng le, wǒ ná bu dòng.', vietnamese: 'Chiếc vali này nặng quá, tôi xách không nổi.' },
    ],
    commonMistakes: [
      {
        wrong: '我不能听懂。(Gượng gạo)',
        correct: '我听不懂。(Tự nhiên chuẩn xác)',
        reason: 'Trong tiếng Trung đời sống, khi nói về năng lực tiếp thu hoặc kết quả không đạt được, luôn ưu tiên bổ ngữ khả năng 听不懂.',
      },
    ],
    practiceExercises: [
      {
        id: 'ex_hsk3_03_1',
        question: 'Dịch câu "Bạn nhìn thấy rõ chữ trên bảng không?":',
        options: ['你看得清楚黑板上的字吗？', '你能看清楚不黑板上的字？', '你看清楚得黑板上的字吗？', '你看不能清楚黑板上的字？'],
        correctAnswer: 0,
        explanation: 'Khẳng định khả năng nghi vấn: 看得清楚 + 吗？',
      },
    ],
    notes: 'Các cặp phổ biến: 看得懂/看不懂 (hiểu), 听得见/听不见 (nghe thấy), 做得完/做不完 (làm xong).',
    sortOrder: 11,
  },

  // ==========================================
  // HSK 4 (GF0025-2021 TRUNG CẤP CẤP 4)
  // ==========================================
  {
    id: 'gram_hsk4_01',
    level: 4,
    gfLevel: 'Trung cấp Cấp 4',
    category: 'Liên từ kết hợp',
    lessonId: 'hsk4-bai03',
    lessonNumber: 3,
    title: 'Cấu trúc tiến tầng 不仅……而且…… (bùjǐn... érqiě...) — Không những... mà còn...',
    pattern: 'Chủ ngữ + 不仅……，而且…… | 不仅 + S1……，S2 + 也/而且……',
    positivePattern: 'S + 不仅 + V1/Adj1，而且 (还/也) + V2/Adj2',
    negativePattern: '不仅 không đi liền câu phủ định kép',
    interrogativePattern: 'Thường dùng trong câu khẳng định tiến tầng',
    explanation: 'Biểu thị quan hệ tăng tiến từ thấp đến cao (không chỉ có vậy, mà còn phát triển hơn thế). Nếu hai vế cùng một chủ ngữ, chủ ngữ đứng TRƯỚC 不仅. Nếu hai vế khác chủ ngữ, 不仅 phải đứng TRƯỚC chủ ngữ của vế 1.',
    structureSummary: 'S + 不仅……，而且/还……',
    examples: [
      { hanzi: '他不仅汉语说得流利，而且还会说法语。', pinyin: 'Tā bùjǐn Hànyǔ shuō de liúlì, érqiě hái huì shuō Fǎyǔ.', vietnamese: 'Anh ấy không những nói tiếng Trung lưu loát, mà còn biết nói tiếng Pháp (cùng chủ ngữ 他).' },
      { hanzi: '不仅我喜欢中国菜，我的家人们也都很喜欢。', pinyin: 'Bùjǐn wǒ xǐhuan Zhōngguó cài, wǒ de jiārénmen yě dōu hěn xǐhuan.', vietnamese: 'Không những tôi thích món Trung Quốc, mà các thành viên trong nhà tôi cũng đều rất thích (khác chủ ngữ).' },
      { hanzi: '这家餐厅不仅菜品好吃，而且环境也很优雅。', pinyin: 'Zhè jiā cāntīng bùjǐn càipǐn hǎochī, érqiě huánjìng yě hěn yōuyǎ.', vietnamese: 'Nhà hàng này không những đồ ăn ngon, mà không gian cũng rất tao nhã.' },
    ],
    commonMistakes: [
      {
        wrong: '我不仅喜欢，而且他也很喜欢。(SAI VỊ TRÍ CHỦ NGỮ)',
        correct: '不仅我喜欢，而且他也很喜欢。(ĐÚNG)',
        reason: 'Khi hai vế khác chủ ngữ (我 và 他), 不仅 bắt buộc phải đứng trước chủ ngữ vế đầu.',
      },
    ],
    practiceExercises: [
      {
        id: 'ex_hsk4_01_1',
        question: 'Chọn câu có trật tự từ chuẩn xác:',
        options: [
          '不仅小王会开车，而且小李也会。',
          '小王不仅会开车，而且小李也会。',
          '会开车不仅小王，而且小李也。',
          '小王小李不仅开车而且也会。',
        ],
        correctAnswer: 0,
        explanation: 'Khác chủ ngữ (小王 vs 小李) thì 不仅 phải đứng đầu câu trước chủ ngữ 1.',
      },
    ],
    notes: 'Quy tắc vàng: Cùng chủ ngữ đứng sau, khác chủ ngữ đứng trước.',
    sortOrder: 12,
  },
  {
    id: 'gram_hsk4_02',
    level: 4,
    gfLevel: 'Trung cấp Cấp 4',
    category: 'Câu nhấn mạnh',
    lessonId: 'hsk4-bai07',
    lessonNumber: 7,
    title: 'Cấu trúc nhấn mạnh cực đoan 连……也 / 都…… (lián... yě/dōu...) — Ngay cả... cũng...',
    pattern: '连 + Thành phần cực đoan + 都 / 也 + Động từ / Tính từ',
    positivePattern: '连 + Danh từ/Mệnh đề + 都/也 + V/Adj',
    negativePattern: '连 + Danh từ + 都/也 + 不/没 + V (Ví dụ: 连一口水都没喝)',
    interrogativePattern: '你连这个都不知道吗？',
    explanation: 'Dùng để nhấn mạnh một sự việc cực đoan hoặc bất thường, từ đó ngụ ý rằng các sự việc thông thường khác hiển nhiên cũng như vậy (Ngay cả/Đến cả ... cũng/đều ...). Vế sau bắt buộc phải có 都 hoặc 也.',
    structureSummary: '连 + Cực đoan + 都/也 + V/Adj',
    examples: [
      { hanzi: '这个问题太简单了，连小孩子都明白。', pinyin: 'Zhè ge wèntí tài jiǎndān le, lián xiǎoháizi dōu míngbai.', vietnamese: 'Vấn đề này đơn giản quá, ngay cả trẻ con cũng hiểu.' },
      { hanzi: '他太忙了，连午饭都没时间吃。', pinyin: 'Tā tài máng le, lián wǔfàn dōu méi shíjiān chī.', vietnamese: 'Anh ấy bận quá, ngay cả cơm trưa cũng không có thời gian ăn.' },
      { hanzi: '你怎么连一句谢谢都没说就走了？', pinyin: 'Nǐ zěnme lián yí jù xièxie dōu méi shuō jiù zǒu le?', vietnamese: 'Sao bạn ngay cả một câu cảm ơn cũng chưa nói mà đã đi rồi?' },
    ],
    commonMistakes: [
      {
        wrong: '连小孩子明白。(SAI THIẾU LIÊN TỪ)',
        correct: '连小孩子都明白。(ĐÚNG)',
        reason: 'Sau thành phần đi với 连, bắt buộc phải có 都 hoặc 也 đi kèm.',
      },
    ],
    practiceExercises: [
      {
        id: 'ex_hsk4_02_1',
        question: 'Điền từ còn thiếu: "他太累了，回到家 ___ 衣服都没脱就睡着了。"',
        options: ['连', '把', '被', '向'],
        correctAnswer: 0,
        explanation: 'Cấu trúc 连...也/都: 连衣服都没脱就睡着了。',
      },
    ],
    notes: 'Thường kết hợp với số từ + lượng từ tối thiểu (连一个字都没写, 连一分钱都没有).',
    sortOrder: 13,
  },

  // ==========================================
  // HSK 5 (GF0025-2021 CAO CẤP CẤP 5)
  // ==========================================
  {
    id: 'gram_hsk5_01',
    level: 5,
    gfLevel: 'Cao cấp Cấp 5',
    category: 'Liên từ thư văn',
    lessonId: 'hsk5-bai02',
    lessonNumber: 2,
    title: 'Liên từ kết quả 从而 (cóng\'ér) — Từ đó / Nhờ đó',
    pattern: 'Hành động / Biện pháp + ，从而 + Kết quả / Mục đích sâu xa',
    positivePattern: 'Tiền đề/Hành động，从而 + Kết quả tích cực',
    negativePattern: 'Ít dùng trong mệnh đề phủ định trực tiếp',
    interrogativePattern: 'Thường dùng trong văn viết nghị luận',
    explanation: 'Dùng trong văn viết chính luận hoặc học thuật, nối hai phân câu. Phân câu trước nêu ra phương pháp, hành động hoặc tiền đề; 从而 đứng đầu phân câu sau để biểu thị kết quả tất yếu hoặc mục đích tiếp theo đạt được nhờ hành động đó.',
    structureSummary: 'Biện pháp/Hành động，从而 + Kết quả/Phát triển',
    examples: [
      { hanzi: '公司优化了管理流程，从而大幅提高了生产效率。', pinyin: 'Gōngsī yōuhuà le guǎnlǐ liúchéng, cóng\'ér dàfú tígāo le shēngchǎn xiàolǜ.', vietnamese: 'Công ty đã tối ưu hóa quy trình quản lý, từ đó nâng cao đáng kể hiệu suất sản xuất.' },
      { hanzi: '多阅读优秀的书籍可以开阔眼界，从而丰富我们的内心世界。', pinyin: 'Duō yuèdú yōuxiù de shūjí kěyǐ kāikuò yǎnjiè, cóng\'ér fēngfù wǒmen de nèixīn shìjiè.', vietnamese: 'Đọc nhiều sách hay có thể mở rộng tầm mắt, nhờ đó làm phong phú thế giới nội tâm của chúng ta.' },
      { hanzi: '双方加强了沟通与交流，从而消除了长期存在的误解。', pinyin: 'Shuāngfāng jiāqiáng le gōutōng yǔ jiāoliú, cóng\'ér xiāochú le chángqī cúnzài de wùjiě.', vietnamese: 'Hai bên đã tăng cường trao đổi và giao lưu, từ đó xóa bỏ những hiểu lầm tồn tại bấy lâu.' },
    ],
    commonMistakes: [
      {
        wrong: '因为天气不好，从而运动会取消了。(SAI NGỮ NGHĨA)',
        correct: '因为天气不好，所以运动会取消了。(ĐÚNG)',
        reason: '从而 không tương đương với 所以 trong quan hệ nhân quả đời thường. 从而 chỉ dùng khi vế trước là phương thức/biện pháp tích cực dẫn đến kết quả tiến triển.',
      },
    ],
    practiceExercises: [
      {
        id: 'ex_hsk5_01_1',
        question: 'Chọn liên từ thích hợp: "政府加大了环保投资，___ 明显改善了城市的空气质量。"',
        options: ['从而', '与其', '固然', '反而'],
        correctAnswer: 0,
        explanation: 'Biện pháp (加大环保投资) dẫn tới kết quả phát triển tiếp nối (改善空气质量), dùng 从而.',
      },
    ],
    notes: '从而 = 由此而 (từ cái này mà dẫn tới cái kia), đặc trưng phong cách thư diện văn viết (书面语).',
    sortOrder: 14,
  },

  // ==========================================
  // HSK 6 (GF0025-2021 CAO CẤP CẤP 6)
  // ==========================================
  {
    id: 'gram_hsk6_01',
    level: 6,
    gfLevel: 'Cao cấp Cấp 6',
    category: 'Phó từ thư văn cao cấp',
    lessonId: 'hsk6-bai05',
    lessonNumber: 5,
    title: 'Phó từ suy đoán tất yếu 势必 (shìbì) — Chắc chắn / Ắt hẳn sẽ',
    pattern: 'Nguyên nhân / Tình thế + ，势必 + (会) + Kết quả tất yếu khó tránh',
    positivePattern: 'Tiền đề tình thế，势必 (会) + Hệ quả',
    negativePattern: 'Ít dùng trong ngữ cảnh phủ định đơn thuần',
    interrogativePattern: 'Thường dùng trong nghị luận phân tích xu thế',
    explanation: 'Biểu thị theo đà phát triển của tình thế khách quan thì một kết quả hoặc hệ quả nào đó là điều tất yếu, không thể tránh khỏi (thường là những hậu quả nghiêm trọng hoặc tác động to lớn). Tương đương với "必然", "必定".',
    structureSummary: 'Tình thế khách quan，势必 + Hệ quả tất yếu',
    examples: [
      { hanzi: '如果不及时遏制通货膨胀，势必会影响社会的整体稳定。', pinyin: 'Rúguǒ bù jíshí èzhì tōnghuò péngzhàng, shìbì huì yǐngxiǎng shèhuì de zhěngtǐ wěndìng.', vietnamese: 'Nếu không kịp thời kiềm chế lạm phát, ắt hẳn sẽ ảnh hưởng đến sự ổn định chung của xã hội.' },
      { hanzi: '科技的飞速发展，势必带来传统产业格局的深刻重塑。', pinyin: 'Kējì de fēisù fāzhǎn, shìbì dàilái chuántǒng chǎnyè géjú de shēnkè chóngsù.', vietnamese: 'Khoa học công nghệ phát triển như vũ bão chắc chắn sẽ định hình lại sâu sắc cục diện các ngành công nghiệp truyền thống.' },
      { hanzi: '盲目扩张生产规模，势必造成产能过剩与资金链断裂。', pinyin: 'Mángmù kuòzhāng shēngchǎn guīmó, shìbì zàochéng chǎnnéng guòshèng yǔ zījīnliàn duànliè.', vietnamese: 'Mở rộng quy mô sản xuất một cách mù quáng ắt sẽ gây ra dư thừa công suất và đứt gãy dòng tiền.' },
    ],
    commonMistakes: [
      {
        wrong: '明天势必会下雨，你带伞吧。(SAI PHONG CÁCH)',
        correct: '明天肯定会下雨，你带伞吧。(ĐÚNG)',
        reason: '势必 là từ ngữ văn viết cao cấp (书面语), dùng cho xu thế xã hội, kinh tế hoặc biến động lớn; không dùng cho việc thời tiết sinh hoạt hàng ngày.',
      },
    ],
    practiceExercises: [
      {
        id: 'ex_hsk6_01_1',
        question: 'Chọn từ chính xác điền vào câu phân tích kinh tế: "全球供应链中断，___ 引发大宗商品价格的持续攀升。"',
        options: ['势必', '索性', '未免', '权且'],
        correctAnswer: 0,
        explanation: 'Tình thế (gián đoạn chuỗi cung ứng) ắt hẳn kéo theo kết quả tất yếu (giá hàng hóa tăng), dùng 势必.',
      },
    ],
    notes: '势必 = 根据客观形势，必定如此 (dựa theo thế cục khách quan, ắt hẳn như vậy).',
    sortOrder: 15,
  },
];

export class GrammarRepository {
  private hsk3Catalog: GrammarPoint[] = (hsk3CatalogData as any) || [];
  private hsk2Catalog: GrammarPoint[] = (hsk2CatalogData && (hsk2CatalogData as any).length > 0)
    ? (hsk2CatalogData as any)
    : AUTHORITATIVE_GRAMMAR_POINTS;
  private cache: GrammarPoint[] = [
    ...((hsk3CatalogData as any) || []),
    ...AUTHORITATIVE_GRAMMAR_POINTS,
  ];

  public getByVersionAndLevel(version: 'hsk2' | 'hsk3', level?: number | 'all'): GrammarPoint[] {
    const list = version === 'hsk3' ? this.hsk3Catalog : this.hsk2Catalog;
    if (!level || level === 'all') return list;
    return list.filter((g) => (g.normalizedLevel || g.level) === level);
  }

  public getAll(version?: 'hsk2' | 'hsk3'): GrammarPoint[] {
    if (version === 'hsk3') return this.hsk3Catalog;
    if (version === 'hsk2') return this.hsk2Catalog;
    return this.cache;
  }

  public getByLevel(level: number, version: 'hsk2' | 'hsk3' = 'hsk2'): GrammarPoint[] {
    return this.getByVersionAndLevel(version, level);
  }

  public getById(id: string): GrammarPoint | undefined {
    return (
      this.hsk3Catalog.find((g) => g.id === id) ||
      this.hsk2Catalog.find((g) => g.id === id) ||
      this.cache.find((g) => g.id === id)
    );
  }

  public search(query: string, level?: number, version?: 'hsk2' | 'hsk3'): GrammarPoint[] {
    const q = query.toLowerCase().trim();
    const sourceList =
      version === 'hsk3'
        ? this.hsk3Catalog
        : version === 'hsk2'
        ? this.hsk2Catalog
        : this.cache;

    return sourceList.filter((g) => {
      const matchLevel =
        level === undefined || level === 0 || (g.normalizedLevel || g.level) === level;
      if (!matchLevel) return false;
      if (!q) return true;
      return (
        g.title.toLowerCase().includes(q) ||
        g.pattern.toLowerCase().includes(q) ||
        g.explanation.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        (g.subCategory && g.subCategory.toLowerCase().includes(q)) ||
        (g.meaningVi && g.meaningVi.toLowerCase().includes(q)) ||
        g.examples.some(
          (ex) =>
            ex.hanzi.includes(q) ||
            (ex.vietnamese && ex.vietnamese.toLowerCase().includes(q))
        )
      );
    });
  }

  public async fetchServer(): Promise<GrammarPoint[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return this.cache;

    try {
      const { data, error } = await (supabase as any)
        .from('hsk_grammar_points')
        .select('*')
        .order('level', { ascending: true })
        .order('sort_order', { ascending: true });

      if (!error && data && data.length > 0) {
        // Merge server data with authoritative base
        const serverPoints: GrammarPoint[] = data.map((d: any) => ({
          id: d.id,
          level: d.level,
          gfLevel: d.gf_level || `HSK ${d.level}`,
          category: d.category || 'Ngữ pháp',
          title: d.title,
          pattern: d.pattern,
          positivePattern: d.positive_pattern,
          negativePattern: d.negative_pattern,
          interrogativePattern: d.interrogative_pattern,
          explanation: d.explanation,
          structureSummary: d.structure_summary,
          examples: d.examples || [],
          commonMistakes: d.common_mistakes || [],
          practiceExercises: d.practice_exercises || [],
          notes: d.notes,
          sortOrder: d.sort_order,
        }));
        this.cache = [...serverPoints, ...this.hsk3Catalog];
        return this.cache;
      }
    } catch {
      // Offline fallback
    }

    return this.cache;
  }
}

export const grammarRepository = new GrammarRepository();

