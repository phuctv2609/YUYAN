/**
 * YUYAN Exam Repository — Version-Aware HSK Exam Engine
 * Dedicated data access for HSK 2.0 (Levels 1–6) & HSK 3.0 (Levels 1–9 / Band 7–9).
 * Supports official section configurations, timing, autosave sessions, and deterministic scoring.
 */

import { getSupabaseClient, getLearnerSessionId } from '../../services/supabase/client';
import {
  OFFICIAL_EXAM_PAPERS,
  OFFICIAL_EXAM_SOURCES,
  getExamCoverageSummary,
  ExamPaperMetadata,
} from '../exam/examPapersInventory';

export type HskExamVersion = 'hsk2' | 'hsk3';
export type ExamSectionId = 'listening' | 'reading' | 'writing';

export interface ExamQuestion {
  id: number;
  hskVersion: HskExamVersion;
  hskLevel: number;
  section: ExamSectionId;
  question: string;
  type: 'hanzi_pinyin' | 'meaning' | 'fill' | 'reading' | 'listening' | 'writing';
  audioPrompt?: string; // Text to be vocalized for listening items
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface ExamSectionConfig {
  id: ExamSectionId;
  title: string;
  questionCount: number;
  durationMinutes: number;
  maxScore: number;
}

export interface ExamTemplateConfig {
  version: HskExamVersion;
  level: number;
  titleZh: string;
  titleVi: string;
  syllabusStandard: string;
  durationMinutes: number;
  passingScore: number;
  maxScore: number;
  sections: ExamSectionConfig[];
}

export interface ExamAttemptRecord {
  id?: string;
  userId: string;
  hskVersion: HskExamVersion;
  hskLevel: number;
  score: number;
  sectionScores?: Record<ExamSectionId, number>;
  totalQuestions: number;
  timeSpentSeconds: number;
  answers: Record<number, number>;
  passed: boolean;
  createdAt?: string;
}

export interface ActiveExamSession {
  version: HskExamVersion;
  level: number;
  startedAt: number;
  durationSeconds: number;
  timeLeft: number;
  currentQuestionIndex: number;
  answers: Record<number, number>;
  flaggedQuestionIds: number[];
}

export const EXAM_TEMPLATES: Record<HskExamVersion, Record<number, ExamTemplateConfig>> = {
  hsk2: {
    1: {
      version: 'hsk2',
      level: 1,
      titleZh: 'HSK 2.0 一级',
      titleVi: 'HSK 2.0 Cấp độ 1',
      syllabusStandard: 'Hanban 2015 HSK 2.0 Standard',
      durationMinutes: 40,
      passingScore: 120,
      maxScore: 200,
      sections: [
        { id: 'listening', title: 'Phần Nghe (听力)', questionCount: 20, durationMinutes: 15, maxScore: 100 },
        { id: 'reading', title: 'Phần Đọc (阅读)', questionCount: 20, durationMinutes: 17, maxScore: 100 },
      ],
    },
    2: {
      version: 'hsk2',
      level: 2,
      titleZh: 'HSK 2.0 二级',
      titleVi: 'HSK 2.0 Cấp độ 2',
      syllabusStandard: 'Hanban 2015 HSK 2.0 Standard',
      durationMinutes: 55,
      passingScore: 120,
      maxScore: 200,
      sections: [
        { id: 'listening', title: 'Phần Nghe (听力)', questionCount: 35, durationMinutes: 25, maxScore: 100 },
        { id: 'reading', title: 'Phần Đọc (阅读)', questionCount: 25, durationMinutes: 22, maxScore: 100 },
      ],
    },
    3: {
      version: 'hsk2',
      level: 3,
      titleZh: 'HSK 2.0 三级',
      titleVi: 'HSK 2.0 Cấp độ 3',
      syllabusStandard: 'Hanban 2015 HSK 2.0 Standard',
      durationMinutes: 90,
      passingScore: 180,
      maxScore: 300,
      sections: [
        { id: 'listening', title: 'Phần Nghe (听力)', questionCount: 40, durationMinutes: 35, maxScore: 100 },
        { id: 'reading', title: 'Phần Đọc (阅读)', questionCount: 30, durationMinutes: 30, maxScore: 100 },
        { id: 'writing', title: 'Phần Viết (书写)', questionCount: 10, durationMinutes: 15, maxScore: 100 },
      ],
    },
    4: {
      version: 'hsk2',
      level: 4,
      titleZh: 'HSK 2.0 四级',
      titleVi: 'HSK 2.0 Cấp độ 4',
      syllabusStandard: 'Hanban 2015 HSK 2.0 Standard',
      durationMinutes: 105,
      passingScore: 180,
      maxScore: 300,
      sections: [
        { id: 'listening', title: 'Phần Nghe (听力)', questionCount: 45, durationMinutes: 30, maxScore: 100 },
        { id: 'reading', title: 'Phần Đọc (阅读)', questionCount: 40, durationMinutes: 40, maxScore: 100 },
        { id: 'writing', title: 'Phần Viết (书写)', questionCount: 15, durationMinutes: 25, maxScore: 100 },
      ],
    },
    5: {
      version: 'hsk2',
      level: 5,
      titleZh: 'HSK 2.0 五级',
      titleVi: 'HSK 2.0 Cấp độ 5',
      syllabusStandard: 'Hanban 2015 HSK 2.0 Standard',
      durationMinutes: 125,
      passingScore: 180,
      maxScore: 300,
      sections: [
        { id: 'listening', title: 'Phần Nghe (听力)', questionCount: 45, durationMinutes: 30, maxScore: 100 },
        { id: 'reading', title: 'Phần Đọc (阅读)', questionCount: 45, durationMinutes: 45, maxScore: 100 },
        { id: 'writing', title: 'Phần Viết (书写)', questionCount: 10, durationMinutes: 40, maxScore: 100 },
      ],
    },
    6: {
      version: 'hsk2',
      level: 6,
      titleZh: 'HSK 2.0 六级',
      titleVi: 'HSK 2.0 Cấp độ 6',
      syllabusStandard: 'Hanban 2015 HSK 2.0 Standard',
      durationMinutes: 140,
      passingScore: 180,
      maxScore: 300,
      sections: [
        { id: 'listening', title: 'Phần Nghe (听力)', questionCount: 50, durationMinutes: 35, maxScore: 100 },
        { id: 'reading', title: 'Phần Đọc (阅读)', questionCount: 50, durationMinutes: 50, maxScore: 100 },
        { id: 'writing', title: 'Phần Viết (书写)', questionCount: 1, durationMinutes: 45, maxScore: 100 },
      ],
    },
  },
  hsk3: {
    1: {
      version: 'hsk3',
      level: 1,
      titleZh: 'HSK 3.0 一级',
      titleVi: 'HSK 3.0 Cấp 1 (Sơ cấp 1)',
      syllabusStandard: 'GF0025-2021 Tiêu chuẩn Quốc tế mới',
      durationMinutes: 40,
      passingScore: 120,
      maxScore: 200,
      sections: [
        { id: 'listening', title: 'Phần Nghe (听力)', questionCount: 20, durationMinutes: 15, maxScore: 100 },
        { id: 'reading', title: 'Phần Đọc (阅读)', questionCount: 20, durationMinutes: 20, maxScore: 100 },
      ],
    },
    2: {
      version: 'hsk3',
      level: 2,
      titleZh: 'HSK 3.0 二级',
      titleVi: 'HSK 3.0 Cấp 2 (Sơ cấp 2)',
      syllabusStandard: 'GF0025-2021 Tiêu chuẩn Quốc tế mới',
      durationMinutes: 55,
      passingScore: 120,
      maxScore: 200,
      sections: [
        { id: 'listening', title: 'Phần Nghe (听力)', questionCount: 30, durationMinutes: 25, maxScore: 100 },
        { id: 'reading', title: 'Phần Đọc (阅读)', questionCount: 30, durationMinutes: 25, maxScore: 100 },
      ],
    },
    3: {
      version: 'hsk3',
      level: 3,
      titleZh: 'HSK 3.0 三级',
      titleVi: 'HSK 3.0 Cấp 3 (Sơ cấp 3)',
      syllabusStandard: 'GF0025-2021 Tiêu chuẩn Quốc tế mới',
      durationMinutes: 90,
      passingScore: 180,
      maxScore: 300,
      sections: [
        { id: 'listening', title: 'Phần Nghe (听力)', questionCount: 40, durationMinutes: 35, maxScore: 100 },
        { id: 'reading', title: 'Phần Đọc (阅读)', questionCount: 30, durationMinutes: 30, maxScore: 100 },
        { id: 'writing', title: 'Phần Viết (书写)', questionCount: 10, durationMinutes: 15, maxScore: 100 },
      ],
    },
    4: {
      version: 'hsk3',
      level: 4,
      titleZh: 'HSK 3.0 四级',
      titleVi: 'HSK 3.0 Cấp 4 (Trung cấp 1)',
      syllabusStandard: 'GF0025-2021 Tiêu chuẩn Quốc tế mới',
      durationMinutes: 105,
      passingScore: 180,
      maxScore: 300,
      sections: [
        { id: 'listening', title: 'Phần Nghe (听力)', questionCount: 40, durationMinutes: 30, maxScore: 100 },
        { id: 'reading', title: 'Phần Đọc (阅读)', questionCount: 40, durationMinutes: 40, maxScore: 100 },
        { id: 'writing', title: 'Phần Viết (书写)', questionCount: 15, durationMinutes: 25, maxScore: 100 },
      ],
    },
    5: {
      version: 'hsk3',
      level: 5,
      titleZh: 'HSK 3.0 五级',
      titleVi: 'HSK 3.0 Cấp 5 (Trung cấp 2)',
      syllabusStandard: 'GF0025-2021 Tiêu chuẩn Quốc tế mới',
      durationMinutes: 125,
      passingScore: 180,
      maxScore: 300,
      sections: [
        { id: 'listening', title: 'Phần Nghe (听力)', questionCount: 45, durationMinutes: 30, maxScore: 100 },
        { id: 'reading', title: 'Phần Đọc (阅读)', questionCount: 45, durationMinutes: 45, maxScore: 100 },
        { id: 'writing', title: 'Phần Viết (书写)', questionCount: 10, durationMinutes: 40, maxScore: 100 },
      ],
    },
    6: {
      version: 'hsk3',
      level: 6,
      titleZh: 'HSK 3.0 六级',
      titleVi: 'HSK 3.0 Cấp 6 (Trung cấp 3)',
      syllabusStandard: 'GF0025-2021 Tiêu chuẩn Quốc tế mới',
      durationMinutes: 140,
      passingScore: 180,
      maxScore: 300,
      sections: [
        { id: 'listening', title: 'Phần Nghe (听力)', questionCount: 50, durationMinutes: 35, maxScore: 100 },
        { id: 'reading', title: 'Phần Đọc (阅读)', questionCount: 50, durationMinutes: 50, maxScore: 100 },
        { id: 'writing', title: 'Phần Viết (书写)', questionCount: 5, durationMinutes: 45, maxScore: 100 },
      ],
    },
    7: {
      version: 'hsk3',
      level: 7,
      titleZh: 'HSK 3.0 七至九级',
      titleVi: 'HSK 3.0 Cấp cao (Cấp 7–9 gom dải)',
      syllabusStandard: 'GF0025-2021 Cấp độ Cao cấp Tích hợp',
      durationMinutes: 210,
      passingScore: 180,
      maxScore: 300,
      sections: [
        { id: 'listening', title: 'Phần Nghe Chuyên sâu (听力)', questionCount: 40, durationMinutes: 40, maxScore: 100 },
        { id: 'reading', title: 'Phần Đọc Phân tích (阅读)', questionCount: 40, durationMinutes: 60, maxScore: 100 },
        { id: 'writing', title: 'Phần Luận & Dịch thuật (书写与翻译)', questionCount: 10, durationMinutes: 80, maxScore: 100 },
      ],
    },
  },
};

// Authoritative Questions Dataset across HSK 2.0 & HSK 3.0
export const MASTER_EXAM_QUESTIONS: ExamQuestion[] = [
  // HSK 2.0 Level 1
  {
    id: 101,
    hskVersion: 'hsk2',
    hskLevel: 1,
    section: 'listening',
    question: '[Nghe hiểu] Người nói nói câu: "你好！很高兴认识你。"',
    audioPrompt: '你好！很高兴认识你。',
    type: 'listening',
    options: ['Xin chào, rất vui được gặp bạn.', 'Tạm biệt, hẹn gặp lại ngày mai.', 'Cảm ơn bạn rất nhiều.', 'Tôi là người Việt Nam.'],
    correctAnswer: 0,
    explanation: '"很高兴认识你" là khẩu ngữ chào hỏi lịch sự: Rất vui được làm quen với bạn.',
  },
  {
    id: 102,
    hskVersion: 'hsk2',
    hskLevel: 1,
    section: 'listening',
    question: '[Nghe hiểu] Người nói nói: "他今天不去看电影。"',
    audioPrompt: '他今天不去看电影。',
    type: 'listening',
    options: ['Hôm nay anh ấy đi xem phim.', 'Hôm nay anh ấy không đi xem phim.', 'Anh ấy muốn đi xem phim ngày mai.', 'Anh ấy thích xem phim.'],
    correctAnswer: 1,
    explanation: 'Có phó từ phủ định "不" trước cụm động từ "去 看 电影".',
  },
  {
    id: 103,
    hskVersion: 'hsk2',
    hskLevel: 1,
    section: 'reading',
    question: 'Chọn câu trả lời logic cho câu hỏi: "你是哪国人？"',
    type: 'reading',
    options: ['我是越南人。', '我很好，谢谢。', '他是我的汉语老师。', '我不去学校。'],
    correctAnswer: 0,
    explanation: '"你是哪国人？" hỏi về quốc tịch, câu trả lời phù hợp là "我是越南人。"',
  },
  {
    id: 104,
    hskVersion: 'hsk2',
    hskLevel: 1,
    section: 'reading',
    question: 'Điền từ thích hợp vào chỗ trống: "桌子上有一____书。"',
    type: 'fill',
    options: ['本', '张', '个', '只'],
    correctAnswer: 0,
    explanation: 'Lượng từ của sách báo, từ điển là "本" (běn).',
  },

  // HSK 2.0 Level 2
  {
    id: 201,
    hskVersion: 'hsk2',
    hskLevel: 2,
    section: 'listening',
    question: '[Nghe hiểu] "九月去北京旅游最好，天气不冷也不热。"',
    audioPrompt: '九月去北京旅游最好，天气不冷也不热。',
    type: 'listening',
    options: ['Tháng chín đi Bắc Kinh du lịch là tốt nhất.', 'Tháng chín thời tiết Bắc Kinh rất lạnh.', 'Mùa hè đi Bắc Kinh rất nóng.', 'Tôi không thích đi Bắc Kinh.'],
    correctAnswer: 0,
    explanation: 'Người nói nêu rõ "九月去北京旅游最好".',
  },
  {
    id: 202,
    hskVersion: 'hsk2',
    hskLevel: 2,
    section: 'reading',
    question: 'Điền từ: "哥哥比我____两岁。"',
    type: 'fill',
    options: ['大', '高', '长', '多'],
    correctAnswer: 0,
    explanation: 'So sánh tuổi tác trong tiếng Trung dùng "大" (lớn hơn) hoặc "小" (nhỏ hơn).',
  },

  // HSK 2.0 Level 3
  {
    id: 301,
    hskVersion: 'hsk2',
    hskLevel: 3,
    section: 'listening',
    question: '[Nghe hiểu] "请你把门关上，外边风太大了。"',
    audioPrompt: '请你把门关上，外边风太大了。',
    type: 'listening',
    options: ['Xin hãy mở cửa sổ ra.', 'Xin hãy đóng cửa lại vì gió to.', 'Bên ngoài trời đang mưa to.', 'Hãy ra ngoài đón khách.'],
    correctAnswer: 1,
    explanation: 'Câu chữ 把: "把门关上" nghĩa là đóng cửa lại.',
  },
  {
    id: 302,
    hskVersion: 'hsk2',
    hskLevel: 3,
    section: 'writing',
    question: 'Sắp xếp thành câu đúng: "这本 / 我 / 看完 / 小说 / 已经 / 了"',
    type: 'writing',
    options: [
      '我已经看完这本小说了。',
      '我这本看完已经小说了。',
      '这本小说我已经了看完。',
      '我已经小说看完了这本。',
    ],
    correctAnswer: 0,
    explanation: 'Trật tự chuẩn: Chủ ngữ (我) + Phó từ thời gian (已经) + Vị ngữ động từ (看完) + Tân ngữ (这本小说) + 了.',
  },

  // HSK 2.0 Level 4
  {
    id: 401,
    hskVersion: 'hsk2',
    hskLevel: 4,
    section: 'reading',
    question: 'Chọn liên từ thích hợp: "他____聪明，____十分勤奋。"',
    type: 'fill',
    options: ['不但...而且...', '虽然...但是...', '既然...就...', '哪怕...也...'],
    correctAnswer: 0,
    explanation: '"不但...而且..." biểu thị quan hệ tăng tiến (không những... mà còn...).',
  },
  {
    id: 402,
    hskVersion: 'hsk2',
    hskLevel: 4,
    section: 'writing',
    question: 'Điền bổ ngữ khả năng: "这篇文章字太小，我____。"',
    type: 'fill',
    options: ['看不清楚', '看清楚不', '看不懂了', '看得很清'],
    correctAnswer: 0,
    explanation: 'Dạng phủ định của bổ ngữ khả năng là V + 不 + Bổ ngữ kết quả: "看不清楚" (nhìn không rõ).',
  },

  // HSK 2.0 Level 5
  {
    id: 501,
    hskVersion: 'hsk2',
    hskLevel: 5,
    section: 'reading',
    question: 'Chọn từ chính xác: "只有经过反复推敲，这个方案____具备可行性。"',
    type: 'fill',
    options: ['才', '就', '便', '即'],
    correctAnswer: 0,
    explanation: '"只有...才..." biểu thị điều kiện tất yếu duy nhất.',
  },

  // HSK 2.0 Level 6
  {
    id: 601,
    hskVersion: 'hsk2',
    hskLevel: 6,
    section: 'reading',
    question: 'Chọn thành ngữ phù hợp: "多年来他对待科研工作一向____，不敢有半点马虎。"',
    type: 'reading',
    options: ['兢兢业业', '络绎不绝', '浮光掠影', '微不足道'],
    correctAnswer: 0,
    explanation: '"兢兢业业" diễn tả thái độ cẩn trọng, tận tụy hết lòng với công việc.',
  },

  // ==========================================
  // HSK 3.0 MODERN SPECIFICATION (GF0025-2021)
  // ==========================================
  {
    id: 701,
    hskVersion: 'hsk3',
    hskLevel: 1,
    section: 'listening',
    question: '[Nghe hiểu GF0025-2021] "学校前面有一家书店。"',
    audioPrompt: '学校前面有一家书店。',
    type: 'listening',
    options: ['Phía trước trường học có một hiệu sách.', 'Hiệu sách ở phía sau trường học.', 'Trường học ở bên trong công viên.', 'Hiệu sách mở cửa lúc tám giờ.'],
    correctAnswer: 0,
    explanation: 'Phương vị từ: "前面" (phía trước). "学校前面" = phía trước trường.',
  },
  {
    id: 702,
    hskVersion: 'hsk3',
    hskLevel: 1,
    section: 'reading',
    question: 'Chọn đại từ nghi vấn thích hợp: "你想喝____？咖啡还是茶？"',
    type: 'fill',
    options: ['什么', '怎么', '哪儿', '多少'],
    correctAnswer: 0,
    explanation: 'Hỏi về sự vật, đồ uống dùng đại từ nghi vấn "什么" (gì/cái gì).',
  },
  {
    id: 703,
    hskVersion: 'hsk3',
    hskLevel: 2,
    section: 'reading',
    question: 'Chọn trợ từ động thái phù hợp: "中国京剧我听____一次，很有特色。"',
    type: 'fill',
    options: ['过', '了', '着', '得'],
    correctAnswer: 0,
    explanation: 'Biểu thị trải nghiệm đã từng diễn ra trong quá khứ, dùng "过" (guo).',
  },
  {
    id: 704,
    hskVersion: 'hsk3',
    hskLevel: 3,
    section: 'reading',
    question: 'Điền từ nối: "我们俩____去年就认识了。"',
    type: 'fill',
    options: ['从', '打', '由', '自'],
    correctAnswer: 0,
    explanation: '"从...起/开始" biểu thị điểm mốc thời gian bắt đầu.',
  },
  {
    id: 705,
    hskVersion: 'hsk3',
    hskLevel: 4,
    section: 'reading',
    question: 'Điền phó từ liên kết: "虽然遇到了很多挫折，但他____没有灰心。"',
    type: 'fill',
    options: ['并', '又', '更', '越'],
    correctAnswer: 0,
    explanation: '"并" dùng trước từ phủ định (并不/并没有) để nhấn mạnh sự phủ định.',
  },
  {
    id: 706,
    hskVersion: 'hsk3',
    hskLevel: 5,
    section: 'reading',
    question: 'Chọn từ thư diện: "双方就进一步深化经贸合作____了深入探讨。"',
    type: 'fill',
    options: ['进行', '实行', '执行', '举行'],
    correctAnswer: 0,
    explanation: '"进行探讨/进行合作" là cụm từ phối hợp chính quy trong văn phong thương mại và ngoại giao.',
  },
  {
    id: 707,
    hskVersion: 'hsk3',
    hskLevel: 6,
    section: 'reading',
    question: 'Chọn cặp từ đối ứng: "这一举措____缓解了当前的能源危机，____为可持续发展奠定了基石。"',
    type: 'fill',
    options: ['不仅...而且...', '宁可...也不...', '与其...不如...', '虽然...但是...'],
    correctAnswer: 0,
    explanation: 'Quan hệ tăng tiến: "不仅...而且..." (không chỉ... mà còn...).',
  },
  {
    id: 708,
    hskVersion: 'hsk3',
    hskLevel: 7,
    section: 'reading',
    question: '[HSK 3.0 Cấp cao 7–9] Chọn từ ngữ học thuật thích hợp: "该学术论著深入____了东方哲学体系的内在演进逻辑。"',
    type: 'reading',
    options: ['阐述', '敷衍', '笼统', '推脱'],
    correctAnswer: 0,
    explanation: '"阐述" (chǎnshù) là thuật ngữ học thuật cao cấp mang nghĩa trình bày làm sáng tỏ một hệ thống lý luận.',
  },
];

export class ExamRepository {
  private static instance: ExamRepository;

