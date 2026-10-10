/**
 * YUYAN Exam Repository
 * Data access for HSK Exam questions and attempt histories.
 * Connects to Supabase with offline-first bundled fallback.
 */

import { getSupabaseClient, getLearnerSessionId } from '../../services/supabase/client';

export interface ExamQuestion {
  id: number;
  hskLevel: number;
  question: string;
  type: 'hanzi_pinyin' | 'meaning' | 'fill' | 'reading';
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface ExamAttemptRecord {
  id?: string;
  userId: string;
  hskLevel: number;
  score: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  answers: Record<number, number>;
  createdAt?: string;
}

// Fallback questions for offline resilience across HSK 1 to 6
const FALLBACK_EXAM_QUESTIONS: ExamQuestion[] = [
  // HSK 1
  { id: 1, hskLevel: 1, question: 'Từ "你好" có phiên âm Pinyin chuẩn là gì?', type: 'hanzi_pinyin', options: ['nǐ hǎo', 'ní hāo', 'mǐ hǎo', 'nǐ hǎo a'], correctAnswer: 0, explanation: '"你好" phiên âm chuẩn là "nǐ hǎo" mang nghĩa Xin chào.' },
  { id: 2, hskLevel: 1, question: 'Từ "谢谢" trong tiếng Việt có nghĩa là gì?', type: 'meaning', options: ['Tạm biệt', 'Cảm ơn', 'Xin lỗi', 'Không có chi'], correctAnswer: 1, explanation: '"谢谢" (xièxie) nghĩa là Cảm ơn.' },
  { id: 3, hskLevel: 1, question: 'Điền từ thích hợp: "我是____国人。"', type: 'fill', options: ['中', '好', '谢', '叫'], correctAnswer: 0, explanation: '"中国" nghĩa là Trung Quốc ("我是中国人" - Tôi là người Trung Quốc).' },
  { id: 4, hskLevel: 1, question: 'Phiên âm của chữ "老师" là gì?', type: 'hanzi_pinyin', options: ['lǎoshī', 'lǎoshì', 'láoshī', 'lǎosī'], correctAnswer: 0, explanation: '"老师" có phiên âm là "lǎoshī" mang nghĩa Thầy/Cô giáo.' },
  { id: 5, hskLevel: 1, question: 'Từ "再见" có nghĩa là gì?', type: 'meaning', options: ['Hẹn gặp lại / Tạm biệt', 'Xin chào', 'Cảm ơn', 'Xin lỗi'], correctAnswer: 0, explanation: '"再见" (zàijiàn) nghĩa là Tạm biệt / Hẹn gặp lại.' },
  { id: 6, hskLevel: 1, question: 'Chọn câu trả lời đúng cho câu hỏi: "你是哪国人？"', type: 'meaning', options: ['我是越南人。', '我很好。', '我是老师。', '我不去。'], correctAnswer: 0, explanation: '"你是哪国人？" (Bạn là người nước nào?) trả lời là "我是越南人。" (Tôi là người Việt Nam).' },
  { id: 7, hskLevel: 1, question: 'Từ "学生" có nghĩa là gì?', type: 'meaning', options: ['Học sinh / Sinh viên', 'Bác sĩ', 'Giáo viên', 'Bạn bè'], correctAnswer: 0, explanation: '"学生" (xuéshēng) nghĩa là học sinh, sinh viên.' },
  { id: 8, hskLevel: 1, question: 'Điền từ thích hợp: "今天天气很____。"', type: 'fill', options: ['好', '大', '小', '多'], correctAnswer: 0, explanation: '"很好" mang nghĩa rất tốt/rất đẹp.' },
  { id: 9, hskLevel: 1, question: 'Phiên âm của từ "高兴" là gì?', type: 'hanzi_pinyin', options: ['gāoxìng', 'gǎoxìng', 'gāoxīng', 'kāixīn'], correctAnswer: 0, explanation: '"高兴" phiên âm là "gāoxìng" mang nghĩa vui mừng, phấn khởi.' },
  { id: 10, hskLevel: 1, question: '"昨天" mang nghĩa là thời điểm nào?', type: 'meaning', options: ['Hôm qua', 'Hôm nay', 'Ngày mai', 'Tuần trước'], correctAnswer: 0, explanation: '"昨天" (zuótiān) nghĩa là hôm qua.' },

  // HSK 2
  { id: 11, hskLevel: 2, question: 'Từ "旅游" có phiên âm là gì?', type: 'hanzi_pinyin', options: ['lǚyóu', 'lǐyóu', 'lūyóu', 'lùyóu'], correctAnswer: 0, explanation: '"旅游" có phiên âm là "lǚyóu" mang nghĩa du lịch.' },
  { id: 12, hskLevel: 2, question: 'Ý nghĩa của câu "九月去北京旅游最好" là gì?', type: 'meaning', options: ['Tháng 9 đi du lịch Bắc Kinh là tốt nhất', 'Tháng 9 thời tiết Bắc Kinh rất lạnh', 'Bắc Kinh đẹp nhất vào mùa hè', 'Tôi đi Bắc Kinh vào tháng 10'], correctAnswer: 0, explanation: 'Câu mang nghĩa: Tháng chín đi du lịch Bắc Kinh là thích hợp nhất.' },
  { id: 13, hskLevel: 2, question: 'Từ "运动" mang nghĩa là gì?', type: 'meaning', options: ['Học tập', 'Vận động / Thể thao', 'Âm nhạc', 'Nấu ăn'], correctAnswer: 1, explanation: '"运动" (yùndòng) nghĩa là vận động, thể thao.' },
  { id: 14, hskLevel: 2, question: 'Điền từ thích hợp: "我们要多____牛奶。"', type: 'fill', options: ['喝', '吃', '看', '听'], correctAnswer: 0, explanation: '"喝牛奶" nghĩa là uống sữa bò.' },
  { id: 15, hskLevel: 2, question: 'Từ "便宜" trong mua sắm nghĩa là gì?', type: 'meaning', options: ['Đắt đỏ', 'Rẻ', 'Đẹp', 'Tiện lợi'], correctAnswer: 1, explanation: '"便宜" (piányi) mang nghĩa là giá rẻ, không đắt.' },
  { id: 16, hskLevel: 2, question: 'Phiên âm của từ "准备" là gì?', type: 'hanzi_pinyin', options: ['zhǔnbèi', 'zǔnbèi', 'zhūnbèi', 'zhǔnbēi'], correctAnswer: 0, explanation: '"准备" phiên âm là "zhǔnbèi" nghĩa là chuẩn bị.' },
  { id: 17, hskLevel: 2, question: 'Điền từ nối: "____下雨，我们就不去踢足球了。"', type: 'fill', options: ['要是', '虽然', '但是', '因为'], correctAnswer: 0, explanation: '"要是...就..." biểu thị giả thiết: Nếu trời mưa thì chúng tôi không đi đá bóng.' },
  { id: 18, hskLevel: 2, question: 'Từ "自行车" nghĩa là phương tiện gì?', type: 'meaning', options: ['Xe đạp', 'Xe máy', 'Xe buýt', 'Tàu hỏa'], correctAnswer: 0, explanation: '"自行车" (zìxíngchē) nghĩa là xe đạp.' },
  { id: 19, hskLevel: 2, question: 'Từ "帮助" tương đương với nghĩa tiếng Việt nào?', type: 'meaning', options: ['Giúp đỡ', 'Hy vọng', 'Đề nghị', 'Giải thích'], correctAnswer: 0, explanation: '"帮助" (bāngzhù) nghĩa là giúp đỡ, tương trợ.' },
  { id: 20, hskLevel: 2, question: 'Điền từ: "你比我____两岁。"', type: 'fill', options: ['大', '多', '高', '长'], correctAnswer: 0, explanation: 'Trong so sánh tuổi tác, dùng "大/小" (Bạn lớn hơn tôi 2 tuổi).' },

  // HSK 3
  { id: 21, hskLevel: 3, question: 'Từ "打算" trong ngữ cảnh lập kế hoạch có nghĩa là gì?', type: 'meaning', options: ['Dự định, tính toán', 'Từ bỏ', 'Bắt buộc', 'Đồng ý'], correctAnswer: 0, explanation: '"打算" (dǎsuàn) mang nghĩa dự định hoặc kế hoạch làm gì đó.' },
  { id: 22, hskLevel: 3, question: 'Điền từ: "这本小说我已经看了一____。"', type: 'fill', options: ['半', '双', '件', '条'], correctAnswer: 0, explanation: '"看了一半" nghĩa là đã đọc một nửa cuốn tiểu thuyết.' },
  { id: 23, hskLevel: 3, question: 'Phiên âm của từ "环境" là gì?', type: 'hanzi_pinyin', options: ['huánjìng', 'huánjìn', 'huānjìng', 'hánjìng'], correctAnswer: 0, explanation: '"环境" (huánjìng) nghĩa là môi trường xung quanh.' },
  { id: 24, hskLevel: 3, question: 'Từ "影响" có nghĩa là gì?', type: 'meaning', options: ['Ảnh hưởng', 'Âm nhạc', 'Hình ảnh', 'Ấn tượng'], correctAnswer: 0, explanation: '"影响" (yǐngxiǎng) nghĩa là ảnh hưởng, tác động.' },
  { id: 25, hskLevel: 3, question: 'Cấu trúc "越来越..." dùng để diễn đạt điều gì?', type: 'meaning', options: ['Càng ngày càng...', 'Không những... mà còn...', 'Vừa... vừa...', 'Mặc dù... nhưng...'], correctAnswer: 0, explanation: '"越来越..." biểu thị mức độ tăng tiến theo thời gian (càng ngày càng).' },

  // HSK 4
  { id: 26, hskLevel: 4, question: 'Thành ngữ hoặc từ "坚持" có nghĩa là gì?', type: 'meaning', options: ['Kiên trì', 'Dừng lại', 'Phân vân', 'Nhượng bộ'], correctAnswer: 0, explanation: '"坚持" (jiānchí) nghĩa là kiên trì, giữ vững lập trường.' },
  { id: 27, hskLevel: 4, question: 'Phiên âm của từ "幽默" là gì?', type: 'hanzi_pinyin', options: ['yōumò', 'yǒumò', 'yóumò', 'yōumó'], correctAnswer: 0, explanation: '"幽默" (yōumò) mang nghĩa hài hước, hóm hỉnh.' },
  { id: 28, hskLevel: 4, question: 'Điền từ: "只要努力，就____会成功。"', type: 'fill', options: ['一定', '偶尔', '从来', '究竟'], correctAnswer: 0, explanation: '"一定" mang nghĩa nhất định sẽ thành công.' },
  { id: 29, hskLevel: 4, question: 'Từ "严格" dùng để miêu tả tính chất gì?', type: 'meaning', options: ['Nghiêm khắc, chặt chẽ', 'Dễ dãi, thoải mái', 'Nhanh nhẹn', 'Thân thiện'], correctAnswer: 0, explanation: '"严格" (yángé) mang nghĩa nghiêm khắc.' },
  { id: 30, hskLevel: 4, question: 'Từ "互相" tương đương với cụm từ tiếng Việt nào?', type: 'meaning', options: ['Lẫn nhau, tương hỗ', 'Một mình', 'Tất cả', 'Rất nhiều'], correctAnswer: 0, explanation: '"互相" (hùxiāng) nghĩa là lẫn nhau (vd: 互相帮助 - giúp đỡ lẫn nhau).' },

  // HSK 5
  { id: 31, hskLevel: 5, question: 'Từ "深刻" thường dùng để miêu tả điều gì?', type: 'meaning', options: ['Sâu sắc (ấn tượng, bài học)', 'Nông cạn', 'Ngắn hạn', 'Hài hước'], correctAnswer: 0, explanation: '"深刻" (shēnkè) nghĩa là sâu sắc, in đậm trong tâm trí.' },
  { id: 32, hskLevel: 5, question: 'Phiên âm chuẩn của từ "逻辑" là gì?', type: 'hanzi_pinyin', options: ['luóji', 'luójí', 'luōji', 'luòji'], correctAnswer: 0, explanation: '"逻辑" phiên âm là "luóji" (logic).' },
  { id: 33, hskLevel: 5, question: 'Từ "佩服" thể hiện thái độ tâm lý nào?', type: 'meaning', options: ['Khâm phục, nể phục', 'Ghen tị', 'Tức giận', 'Khinh thường'], correctAnswer: 0, explanation: '"佩服" (pèifú) mang nghĩa bội phục, khâm phục.' },
  { id: 34, hskLevel: 5, question: 'Điền từ liên kết: "____面对多大的困难，他都没有放弃。"', type: 'fill', options: ['无论', '尽管', '既然', '除非'], correctAnswer: 0, explanation: '"无论...都..." biểu thị bất kể đối mặt khó khăn lớn đến đâu đều không từ bỏ.' },
  { id: 35, hskLevel: 5, question: 'Từ "坦率" chỉ phẩm chất nào của con người?', type: 'meaning', options: ['Thẳng thắn, chân thành', 'Gian xảo', 'Rụt rè', 'Nóng nảy'], correctAnswer: 0, explanation: '"坦率" (tǎnshuài) nghĩa là thẳng thắn, bộc trực.' },

  // HSK 6
  { id: 36, hskLevel: 6, question: 'Thành ngữ "兢兢业业" diễn tả thái độ làm việc như thế nào?', type: 'meaning', options: ['Cẩn trọng, tận tụy, hết lòng', 'Lười biếng, cẩu thả', 'Vội vàng, hấp tấp', 'Tự cao tự đại'], correctAnswer: 0, explanation: '"兢兢业业" (jīngjīng-yèyè) nghĩa là làm việc cẩn trọng, chu đáo, tận tâm.' },
  { id: 37, hskLevel: 6, question: 'Phiên âm của từ "喧哗" là gì?', type: 'hanzi_pinyin', options: ['xuānhuá', 'xuǎnhuá', 'xuānhuà', 'xiānhuá'], correctAnswer: 0, explanation: '"喧哗" phiên âm là "xuānhuá" nghĩa là ồn ào, huyên náo.' },
  { id: 38, hskLevel: 6, question: 'Từ "阐述" mang nghĩa hành động nào trong học thuật?', type: 'meaning', options: ['Trình bày, làm sáng tỏ một luận điểm', 'Phản đối kịch liệt', 'Sao chép nguyên văn', 'Che giấu thông tin'], correctAnswer: 0, explanation: '"阐述" (chǎnshù) nghĩa là trình bày rõ ràng, giải thích cặn kẽ.' },
  { id: 39, hskLevel: 6, question: 'Từ "蕴涵" tương đương với khái niệm nào?', type: 'meaning', options: ['Hàm chứa, ẩn chứa bên trong', 'Phát tán ra ngoài', 'Phá hủy hoàn toàn', 'Bác bỏ'], correctAnswer: 0, explanation: '"蕴涵" (yùnhán) mang nghĩa hàm chứa, bao hàm ý nghĩa bên trong.' },
  { id: 40, hskLevel: 6, question: 'Thành ngữ "络绎不绝" dùng để miêu tả hiện tượng gì?', type: 'meaning', options: ['Người xe qua lại tấp nập, không dứt', 'Cảnh tượng vắng vẻ, hoang tàn', 'Âm thanh tĩnh lặng tuyệt đối', 'Dòng nước chảy xiết ngắt quãng'], correctAnswer: 0, explanation: '"络绎不绝" (luòyì-bùjué) miêu tả dòng người hoặc xe cộ tấp nập liên tục không ngớt.' },
];

export class ExamRepository {
  private static instance: ExamRepository;

