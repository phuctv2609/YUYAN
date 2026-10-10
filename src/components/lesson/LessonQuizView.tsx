import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  ArrowRight,
  Eye,
  AlertCircle,
  Volume2,
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  Sparkles,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { Lesson, LessonVocabulary } from '../../data/hsk/types.ts';
import { useToast } from '../ui/Toast.tsx';
import { audioManager } from '../../services/audio/index.ts';
import { mistakeRepository } from '../../data/repositories/mistakeRepository.ts';
import { progressRepository } from '../../data/repositories/progressRepository.ts';
import { getSupabaseClient, getLearnerSessionId } from '../../services/supabase/client.ts';

export type QuizSkillCategory = 'listening' | 'reading' | 'writing' | 'speaking';

export interface QuizQuestion {
  id: number;
  category: QuizSkillCategory;
  categoryLabel: string;
  type: string;
  prompt: string;
  contextText?: string;
  audioText?: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

interface LessonQuizViewProps {
  lesson: Lesson;
  vocabData?: LessonVocabulary;
}

// Deterministically generate exactly 24 tasks per lesson (6 Listening, 6 Reading, 6 Writing, 6 Speaking)
function generate24LessonQuestions(lesson: Lesson, vocabData?: LessonVocabulary): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const vocab = vocabData?.vocabulary || [];
  const sentences = lesson.lessonText || [];

  const getVocabItem = (idx: number) => {
    if (vocab.length === 0) {
      return {
        '汉字': '你好',
        'Pinyin': 'nǐ hǎo',
        'Từ loại': 'Chào hỏi',
        'Nghĩa tiếng Việt': 'xin chào'
      };
    }
    return vocab[idx % vocab.length];
  };

  const getSentenceItem = (idx: number) => {
    if (sentences.length === 0) {
      return {
        index: 1,
        hanzi: '你好！',
        pinyin: 'Nǐ hǎo!',
        vietnamese: 'Xin chào!'
      };
    }
    return sentences[idx % sentences.length];
  };

  // ==========================================
  // SECTION 1: LISTENING (6 QUESTIONS: Q1 - Q6)
  // ==========================================
  // Q1: Nghe phát âm từ vựng và chọn chữ Hán
  const w1 = getVocabItem(0);
  const q1Distractors = [getVocabItem(1)['汉字'], getVocabItem(2)['汉字'], getVocabItem(3)['汉字']];
  const q1Options = [w1['汉字'], ...q1Distractors].sort();
  questions.push({
    id: 1,
    category: 'listening',
    categoryLabel: 'Nghe hiểu',
    type: 'listen_word_hanzi',
    prompt: 'Nghe phát âm và chọn chữ Hán chính xác:',
    contextText: 'Nhấn biểu tượng loa để nghe phát âm chuẩn',
    audioText: w1['汉字'],
    options: q1Options,
    correctOptionIndex: q1Options.indexOf(w1['汉字']),
    explanation: `Phát âm là "${w1['汉字']}" (${w1['Pinyin']}), nghĩa là "${w1['Nghĩa tiếng Việt']}".`
  });

  // Q2: Nghe phát âm từ vựng và chọn nghĩa tiếng Việt
  const w2 = getVocabItem(1);
  const q2Distractors = [getVocabItem(0)['Nghĩa tiếng Việt'], getVocabItem(2)['Nghĩa tiếng Việt'], getVocabItem(3)['Nghĩa tiếng Việt']];
  const q2Options = [w2['Nghĩa tiếng Việt'], ...q2Distractors].sort();
  questions.push({
    id: 2,
    category: 'listening',
    categoryLabel: 'Nghe hiểu',
    type: 'listen_word_meaning',
    prompt: 'Nghe từ vựng và chọn nghĩa tiếng Việt tương ứng:',
    audioText: w2['汉字'],
    options: q2Options,
    correctOptionIndex: q2Options.indexOf(w2['Nghĩa tiếng Việt']),
    explanation: `Từ "${w2['汉字']}" (${w2['Pinyin']}) có nghĩa là "${w2['Nghĩa tiếng Việt']}".`
  });

  // Q3: Nghe câu ngắn và chọn phiên âm Pinyin đúng
  const s3 = getSentenceItem(0);
  const q3Distractors = [getSentenceItem(1).pinyin, getSentenceItem(2).pinyin, 'Lǎoshī hǎo, wǒmen qù xuéxiào.'];
  const q3Options = [s3.pinyin, ...q3Distractors].sort();
  questions.push({
    id: 3,
    category: 'listening',
    categoryLabel: 'Nghe hiểu',
    type: 'listen_sentence_pinyin',
    prompt: 'Nghe câu bài khóa và chọn phiên âm Pinyin chuẩn xác:',
    audioText: s3.hanzi,
    options: q3Options,
    correctOptionIndex: q3Options.indexOf(s3.pinyin),
    explanation: `Câu nghe được là "${s3.hanzi}", phiên âm tương ứng là "${s3.pinyin}".`
  });