  public static getInstance(): ExamRepository {
    if (!ExamRepository.instance) {
      ExamRepository.instance = new ExamRepository();
    }
    return ExamRepository.instance;
  }

  public getTemplate(version: HskExamVersion, level: number): ExamTemplateConfig {
    const versionTemplates = EXAM_TEMPLATES[version] || EXAM_TEMPLATES.hsk3;
    return versionTemplates[level] || versionTemplates[1];
  }

  public getPaperMetadata(version: HskExamVersion, level: number): ExamPaperMetadata | undefined {
    return OFFICIAL_EXAM_PAPERS.find((p) => p.hskVersion === version && p.level === level);
  }

  public getAllPapers(): ExamPaperMetadata[] {
    return OFFICIAL_EXAM_PAPERS;
  }

  public getCoverageSummary() {
    return getExamCoverageSummary();
  }

  public async getQuestions(version: HskExamVersion, level: number): Promise<ExamQuestion[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('exam_questions')
          .select('*')
          .eq('hsk_level', level)
          .order('id', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((row: any) => ({
            id: row.id,
            hskVersion: (row.hsk_version as HskExamVersion) || version,
            hskLevel: row.hsk_level,
            section: (row.section as ExamSectionId) || 'reading',
            question: row.question_text,
            audioPrompt: row.audio_prompt,
            type: row.question_type as ExamQuestion['type'],
            options: Array.isArray(row.options) ? row.options : JSON.parse(row.options || '[]'),
            correctAnswer: row.correct_answer_index,
            explanation: row.explanation,
          }));
        }
      } catch (err) {
        console.warn('Failed to fetch exam questions from Supabase, using verified fallback:', err);
      }
    }

