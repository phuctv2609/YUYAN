/**
 * YUYAN — Intelligent Language Routing Service
 * Centralized NLP resolver for detecting user query language, intent,
 * and selecting the optimal pedagogical response language.
 */

export type TargetLanguage = 'zh' | 'vi' | 'en';

export interface LanguageRoutingResult {
  detectedLanguage: 'zh' | 'vi' | 'en' | 'mixed';
  targetResponseLanguage: TargetLanguage;
  isMixed: boolean;
  hasExplicitDirective: boolean;
  directiveExplanation?: string;
  hanziRatio: number;
  systemInstructionAddendum: string;
}

export class LanguageRoutingService {
  private static instance: LanguageRoutingService;

  public static getInstance(): LanguageRoutingService {
    if (!LanguageRoutingService.instance) {
      LanguageRoutingService.instance = new LanguageRoutingService();
    }
    return LanguageRoutingService.instance;
  }

  /**
   * Hanzi detection regex (CJK Unified Ideographs)
   */
  private readonly hanziRegex = /[\u4e00-\u9fa5]/g;

  /**
   * Vietnamese distinctive diacritics regex
   */
  private readonly vietnameseDiacriticsRegex = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]/g;

  /**
   * Common Vietnamese linguistic query triggers
   */
  private readonly vietnameseQueryTriggers = [
    /\b(là gì|như thế nào|tại sao|nghĩa là gì|dùng sao|cách dùng|phân biệt|giải thích|dịch giúp|cho ví dụ|đặt câu|ngữ pháp|luyện nói|sửa lỗi|bài tập)\b/i,
    /\b(em|mình|tôi|bạn|thầy|cô|học|tiếng trung|chữ hán|pinyin)\b/i,
  ];

  /**
   * Resolves the target response language based on user text and explicit preference
   */
  public resolveLanguage(
    text: string,
    explicitPreference?: 'auto' | 'zh' | 'vi' | 'en'
  ): LanguageRoutingResult {
    const raw = (text || '').trim();
    if (!raw) {
      return {
        detectedLanguage: 'vi',
        targetResponseLanguage: explicitPreference && explicitPreference !== 'auto' ? explicitPreference : 'vi',
        isMixed: false,
        hasExplicitDirective: false,
        hanziRatio: 0,
        systemInstructionAddendum: this.getInstructionForLanguage(
          explicitPreference && explicitPreference !== 'auto' ? explicitPreference : 'vi'
        ),
      };
    }

    // 1. Check Explicit User Overrides via prompt text
    const lower = raw.toLowerCase();
    if (
      lower.includes('trả lời bằng tiếng trung') ||
      lower.includes('nói tiếng trung') ||
      lower.includes('dùng tiếng trung') ||
      lower.includes('use chinese') ||
      lower.includes('reply in chinese') ||
      lower.includes('用中文回答') ||
      lower.includes('请用中文')
    ) {
      return {
        detectedLanguage: 'zh',
        targetResponseLanguage: 'zh',
        isMixed: false,
        hasExplicitDirective: true,
        directiveExplanation: 'Người dùng yêu cầu rõ ràng trả lời bằng Tiếng Trung',
        hanziRatio: this.computeHanziRatio(raw),
        systemInstructionAddendum: this.getInstructionForLanguage('zh'),
      };
    }

    if (
      lower.includes('trả lời bằng tiếng việt') ||
      lower.includes('nói tiếng việt') ||
      lower.includes('giải thích bằng tiếng việt') ||
      lower.includes('use vietnamese') ||
      lower.includes('reply in vietnamese') ||
      lower.includes('用越南语回答')
    ) {
      return {
        detectedLanguage: 'vi',
        targetResponseLanguage: 'vi',
        isMixed: false,
        hasExplicitDirective: true,
        directiveExplanation: 'Người dùng yêu cầu rõ ràng trả lời bằng Tiếng Việt',
        hanziRatio: this.computeHanziRatio(raw),
        systemInstructionAddendum: this.getInstructionForLanguage('vi'),
      };
    }

    if (
      lower.includes('trả lời bằng tiếng anh') ||
      lower.includes('reply in english') ||
      lower.includes('explain in english') ||
      lower.includes('use english')
    ) {
      return {
        detectedLanguage: 'en',
        targetResponseLanguage: 'en',
        isMixed: false,
        hasExplicitDirective: true,
        directiveExplanation: 'User explicitly requested English response',
        hanziRatio: this.computeHanziRatio(raw),
        systemInstructionAddendum: this.getInstructionForLanguage('en'),
      };
    }

    // 2. Check explicit setting preference if not auto
    if (explicitPreference && explicitPreference !== 'auto') {
      return {
        detectedLanguage: explicitPreference,
        targetResponseLanguage: explicitPreference,
        isMixed: false,
        hasExplicitDirective: true,
        directiveExplanation: `Cài đặt ngôn ngữ cố định: ${explicitPreference.toUpperCase()}`,
        hanziRatio: this.computeHanziRatio(raw),
        systemInstructionAddendum: this.getInstructionForLanguage(explicitPreference),
      };
    }

    // 3. Automated NLP Linguistic Classification
    const hanziMatches = raw.match(this.hanziRegex) || [];
    const vietnameseMatches = raw.match(this.vietnameseDiacriticsRegex) || [];
    const totalChars = raw.replace(/\s+/g, '').length;
    const hanziCount = hanziMatches.length;
    const hanziRatio = totalChars > 0 ? hanziCount / totalChars : 0;

    const hasVietnameseTriggers = this.vietnameseQueryTriggers.some((regex) => regex.test(raw));
    const hasVietnameseDiacritics = vietnameseMatches.length > 0;

    // Case A: User asked purely in Chinese (e.g. "你好，请问“好啦”是什么意思？" or "我们可以练习一下汉语对话吗？")
    if (hanziRatio >= 0.45 && !hasVietnameseDiacritics && !hasVietnameseTriggers) {
      return {
        detectedLanguage: 'zh',
        targetResponseLanguage: 'zh',
        isMixed: false,
        hasExplicitDirective: false,
        hanziRatio,
        systemInstructionAddendum: this.getInstructionForLanguage('zh'),
      };
    }

    // Case B: Check English query (English sentence with or without Hanzi quote, no Vietnamese diacritics/triggers)
    const englishWords = /\b(what|how|why|can|could|explain|difference|between|grammar|mean|meaning|translate|chinese|hello|is|are|the|practice|please)\b/i;
    if (englishWords.test(raw) && !hasVietnameseDiacritics && !hasVietnameseTriggers) {
      return {
        detectedLanguage: hanziCount > 0 ? 'mixed' : 'en',
        targetResponseLanguage: 'en',
        isMixed: hanziCount > 0,
        hasExplicitDirective: false,
        hanziRatio,
        systemInstructionAddendum: this.getInstructionForLanguage('en'),
      };
    }

    // Case C: User asked in Vietnamese about a Chinese word/grammar or purely Vietnamese query
    if (hasVietnameseDiacritics || hasVietnameseTriggers || (hanziCount > 0 && hanziRatio < 0.45)) {
      return {
        detectedLanguage: hanziCount > 0 ? 'mixed' : 'vi',
        targetResponseLanguage: 'vi',
        isMixed: hanziCount > 0,
        hasExplicitDirective: false,
        hanziRatio,
        systemInstructionAddendum: this.getInstructionForLanguage('vi'),
      };
    }

    // Default Fallback: Vietnamese for Vietnamese Chinese-learning platform
    return {
      detectedLanguage: 'vi',
      targetResponseLanguage: 'vi',
      isMixed: hanziCount > 0,
      hasExplicitDirective: false,
      hanziRatio,
      systemInstructionAddendum: this.getInstructionForLanguage('vi'),
    };
  }

  private computeHanziRatio(text: string): number {
    const matches = text.match(this.hanziRegex) || [];
    const len = text.replace(/\s+/g, '').length;
    return len > 0 ? matches.length / len : 0;
  }

  private getInstructionForLanguage(lang: TargetLanguage): string {
    switch (lang) {
      case 'zh':
        return `[YÊU CẦU NGÔN NGỮ PHẢN HỒI: TIẾNG TRUNG QUỐC (中文)]
Học viên đang giao tiếp bằng tiếng Trung. Hãy phản hồi HOÀN TOÀN bằng tiếng Trung (Mandarin) tự nhiên, sư phạm, chuẩn mực. Không tự ý dịch sang tiếng Việt trừ khi học viên yêu cầu. Nếu cần giải thích ngữ pháp, hãy giải thích bằng tiếng Trung đơn giản, dễ hiểu theo cấp độ của người học.`;

      case 'en':
        return `[LANGUAGE DIRECTIVE: ENGLISH]
The user asked in English. Please explain in clear, pedagogical English. For all Chinese vocabulary, grammar patterns, or example sentences, provide:
1. Simplified Chinese characters (Hanzi)
2. Pinyin with tone marks
3. English translation and usage notes.`;

      case 'vi':
      default:
        return `[YÊU CẦU NGÔN NGỮ PHẢN HỒI: TIẾNG VIỆT (TIẾNG MẸ ĐẺ CỦA HỌC VIÊN)]
Học viên hỏi bằng tiếng Việt hoặc hỏi về tiếng Trung bằng tiếng Việt. Hãy giải thích bằng tiếng Việt sư phạm, chu đáo, dễ hiểu.
MỌI câu ví dụ và từ vựng tiếng Trung BẮT BUỘC có đủ:
1. Chữ Hán giản thể chuẩn
2. Phiên âm Pinyin đầy đủ thanh điệu
3. Nghĩa và giải thích tiếng Việt tự nhiên.
Tách biệt rõ ràng các đoạn chữ Hán và lời giải thích tiếng Việt để hệ thống giọng đọc phát âm chuẩn xác.`;
    }
  }
}

export const languageRoutingService = LanguageRoutingService.getInstance();
