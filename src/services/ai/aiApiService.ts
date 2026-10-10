// ============================================================================
// YUYAN (语言) — CENTRALIZED SHARED AI CLIENT SERVICE
// Connects frontend to the deployed Supabase Edge Function (gemini-api)
// Strictly Server-Side Secret Architecture: No Gemini key is ever sent to or required by the browser.
// ============================================================================

import { getSupabaseClient } from '../supabase/client';
import { languageRoutingService } from './languageRoutingService';

export interface AiChatAttachment {
  name: string;
  type: string;
  size: number;
  dataBase64?: string;
  textContent?: string;
}

export interface AiChatMessage {
  id: number;
  sender: 'ai' | 'user';
  hanzi: string;
  pinyin: string;
  vietnamese: string;
  feedback?: string | null;
}

export interface PronunciationEvaluation {
  score: number;
  accuracy: 'Xuất sắc' | 'Tốt' | 'Khá' | 'Cần cải thiện';
  toneAccuracy: 'Chuẩn xác' | 'Lệch độ cao' | 'Sai thanh điệu';
  pinyinDetected: string;
  correctParts: string[];
  mainMistake: string;
  affectedSyllable: string;
  targetComparison: string;
  recommendation: string;
  drillPrompt: string;
}

export interface AiWordUsageExplanation {
  coreMeaning: string;
  partOfSpeech?: string;
  grammarPatterns: Array<{
    pattern: string;
    explanation: string;
  }>;
  examples: Array<{
    simplified: string;
    pinyin: string;
    vietnamese: string;
    context?: string;
  }>;
  commonPitfalls: string;
  collocations: string[];
  lessonNotes?: string;
}

class AiApiService {
  private edgeFunctionUrl: string | null = null;
  private anonKey: string | null = null;

  constructor() {
    const metaUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
    const metaKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
    if (metaUrl) {
      this.edgeFunctionUrl = `${metaUrl.replace(/\/$/, '')}/functions/v1/gemini-api`;
    }
    if (metaKey) {
      this.anonKey = metaKey;
    }
  }