    // Local verified dataset matching version and level
    const matched = MASTER_EXAM_QUESTIONS.filter(
      (q) => q.hskVersion === version && q.hskLevel === level
    );

    if (matched.length > 0) return matched;

    // Fallback cross-version if level matches
    const cross = MASTER_EXAM_QUESTIONS.filter((q) => q.hskLevel === level);
    return cross.length > 0 ? cross : MASTER_EXAM_QUESTIONS.slice(0, 4);
  }

  /**
   * Save Active Exam Session (Autosave to preserve state on refresh)
   */
  public saveActiveSession(session: ActiveExamSession): void {
    try {
      const key = `yuyan_active_exam_${session.version}_${session.level}`;
      localStorage.setItem(key, JSON.stringify(session));
    } catch {
      // quota safeguard
    }
  }

  public loadActiveSession(version: HskExamVersion, level: number): ActiveExamSession | null {
    try {
      const key = `yuyan_active_exam_${version}_${level}`;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public clearActiveSession(version: HskExamVersion, level: number): void {
    try {
      const key = `yuyan_active_exam_${version}_${level}`;
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }

  /**
   * Save Completed Exam Attempt
   */
  public async saveAttempt(attempt: Omit<ExamAttemptRecord, 'userId'>): Promise<void> {
    const userId = getLearnerSessionId();
    const supabase = getSupabaseClient();

    // Clear active autosaved session once submitted
    this.clearActiveSession(attempt.hskVersion, attempt.hskLevel);

    // Save to local storage
    try {
      const key = `yuyan_exam_history_${attempt.hskVersion}_${attempt.hskLevel}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.unshift({
        ...attempt,
        userId,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(key, JSON.stringify(existing.slice(0, 30)));
    } catch {
      // LocalStorage quota safety
    }

    // Sync to Supabase
    if (supabase) {
      try {
        await supabase.from('exam_attempts').insert({
          user_id: userId,
          hsk_level: attempt.hskLevel,
          score: attempt.score,
          total_questions: attempt.totalQuestions,
          time_spent_seconds: attempt.timeSpentSeconds,
          answers: attempt.answers,
        });
      } catch (err) {
        console.warn('Failed to sync exam attempt to Supabase:', err);
      }
    }
  }

  /**
   * Fetch Past Exam Attempts
   */
  public async getAttempts(version: HskExamVersion, level?: number): Promise<ExamAttemptRecord[]> {
    const userId = getLearnerSessionId();
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        let query = (supabase as any)
          .from('exam_attempts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (typeof level === 'number') {
          query = query.eq('hsk_level', level);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map((r: any) => ({
            id: r.id,
            userId: r.user_id,
            hskVersion: version,
            hskLevel: r.hsk_level,
            score: r.score,
            totalQuestions: r.total_questions,
            timeSpentSeconds: r.time_spent_seconds,
            answers: r.answers || {},
            passed: r.score >= (r.hsk_level <= 2 ? 120 : 180),
            createdAt: r.created_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase exam attempts fetch failed, falling back to local:', err);
      }
    }

    // Local fallback
    try {
      if (typeof level === 'number') {
        const key = `yuyan_exam_history_${version}_${level}`;
        return JSON.parse(localStorage.getItem(key) || '[]');
      } else {
        const all: ExamAttemptRecord[] = [];
        for (let l = 1; l <= 7; l++) {
          const list = JSON.parse(
            localStorage.getItem(`yuyan_exam_history_${version}_${l}`) || '[]'
          );
          all.push(...list);
        }
        return all.sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      }
    } catch {
      return [];
    }
  }
}

export const examRepository = ExamRepository.getInstance();
export { OFFICIAL_EXAM_PAPERS, OFFICIAL_EXAM_SOURCES, getExamCoverageSummary };
export type { ExamPaperMetadata };