  public static getInstance(): ExamRepository {
    if (!ExamRepository.instance) {
      ExamRepository.instance = new ExamRepository();
    }
    return ExamRepository.instance;
  }

  public async getQuestionsByLevel(level: number): Promise<ExamQuestion[]> {
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
            hskLevel: row.hsk_level,
            question: row.question_text,
            type: row.question_type as ExamQuestion['type'],
            options: Array.isArray(row.options) ? row.options : JSON.parse(row.options || '[]'),
            correctAnswer: row.correct_answer_index,
            explanation: row.explanation,
          }));
        }
      } catch (err) {
        console.warn('Failed to fetch exam questions from Supabase, using fallback:', err);
      }
    }

    // Local fallback
    return FALLBACK_EXAM_QUESTIONS.filter((q) => q.hskLevel === level);
  }

  public async saveAttempt(attempt: Omit<ExamAttemptRecord, 'userId'>): Promise<void> {
    const userId = getLearnerSessionId();
    const supabase = getSupabaseClient();

    // Save to local storage for instant offline history
    try {
      const LOCAL_KEY = `yuyan_exam_attempts_${attempt.hskLevel}`;
      const existing = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
      existing.unshift({
        ...attempt,
        userId,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(LOCAL_KEY, JSON.stringify(existing.slice(0, 20)));
    } catch {
      // LocalStorage quota safety
    }

    // Persist to Supabase if available
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

  public async getAttempts(level?: number): Promise<ExamAttemptRecord[]> {
    const userId = getLearnerSessionId();
    const supabase = getSupabaseClient();

    // Try Supabase first
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
            hskLevel: r.hsk_level,
            score: r.score,
            totalQuestions: r.total_questions,
            timeSpentSeconds: r.time_spent_seconds,
            answers: r.answers || {},
            createdAt: r.created_at,
          }));
        }
      } catch (err) {
        console.warn('Failed to load exam attempts from Supabase, falling back to local storage:', err);
      }
    }

    // LocalStorage fallback
    try {
      if (typeof level === 'number') {
        const LOCAL_KEY = `yuyan_exam_attempts_${level}`;
        return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
      } else {
        const results: ExamAttemptRecord[] = [];
        for (let l = 1; l <= 6; l++) {
          const stored = JSON.parse(localStorage.getItem(`yuyan_exam_attempts_${l}`) || '[]');
          results.push(...stored);
        }
        return results.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      }
    } catch {
      return [];
    }
  }
}

export const examRepository = ExamRepository.getInstance();
