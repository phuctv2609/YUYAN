import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

// Load Supabase credentials
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://umeyobuqigbscjucxshs.supabase.co';
let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  try {
    const adminPath = path.resolve(process.cwd(), '.env.admin.local');
    if (fs.existsSync(adminPath)) {
      const content = fs.readFileSync(adminPath, 'utf-8');
      serviceRoleKey = content.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
    }
  } catch {
    // ignore
  }
}

const supabase = createClient(SUPABASE_URL, serviceRoleKey || 'placeholder', {
  auth: { persistSession: false },
});

// Helper to get Gemini API key
function getGeminiApiKey(): string | null {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();

  // Try reading from .env.admin.local or .env.local
  for (const filename of ['.env.admin.local', '.env.local', '.env']) {
    try {
      const p = path.resolve(process.cwd(), filename);
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf-8');
        const match = content.match(/GEMINI_API_KEY=(.+)/);
        if (match && match[1]?.trim()) {
          return match[1].trim();
        }
      }
    } catch {
      // ignore
    }
  }
  return null;
}

export interface AiUsagePayload {
  word: string;
  pinyin?: string;
  pos?: string[];
  meanings?: string[];
  hskFramework?: string;
  hskLevel?: string | number;
}

export async function handleAiWordUsageRequest(req: any, res: any): Promise<void> {
  // Read body from incoming request
  let bodyStr = '';
  req.on('data', (chunk: any) => {
    bodyStr += chunk.toString();
  });

  await new Promise<void>((resolve) => {
    req.on('end', () => resolve());
  });

  let payload: AiUsagePayload;
  try {
    payload = JSON.parse(bodyStr || '{}');
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'BAD_REQUEST', message: 'Dữ liệu yêu cầu không hợp lệ' }));
    return;
  }

  const word = payload.word?.trim();
  if (!word) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'MISSING_WORD', message: 'Thiếu từ cần giải thích' }));
    return;
  }

  const pinyin = payload.pinyin?.trim() || '';
  const promptVersion = 'v1.0';
  const contextHash = crypto
    .createHash('md5')
    .update(`${word}_${pinyin}_${payload.hskFramework || ''}_${payload.hskLevel || ''}`)
    .digest('hex')
    .slice(0, 16);

  // 1. Check persistent Supabase cache first
  try {
    let { data: cached, error: cacheErr } = await supabase
      .from('ai_word_usage_cache')
      .select('explanation_json')
      .eq('word', word)
      .eq('context_hash', contextHash)
      .eq('prompt_version', promptVersion)
      .maybeSingle();

    if (!cached) {
      const fallback = await supabase
        .from('ai_word_usage_cache')
        .select('explanation_json')
        .eq('word', word)
        .limit(1)
        .maybeSingle();
      if (fallback?.data) {
        cached = fallback.data;
      }
    }

    if (!cacheErr && cached && cached.explanation_json) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        cached: true,
        data: cached.explanation_json
      }));
      return;
    }
  } catch (err) {
    console.warn('Cache lookup warning:', err);
  }

  // 2. If uncached, check Gemini API Key
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: 'AI_UNCONFIGURED',
      message: 'Tính năng AI giải thích cách dùng chưa được kích hoạt: Chưa cấu hình GEMINI_API_KEY trên server. Vui lòng thiết lập GEMINI_API_KEY trong file .env.admin.local để kích hoạt tính năng này.'
    }));
    return;
  }

  // 3. Call Google Gemini API
  try {
    const prompt = `Bạn là chuyên gia ngôn ngữ học và giảng viên cao cấp tiếng Trung Quốc cho người Việt Nam.
Hãy giải thích cách dùng chi tiết, sư phạm và chuẩn xác cho từ sau:
- Từ tiếng Trung: "${word}"
- Pinyin: "${pinyin}"
- Từ loại (nếu có): "${(payload.pos || []).join(', ')}"
- Nghĩa gợi ý: "${(payload.meanings || []).join('; ')}"
- Khung HSK: "${payload.hskFramework || 'Chuẩn'}" Cấp độ: "${payload.hskLevel || 'Chung'}"

YÊU CẦU ĐẦU RA BẮT BUỘC:
Trả về duy nhất định dạng JSON thuần túy (không bọc trong \`\`\`json) theo đúng cấu trúc sau:
{
  "word": "${word}",
  "pinyin": "${pinyin}",
  "coreMeaning": "Nghĩa cốt lõi và sắc thái ngữ dụng trong tiếng Việt",
  "partOfSpeech": "Từ loại và vai trò ngữ pháp chính",
  "grammarPatterns": [
    {
      "pattern": "Cấu trúc ngữ pháp thông dụng 1",
      "explanation": "Giải thích ngắn gọn cách áp dụng trong câu"
    }
  ],
  "exampleSentences": [
    {
      "simplified": "Câu ví dụ tiếng Trung tự nhiên 1",
      "pinyin": "Pinyin đầy đủ có dấu thanh điệu",
      "vietnamese": "Dịch nghĩa tiếng Việt tự nhiên, chuẩn văn phong",
      "context": "Ngữ cảnh giao tiếp (ví dụ: Đời sống, Công sở, Học tập...)"
    },
    {
      "simplified": "Câu ví dụ tiếng Trung tự nhiên 2",
      "pinyin": "Pinyin đầy đủ có dấu thanh điệu",
      "vietnamese": "Dịch nghĩa tiếng Việt tự nhiên",
      "context": "Ngữ cảnh 2"
    },
    {
      "simplified": "Câu ví dụ tiếng Trung tự nhiên 3",
      "pinyin": "Pinyin đầy đủ có dấu thanh điệu",
      "vietnamese": "Dịch nghĩa tiếng Việt tự nhiên",
      "context": "Ngữ cảnh 3"
    }
  ],
  "commonPitfalls": "Lưu ý quan trọng cho người học Việt Nam (lỗi hay gặp, phân biệt từ gần nghĩa, ngữ cảnh không nên dùng)",
  "collocations": ["Cụm từ cố định thường gặp 1", "Cụm từ 2", "Cụm từ 3"],
  "lessonNotes": "Lời khuyên ghi nhớ và áp dụng thực tế"
}`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API Error:', response.status, errText);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'AI_UPSTREAM_ERROR',
        message: `Lỗi kết nối từ Google Gemini API: HTTP ${response.status}`
      }));
      return;
    }

    const resJson = await response.json();
    const rawContent = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent) {
      throw new Error('Không nhận được nội dung từ Gemini API');
    }

    let parsedData = JSON.parse(rawContent);
    parsedData.generatedAt = new Date().toISOString();
    parsedData.model = 'gemini-1.5-flash';

    // 4. Save to persistent Supabase cache
    try {
      await supabase.from('ai_word_usage_cache').upsert({
        word: word,
        context_hash: contextHash,
        prompt_version: promptVersion,
        explanation_json: parsedData,
        updated_at: new Date().toISOString()
      }, { onConflict: 'word,context_hash,prompt_version' });
    } catch (saveErr) {
      console.warn('Failed to save AI result to cache:', saveErr);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      cached: false,
      data: parsedData
    }));
  } catch (err: any) {
    console.error('AI Generation Error:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: 'AI_INTERNAL_ERROR',
      message: err?.message || 'Lỗi xử lý nội bộ khi tạo giải thích từ vựng'
    }));
  }
}
