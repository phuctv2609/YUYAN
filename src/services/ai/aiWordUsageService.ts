import { getSupabaseClient } from '../supabase/client';
import { aiApiService } from './aiApiService';

export interface AiExampleSentence {
  simplified: string;
  pinyin: string;
  vietnamese: string;
  context?: string;
}

export interface AiGrammarPattern {
  pattern: string;
  explanation: string;
}

export interface AiWordUsageExplanation {
  word: string;
  pinyin: string;
  coreMeaning: string;
  partOfSpeech: string;
  grammarPatterns: AiGrammarPattern[];
  exampleSentences: AiExampleSentence[];
  commonPitfalls: string;
  collocations: string[];
  lessonNotes?: string;
  generatedAt: string;
  model: string;
}

export interface AiWordUsageResponse {
  success: boolean;
  cached?: boolean;
  data?: AiWordUsageExplanation;
  error?: string;
  message?: string;
}

export interface FetchWordUsageOptions {
  word: string;
  pinyin?: string;
  pos?: string[];
  meanings?: string[];
  hskFramework?: string;
  hskLevel?: string | number;
  skipCache?: boolean;
  signal?: AbortSignal;
}

const CURATED_VOCABULARY: Record<string, AiWordUsageExplanation> = {
  '你': {
    word: '你',
    pinyin: 'nǐ',
    coreMeaning: 'Đại từ nhân xưng ngôi thứ hai số ít: bạn, cậu, anh, chị, em (dùng trong giao tiếp thân mật hoặc ngang hàng).',
    partOfSpeech: 'Đại từ nhân xưng (人称代词)',
    grammarPatterns: [
      { pattern: '你 + Động từ', explanation: 'Chỉ đối tượng trực tiếp thực hiện hành động (VD: 你去哪儿？- Bạn đi đâu đấy?)' },
      { pattern: 'A + 对 + 你 + Tác động', explanation: 'Biểu thị sự đối đãi hoặc ảnh hưởng đối với ngôi thứ hai (VD: 老师对你很好 - Thầy cô rất tốt với bạn)' }
    ],
    exampleSentences: [
      { simplified: '你好！很高兴认识你。', pinyin: 'Nǐ hǎo! Hěn gāoxìng rènshí nǐ.', vietnamese: 'Xin chào! Rất vui được làm quen với bạn.', context: 'Chào hỏi làm quen cơ bản' },
      { simplified: '你今天打算做什么？', pinyin: 'Nǐ jīntiān dǎsuàn zuò shénme?', vietnamese: 'Hôm nay bạn dự định làm những gì?', context: 'Hỏi thăm kế hoạch hàng ngày' },
      { simplified: '祝你学习顺利，天天开心！', pinyin: 'Zhù nǐ xuéxí shùnlì, tiāntiān kāixīn!', vietnamese: 'Chúc bạn học tập thuận lợi, ngày ngày vui vẻ!', context: 'Lời chúc thân thiện' }
    ],
    commonPitfalls: 'Khi giao tiếp với người lớn tuổi, thầy cô giáo, đối tác quan trọng hoặc cấp trên, bạn nên dùng đại từ tôn xưng là 您 (nín) thay vì 你 để thể hiện sự lễ độ.',
    collocations: ['你好 (nǐ hǎo - xin chào)', '你们 (nǐmen - các bạn)', '你看 (nǐ kàn - bạn xem/theo ý bạn)', '给你 (gěi nǐ - gửi cho bạn)'],
    lessonNotes: 'Chữ 你 gồm bộ Nhân đứng (亻) bên trái biểu thị con người và chữ Nhĩ (尔) bên phải.',
    generatedAt: new Date().toISOString(),
    model: 'yuyan-curated-linguistic-engine'
  },
  '你好': {
    word: '你好',
    pinyin: 'nǐ hǎo',
    coreMeaning: 'Lời chào hỏi cơ bản và thông dụng nhất trong tiếng Trung hiện đại, có nghĩa là "Xin chào" hoặc "Chào bạn".',
    partOfSpeech: 'Cụm từ chào hỏi (问候语)',
    grammarPatterns: [
      { pattern: 'Danh xưng + 你好', explanation: 'Chào người đối diện kèm danh xưng cụ thể (VD: 老师，你好！- Em chào thầy/cô ạ!)' },
      { pattern: '你好 + Câu hỏi', explanation: 'Mở đầu lời chào trước khi hỏi han hoặc nhờ vả (VD: 你好，请问洗手间在哪儿？- Xin chào, cho hỏi nhà vệ sinh ở đâu ạ?)' }
    ],
    exampleSentences: [
      { simplified: '你好！我是新来的汉语学生。', pinyin: 'Nǐ hǎo! Wǒ shì xīn lái de hànyǔ xuéshēng.', vietnamese: 'Xin chào! Mình là học viên tiếng Trung mới đến.', context: 'Giới thiệu bản thân' },
      { simplified: '王老师，您好！', pinyin: 'Wáng lǎoshī, nín hǎo!', vietnamese: 'Em chào thầy Vương ạ!', context: 'Chào hỏi kính trọng với thầy giáo' },
      { simplified: '大家好！很高兴今天见到大家。', pinyin: 'Dàjiā hǎo! Hěn gāoxìng jīntiān jiàndào dàjiā.', vietnamese: 'Chào mọi người! Rất vui hôm nay được gặp mọi người.', context: 'Chào tập thể' }
    ],
    commonPitfalls: 'Khi chào nhiều người cùng lúc, không dùng "你好" mà phải đổi sang "你们好" (nǐmen hǎo) hoặc "大家好" (dàjiā hǎo). Khi chào người bề trên, dùng "您好" (nín hǎo).',
    collocations: ['您好 (nín hǎo - em chào thầy/chào bác)', '大家好 (dàjiā hǎo - chào cả nhà)', '你们好 (nǐmen hǎo - chào các bạn)'],
    lessonNotes: 'Từ ghép đẳng lập giữa đại từ 你 (bạn) và tính từ 好 (tốt lành), mang hàm ý chúc đối phương an lành.',
    generatedAt: new Date().toISOString(),
    model: 'yuyan-curated-linguistic-engine'
  },
  '学习': {
    word: '学习',
    pinyin: 'xuéxí',
    coreMeaning: 'Học tập, tiếp thu kiến thức và rèn luyện kỹ năng trong đời sống và trường lớp.',
    partOfSpeech: 'Động từ / Danh từ (动词 / 名词)',
    grammarPatterns: [
      { pattern: '学习 + Danh từ (Đối tượng học)', explanation: 'Học một môn học hoặc kỹ năng (VD: 学习汉语 - Học tiếng Hán)' },
      { pattern: '向 + Đối tượng + 学习', explanation: 'Học tập noi gương ai đó (VD: 向他学习 - Học tập bạn ấy)' }
    ],
    exampleSentences: [
      { simplified: '我每天都坚持学习中文。', pinyin: 'Wǒ měitiān dōu jiānchí xuéxí zhōngwén.', vietnamese: 'Tôi mỗi ngày đều kiên trì học tiếng Trung.', context: 'Mô tả thói quen học tập' },
      { simplified: '学习新语言需要耐心和练习。', pinyin: 'Xuéxí xīn yǔyán xūyào nàixīn hé liànxí.', vietnamese: 'Học ngôn ngữ mới đòi hỏi sự kiên nhẫn và luyện tập.', context: 'Phương pháp học tập' },
      { simplified: '他在学校的中文学习成绩很优秀。', pinyin: 'Tā zài xuéxiào de zhōngwén xuéxí chéngjì hěn yōuxiù.', vietnamese: 'Thành tích học tiếng Trung ở trường của bạn ấy rất xuất sắc.', context: 'Dùng như danh từ' }
    ],
    commonPitfalls: 'Phân biệt 学 (xué) và 学习 (xuéxí): "学" thường dùng trong khẩu ngữ ngắn gọn kết hợp với tân ngữ (学中文), còn "学习" dùng được độc lập như danh từ hoặc động từ hai âm tiết trang trọng.',
    collocations: ['学习汉语 (xuéxí hànyǔ)', '好好学习 (hǎohǎo xuéxí)', '学习习惯 (xuéxí xíguàn)'],
    lessonNotes: 'Gồm 学 (học) và 习 (tập/thực hành) - học đi đôi với hành.',
    generatedAt: new Date().toISOString(),
    model: 'yuyan-curated-linguistic-engine'
  },
  '谢谢': {
    word: '谢谢',
    pinyin: 'xièxie',
    coreMeaning: 'Cảm ơn, biểu thị lòng biết ơn và sự cảm kích đối với người khác.',
    partOfSpeech: 'Động từ (动词)',
    grammarPatterns: [
      { pattern: '谢谢 + Đối tượng', explanation: 'Cảm ơn ai đó (VD: 谢谢你 - Cảm ơn bạn; 谢谢大家 - Cảm ơn mọi người)' },
      { pattern: '多谢 + Danh từ', explanation: 'Cách cảm ơn thân mật nhấn mạnh (VD: 多谢关照 - Cảm ơn đã quan tâm giúp đỡ)' }
    ],
    exampleSentences: [
      { simplified: '谢谢你的热情帮助！', pinyin: 'Xièxie nǐ de rèqíng bāngzhù!', vietnamese: 'Cảm ơn sự giúp đỡ nhiệt tình của bạn!', context: 'Bày tỏ lòng biết ơn' },
      { simplified: '太谢谢你了，真的帮了大忙。', pinyin: 'Tài xièxie nǐ le, zhēn de bāng le dàmáng.', vietnamese: 'Rất cảm ơn bạn, thực sự đã giúp một việc lớn.', context: 'Biết ơn sâu sắc' },
      { simplified: '不用谢，这是我应该做的。', pinyin: 'Bú yòng xiè, zhè shì wǒ yīnggāi zuò de.', vietnamese: 'Không có chi, đây là việc tôi nên làm mà.', context: 'Đáp lại lời cảm ơn' }
    ],
    commonPitfalls: 'Âm tiết thứ hai 谢 trong 谢谢 đọc thanh nhẹ (xièxie), không đọc nhấn mạnh hai thanh 4 như xièxiè. Khi người khác nói 谢谢, câu đáp lại tự nhiên là "不用谢" (bú yòng xiè) hoặc "不客气" (bú kèqi).',
    collocations: ['谢谢你 (xièxie nǐ)', '多谢 (duōxiè)', '不用谢 (bú yòng xiè)'],
    lessonNotes: 'Gồm bộ Ngôn (讠), chữ Thân (身) và chữ Thốn (寸).',
    generatedAt: new Date().toISOString(),
    model: 'yuyan-curated-linguistic-engine'
  }
};

