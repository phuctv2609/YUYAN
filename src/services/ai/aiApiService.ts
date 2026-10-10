// ============================================================================
// YUYAN (语言) — CENTRALIZED SHARED AI CLIENT SERVICE
// Connects frontend to the deployed Supabase Edge Function (gemini-api)
// Strictly Server-Side Secret Architecture: No Gemini key is ever sent to or required by the browser.
// ============================================================================

import { getSupabaseClient } from '../supabase/client';

export interface AiChatMessage {
  id: number;
  sender: 'ai' | 'user';
  hanzi: string;
  pinyin: string;
  vietnamese: string;
  feedback?: string | null;
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
  private async invokeEdgeFunction(body: any): Promise<any> {
    const supabase = getSupabaseClient();

    // 1. Try supabase.functions.invoke first
    if (supabase) {
      try {
        const { data, error } = await supabase.functions.invoke('gemini-api', {
          body,
        });
        if (!error && data) {
          return data;
        }
        if (error && (error as any).status !== 404) {
          // If the function returned an application error
          console.warn('Edge Function returned error:', error);
        }
      } catch (invokeErr) {
        console.warn('supabase.functions.invoke failed, attempting direct fetch:', invokeErr);
      }
    }

    // 2. Direct fetch to Edge Function URL
    if (this.edgeFunctionUrl && this.anonKey) {
      try {
        const res = await fetch(this.edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: this.anonKey,
            Authorization: `Bearer ${this.anonKey}`,
          },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (fetchErr) {
        console.warn('Direct Edge Function fetch failed:', fetchErr);
      }
    }

    // 3. Fallback to local Vite server proxy (/api/ai/word-usage) if available
    if (body.action === 'word-usage') {
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
    }

    throw new Error('Không thể kết nối tới dịch vụ AI Gemini trên server.');
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
}

export const aiApiService = new AiApiService();
