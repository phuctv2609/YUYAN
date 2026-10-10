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
}

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

      return {
        success: false,
        error: edgeErr?.code || 'AI_SERVICE_ERROR',
        message: edgeErr?.message || 'Không thể kết nối đến máy chủ AI.',
      };
    }
  }
}

export const aiWordUsageService = new AiWordUsageService();