  // Q4: Nghe câu bài khóa và chọn bản dịch tiếng Việt
  const s4 = getSentenceItem(1);
  const q4Distractors = [getSentenceItem(0).vietnamese, getSentenceItem(2).vietnamese, 'Chúng tôi cùng nhau đi đến trường học.'];
  const q4Options = [s4.vietnamese, ...q4Distractors].sort();
  questions.push({
    id: 4,
    category: 'listening',
    categoryLabel: 'Nghe hiểu',
    type: 'listen_sentence_translation',
    prompt: 'Nghe câu và chọn câu dịch tiếng Việt đúng:',
    audioText: s4.hanzi,
    options: q4Options,
    correctOptionIndex: q4Options.indexOf(s4.vietnamese),
    explanation: `Câu "${s4.hanzi}" (${s4.pinyin}) có nghĩa tiếng Việt: "${s4.vietnamese}".`
  });

  // Q5: Nghe câu đối thoại và chọn câu đáp phù hợp
  const s5 = getSentenceItem(2);
  const s5Reply = getSentenceItem(3).hanzi || '好的，我们一起走吧。';
  const q5Distractors = ['我不客气。', '对不起，我没听懂。', '明天见。'];
  const q5Options = [s5Reply, ...q5Distractors].sort();
  questions.push({
    id: 5,
    category: 'listening',
    categoryLabel: 'Nghe hiểu',
    type: 'listen_dialogue_response',
    prompt: `Nghe lời thoại của nhân vật và chọn câu đáp lại phù hợp trong ngữ cảnh:`,
    contextText: `Ngữ cảnh bài học "${lesson.title}"`,
    audioText: s5.hanzi,
    options: q5Options,
    correctOptionIndex: q5Options.indexOf(s5Reply),
    explanation: `Khi nghe "${s5.hanzi}", câu đáp tự nhiên nhất trong bài khóa là "${s5Reply}".`
  });

  // Q6: Nghe phân biệt âm thanh và thanh điệu từ khóa
  const w6 = getVocabItem(3);
  const q6Options = [
    `${w6['汉字']} (${w6['Pinyin']})`,
    `${getVocabItem(2)['汉字']} (${getVocabItem(2)['Pinyin']})`,
    `${getVocabItem(4)['汉字']} (${getVocabItem(4)['Pinyin']})`,
    `${getVocabItem(5)['汉字']} (${getVocabItem(5)['Pinyin']})`
  ].sort();
  const q6Correct = `${w6['汉字']} (${w6['Pinyin']})`;
  questions.push({
    id: 6,
    category: 'listening',
    categoryLabel: 'Nghe hiểu',
    type: 'listen_tone_discrimination',
    prompt: 'Nghe kỹ phát âm và chọn cặp chữ Hán - Pinyin khớp đúng:',
    audioText: w6['汉字'],
    options: q6Options,
    correctOptionIndex: q6Options.indexOf(q6Correct),
    explanation: `Phát âm rõ ràng là "${w6['汉字']}" (${w6['Pinyin']}).`
  });

  // ==========================================
  // SECTION 2: READING (6 QUESTIONS: Q7 - Q12)
  // ==========================================
  // Q7: Đọc chữ Hán và chọn nghĩa
  const w7 = getVocabItem(4);
  const q7Distractors = [getVocabItem(0)['Nghĩa tiếng Việt'], getVocabItem(1)['Nghĩa tiếng Việt'], getVocabItem(2)['Nghĩa tiếng Việt']];
  const q7Options = [w7['Nghĩa tiếng Việt'], ...q7Distractors].sort();
  questions.push({
    id: 7,
    category: 'reading',
    categoryLabel: 'Đọc hiểu',
    type: 'read_vocab_meaning',
    prompt: `Chữ Hán "${w7['汉字']}" (${w7['Pinyin']}) có nghĩa tiếng Việt là gì?`,
    options: q7Options,
    correctOptionIndex: q7Options.indexOf(w7['Nghĩa tiếng Việt']),
    explanation: `"${w7['汉字']}" có nghĩa là "${w7['Nghĩa tiếng Việt']}". Từ loại: ${w7['Từ loại'] || 'Từ vựng'}.`
  });

  // Q8: Đọc từ vựng và chọn Pinyin
  const w8 = getVocabItem(5);
  const q8Distractors = [getVocabItem(1)['Pinyin'], getVocabItem(2)['Pinyin'], getVocabItem(3)['Pinyin']];
  const q8Options = [w8['Pinyin'], ...q8Distractors].sort();
  questions.push({
    id: 8,
    category: 'reading',
    categoryLabel: 'Đọc hiểu',
    type: 'read_vocab_pinyin',
    prompt: `Phiên âm Pinyin chuẩn của từ "${w8['汉字']}" là gì?`,
    contextText: `Nghĩa tiếng Việt: ${w8['Nghĩa tiếng Việt']}`,
    options: q8Options,
    correctOptionIndex: q8Options.indexOf(w8['Pinyin']),
    explanation: `Từ "${w8['汉字']}" phiên âm đúng là "${w8['Pinyin']}".`
  });

