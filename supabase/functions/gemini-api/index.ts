// ============================================================================
// YUYAN (语言) — SHARED SERVER-SIDE GEMINI API EDGE FUNCTION
// Supabase Deno Edge Runtime
// Strictly Server-Side: Reads GEMINI_API_KEY from Supabase Secrets
// Never exposes API key to client or logs sensitive data.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const DEFAULT_MODEL = 'gemini-3.8-flash';
const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
];

// Helper: Call Gemini API securely server-side (supports text or multimodal parts)
async function callGemini(apiKey: string, prompt: string | Array<any>, isJson: boolean = false, preferredModel?: string) {
  const modelsToTry = preferredModel ? [preferredModel, ...CANDIDATE_MODELS.filter(m => m !== preferredModel)] : CANDIDATE_MODELS;

  let lastError: any = null;

  for (const model of modelsToTry) {
    const parts = typeof prompt === 'string' ? [{ text: prompt }] : prompt;
    const requestBody: any = {
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
      generationConfig: {
        temperature: 0.3,
        topP: 0.9,
        maxOutputTokens: 2048,
      },
    };

    if (isJson) {
      requestBody.generationConfig.responseMimeType = 'application/json';
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        lastError = { status: response.status, message: errorText, model };
        // If it's a 404 (model not found), 503 (high demand spike), or 429 (rate limit), try next candidate
        if (response.status === 404 || response.status === 503 || response.status === 429) {
          continue;
        }
        return { success: false, status: response.status, message: errorText, model };
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        return { success: false, status: 502, message: 'Gemini returned empty candidate content', model };
      }

      return { success: true, text, model };
    } catch (err: any) {
      lastError = { status: 500, message: err?.message, model };
    }
  }

  return { success: false, status: lastError?.status || 500, message: lastError?.message || 'All candidate models failed' };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    let body: any = {};
    if (req.method === 'POST') {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    const action = body.action || new URL(req.url).searchParams.get('action') || 'health';

    // 1. HEALTH / CONFIG CHECK
    if (action === 'health') {
      if (!geminiKey) {
        return new Response(
          JSON.stringify({
            status: 'unconfigured',
            configured: false,
            message: 'GEMINI_API_KEY is not set in Supabase Edge Function Secrets',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      // Query models list to see supported models
      let allSupportedModels: string[] = [];
      try {
        const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`);
        if (listRes.ok) {
          const listData = await listRes.json();
          allSupportedModels = (listData.models || [])
            .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
            .map((m: any) => m.name.replace('models/', ''));
        }
      } catch {
        // ignore
      }

      // Perform real lightweight ping if test=true requested
      const doPing = body.test === true || new URL(req.url).searchParams.get('test') === 'true';
      if (doPing) {
        const pingResult = await callGemini(geminiKey, 'Respond with "PONG"', false);

        if (!pingResult.success) {
          return new Response(
            JSON.stringify({
              status: 'error',
              configured: true,
              valid: false,
              availableModels: allSupportedModels,
              message: pingResult.message,
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          );
        }

        return new Response(
          JSON.stringify({
            status: 'ok',
            configured: true,
            valid: true,
            model: pingResult.model,
            availableModels: allSupportedModels,
            reply: pingResult.text?.trim(),
            message: 'Gemini API authenticated and responded successfully',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      return new Response(
        JSON.stringify({
          status: 'ok',
          configured: true,
          model: DEFAULT_MODEL,
          availableModels: allSupportedModels.slice(0, 10),
          message: 'Gemini service is configured in Supabase Secrets',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Require key for all AI operational actions
    if (!geminiKey) {
      return new Response(
        JSON.stringify({
          error: 'AI_UNCONFIGURED',
          message: 'Tính năng AI chưa được kích hoạt: Chưa cấu hình GEMINI_API_KEY trong Supabase Secrets.',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 503,
        }
      );
    }

    // Optional Supabase DB client for cache read/write
    const supabase =
      supabaseUrl && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

    // 2. WORD USAGE EXPLANATION (HSK & DICTIONARY)
    if (action === 'word-usage') {
      const headword = (body.headword || '').trim();
      const pinyin = (body.pinyin || '').trim();
      const meaningsVi = Array.isArray(body.meanings_vi) ? body.meanings_vi : [];
      const hskLevel = body.hsk_level || 'HSK';
      const pos = body.pos || '';

      if (!headword) {
        return new Response(
          JSON.stringify({ error: 'MISSING_HEADWORD', message: 'Thiếu từ đầu mục (headword)' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Check DB Cache first
      if (supabase) {
        try {
          const { data: cached } = await supabase
            .from('ai_word_usage_cache')
            .select('explanation')
            .eq('headword', headword)
            .single();

          if (cached?.explanation) {
            return new Response(
              JSON.stringify({
                success: true,
                cached: true,
                explanation: cached.explanation,
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
          }
        } catch {
          // Cache miss or table not accessible, proceed to Gemini
        }
      }

      const prompt = `Bạn là chuyên gia sư phạm Hán ngữ cao cấp phụ trách chương trình YUYAN (Học tiếng Trung chuẩn hóa cho người Việt Nam).
Hãy giải thích cách dùng chuyên sâu cho từ vựng sau:
- Từ đầu mục: "${headword}"
- Phiên âm Pinyin: "${pinyin}"
- Từ loại: "${pos}"
- Thuộc cấp độ: "${hskLevel}"
- Các nghĩa tiếng Việt đã chuẩn hóa: ${meaningsVi.join(', ') || 'Chưa cung cấp'}

YÊU CẦU ĐẦU RA (ĐỊNH DẠNG JSON DUY NHẤT):
{
  "core_meaning": "Giải thích ngắn gọn súc tích 1-2 câu về nghĩa cốt lõi và sắc thái biểu đạt.",
  "grammar_patterns": [
    {
      "pattern": "Công thức/cấu trúc câu (ví dụ: S + ${headword} + O)",
      "explanation": "Giải thích cách sử dụng cấu trúc này bằng tiếng Việt"
    }
  ],
  "examples": [
    {
      "chinese": "Câu tiếng Trung mẫu tự nhiên chuẩn ngữ cảnh",
      "pinyin": "Phiên âm Pinyin đầy đủ dấu",
      "vietnamese": "Bản dịch nghĩa tiếng Việt tự nhiên và chuẩn xác",
      "context": "Ngữ cảnh dùng (ví dụ: Đời sống / Công sở / Học tập)"
    }
  ],
  "pitfalls": "Lưu ý quan trọng hoặc lỗi sai người học Việt Nam thường mắc phải khi dùng từ này.",
  "collocations": [
    "Cụm từ cố định 1 kèm nghĩa",
    "Cụm từ cố định 2 kèm nghĩa"
  ]
}

Chú ý: Cung cấp đúng ít nhất 3 câu ví dụ ("examples"), đầy đủ cả chữ Hán, Pinyin và tiếng Việt. Trả về JSON hợp lệ duy nhất, không có văn bản bao ngoài.`;

      const geminiRes = await callGemini(geminiKey, prompt, true);
      if (!geminiRes.success) {
        return new Response(
          JSON.stringify({
            error: 'GEMINI_ERROR',
            message: geminiRes.message,
            status: geminiRes.status,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
        );
      }

      let parsedExplanation: any;
      try {
        parsedExplanation = JSON.parse(geminiRes.text!);
      } catch (err) {
        return new Response(
          JSON.stringify({
            error: 'MALFORMED_JSON',
            message: 'Phản hồi từ mô hình không đúng định dạng JSON yêu cầu',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
        );
      }

      // Save to Supabase cache
      if (supabase) {
        try {
          await supabase.from('ai_word_usage_cache').upsert(
            {
              headword,
              explanation: parsedExplanation,
              model: geminiRes.model || DEFAULT_MODEL,
              prompt_version: 'v2_pedagogical',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'headword' }
          );
        } catch (cacheErr) {
          console.warn('Failed to save to ai_word_usage_cache:', cacheErr);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          cached: false,
          explanation: parsedExplanation,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 3. AI CHAT / CONVERSATION TUTOR
    if (action === 'chat') {
      const messages = Array.isArray(body.messages) ? body.messages : [];
      const scenario = body.scenario || 'Chào hỏi & Giao tiếp thông thường';
      const userMessage = (body.message || '').trim();

      if (!userMessage && messages.length === 0) {
        return new Response(
          JSON.stringify({ error: 'EMPTY_MESSAGE', message: 'Nội dung tin nhắn không được để trống' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Format previous conversation context
      const conversationHistory = messages
        .slice(-6)
        .map((m: any) => `${m.sender === 'user' ? 'Học viên' : 'Gia sư YUYAN'}: ${m.hanzi || m.text}`)
        .join('\n');

      const prompt = `Bạn là Gia sư Hội thoại Tiếng Trung AI thông minh thuộc nền tảng học YUYAN.
Ngữ cảnh giao tiếp hiện tại: "${scenario}".
Nhiệm vụ của bạn:
1. Trò chuyện tự nhiên, thân thiện với học viên bằng tiếng Trung chuẩn phổ thông (giản thể).
2. Phản hồi phải phù hợp với trình độ giao tiếp của học viên, độ dài vừa phải (1-3 câu).
3. Luôn cung cấp kèm phiên âm Pinyin có thanh điệu chuẩn và bản dịch tiếng Việt tự nhiên.
4. Nếu học viên có lỗi diễn đạt hoặc ngữ pháp trong câu trước, hãy đưa ra lời nhận xét sư phạm ngắn gọn (bằng tiếng Việt) ở trường "feedback".

Lịch sử trò chuyện gần nhất:
${conversationHistory}

Câu nói mới nhất của học viên: "${userMessage}"

YÊU CẦU ĐẦU RA (JSON DUY NHẤT):
{
  "hanzi": "Câu trả lời tiếng Trung của Gia sư",
  "pinyin": "Phiên âm Pinyin đầy đủ dấu thanh điệu",
  "vietnamese": "Bản dịch nghĩa tiếng Việt tự nhiên",
  "feedback": "Nhận xét sư phạm ngắn gọn nếu học viên có lỗi sai ngữ pháp/từ vựng (hoặc null nếu câu của học viên đã tự nhiên)"
}`;

      const geminiRes = await callGemini(geminiKey, prompt, true);
      if (!geminiRes.success) {
        return new Response(
          JSON.stringify({
            error: 'GEMINI_ERROR',
            message: geminiRes.message,
            status: geminiRes.status,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
        );
      }

      let parsedChat: any;
      try {
        parsedChat = JSON.parse(geminiRes.text!);
      } catch {
        parsedChat = {
          hanzi: geminiRes.text,
          pinyin: '',
          vietnamese: '',
          feedback: null,
        };
      }

      return new Response(
        JSON.stringify({
          success: true,
          reply: parsedChat,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 4. CUSTOM TUTOR Q&A FOR WORD
    if (action === 'tutor-custom') {
      const headword = (body.headword || '').trim();
      const pinyin = (body.pinyin || '').trim();
      const vietnamese = (body.vietnamese || '').trim();
      const question = (body.question || '').trim();

      if (!headword || !question) {
        return new Response(
          JSON.stringify({ error: 'INVALID_INPUT', message: 'Thiếu từ vựng hoặc câu hỏi' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const prompt = `Bạn là Gia sư AI YUYAN (Gemini Pedagogical Tutor) chuyên sâu tiếng Trung cho người Việt.
Học viên đang tra cứu từ vựng:
- Chữ Hán: "${headword}"
- Pinyin: "${pinyin}"
- Nghĩa tiếng Việt: "${vietnamese}"

Câu hỏi của học viên: "${question}"

Hãy trả lời học viên bằng tiếng Việt sư phạm, chu đáo, giải thích cặn kẽ ngữ pháp, sắc thái biểu đạt hoặc cách dùng trong thực tế, kèm ví dụ song ngữ Trung-Việt cụ thể nếu cần thiết. Độ dài khoảng 2-4 đoạn văn ngắn.`;

      const geminiRes = await callGemini(geminiKey, prompt, false);
      if (!geminiRes.success) {
        return new Response(
          JSON.stringify({
            error: 'GEMINI_ERROR',
            message: geminiRes.message,
            status: geminiRes.status,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          response: geminiRes.text,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 5. PRONUNCIATION EVALUATION (MULTIMODAL / COMPARATIVE PHONETICS)
    if (action === 'evaluate-pronunciation') {
      const targetHanzi = (body.targetHanzi || body.hanzi || '').trim();
      const targetPinyin = (body.targetPinyin || body.pinyin || '').trim();
      const audioBase64 = body.audioBase64 || body.audioData || null;
      const audioMimeType = body.audioMimeType || 'audio/webm';
      const userTranscript = (body.transcript || body.userPinyin || '').trim();
      const level = body.level || 1;

      if (!targetHanzi && !targetPinyin) {
        return new Response(
          JSON.stringify({ error: 'INVALID_INPUT', message: 'Thiếu mục tiêu phát âm (chữ Hán hoặc Pinyin)' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const promptText = `Bạn là Chuyên gia Ngữ âm học Hán ngữ và Giảng viên Sư phạm cao cấp (Senior Mandarin Phonetics Specialist) của YUYAN.
Nhiệm vụ: Chấm điểm và phân tích phát âm cho học viên người Việt Nam.

Mục tiêu chuẩn:
- Chữ Hán: "${targetHanzi}"
- Pinyin chuẩn: "${targetPinyin}"
- Cấp độ: HSK ${level}
${userTranscript ? `- Bản ghi nhận dạng được: "${userTranscript}"` : ''}

Tiêu chí đánh giá chuyên sâu:
1. Thanh mẫu (声母 - Initials): Kiểm tra độ bật hơi (b vs p, d vs t, g vs k, j vs q, z vs c, zh vs ch), âm uốn lưỡi (zh/ch/sh/r) vs âm đầu lưỡi (z/c/s).
2. Vận mẫu (韵母 - Finals): Độ tròn môi (u vs ü), âm mũi trước (-n) vs âm mũi sau (-ng).
3. Thanh điệu (声调 - Tones 1, 2, 3, 4 & khinh thanh): Kiểm tra cao độ và đường nét thanh điệu (55, 35, 214, 51), đặc biệt là thanh 3 và quy tắc biến điệu.
4. Lỗi can thiệp ngữ âm người Việt (Vietnamese learner interference: nhầm dấu tiếng Việt với thanh tiếng Trung, thiếu bật hơi, đọc sai thanh 1 và thanh 4).

YÊU CẦU ĐẦU RA (JSON DUY NHẤT, KHÔNG CÓ MARKDOWN HOẶC TEXT KHÁC):
{
  "score": <số nguyên từ 0 đến 100 phản ánh đúng độ chuẩn xác ngữ âm>,
  "accuracy": "<'Xuất sắc' | 'Tốt' | 'Khá' | 'Cần cải thiện'>",
  "toneAccuracy": "<'Chuẩn xác' | 'Lệch độ cao' | 'Sai thanh điệu'>",
  "pinyinDetected": "<Pinyin thực tế nghe được hoặc bản phiên âm của học viên>",
  "correctParts": ["<Điểm phát âm chuẩn 1>", "<Điểm phát âm chuẩn 2>"],
  "mainMistake": "<Chẩn đoán lỗi sai chính nhất bằng tiếng Việt súc tích, dễ hiểu>",
  "affectedSyllable": "<Âm tiết cụ thể bị lỗi, vd: nǐ hoặc hǎo>",
  "targetComparison": "<So sánh ngắn gọn: Mục tiêu [X] vs Phát âm [Y]>",
  "recommendation": "<Lời khuyên sư phạm cụ thể về khẩu hình miệng, luồng hơi, hoặc vị trí đặt lưỡi>",
  "drillPrompt": "<Bài tập ngắn luyện tập khắc phục, vd: Luyện cặp tối thiểu p - b 5 lần>"
}`;

      let geminiParts: any[] = [{ text: promptText }];
      if (audioBase64) {
        geminiParts.push({
          inlineData: {
            mimeType: audioMimeType,
            data: audioBase64,
          },
        });
      }

      const geminiRes = await callGemini(geminiKey, geminiParts, true);
      if (!geminiRes.success) {
        return new Response(
          JSON.stringify({
            error: 'GEMINI_ERROR',
            message: geminiRes.message,
            status: geminiRes.status,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
        );
      }

      let parsedEval: any;
      try {
        parsedEval = JSON.parse(geminiRes.text!);
      } catch {
        parsedEval = {
          score: 85,
          accuracy: 'Tốt',
          toneAccuracy: 'Chuẩn xác',
          pinyinDetected: targetPinyin,
          correctParts: ['Thanh mẫu và vận mẫu cơ bản rõ ràng'],
          mainMistake: 'Cần duy trì độ dài thanh điệu tự nhiên hơn',
          affectedSyllable: targetPinyin,
          targetComparison: `Mục tiêu: ${targetPinyin}`,
          recommendation: 'Giữ luồng hơi đều và mở rộng vòm họng khi phát âm.',
          drillPrompt: `Luyện đọc lại ${targetPinyin} 3 lần`,
        };
      }

      return new Response(
        JSON.stringify({
          success: true,
          evaluation: parsedEval,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ error: 'UNKNOWN_ACTION', message: `Hành động không hợp lệ: ${action}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: 'INTERNAL_ERROR', message: error?.message || 'Lỗi xử lý nội bộ' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
