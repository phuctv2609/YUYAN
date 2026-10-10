/**
 * YUYAN — Complete Supabase Database Seeding & Migration Script
 * Project Ref: umeyobuqigbscjucxshs
 * 
 * Imports authoritative datasets:
 * 1. HSK Levels (1 - 6)
 * 2. Kangxi Radicals (214 Bộ Thủ Khang Hy)
 * 3. Canonical Hanzi (1,300+ Chữ Hán Chuẩn Hóa)
 * 4. Pinyin Phonetics (Initials, Finals, Tones, Syllables)
 * 5. HSK Lessons (146 bài giáo trình gốc)
 * 6. Lesson Sentences (9,178 câu bài khóa chuẩn xác)
 * 7. HSK Vocabulary (8,456 từ vựng tra cứu)
 * 8. Reading Passages (146 bài tự đọc hiểu)
 * 9. Exam Questions (Ngân hàng đề thi chuẩn HSK 1 - 6)
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Import local authoritative datasets
import { KANGXI_214_RADICALS } from '../src/data/radicals/kangxi214';
import { CANONICAL_HANZI_DATA } from '../src/data/hanzi/canonicalHanzi';
import {
  SIMPLE_FINALS_DATA,
  COMPOUND_FINALS_DATA,
  NASAL_FINALS_DATA,
  RETROFLEX_AND_SPECIAL_DATA,
  INITIALS_DATA
} from '../src/data/pinyin/pinyinData';

// Load JSON datasets
const rawLessons = JSON.parse(fs.readFileSync(path.resolve('data/hsk/lessons.json'), 'utf-8'));
const rawVocabulary = JSON.parse(fs.readFileSync(path.resolve('data/hsk/vocabulary.json'), 'utf-8'));
const rawReading = JSON.parse(fs.readFileSync(path.resolve('data/hsk/reading.json'), 'utf-8'));

// Load credentials
const envLocal = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = envLocal.match(/VITE_SUPABASE_URL=(.+)/);
const anonMatch = envLocal.match(/VITE_SUPABASE_ANON_KEY=(.+)/);
const adminLocal = fs.existsSync('.env.admin.local') ? fs.readFileSync('.env.admin.local', 'utf-8') : '';
const adminMatch = adminLocal.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseKey = adminMatch ? adminMatch[1].trim() : (anonMatch ? anonMatch[1].trim() : '');

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local / .env.admin.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function chunkAndInsert(tableName: string, rows: any[], chunkSize = 100) {
  console.log(`Inserting ${rows.length} rows into ${tableName} (chunk size ${chunkSize})...`);
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(tableName).upsert(chunk);
    if (error) {
      console.error(`Error inserting into ${tableName} at index ${i}:`, error.message);
      throw error;
    }
    const percent = Math.min(100, Math.round(((i + chunk.length) / rows.length) * 100));
    process.stdout.write(`\r  -> Progress: ${percent}% (${Math.min(i + chunk.length, rows.length)}/${rows.length})`);
  }
  console.log(`\n  Done: ${tableName}`);
}

async function main() {
  console.log('=== YUYAN SUPABASE IMPORT PIPELINE STARTED ===');
  console.log('Target:', supabaseUrl);

  // 1. HSK Levels
  console.log('\n[1/9] Seeding HSK Levels...');
  const hskLevels = [
    { level: 1, title_zh: 'HSK 1 级', title_vi: 'HSK 1 - Sơ cấp 1', description: 'Nắm vững 150 từ vựng và ngữ pháp căn bản, giao tiếp tình huống đơn giản.', target_vocab_count: 150, total_lessons: 15 },
    { level: 2, title_zh: 'HSK 2 级', title_vi: 'HSK 2 - Sơ cấp 2', description: 'Nắm vững 300 từ vựng, giao tiếp đời sống hàng ngày quen thuộc.', target_vocab_count: 300, total_lessons: 15 },
    { level: 3, title_zh: 'HSK 3 级', title_vi: 'HSK 3 - Trung cấp 1', description: 'Nắm vững 600 từ vựng, hoàn thành các nhiệm vụ giao tiếp học tập, du lịch.', target_vocab_count: 600, total_lessons: 20 },
    { level: 4, title_zh: 'HSK 4 级', title_vi: 'HSK 4 - Trung cấp 2', description: 'Nắm vững 1200 từ vựng, thảo luận lưu loát nhiều chủ đề trừu tượng.', target_vocab_count: 1200, total_lessons: 20 },
    { level: 5, title_zh: 'HSK 5 级', title_vi: 'HSK 5 - Cao cấp 1', description: 'Nắm vững 2500 từ vựng, đọc báo chí, xem phim ảnh và diễn thuyết.', target_vocab_count: 2500, total_lessons: 36 },
    { level: 6, title_zh: 'HSK 6 级', title_vi: 'HSK 6 - Cao cấp 2', description: 'Nắm vững 5000+ từ vựng, biểu đạt tự nhiên như người bản xứ.', target_vocab_count: 5000, total_lessons: 40 },
  ];
  await chunkAndInsert('hsk_levels', hskLevels, 10);

  // 2. Kangxi Radicals
  console.log('\n[2/9] Seeding 214 Kangxi Radicals...');
  const radicalRows = KANGXI_214_RADICALS.map((r) => ({
    radical_number: r.radicalNumber,
    char: r.char,
    name_zh: r.nameZh,
    name_vi: r.nameVi,
    meaning: r.meaning,
    stroke_count: r.strokeCount,
    variants: r.variants || [],
    semantic_category: r.semanticCategory || 'Chung',
    mnemonic: r.mnemonic || null,
  }));
  await chunkAndInsert('kangxi_radicals', radicalRows, 100);

  // 3. Canonical Hanzi
  console.log('\n[3/9] Seeding Canonical Hanzi...');
  const radicalNumbersSet = new Set(radicalRows.map(r => r.radical_number));
  const hanziRows = CANONICAL_HANZI_DATA.map((h) => {
    let radNum = h.radicalNumber;
    if (!radicalNumbersSet.has(radNum)) {
      radNum = 1;
    }
    return {
      char: h.char,
      traditional: h.traditional || h.char,
      radical_number: radNum,
      stroke_count: h.strokeCount || 1,
      pinyin: h.pinyin || [],
      meanings: h.meanings || [],
      structure: h.structure || 'single',
      structure_name_vi: h.structureNameVi || 'Đơn thể',
      decomposition: h.decomposition || null,
      stroke_data: h.strokeData || [],
      hsk_levels: h.hskLevels || [],
      vocabulary_ids: h.vocabularyIds || [],
      mnemonic: h.mnemonic || null,
    };
  });
  await chunkAndInsert('canonical_hanzi', hanziRows, 100);

  // 4. Pinyin Phonetics
  console.log('\n[4/9] Seeding Pinyin Phonetics...');
  const initialsRows = INITIALS_DATA.map((item, idx) => ({
    id: item.id,
    symbol: item.symbol,
    category: item.category || 'Thanh mẫu',
    ipa: item.ipa || '',
    display_order: idx + 1,
    description_vi: item.pronunciationGuide || item.mouthGuide || item.category,
  }));
  await chunkAndInsert('pinyin_initials', initialsRows, 50);

  const allFinals = [
    ...SIMPLE_FINALS_DATA,
    ...COMPOUND_FINALS_DATA,
    ...NASAL_FINALS_DATA,
    ...RETROFLEX_AND_SPECIAL_DATA,
  ];
  const seenFinals = new Set();
  const finalsRows: any[] = [];
  for (const item of allFinals) {
    if (seenFinals.has(item.symbol)) continue;
    seenFinals.add(item.symbol);
    finalsRows.push({
      id: item.id,
      canonical_symbol: item.symbol,
      display_symbol: item.symbol,
      category: item.category || 'Vận mẫu',
      ipa: item.ipa || '',
      is_nasal: item.category ? item.category.includes('mũi') : false,
      reduced_form_from: null,
      context_notes_vi: item.pronunciationGuide || null,
    });
  }
  await chunkAndInsert('pinyin_finals', finalsRows, 50);

  const tonesRows = [
    { tone_number: 1, name_zh: '一声 (阴平)', name_vi: 'Thanh 1 (Thanh ngang)', pitch_contour: '55', mark_example: 'ā', description_vi: 'Giọng cao và bằng phẳng, giữ đều âm từ đầu đến cuối.' },
    { tone_number: 2, name_zh: '二声 (阳平)', name_vi: 'Thanh 2 (Thanh sắc)', pitch_contour: '35', mark_example: 'á', description_vi: 'Bắt đầu từ âm vực trung bình, lướt nhanh lên cao (tương tự dấu sắc tiếng Việt).' },
    { tone_number: 3, name_zh: '三声 (上声)', name_vi: 'Thanh 3 (Thanh hỏi)', pitch_contour: '214', mark_example: 'ǎ', description_vi: 'Hạ thấp giọng rồi lượn lên âm vực trung cao.' },
    { tone_number: 4, name_zh: '四声 (去声)', name_vi: 'Thanh 4 (Thanh huyền ngắn)', pitch_contour: '51', mark_example: 'à', description_vi: 'Bắt đầu ở nốt cao nhất, rơi dứt khoát và mạnh xuống nốt thấp nhất.' },
    { tone_number: 5, name_zh: '轻声', name_vi: 'Thanh nhẹ (Khinh thanh)', pitch_contour: 'Biến đổi', mark_example: 'a', description_vi: 'Phát âm ngắn, nhẹ, không có dấu, phụ thuộc vào thanh điệu đứng trước.' },
  ];
  await chunkAndInsert('pinyin_tones', tonesRows, 10);

  // Generate basic syllables mapping
  const commonSyllables = [
    { id: 'syl_ba1', display_pinyin: 'bā', display_pinyin_ascii: 'ba1', canonical_initial: 'b', canonical_final: 'a', tone: 1 },
    { id: 'syl_ma1', display_pinyin: 'mā', display_pinyin_ascii: 'ma1', canonical_initial: 'm', canonical_final: 'a', tone: 1 },
    { id: 'syl_ni3', display_pinyin: 'nǐ', display_pinyin_ascii: 'ni3', canonical_initial: 'n', canonical_final: 'i', tone: 3 },
    { id: 'syl_hao3', display_pinyin: 'hǎo', display_pinyin_ascii: 'hao3', canonical_initial: 'h', canonical_final: 'ao', tone: 3 },
    { id: 'syl_wo3', display_pinyin: 'wǒ', display_pinyin_ascii: 'wo3', canonical_initial: 'w', canonical_final: 'o', tone: 3 },
    { id: 'syl_shi4', display_pinyin: 'shì', display_pinyin_ascii: 'shi4', canonical_initial: 'sh', canonical_final: 'i', tone: 4 },
    { id: 'syl_xue2', display_pinyin: 'xué', display_pinyin_ascii: 'xue2', canonical_initial: 'x', canonical_final: 'üe', tone: 2 },
    { id: 'syl_xi2', display_pinyin: 'xí', display_pinyin_ascii: 'xi2', canonical_initial: 'x', canonical_final: 'i', tone: 2 },
    { id: 'syl_zhong1', display_pinyin: 'zhōng', display_pinyin_ascii: 'zhong1', canonical_initial: 'zh', canonical_final: 'ong', tone: 1 },
    { id: 'syl_guo2', display_pinyin: 'guó', display_pinyin_ascii: 'guo2', canonical_initial: 'g', canonical_final: 'uo', tone: 2 },
  ];
  await chunkAndInsert('pinyin_syllables', commonSyllables, 50);

  // 5. HSK Lessons & Sentences
  console.log('\n[5/9] Seeding 146 HSK Lessons & 9,178 Sentences...');
  const lessonRows: any[] = [];
  const sentenceRows: any[] = [];
  const validLessonIds = new Set<string>();

  for (const lesson of rawLessons.lessons) {
    validLessonIds.add(lesson.lessonId);
    lessonRows.push({
      lesson_id: lesson.lessonId,
      level: lesson.level,
      lesson_number: lesson.lessonNumber,
      title: lesson.title,
      source_file: lesson.sourceFile,
    });

    if (Array.isArray(lesson.lessonText)) {
      lesson.lessonText.forEach((st: any, sIdx: number) => {
        sentenceRows.push({
          id: `${lesson.lessonId}-s${String(sIdx + 1).padStart(3, '0')}`,
          lesson_id: lesson.lessonId,
          sentence_index: sIdx + 1,
          hanzi: st.hanzi || '',
          pinyin: st.pinyin || '',
          vietnamese: st.vietnamese || '',
        });
      });
    }
  }

  await chunkAndInsert('hsk_lessons', lessonRows, 50);
  await chunkAndInsert('lesson_sentences', sentenceRows, 250);

  // 6. HSK Vocabulary
  console.log('\n[6/9] Seeding HSK Vocabulary (8,456 items)...');
  const vocabRows: any[] = [];
  let vocabCount = 0;
  for (const lessonGroup of rawVocabulary.lessons) {
    const rawLessonId = lessonGroup.lessonId || `hsk${lessonGroup.level}-bai${String(lessonGroup.lesson).padStart(2, '0')}`;
    const mappedLessonId = validLessonIds.has(rawLessonId) ? rawLessonId : null;

    if (Array.isArray(lessonGroup.vocabulary)) {
      for (const v of lessonGroup.vocabulary) {
        vocabCount++;
        vocabRows.push({
          id: `vocab_${lessonGroup.level}_${lessonGroup.lesson}_${v.stt || vocabCount}`,
          lesson_id: mappedLessonId,
          stt: v.stt || null,
          hanzi: v.hanzi || '',
          pinyin: v.pinyin || '',
          part_of_speech: v.partOfSpeech || null,
          vietnamese: v.vietnamese || '',
          collocations: v.collocations || null,
          hsk_level: lessonGroup.level,
        });
      }
    }
  }
  await chunkAndInsert('hsk_vocabulary', vocabRows, 250);

  // 7. Reading Passages
  console.log('\n[7/9] Seeding 146 Reading Passages...');
  const readingRows: any[] = [];
  for (const r of rawReading.lessons) {
    const rawLessonId = r.lessonId || `hsk${r.level}-bai${String(r.lesson).padStart(2, '0')}`;
    if (!validLessonIds.has(rawLessonId)) continue;

    const rd = r.readingData || {};
    readingRows.push({
      lesson_id: rawLessonId,
      level: r.level,
      lesson_number: r.lesson,
      title: r.title || `Bài đọc HSK ${r.level} Bài ${r.lesson}`,
      hanzi: rd.hanzi || '',
      pinyin: rd.pinyin || '',
      vietnamese: rd.vietnamese || '',
      vocabulary_reappeared: rd.vocabularyReappeared || null,
      comprehension_questions: rd.comprehensionQuestions || [],
    });
  }
  await chunkAndInsert('reading_passages', readingRows, 50);

  // 8. Exam Questions (Comprehensive Question Bank for HSK 1 - 6)
  console.log('\n[8/9] Seeding Comprehensive Exam Question Bank...');
  const examQuestionsList = [
    // HSK 1
    { hsk_level: 1, question_text: 'Từ "你好" có phiên âm Pinyin chuẩn là gì?', question_type: 'hanzi_pinyin', options: ['nǐ hǎo', 'ní hāo', 'mǐ hǎo', 'nǐ hǎo a'], correct_answer_index: 0, explanation: '"你好" phiên âm chuẩn là "nǐ hǎo" mang nghĩa Xin chào.' },
    { hsk_level: 1, question_text: 'Từ "谢谢" trong tiếng Việt có nghĩa là gì?', question_type: 'meaning', options: ['Tạm biệt', 'Cảm ơn', 'Xin lỗi', 'Không có chi'], correct_answer_index: 1, explanation: '"谢谢" (xièxie) nghĩa là Cảm ơn.' },
    { hsk_level: 1, question_text: 'Điền từ thích hợp: "我是____国人。"', question_type: 'fill', options: ['中', '好', '谢', '叫'], correct_answer_index: 0, explanation: '"中国" nghĩa là Trung Quốc ("我是中国人" - Tôi là người Trung Quốc).' },
    { hsk_level: 1, question_text: 'Phiên âm của chữ "老师" là gì?', question_type: 'hanzi_pinyin', options: ['lǎoshī', 'lǎoshì', 'láoshī', 'lǎosī'], correct_answer_index: 0, explanation: '"老师" có phiên âm là "lǎoshī" mang nghĩa Thầy/Cô giáo.' },
    { hsk_level: 1, question_text: 'Từ "再见" có nghĩa là gì?', question_type: 'meaning', options: ['Hẹn gặp lại / Tạm biệt', 'Xin chào', 'Cảm ơn', 'Xin lỗi'], correct_answer_index: 0, explanation: '"再见" (zàijiàn) nghĩa là Tạm biệt / Hẹn gặp lại.' },
    { hsk_level: 1, question_text: 'Chọn câu trả lời đúng cho câu hỏi: "你是哪国人？"', question_type: 'meaning', options: ['我是越南人。', '我很好。', '我是老师。', '我不去。'], correct_answer_index: 0, explanation: '"你是哪国人？" (Bạn là người nước nào?) trả lời là "我是越南人。" (Tôi là người Việt Nam).' },
    { hsk_level: 1, question_text: 'Từ "学生" có nghĩa là gì?', question_type: 'meaning', options: ['Học sinh / Sinh viên', 'Bác sĩ', 'Giáo viên', 'Bạn bè'], correct_answer_index: 0, explanation: '"学生" (xuéshēng) nghĩa là học sinh, sinh viên.' },
    { hsk_level: 1, question_text: 'Điền từ thích hợp: "今天天气很____。"', question_type: 'fill', options: ['好', '大', '小', '多'], correct_answer_index: 0, explanation: '"很好" mang nghĩa rất tốt/rất đẹp.' },
    { hsk_level: 1, question_text: 'Phiên âm của từ "高兴" là gì?', question_type: 'hanzi_pinyin', options: ['gāoxìng', 'gǎoxìng', 'gāoxīng', 'kāixīn'], correct_answer_index: 0, explanation: '"高兴" phiên âm là "gāoxìng" mang nghĩa vui mừng, phấn khởi.' },
    { hsk_level: 1, question_text: '"昨天" mang nghĩa là thời điểm nào?', question_type: 'meaning', options: ['Hôm qua', 'Hôm nay', 'Ngày mai', 'Tuần trước'], correct_answer_index: 0, explanation: '"昨天" (zuótiān) nghĩa là hôm qua.' },

    // HSK 2
    { hsk_level: 2, question_text: 'Từ "旅游" có phiên âm là gì?', question_type: 'hanzi_pinyin', options: ['lǚyóu', 'lǐyóu', 'lūyóu', 'lùyóu'], correct_answer_index: 0, explanation: '"旅游" có phiên âm là "lǚyóu" mang nghĩa du lịch.' },
    { hsk_level: 2, question_text: 'Ý nghĩa của câu "九月去北京旅游最好" là gì?', question_type: 'meaning', options: ['Tháng 9 đi du lịch Bắc Kinh là tốt nhất', 'Tháng 9 thời tiết Bắc Kinh rất lạnh', 'Bắc Kinh đẹp nhất vào mùa hè', 'Tôi đi Bắc Kinh vào tháng 10'], correct_answer_index: 0, explanation: 'Câu mang nghĩa: Tháng chín đi du lịch Bắc Kinh là thích hợp nhất.' },
    { hsk_level: 2, question_text: 'Từ "运动" mang nghĩa là gì?', question_type: 'meaning', options: ['Học tập', 'Vận động / Thể thao', 'Âm nhạc', 'Nấu ăn'], correct_answer_index: 1, explanation: '"运动" (yùndòng) nghĩa là vận động, thể thao.' },
    { hsk_level: 2, question_text: 'Điền từ thích hợp: "我们要多____牛奶。"', question_type: 'fill', options: ['喝', '吃', '看', '听'], correct_answer_index: 0, explanation: '"喝牛奶" nghĩa là uống sữa bò.' },
    { hsk_level: 2, question_text: 'Từ "便宜" trong mua sắm nghĩa là gì?', question_type: 'meaning', options: ['Đắt đỏ', 'Rẻ', 'Đẹp', 'Tiện lợi'], correct_answer_index: 1, explanation: '"便宜" (piányi) mang nghĩa là giá rẻ, không đắt.' },
    { hsk_level: 2, question_text: 'Phiên âm của từ "准备" là gì?', question_type: 'hanzi_pinyin', options: ['zhǔnbèi', 'zǔnbèi', 'zhūnbèi', 'zhǔnbēi'], correct_answer_index: 0, explanation: '"准备" phiên âm là "zhǔnbèi" nghĩa là chuẩn bị.' },
    { hsk_level: 2, question_text: 'Điền từ nối: "____下雨，我们就不去踢足球了。"', question_type: 'fill', options: ['要是', '虽然', '但是', '因为'], correct_answer_index: 0, explanation: '"要是...就..." biểu thị giả thiết: Nếu trời mưa thì chúng tôi không đi đá bóng.' },
    { hsk_level: 2, question_text: 'Từ "自行车" nghĩa là phương tiện gì?', question_type: 'meaning', options: ['Xe đạp', 'Xe máy', 'Xe buýt', 'Tàu hỏa'], correct_answer_index: 0, explanation: '"自行车" (zìxíngchē) nghĩa là xe đạp.' },
    { hsk_level: 2, question_text: 'Từ "帮助" tương đương với nghĩa tiếng Việt nào?', question_type: 'meaning', options: ['Giúp đỡ', 'Hy vọng', 'Đề nghị', 'Giải thích'], correct_answer_index: 0, explanation: '"帮助" (bāngzhù) nghĩa là giúp đỡ, tương trợ.' },
    { hsk_level: 2, question_text: 'Điền từ: "你比我____两岁。"', question_type: 'fill', options: ['大', '多', '高', '长'], correct_answer_index: 0, explanation: 'Trong so sánh tuổi tác, dùng "大/小" (Bạn lớn hơn tôi 2 tuổi).' },

    // HSK 3
    { hsk_level: 3, question_text: 'Từ "打算" trong ngữ cảnh lập kế hoạch có nghĩa là gì?', question_type: 'meaning', options: ['Dự định, tính toán', 'Từ bỏ', 'Bắt buộc', 'Đồng ý'], correct_answer_index: 0, explanation: '"打算" (dǎsuàn) mang nghĩa dự định hoặc kế hoạch làm gì đó.' },
    { hsk_level: 3, question_text: 'Điền từ: "这本小说我已经看了一____。"', question_type: 'fill', options: ['半', '双', '件', '条'], correct_answer_index: 0, explanation: '"看了一半" nghĩa là đã đọc một nửa cuốn tiểu thuyết.' },
    { hsk_level: 3, question_text: 'Phiên âm của từ "环境" là gì?', question_type: 'hanzi_pinyin', options: ['huánjìng', 'huánjìn', 'huānjìng', 'hánjìng'], correct_answer_index: 0, explanation: '"环境" (huánjìng) nghĩa là môi trường xung quanh.' },
    { hsk_level: 3, question_text: 'Từ "影响" có nghĩa là gì?', question_type: 'meaning', options: ['Ảnh hưởng', 'Âm nhạc', 'Hình ảnh', 'Ấn tượng'], correct_answer_index: 0, explanation: '"影响" (yǐngxiǎng) nghĩa là ảnh hưởng, tác động.' },
    { hsk_level: 3, question_text: 'Cấu trúc "越来越..." dùng để diễn đạt điều gì?', question_type: 'meaning', options: ['Càng ngày càng...', 'Không những... mà còn...', 'Vừa... vừa...', 'Mặc dù... nhưng...'], correct_answer_index: 0, explanation: '"越来越..." biểu thị mức độ tăng tiến theo thời gian (càng ngày càng).' },

    // HSK 4
    { hsk_level: 4, question_text: 'Thành ngữ hoặc từ "坚持" có nghĩa là gì?', question_type: 'meaning', options: ['Kiên trì', 'Dừng lại', 'Phân vân', 'Nhượng bộ'], correct_answer_index: 0, explanation: '"坚持" (jiānchí) nghĩa là kiên trì, giữ vững lập trường.' },
    { hsk_level: 4, question_text: 'Phiên âm của từ "幽默" là gì?', question_type: 'hanzi_pinyin', options: ['yōumò', 'yǒumò', 'yóumò', 'yōumó'], correct_answer_index: 0, explanation: '"幽默" (yōumò) mang nghĩa hài hước, hóm hỉnh.' },
    { hsk_level: 4, question_text: 'Điền từ: "只要努力，就____会成功。"', question_type: 'fill', options: ['一定', '偶尔', '从来', '究竟'], correct_answer_index: 0, explanation: '"一定" mang nghĩa nhất định sẽ thành công.' },
    { hsk_level: 4, question_text: 'Từ "严格" dùng để miêu tả tính chất gì?', question_type: 'meaning', options: ['Nghiêm khắc, chặt chẽ', 'Dễ dãi, thoải mái', 'Nhanh nhẹn', 'Thân thiện'], correct_answer_index: 0, explanation: '"严格" (yángé) mang nghĩa nghiêm khắc.' },
    { hsk_level: 4, question_text: 'Từ "互相" tương đương với cụm từ tiếng Việt nào?', question_type: 'meaning', options: ['Lẫn nhau, tương hỗ', 'Một mình', 'Tất cả', 'Rất nhiều'], correct_answer_index: 0, explanation: '"互相" (hùxiāng) nghĩa là lẫn nhau (vd: 互相帮助 - giúp đỡ lẫn nhau).' },

    // HSK 5
    { hsk_level: 5, question_text: 'Từ "深刻" thường dùng để miêu tả điều gì?', question_type: 'meaning', options: ['Sâu sắc (ấn tượng, bài học)', 'Nông cạn', 'Ngắn hạn', 'Hài hước'], correct_answer_index: 0, explanation: '"深刻" (shēnkè) nghĩa là sâu sắc, in đậm trong tâm trí.' },
    { hsk_level: 5, question_text: 'Phiên âm chuẩn của từ "逻辑" là gì?', question_type: 'hanzi_pinyin', options: ['luóji', 'luójí', 'luōji', 'luòji'], correct_answer_index: 0, explanation: '"逻辑" phiên âm là "luóji" (logic).' },
    { hsk_level: 5, question_text: 'Từ "佩服" thể hiện thái độ tâm lý nào?', question_type: 'meaning', options: ['Khâm phục, nể phục', 'Ghen tị', 'Tức giận', 'Khinh thường'], correct_answer_index: 0, explanation: '"佩服" (pèifú) mang nghĩa bội phục, khâm phục.' },
    { hsk_level: 5, question_text: 'Điền từ liên kết: "____面对多大的困难，他都没有放弃。"', question_type: 'fill', options: ['无论', '尽管', '既然', '除非'], correct_answer_index: 0, explanation: '"无论...都..." biểu thị bất kể đối mặt khó khăn lớn đến đâu đều không từ bỏ.' },
    { hsk_level: 5, question_text: 'Từ "坦率" chỉ phẩm chất nào của con người?', question_type: 'meaning', options: ['Thẳng thắn, chân thành', 'Gian xảo', 'Rụt rè', 'Nóng nảy'], correct_answer_index: 0, explanation: '"坦率" (tǎnshuài) nghĩa là thẳng thắn, bộc trực.' },

    // HSK 6
    { hsk_level: 6, question_text: 'Thành ngữ "兢兢业业" diễn tả thái độ làm việc như thế nào?', question_type: 'meaning', options: ['Cẩn trọng, tận tụy, hết lòng', 'Lười biếng, cẩu thả', 'Vội vàng, hấp tấp', 'Tự cao tự đại'], correct_answer_index: 0, explanation: '"兢兢业业" (jīngjīng-yèyè) nghĩa là làm việc cẩn trọng, chu đáo, tận tâm.' },
    { hsk_level: 6, question_text: 'Phiên âm của từ "喧哗" là gì?', question_type: 'hanzi_pinyin', options: ['xuānhuá', 'xuǎnhuá', 'xuānhuà', 'xiānhuá'], correct_answer_index: 0, explanation: '"喧哗" phiên âm là "xuānhuá" nghĩa là ồn ào, huyên náo.' },
    { hsk_level: 6, question_text: 'Từ "阐述" mang nghĩa hành động nào trong học thuật?', question_type: 'meaning', options: ['Trình bày, làm sáng tỏ một luận điểm', 'Phản đối kịch liệt', 'Sao chép nguyên văn', 'Che giấu thông tin'], correct_answer_index: 0, explanation: '"阐述" (chǎnshù) nghĩa là trình bày rõ ràng, giải thích cặn kẽ.' },
    { hsk_level: 6, question_text: 'Từ "蕴涵" tương đương với khái niệm nào?', question_type: 'meaning', options: ['Hàm chứa, ẩn chứa bên trong', 'Phát tán ra ngoài', 'Phá hủy hoàn toàn', 'Bác bỏ'], correct_answer_index: 0, explanation: '"蕴涵" (yùnhán) mang nghĩa hàm chứa, bao hàm ý nghĩa bên trong.' },
    { hsk_level: 6, question_text: 'Thành ngữ "络绎不绝" dùng để miêu tả hiện tượng gì?', question_type: 'meaning', options: ['Người xe qua lại tấp nập, không dứt', 'Cảnh tượng vắng vẻ, hoang tàn', 'Âm thanh tĩnh lặng tuyệt đối', 'Dòng nước chảy xiết ngắt quãng'], correct_answer_index: 0, explanation: '"络绎不绝" (luòyì-bùjué) miêu tả dòng người hoặc xe cộ tấp nập liên tục không ngớt.' },
  ];
  await chunkAndInsert('exam_questions', examQuestionsList, 20);

  console.log('\n======================================================');
  console.log('✅ ALL AUTHORITATIVE DATA SUCCESSFULLY IMPORTED TO SUPABASE!');
  console.log('Summary:');
  console.log(`- HSK Levels: ${hskLevels.length}`);
  console.log(`- Kangxi Radicals: ${radicalRows.length}`);
  console.log(`- Canonical Hanzi: ${hanziRows.length}`);
  console.log(`- Pinyin Initials: ${initialsRows.length}`);
  console.log(`- Pinyin Finals: ${finalsRows.length}`);
  console.log(`- Pinyin Tones: ${tonesRows.length}`);
  console.log(`- Pinyin Syllables: ${commonSyllables.length}`);
  console.log(`- HSK Lessons: ${lessonRows.length}`);
  console.log(`- Lesson Sentences: ${sentenceRows.length}`);
  console.log(`- HSK Vocabulary: ${vocabRows.length}`);
  console.log(`- Reading Passages: ${readingRows.length}`);
  console.log(`- Exam Questions: ${examQuestionsList.length}`);
  console.log('======================================================\n');
}

main().catch((err) => {
  console.error('\n❌ PIPELINE ABORTED WITH ERROR:', err);
  process.exit(1);
});