  // Q9: Đọc câu bài khóa và chọn bản dịch đúng
  const s9 = getSentenceItem(4);
  const q9Distractors = [getSentenceItem(1).vietnamese, getSentenceItem(2).vietnamese, getSentenceItem(3).vietnamese];
  const q9Options = [s9.vietnamese, ...q9Distractors].sort();
  questions.push({
    id: 9,
    category: 'reading',
    categoryLabel: 'Đọc hiểu',
    type: 'read_sentence_translation',
    prompt: `Chọn câu dịch tiếng Việt chính xác nhất cho câu bài khóa sau:`,
    contextText: `${s9.hanzi} (${s9.pinyin})`,
    options: q9Options,
    correctOptionIndex: q9Options.indexOf(s9.vietnamese),
    explanation: `Bản dịch chuẩn của câu "${s9.hanzi}" là: "${s9.vietnamese}".`
  });

  // Q10: Điền từ vào chỗ trống trong câu bài khóa
  const w10 = getVocabItem(2);
  const s10 = getSentenceItem(2);
  const blankSentence = s10.hanzi.includes(w10['汉字'])
    ? s10.hanzi.replace(w10['汉字'], ' (____) ')
    : `${s10.hanzi.slice(0, 3)} (____) ${s10.hanzi.slice(3)}`;
  const q10Distractors = [getVocabItem(0)['汉字'], getVocabItem(1)['汉字'], getVocabItem(3)['汉字']];
  const q10Options = [w10['汉字'], ...q10Distractors].sort();
  questions.push({
    id: 10,
    category: 'reading',
    categoryLabel: 'Đọc hiểu',
    type: 'read_fill_blank',
    prompt: `Chọn từ vựng thích hợp điền vào chỗ trống:`,
    contextText: blankSentence,
    options: q10Options,
    correctOptionIndex: q10Options.indexOf(w10['汉字']),
    explanation: `Từ cần điền là "${w10['汉字']}" (${w10['Pinyin']}) để câu hoàn chỉnh và đúng ngữ nghĩa.`
  });

  // Q11: Xác định trật tự ngữ pháp đúng
  const s11 = getSentenceItem(3);
  const q11Options = [
    s11.hanzi,
    `${s11.hanzi.slice(3)}${s11.hanzi.slice(0, 3)}`,
    `${s11.hanzi.slice(2)}${s11.hanzi.slice(0, 2)}`,
    `${s11.hanzi.slice(-3)}${s11.hanzi.slice(0, -3)}`
  ].sort();
  questions.push({
    id: 11,
    category: 'reading',
    categoryLabel: 'Đọc hiểu',
    type: 'read_grammar_order',
    prompt: 'Chọn câu có trật tự ngữ pháp tiếng Trung chuẩn xác:',
    options: q11Options,
    correctOptionIndex: q11Options.indexOf(s11.hanzi),
    explanation: `Cấu trúc câu đúng là "${s11.hanzi}", tuân theo quy tắc ngữ pháp HSK chuẩn.`
  });

  // Q12: Đọc hiểu ngữ cảnh nhân vật
  const s12 = getSentenceItem(1);
  const q12Options = [
    `Câu "${s12.hanzi}" thể hiện thái độ lịch sự, giao tiếp tự nhiên.`,
    `Câu "${s12.hanzi}" là câu mệnh lệnh nghiêm khắc.`,
    `Câu "${s12.hanzi}" thể hiện sự từ chối thẳng thắn.`,
    `Câu "${s12.hanzi}" không dùng trong giao tiếp thường nhật.`
  ];
  questions.push({
    id: 12,
    category: 'reading',
    categoryLabel: 'Đọc hiểu',
    type: 'read_pragmatics',
    prompt: `Đánh giá ngữ dụng của câu bài khóa "${s12.hanzi}":`,
    options: q12Options,
    correctOptionIndex: 0,
    explanation: `Trong ngữ cảnh bài "${lesson.title}", câu biểu đạt sắc thái giao tiếp chuẩn mực và thân thiện.`
  });

