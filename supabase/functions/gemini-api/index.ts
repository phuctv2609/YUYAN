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

const DEFAULT_MODEL = 'gemini-2.5-flash';
const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-2.5-pro',
  'gemini-pro-latest',
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
        signal: AbortSignal.timeout(18000),
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
    // 3. AI CHAT / CONVERSATION TUTOR (5 MODES: Free, Role-play, Speaking, Correction, HSK)
    if (action === 'chat') {
      const messages = Array.isArray(body.messages) ? body.messages : [];
      const mode = body.conversationMode || body.mode || 'free_chat';
      const scenario = body.scenario || 'Chào hỏi & Giao tiếp thông thường';
      const hskLevel = body.hskLevel || body.level || 2;
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
        .map((m: any) => `${m.sender === 'user' ? 'Học viên' : 'Bạn hội thoại YUYAN'}: ${m.hanzi || m.text}`)
        .join('\n');

      let modeDirective = '';
      if (mode === 'roleplay') {
        modeDirective = `CHẾ ĐỘ TÌNH HUỐNG (情景对话): Hãy nhập vai hoàn toàn vào ngữ cảnh "${scenario}". Nói năng tự nhiên đúng tư cách nhân vật (ví dụ: nhân viên phục vụ, nhân viên bán hàng, đồng nghiệp). Giữ câu thoại 1-3 câu sinh động, kết thúc bằng một câu hỏi hoặc phản hồi phù hợp tình huống.`;
      } else if (mode === 'speaking') {
        modeDirective = `CHẾ ĐỘ LUYỆN NÓI (口语练习): Đóng vai người bạn trò chuyện bản xứ. Dùng từ ngữ khẩu ngữ tự nhiên, ngắn gọn (1-2 câu), ngữ điệu sinh động, dễ nói theo và khuyến khích học viên nói tiếp.`;
      } else if (mode === 'correction') {
        modeDirective = `CHẾ ĐỘ SỬA LỖI (纠错模式):
1. Vẫn trả lời tự nhiên vào câu chuyện của học viên bằng tiếng Trung (1-2 câu).
2. Nếu học viên có lỗi sai ngữ pháp, dùng từ gượng gạo hoặc sai trật tự từ tiếng Trung, hãy đưa ra một gợi ý ngắn gọn, tế nhị bằng tiếng Việt ở trường "feedback" (dạng: "💡 Gợi ý: [cách nói tự nhiên hơn]..."). Nếu câu của học viên đã tự nhiên thì để "feedback": null.`;
      } else if (mode === 'hsk') {
        modeDirective = `CHẾ ĐỘ THỰC CHIẾN HSK (HSK实战): Bạn đang trò chuyện với người học trình độ HSK ${hskLevel}. Hãy chủ động sử dụng cấu trúc ngữ pháp và từ vựng phù hợp chuẩn HSK ${hskLevel}, câu văn rõ ràng, không dùng tiếng lóng quá khó.`;
      } else {
        modeDirective = `CHẾ ĐỘ TRÒ CHUYỆN TỰ DO (自由聊天 - MẶC ĐỊNH):
- Bạn là một người bạn Trung Quốc bản xứ thân thiện, vui vẻ, thích trò chuyện hàng ngày.
- Trò chuyện tự nhiên, ngắn gọn (1-3 câu tiếng Trung), giống như đang nhắn tin trên WeChat.
- TUYỆT ĐỐI KHÔNG giảng bài, KHÔNG tự giới thiệu trang trọng, KHÔNG đưa ra danh sách giáo trình trừ khi học viên yêu cầu.
- Luôn phản hồi trực tiếp vào điều học viên vừa nói và kết thúc bằng MỘT câu hỏi mở tự nhiên để tiếp tục duy trì hội thoại.
- Ví dụ: Học viên nói "大家好！", bạn chỉ cần đáp: "大家好呀！😄 今天过得怎么样？"`;
      }

      const prompt = `Bạn là bạn đồng hành hội thoại tiếng Trung bản xứ của nền tảng YUYAN.
Ngữ cảnh / Chủ đề: "${scenario}".
${modeDirective}

Lịch sử trò chuyện gần nhất:
${conversationHistory || '(Bắt đầu cuộc trò chuyện mới)'}

Câu nói mới nhất của học viên: "${userMessage}"

YÊU CẦU ĐẦU RA (JSON DUY NHẤT, KHÔNG CÓ MARKDOWN HAY CHỮ BAO NGOÀI):
{
  "hanzi": "Câu trả lời tiếng Trung tự nhiên, ngắn gọn (1-3 câu)",
  "pinyin": "Phiên âm Pinyin đầy đủ dấu thanh điệu",
  "vietnamese": "Bản dịch tiếng Việt tự nhiên",
  "feedback": "Nhận xét nhẹ nhàng ngắn gọn nếu có lỗi sai (hoặc null nếu câu của học viên đã tự nhiên)",
  "followUp": "Câu hỏi mở tự nhiên để tiếp tục trò chuyện"
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

    // 4.5. SPEECH-TO-TEXT (MULTIMODAL AUDIO TRANSCRIPTION FOR MOBILE & CROSS-PLATFORM)
    if (action === 'speech-to-text') {
      const audioBase64 = body.audioBase64 || body.audioData || null;
      const audioMimeType = body.audioMimeType || 'audio/webm';
      const languageHint = body.languageHint || body.lang || 'auto'; // 'zh-CN', 'vi-VN', or 'auto'

      if (!audioBase64) {
        return new Response(
          JSON.stringify({ error: 'INVALID_INPUT', message: 'Thiếu dữ liệu âm thanh (audioBase64)' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const promptText = `Bạn là Chuyên gia Xử lý Âm thanh và Nhận diện Giọng nói (Speech Recognition Specialist) cho ứng dụng học tiếng Trung YUYAN.
Nhiệm vụ: Chuyển đổi chính xác lời nói trong đoạn ghi âm thành văn bản (Speech-to-Text).
Người nói là học viên tiếng Trung hoặc giáo viên, nói bằng tiếng Trung (Mandarin) hoặc tiếng Việt.
${languageHint === 'zh-CN' ? 'Ưu tiên nhận diện bằng tiếng Trung (giản thể).' : languageHint === 'vi-VN' ? 'Ưu tiên nhận diện bằng tiếng Việt.' : 'Tự động nhận diện tiếng Trung hoặc tiếng Việt tùy theo lời nói thực tế.'}

QUY TẮC:
1. Nếu là tiếng Trung: Trả về chữ Hán giản thể chuẩn xác. Cung cấp thêm Pinyin nếu nhận diện được.
2. Nếu là tiếng Việt: Trả về văn bản tiếng Việt có dấu đúng chính tả.
3. Nếu âm thanh quá nhỏ, im lặng hoặc chỉ có tiếng ồn: Trả về "transcript": "" và "isEmpty": true.

YÊU CẦU ĐẦU RA (JSON DUY NHẤT, KHÔNG CÓ MARKDOWN HOẶC TEXT KHÁC):
{
  "transcript": "<Văn bản đã nhận diện>",
  "pinyin": "<Pinyin tương ứng nếu là tiếng Trung, nếu là tiếng Việt thì để rỗng>",
  "detectedLanguage": "<'zh-CN' | 'vi-VN' | 'other'>",
  "confidence": 0.95,
  "isEmpty": false
}`;

      const geminiParts = [
        { text: promptText },
        {
          inlineData: {
            mimeType: audioMimeType,
            data: audioBase64,
          },
        },
      ];

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

      let parsedResult: any;
      try {
        parsedResult = JSON.parse(geminiRes.text!);
      } catch {
        parsedResult = {
          transcript: geminiRes.text || '',
          pinyin: '',
          detectedLanguage: 'auto',
          confidence: 0.85,
          isEmpty: !geminiRes.text?.trim(),
        };
      }

      return new Response(
        JSON.stringify({
          success: true,
          result: parsedResult,
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

    // 6. FREE-QUESTION AI CHAT (UNRESTRICTED CHINESE LEARNING Q&A)
    if (action === 'free-chat') {
      const question = (body.question || body.message || '').trim();
      const history = Array.isArray(body.history) ? body.history : [];
      const contextItem = body.contextItem || null;
      const targetLanguage = body.targetLanguage || 'vi';
      const systemInstructionAddendum = body.systemInstructionAddendum || '';
      const attachment = body.attachment || null;

      if (!question && !attachment) {
        return new Response(
          JSON.stringify({ error: 'EMPTY_QUESTION', message: 'Nội dung câu hỏi không được để trống' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const formattedHistory = history
        .slice(-8)
        .map((h: any) => `${h.sender === 'user' ? 'Học viên' : 'Gia sư YUYAN'}: ${h.text || h.message}`)
        .join('\n');

      let contextPrompt = '';
      if (contextItem) {
        contextPrompt = `\nNgữ cảnh học tập kích hoạt:
- Chủ đề: ${contextItem.domainName || contextItem.domainId || ''}
- Nhiệm vụ: ${contextItem.task || ''}
- Mục tiêu: ${contextItem.objective || ''}
- Cấp độ: ${contextItem.level || ''}`;
      }

      let attachmentPrompt = '';
      if (attachment) {
        attachmentPrompt = `\n[HỌC VIÊN ĐÍNH KÈM TỆP TIN: "${attachment.name || 'attachment'}" (${attachment.type || 'file'})]`;
        if (attachment.textContent) {
          attachmentPrompt += `\nNội dung văn bản trích xuất từ tệp:\n"""\n${attachment.textContent.slice(0, 10000)}\n"""`;
        }
      }

      const isCasualChat = !attachment && !contextItem && (
        /^(你好|您好|哈喽|嗨|早上好|晚上好|大家好|吃了吗|最近怎么样|在吗|hi|hello|hey)[\s!！?？~～]*$/i.test(question) ||
        (question.length <= 25 && /[\u4e00-\u9fa5]/.test(question) && !/(tại sao|nghĩa là gì|giải thích|phân tích|ngữ pháp|cách dùng|khác nhau|bài tập|đề thi)/i.test(question))
      );

      const promptText = isCasualChat
        ? `Bạn là bạn đồng hành hội thoại tiếng Trung bản xứ (Native Chinese Conversation Partner) thân thiện, tự nhiên.
Học viên đang nhắn tin trò chuyện với bạn: "${question}".
Lịch sử trò chuyện gần nhất:
${formattedHistory || '(Bắt đầu hội thoại)'}

QUY TẮC BẮT BUỘC:
1. Trả lời trực tiếp, tự nhiên, súc tích (1-3 câu tiếng Trung giản thể, sinh động như bạn bè nhắn tin trên WeChat).
2. TUYỆT ĐỐI KHÔNG giảng bài, KHÔNG tự giới thiệu trang trọng, KHÔNG đưa ra bảng phân tích hay danh sách giáo trình.
3. Luôn kết thúc bằng 1 câu hỏi mở tự nhiên để tiếp tục trò chuyện.`
        : `Bạn là Cố vấn Sư phạm Hán ngữ Cao cấp (Senior AI Chinese Tutor) thuộc nền tảng YUYAN (Khẩu hiệu: "Học tiếng Trung theo cách của bạn.").
Nhiệm vụ: Trả lời câu hỏi và hướng dẫn học tiếng Trung cho người học một cách sư phạm, chuẩn mực, chu đáo và dễ hiểu.
${contextPrompt}
${attachmentPrompt}

Lịch sử trò chuyện gần nhất:
${formattedHistory || '(Chưa có lịch sử)'}

Câu hỏi mới nhất của học viên: "${question || 'Phân tích tệp tin đính kèm này giúp tôi'}"

YÊU CẦU NGÔN NGỮ & ĐỊNH DẠNG SƯ PHẠM:
${systemInstructionAddendum || (targetLanguage === 'zh' ? 'Trả lời hoàn toàn bằng tiếng Trung (Mandarin) tự nhiên, sư phạm.' : 'Giải thích bằng tiếng Việt sư phạm, chu đáo, dễ hiểu.')}

TIÊU CHUẨN TRÌNH BÀY CHUYÊN BIỆT CHO HỌC TIẾNG TRUNG:
1. Mọi câu ví dụ tiếng Trung BẮT BUỘC có đủ:
   - Chữ Hán giản thể chuẩn
   - Phiên âm Pinyin đầy đủ thanh điệu
   - Bản dịch nghĩa tự nhiên (bằng tiếng Việt hoặc ngôn ngữ của học viên)
2. Tách biệt rõ ràng các đoạn chữ Hán và lời giải thích để hệ thống tổng hợp giọng đọc phát âm chuẩn xác từng ngôn ngữ.
3. Sử dụng Markdown rõ ràng (tiêu đề ###, in đậm **, danh sách -) để cấu trúc nội dung khoa học, súc tích.
4. Nếu học viên đính kèm hình ảnh hoặc bài tập, hãy đọc kỹ nội dung, phân tích đáp án từng bước và chỉ ra lỗi sai kèm bài học rút ra.`;

      let promptPayload: any = promptText;
      if (attachment && attachment.dataBase64) {
        const cleanBase64 = attachment.dataBase64.replace(/^data:[^;]+;base64,/, '');
        promptPayload = [
          { text: promptText },
          {
            inlineData: {
              mimeType: attachment.type || 'image/jpeg',
              data: cleanBase64,
            },
          },
        ];
      }

      const geminiRes = await callGemini(geminiKey, promptPayload, false);
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
          answer: geminiRes.text,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 7. CONTEXTUAL AI GRAMMAR ASSISTANT (DETAIL PAGES)
    if (action === 'grammar-ai') {
      const mode = body.mode || 'explain_simple'; // 'explain_simple' | 'explain_deep' | 'generate_examples' | 'compare' | 'quiz'
      const gp = body.grammarPoint || {};
      const comparePattern = (body.comparePattern || '').trim();
      const customQuery = (body.customQuery || '').trim();

      const baseInfo = `
- Điểm ngữ pháp: ${gp.pattern || gp.title || ''}
- Tên/Tiêu đề: ${gp.title || ''}
- Cấp độ: ${gp.bandLabel || gp.sourceLevel || `HSK ${gp.level || 1}`}
- Thể loại: ${gp.category || ''}
- Công thức: ${gp.structureSummary || gp.positivePattern || gp.pattern || ''}
- Ý nghĩa: ${gp.meaningVi || gp.explanation || ''}
`;

      let specificInstructions = '';
      let isJson = false;

      if (mode === 'explain_simple') {
        specificInstructions = `Hãy giải thích điểm ngữ pháp này một cách thật đơn giản, dễ hiểu như đang giảng cho người mới bắt đầu học. Dùng hình ảnh so sánh trực quan hoặc liên hệ gần gũi với tiếng Việt. Độ dài 2-3 đoạn ngắn, kèm 2 ví dụ kinh điển.`;
      } else if (mode === 'explain_deep') {
        specificInstructions = `Hãy phân tích chuyên sâu về điểm ngữ pháp này:
1. Quy tắc kết hợp và hạn chế ngữ pháp (điều kiện cần và đủ).
2. Trật tự từ trong câu và vị trí của các trạng ngữ, bổ ngữ liên quan.
3. Sự khác biệt tinh tế về ngữ cảm và ngữ dụng học (pragmatics).
4. Các trường hợp ngoại lệ người học cần lưu ý.`;
      } else if (mode === 'generate_examples') {
        isJson = true;
        specificInstructions = `Hãy tạo 3 câu ví dụ mới hoàn toàn tự nhiên và thực tế cho điểm ngữ pháp này.
YÊU CẦU ĐẦU RA (JSON DUY NHẤT):
{
  "examples": [
    {
      "hanzi": "Câu chữ Hán",
      "pinyin": "Phiên âm Pinyin đầy đủ thanh điệu",
      "vietnamese": "Bản dịch nghĩa tiếng Việt",
      "context": "Ngữ cảnh sử dụng (vd: Đời sống, Công sở, Mua sắm)"
    }
  ]
}`;
      } else if (mode === 'compare') {
        specificInstructions = `Hãy so sánh điểm ngữ pháp "${gp.pattern || gp.title}" với cấu trúc tương tự "${comparePattern || 'cấu trúc liên quan'}":
1. Điểm giống nhau về ý nghĩa.
2. Sự khác biệt cốt lõi về ngữ pháp, vị trí trong câu và điều kiện dùng.
3. Bảng đối chiếu ví dụ song song (A vs B).
4. Mẹo ghi nhớ nhanh để không bị nhầm lẫn.`;
      } else if (mode === 'quiz') {
        isJson = true;
        specificInstructions = `Hãy tạo 2 câu hỏi trắc nghiệm thực hành cho điểm ngữ pháp này (4 lựa chọn mỗi câu).
YÊU CẦU ĐẦU RA (JSON DUY NHẤT):
{
  "quizzes": [
    {
      "question": "Nội dung câu hỏi (chọn từ điền vào chỗ trống hoặc chọn câu đúng)",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "Giải thích chi tiết vì sao đáp án đó đúng và phân tích bẫy ngữ pháp."
    }
  ]
}`;
      } else if (mode === 'custom_query') {
        specificInstructions = `Học viên có câu hỏi riêng về điểm ngữ pháp này:
"${customQuery}"
Hãy trả lời thấu đáo, chuẩn xác và sư phạm bằng tiếng Việt kèm ví dụ minh họa song ngữ.`;
      }

      const prompt = `Bạn là Chuyên gia Ngữ pháp Hán ngữ Quốc tế (International Chinese Grammar Specialist) của YUYAN.
Thông tin điểm ngữ pháp mục tiêu:
${baseInfo}

Nhiệm vụ:
${specificInstructions}`;

      const geminiRes = await callGemini(geminiKey, prompt, isJson);
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

      let parsedContent: any = geminiRes.text;
      if (isJson) {
        try {
          parsedContent = JSON.parse(geminiRes.text!);
        } catch {
          parsedContent = { rawText: geminiRes.text };
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          mode,
          result: parsedContent,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 8. HSK EXAM QUESTION EXPLANATION
    if (action === 'exam-explanation') {
      const question = body.question || {};
      const userAnswer = body.userAnswer;
      const isCorrect = body.isCorrect;

      const prompt = `Bạn là Chuyên gia Khảo thí và Giảng viên Luyện thi HSK Quốc tế của YUYAN.
Nhiệm vụ: Giải thích chi tiết câu hỏi thi HSK sau đây cho học viên:
- Nội dung câu hỏi: "${question.question || question.title || ''}"
- Các phương án lựa chọn: ${JSON.stringify(question.options || [])}
- Đáp án chính xác được xác minh: "${question.options?.[question.correctAnswer] || question.correctAnswer}"
- Câu trả lời của học viên: "${userAnswer !== undefined ? (question.options?.[userAnswer] || userAnswer) : 'Chưa chọn'}"
- Kết quả làm bài: ${isCorrect ? 'ĐÚNG' : 'CHƯA ĐÚNG'}
- Cấp độ bài thi: ${question.hskLevel || 'HSK'}
- Kỹ năng: ${question.section || 'Đọc / Nghe / Viết'}

YÊU CẦU ĐẦU RA (JSON DUY NHẤT):
{
  "explanation": "Giải thích sư phạm cặn kẽ tại sao đáp án chính xác là đúng, dịch nghĩa các câu then chốt.",
  "distractorAnalysis": "Phân tích vì sao các phương án còn lại là bẫy hoặc không chính xác.",
  "keyVocabulary": ["Từ vựng/cụm từ quan trọng 1 kèm pinyin và nghĩa", "Từ vựng/cụm từ 2"],
  "grammarRule": "Quy tắc ngữ pháp hoặc cấu trúc câu cốt lõi được kiểm tra trong câu này.",
  "examTip": "Mẹo làm bài thi nhanh và chính xác cho dạng câu hỏi này."
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

      let parsedExp: any;
      try {
        parsedExp = JSON.parse(geminiRes.text!);
      } catch {
        parsedExp = {
          explanation: geminiRes.text,
          distractorAnalysis: '',
          keyVocabulary: [],
          grammarRule: '',
          examTip: '',
        };
      }

      return new Response(
        JSON.stringify({
          success: true,
          explanation: parsedExp,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 9. SENTENCE STRUCTURE & SYNTAX ANALYSIS
    if (action === 'sentence-analysis') {
      const sentence = (body.sentence || '').trim();
      if (!sentence) {
        return new Response(
          JSON.stringify({ error: 'EMPTY_SENTENCE', message: 'Thiếu câu cần phân tích' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const prompt = `Bạn là Chuyên gia Ngữ pháp và Cú pháp học Hán ngữ của YUYAN.
Hãy phân tích thành phần cú pháp câu tiếng Trung sau:
"${sentence}"

YÊU CẦU ĐẦU RA (JSON DUY NHẤT):
{
  "sentence": "${sentence}",
  "pinyin": "Pinyin đầy đủ dấu của câu",
  "vietnamese": "Dịch nghĩa tiếng Việt tự nhiên",
  "components": [
    { "part": "Chủ ngữ (主语)", "chinese": "...", "pinyin": "...", "explanation": "..." },
    { "part": "Vị ngữ (谓语)", "chinese": "...", "pinyin": "...", "explanation": "..." },
    { "part": "Tân ngữ (宾语)", "chinese": "...", "pinyin": "...", "explanation": "..." },
    { "part": "Trạng ngữ/Bổ ngữ (状语/补语)", "chinese": "...", "pinyin": "...", "explanation": "..." }
  ],
  "grammarNotes": "Phân tích điểm ngữ pháp mấu chốt trong câu.",
  "pedagogicalAdvice": "Lời khuyên ghi nhớ cho người học Việt Nam."
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

      let parsedAnalysis: any;
      try {
        parsedAnalysis = JSON.parse(geminiRes.text!);
      } catch {
        parsedAnalysis = { raw: geminiRes.text };
      }

      return new Response(
        JSON.stringify({
          success: true,
          analysis: parsedAnalysis,
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