  /**
   * Helper to invoke the Supabase Edge Function with fallback to local proxy
   */
  private async invokeEdgeFunction(body: any, timeoutMs: number = 30000): Promise<any> {
    const supabase = getSupabaseClient();
    let lastErrorMsg: string | null = null;
    let lastErrorCode: string | null = null;

    // 1. Try supabase.functions.invoke first
    if (supabase) {
      try {
        const { data, error } = await supabase.functions.invoke('gemini-api', {
          body,
        });
        if (!error && data) {
          if (data.error && !data.success) {
            const err = new Error(data.message || 'Lỗi xử lý từ máy chủ AI');
            (err as any).code = data.error;
            throw err;
          }
          return data;
        }
        if (error) {
          lastErrorMsg = error.message;
          // In Supabase JS, error.context can be a Response
          if ((error as any).context && typeof (error as any).context.json === 'function') {
            try {
              const errBody = await (error as any).context.json();
              if (errBody?.message) lastErrorMsg = errBody.message;
              if (errBody?.error) lastErrorCode = errBody.error;
            } catch {
              // ignore
            }
          }
        }
      } catch (invokeErr: any) {
        if (invokeErr.code) throw invokeErr;
        lastErrorMsg = invokeErr?.message || lastErrorMsg;
      }
    }

    // 2. Direct fetch to Edge Function URL with AbortController timeout
    if (this.edgeFunctionUrl && this.anonKey) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(this.edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: this.anonKey,
            Authorization: `Bearer ${this.anonKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const resData = await res.json().catch(() => null);

        if (res.ok && resData) {
          if (resData.error && !resData.success) {
            const err = new Error(resData.message || 'Lỗi xử lý từ máy chủ AI');
            (err as any).code = resData.error;
            throw err;
          }
          return resData;
        }

        if (resData?.message) {
          lastErrorMsg = resData.message;
          lastErrorCode = resData.error || `HTTP_${res.status}`;
        } else {
          lastErrorMsg = `Máy chủ AI trả về mã lỗi HTTP ${res.status}`;
          lastErrorCode = `HTTP_${res.status}`;
        }
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        if (fetchErr.name === 'AbortError') {
          lastErrorMsg = 'Yêu cầu kết nối AI quá thời gian phản hồi (timeout 30s). Vui lòng thử lại.';
          lastErrorCode = 'TIMEOUT';
        } else if (fetchErr.code) {
          throw fetchErr;
        } else {
          lastErrorMsg = fetchErr?.message || lastErrorMsg;
        }
      }
    }

    // 3. Fallback to local Vite server proxy (/api/ai/word-usage) if available
    if (body.action === 'word-usage') {
      try {
        const localRes = await fetch('/api/ai/word-usage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            word: body.headword,
            pinyin: body.pinyin,
            meanings: body.meanings_vi,
            hskLevel: body.hsk_level,
            pos: body.pos ? [body.pos] : [],
          }),
        });
        if (localRes.ok) {
          const data = await localRes.json();
          if (data.explanation) {
            return { success: true, explanation: data.explanation, cached: data.cached };
          }
        }
      } catch {
        // ignore
      }
    }

    // Standardized Error Mapping
    if (lastErrorCode === 'AI_UNCONFIGURED' || lastErrorMsg?.includes('GEMINI_API_KEY')) {
      lastErrorMsg = 'Tính năng AI chưa được kích hoạt: Chưa cấu hình GEMINI_API_KEY trong Supabase Secrets.';
      lastErrorCode = 'AI_UNCONFIGURED';
    } else if (
      lastErrorCode === 'RATE_LIMIT_EXCEEDED' ||
      lastErrorMsg?.includes('RESOURCE_EXHAUSTED') ||
      lastErrorMsg?.includes('429')
    ) {
      lastErrorMsg = 'Đã đạt giới hạn yêu cầu API Gemini. Vui lòng đợi trong giây lát và thử lại.';
      lastErrorCode = 'RATE_LIMIT_EXCEEDED';
    } else if (lastErrorCode === 'TIMEOUT') {
      lastErrorMsg = 'Yêu cầu kết nối AI quá thời gian phản hồi (timeout 30s). Vui lòng thử lại.';
    }

    const finalErr = new Error(
      lastErrorMsg || 'Không thể kết nối tới dịch vụ AI Gemini trên máy chủ.'
    );
    if (lastErrorCode) (finalErr as any).code = lastErrorCode;
    throw finalErr;
  }

  /**
   * Health check for AI Service
   */
  async checkHealth(testPing: boolean = false): Promise<{
    configured: boolean;
    valid?: boolean;
    model?: string;
    message?: string;
  }> {
    try {
      const data = await this.invokeEdgeFunction({ action: 'health', test: testPing });
      return {
        configured: Boolean(data?.configured),
        valid: Boolean(data?.valid),
        model: data?.model,
        message: data?.message,
      };
    } catch (err: any) {
      return {
        configured: false,
        valid: false,
        message: err?.message || 'Không thể kết nối dịch vụ AI',
      };
    }
  }

  /**
   * AI Word Usage Explanation (HSK Vocabulary & CVDICT Dictionary)
   */
  async getWordUsage(params: {
    headword: string;
    pinyin?: string;
    meanings_vi?: string[];
    hsk_level?: string;
    pos?: string;
  }): Promise<{ explanation: AiWordUsageExplanation; cached: boolean }> {
    const data = await this.invokeEdgeFunction({
      action: 'word-usage',
      headword: params.headword,
      pinyin: params.pinyin,
      meanings_vi: params.meanings_vi,
      hsk_level: params.hsk_level,
      pos: params.pos,
    });

    if (!data.success && data.error) {
      const err = new Error(data.message || 'Lỗi khi tạo giải thích cách dùng');
      (err as any).code = data.error;
      throw err;
    }

    // Normalize snake_case or camelCase explanation fields
    const raw = data.explanation || {};
    const normalized: AiWordUsageExplanation = {
      coreMeaning: raw.core_meaning || raw.coreMeaning || 'Chưa có thông tin nghĩa cốt lõi.',
      partOfSpeech: raw.part_of_speech || raw.partOfSpeech || params.pos || '',
      grammarPatterns: (raw.grammar_patterns || raw.grammarPatterns || []).map((gp: any) => ({
        pattern: gp.pattern || '',
        explanation: gp.explanation || '',
      })),
      examples: (raw.examples || []).map((ex: any) => ({
        simplified: ex.chinese || ex.simplified || '',
        pinyin: ex.pinyin || '',
        vietnamese: ex.vietnamese || '',
        context: ex.context || '',
      })),
      commonPitfalls: raw.pitfalls || raw.commonPitfalls || '',
      collocations: raw.collocations || [],
      lessonNotes: raw.lessonNotes || raw.lesson_notes || '',
    };

    return {
      explanation: normalized,
      cached: Boolean(data.cached),
    };
  }

  /**
   * AI Chat / Conversation Tutor
   */
  async sendChatMessage(params: {
    scenario: string;
    message: string;
    messages?: AiChatMessage[];
  }): Promise<{
    hanzi: string;
    pinyin: string;
    vietnamese: string;
    feedback?: string | null;
  }> {
    const data = await this.invokeEdgeFunction({
      action: 'chat',
      scenario: params.scenario,
      message: params.message,
      messages: params.messages,
    });

    if (!data.success && data.error) {
      const err = new Error(data.message || 'Lỗi khi gửi tin nhắn tới AI');
      (err as any).code = data.error;
      throw err;
    }

    return (
      data.reply || {
        hanzi: '对不起，我暂时无法回答。',
        pinyin: 'Duìbuqǐ, wǒ zànshí wúfǎ huídá.',
        vietnamese: 'Xin lỗi, tôi tạm thời chưa thể trả lời.',
        feedback: null,
      }
    );
  }

  /**
   * Custom Tutor Q&A for specific word
   */
  async askTutorCustomQuestion(params: {
    headword: string;
    pinyin: string;
    vietnamese: string;
    question: string;
  }): Promise<string> {
    const data = await this.invokeEdgeFunction({
      action: 'tutor-custom',
      headword: params.headword,
      pinyin: params.pinyin,
      vietnamese: params.vietnamese,
      question: params.question,
    });

    if (!data.success && data.error) {
      const err = new Error(data.message || 'Lỗi khi gửi câu hỏi tới Gia sư AI');
      (err as any).code = data.error;
      throw err;
    }

    return data.response || 'Chưa nhận được câu trả lời từ Gia sư AI.';
  }

  /**
   * AI Pronunciation Evaluation (Multimodal Audio & Comparative Phonetics)
   */
  async evaluatePronunciation(params: {
    targetHanzi: string;
    targetPinyin: string;
    audioBase64?: string;
    audioMimeType?: string;
    transcript?: string;
    level?: number;
  }): Promise<PronunciationEvaluation> {
    const data = await this.invokeEdgeFunction({
      action: 'evaluate-pronunciation',
      targetHanzi: params.targetHanzi,
      targetPinyin: params.targetPinyin,
      audioBase64: params.audioBase64,
      audioMimeType: params.audioMimeType,
      transcript: params.transcript,
      level: params.level,
    });

    if (!data?.success && data?.error) {
      const err = new Error(data.message || 'Lỗi khi chấm điểm phát âm qua AI');
      (err as any).code = data.error;
      throw err;
    }

    if (!data?.evaluation) {
      throw new Error('Dịch vụ AI không trả về kết quả đánh giá phát âm.');
    }

    return data.evaluation;
  }

  /**
   * AI Sentence Syntax & Grammar Analysis
   */
  async analyzeSentence(sentence: string): Promise<any> {
    const data = await this.invokeEdgeFunction({
      action: 'sentence-analysis',
      sentence,
    });

    if (!data?.success && data?.error) {
      const err = new Error(data.message || 'Lỗi khi phân tích cấu trúc câu');
      (err as any).code = data.error;
      throw err;
    }

    return data.analysis;
  }

  /**
   * HSK Exam Question Explanation
   */
  async explainExamQuestion(params: {
    question: any;
    userAnswer?: number;
    isCorrect?: boolean;
  }): Promise<any> {
    const data = await this.invokeEdgeFunction({
      action: 'exam-explanation',
      question: params.question,
      userAnswer: params.userAnswer,
      isCorrect: params.isCorrect,
    });

    if (!data?.success && data?.error) {
      const err = new Error(data.message || 'Lỗi khi giải thích câu hỏi bài thi');
      (err as any).code = data.error;
      throw err;
    }

    return data.explanation;
  }

  /**
   * Free-Question AI Tutor Chat (Unrestricted Chinese Learning Q&A with File Attachment & Language Routing)
   */
  async sendFreeChatMessage(params: {
    question: string;
    history?: Array<{ sender: 'user' | 'ai'; text: string }>;
    contextItem?: any;
    attachment?: AiChatAttachment | null;
    preferredLanguage?: 'auto' | 'zh' | 'vi' | 'en';
  }): Promise<string> {
    const routing = languageRoutingService.resolveLanguage(
      params.question,
      params.preferredLanguage
    );

    const data = await this.invokeEdgeFunction({
      action: 'free-chat',
      question: params.question,
      history: params.history,
      contextItem: params.contextItem,
      attachment: params.attachment,
      targetLanguage: routing.targetResponseLanguage,
      systemInstructionAddendum: routing.systemInstructionAddendum,
    });

    if (!data.success && data.error) {
      const err = new Error(data.message || 'Lỗi khi gửi câu hỏi tới Gia sư AI');
      (err as any).code = data.error;
      throw err;
    }

    return data.answer || 'Chưa nhận được câu trả lời từ Gia sư AI.';
  }

  /**
   * Contextual Grammar AI Assistant (Detail Pages)
   */
  async askGrammarAi(params: {
    mode: 'explain_simple' | 'explain_deep' | 'generate_examples' | 'compare' | 'quiz' | 'custom_query';
    grammarPoint: any;
    comparePattern?: string;
    customQuery?: string;
  }): Promise<any> {
    const data = await this.invokeEdgeFunction({
      action: 'grammar-ai',
      mode: params.mode,
      grammarPoint: params.grammarPoint,
      comparePattern: params.comparePattern,
      customQuery: params.customQuery,
    });

    if (!data.success && data.error) {
      const err = new Error(data.message || 'Lỗi khi gửi yêu cầu tới AI Ngữ pháp');
      (err as any).code = data.error;
      throw err;
    }

    return data.result;
  }
}

export const aiApiService = new AiApiService();