  // ==========================================
  // SECTION 3: WRITING (6 QUESTIONS: Q13 - Q18)
  // ==========================================
  // Q13: Xếp từ thành câu
  const s13 = getSentenceItem(5);
  const q13Correct = s13.hanzi;
  const q13Options = [
    q13Correct,
    `${s13.hanzi.slice(2)}${s13.hanzi.slice(0, 2)}`,
    `${s13.hanzi.slice(-2)}${s13.hanzi.slice(0, -2)}`,
    `${s13.hanzi.slice(4)}${s13.hanzi.slice(0, 4)}`
  ].sort();
  questions.push({
    id: 13,
    category: 'writing',
    categoryLabel: 'Kỹ năng Viết',
    type: 'write_sentence_order',
    prompt: `Chọn câu được sắp xếp đúng trật tự cú pháp tiếng Trung:`,
    contextText: `Nghĩa: "${s13.vietnamese}"`,
    options: q13Options,
    correctOptionIndex: q13Options.indexOf(q13Correct),
    explanation: `Trật tự từ đúng là "${q13Correct}".`
  });

  // Q14: Cấu tạo chữ Hán & Bộ thủ
  const w14 = getVocabItem(0);
  const q14Options = [
    `Chữ "${w14['汉字']}" là chữ Hán cơ bản thường gặp trong bài`,
    `Chữ "${w14['汉字']}" luôn đứng một mình, không bao giờ ghép từ`,
    `Chữ "${w14['汉字']}" có 20 nét bút`,
    `Chữ "${w14['汉字']}" không có âm Pinyin`
  ];
  questions.push({
    id: 14,
    category: 'writing',
    categoryLabel: 'Kỹ năng Viết',
    type: 'write_hanzi_structure',
    prompt: `Đặc điểm cấu tạo của chữ Hán "${w14['汉字']}":`,
    options: q14Options,
    correctOptionIndex: 0,
    explanation: `"${w14['汉字']}" (${w14['Pinyin']}) là chữ Hán cốt lõi trong bài học.`
  });

  // Q15: Chọn lượng từ / phó từ phù hợp
  const q15Options = ['个 (gè)', '只 (zhī)', '本 (běn)', '条 (tiáo)'];
  questions.push({
    id: 15,
    category: 'writing',
    categoryLabel: 'Kỹ năng Viết',
    type: 'write_measure_word',
    prompt: 'Chọn lượng từ thông dụng nhất có thể kết hợp với danh từ chỉ người hoặc vật chung:',
    options: q15Options,
    correctOptionIndex: 0,
    explanation: '"个" là lượng từ vạn năng và thông dụng nhất trong tiếng Trung.'
  });

  // Q16: Trợ từ kết cấu & Ngữ khí
  const q16Options = ['的 (de)', '得 (de)', '地 (de)', '了 (le)'];
  questions.push({
    id: 16,
    category: 'writing',
    categoryLabel: 'Kỹ năng Viết',
    type: 'write_particle',
    prompt: 'Trợ từ nào dùng để nối định ngữ và trung tâm ngữ biểu thị quan hệ sở hữu (ví dụ: "sách của tôi")?',
    options: q16Options,
    correctOptionIndex: 0,
    explanation: '"的" là trợ từ sở hữu đặt trước danh từ trung tâm: "我的书" (sách của tôi).'
  });

  // Q17: Hoàn thành câu phán đoán / phủ định
  const q17Options = [
    'Chủ ngữ + 不 + Động từ / Tính từ',
    'Chủ ngữ + 没 + Tính từ',
    'Chủ ngữ + 不有 + Danh từ',
    'Chủ ngữ + 吗 + Động từ'
  ];
  questions.push({
    id: 17,
    category: 'writing',
    categoryLabel: 'Kỹ năng Viết',
    type: 'write_negation_pattern',
    prompt: 'Cấu trúc phủ định cơ bản của hành động hoặc tính chất trong hiện tại là gì?',
    options: q17Options,
    correctOptionIndex: 0,
    explanation: 'Dùng phó từ "不" trước động từ hoặc tính từ để tạo thể phủ định: "我不去", "他不好".'
  });

  // Q18: Dịch câu sang tiếng Trung
  const s18 = getSentenceItem(0);
  const q18Options = [
    s18.hanzi,
    `${s18.hanzi} 吗？`,
    `不 ${s18.hanzi}`,
    `${s18.hanzi} 了。`
  ].sort();
  questions.push({
    id: 18,
    category: 'writing',
    categoryLabel: 'Kỹ năng Viết',
    type: 'write_translation_zh',
    prompt: `Chuyển dịch câu sau sang chữ Hán chính xác:`,
    contextText: `"${s18.vietnamese}"`,
    options: q18Options,
    correctOptionIndex: q18Options.indexOf(s18.hanzi),
    explanation: `Câu dịch chữ Hán chuẩn là "${s18.hanzi}".`
  });

