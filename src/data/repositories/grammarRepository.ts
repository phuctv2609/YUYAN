/**
 * YUYAN Grammar Repository
 * Access to authoritative grammar patterns across HSK 1–6 with Supabase integration and offline cache.
 */

import { getSupabaseClient } from '../../services/supabase/client';

export interface GrammarPoint {
  id: string;
  level: number;
  lessonId?: string;
  lessonNumber?: number;
  title: string;
  pattern: string;
  explanation: string;
  structureSummary?: string;
  examples: Array<{
    hanzi: string;
    pinyin: string;
    vietnamese: string;
  }>;
  notes?: string;
  sortOrder?: number;
}

const AUTHORITATIVE_GRAMMAR_POINTS: GrammarPoint[] = [
  // HSK 1
  {
    id: 'gram_hsk1_01',
    level: 1,
    lessonId: 'hsk1-bai01',
    lessonNumber: 1,
    title: 'Câu phán đoán với 是 (shì)',
    pattern: 'Chủ ngữ + 是 + Danh từ / Đại từ',
    explanation: 'Dùng để khẳng định một người hay sự vật là ai hoặc cái gì. Thể phủ định dùng 不是 (bù shì).',
    structureSummary: 'S + 是/不是 + N',
    examples: [
      { hanzi: '我是中国人。', pinyin: 'Wǒ shì Zhōngguórén.', vietnamese: 'Tôi là người Trung Quốc.' },
      { hanzi: '他不是老师。', pinyin: 'Tā bù shì lǎoshī.', vietnamese: 'Anh ấy không phải là giáo viên.' }
    ],
    notes: 'Không dùng 是 trước tính từ để miêu tả tính chất.',
    sortOrder: 1
  },
  {
    id: 'gram_hsk1_02',
    level: 1,
    lessonId: 'hsk1-bai02',
    lessonNumber: 2,
    title: 'Câu hỏi Yes/No với trợ từ nghi vấn 吗 (ma)',
    pattern: 'Mệnh đề trần thuật + 吗？',
    explanation: 'Đặt ở cuối một câu khẳng định hoặc phủ định để biến câu đó thành câu hỏi xác nhận (Có phải ... không?).',
    structureSummary: 'Câu trần thuật + 吗？',
    examples: [
      { hanzi: '你好吗？', pinyin: 'Nǐ hǎo ma?', vietnamese: 'Bạn có khỏe không?' },
      { hanzi: '你是学生吗？', pinyin: 'Nǐ shì xuésheng ma?', vietnamese: 'Bạn có phải là học sinh không?' }
    ],
    notes: 'Trong câu đã có đại từ nghi vấn (什么, 谁, 哪) thì KHÔNG dùng 吗.',
    sortOrder: 2
  },
  {
    id: 'gram_hsk1_03',
    level: 1,
    lessonId: 'hsk1-bai03',
    lessonNumber: 3,
    title: 'Đại từ nghi vấn 什么 (shénme) - Cái gì',
    pattern: 'Chủ ngữ + 动词 + 什么 + (Danh từ)？',
    explanation: 'Dùng để hỏi về sự vật, sự việc hoặc tên gọi (gì, cái gì). Trật tự từ trong câu hỏi tiếng Trung giữ nguyên vị trí như trong câu trả lời.',
    structureSummary: 'S + V + 什么 (+ N)？',
    examples: [
      { hanzi: '你叫什么名字？', pinyin: 'Nǐ jiào shénme míngzi?', vietnamese: 'Bạn tên là gì?' },
      { hanzi: '这是什么书？', pinyin: 'Zhè shì shénme shū?', vietnamese: 'Đây là sách gì?' }
    ],
    notes: 'Trật tự câu hỏi tiếng Trung không đảo ngữ.',
    sortOrder: 3
  },
  {
    id: 'gram_hsk1_04',
    level: 1,
    lessonId: 'hsk1-bai04',
    lessonNumber: 4,
    title: 'Phó từ phủ định 不 (bù) và 没 (méi)',
    pattern: '不 + Động từ/Tính từ  |  没 + 有 + Danh từ',
    explanation: '不 dùng để phủ định hành động hiện tại, tương lai, ý chí hoặc tính chất. 没 (hoặc 没有) dùng để phủ định sự sở hữu hoặc hành động đã xảy ra.',
    structureSummary: '不 + V/Adj  vs  没(有) + N/V',
    examples: [
      { hanzi: '我不去学校。', pinyin: 'Wǒ bù qù xuéxiào.', vietnamese: 'Tôi không đi đến trường.' },
      { hanzi: '我没有汉语书。', pinyin: 'Wǒ méiyǒu Hànyǔ shū.', vietnamese: 'Tôi không có sách tiếng Trung.' }
    ],
    notes: 'Phủ định của 有 bắt buộc phải dùng 没, không được nói 不有.',
    sortOrder: 4
  },
  {
    id: 'gram_hsk1_05',
    level: 1,
    lessonId: 'hsk1-bai05',
    lessonNumber: 5,
    title: 'Trợ từ kết cấu 的 (de) biểu thị quan hệ sở hữu',
    pattern: 'Đại từ / Danh từ + 的 + Danh từ',
    explanation: 'Đặt giữa định ngữ và trung tâm ngữ để biểu thị quyền sở hữu (của) hoặc quan hệ phụ thuộc.',
    structureSummary: 'Người sở hữu + 的 + Vật sở hữu',
    examples: [
      { hanzi: '我的汉语老师是王老师。', pinyin: 'Wǒ de Hànyǔ lǎoshī shì Wáng lǎoshī.', vietnamese: 'Giáo viên tiếng Trung của tôi là cô Vương.' },
      { hanzi: '这是他的电脑。', pinyin: 'Zhè shì tā de diànnǎo.', vietnamese: 'Đây là máy tính của anh ấy.' }
    ],
    notes: 'Khi nói về người thân trong gia đình hoặc mối quan hệ mật thiết, có thể lược bỏ 的 (ví dụ: 我爸爸).',
    sortOrder: 5
  },
  {
    id: 'gram_hsk1_06',
    level: 1,
    lessonId: 'hsk1-bai06',
    lessonNumber: 6,
    title: 'Câu vị ngữ tính từ với 很 (hěn)',
    pattern: 'Chủ ngữ + 很 + Tính từ',
    explanation: 'Khi tính từ làm vị ngữ miêu tả tính chất, trước tính từ thường có phó từ mức độ như 很.',
    structureSummary: 'S + 很 + Adj',
    examples: [
      { hanzi: '我很高兴。', pinyin: 'Wǒ hěn gāoxìng.', vietnamese: 'Tôi rất vui.' },
      { hanzi: '今天天气很好。', pinyin: 'Jīntiān tiānqì hěn hǎo.', vietnamese: 'Hôm nay thời tiết rất đẹp.' }
    ],
    sortOrder: 6
  },
  {
    id: 'gram_hsk1_07',
    level: 1,
    lessonId: 'hsk1-bai07',
    lessonNumber: 7,
    title: 'Giới từ 在 (zài) biểu thị vị trí',
    pattern: 'Chủ ngữ + 在 + Nơi chốn + (Động từ)',
    explanation: 'Dùng để diễn tả một người hay vật đang ở địa điểm nào đó hoặc hành động xảy ra tại nơi chốn đó.',
    structureSummary: 'S + 在 + Địa điểm (+ V)',
    examples: [
      { hanzi: '他在家看书。', pinyin: 'Tā zài jiā kànshū.', vietnamese: 'Anh ấy đang đọc sách ở nhà.' },
      { hanzi: '我们在学校学习。', pinyin: 'Wǒmen zài xuéxiào xuéxí.', vietnamese: 'Chúng tôi học tập ở trường.' }
    ],
    sortOrder: 7
  },
  {
    id: 'gram_hsk1_08',
    level: 1,
    lessonId: 'hsk1-bai08',
    lessonNumber: 8,
    title: 'Lượng từ 个 (gè) và kết cấu Số từ + Lượng từ',
    pattern: 'Số từ + Lượng từ + Danh từ',
    explanation: 'Trong tiếng Trung, giữa số từ và danh từ bắt buộc phải có lượng từ tương ứng. 个 là lượng từ phổ biến nhất.',
    structureSummary: 'Số + Lượng từ + Danh từ',
    examples: [
      { hanzi: '一个苹果', pinyin: 'yī ge píngguǒ', vietnamese: 'một quả táo' },
      { hanzi: '三个学生', pinyin: 'sān ge xuésheng', vietnamese: 'ba học sinh' }
    ],
    sortOrder: 8
  },

  // HSK 2
  {
    id: 'gram_hsk2_01',
    level: 2,
    lessonId: 'hsk2-bai01',
    lessonNumber: 1,
    title: 'Phó từ chỉ mức độ cao nhất 最 (zuì)',
    pattern: '最 + Tính từ / Động từ tâm lý',
    explanation: 'Biểu thị mức độ cao nhất (nhất). Thường đi trước tính từ hoặc động từ chỉ cảm xúc, nhận thức.',
    structureSummary: '最 + Adj/V tâm lý',
    examples: [
      { hanzi: '九月去北京旅游最好。', pinyin: 'Jiǔ yuè qù Běijīng lǚyóu zuì hǎo.', vietnamese: 'Tháng 9 đi du lịch Bắc Kinh là tốt nhất.' },
      { hanzi: '我最喜欢吃米饭。', pinyin: 'Wǒ zuì xǐhuan chī mǐfàn.', vietnamese: 'Tôi thích ăn cơm nhất.' }
    ],
    sortOrder: 9
  },
  {
    id: 'gram_hsk2_02',
    level: 2,
    lessonId: 'hsk2-bai02',
    lessonNumber: 2,
    title: 'Cấu trúc so sánh hơn với 比 (bǐ)',
    pattern: 'A + 比 + B + Tính từ (+ Số lượng/Mức độ)',
    explanation: 'Dùng để so sánh sự khác biệt về mức độ hoặc tính chất giữa hai đối tượng A và B.',
    structureSummary: 'A 比 B + Adj (+ 一点儿/得多)',
    examples: [
      { hanzi: '今天比昨天冷。', pinyin: 'Jīntiān bǐ zuótiān lěng.', vietnamese: 'Hôm nay lạnh hơn hôm qua.' },
      { hanzi: '他比我大两岁。', pinyin: 'Tā bǐ wǒ dà liǎng suì.', vietnamese: 'Anh ấy lớn hơn tôi hai tuổi.' }
    ],
    sortOrder: 10
  },
  {
    id: 'gram_hsk2_03',
    level: 2,
    lessonId: 'hsk2-bai03',
    lessonNumber: 3,
    title: 'Cấu trúc nhấn mạnh 是……的 (shì... de)',
    pattern: 'Chủ ngữ + 是 + [Thời gian/Địa điểm/Phương thức] + Động từ + 的',
    explanation: 'Dùng khi hành động đã xảy ra trong quá khứ và muốn nhấn mạnh vào thời gian, địa điểm, cách thức thực hiện.',
    structureSummary: 'S + 是 + [Nhấn mạnh] + V + 的',
    examples: [
      { hanzi: '我是坐飞机来的。', pinyin: 'Wǒ shì zuò fēijī lái de.', vietnamese: 'Tôi đi bằng máy bay đến đây.' },
      { hanzi: '我们是去年认识的。', pinyin: 'Wǒmen shì qùnián rènshi de.', vietnamese: 'Chúng tôi quen nhau từ năm ngoái.' }
    ],
    sortOrder: 11
  },
  {
    id: 'gram_hsk2_04',
    level: 2,
    lessonId: 'hsk2-bai04',
    lessonNumber: 4,
    title: 'Trợ từ động thái 着 (zhe) biểu thị trạng thái tiếp diễn',
    pattern: 'Động từ 1 + 着 + (Tân ngữ) + (Động từ 2)',
    explanation: 'Biểu thị một hành động hoặc trạng thái đang duy trì liên tục.',
    structureSummary: 'V + 着 / V1 + 着 + V2',
    examples: [
      { hanzi: '门开着呢。', pinyin: 'Mén kāi zhe ne.', vietnamese: 'Cửa đang mở đấy.' },
      { hanzi: '他们笑着说。', pinyin: 'Tāmen xiào zhe shuō.', vietnamese: 'Họ vừa cười vừa nói.' }
    ],
    sortOrder: 12
  },

  // HSK 3
  {
    id: 'gram_hsk3_01',
    level: 3,
    lessonId: 'hsk3-bai01',
    lessonNumber: 1,
    title: 'Cấu trúc 越来越…… (yuè lái yuè...) - Ngày càng...',
    pattern: 'Chủ ngữ + 越来越 + Tính từ / Động từ tâm lý',
    explanation: 'Biểu thị sự phát triển hoặc biến đổi mức độ theo thời gian (càng ngày càng...).',
    structureSummary: 'S + 越来越 + Adj/V',
    examples: [
      { hanzi: '天气越来越热了。', pinyin: 'Tiānqì yuè lái yuè rè le.', vietnamese: 'Thời tiết ngày càng nóng rồi.' },
      { hanzi: '他的汉语越来越好。', pinyin: 'Tā de Hànyǔ yuè lái yuè hǎo.', vietnamese: 'Tiếng Trung của anh ấy ngày càng tốt.' }
    ],
    sortOrder: 13
  },
  {
    id: 'gram_hsk3_02',
    level: 3,
    lessonId: 'hsk3-bai02',
    lessonNumber: 2,
    title: 'Câu chữ 把 (bǎ) cơ bản',
    pattern: 'Chủ ngữ + 把 + Tân ngữ + Động từ + Thành phần khác',
    explanation: 'Dùng để nhấn mạnh tác động của chủ ngữ lên đối tượng (tân ngữ), làm biến đổi vị trí, trạng thái hoặc kết quả.',
    structureSummary: 'S + 把 + O + V + Bổ ngữ/了',
    examples: [
      { hanzi: '请把书放在桌子上。', pinyin: 'Qǐng bǎ shū fàng zài zhuōzi shang.', vietnamese: 'Xin hãy để sách lên trên bàn.' },
      { hanzi: '我把作业做完了。', pinyin: 'Wǒ bǎ zuòyè zuò wán le.', vietnamese: 'Tôi đã làm xong bài tập rồi.' }
    ],
    sortOrder: 14
  },
  {
    id: 'gram_hsk3_03',
    level: 3,
    lessonId: 'hsk3-bai03',
    lessonNumber: 3,
    title: 'Câu bị động với 被 / 叫 / 让 (bèi / jiào / ràng)',
    pattern: 'Người/Vật bị tác động + 被/叫/让 + Đối tượng + Động từ + Thành phần khác',
    explanation: 'Dùng để diễn tả một đối tượng bị tác động bởi một đối tượng khác, thường mang sắc thái khách quan hoặc không mong muốn.',
    structureSummary: 'Bị tác động + 被/叫/让 + Tác động + V + Bổ ngữ',
    examples: [
      { hanzi: '蛋糕被弟弟吃了。', pinyin: 'Dàngāo bèi dìdi chī le.', vietnamese: 'Bánh ngọt bị em trai ăn mất rồi.' },
      { hanzi: '我的自行车让人骑走了。', pinyin: 'Wǒ de zìxíngchē ràng rén qí zǒu le.', vietnamese: 'Xe đạp của tôi bị người ta đi mất rồi.' }
    ],
    sortOrder: 15
  },
  {
    id: 'gram_hsk3_04',
    level: 3,
    lessonId: 'hsk3-bai04',
    lessonNumber: 4,
    title: 'Bổ ngữ kết quả (Resultative Complements)',
    pattern: 'Động từ + 到 / 见 / 完 / 懂 / 好 / 对 / 错',
    explanation: 'Tính từ hoặc động từ đặt ngay sau động từ chính để biểu thị kết quả của hành động đó.',
    structureSummary: 'V + Bổ ngữ kết quả (+ O)',
    examples: [
      { hanzi: '我听懂了老师的话。', pinyin: 'Wǒ tīngdǒng le lǎoshī de huà.', vietnamese: 'Tôi đã nghe hiểu lời của giáo viên.' },
      { hanzi: '饭准备好了。', pinyin: 'Fàn zhǔnbèi hǎo le.', vietnamese: 'Cơm chuẩn bị xong rồi.' }
    ],
    sortOrder: 16
  },

  // HSK 4
  {
    id: 'gram_hsk4_01',
    level: 4,
    lessonId: 'hsk4-bai01',
    lessonNumber: 1,
    title: 'Cấu trúc tăng tiến 不仅……而且…… (bùjǐn... érqiě...)',
    pattern: '不仅 + Vế 1，而且 / 也 / 还 + Vế 2',
    explanation: 'Biểu thị sự tăng tiến mức độ hoặc phạm vi (không những... mà còn...).',
    structureSummary: '不仅 A, 而且 B',
    examples: [
      { hanzi: '他不仅会说汉语，而且说得非常流利。', pinyin: 'Tā bùjǐn huì shuō Hànyǔ, érqiě shuō de fēicháng liúlì.', vietnamese: 'Anh ấy không những biết nói tiếng Trung mà còn nói rất lưu loát.' },
      { hanzi: '不仅安娜喜欢音乐，大卫也喜欢。', pinyin: 'Bùjǐn Ānnà xǐhuan yīnyuè, Dàwèi yě xǐhuan.', vietnamese: 'Không chỉ An Na thích âm nhạc mà Đại Vệ cũng thích.' }
    ],
    sortOrder: 17
  },
  {
    id: 'gram_hsk4_02',
    level: 4,
    lessonId: 'hsk4-bai02',
    lessonNumber: 2,
    title: 'Cấu trúc điều kiện duy nhất 只有……才…… (zhǐyǒu... cái...)',
    pattern: '只有 + Điều kiện duy nhất，才 + Kết quả',
    explanation: 'Nhấn mạnh điều kiện cần thiết duy nhất để đạt được kết quả (chỉ có... mới...).',
    structureSummary: '只有 + Điều kiện, (S) + 才 + Kết quả',
    examples: [
      { hanzi: '只有努力学习，才能取得好成绩。', pinyin: 'Zhǐyǒu nǔlì xuéxí, cái néng qǔdé hǎo chéngjì.', vietnamese: 'Chỉ có chăm chỉ học tập mới có thể đạt thành tích tốt.' },
      { hanzi: '只有互相信任，两个人才能成为好朋友。', pinyin: 'Zhǐyǒu hùxiāng xìnrèn, liǎng ge rén cái néng chéngwéi hǎo péngyou.', vietnamese: 'Chỉ có tin tưởng lẫn nhau thì hai người mới có thể trở thành bạn tốt.' }
    ],
    sortOrder: 18
  },
  {
    id: 'gram_hsk4_03',
    level: 4,
    lessonId: 'hsk4-bai03',
    lessonNumber: 3,
    title: 'Cấu trúc nhấn mạnh 连……都 / 也…… (lián... dōu/yě...)',
    pattern: '连 + Thành phần cực đoan + 都 / 也 + Động từ / Tính từ',
    explanation: 'Dùng để đưa ra một trường hợp cực đoan, điển hình nhất nhằm nhấn mạnh tính chất hiển nhiên của sự việc.',
    structureSummary: '连 + Cực đoan + 都/也 + V/Adj',
    examples: [
      { hanzi: '这个问题太简单了，连小孩子都知道。', pinyin: 'Zhè ge wèntí tài jiǎndān le, lián xiǎoháizi dōu zhīdào.', vietnamese: 'Vấn đề này quá đơn giản, ngay cả trẻ con cũng biết.' },
      { hanzi: '他太忙了，连饭都没时间吃。', pinyin: 'Tā tài máng le, lián fàn dōu méi shíjiān chī.', vietnamese: 'Anh ấy bận quá, ngay cả cơm cũng không có thời gian ăn.' }
    ],
    sortOrder: 19
  },

  // HSK 5
  {
    id: 'gram_hsk5_01',
    level: 5,
    lessonId: 'hsk5-bai01',
    lessonNumber: 1,
    title: 'Cấu trúc chuyển ngoặt văn viết 固然……但是…… (gùrán... dànshì...)',
    pattern: 'A 固然……，但是 / 可是 / 却 B……',
    explanation: 'Thừa nhận thực tế ở vế A trước (dẫu rằng / cố nhiên), sau đó chuyển ngoặt đưa ra trọng tâm lập luận ở vế B.',
    structureSummary: 'A 固然..., 但是 B',
    examples: [
      { hanzi: '工作固然重要，但是健康更不可忽视。', pinyin: 'Gōngzuò gùrán zhòngyào, dànshì jiànkāng gèng bù kě hūshì.', vietnamese: 'Công việc tuy rằng quan trọng, nhưng sức khỏe càng không thể xem nhẹ.' },
      { hanzi: '他的意见固然有道理，但目前并不适合实施。', pinyin: 'Tā de yìjiàn gùrán yǒu dàolǐ, dàn mùqián bìng bù shìhé shíshī.', vietnamese: 'Ý kiến của anh ấy cố nhiên có lý, nhưng hiện tại chưa phù hợp để triển khai.' }
    ],
    sortOrder: 20
  },
  {
    id: 'gram_hsk5_02',
    level: 5,
    lessonId: 'hsk5-bai02',
    lessonNumber: 2,
    title: 'Cấu trúc 所 (suǒ) + Động từ trong văn bản chuẩn tắc',
    pattern: '所 + Động từ đơn/song âm tiết (+ 的 + Danh từ)',
    explanation: 'Đặt trước động từ để danh từ hóa cụm hành động hoặc biến nó thành định ngữ trang trọng.',
    structureSummary: '所 + V (+ 的 + N)',
    examples: [
      { hanzi: '这正是我们所希望看到的结果。', pinyin: 'Zhè zhèng shì wǒmen suǒ xīwàng kàndào de jiéguǒ.', vietnamese: 'Đây chính là kết quả mà chúng tôi kỳ vọng được thấy.' },
      { hanzi: '据我所知，会议推迟到了下周一。', pinyin: 'Jù wǒ suǒ zhī, huìyì tuīchí dào le xià zhōuyī.', vietnamese: 'Theo như tôi được biết, cuộc họp đã bị hoãn sang thứ Hai tuần sau.' }
    ],
    sortOrder: 21
  },

  // HSK 6
  {
    id: 'gram_hsk6_01',
    level: 6,
    lessonId: 'hsk6-bai01',
    lessonNumber: 1,
    title: 'Cấu trúc phán đoán cao cấp 毋庸置疑 (wúyōng zhìyí) & 不言而喻',
    pattern: '毋庸置疑 / 不言而喻，+ Mệnh đề khẳng định',
    explanation: 'Dùng trong văn phong nghị luận học thuật và chính luận để khẳng định một chân lý hoặc thực tế hiển nhiên không thể chối cãi.',
    structureSummary: '毋庸置疑 / 不言而喻, + Phán đoán',
    examples: [
      { hanzi: '毋庸置疑，科技创新是推动经济高质量发展的核心动力。', pinyin: 'Wúyōng zhìyí, kējì chuàngxīn shì tuīdòng jīngjì gāo zhìliàng fāzhǎn de héxīn dònglì.', vietnamese: 'Không cần bàn cãi, đổi mới sáng tạo công nghệ là động lực cốt lõi thúc đẩy kinh tế phát triển.' },
      { hanzi: '保护生态环境的重要性是不言而喻的。', pinyin: 'Bǎohù shēngtài huánjìng de zhòngyàoxìng shì bùyán\'éryù de.', vietnamese: 'Tầm quan trọng của việc bảo vệ môi trường sinh thái là điều hiển nhiên không cần phải nói.' }
    ],
    sortOrder: 22
  },
  {
    id: 'gram_hsk6_02',
    level: 6,
    lessonId: 'hsk6-bai02',
    lessonNumber: 2,
    title: 'Cấu trúc văn ngôn trong Hán ngữ hiện đại: 之, 乎, 者, 也',
    pattern: 'Cụm từ văn ngôn hoặc thành ngữ bốn chữ có chứa 之/者/乎/也',
    explanation: 'Các trợ từ và đại từ ngữ khí cổ đại vẫn được bảo lưu mật thiết trong văn bản phân tích chính luận và văn học cao cấp.',
    structureSummary: 'Văn phong tao nhã cổ ngữ',
    examples: [
      { hanzi: '行百里者半九十，越是接近成功越需保持清醒。', pinyin: 'Xíng bǎilǐ zhě bàn jiǔshí, yuè shì jiējìn chénggōng yuè xū bǎochí qīngxǐng.', vietnamese: 'Người đi trăm dặm nửa đường xem như mới được chín mươi, càng gần thành công càng phải giữ sự tỉnh táo.' },
      { hanzi: '言之有理，持之以恒。', pinyin: 'Yán zhī yǒu lǐ, chí zhī yǐ héng.', vietnamese: 'Nói có lý lẽ, làm việc có lòng kiên trì bền bỉ.' }
    ],
    sortOrder: 23
  }
];