class AiWordUsageService {
  /**
   * Fetch AI word usage explanation.
   * Tries Supabase persistent cache first. If not cached, invokes server-side /api/ai/word-usage.
   */
  async getWordUsage(options: FetchWordUsageOptions): Promise<AiWordUsageResponse> {
    const word = options.word.trim();
    if (!word) {
      return {
        success: false,
        error: 'INVALID_WORD',
        message: 'Từ cần tra cứu không hợp lệ.'
      };
    }

    // 1. Direct Supabase cache check for fast response
    if (!options.skipCache) {
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data: cachedRows, error } = await supabase
            .from('ai_word_usage_cache' as any)
            .select('explanation_json, explanation')
            .or(`word.eq.${word},headword.eq.${word}`)
            .limit(1);

          if (!error && cachedRows && cachedRows.length > 0) {
            const raw = (cachedRows[0] as any).explanation_json || (cachedRows[0] as any).explanation;
            if (raw) {
              const explanation: AiWordUsageExplanation = {
                word,
                pinyin: options.pinyin || raw.pinyin || '',
                coreMeaning: raw.coreMeaning || raw.core_meaning || '',
                partOfSpeech: raw.partOfSpeech || raw.part_of_speech || (options.pos ? options.pos.join(', ') : ''),
                grammarPatterns: (raw.grammarPatterns || raw.grammar_patterns || []).map((gp: any) => ({
                  pattern: gp.pattern || '',
                  explanation: gp.explanation || '',
                })),
                exampleSentences: (raw.exampleSentences || raw.examples || []).map((ex: any) => ({
                  simplified: ex.simplified || ex.chinese || '',
                  pinyin: ex.pinyin || '',
                  vietnamese: ex.vietnamese || '',
                  context: ex.context || '',
                })),
                commonPitfalls: raw.commonPitfalls || raw.pitfalls || '',
                collocations: raw.collocations || [],
                lessonNotes: raw.lessonNotes || raw.lesson_notes || '',
                generatedAt: raw.generatedAt || new Date().toISOString(),
                model: raw.model || 'gemini-3.8-flash',
              };
              return {
                success: true,
                cached: true,
                data: explanation,
              };
            }
          }
        }
      } catch (err) {
        console.warn('Direct client cache check error, proceeding to API endpoint:', err);
      }
    }

    // 2. Call shared server-side Edge Function via aiApiService
    try {
      const res = await aiApiService.getWordUsage({
        headword: word,
        pinyin: options.pinyin,
        meanings_vi: options.meanings,
        hsk_level: options.hskLevel ? `HSK ${options.hskLevel}` : undefined,
        pos: options.pos ? options.pos.join(', ') : undefined,
      });

      const explanation: AiWordUsageExplanation = {
        word,
        pinyin: options.pinyin || '',
        coreMeaning: res.explanation.coreMeaning,
        partOfSpeech: res.explanation.partOfSpeech || (options.pos ? options.pos.join(', ') : ''),
        grammarPatterns: res.explanation.grammarPatterns,
        exampleSentences: res.explanation.examples,
        commonPitfalls: res.explanation.commonPitfalls,
        collocations: res.explanation.collocations,
        lessonNotes: res.explanation.lessonNotes,
        generatedAt: new Date().toISOString(),
        model: 'gemini-3.8-flash',
      };

      return {
        success: true,
        cached: res.cached,
        data: explanation,
      };
    } catch (edgeErr: any) {
      console.warn('Edge Function call failed, trying local proxy fallback:', edgeErr);

      // 3. Fallback to local Vite server proxy (/api/ai/word-usage) if available
      try {
        const response = await fetch('/api/ai/word-usage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            word: word,
            pinyin: options.pinyin || '',
            pos: options.pos || [],
            meanings: options.meanings || [],
            hskFramework: options.hskFramework || '',
            hskLevel: options.hskLevel || '',
          }),
        });

        if (response.ok) {
          const result = await response.json();
          return result;
        }
      } catch {
        // ignore
      }

      // 4. Built-in Curated Linguistic Knowledge Fallback for Essential Core Vocabulary
      if (CURATED_VOCABULARY[word]) {
        return {
          success: true,
          cached: true,
          data: CURATED_VOCABULARY[word],
        };
      }

      return {
        success: false,
        error: edgeErr?.code || 'AI_SERVICE_ERROR',
        message: edgeErr?.message || 'Không thể kết nối đến máy chủ AI.',
      };
    }
  }
}

export const aiWordUsageService = new AiWordUsageService();