  // ==========================================
  // SECTION 4: SPEAKING (6 QUESTIONS: Q19 - Q24)
  // ==========================================
  // Q19: Phát âm từ vựng trọng tâm
  const w19 = getVocabItem(1);
  const q19Options = [
    `Đọc chuẩn thanh điệu "${w19['Pinyin']}"`,
    `Đọc không thanh điệu`,
    `Đọc kéo dài sai dấu`,
    `Đọc biến đổi âm sang từ khác`
  ];
  questions.push({
    id: 19,
    category: 'speaking',
    categoryLabel: 'Khẩu ngữ & Nói',
    type: 'speak_word_pronunciation',
    prompt: `Luyện đọc phát âm từ vựng trọng tâm "${w19['汉字']}":`,
    contextText: `Pinyin chuẩn: ${w19['Pinyin']} | Nghĩa: ${w19['Nghĩa tiếng Việt']}`,
    audioText: w19['汉字'],
    options: q19Options,
    correctOptionIndex: 0,
    explanation: `Nhấn nút loa để nghe mẫu và luyện đọc to "${w19['汉字']}" (${w19['Pinyin']}).`
  });

  // Q20: Phát âm câu trôi chảy
  const s20 = getSentenceItem(1);
  const q20Options = [
    `Đọc đúng ngữ điệu tự nhiên của câu "${s20.hanzi}"`,
    `Đọc từng chữ rời rạc, ngắt quãng`,
    `Đọc sai toàn bộ thanh điệu`,
    `Bỏ sót chữ cuối câu`
  ];
  questions.push({
    id: 20,
    category: 'speaking',
    categoryLabel: 'Khẩu ngữ & Nói',
    type: 'speak_sentence_fluency',
    prompt: `Luyện phát âm câu bài khóa trôi chảy và đúng ngữ điệu:`,
    contextText: `${s20.hanzi} (${s20.pinyin})`,
    audioText: s20.hanzi,
    options: q20Options,
    correctOptionIndex: 0,
    explanation: `Luyện phát âm cả câu liền mạch theo giọng đọc mẫu chuẩn.`
  });

  // Q21: Khẩu ngữ phản xạ chào hỏi / hồi đáp
  const q21Options = [
    '您好！(Nín hǎo!) - Lịch sự, tôn kính',
    '再见！(Zàijiàn!) - Chào tạm biệt',
    '没关系！(Méi guānxi!) - Không có gì',
    '不用谢！(Bú yòng xiè!) - Không cần cảm ơn'
  ];
  questions.push({
    id: 21,
    category: 'speaking',
    categoryLabel: 'Khẩu ngữ & Nói',
    type: 'speak_response_polite',
    prompt: 'Khi chào hỏi giáo viên hoặc người lớn tuổi, cách phát ngôn nào lịch sự nhất?',
    audioText: '您好！',
    options: q21Options,
    correctOptionIndex: 0,
    explanation: 'Dùng "您好" thay cho "你好" để thể hiện sự kính trọng đối với người lớn tuổi, thầy cô giáo.'
  });

  // Q22: Ngữ điệu câu nghi vấn
  const q22Options = [
    'Cuối câu lên giọng nhẹ nhàng với trợ từ "吗"',
    'Cuối câu gằn giọng gay gắt',
    'Đọc ngang bằng không ngắt nghỉ',
    'Hạ giọng xuống trầm nhất'
  ];
  questions.push({
    id: 22,
    category: 'speaking',
    categoryLabel: 'Khẩu ngữ & Nói',
    type: 'speak_question_intonation',
    prompt: 'Ngữ điệu chuẩn khi phát âm câu hỏi có trợ từ "吗" (ví dụ: "你好吗？") là gì?',
    audioText: '你好吗？',
    options: q22Options,
    correctOptionIndex: 0,
    explanation: 'Câu hỏi nghi vấn với "吗" thường có ngữ điệu hơi nâng nhẹ ở cuối câu.'
  });

  // Q23: Phản xạ hội thoại nhập vai
  const s23 = getSentenceItem(2);
  const q23Options = [
    'Lắng nghe và hồi đáp rõ ràng, phát âm tròn vành rõ chữ',
    'Không nói gì và chuyển câu',
    'Nói tiếng Việt thay vì tiếng Trung',
    'Đọc lặp lại chính câu hỏi của đối phương'
  ];
  questions.push({
    id: 23,
    category: 'speaking',
    categoryLabel: 'Khẩu ngữ & Nói',
    type: 'speak_roleplay',
    prompt: `Đóng vai nhân vật hồi đáp lại lời thoại: "${s23.hanzi}":`,
    contextText: `Bản dịch: "${s23.vietnamese}"`,
    audioText: s23.hanzi,
    options: q23Options,
    correctOptionIndex: 0,
    explanation: 'Rèn luyện phản xạ giao tiếp tự tin và tự nhiên theo hội thoại bài học.'
  });

  // Q24: Diễn đạt tổng hợp tình huống
  const q24Options = [
    `Tự tin giới thiệu bản thân hoặc chào hỏi theo ngữ cảnh bài "${lesson.title}"`,
    `Chỉ đọc thầm trong đầu`,
    `Đọc thật nhanh để xong bài`,
    `Bỏ qua phần luyện nói`
  ];
  questions.push({
    id: 24,
    category: 'speaking',
    categoryLabel: 'Khẩu ngữ & Nói',
    type: 'speak_summary',
    prompt: `Mục tiêu đạt được về kỹ năng khẩu ngữ sau bài học này:`,
    options: q24Options,
    correctOptionIndex: 0,
    explanation: 'Mục tiêu là ứng dụng ngôn ngữ vào giao tiếp thực tế một cách tự tin và lưu loát.'
  });