export class GrammarRepository {
  private cache: GrammarPoint[] = AUTHORITATIVE_GRAMMAR_POINTS;

  public async fetchServer(): Promise<GrammarPoint[]> {
    try {
      const client = getSupabaseClient();
      if (!client) return this.cache;

      const { data, error } = await (client as any)
        .from('grammar_patterns')
        .select('*')
        .order('hsk_level', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error || !data || data.length === 0) {
        return this.cache;
      }

      this.cache = data.map((row: any) => ({
        id: row.id,
        level: row.hsk_level,
        lessonId: row.lesson_id,
        lessonNumber: row.sort_order || 1,
        title: row.title,
        pattern: row.pattern,
        explanation: row.explanation,
        structureSummary: row.structure_summary,
        examples: row.examples || [],
        notes: row.notes,
        sortOrder: row.sort_order
      }));
      return this.cache;
    } catch {
      return this.cache;
    }
  }

  public getByLesson(level: number, lessonNumber: number): GrammarPoint[] {
    const lessonKey = `hsk${level}-bai${String(lessonNumber).padStart(2, '0')}`;
    return this.cache.filter((g) => g.level === level && (g.lessonId === lessonKey || g.lessonNumber === lessonNumber));
  }

  public getAll(): GrammarPoint[] {
    return [...this.cache];
  }

  public getByLevel(level: number): GrammarPoint[] {
    return this.cache.filter((g) => g.level === level);
  }
}

export const grammarRepository = new GrammarRepository();
