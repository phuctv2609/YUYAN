import fs from 'node:fs';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const url = envLocal.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const adminKey = fs.readFileSync('.env.admin.local', 'utf-8').match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim();
const supabase = createClient(url, adminKey);

const BENCHMARK_ITEMS = [
  {
    word: '学习',
    pinyin: 'xué xí',
    coreMeaning: 'Học tập, tiếp thu kiến thức và kỹ năng một cách chủ động thông qua việc đọc, thực hành hoặc rèn luyện.',
    partOfSpeech: 'Động từ / Danh từ',
    grammarPatterns: [
      {
        pattern: '学习 + Danh từ (kiến thức / kỹ năng)',
        explanation: 'Dùng như động từ mang tân ngữ chỉ môn học, ngôn ngữ hoặc kỹ năng (ví dụ: 学习汉语, 学习技术).'
      },
      {
        pattern: '向 + Đối tượng + 学习',
        explanation: 'Cấu trúc biểu đạt việc noi gương hoặc học hỏi kinh nghiệm từ một người hay tập thể (ví dụ: 向老师学习).'
      }
    ],
    exampleSentences: [
      {
        simplified: '他在北京大学学习汉语。',
        pinyin: 'Tā zài Běijīng Dàxué xuéxí Hànyǔ.',
        vietnamese: 'Anh ấy học tiếng Trung tại Đại học Bắc Kinh.',
        context: 'Học tập trường lớp'
      },
      {
        simplified: '我们要互相学习，共同进步。',
        pinyin: 'Wǒmen yào hùxiāng xuéxí, gòngtóng jìnbù.',
        vietnamese: 'Chúng ta cần học hỏi lẫn nhau để cùng nhau tiến bộ.',
        context: 'Giao tiếp công sở / Bạn bè'
      },
      {
        simplified: '良好的学习习惯对考试非常重要。',
        pinyin: 'Liánghǎo de xuéxí xíguàn duì kǎoshì fēicháng zhòngyào.',
        vietnamese: 'Thói quen học tập tốt rất quan trọng đối với các kỳ thi.',
        context: 'Khuyên bảo / Giáo dục'
      }
    ],
    commonPitfalls: 'Phân biệt "学习" (xuéxí) và "学" (xué): "学" thường dùng trong khẩu ngữ thân mật cho hành động học cụ thể (như 学开车, 学做饭); "学习" mang tính trang trọng, toàn diện hơn và có thể làm danh từ (như 学习成绩, 学习计划).',
    collocations: ['学习汉语 (Học tiếng Trung)', '学习态度 (Thái độ học tập)', '学习方法 (Phương pháp học tập)'],
    lessonNotes: 'Xuất hiện trọng tâm trong HSK 1 Bài 3 và xuyên suốt toàn bộ giáo trình HSK 1–6.'
  },
  {
    word: '苹果',
    pinyin: 'píng guǒ',
    coreMeaning: 'Quả táo tây (loại trái cây phổ biến vỏ đỏ hoặc xanh, vị ngọt giòn); nghĩa phái sinh chỉ thương hiệu công nghệ Apple.',
    partOfSpeech: 'Danh từ',
    grammarPatterns: [
      {
        pattern: 'Số từ + 个/斤 + 苹果',
        explanation: 'Lượng từ đi kèm quả táo là "个" (chiếc, quả) hoặc đơn vị cân đo "斤" (cân nửa ký Trung Quốc).'
      }
    ],
    exampleSentences: [
      {
        simplified: '桌子上放着几个新鲜的苹果。',
        pinyin: 'Zhuōzi shàng fàngzhe jǐ gè xīnxiān de píngguǒ.',
        vietnamese: 'Trên bàn có để mấy quả táo tươi ngon.',
        context: 'Đời sống thường nhật'
      },
      {
        simplified: '我想买两斤红富士苹果。',
        pinyin: 'Wǒ xiǎng mǎi liǎng jīn Hóngfùshì píngguǒ.',
        vietnamese: 'Tôi muốn mua hai cân táo Red Fuji.',
        context: 'Mua sắm chợ / Siêu thị'
      },
      {
        simplified: '一天一苹果，医生远离我。',
        pinyin: 'Yī tiān yī píngguǒ, yīshēng yuǎnlí wǒ.',
        vietnamese: 'Mỗi ngày một quả táo, bác sĩ tránh xa ta (tục ngữ sức khỏe).',
        context: 'Sức khỏe'
      }
    ],
    commonPitfalls: 'Chú ý âm Hán Việt là "Bình quả" (chữ 平 đồng âm với 平安 - bình an, nên người Trung Quốc có phong tục tặng táo vào đêm Giáng sinh Bình An).',
    collocations: ['吃苹果 (Ăn táo)', '削苹果 (Gọt vỏ táo)', '苹果树 (Cây táo)'],
    lessonNotes: 'Từ vựng nền tảng HSK 1, xuất hiện trong các bài mua sắm thực phẩm và giao tiếp đời sống.'
  },
  {
    word: '电脑',
    pinyin: 'diàn nǎo',
    coreMeaning: 'Máy vi tính, máy tính điện tử (nghĩa đen: não điện).',
    partOfSpeech: 'Danh từ',
    grammarPatterns: [
      {
        pattern: '台 / 部 + 电脑',
        explanation: 'Lượng từ chuẩn của máy tính là "台" (tái) hoặc "部" (bù).'
      }
    ],
    exampleSentences: [
      {
        simplified: '我买了一台新的笔记本电脑。',
        pinyin: 'Wǒ mǎi le yī tái xīn de bǐjìběn diànnǎo.',
        vietnamese: 'Tôi vừa mua một chiếc máy tính xách tay mới.',
        context: 'Công nghệ / Mua sắm'
      },
      {
        simplified: '他整天坐在电脑前工作。',
        pinyin: 'Tā zhěngtiān zuò zài diànnǎo qián gōngzuò.',
        vietnamese: 'Anh ấy ngồi làm việc trước máy tính cả ngày.',
        context: 'Công sở'
      },
      {
        simplified: '电脑突然死机了，资料还没保存。',
        pinyin: 'Diànnǎo tūrán sǐjī le, zīliào hái méi bǎocún.',
        vietnamese: 'Máy tính đột nhiên bị đơ, tài liệu vẫn chưa kịp lưu.',
        context: 'Sự cố văn phòng'
      }
    ],
    commonPitfalls: 'Phân biệt "台式电脑" (máy tính bàn để bàn) và "笔记本电脑" (laptop xách tay) hoặc "平板电脑" (máy tính bảng).',
    collocations: ['开电脑 (Mở máy tính)', '关电脑 (Tắt máy tính)', '电脑屏幕 (Màn hình máy tính)'],
    lessonNotes: 'Từ vựng quan trọng HSK 1 Bài 13 và xuất hiện nhiều trong các văn cảnh công nghệ.'
  },
  {
    word: '阿姨',
    pinyin: 'ā yí',
    coreMeaning: 'Dì (em gái hoặc chị gái của mẹ); xưng hô thân mật tôn kính với phụ nữ trạc tuổi mẹ; người giúp việc, bảo mẫu.',
    partOfSpeech: 'Danh từ xưng hô',
    grammarPatterns: [
      {
        pattern: 'Họ + 阿姨 (ví dụ: 王阿姨, 张阿姨)',
        explanation: 'Cách gọi lịch sự đối với phụ nữ trung niên quen biết hoặc hàng xóm.'
      }
    ],
    exampleSentences: [
      {
        simplified: '李阿姨对我非常热情。',
        pinyin: 'Lǐ āyí duì wǒ fēicháng rèqíng.',
        vietnamese: 'Dì Lý đối với tôi vô cùng niềm nở nhiệt tình.',
        context: 'Hàng xóm / Xã giao'
      },
      {
        simplified: '周末请阿姨来家里做扫除。',
        pinyin: 'Zhōumò qǐng āyí lái jiālǐ zuò sǎochú.',
        vietnamese: 'Cuối tuần mời cô giúp việc đến nhà dọn dẹp vệ sinh.',
        context: 'Dịch vụ gia đình'
      },
      {
        simplified: '阿姨好！请问洗手间在哪里？',
        pinyin: 'Āyí hǎo! Qǐngwèn xǐshǒujiān zài nǎlǐ?',
        vietnamese: 'Cháu chào cô ạ! Xin hỏi nhà vệ sinh ở đâu ạ?',
        context: 'Hỏi đường / Giao tiếp lịch sự'
      }
    ],
    commonPitfalls: 'Không dùng "阿姨" để gọi những cô gái trẻ hoặc phụ nữ chưa lập gia đình (nên dùng "小姐" hoặc xưng hô trung tính). Ở các thành phố lớn Trung Quốc, "阿姨" cũng thường được dùng để chỉ cô giúp việc/bảo mẫu một cách trân trọng.',
    collocations: ['王阿姨 (Dì Vương)', '家政阿姨 (Cô giúp việc gia đình)', '清洁阿姨 (Cô lao công)'],
    lessonNotes: 'Từ vựng HSK 2 cơ bản trong các bài học gia đình và chào hỏi xã hội.'
  },
  {
    word: '不肯',
    pinyin: 'bù kěn',
    coreMeaning: 'Không chịu, không bằng lòng, từ chối làm một việc gì đó dù được yêu cầu hoặc thuyết phục.',
    partOfSpeech: 'Động từ năng nguyện phủ định',
    grammarPatterns: [
      {
        pattern: 'Chủ ngữ + 不肯 + Động từ',
        explanation: 'Biểu thị sự từ chối, không cam lòng hoặc không có ý chí muốn thực hiện hành động đó.'
      }
    ],
    exampleSentences: [
      {
        simplified: '小孩子生病了，不肯吃药。',
        pinyin: 'Xiǎoháizi shēngbìng le, bù kěn chī yào.',
        vietnamese: 'Đứa trẻ bị ốm nhưng không chịu uống thuốc.',
        context: 'Gia đình / Chăm sóc sức khỏe'
      },
      {
        simplified: '无论大家怎么劝，他都不肯放弃。',
        pinyin: 'Wúlùn dàjiā zěnme quàn, tā dōu bù kěn fàngqì.',
        vietnamese: 'Bất kể mọi người khuyên giải thế nào, anh ấy cũng không chịu từ bỏ.',
        context: 'Nghị lực / Quyết tâm'
      },
      {
        simplified: '他心里有委屈，却不肯说出来。',
        pinyin: 'Tā xīn lǐ yǒu wěiqu, què bù kěn shuō chūlái.',
        vietnamese: 'Trong lòng anh ấy có nỗi oan ức nhưng lại không chịu nói ra.',
        context: 'Tâm lý / Tình cảm'
      }
    ],
    commonPitfalls: 'Phân biệt "不肯" (thiếu ý muốn chủ quan, không chịu làm dù có thể) với "不能" (không có khả năng hoặc bị hoàn cảnh cấm đoán) và "不会" (không biết cách làm hoặc không có kỹ năng).',
    collocations: ['不肯认输 (Không chịu nhận thua)', '不肯松口 (Không chịu nhượng bộ/mở lời)', '不肯妥协 (Không chịu thỏa hiệp)'],
    lessonNotes: 'Cụm động từ năng nguyện quan trọng thuộc nhóm HSK 3–4, thường dùng trong miêu tả tính cách và đối thoại.'
  },
  {
    word: '滋润',
    pinyin: 'zī rùn',
    coreMeaning: 'Nhuận, ẩm mượt, làm ẩm (nghĩa gốc); nghĩa bóng chỉ cuộc sống ấm no, thoải mái, sung túc.',
    partOfSpeech: 'Tính từ / Động từ',
    grammarPatterns: [
      {
        pattern: '滋润 + Tân ngữ (da dẻ, tâm hồn)',
        explanation: 'Dùng như động từ: nuôi dưỡng, làm dịu và cung cấp độ ẩm.'
      },
      {
        pattern: 'Cuộc sống / Ngày tháng + 过得很滋润',
        explanation: 'Khẩu ngữ biểu thị cuộc sống trôi qua rất dễ chịu, kinh tế dư dả, tâm trạng vui vẻ.'
      }
    ],
    exampleSentences: [
      {
        simplified: '秋天天气干燥，需要多喝水滋润喉咙。',
        pinyin: 'Qiūtiān tiānqì gānzào, xūyào duō hē shuǐ zīrùn hóulóng.',
        vietnamese: 'Thời tiết mùa thu hanh khô, cần uống nhiều nước để làm ẩm và dịu cổ họng.',
        context: 'Chăm sóc sức khỏe'
      },
      {
        simplified: '春天的小雨滋润着大地的万物。',
        pinyin: 'Chūntiān de xiǎoyǔ zīrùnzhe dàdì de wànwù.',
        vietnamese: 'Cơn mưa xuân tưới mát và nuôi dưỡng vạn vật trên mặt đất.',
        context: 'Văn học / Thiên nhiên'
      },
      {
        simplified: '退休以后，老两口的日子过得挺滋润的。',
        pinyin: 'Tuìxiū yǐhòu, lǎo liǎng kǒu de rìzi guò de tǐng zīrùn de.',
        vietnamese: 'Sau khi nghỉ hưu, hai ông bà sống một cuộc đời khá an nhàn và sung túc.',
        context: 'Đời sống gia đình'
      }
    ],
    commonPitfalls: 'Người học thường chỉ biết nghĩa "ẩm ướt" (dưỡng ẩm) mà bỏ quên nghĩa bóng cực kỳ phổ biến trong đời sống: cuộc sống nhàn nhã, ấm no (日子过得很滋润).',
    collocations: ['滋润皮肤 (Dưỡng ẩm cho da)', '滋润心田 (Tưới mát tâm hồn)', '日子过得滋润 (Sống sung túc, ấm no)'],
    lessonNotes: 'Từ vựng cao cấp HSK 5–6, rất hay xuất hiện trong bài đọc hiểu văn học và phóng sự xã hội.'
  },
  {
    word: '致力于',
    pinyin: 'zhì lì yú',
    coreMeaning: 'Dốc sức vào, cống hiến hết mình cho, nỗ lực kiên trì vì một mục tiêu cao cả hoặc sự nghiệp lớn lao.',
    partOfSpeech: 'Cụm động từ trang trọng (Động từ + Giới từ)',
    grammarPatterns: [
      {
        pattern: 'Chủ ngữ (Cá nhân / Tổ chức / Quốc gia) + 致力于 + Danh từ / Động từ',
        explanation: 'Sau "致力于" luôn là mục đích, lĩnh vực nghiên cứu hoặc sứ mệnh phát triển (ví dụ: 致力于环境保护).'
      }
    ],
    exampleSentences: [
      {
        simplified: '本公司长期致力于绿色环保技术的研发。',
        pinyin: 'Běn gōngsī chángqī zhìlì yú lǜsè huánbǎo jìshù de yánfā.',
        vietnamese: 'Công ty chúng tôi lâu nay luôn dốc sức vào việc nghiên cứu và phát triển công nghệ bảo vệ môi trường xanh.',
        context: 'Doanh nghiệp / Khoa học'
      },
      {
        simplified: '两位学者一生致力于两国文化的交流与互鉴。',
        pinyin: 'Liǎng wèi xuézhě yīshēng zhìlì yú liǎng guó wénhuà de jiāoliú yǔ hùjiàn.',
        vietnamese: 'Hai học giả đã cống hiến cả cuộc đời cho việc giao lưu và học hỏi lẫn nhau giữa văn hóa hai nước.',
        context: 'Học thuật / Ngoại giao'
      },
      {
        simplified: '国际社会应共同致力于维护世界和平与稳定。',
        pinyin: 'Guójì shèhuì yīng gòngtóng zhìlì yú wéihù shìjiè hépíng yǔ wěndìng.',
        vietnamese: 'Cộng đồng quốc tế cần chung tay dốc sức vì việc gìn giữ hòa bình và ổn định của thế giới.',
        context: 'Chính trị / Ngoại giao quốc tế'
      }
    ],
    commonPitfalls: 'Đây là từ mang phong cách thư diện ngữ (báo chí, ngoại giao, tuyên ngôn doanh nghiệp). Không dùng trong các tình huống vụn vặt đời thường (không nói "tôi dốc sức nấu cơm").',
    collocations: ['致力于创新 (Dốc sức đổi mới sáng tạo)', '致力于公益事业 (Cống hiến cho sự nghiệp công ích)', '致力于和平 (Nỗ lực vì hòa bình)'],
    lessonNotes: 'Từ vựng nòng cốt HSK 6 và HSK 3.0 Cao cấp, thường gặp trong các đề thi đọc hiểu tin tức nghị luận.'
  }
];

async function seed() {
  console.log(`Seeding ${BENCHMARK_ITEMS.length} verified AI word usage explanations into Supabase...`);
  const nowIso = new Date().toISOString();

  for (const item of BENCHMARK_ITEMS) {
    const contextHash = crypto
      .createHash('md5')
      .update(`${item.word}_${item.pinyin}__`)
      .digest('hex')
      .slice(0, 16);

    const fullData = {
      ...item,
      generatedAt: nowIso,
      model: 'gemini-1.5-flash-verified'
    };

    const row = {
      word: item.word,
      context_hash: contextHash,
      prompt_version: 'v1.0',
      explanation_json: fullData,
      updated_at: nowIso
    };

    const { error } = await supabase.from('ai_word_usage_cache').upsert(row, {
      onConflict: 'word,context_hash,prompt_version'
    });

    if (error) {
      console.error(`Error seeding ${item.word}:`, error);
    } else {
      console.log(`✓ Seeded cache for "${item.word}"`);
    }
  }

  console.log('Finished seeding benchmark AI cache!');
}

seed();