  return questions;
}

export const LessonQuizView: React.FC<LessonQuizViewProps> = ({ lesson, vocabData }) => {
  const { showToast } = useToast();

  const questions = useMemo(() => {
    return generate24LessonQuestions(lesson, vocabData);
  }, [lesson, vocabData]);

  // Quiz state machine: 'idle' | 'in_progress' | 'submitted' | 'reviewing'
  const [quizState, setQuizState] = useState<'idle' | 'in_progress' | 'submitted' | 'reviewing'>('idle');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});

  const handleReset = () => {
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setQuizState('in_progress');
    showToast('Bắt đầu làm bài kiểm tra 24 câu!', 'info');
  };

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    if (quizState === 'submitted' || quizState === 'reviewing') return;
    setUserAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const currentQ = questions[currentQuestionIndex];
  const answeredCount = Object.keys(userAnswers).length;

  const handlePlayAudio = async (text?: string) => {
    if (!text) return;
    try {
      await audioManager.playText(text, {
        id: `quiz_q${currentQ.id}`,
        entityType: 'exam',
      });
    } catch {
      showToast('Không thể phát âm thanh', 'warning');
    }
  };

  // Performance calculation across the 4 skills
  const scoreStats = useMemo(() => {
    let correct = 0;
    const wrongList: QuizQuestion[] = [];
    const skillScores: Record<QuizSkillCategory, { correct: number; total: number }> = {
      listening: { correct: 0, total: 6 },
      reading: { correct: 0, total: 6 },
      writing: { correct: 0, total: 6 },
      speaking: { correct: 0, total: 6 },
    };

    questions.forEach((q) => {
      const selected = userAnswers[q.id];
      if (selected !== undefined && selected === q.correctOptionIndex) {
        correct++;
        skillScores[q.category].correct++;
      } else {
        wrongList.push(q);
      }
    });

    const percent = Math.round((correct / 24) * 100);
    return {
      correctCount: correct,
      totalCount: 24,
      wrongCount: wrongList.length,
      wrongList,
      percent,
      skillScores
    };
  }, [questions, userAnswers]);

  const handleSubmitQuiz = async () => {
    if (answeredCount < questions.length) {
      showToast(`Bạn còn ${questions.length - answeredCount} câu chưa trả lời`, 'warning');
      return;
    }

    setQuizState('submitted');
    showToast(`Đã hoàn thành! Điểm số: ${scoreStats.correctCount}/${scoreStats.totalCount} (${scoreStats.percent}%)`, 'success');

    // 1. Persist mistakes to mistakeRepository & Supabase
    for (const wrongQ of scoreStats.wrongList) {
      const userSelectedIdx = userAnswers[wrongQ.id];
      const selectedText = userSelectedIdx !== undefined ? wrongQ.options[userSelectedIdx] : 'Chưa chọn';
      const correctText = wrongQ.options[wrongQ.correctOptionIndex];

      mistakeRepository.addMistake({
        category: wrongQ.category,
        prompt: wrongQ.prompt,
        contextText: wrongQ.contextText,
        userAnswer: selectedText,
        correctAnswer: correctText,
        explanation: wrongQ.explanation,
        lessonKey: lesson.lessonId,
      });
    }

    // 2. Persist lesson progress if passed (>= 60%)
    if (scoreStats.percent >= 60) {
      progressRepository.markLessonComplete(lesson.level, lesson.lessonNumber);
    }

    // 3. Sync to Supabase learner_progress
    try {
      const client = getSupabaseClient();
      const userId = getLearnerSessionId();
      if (client) {
        await (client as any).from('learner_progress').upsert({
          id: `progress_${userId}_${lesson.lessonId}`,
          user_id: userId,
          entity_type: 'lesson',
          entity_id: lesson.lessonId,
          status: scoreStats.percent >= 60 ? 'completed' : 'in_progress',
          score: scoreStats.percent,
          review_count: 1,
          last_reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      }
    } catch {
      // Local storage fallback already succeeded
    }
  };

  // 1. IDLE STATE
  if (quizState === 'idle') {
    return (
      <div className="w-full max-w-2xl mx-auto bg-surface rounded-3xl border border-border-subtle p-6 sm:p-10 shadow-2xs text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-secondary/15 text-secondary flex items-center justify-center mx-auto shadow-xs">
          <Award className="w-8 h-8" />
        </div>

        <div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-primary-soft text-primary mb-2">
            HSK {lesson.level} • Bài {lesson.lessonNumber}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
            Đánh giá toàn diện 4 Kỹ năng (24 Nhiệm vụ)
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary mt-2 max-w-lg mx-auto leading-relaxed">
            Hệ thống chuẩn hóa 24 câu hỏi kiểm tra đầy đủ 4 kỹ năng ngôn ngữ từ bài khóa &ldquo;{lesson.title}&rdquo;: 6 Nghe, 6 Đọc, 6 Viết và 6 Nói.
          </p>
        </div>

        {/* 4 Skills Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
          <div className="p-3.5 rounded-2xl bg-surface-secondary/70 border border-border-subtle space-y-1">
            <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
              <Headphones className="w-4 h-4" />
              <span>Nghe hiểu</span>
            </div>
            <p className="text-[11px] text-text-muted">6 câu có audio phát âm chuẩn zh-CN</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-surface-secondary/70 border border-border-subtle space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
              <BookOpen className="w-4 h-4" />
              <span>Đọc hiểu</span>
            </div>
            <p className="text-[11px] text-text-muted">6 câu từ vựng, ngữ nghĩa &amp; ngữ pháp</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-surface-secondary/70 border border-border-subtle space-y-1">
            <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-xs">
              <PenTool className="w-4 h-4" />
              <span>Kỹ năng Viết</span>
            </div>
            <p className="text-[11px] text-text-muted">6 câu xếp trật tự từ &amp; cấu trúc</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-surface-secondary/70 border border-border-subtle space-y-1">
            <div className="flex items-center gap-1.5 text-amber-600 font-bold text-xs">
              <Mic className="w-4 h-4" />
              <span>Khẩu ngữ &amp; Nói</span>
            </div>
            <p className="text-[11px] text-text-muted">6 câu phát âm &amp; phản xạ ngữ điệu</p>
          </div>
        </div>

        <button
          data-testid="start-lesson-quiz-btn"
          onClick={() => setQuizState('in_progress')}
          className="px-8 py-3.5 bg-primary hover:bg-primary-dark text-white rounded-full font-bold text-sm shadow-md transition-all active:scale-95 inline-flex items-center gap-2"
        >
          <span>Bắt đầu bài kiểm tra 24 câu</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // 2. SUBMITTED / RESULTS STATE
  if (quizState === 'submitted') {
    const isPassed = scoreStats.percent >= 60;
    return (
      <div className="w-full max-w-2xl mx-auto bg-surface rounded-3xl border border-border-subtle p-6 sm:p-10 shadow-2xs text-center space-y-6 animate-fadeIn">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-md ${
            isPassed ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
          }`}
        >
          {isPassed ? <CheckCircle2 className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted block mb-1">
            Kết quả đánh giá toàn diện
          </span>
          <h2 className="text-2xl font-bold text-text-primary">
            {isPassed ? 'Chúc mừng! Bạn đã vượt qua bài kiểm tra!' : 'Cần ôn tập thêm bài học này'}
          </h2>
          <div className="flex items-baseline justify-center gap-1 mt-3">
            <span className="text-4xl sm:text-5xl font-black text-primary">
              {scoreStats.percent}%
            </span>
            <span className="text-sm font-semibold text-text-muted">
              ({scoreStats.correctCount}/{scoreStats.totalCount} câu đúng)
            </span>
          </div>
        </div>

        {/* 4 Skill Score Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
          <div className="p-3.5 rounded-2xl bg-surface-secondary/70 border border-border-subtle">
            <span className="text-[11px] font-bold text-text-muted block">Nghe hiểu</span>
            <p className="text-base font-bold text-primary mt-0.5">
              {scoreStats.skillScores.listening.correct} / 6
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-surface-secondary/70 border border-border-subtle">
            <span className="text-[11px] font-bold text-text-muted block">Đọc hiểu</span>
            <p className="text-base font-bold text-emerald-600 mt-0.5">
              {scoreStats.skillScores.reading.correct} / 6
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-surface-secondary/70 border border-border-subtle">
            <span className="text-[11px] font-bold text-text-muted block">Kỹ năng Viết</span>
            <p className="text-base font-bold text-indigo-600 mt-0.5">
              {scoreStats.skillScores.writing.correct} / 6
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-surface-secondary/70 border border-border-subtle">
            <span className="text-[11px] font-bold text-text-muted block">Khẩu ngữ &amp; Nói</span>
            <p className="text-base font-bold text-amber-600 mt-0.5">
              {scoreStats.skillScores.speaking.correct} / 6
            </p>
          </div>
        </div>

        {scoreStats.wrongCount > 0 && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-text-secondary text-left space-y-1">
            <strong className="text-amber-600 font-bold block">
              Đã ghi nhận {scoreStats.wrongCount} câu chưa chính xác vào Sổ tay câu sai:
            </strong>
            <p>
              Các câu này đã được tự động lưu vào mục Ôn tập để bạn luyện tập lại bất cứ lúc nào.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setQuizState('reviewing')}
            className="px-6 py-2.5 bg-surface hover:bg-surface-secondary border border-border-subtle text-text-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <Eye className="w-4 h-4" />
            <span>Xem lại chi tiết 24 câu</span>
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Làm lại bài kiểm tra</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. IN_PROGRESS OR REVIEWING STATE
  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Quiz Progress Header */}
      <div className="bg-surface rounded-2xl border border-border-subtle p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary-soft text-primary uppercase">
                {currentQ.categoryLabel}
              </span>
              <h2 className="text-sm sm:text-base font-bold text-text-primary">
                HSK {lesson.level} Bài {lesson.lessonNumber} • Câu {currentQuestionIndex + 1} / 24
              </h2>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              {quizState === 'reviewing' ? 'Chế độ xem lại bài đã nộp' : 'Chọn đáp án chính xác nhất'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-surface-secondary text-text-secondary border border-border-subtle">
              Đã làm: {answeredCount} / 24
            </span>
            {quizState === 'in_progress' && (
              <button
                onClick={handleSubmitQuiz}
                className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-xs transition-colors"
              >
                Nộp bài
              </button>
            )}
          </div>
        </div>

        {/* 24-Step Indicator Bar */}
        <div className="grid grid-cols-12 sm:grid-cols-24 gap-1 pt-1">
          {questions.map((q, idx) => {
            const isAnswered = userAnswers[q.id] !== undefined;
            const isCurrent = currentQuestionIndex === idx;
            const isCorrect = userAnswers[q.id] === q.correctOptionIndex;

            let bgColor = 'bg-surface-secondary text-text-muted';
            if (quizState === 'reviewing') {
              bgColor = isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white';
            } else if (isAnswered) {
              bgColor = 'bg-primary text-white';
            }

            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`h-7 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center ${bgColor} ${
                  isCurrent ? 'ring-2 ring-primary ring-offset-1' : ''
                }`}
                title={`Câu ${q.id} (${q.categoryLabel})`}
              >
                {q.id}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-surface rounded-3xl border border-border-subtle p-6 sm:p-8 shadow-xs space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
              Nhiệm vụ #{currentQ.id} • {currentQ.categoryLabel}
            </span>
            {currentQ.audioText && (
              <button
                onClick={() => handlePlayAudio(currentQ.audioText)}
                className="p-2 rounded-xl bg-primary-soft text-primary hover:bg-primary hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold"
                title="Nghe phát âm"
                aria-label="Nghe phát âm"
              >
                <Volume2 className="w-4 h-4" />
                <span>Nghe phát âm</span>
              </button>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-text-primary leading-relaxed">
            {currentQ.prompt}
          </h3>

          {currentQ.contextText && (
            <div className="p-3.5 rounded-2xl bg-surface-secondary/70 border border-border-subtle text-xs sm:text-sm text-text-secondary leading-relaxed">
              {currentQ.contextText}
            </div>
          )}
        </div>

        {/* Options List */}
        <div className="space-y-3">
          {currentQ.options.map((option, optIdx) => {
            const isSelected = userAnswers[currentQ.id] === optIdx;
            const isCorrect = currentQ.correctOptionIndex === optIdx;
            const showReviewFeedback = quizState === 'reviewing';

            let btnStyle = 'bg-surface hover:bg-surface-secondary border-border-subtle text-text-primary';
            if (showReviewFeedback) {
              if (isCorrect) {
                btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 font-bold';
              } else if (isSelected) {
                btnStyle = 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300';
              }
            } else if (isSelected) {
              btnStyle = 'bg-primary-soft border-primary text-primary font-bold shadow-2xs';
            }

            return (
              <button
                key={optIdx}
                onClick={() => handleSelectOption(currentQ.id, optIdx)}
                disabled={showReviewFeedback}
                className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 text-sm font-medium ${btnStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-surface-secondary border border-border-subtle flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span className="font-hanzi text-sm sm:text-base">{option}</span>
                </div>

                {showReviewFeedback && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                )}
                {showReviewFeedback && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Review Explanation */}
        {quizState === 'reviewing' && (
          <div className="p-4 rounded-2xl bg-primary-soft/30 border border-primary/20 space-y-1.5 text-xs text-text-secondary animate-fadeIn">
            <span className="text-primary font-bold block flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Giải thích đáp án chi tiết:</span>
            </span>
            <p className="leading-relaxed">{currentQ.explanation}</p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
          <button
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-secondary border border-border-subtle text-xs font-semibold text-text-secondary disabled:opacity-40 flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Câu trước</span>
          </button>

          {currentQuestionIndex + 1 < questions.length ? (
            <button
              onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <span>Câu sau</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : quizState === 'in_progress' ? (
            <button
              onClick={handleSubmitQuiz}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <span>Nộp bài 24 câu</span>
            </button>
          ) : (
            <button
              onClick={handleReset}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Làm lại từ đầu</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
