/**
 * YUYAN — Authoritative Beginner Mandarin Phonetics & Curriculum Dataset
 * Full inventory:
 * - 21 Initials (Thanh mẫu)
 * - 36 Finals (6 Vận mẫu đơn, 13 Vận mẫu kép, 16 Vận mẫu mũi, 1 Vận mẫu er)
 * - 4 Lexical Tones + Neutral Tone + Tone Sandhi Rules (Biến điệu)
 * - Special Pinyin Rules (Quy tắc Pinyin đặc biệt: y/w, ü sau j/q/x/n/l, iou/uei/uen, Đánh dấu thanh điệu)
 * - Minimal-Pair Contrasts (Phân biệt âm dễ nhầm: b/p, d/t, g/k, z/c/s vs zh/ch/sh, n/ng, u/ü)
 * - Legal Syllable Inventory
 */

export interface PhoneticExampleWord {
  hanzi: string;
  pinyin: string;
  meaning: string;
  audioText: string;
}

export type TonguePosition =
  | 'low_flat'
  | 'high_front'
  | 'high_back'
  | 'high_front_rounded'
  | 'mid_back'
  | 'retroflex'
  | 'alveolar'
  | 'dental'
  | 'palatal'
  | 'velar'
  | 'bilabial'
  | 'labiodental';

export type LipShape =
  | 'closed'
  | 'open_large'
  | 'open_round'
  | 'spread'
  | 'pursed_round'
  | 'teeth_on_lip';

export type AirflowType =
  | 'oral_burst'
  | 'aspirated_puff'
  | 'nasal_escape'
  | 'fricative_narrow'
  | 'vocal_resonant';

export interface VocalTractVisualConfig {
  tonguePosition: TonguePosition;
  lipShape: LipShape;
  airflowType: AirflowType;
  softPalateState: 'raised' | 'lowered';
  lipSteps?: string[];
}

export interface BeginnerPhoneticItem {
  id: string;
  symbol: string;
  ipa: string;
  type: 'initial' | 'simple_final' | 'compound_final' | 'nasal_final' | 'retroflex';
  chineseName: string;
  vietnameseName: string;
  categoryVi: string;
  articulationType: string;
  aspiration: 'non_aspirated' | 'aspirated' | 'voiced' | 'nasal' | 'fricative';
  mouthGuide: string;
  tongueGuide: string;
  vietnameseComparison: string;
  commonErrors: string;
  huduYin: string; // Standard Mandarin Chinese character for vocalization (呼读音)
  examples: PhoneticExampleWord[];
  vocalTractConfig: VocalTractVisualConfig;
  contrastWith?: string[];
}

// -----------------------------------------------------------------------------
// 1. ALL 21 MANDARIN INITIALS (THANH MẪU)
// -----------------------------------------------------------------------------
export const BEGINNER_INITIALS: BeginnerPhoneticItem[] = [
  {
    id: 'initial_b',
    symbol: 'b',
    ipa: '[p]',
    type: 'initial',
    chineseName: '双唇音 (Âm 2 môi)',
    vietnameseName: 'Thanh mẫu b',
    categoryVi: 'Âm 2 môi',
    articulationType: 'Âm 2 môi, tắc, vô thanh, KHÔNG BẬT HƠI',
    aspiration: 'non_aspirated',
    mouthGuide: 'Hai môi khép chặt chặn luồng hơi trong miệng, sau đó mở nhẹ ra để hơi thoát ra từ từ.',
    tongueGuide: 'Thân lưỡi buông lỏng tự nhiên ở đáy miệng, không chạm ngạc.',
    vietnameseComparison: 'Gần giống âm "p" nhẹ trong tiếng Việt (như trong "pin", "pa"), TUYỆT ĐỐI KHÔNG đọc giống âm "b" có rung dây thanh của tiếng Việt.',
    commonErrors: 'Phát âm nhầm thành âm "b" tiếng Việt (rung thanh quản) hoặc bật hơi quá mạnh như "p".',
    huduYin: '玻', // bō
    examples: [
      { hanzi: '八', pinyin: 'bā', meaning: 'Số tám', audioText: '八' },
      { hanzi: '爸', pinyin: 'bà', meaning: 'Bố, cha', audioText: '爸' },
      { hanzi: '笔', pinyin: 'bǐ', meaning: 'Cây bút', audioText: '笔' },
    ],
    vocalTractConfig: {
      tonguePosition: 'bilabial',
      lipShape: 'closed',
      airflowType: 'oral_burst',
      softPalateState: 'raised',
      lipSteps: ['1. Hai môi khép lại', '2. Giữ hơi trong miệng', '3. Bật hơi nhẹ'],
    },
    contrastWith: ['p'],
  },
  {
    id: 'initial_p',
    symbol: 'p',
    ipa: '[pʰ]',
    type: 'initial',
    chineseName: '双唇音 (Âm 2 môi)',
    vietnameseName: 'Thanh mẫu p',
    categoryVi: 'Âm 2 môi',
    articulationType: 'Âm 2 môi, tắc, vô thanh, BẬT HƠI MẠNH',
    aspiration: 'aspirated',
    mouthGuide: 'Hai môi mím chặt tích tụ áp suất khí lớn trong khoang miệng, sau đó mở nhanh bật mạnh luồng gió dứt khoát ra ngoài.',
    tongueGuide: 'Lưỡi nằm lỏng tự nhiên, luồng hơi dồn từ phổi lên môi.',
    vietnameseComparison: 'Tương tự khẩu hình âm "p" nhưng phải bật luồng hơi gió cực mạnh (đặt tờ giấy trước miệng tờ giấy phải bay mạnh).',
    commonErrors: 'Không bật hơi làm người nghe nhầm thành âm "b", hoặc bật hơi quá yếu.',
    huduYin: '坡', // pō
    examples: [
      { hanzi: '跑', pinyin: 'pǎo', meaning: 'Chạy', audioText: '跑' },
      { hanzi: '朋友', pinyin: 'péngyou', meaning: 'Bạn bè', audioText: '朋友' },
      { hanzi: '苹果', pinyin: 'píngguǒ', meaning: 'Quả táo', audioText: '苹果' },
    ],
    vocalTractConfig: {
      tonguePosition: 'bilabial',
      lipShape: 'closed',
      airflowType: 'aspirated_puff',
      softPalateState: 'raised',
      lipSteps: ['1. Hai môi mím chặt', '2. Tích áp suất khí lớn', '3. Bật hơi mạnh phụt ra'],
    },
    contrastWith: ['b'],
  },
  {
    id: 'initial_m',
    symbol: 'm',
    ipa: '[m]',
    type: 'initial',
    chineseName: '双唇音 (Âm 2 môi)',
    vietnameseName: 'Thanh mẫu m',
    categoryVi: 'Âm 2 môi',
    articulationType: 'Âm 2 môi, mũi, hữu thanh (rung dây thanh)',
    aspiration: 'nasal',
    mouthGuide: 'Hai môi khép nhẹ, dây thanh rung động, ngạc mềm hạ xuống để luồng hơi thoát hoàn toàn qua khoang mũi.',
    tongueGuide: 'Lưỡi thả lỏng tự nhiên dưới đáy miệng.',
    vietnameseComparison: 'Phát âm hoàn toàn tương tự âm "m" trong tiếng Việt (như "mẹ", "mắt").',
    commonErrors: 'Âm này người Việt phát âm rất dễ dàng, ít khi mắc lỗi.',
    huduYin: '摸', // mō
    examples: [
      { hanzi: '妈', pinyin: 'mā', meaning: 'Mẹ', audioText: '妈' },
      { hanzi: '忙', pinyin: 'máng', meaning: 'Bận rộn', audioText: '忙' },
      { hanzi: '买', pinyin: 'mǎi', meaning: 'Mua', audioText: '买' },
    ],
    vocalTractConfig: {
      tonguePosition: 'bilabial',
      lipShape: 'closed',
      airflowType: 'nasal_escape',
      softPalateState: 'lowered',
      lipSteps: ['1. Khép hai môi nhẹ', '2. Rung dây thanh quản', '3. Thoát hơi qua mũi'],
    },
  },
  {
    id: 'initial_f',
    symbol: 'f',
    ipa: '[f]',
    type: 'initial',
    chineseName: '唇齿音 (Âm răng - môi)',
    vietnameseName: 'Thanh mẫu f',
    categoryVi: 'Âm răng - môi',
    articulationType: 'Âm răng - môi dưới, xát, vô thanh',
    aspiration: 'fricative',
    mouthGuide: 'Răng cửa trên chạm nhẹ vào viền trong của môi dưới, luồng hơi ma sát lọt qua kẽ răng thoát ra ngoài.',
    tongueGuide: 'Lưỡi buông lỏng tự nhiên, không tham gia cản khí.',
    vietnameseComparison: 'Tương tự âm "ph" trong tiếng Việt (như "phở", "phim").',
    commonErrors: 'Cắn môi quá chặt khiến âm bị tắc thay vì xát đều liên tục.',
    huduYin: '佛', // fó
    examples: [
      { hanzi: '飞', pinyin: 'fēi', meaning: 'Bay', audioText: '飞' },
      { hanzi: '饭', pinyin: 'fàn', meaning: 'Cơm', audioText: '饭' },
      { hanzi: '风', pinyin: 'fēng', meaning: 'Gió', audioText: '风' },
    ],
    vocalTractConfig: {
      tonguePosition: 'labiodental',
      lipShape: 'teeth_on_lip',
      airflowType: 'fricative_narrow',
      softPalateState: 'raised',
      lipSteps: ['1. Răng trên chạm môi dưới', '2. Tạo khe hẹp', '3. Đẩy hơi ma sát ra'],
    },
    contrastWith: ['h'],
  },
  {
    id: 'initial_d',
    symbol: 'd',
    ipa: '[t]',
    type: 'initial',
    chineseName: '舌尖中音 (Âm đầu lưỡi giữa)',
    vietnameseName: 'Thanh mẫu d',
    categoryVi: 'Âm đầu lưỡi',
    articulationType: 'Âm đầu lưỡi giữa, tắc, vô thanh, KHÔNG BẬT HƠI',
    aspiration: 'non_aspirated',
    mouthGuide: 'Miệng mở tự nhiên.',
    tongueGuide: 'Đầu lưỡi chạm chắc vào chân răng trên (lợi trên) chặn hơi, sau đó hạ nhanh xuống cho hơi thoát nhẹ.',
    vietnameseComparison: 'Tương tự âm "t" trong tiếng Việt (như "tôi", "tay"), KHÔNG đọc giống âm "đ" tiếng Việt (không rung thanh).',
    commonErrors: 'Đọc nhầm thành âm "đ" tiếng Việt (làm rung cổ họng).',
    huduYin: '得', // dé
    examples: [
      { hanzi: '大', pinyin: 'dà', meaning: 'To, lớn', audioText: '大' },
      { hanzi: '对', pinyin: 'duì', meaning: 'Đúng, đối với', audioText: '对' },
      { hanzi: '点', pinyin: 'diǎn', meaning: 'Điểm, giờ', audioText: '点' },
    ],
    vocalTractConfig: {
      tonguePosition: 'alveolar',
      lipShape: 'spread',
      airflowType: 'oral_burst',
      softPalateState: 'raised',
      lipSteps: ['1. Đầu lưỡi chạm lợi trên', '2. Chặn luồng hơi', '3. Hạ lưỡi bật nhẹ'],
    },
    contrastWith: ['t'],
  },
  {
    id: 'initial_t',
    symbol: 't',
    ipa: '[tʰ]',
    type: 'initial',
    chineseName: '舌尖中音 (Âm đầu lưỡi giữa)',
    vietnameseName: 'Thanh mẫu t',
    categoryVi: 'Âm đầu lưỡi',
    articulationType: 'Âm đầu lưỡi giữa, tắc, vô thanh, BẬT HƠI MẠNH',
    aspiration: 'aspirated',
    mouthGuide: 'Miệng mở tự nhiên.',
    tongueGuide: 'Đầu lưỡi chạm lợi trên tích áp suất hơi mạnh, sau đó hạ phắt đầu lưỡi xuống, phóng luồng hơi mạnh ra ngoài.',
    vietnameseComparison: 'Gần giống âm "th" tiếng Việt nhưng luồng hơi dứt khoát và mạnh hơn nhiều.',
    commonErrors: 'Không bật hơi bị nhầm sang âm "d", hoặc đọc yếu như "th" lười.',
    huduYin: '特', // tè
    examples: [
      { hanzi: '他', pinyin: 'tā', meaning: 'Anh ấy, cậu ấy', audioText: '他' },
      { hanzi: '天', pinyin: 'tiān', meaning: 'Trời, ngày', audioText: '天' },
      { hanzi: '听', pinyin: 'tīng', meaning: 'Nghe', audioText: '听' },
    ],
    vocalTractConfig: {
      tonguePosition: 'alveolar',
      lipShape: 'spread',
      airflowType: 'aspirated_puff',
      softPalateState: 'raised',
      lipSteps: ['1. Đầu lưỡi ép chặt lợi trên', '2. Dồn hơi mạnh từ phổi', '3. Bật hơi mạnh dứt khoát'],
    },
    contrastWith: ['d'],
  },
  {
    id: 'initial_n',
    symbol: 'n',
    ipa: '[n]',
    type: 'initial',
    chineseName: '舌尖中音 (Âm đầu lưỡi giữa)',
    vietnameseName: 'Thanh mẫu n',
    categoryVi: 'Âm đầu lưỡi',
    articulationType: 'Âm đầu lưỡi giữa, mũi, hữu thanh',
    aspiration: 'nasal',
    mouthGuide: 'Khẩu hình mở nhẹ.',
    tongueGuide: 'Đầu lưỡi chạm chắc vào lợi trên, ngạc mềm hạ xuống, hơi thoát qua mũi, dây thanh rung.',
    vietnameseComparison: 'Tương tự âm "n" trong tiếng Việt (như "nắng", "nước").',
    commonErrors: 'Một số học viên miền Bắc/miền Trung dễ bị ngọng giữa "n" và "l".',
    huduYin: '讷', // nè
    examples: [
      { hanzi: '你', pinyin: 'nǐ', meaning: 'Bạn, anh, chị', audioText: '你' },
      { hanzi: '难', pinyin: 'nán', meaning: 'Khó', audioText: '难' },
      { hanzi: '南', pinyin: 'nán', meaning: 'Phương nam', audioText: '南' },
    ],
    vocalTractConfig: {
      tonguePosition: 'alveolar',
      lipShape: 'spread',
      airflowType: 'nasal_escape',
      softPalateState: 'lowered',
      lipSteps: ['1. Đầu lưỡi chặn lợi trên', '2. Hạ ngạc mềm', '3. Thoát hơi qua mũi'],
    },
    contrastWith: ['l'],
  },
  {
    id: 'initial_l',
    symbol: 'l',
    ipa: '[l]',
    type: 'initial',
    chineseName: '舌尖中音 (Âm đầu lưỡi giữa)',
    vietnameseName: 'Thanh mẫu l',
    categoryVi: 'Âm đầu lưỡi',
    articulationType: 'Âm bên đầu lưỡi, hữu thanh',
    aspiration: 'voiced',
    mouthGuide: 'Khẩu hình mở tự nhiên.',
    tongueGuide: 'Đầu lưỡi chạm lợi trên, luồng hơi luồn qua hai mép bên của lưỡi thoát ra ngoài.',
    vietnameseComparison: 'Tương tự âm "l" trong tiếng Việt (như "lớn", "làng").',
    commonErrors: 'Phát âm nhầm sang "n".',
    huduYin: '勒', // lè
    examples: [
      { hanzi: '来', pinyin: 'lái', meaning: 'Đến, lại', audioText: '来' },
      { hanzi: '老', pinyin: 'lǎo', meaning: 'Già, cũ', audioText: '老' },
      { hanzi: '冷', pinyin: 'lěng', meaning: 'Lạnh', audioText: '冷' },
    ],
    vocalTractConfig: {
      tonguePosition: 'alveolar',
      lipShape: 'spread',
      airflowType: 'oral_burst',
      softPalateState: 'raised',
      lipSteps: ['1. Đầu lưỡi áp lợi trên', '2. Thoát hơi qua hai bên mép lưỡi'],
    },
    contrastWith: ['n'],
  },
  {
    id: 'initial_g',
    symbol: 'g',
    ipa: '[k]',
    type: 'initial',
    chineseName: '舌根音 (Âm cuống lưỡi / gốc lưỡi)',
    vietnameseName: 'Thanh mẫu g',
    categoryVi: 'Âm cuống lưỡi',
    articulationType: 'Âm cuống lưỡi, tắc, vô thanh, KHÔNG BẬT HƠI',
    aspiration: 'non_aspirated',
    mouthGuide: 'Miệng mở tự nhiên.',
    tongueGuide: 'Gốc lưỡi (cuống lưỡi) nâng cao chạm sát ngạc mềm chặn hơi, sau đó mở nhẹ cho hơi thoát ra.',
    vietnameseComparison: 'Tương tự âm "c/k" trong tiếng Việt (như "cá", "kem"), TUYỆT ĐỐI KHÔNG đọc là "g/gh" tiếng Việt.',
    commonErrors: 'Đọc nhầm thành âm "g" tiếng Việt (rung họng như "gà").',
    huduYin: '哥', // gē
    examples: [
      { hanzi: '哥', pinyin: 'gē', meaning: 'Anh trai', audioText: '哥' },
      { hanzi: '高', pinyin: 'gāo', meaning: 'Cao', audioText: '高' },
      { hanzi: '狗', pinyin: 'gǒu', meaning: 'Con chó', audioText: '狗' },
    ],
    vocalTractConfig: {
      tonguePosition: 'velar',
      lipShape: 'open_round',
      airflowType: 'oral_burst',
      softPalateState: 'raised',
      lipSteps: ['1. Cuống lưỡi chạm ngạc mềm', '2. Chặn hơi', '3. Hạ cuống lưỡi bật nhẹ'],
    },
    contrastWith: ['k'],
  },
  {
    id: 'initial_k',
    symbol: 'k',
    ipa: '[kʰ]',
    type: 'initial',
    chineseName: '舌根音 (Âm cuống lưỡi)',
    vietnameseName: 'Thanh mẫu k',
    categoryVi: 'Âm cuống lưỡi',
    articulationType: 'Âm cuống lưỡi, tắc, vô thanh, BẬT HƠI MẠNH',
    aspiration: 'aspirated',
    mouthGuide: 'Miệng mở tự nhiên.',
    tongueGuide: 'Gốc lưỡi áp sát ngạc mềm tích tụ luồng hơi mạnh, sau đó hạ cuống lưỡi đột ngột, phóng luồng hơi mạnh dứt khoát.',
    vietnameseComparison: 'Giống khẩu hình "kh" tiếng Việt nhưng là âm tắc bật hơi mạnh (phụt hơi từ sâu cuống họng).',
    commonErrors: 'Không bật hơi bị nhầm thành "g", hoặc xát nhẹ thành "kh" mềm tiếng Việt.',
    huduYin: '科', // kē
    examples: [
      { hanzi: '看', pinyin: 'kàn', meaning: 'Xem, nhìn', audioText: '看' },
      { hanzi: '开', pinyin: 'kāi', meaning: 'Mở', audioText: '开' },
      { hanzi: '口', pinyin: 'kǒu', meaning: 'Cái miệng', audioText: '口' },
    ],
    vocalTractConfig: {
      tonguePosition: 'velar',
      lipShape: 'open_round',
      airflowType: 'aspirated_puff',
      softPalateState: 'raised',
      lipSteps: ['1. Cuống lưỡi ép chặt ngạc mềm', '2. Dồn hơi cuống họng', '3. Bật hơi mạnh ra ngoài'],
    },
    contrastWith: ['g'],
  },
  {
    id: 'initial_h',
    symbol: 'h',
    ipa: '[x]',
    type: 'initial',
    chineseName: '舌根音 (Âm cuống lưỡi)',
    vietnameseName: 'Thanh mẫu h',
    categoryVi: 'Âm cuống lưỡi',
    articulationType: 'Âm cuống lưỡi, xát, vô thanh',
    aspiration: 'fricative',
    mouthGuide: 'Khẩu hình mở vừa phải.',
    tongueGuide: 'Cuống lưỡi nâng lên gần ngạc mềm tạo khe hẹp, luồng hơi ma sát qua khe này thoát ra ngoài.',
    vietnameseComparison: 'Nằm giữa âm "h" và "kh" nhẹ của tiếng Việt; ở Bắc Kinh ma sát cuống lưỡi khá rõ nét.',
    commonErrors: 'Đọc quá nhẹ như "h" tiếng Việt không có ma sát, hoặc đọc quá nặng như "kh" gằn giọng.',
    huduYin: '喝', // hē
    examples: [
      { hanzi: '好', pinyin: 'hǎo', meaning: 'Tốt, đẹp', audioText: '好' },
      { hanzi: '喝', pinyin: 'hē', meaning: 'Uống', audioText: '喝' },
      { hanzi: '红', pinyin: 'hóng', meaning: 'Màu đỏ', audioText: '红' },
    ],
    vocalTractConfig: {
      tonguePosition: 'velar',
      lipShape: 'open_round',
      airflowType: 'fricative_narrow',
      softPalateState: 'raised',
      lipSteps: ['1. Cuống lưỡi nâng gần ngạc mềm', '2. Tạo khe hẹp cuống họng', '3. Thở hơi ma sát nhẹ'],
    },
    contrastWith: ['f'],
  },
  {
    id: 'initial_j',
    symbol: 'j',
    ipa: '[tɕ]',
    type: 'initial',
    chineseName: '舌面前音 (Âm mặt lưỡi trước)',
    vietnameseName: 'Thanh mẫu j',
    categoryVi: 'Âm mặt lưỡi',
    articulationType: 'Âm mặt lưỡi trước, tắc xát, vô thanh, KHÔNG BẬT HƠI',
    aspiration: 'non_aspirated',
    mouthGuide: 'Khóe môi hơi dẹt sang hai bên.',
    tongueGuide: 'Đầu lưỡi hạ xuống chạm mặt sau răng cửa dưới, mặt trước của lưỡi nâng cao ép sát ngạc cứng, hơi lách nhẹ qua kẽ.',
    vietnameseComparison: 'Gần giống âm "ch" tiếng Việt nhưng đầu lưỡi hạ thấp chạm chân răng dưới, mặt lưỡi dẹt dính ngạc.',
    commonErrors: 'Uốn lưỡi hoặc bật hơi mạnh.',
    huduYin: '鸡', // jī
    examples: [
      { hanzi: '家', pinyin: 'jiā', meaning: 'Gia đình, nhà', audioText: '家' },
      { hanzi: '叫', pinyin: 'jiào', meaning: 'Kêu, gọi là', audioText: '叫' },
      { hanzi: '今天', pinyin: 'jīntiān', meaning: 'Hôm nay', audioText: '今天' },
    ],
    vocalTractConfig: {
      tonguePosition: 'palatal',
      lipShape: 'spread',
      airflowType: 'oral_burst',
      softPalateState: 'raised',
      lipSteps: ['1. Đầu lưỡi hạ chân răng dưới', '2. Mặt lưỡi áp ngạc cứng', '3. Thả nhẹ hơi lách qua'],
    },
    contrastWith: ['q', 'zh'],
  },
  {
    id: 'initial_q',
    symbol: 'q',
    ipa: '[tɕʰ]',
    type: 'initial',
    chineseName: '舌面前音 (Âm mặt lưỡi trước)',
    vietnameseName: 'Thanh mẫu q',
    categoryVi: 'Âm mặt lưỡi',
    articulationType: 'Âm mặt lưỡi trước, tắc xát, vô thanh, BẬT HƠI MẠNH',
    aspiration: 'aspirated',
    mouthGuide: 'Khóe môi dẹt sang hai bên.',
    tongueGuide: 'Khẩu hình giống hệt j (đầu lưỡi hạ răng dưới, mặt lưỡi ép ngạc cứng) nhưng tích tụ áp suất rồi bật luồng gió mạnh.',
    vietnameseComparison: 'Khẩu hình giống "ch" nhưng đẩy luồng hơi ma sát bật gió cực mạnh qua khe giữa mặt lưỡi và vòm miệng.',
    commonErrors: 'Không bật hơi bị nghe nhầm thành "j", hoặc phát âm thành "qu" tiếng Việt.',
    huduYin: '七', // qī
    examples: [
      { hanzi: '去', pinyin: 'qù', meaning: 'Đi', audioText: '去' },
      { hanzi: '七', pinyin: 'qī', meaning: 'Số bảy', audioText: '七' },
      { hanzi: '钱', pinyin: 'qián', meaning: 'Tiền', audioText: '钱' },
    ],
    vocalTractConfig: {
      tonguePosition: 'palatal',
      lipShape: 'spread',
      airflowType: 'aspirated_puff',
      softPalateState: 'raised',
      lipSteps: ['1. Mặt lưỡi áp sát ngạc cứng', '2. Tích hơi mạnh', '3. Bật luồng gió mạnh dứt khoát'],
    },
    contrastWith: ['j', 'ch'],
  },
  {
    id: 'initial_x',
    symbol: 'x',
    ipa: '[ɕ]',
    type: 'initial',
    chineseName: '舌面前音 (Âm mặt lưỡi trước)',
    vietnameseName: 'Thanh mẫu x',
    categoryVi: 'Âm mặt lưỡi',
    articulationType: 'Âm mặt lưỡi trước, xát, vô thanh',
    aspiration: 'fricative',
    mouthGuide: 'Khóe môi mở rộng dẹt sang hai bên, răng gần khép.',
    tongueGuide: 'Đầu lưỡi chạm chân răng dưới, mặt trước lưỡi nâng sát ngạc cứng tạo khe hẹp, luồng hơi ma sát xát đều thoát ra.',
    vietnameseComparison: 'Tương tự âm "x" tiếng Việt (như "xe", "xem") nhưng mặt lưỡi áp sát vòm ngạc cứng hơn, âm phát ra thanh sắc hơn.',
    commonErrors: 'Uốn lưỡi thành âm "s" nặng tiếng Việt.',
    huduYin: '西', // xī
    examples: [
      { hanzi: '小', pinyin: 'xiǎo', meaning: 'Nhỏ, bé', audioText: '小' },
      { hanzi: '想', pinyin: 'xiǎng', meaning: 'Nghĩ, muốn', audioText: '想' },
      { hanzi: '谢谢', pinyin: 'xièxie', meaning: 'Cảm ơn', audioText: '谢谢' },
    ],
    vocalTractConfig: {
      tonguePosition: 'palatal',
      lipShape: 'spread',
      airflowType: 'fricative_narrow',
      softPalateState: 'raised',
      lipSteps: ['1. Đầu lưỡi hạ răng dưới', '2. Mặt lưỡi gần ngạc cứng', '3. Xát luồng hơi đều qua khe'],
    },
    contrastWith: ['sh', 's'],
  },
  {
    id: 'initial_zh',
    symbol: 'zh',
    ipa: '[tʂ]',
    type: 'initial',
    chineseName: '舌尖后音 / 卷舌音 (Âm đầu lưỡi sau / Âm uốn lưỡi)',
    vietnameseName: 'Thanh mẫu zh',
    categoryVi: 'Âm uốn lưỡi',
    articulationType: 'Âm đầu lưỡi sau (uốn lưỡi), tắc xát, vô thanh, KHÔNG BẬT HƠI',
    aspiration: 'non_aspirated',
    mouthGuide: 'Môi hơi mở hé tròn tự nhiên.',
    tongueGuide: 'Đầu lưỡi uốn cong lên chạm sát phần trước ngạc cứng (ngay sau nướu răng trên), chặn hơi rồi hé nhẹ cho hơi thoát ra từ từ.',
    vietnameseComparison: 'Tương tự âm "tr" uốn lưỡi của tiếng Việt miền Trung/Nam (như "trâu", "trời"), KHÔNG BẬT HƠI.',
    commonErrors: 'Quên uốn lưỡi làm nhầm sang "z", hoặc bật hơi nhầm sang "ch".',
    huduYin: '知', // zhī
    examples: [
      { hanzi: '中', pinyin: 'zhōng', meaning: 'Ở giữa, Trung Quốc', audioText: '中' },
      { hanzi: '这', pinyin: 'zhè', meaning: 'Đây, này', audioText: '这' },
      { hanzi: '找', pinyin: 'zhǎo', meaning: 'Tìm kiếm', audioText: '找' },
    ],
    vocalTractConfig: {
      tonguePosition: 'retroflex',
      lipShape: 'open_round',
      airflowType: 'oral_burst',
      softPalateState: 'raised',
      lipSteps: ['1. Uốn đầu lưỡi lên ngạc cứng', '2. Chặn hơi', '3. Hé nhẹ đầu lưỡi thoát hơi'],
    },
    contrastWith: ['z', 'ch', 'j'],
  },
  {
    id: 'initial_ch',
    symbol: 'ch',
    ipa: '[tʂʰ]',
    type: 'initial',
    chineseName: '舌尖后音 / 卷舌音 (Âm đầu lưỡi sau / Âm uốn lưỡi)',
    vietnameseName: 'Thanh mẫu ch',
    categoryVi: 'Âm uốn lưỡi',
    articulationType: 'Âm đầu lưỡi sau (uốn lưỡi), tắc xát, vô thanh, BẬT HƠI MẠNH',
    aspiration: 'aspirated',
    mouthGuide: 'Môi hơi mở tự nhiên.',
    tongueGuide: 'Vị trí lưỡi giống hệt "zh" (đầu lưỡi uốn cong lên ngạc cứng) nhưng tích tụ luồng khí cực mạnh rồi bật phồng ra dứt khoát.',
    vietnameseComparison: 'Uốn lưỡi như "tr" nhưng bật luồng hơi gió cực mạnh ra ngoài.',
    commonErrors: 'Không bật hơi bị nhầm sang "zh", hoặc quên uốn lưỡi nhầm sang "c".',
    huduYin: '吃', // chī
    examples: [
      { hanzi: '吃', pinyin: 'chī', meaning: 'Ăn', audioText: '吃' },
      { hanzi: '茶', pinyin: 'chá', meaning: 'Trà', audioText: '茶' },
      { hanzi: '出', pinyin: 'chū', meaning: 'Ra ngoài', audioText: '出' },
    ],
    vocalTractConfig: {
      tonguePosition: 'retroflex',
      lipShape: 'open_round',
      airflowType: 'aspirated_puff',
      softPalateState: 'raised',
      lipSteps: ['1. Uốn đầu lưỡi lên ngạc cứng', '2. Dồn hơi mạnh', '3. Bật luồng hơi gió mạnh ra'],
    },
    contrastWith: ['zh', 'c', 'q'],
  },
  {
    id: 'initial_sh',
    symbol: 'sh',
    ipa: '[ʂ]',
    type: 'initial',
    chineseName: '舌尖后音 / 卷舌音 (Âm đầu lưỡi sau / Âm uốn lưỡi)',
    vietnameseName: 'Thanh mẫu sh',
    categoryVi: 'Âm uốn lưỡi',
    articulationType: 'Âm đầu lưỡi sau (uốn lưỡi), xát, vô thanh',
    aspiration: 'fricative',
    mouthGuide: 'Môi hơi hé tự nhiên.',
    tongueGuide: 'Đầu lưỡi uốn cong nâng sát phần trước ngạc cứng tạo khe hẹp, luồng hơi ma sát liên tục qua khe này thoát ra ngoài.',
    vietnameseComparison: 'Tương tự âm "s" nặng uốn lưỡi trong tiếng Việt miền Nam (như "sông", "sao").',
    commonErrors: 'Quên uốn lưỡi làm nhầm sang "s" nhẹ thẳng lưỡi.',
    huduYin: '诗', // shī
    examples: [
      { hanzi: '是', pinyin: 'shì', meaning: 'Là, phải', audioText: '是' },
      { hanzi: '书', pinyin: 'shū', meaning: 'Sách', audioText: '书' },
      { hanzi: '水', pinyin: 'shuǐ', meaning: 'Nước', audioText: '水' },
    ],
    vocalTractConfig: {
      tonguePosition: 'retroflex',
      lipShape: 'open_round',
      airflowType: 'fricative_narrow',
      softPalateState: 'raised',
      lipSteps: ['1. Uốn đầu lưỡi lên ngạc cứng', '2. Tạo khe hẹp', '3. Xát luồng hơi ma sát ra'],
    },
    contrastWith: ['s', 'x'],
  },
  {
    id: 'initial_r',
    symbol: 'r',
    ipa: '[ʐ]',
    type: 'initial',
    chineseName: '舌尖后音 / 卷舌音 (Âm đầu lưỡi sau / Âm uốn lưỡi)',
    vietnameseName: 'Thanh mẫu r',
    categoryVi: 'Âm uốn lưỡi',
    articulationType: 'Âm đầu lưỡi sau (uốn lưỡi), xát, hữu thanh (rung thanh quản)',
    aspiration: 'voiced',
    mouthGuide: 'Môi hơi mở hé tự nhiên.',
    tongueGuide: 'Khẩu hình và vị trí lưỡi y hệt "sh" nhưng dây thanh quản rung động mạnh.',
    vietnameseComparison: 'Lai giữa âm "r" uốn lưỡi và âm "d/gi" tiếng Việt, lưỡi uốn nhưng thanh quản rung trầm.',
    commonErrors: 'Đọc rung đầu lưỡi liên tục như "r" tiếng Pháp/Tây Ban Nha, hoặc đọc thành "d" bẹt miệng.',
    huduYin: '日', // rì
    examples: [
      { hanzi: '人', pinyin: 'rén', meaning: 'Người', audioText: '人' },
      { hanzi: '热', pinyin: 'rè', meaning: 'Nóng', audioText: '热' },
      { hanzi: '日', pinyin: 'rì', meaning: 'Ngày, mặt trời', audioText: '日' },
    ],
    vocalTractConfig: {
      tonguePosition: 'retroflex',
      lipShape: 'open_round',
      airflowType: 'fricative_narrow',
      softPalateState: 'raised',
      lipSteps: ['1. Uốn đầu lưỡi lên ngạc cứng', '2. Rung mạnh dây thanh quản', '3. Đẩy hơi xát hữu thanh'],
    },
    contrastWith: ['l', 'sh'],
  },
  {
    id: 'initial_z',
    symbol: 'z',
    ipa: '[ts]',
    type: 'initial',
    chineseName: '舌尖前音 (Âm đầu lưỡi trước / Âm răng)',
    vietnameseName: 'Thanh mẫu z',
    categoryVi: 'Âm đầu lưỡi trước',
    articulationType: 'Âm đầu lưỡi trước, tắc xát, vô thanh, KHÔNG BẬT HƠI',
    aspiration: 'non_aspirated',
    mouthGuide: 'Khóe môi hơi dẹt sang hai bên, hai hàm răng gần chạm nhau.',
    tongueGuide: 'Đầu lưỡi duỗi thẳng chạm mặt sau của răng cửa trên chặn hơi, sau đó hé nhẹ đầu lưỡi cho hơi thoát ra.',
    vietnameseComparison: 'Gần giống âm "ch/tr" nhẹ nhưng đầu lưỡi duỗi thẳng tắp chạm mặt sau răng trên, không uốn lưỡi, không bật hơi.',
    commonErrors: 'Uốn lưỡi nhầm sang "zh", hoặc đọc rung như "d/z" tiếng Việt.',
    huduYin: '资', // zī
    examples: [
      { hanzi: '在', pinyin: 'zài', meaning: 'Ở, tại', audioText: '在' },
      { hanzi: '字', pinyin: 'zì', meaning: 'Chữ', audioText: '字' },
      { hanzi: '早', pinyin: 'zǎo', meaning: 'Sớm', audioText: '早' },
    ],
    vocalTractConfig: {
      tonguePosition: 'dental',
      lipShape: 'spread',
      airflowType: 'oral_burst',
      softPalateState: 'raised',
      lipSteps: ['1. Đầu lưỡi thẳng chạm mặt sau răng trên', '2. Chặn hơi', '3. Hé nhẹ đầu lưỡi thoát hơi'],
    },
    contrastWith: ['c', 'zh'],
  },
  {
    id: 'initial_c',
    symbol: 'c',
    ipa: '[tsʰ]',
    type: 'initial',
    chineseName: '舌尖前音 (Âm đầu lưỡi trước / Âm răng)',
    vietnameseName: 'Thanh mẫu c',
    categoryVi: 'Âm đầu lưỡi trước',
    articulationType: 'Âm đầu lưỡi trước, tắc xát, vô thanh, BẬT HƠI MẠNH',
    aspiration: 'aspirated',
    mouthGuide: 'Khóe môi dẹt, hai hàm răng gần khép.',
    tongueGuide: 'Vị trí lưỡi y hệt "z" (đầu lưỡi thẳng chạm mặt sau răng trên) nhưng tích khí mạnh rồi bật phụt luồng gió qua kẽ răng.',
    vietnameseComparison: 'Đầu lưỡi thẳng chạm sau răng trên rồi bật luồng hơi gió cực mạnh qua kẽ răng (tiếng gió "xùyt").',
    commonErrors: 'Không bật hơi bị nhầm sang "z", hoặc uốn lưỡi nhầm sang "ch".',
    huduYin: '疵', // cī
    examples: [
      { hanzi: '菜', pinyin: 'cài', meaning: 'Món ăn, rau', audioText: '菜' },
      { hanzi: '从', pinyin: 'cóng', meaning: 'Từ (đâu đến đâu)', audioText: '从' },
      { hanzi: '错', pinyin: 'cuò', meaning: 'Sai', audioText: '错' },
    ],
    vocalTractConfig: {
      tonguePosition: 'dental',
      lipShape: 'spread',
      airflowType: 'aspirated_puff',
      softPalateState: 'raised',
      lipSteps: ['1. Đầu lưỡi thẳng chạm sau răng trên', '2. Nén luồng hơi', '3. Bật luồng hơi gió mạnh qua kẽ răng'],
    },
    contrastWith: ['z', 'ch'],
  },
  {
    id: 'initial_s',
    symbol: 's',
    ipa: '[s]',
    type: 'initial',
    chineseName: '舌尖前音 (Âm đầu lưỡi trước / Âm răng)',
    vietnameseName: 'Thanh mẫu s',
    categoryVi: 'Âm đầu lưỡi trước',
    articulationType: 'Âm đầu lưỡi trước, xát, vô thanh',
    aspiration: 'fricative',
    mouthGuide: 'Khóe môi hơi dẹt, hai hàm răng khép gần chạm nhau.',
    tongueGuide: 'Đầu lưỡi duỗi thẳng tắp tiếp cận mặt sau răng cửa dưới tạo khe hẹp, luồng hơi ma sát xát nhẹ qua kẽ răng.',
    vietnameseComparison: 'Tương tự âm "x" nhẹ trong tiếng Việt miền Bắc (như "xe", "xanh"), lưỡi duỗi thẳng tuyệt đối không uốn.',
    commonErrors: 'Uốn cong đầu lưỡi làm nhầm sang "sh".',
    huduYin: '思', // sī
    examples: [
      { hanzi: '三', pinyin: 'sān', meaning: 'Số ba', audioText: '三' },
      { hanzi: '四', pinyin: 'sì', meaning: 'Số bốn', audioText: '四' },
      { hanzi: '岁', pinyin: 'suì', meaning: 'Tuổi', audioText: '岁' },
    ],
    vocalTractConfig: {
      tonguePosition: 'dental',
      lipShape: 'spread',
      airflowType: 'fricative_narrow',
      softPalateState: 'raised',
      lipSteps: ['1. Đầu lưỡi thẳng sát chân răng dưới', '2. Khép gần hai hàm răng', '3. Xát luồng hơi qua kẽ răng'],
    },
    contrastWith: ['sh', 'x'],
  },
];

// -----------------------------------------------------------------------------
// 2. ALL 36 MANDARIN FINALS (6 ĐƠN, 13 KÉP, 16 MŨI, 1 ER)
// -----------------------------------------------------------------------------
export const BEGINNER_SIMPLE_FINALS: BeginnerPhoneticItem[] = [
  {
    id: 'final_a',
    symbol: 'a',
    ipa: '[a]',
    type: 'simple_final',
    chineseName: '单韵母 / 开口呼',
    vietnameseName: 'Vận mẫu đơn a',
    categoryVi: 'Vận mẫu đơn',
    articulationType: 'Nguyên âm mở, hàng trước-giữa, không tròn môi',
    aspiration: 'voiced',
    mouthGuide: 'Miệng mở to hết cỡ tự nhiên, hàm dưới buông lỏng.',
    tongueGuide: 'Thân lưỡi nằm thấp nhất dưới đáy miệng, đầu lưỡi chạm nhẹ chân răng cửa dưới.',
    vietnameseComparison: 'Gần giống âm "a" trong tiếng Việt (như "ba", "má") nhưng mở miệng lớn hơn, phát âm dứt khoát tròn và vang hơn.',
    commonErrors: 'Mở miệng quá nhỏ khiến âm bị bẹt.',
    huduYin: '啊',
    examples: [
      { hanzi: '妈', pinyin: 'mā', meaning: 'Mẹ', audioText: '妈' },
      { hanzi: '八', pinyin: 'bā', meaning: 'Số tám', audioText: '八' },
      { hanzi: '大', pinyin: 'dà', meaning: 'To, lớn', audioText: '大' },
    ],
    vocalTractConfig: {
      tonguePosition: 'low_flat',
      lipShape: 'open_large',
      airflowType: 'vocal_resonant',
      softPalateState: 'raised',
      lipSteps: ['1. Mở to miệng', '2. Thân lưỡi nằm thấp', '3. Phát âm vang, dứt khoát'],
    },
  },
  {
    id: 'final_o',
    symbol: 'o',
    ipa: '[o]',
    type: 'simple_final',
    chineseName: '单韵母 / 开口呼',
    vietnameseName: 'Vận mẫu đơn o',
    categoryVi: 'Vận mẫu đơn',
    articulationType: 'Nguyên âm nửa khép, hàng sau, tròn môi',
    aspiration: 'voiced',
    mouthGuide: 'Môi chu tròn đều, hơi nhô về phía trước.',
    tongueGuide: 'Gốc lưỡi hơi nâng lên ngạc mềm, thân lưỡi hơi lùi về phía sau.',
    vietnameseComparison: 'Gần giống âm "ô" trong tiếng Việt (như "cô", "ô dù"), không phải âm "o" mở rộng môi của tiếng Việt.',
    commonErrors: 'Phát âm nhầm thành "o" rộng tiếng Việt hoặc biến âm sang "uô".',
    huduYin: '喔',
    examples: [
      { hanzi: '我', pinyin: 'wǒ', meaning: 'Tôi', audioText: '我' },
      { hanzi: '波', pinyin: 'bō', meaning: 'Làn sóng', audioText: '波' },
      { hanzi: '破', pinyin: 'pò', meaning: 'Rách, vỡ', audioText: '破' },
    ],
    vocalTractConfig: {
      tonguePosition: 'mid_back',
      lipShape: 'open_round',
      airflowType: 'vocal_resonant',
      softPalateState: 'raised',
      lipSteps: ['1. Môi chu tròn đều', '2. Gốc lưỡi nâng ngạc mềm', '3. Giữ nguyên khẩu hình'],
    },
  },
  {
    id: 'final_e',
    symbol: 'e',
    ipa: '[ɤ]',
    type: 'simple_final',
    chineseName: '单韵母 / 开口呼',
    vietnameseName: 'Vận mẫu đơn e',
    categoryVi: 'Vận mẫu đơn',
    articulationType: 'Nguyên âm nửa khép, hàng sau, không tròn môi',
    aspiration: 'voiced',
    mouthGuide: 'Khẩu hình mở vừa phải, khóe miệng kéo dẹt sang hai bên.',
    tongueGuide: 'Gốc lưỡi nâng cao về phía ngạc mềm, thân lưỡi lùi về sau, đầu lưỡi không chạm răng.',
    vietnameseComparison: 'Tương tự âm "ơ" trong tiếng Việt (như "cơm", "bơ") nhưng miệng dẹt sang hai bên, KHÔNG đọc là "e" tiếng Việt.',
    commonErrors: 'Đọc nhầm thành "e" tiếng Việt (như "me") hoặc chu tròn môi.',
    huduYin: '婀',
    examples: [
      { hanzi: '哥', pinyin: 'gē', meaning: 'Anh trai', audioText: '哥' },
      { hanzi: '喝', pinyin: 'hē', meaning: 'Uống', audioText: '喝' },
      { hanzi: '饿', pinyin: 'è', meaning: 'Đói', audioText: '饿' },
    ],
    vocalTractConfig: {
      tonguePosition: 'mid_back',
      lipShape: 'spread',
      airflowType: 'vocal_resonant',
      softPalateState: 'raised',
      lipSteps: ['1. Khóe miệng dẹt ngang', '2. Gốc lưỡi nâng sau', '3. Phát âm âm sắc tựa "ơ" dẹt'],
    },
  },
  {
    id: 'final_i',
    symbol: 'i',
    ipa: '[i]',
    type: 'simple_final',
    chineseName: '单韵母 / 齐齿呼',
    vietnameseName: 'Vận mẫu đơn i',
    categoryVi: 'Vận mẫu đơn',
    articulationType: 'Nguyên âm khép, hàng trước, không tròn môi',
    aspiration: 'voiced',
    mouthGuide: 'Khóe môi mở rộng dẹt sang hai bên, răng trên và dưới khép gần chạm nhau.',
    tongueGuide: 'Mặt trước lưỡi nâng sát ngạc cứng, đầu lưỡi chạm vào mặt sau của răng cửa dưới.',
    vietnameseComparison: 'Tương tự âm "i" trong tiếng Việt (như "đi", "khi"). Lưu ý: khi đứng sau zh, ch, sh, r, z, c, s, "i" phát âm là âm ư đặc biệt.',
    commonErrors: 'Mở khẩu hình quá rộng hoặc quên biến âm sau nhóm zh/ch/sh/r/z/c/s.',
    huduYin: '衣',
    examples: [
      { hanzi: '你', pinyin: 'nǐ', meaning: 'Bạn', audioText: '你' },
      { hanzi: '一', pinyin: 'yī', meaning: 'Số một', audioText: '一' },
      { hanzi: '米', pinyin: 'mǐ', meaning: 'Gạo', audioText: '米' },
    ],
    vocalTractConfig: {
      tonguePosition: 'high_front',
      lipShape: 'spread',
      airflowType: 'vocal_resonant',
      softPalateState: 'raised',
      lipSteps: ['1. Khóe môi kéo dẹt ngang', '2. Hai hàm răng gần chạm', '3. Mặt trước lưỡi nâng cao'],
    },
  },
  {
    id: 'final_u',
    symbol: 'u',
    ipa: '[u]',
    type: 'simple_final',
    chineseName: '单韵母 / 合口呼',
    vietnameseName: 'Vận mẫu đơn u',
    categoryVi: 'Vận mẫu đơn',
    articulationType: 'Nguyên âm khép, hàng sau, tròn môi',
    aspiration: 'voiced',
    mouthGuide: 'Môi chu tròn nhỏ tối đa, nhô ra phía trước tạo lỗ nhỏ giữa hai môi.',
    tongueGuide: 'Gốc lưỡi nâng cao về phía ngạc mềm, thân lưỡi lùi sâu về phía sau họng.',
    vietnameseComparison: 'Tương tự âm "u" trong tiếng Việt (như "thu", "mù"). Khác biệt rõ rệt với nguyên âm "ü".',
    commonErrors: 'Chu môi chưa đủ tròn hoặc nhầm lẫn giữa "u" và "ü".',
    huduYin: '乌',
    examples: [
      { hanzi: '五', pinyin: 'wǔ', meaning: 'Số năm', audioText: '五' },
      { hanzi: '不', pinyin: 'bù', meaning: 'Không', audioText: '不' },
      { hanzi: '哭', pinyin: 'kū', meaning: 'Khóc', audioText: '哭' },
    ],
    vocalTractConfig: {
      tonguePosition: 'high_back',
      lipShape: 'open_round',
      airflowType: 'vocal_resonant',
      softPalateState: 'raised',
      lipSteps: ['1. Môi chu tròn nhỏ nhô trước', '2. Cuống lưỡi nâng sau họng', '3. Giữ chặt khẩu hình'],
    },
    contrastWith: ['ü'],
  },
  {
    id: 'final_u_umlaut',
    symbol: 'ü',
    ipa: '[y]',
    type: 'simple_final',
    chineseName: '单韵母 / 撮口呼',
    vietnameseName: 'Vận mẫu đơn ü (u hai chấm)',
    categoryVi: 'Vận mẫu đơn',
    articulationType: 'Nguyên âm khép, hàng trước, tròn môi',
    aspiration: 'voiced',
    mouthGuide: 'Khẩu hình: định hình lưỡi phát âm "i", nhưng chu môi tròn nhỏ lại như thổi sáo.',
    tongueGuide: 'Đầu lưỡi chạm răng cửa dưới, thân lưỡi nâng cao phía trước y hệt phát âm "i".',
    vietnameseComparison: 'Gần giống âm "uy" trong tiếng Việt (như "nguy", "tuỳ") nhưng là một nguyên âm đơn thuần nhất, không trượt âm.',
    commonErrors: 'Phát âm thành âm kép "uy" bị trượt môi, hoặc đọc nhầm thành "u".',
    huduYin: '迂',
    examples: [
      { hanzi: '女', pinyin: 'nǚ', meaning: 'Phụ nữ', audioText: '女' },
      { hanzi: '绿', pinyin: 'lǜ', meaning: 'Màu xanh lá', audioText: '绿' },
      { hanzi: '鱼', pinyin: 'yú', meaning: 'Con cá', audioText: '鱼' },
    ],
    vocalTractConfig: {
      tonguePosition: 'high_front_rounded',
      lipShape: 'pursed_round',
      airflowType: 'vocal_resonant',
      softPalateState: 'raised',
      lipSteps: ['1. Vị trí lưỡi giữ nguyên như âm "i"', '2. Chu môi tròn nhỏ như âm "u"', '3. Phát âm không trượt khẩu hình'],
    },
    contrastWith: ['u'],
  },
];

export const BEGINNER_COMPOUND_FINALS: BeginnerPhoneticItem[] = [
  {
    id: 'final_ai',
    symbol: 'ai',
    ipa: '[aɪ]',
    type: 'compound_final',
    chineseName: '复韵母 (Vận mẫu phức)',
    vietnameseName: 'Vận mẫu ai',
    categoryVi: 'Vận mẫu kép',
    articulationType: 'Nguyên âm đôi, trượt từ [a] sang [i]',
    aspiration: 'voiced',
    mouthGuide: 'Bắt đầu từ khẩu hình "a" mở to rồi trượt dần dẹt môi sang khẩu hình "i".',
    tongueGuide: 'Lưỡi từ thấp chuyển dịch dần lên cao phía trước.',
    vietnameseComparison: 'Tương tự "ai" trong tiếng Việt (như "hai", "mai").',
    commonErrors: 'Phát âm âm "i" quá nặng làm ngắt quãng trượt âm.',
    huduYin: '哀',
    examples: [
      { hanzi: '白', pinyin: 'bái', meaning: 'Màu trắng', audioText: '白' },
      { hanzi: '菜', pinyin: 'cài', meaning: 'Món ăn', audioText: '菜' },
      { hanzi: '爱', pinyin: 'ài', meaning: 'Yêu', audioText: '爱' },
    ],
    vocalTractConfig: { tonguePosition: 'low_flat', lipShape: 'open_large', airflowType: 'vocal_resonant', softPalateState: 'raised' },
  },
  {
    id: 'final_ei',
    symbol: 'ei',
    ipa: '[eɪ]',
    type: 'compound_final',
    chineseName: '复韵母 (Vận mẫu phức)',
    vietnameseName: 'Vận mẫu ei',
    categoryVi: 'Vận mẫu kép',
    articulationType: 'Nguyên âm đôi, trượt từ [e] sang [i]',
    aspiration: 'voiced',
    mouthGuide: 'Bắt đầu mở vừa phải rồi khép dần sang dẹt răng.',
    tongueGuide: 'Thân lưỡi nâng dần lên cao.',
    vietnameseComparison: 'Tương tự "ây" hoặc "ê" trong tiếng Việt (như "mây", "cây").',
    commonErrors: 'Đọc thành "e-i" tách rời.',
    huduYin: '诶',
    examples: [
      { hanzi: '飞', pinyin: 'fēi', meaning: 'Bay', audioText: '飞' },
      { hanzi: '黑', pinyin: 'hēi', meaning: 'Màu đen', audioText: '黑' },
      { hanzi: '被', pinyin: 'bèi', meaning: 'Bị, chăn', audioText: '被' },
    ],
    vocalTractConfig: { tonguePosition: 'high_front', lipShape: 'spread', airflowType: 'vocal_resonant', softPalateState: 'raised' },
  },
  {
    id: 'final_ao',
    symbol: 'ao',
    ipa: '[aʊ]',
    type: 'compound_final',
    chineseName: '复韵母 (Vận mẫu phức)',
    vietnameseName: 'Vận mẫu ao',
    categoryVi: 'Vận mẫu kép',
    articulationType: 'Nguyên âm đôi, trượt từ [a] sang [u/o]',
    aspiration: 'voiced',
    mouthGuide: 'Từ "a" mở to trượt nhanh sang chu môi tròn.',
    tongueGuide: 'Lưỡi từ thấp lùi dần về phía sau.',
    vietnameseComparison: 'Tương tự "ao" trong tiếng Việt (như "cao", "sao").',
    commonErrors: 'Môi không chu tròn ở phần kết thúc.',
    huduYin: '熬',
    examples: [
      { hanzi: '高', pinyin: 'gāo', meaning: 'Cao', audioText: '高' },
      { hanzi: '跑', pinyin: 'pǎo', meaning: 'Chạy', audioText: '跑' },
      { hanzi: '好', pinyin: 'hǎo', meaning: 'Tốt', audioText: '好' },
    ],
    vocalTractConfig: { tonguePosition: 'low_flat', lipShape: 'open_round', airflowType: 'vocal_resonant', softPalateState: 'raised' },
  },
  {
    id: 'final_ou',
    symbol: 'ou',
    ipa: '[oʊ]',
    type: 'compound_final',
    chineseName: '复韵母 (Vận mẫu phức)',
    vietnameseName: 'Vận mẫu ou',
    categoryVi: 'Vận mẫu kép',
    articulationType: 'Nguyên âm đôi, trượt từ [o] sang [u]',
    aspiration: 'voiced',
    mouthGuide: 'Môi tròn vừa rồi thu nhỏ tròn lại.',
    tongueGuide: 'Gốc lưỡi nâng cao về phía sau.',
    vietnameseComparison: 'Tương tự "âu" trong tiếng Việt (như "đâu", "cầu").',
    commonErrors: 'Đọc thành "ô" đơn thuần không trượt âm.',
    huduYin: '欧',
    examples: [
      { hanzi: '口', pinyin: 'kǒu', meaning: 'Miệng', audioText: '口' },
      { hanzi: '狗', pinyin: 'gǒu', meaning: 'Con chó', audioText: '狗' },
      { hanzi: '后', pinyin: 'hòu', meaning: 'Phía sau', audioText: '后' },
    ],
    vocalTractConfig: { tonguePosition: 'mid_back', lipShape: 'open_round', airflowType: 'vocal_resonant', softPalateState: 'raised' },
  },
  {
    id: 'final_ia',
    symbol: 'ia',
    ipa: '[i̯a]',
    type: 'compound_final',
    chineseName: '复韵母 / 齐齿呼',
    vietnameseName: 'Vận mẫu ia',
    categoryVi: 'Vận mẫu kép',
    articulationType: 'Nguyên âm đôi, bắt đầu từ [i] trượt sang [a]',
    aspiration: 'voiced',
    mouthGuide: 'Môi dẹt rồi mở to nhanh sang "a".',
    tongueGuide: 'Lưỡi hạ nhanh từ cao xuống thấp.',
    vietnameseComparison: 'Gần giống "ia" trong tiếng Việt (như "tia", "chia").',
    commonErrors: 'Bỏ quên âm "i" lướt đầu.',
    huduYin: '呀',
    examples: [
      { hanzi: '家', pinyin: 'jiā', meaning: 'Nhà', audioText: '家' },
      { hanzi: '下', pinyin: 'xià', meaning: 'Dưới', audioText: '下' },
      { hanzi: '恰', pinyin: 'qià', meaning: 'Vừa vặn', audioText: '恰' },
    ],
    vocalTractConfig: { tonguePosition: 'high_front', lipShape: 'open_large', airflowType: 'vocal_resonant', softPalateState: 'raised' },
  },
  {
    id: 'final_ie',
    symbol: 'ie',
    ipa: '[i̯e]',
    type: 'compound_final',
    chineseName: '复韵母 / 齐齿呼',
    vietnameseName: 'Vận mẫu ie',
    categoryVi: 'Vận mẫu kép',
    articulationType: 'Nguyên âm đôi, bắt đầu từ [i] trượt sang [e]',
    aspiration: 'voiced',
    mouthGuide: 'Môi dẹt kéo sang hai bên.',
    tongueGuide: 'Mặt lưỡi nâng cao phía trước.',
    vietnameseComparison: 'Tương tự "iê" trong tiếng Việt (như "tiền", "biết").',
    commonErrors: 'Đọc âm "e" thành "ơ".',
    huduYin: '耶',
    examples: [
      { hanzi: '谢', pinyin: 'xiè', meaning: 'Cảm ơn', audioText: '谢' },
      { hanzi: '别', pinyin: 'bié', meaning: 'Đừng', audioText: '别' },
      { hanzi: '借', pinyin: 'jiè', meaning: 'Mượn', audioText: '借' },
    ],
    vocalTractConfig: { tonguePosition: 'high_front', lipShape: 'spread', airflowType: 'vocal_resonant', softPalateState: 'raised' },
  },
  {
    id: 'final_ua',
    symbol: 'ua',
    ipa: '[u̯a]',
    type: 'compound_final',
    chineseName: '复韵母 / 合口呼',
    vietnameseName: 'Vận mẫu ua',
    categoryVi: 'Vận mẫu kép',
    articulationType: 'Nguyên âm đôi, bắt đầu từ [u] trượt sang [a]',
    aspiration: 'voiced',
    mouthGuide: 'Môi chu tròn rồi mở to nhanh sang "a".',
    tongueGuide: 'Lưỡi từ sau hạ nhanh xuống đáy miệng.',
    vietnameseComparison: 'Tương tự "oa" trong tiếng Việt (như "hoa", "họa").',
    commonErrors: 'Không chu môi trước khi mở miệng.',
    huduYin: '蛙',
    examples: [
      { hanzi: '花', pinyin: 'huā', meaning: 'Hoa', audioText: '花' },
      { hanzi: '画', pinyin: 'huà', meaning: 'Vẽ, tranh', audioText: '画' },
      { hanzi: '话', pinyin: 'huà', meaning: 'Lời nói', audioText: '话' },
    ],
    vocalTractConfig: { tonguePosition: 'low_flat', lipShape: 'open_large', airflowType: 'vocal_resonant', softPalateState: 'raised' },
  },
  {
    id: 'final_uo',
    symbol: 'uo',
    ipa: '[u̯o]',
    type: 'compound_final',
    chineseName: '复韵母 / 合口呼',
    vietnameseName: 'Vận mẫu uo',
    categoryVi: 'Vận mẫu kép',
    articulationType: 'Nguyên âm đôi, bắt đầu từ [u] trượt sang [o]',
    aspiration: 'voiced',
    mouthGuide: 'Môi chu tròn nhỏ rồi nở nhẹ sang tròn vừa.',
    tongueGuide: 'Lưỡi giữ vị trí nâng phía sau.',
    vietnameseComparison: 'Tương tự "uô" trong tiếng Việt (như "cuộc", "buộc").',
    commonErrors: 'Đọc thành "o" đơn.',
    huduYin: '窝',
    examples: [
      { hanzi: '多', pinyin: 'duō', meaning: 'Nhiều', audioText: '多' },
      { hanzi: '国', pinyin: 'guó', meaning: 'Đất nước', audioText: '国' },
      { hanzi: '错', pinyin: 'cuò', meaning: 'Sai', audioText: '错' },
    ],
    vocalTractConfig: { tonguePosition: 'high_back', lipShape: 'open_round', airflowType: 'vocal_resonant', softPalateState: 'raised' },
  },
  {
    id: 'final_ue_umlaut',
    symbol: 'üe',
    ipa: '[y̯e]',
    type: 'compound_final',
    chineseName: '复韵母 / 撮口呼',
    vietnameseName: 'Vận mẫu üe (u hai chấm e)',
    categoryVi: 'Vận mẫu kép',
    articulationType: 'Nguyên âm đôi, bắt đầu từ [ü] trượt sang [e]',
    aspiration: 'voiced',
    mouthGuide: 'Môi chu tròn như "ü" rồi trượt nhanh dẹt sang "e". Khi ghép j, q, x viết là ue (bỏ dấu 2 chấm).',
    tongueGuide: 'Đầu lưỡi luôn chạm răng dưới.',
    vietnameseComparison: 'Gần giống "uyê" trong tiếng Việt (như "duyên", "khuyên").',
    commonErrors: 'Quên chu môi ở âm đầu.',
    huduYin: '约',
    examples: [
      { hanzi: '月', pinyin: 'yuè', meaning: 'Mặt trăng, tháng', audioText: '月' },
      { hanzi: '雪', pinyin: 'xuě', meaning: 'Tuyết', audioText: '雪' },
      { hanzi: '学', pinyin: 'xué', meaning: 'Học', audioText: '学' },
    ],
    vocalTractConfig: { tonguePosition: 'high_front_rounded', lipShape: 'pursed_round', airflowType: 'vocal_resonant', softPalateState: 'raised' },
  },
  {
    id: 'final_iao',
    symbol: 'iao',
    ipa: '[i̯aʊ]',
    type: 'compound_final',
    chineseName: '复韵母 / 齐齿呼',
    vietnameseName: 'Vận mẫu iao',
    categoryVi: 'Vận mẫu kép',
    articulationType: 'Nguyên âm ba, trượt từ [i] qua [a] sang [o]',
    aspiration: 'voiced',
    mouthGuide: 'Dẹt môi "i" -> mở to "a" -> chu tròn "o".',
    tongueGuide: 'Chuyển động liên tục từ trước xuống thấp rồi lùi sau.',
    vietnameseComparison: 'Tương tự "eo" hoặc "yeo" trong tiếng Việt (như "kẹo", "khéo").',
    commonErrors: 'Bỏ mất âm giữa "a".',
    huduYin: '腰',
    examples: [
      { hanzi: '小', pinyin: 'xiǎo', meaning: 'Nhỏ', audioText: '小' },
      { hanzi: '叫', pinyin: 'jiào', meaning: 'Gọi', audioText: '叫' },
      { hanzi: '票', pinyin: 'piào', meaning: 'Vé', audioText: '票' },
    ],
    vocalTractConfig: { tonguePosition: 'high_front', lipShape: 'open_round', airflowType: 'vocal_resonant', softPalateState: 'raised' },
  },
  {
    id: 'final_iou',
    symbol: 'iou',
    ipa: '[i̯oʊ]',
    type: 'compound_final',
    chineseName: '复韵母 / 齐齿呼',
    vietnameseName: 'Vận mẫu iou (dạng rút gọn: iu)',
    categoryVi: 'Vận mẫu kép',
    articulationType: 'Nguyên âm ba, trượt từ [i] qua [o] sang [u]. Viết thành "iu" khi có thanh mẫu.',
    aspiration: 'voiced',
    mouthGuide: 'Môi dẹt "i" -> hơi mở "o" -> chu tròn "u".',
    tongueGuide: 'Lưỡi từ trước lùi nhanh về sau.',
    vietnameseComparison: 'Tương tự "yêu" trong tiếng Việt (như "yêu", "chiều").',
    commonErrors: 'Đọc nhầm thành "i-u" tách rời.',
    huduYin: '优',
    examples: [
      { hanzi: '九', pinyin: 'jiǔ', meaning: 'Số chín', audioText: '九' },
      { hanzi: '有', pinyin: 'yǒu', meaning: 'Có', audioText: '有' },
      { hanzi: '牛', pinyin: 'niú', meaning: 'Con bò', audioText: '牛' },
    ],
    vocalTractConfig: { tonguePosition: 'high_front', lipShape: 'open_round', airflowType: 'vocal_resonant', softPalateState: 'raised' },
  },
  {
    id: 'final_uai',
    symbol: 'uai',
    ipa: '[u̯aɪ]',
    type: 'compound_final',
    chineseName: '复韵母 / 合口呼',
    vietnameseName: 'Vận mẫu uai',
    categoryVi: 'Vận mẫu kép',
    articulationType: 'Nguyên âm ba, trượt từ [u] qua [a] sang [i]',
    aspiration: 'voiced',
    mouthGuide: 'Môi chu tròn "u" -> mở to "a" -> dẹt ngang "i".',
    tongueGuide: 'Lưỡi từ sau lùi về đáy miệng rồi nâng cao phía trước.',
    vietnameseComparison: 'Tương tự "oai" trong tiếng Việt (như "khoai", "ngoài").',
    commonErrors: 'Mở khẩu hình không đủ rõ ở âm "a".',
    huduYin: '歪',
    examples: [
      { hanzi: '快', pinyin: 'kuài', meaning: 'Nhanh', audioText: '快' },
      { hanzi: '怪', pinyin: 'guài', meaning: 'Kỳ lạ', audioText: '怪' },
      { hanzi: '外', pinyin: 'wài', meaning: 'Bên ngoài', audioText: '外' },
    ],
    vocalTractConfig: { tonguePosition: 'low_flat', lipShape: 'open_large', airflowType: 'vocal_resonant', softPalateState: 'raised' },
  },
  {
    id: 'final_uei',
    symbol: 'uei',
    ipa: '[u̯eɪ]',
    type: 'compound_final',
    chineseName: '复韵母 / 合口呼',
    vietnameseName: 'Vận mẫu uei (dạng rút gọn: ui)',
    categoryVi: 'Vận mẫu kép',
    articulationType: 'Nguyên âm ba, trượt từ [u] qua [e] sang [i]. Viết thành "ui" khi có thanh mẫu.',
    aspiration: 'voiced',
    mouthGuide: 'Môi chu tròn "u" -> hơi mở "e" -> dẹt ngang "i".',
    tongueGuide: 'Lưỡi dịch chuyển linh hoạt từ sau ra trước.',
    vietnameseComparison: 'Tương tự "uây" trong tiếng Việt (như "khuấy", "quầy").',
    commonErrors: 'Đọc thành "u-i" không có âm đệm ở giữa.',
    huduYin: '威',
    examples: [
      { hanzi: '水', pinyin: 'shuǐ', meaning: 'Nước', audioText: '水' },
      { hanzi: '贵', pinyin: 'guì', meaning: 'Đắt, quý', audioText: '贵' },
      { hanzi: '会', pinyin: 'huì', meaning: 'Biết, hội', audioText: '会' },
    ],
    vocalTractConfig: { tonguePosition: 'high_back', lipShape: 'open_round', airflowType: 'vocal_resonant', softPalateState: 'raised' },
  },
];

export const BEGINNER_NASAL_FINALS: BeginnerPhoneticItem[] = [
  // 8 Mũi trước (-n)
  {
    id: 'final_an',
    symbol: 'an',
    ipa: '[an]',
    type: 'nasal_final',
    chineseName: '前鼻音 (Vận mẫu mũi trước)',
    vietnameseName: 'Vận mẫu an',
    categoryVi: 'Vận mẫu mũi trước (-n)',
    articulationType: 'Vận mẫu mũi trước, kết thúc bằng đầu lưỡi chạm lợi trên',
    aspiration: 'nasal',
    mouthGuide: 'Mở to "a" rồi khép dần, luồng hơi dồn lên khoang mũi.',
    tongueGuide: 'Đầu lưỡi chạm chắc vào lợi trên (chân răng trên), hơi thoát hoàn toàn qua mũi.',
    vietnameseComparison: 'Tương tự "an" trong tiếng Việt (như "bàn", "lan").',
    commonErrors: 'Nhầm lẫn sang âm mũi sau "ang" (không chạm đầu lưỡi vào lợi).',
    huduYin: '安',
    examples: [
      { hanzi: '三', pinyin: 'sān', meaning: 'Số ba', audioText: '三' },
      { hanzi: '看', pinyin: 'kàn', meaning: 'Xem', audioText: '看' },
      { hanzi: '慢', pinyin: 'màn', meaning: 'Chậm', audioText: '慢' },
    ],
    vocalTractConfig: { tonguePosition: 'alveolar', lipShape: 'open_large', airflowType: 'nasal_escape', softPalateState: 'lowered' },
    contrastWith: ['ang'],
  },
  {
    id: 'final_en',
    symbol: 'en',
    ipa: '[ən]',
    type: 'nasal_final',
    chineseName: '前鼻音 (Vận mẫu mũi trước)',
    vietnameseName: 'Vận mẫu en',
    categoryVi: 'Vận mẫu mũi trước (-n)',
    articulationType: 'Vận mẫu mũi trước',
    aspiration: 'nasal',
    mouthGuide: 'Mở miệng vừa phải, kết thúc dẹt nhẹ.',
    tongueGuide: 'Đầu lưỡi nâng lên chạm lợi trên ngắt âm.',
    vietnameseComparison: 'Tương tự "ơn" hoặc "ân" trong tiếng Việt (như "cơn", "thân").',
    commonErrors: 'Nhầm sang "eng".',
    huduYin: '恩',
    examples: [
      { hanzi: '门', pinyin: 'mén', meaning: 'Cánh cửa', audioText: '门' },
      { hanzi: '很', pinyin: 'hěn', meaning: 'Rất', audioText: '很' },
      { hanzi: '本', pinyin: 'běn', meaning: 'Cuốn, vở', audioText: '本' },
    ],
    vocalTractConfig: { tonguePosition: 'alveolar', lipShape: 'spread', airflowType: 'nasal_escape', softPalateState: 'lowered' },
    contrastWith: ['eng'],
  },
  {
    id: 'final_in',
    symbol: 'in',
    ipa: '[in]',
    type: 'nasal_final',
    chineseName: '前鼻音 (Vận mẫu mũi trước)',
    vietnameseName: 'Vận mẫu in',
    categoryVi: 'Vận mẫu mũi trước (-n)',
    articulationType: 'Vận mẫu mũi trước',
    aspiration: 'nasal',
    mouthGuide: 'Môi dẹt ngang, hai hàm răng gần chạm.',
    tongueGuide: 'Đầu lưỡi chạm lợi trên đưa hơi qua mũi.',
    vietnameseComparison: 'Tương tự "in" trong tiếng Việt (như "tin", "nhìn").',
    commonErrors: 'Nhầm sang "ing".',
    huduYin: '因',
    examples: [
      { hanzi: '今', pinyin: 'jīn', meaning: 'Nay, hôm nay', audioText: '今' },
      { hanzi: '您', pinyin: 'nín', meaning: 'Ngài, ông (kính ngữ)', audioText: '您' },
      { hanzi: '新', pinyin: 'xīn', meaning: 'Mới', audioText: '新' },
    ],
    vocalTractConfig: { tonguePosition: 'alveolar', lipShape: 'spread', airflowType: 'nasal_escape', softPalateState: 'lowered' },
    contrastWith: ['ing'],
  },
  {
    id: 'final_un_umlaut',
    symbol: 'ün',
    ipa: '[yn]',
    type: 'nasal_final',
    chineseName: '前鼻音 / 撮口呼',
    vietnameseName: 'Vận mẫu ün (u hai chấm n)',
    categoryVi: 'Vận mẫu mũi trước (-n)',
    articulationType: 'Vận mẫu mũi trước, tròn môi',
    aspiration: 'nasal',
    mouthGuide: 'Môi chu tròn nhỏ như "ü" rồi đầu lưỡi chạm lợi kết thúc.',
    tongueGuide: 'Lưỡi phía trước chạm chân răng trên.',
    vietnameseComparison: 'Gần giống "uyn" trong tiếng Việt (như "huynh").',
    commonErrors: 'Đọc thành "un" không chu môi tròn.',
    huduYin: '晕',
    examples: [
      { hanzi: '群', pinyin: 'qún', meaning: 'Bầy, đàn', audioText: '群' },
      { hanzi: '云', pinyin: 'yún', meaning: 'Mây', audioText: '云' },
      { hanzi: '军', pinyin: 'jūn', meaning: 'Quân đội', audioText: '军' },
    ],
    vocalTractConfig: { tonguePosition: 'high_front_rounded', lipShape: 'pursed_round', airflowType: 'nasal_escape', softPalateState: 'lowered' },
  },
  {
    id: 'final_ian',
    symbol: 'ian',
    ipa: '[i̯ɛn]',
    type: 'nasal_final',
    chineseName: '前鼻音 / 齐齿呼',
    vietnameseName: 'Vận mẫu ian',
    categoryVi: 'Vận mẫu mũi trước (-n)',
    articulationType: 'Vận mẫu mũi trước',
    aspiration: 'nasal',
    mouthGuide: 'Bắt đầu từ "i" dẹt rồi trượt qua âm "e" kết thúc bằng n.',
    tongueGuide: 'Đầu lưỡi chạm lợi trên.',
    vietnameseComparison: 'Tương tự "iên" trong tiếng Việt (như "tiền", "biển"), KHÔNG đọc là "i-an".',
    commonErrors: 'Đọc nhầm thành "i-an".',
    huduYin: '烟',
    examples: [
      { hanzi: '天', pinyin: 'tiān', meaning: 'Trời, ngày', audioText: '天' },
      { hanzi: '见', pinyin: 'jiàn', meaning: 'Gặp', audioText: '见' },
      { hanzi: '点', pinyin: 'diǎn', meaning: 'Điểm', audioText: '点' },
    ],
    vocalTractConfig: { tonguePosition: 'alveolar', lipShape: 'spread', airflowType: 'nasal_escape', softPalateState: 'lowered' },
    contrastWith: ['iang'],
  },
  {
    id: 'final_uan',
    symbol: 'uan',
    ipa: '[u̯an]',
    type: 'nasal_final',
    chineseName: '前鼻音 / 合口呼',
    vietnameseName: 'Vận mẫu uan',
    categoryVi: 'Vận mẫu mũi trước (-n)',
    articulationType: 'Vận mẫu mũi trước',
    aspiration: 'nasal',
    mouthGuide: 'Môi chu tròn rồi mở to sang "an".',
    tongueGuide: 'Lưỡi trượt hạ thấp rồi đầu lưỡi chạm lợi trên.',
    vietnameseComparison: 'Tương tự "oan" trong tiếng Việt (như "toán", "hoàn").',
    commonErrors: 'Nhầm sang "uang".',
    huduYin: '弯',
    examples: [
      { hanzi: '关', pinyin: 'guān', meaning: 'Đóng', audioText: '关' },
      { hanzi: '穿', pinyin: 'chuān', meaning: 'Mặc', audioText: '穿' },
      { hanzi: '看', pinyin: 'wán', meaning: 'Chơi, hoàn thành', audioText: '玩' },
    ],
    vocalTractConfig: { tonguePosition: 'alveolar', lipShape: 'open_large', airflowType: 'nasal_escape', softPalateState: 'lowered' },
    contrastWith: ['uang'],
  },
  {
    id: 'final_uan_umlaut',
    symbol: 'üan',
    ipa: '[y̯ɛn]',
    type: 'nasal_final',
    chineseName: '前鼻音 / 撮口呼',
    vietnameseName: 'Vận mẫu üan (u hai chấm an)',
    categoryVi: 'Vận mẫu mũi trước (-n)',
    articulationType: 'Vận mẫu mũi trước',
    aspiration: 'nasal',
    mouthGuide: 'Môi chu tròn "ü" rồi trượt sang "en".',
    tongueGuide: 'Đầu lưỡi chạm lợi trên.',
    vietnameseComparison: 'Gần giống "uyên" trong tiếng Việt (như "thuyền", "chuyên").',
    commonErrors: 'Đọc thành "oan".',
    huduYin: '冤',
    examples: [
      { hanzi: '选', pinyin: 'xuǎn', meaning: 'Chọn', audioText: '选' },
      { hanzi: '远', pinyin: 'yuǎn', meaning: 'Xa', audioText: '远' },
      { hanzi: '圈', pinyin: 'quān', meaning: 'Vòng tròn', audioText: '圈' },
    ],
    vocalTractConfig: { tonguePosition: 'high_front_rounded', lipShape: 'pursed_round', airflowType: 'nasal_escape', softPalateState: 'lowered' },
  },
  {
    id: 'final_uen',
    symbol: 'uen',
    ipa: '[u̯ən]',
    type: 'nasal_final',
    chineseName: '前鼻音 / 合口呼',
    vietnameseName: 'Vận mẫu uen (dạng rút gọn: un)',
    categoryVi: 'Vận mẫu mũi trước (-n)',
    articulationType: 'Vận mẫu mũi trước. Khi có thanh mẫu viết thành "un".',
    aspiration: 'nasal',
    mouthGuide: 'Chu môi tròn rồi khép dẹt nhẹ.',
    tongueGuide: 'Đầu lưỡi chạm lợi trên kết thúc âm.',
    vietnameseComparison: 'Tương tự "uân" trong tiếng Việt (như "chuẩn", "xuân").',
    commonErrors: 'Đọc thành "u-n" cứng ngắc.',
    huduYin: '温',
    examples: [
      { hanzi: '问', pinyin: 'wèn', meaning: 'Hỏi', audioText: '问' },
      { hanzi: '春', pinyin: 'chūn', meaning: 'Mùa xuân', audioText: '春' },
      { hanzi: '准', pinyin: 'zhǔn', meaning: 'Chuẩn', audioText: '准' },
    ],
    vocalTractConfig: { tonguePosition: 'alveolar', lipShape: 'open_round', airflowType: 'nasal_escape', softPalateState: 'lowered' },
  },

  // 8 Mũi sau (-ng)
  {
    id: 'final_ang',
    symbol: 'ang',
    ipa: '[ɑŋ]',
    type: 'nasal_final',
    chineseName: '后鼻音 (Vận mẫu mũi sau)',
    vietnameseName: 'Vận mẫu ang',
    categoryVi: 'Vận mẫu mũi sau (-ng)',
    articulationType: 'Vận mẫu mũi sau, kết thúc bằng cuống lưỡi chạm ngạc mềm',
    aspiration: 'nasal',
    mouthGuide: 'Miệng mở to, âm kết thúc cuống họng vang vọng.',
    tongueGuide: 'Gốc lưỡi (cuống lưỡi) nâng cao chạm vào ngạc mềm ngắt âm, đầu lưỡi không chạm răng.',
    vietnameseComparison: 'Tương tự "ang" trong tiếng Việt (như "làng", "sáng") nhưng cuống họng mở rộng sâu hơn.',
    commonErrors: 'Chạm đầu lưỡi lên lợi nhầm sang "an".',
    huduYin: '昂',
    examples: [
      { hanzi: '忙', pinyin: 'máng', meaning: 'Bận rộn', audioText: '忙' },
      { hanzi: '常', pinyin: 'cháng', meaning: 'Thường', audioText: '常' },
      { hanzi: '长', pinyin: 'cháng', meaning: 'Dài', audioText: '长' },
    ],
    vocalTractConfig: { tonguePosition: 'velar', lipShape: 'open_large', airflowType: 'nasal_escape', softPalateState: 'lowered' },
    contrastWith: ['an'],
  },
  {
    id: 'final_eng',
    symbol: 'eng',
    ipa: '[ɤŋ]',
    type: 'nasal_final',
    chineseName: '后鼻音 (Vận mẫu mũi sau)',
    vietnameseName: 'Vận mẫu eng',
    categoryVi: 'Vận mẫu mũi sau (-ng)',
    articulationType: 'Vận mẫu mũi sau',
    aspiration: 'nasal',
    mouthGuide: 'Khẩu hình mở vừa, khóe môi dẹt ngang.',
    tongueGuide: 'Cuống lưỡi nâng chạm ngạc mềm.',
    vietnameseComparison: 'Tương tự "âng" trong tiếng Việt (như "vâng", "tầng").',
    commonErrors: 'Nhầm sang "en".',
    huduYin: '亨',
    examples: [
      { hanzi: '冷', pinyin: 'lěng', meaning: 'Lạnh', audioText: '冷' },
      { hanzi: '等', pinyin: 'děng', meaning: 'Đợi', audioText: '等' },
      { hanzi: '能', pinyin: 'néng', meaning: 'Có thể', audioText: '能' },
    ],
    vocalTractConfig: { tonguePosition: 'velar', lipShape: 'spread', airflowType: 'nasal_escape', softPalateState: 'lowered' },
    contrastWith: ['en'],
  },
  {
    id: 'final_ing',
    symbol: 'ing',
    ipa: '[iŋ]',
    type: 'nasal_final',
    chineseName: '后鼻音 / 齐齿呼',
    vietnameseName: 'Vận mẫu ing',
    categoryVi: 'Vận mẫu mũi sau (-ng)',
    articulationType: 'Vận mẫu mũi sau',
    aspiration: 'nasal',
    mouthGuide: 'Khóe môi kéo dẹt ngang.',
    tongueGuide: 'Cuống lưỡi nâng chạm ngạc mềm, thân lưỡi nâng phía trước.',
    vietnameseComparison: 'Tương tự "inh" trong tiếng Việt (như "tinh", "mình").',
    commonErrors: 'Nhầm sang "in".',
    huduYin: '英',
    examples: [
      { hanzi: '听', pinyin: 'tīng', meaning: 'Nghe', audioText: '听' },
      { hanzi: '请', pinyin: 'qǐng', meaning: 'Mời, xin', audioText: '请' },
      { hanzi: '名', pinyin: 'míng', meaning: 'Tên', audioText: '名' },
    ],
    vocalTractConfig: { tonguePosition: 'velar', lipShape: 'spread', airflowType: 'nasal_escape', softPalateState: 'lowered' },
    contrastWith: ['in'],
  },
  {
    id: 'final_ong',
    symbol: 'ong',
    ipa: '[ʊŋ]',
    type: 'nasal_final',
    chineseName: '后鼻音 / 合口呼',
    vietnameseName: 'Vận mẫu ong',
    categoryVi: 'Vận mẫu mũi sau (-ng)',
    articulationType: 'Vận mẫu mũi sau',
    aspiration: 'nasal',
    mouthGuide: 'Môi chu tròn đều.',
    tongueGuide: 'Cuống lưỡi nâng cao về phía sau chạm ngạc mềm.',
    vietnameseComparison: 'Tương tự "ung" trong tiếng Việt (như "trung", "dùng"), KHÔNG đọc là "ong" tiếng Việt.',
    commonErrors: 'Đọc thành "ong" mở rộng môi tiếng Việt.',
    huduYin: '轰',
    examples: [
      { hanzi: '红', pinyin: 'hóng', meaning: 'Màu đỏ', audioText: '红' },
      { hanzi: '中', pinyin: 'zhōng', meaning: 'Ở giữa', audioText: '中' },
      { hanzi: '同', pinyin: 'tóng', meaning: 'Cùng nhau', audioText: '同' },
    ],
    vocalTractConfig: { tonguePosition: 'velar', lipShape: 'open_round', airflowType: 'nasal_escape', softPalateState: 'lowered' },
    contrastWith: ['iong'],
  },
  {
    id: 'final_iang',
    symbol: 'iang',
    ipa: '[i̯ɑŋ]',
    type: 'nasal_final',
    chineseName: '后鼻音 / 齐齿呼',
    vietnameseName: 'Vận mẫu iang',
    categoryVi: 'Vận mẫu mũi sau (-ng)',
    articulationType: 'Vận mẫu mũi sau',
    aspiration: 'nasal',
    mouthGuide: 'Dẹt môi "i" rồi mở to sang "ang".',
    tongueGuide: 'Cuống lưỡi nâng ngạc mềm kết thúc.',
    vietnameseComparison: 'Tương tự "iang" trong tiếng Việt (như "tiếng", "giang").',
    commonErrors: 'Nhầm sang "ian".',
    huduYin: '央',
    examples: [
      { hanzi: '想', pinyin: 'xiǎng', meaning: 'Muốn, nghĩ', audioText: '想' },
      { hanzi: '亮', pinyin: 'liàng', meaning: 'Sáng', audioText: '亮' },
      { hanzi: '两', pinyin: 'liǎng', meaning: 'Hai (lượng từ)', audioText: '两' },
    ],
    vocalTractConfig: { tonguePosition: 'velar', lipShape: 'open_large', airflowType: 'nasal_escape', softPalateState: 'lowered' },
    contrastWith: ['ian'],
  },
  {
    id: 'final_uang',
    symbol: 'uang',
    ipa: '[u̯ɑŋ]',
    type: 'nasal_final',
    chineseName: '后鼻音 / 合口呼',
    vietnameseName: 'Vận mẫu uang',
    categoryVi: 'Vận mẫu mũi sau (-ng)',
    articulationType: 'Vận mẫu mũi sau',
    aspiration: 'nasal',
    mouthGuide: 'Môi chu tròn rồi mở to sang "ang".',
    tongueGuide: 'Cuống lưỡi nâng chạm ngạc mềm.',
    vietnameseComparison: 'Tương tự "oang" trong tiếng Việt (như "hoàng", "quang").',
    commonErrors: 'Nhầm sang "uan".',
    huduYin: '汪',
    examples: [
      { hanzi: '黄', pinyin: 'huáng', meaning: 'Màu vàng', audioText: '黄' },
      { hanzi: '双', pinyin: 'shuāng', meaning: 'Đôi, cặp', audioText: '双' },
      { hanzi: '光', pinyin: 'guāng', meaning: 'Ánh sáng', audioText: '光' },
    ],
    vocalTractConfig: { tonguePosition: 'velar', lipShape: 'open_large', airflowType: 'nasal_escape', softPalateState: 'lowered' },
    contrastWith: ['uan'],
  },
  {
    id: 'final_ueng',
    symbol: 'ueng',
    ipa: '[u̯ɤŋ]',
    type: 'nasal_final',
    chineseName: '后鼻音 / 合口呼',
    vietnameseName: 'Vận mẫu ueng (khi đứng độc lập viết: weng)',
    categoryVi: 'Vận mẫu mũi sau (-ng)',
    articulationType: 'Vận mẫu mũi sau',
    aspiration: 'nasal',
    mouthGuide: 'Chu môi tròn rồi trượt sang "eng".',
    tongueGuide: 'Cuống lưỡi nâng ngạc mềm.',
    vietnameseComparison: 'Tương tự "uâng" trong tiếng Việt (như "bâng khuâng").',
    commonErrors: 'Âm này không ghép với thanh mẫu, chỉ đứng một mình dưới dạng "weng".',
    huduYin: '翁',
    examples: [
      { hanzi: '翁', pinyin: 'wēng', meaning: 'Ông già', audioText: '翁' },
      { hanzi: '嗡', pinyin: 'wēng', meaning: 'Tiếng vo ve', audioText: '嗡' },
      { hanzi: '瓮', pinyin: 'wèng', meaning: 'Cái hũ, vại', audioText: '瓮' },
    ],
    vocalTractConfig: { tonguePosition: 'velar', lipShape: 'open_round', airflowType: 'nasal_escape', softPalateState: 'lowered' },
  },
  {
    id: 'final_iong',
    symbol: 'iong',
    ipa: '[i̯ʊŋ]',
    type: 'nasal_final',
    chineseName: '后鼻音 / 撮口呼',
    vietnameseName: 'Vận mẫu iong',
    categoryVi: 'Vận mẫu mũi sau (-ng)',
    articulationType: 'Vận mẫu mũi sau',
    aspiration: 'nasal',
    mouthGuide: 'Môi dẹt "i" rồi chu tròn sang "ong".',
    tongueGuide: 'Cuống lưỡi nâng ngạc mềm.',
    vietnameseComparison: 'Tương tự "ung" có âm lướt y đầu (như "dũng", "cung").',
    commonErrors: 'Nhầm sang "ong".',
    huduYin: '雍',
    examples: [
      { hanzi: '用', pinyin: 'yòng', meaning: 'Dùng, sử dụng', audioText: '用' },
      { hanzi: '穷', pinyin: 'qióng', meaning: 'Nghèo', audioText: '穷' },
      { hanzi: '熊', pinyin: 'xióng', meaning: 'Con gấu', audioText: '熊' },
    ],
    vocalTractConfig: { tonguePosition: 'velar', lipShape: 'open_round', airflowType: 'nasal_escape', softPalateState: 'lowered' },
    contrastWith: ['ong'],
  },
];

export const BEGINNER_RETROFLEX_FINAL: BeginnerPhoneticItem = {
  id: 'final_er',
  symbol: 'er',
  ipa: '[ɐɻ]',
  type: 'retroflex',
  chineseName: '卷舌韵母 (Vận mẫu uốn lưỡi)',
  vietnameseName: 'Vận mẫu uốn lưỡi er',
  categoryVi: 'Vận mẫu er uốn lưỡi',
  articulationType: 'Vận mẫu uốn lưỡi đặc biệt, đứng độc lập hoặc làm hậu tố uốn lưỡi (nhi hóa - 儿化)',
  aspiration: 'voiced',
  mouthGuide: 'Miệng mở tự nhiên như "e", đồng thời đầu lưỡi uốn cong dần lên phía ngạc cứng.',
  tongueGuide: 'Đầu lưỡi cuộn nhẹ lên phía vòm họng ngạc cứng, không chạm hẳn vào vòm.',
  vietnameseComparison: 'Gần giống "ơ" uốn lưỡi, TUYỆT ĐỐI KHÔNG đọc là "ai" hay "e-r".',
  commonErrors: 'Đọc nhầm thành "ai" hoặc không cuộn lưỡi.',
  huduYin: '儿',
  examples: [
    { hanzi: '二', pinyin: 'èr', meaning: 'Số hai', audioText: '二' },
    { hanzi: '儿', pinyin: 'ér', meaning: 'Con trai, đứa trẻ', audioText: '儿' },
    { hanzi: '花儿', pinyin: 'huār', meaning: 'Bông hoa (nhi hóa)', audioText: '花儿' },
  ],
  vocalTractConfig: {
    tonguePosition: 'retroflex',
    lipShape: 'open_round',
    airflowType: 'vocal_resonant',
    softPalateState: 'raised',
    lipSteps: ['1. Mở miệng vừa phải', '2. Uốn nhẹ đầu lưỡi lên ngạc cứng', '3. Phát âm ngân ngắn'],
  },
};

// -----------------------------------------------------------------------------
// 3. FOUR LEXICAL TONES, NEUTRAL TONE & TONE SANDHI
// -----------------------------------------------------------------------------
export interface ToneItem {
  id: string;
  toneNumber: number;
  nameVi: string;
  nameZh: string;
  contour: string; // Chao pitch letters (e.g. '55', '35', '214', '51')
  markExample: string;
  descriptionVi: string;
  pitchTrend: string;
  sampleSyllable: string;
  sampleHanzi: string;
  sampleMeaning: string;
}

export const FOUR_TONES_DATA: ToneItem[] = [
  {
    id: 'tone_1',
    toneNumber: 1,
    nameVi: 'Thanh 1 (Thanh ngang / Âm Bình)',
    nameZh: '第一声 (阴平)',
    contour: '55',
    markExample: 'ā',
    descriptionVi: 'Cao và bằng phẳng. Bắt đầu ở cao độ 5 và giữ nguyên cao độ 5 đến hết âm, kéo dài đều, không hạ giọng.',
    pitchTrend: 'Cao và bằng (55)',
    sampleSyllable: 'mā',
    sampleHanzi: '妈',
    sampleMeaning: 'Mẹ',
  },
  {
    id: 'tone_2',
    toneNumber: 2,
    nameVi: 'Thanh 2 (Thanh sắc / Dương Bình)',
    nameZh: '第二声 (阳平)',
    contour: '35',
    markExample: 'á',
    descriptionVi: 'Tăng dần từ vừa lên cao. Bắt đầu từ cao độ 3 vút nhanh lên cao độ 5, tương tự dấu sắc trong tiếng Việt khi hỏi nghi vấn.',
    pitchTrend: 'Tăng dần (35)',
    sampleSyllable: 'má',
    sampleHanzi: '麻',
    sampleMeaning: 'Cây gai, mè',
  },
  {
    id: 'tone_3',
    toneNumber: 3,
    nameVi: 'Thanh 3 (Thanh hỏi-ngã / Thượng Thanh)',
    nameZh: '第三声 (上声)',
    contour: '214',
    markExample: 'ǎ',
    descriptionVi: 'Hạ sâu rồi đưa lên. Từ cao độ 2 hạ xuống thấp nhất 1 rồi uốn lên 4, có độ trầm sâu lắng nhất.',
    pitchTrend: 'Hạ rồi lên (214)',
    sampleSyllable: 'mǎ',
    sampleHanzi: '马',
    sampleMeaning: 'Con ngựa',
  },
  {
    id: 'tone_4',
    toneNumber: 4,
    nameVi: 'Thanh 4 (Thanh huyền rơi / Khứ Thanh)',
    nameZh: '第四声 (去声)',
    contour: '51',
    markExample: 'à',
    descriptionVi: 'Rơi nhanh và dứt khoát. Từ đỉnh cao độ 5 rơi mạnh xuống đáy 1, phát âm dứt khoát như một mệnh lệnh dứt điểm.',
    pitchTrend: 'Giảm mạnh (51)',
    sampleSyllable: 'mà',
    sampleHanzi: '骂',
    sampleMeaning: 'Mắng mỏ',
  },
];

export interface ToneSandhiRule {
  id: string;
  title: string;
  ruleSummary: string;
  formula: string;
  explanation: string;
  examples: {
    original: string;
    pronounced: string;
    hanzi: string;
    meaning: string;
  }[];
}

export const TONE_SANDHI_RULES: ToneSandhiRule[] = [
  {
    id: 'sandhi_two_third_tones',
    title: 'Biến điệu hai thanh 3 đi liền nhau',
    ruleSummary: 'Thanh 3 + Thanh 3 ➔ Thanh 2 + Thanh 3',
    formula: '3 + 3 ➔ 2 + 3',
    explanation: 'Khi hai âm tiết cùng mang thanh 3 đứng cạnh nhau, âm tiết đầu tiên sẽ tự động biến thành thanh 2 khi phát âm. Chú ý: phiên âm chữ viết vẫn giữ nguyên thanh 3 ban đầu.',
    examples: [
      { original: 'nǐ hǎo (3+3)', pronounced: 'ní hǎo (2+3)', hanzi: '你好', meaning: 'Xin chào' },
      { original: 'hěn hǎo (3+3)', pronounced: 'hén hǎo (2+3)', hanzi: '很好', meaning: 'Rất tốt' },
      { original: 'měi hǎo (3+3)', pronounced: 'méi hǎo (2+3)', hanzi: '美好', meaning: 'Tốt đẹp' },
    ],
  },
  {
    id: 'sandhi_yi',
    title: 'Biến điệu của chữ "一" (Yī)',
    ruleSummary: 'Đứng trước thanh 4 đọc thanh 2; đứng trước thanh 1,2,3 đọc thanh 4',
    formula: '一 + Thanh 4 ➔ yí | 一 + Thanh 1,2,3 ➔ yì',
    explanation: 'Chữ "一" vốn mang thanh 1 (yī khi đếm số). Khi đứng trước một từ mang thanh 4, nó biến thành thanh 2 (yí). Khi đứng trước từ mang thanh 1, 2, 3, nó biến thành thanh 4 (yì).',
    examples: [
      { original: 'yī + gè (1+4)', pronounced: 'yí gè (2+4)', hanzi: '一个', meaning: 'Một cái' },
      { original: 'yī + yàng (1+4)', pronounced: 'yí yàng (2+4)', hanzi: '一样', meaning: 'Giống nhau' },
      { original: 'yī + tiān (1+1)', pronounced: 'yì tiān (4+1)', hanzi: '一天', meaning: 'Một ngày' },
      { original: 'yī + nián (1+2)', pronounced: 'yì nián (4+2)', hanzi: '一年', meaning: 'Một năm' },
      { original: 'yī + qǐ (1+3)', pronounced: 'yì qǐ (4+3)', hanzi: '一起', meaning: 'Cùng nhau' },
    ],
  },
  {
    id: 'sandhi_bu',
    title: 'Biến điệu của chữ "不" (Bù)',
    ruleSummary: 'Đứng trước thanh 4 đọc thành thanh 2 (bú)',
    formula: '不 + Thanh 4 ➔ bú | Đứng trước thanh 1,2,3 giữ nguyên bù',
    explanation: 'Chữ "不" gốc là thanh 4 (bù). Khi đứng trước một từ mang thanh 4, nó tự động đổi thành thanh 2 (bú). Đứng trước các thanh khác vẫn đọc là bù.',
    examples: [
      { original: 'bù + shì (4+4)', pronounced: 'bú shì (2+4)', hanzi: '不是', meaning: 'Không phải' },
      { original: 'bù + duì (4+4)', pronounced: 'bú duì (2+4)', hanzi: '不对', meaning: 'Không đúng' },
      { original: 'bù + gāo (4+1)', pronounced: 'bù gāo (4+1)', hanzi: '不高', meaning: 'Không cao' },
      { original: 'bù + lái (4+2)', pronounced: 'bù lái (4+2)', hanzi: '不来', meaning: 'Không đến' },
      { original: 'bù + hǎo (4+3)', pronounced: 'bù hǎo (4+3)', hanzi: '不好', meaning: 'Không tốt' },
    ],
  },
];

// -----------------------------------------------------------------------------
// 4. SPECIAL PINYIN RULES (QUY TẮC PINYIN ĐẶC BIỆT)
// -----------------------------------------------------------------------------
export interface SpecialRuleTopic {
  id: string;
  title: string;
  tabLabel: string;
  summary: string;
  details: string[];
  examples: {
    item: string;
    note: string;
    hanzi?: string;
    meaning?: string;
  }[];
}

export const SPECIAL_PINYIN_RULES: SpecialRuleTopic[] = [
  {
    id: 'rule_y_w',
    title: 'Quy tắc mở đầu bằng y và w (Zero-initial)',
    tabLabel: 'y và w',
    summary: 'Khi vận mẫu bắt đầu bằng i, u, ü đứng độc lập không có thanh mẫu đi kèm, ta thêm hoặc đổi thành y hoặc w.',
    details: [
      'Nhóm nguyên âm i: i ➔ yi, ia ➔ ya, ie ➔ ye, iao ➔ yao, iou ➔ you, ian ➔ yan, in ➔ yin, iang ➔ yang, ing ➔ ying, iong ➔ yong.',
      'Nhóm nguyên âm u: u ➔ wu, ua ➔ wa, uo ➔ wo, uai ➔ wai, uei ➔ wei, uan ➔ wan, uen ➔ wen, uang ➔ wang, ueng ➔ weng.',
      'Nhóm nguyên âm ü: ü ➔ yu, üe ➔ yue, üan ➔ yuan, ün ➔ yun (bỏ 2 dấu chấm trên đầu).',
    ],
    examples: [
      { item: 'yī', note: 'i đứng một mình ➔ viết yi', hanzi: '一', meaning: 'Số một' },
      { item: 'wǔ', note: 'u đứng một mình ➔ viết wu', hanzi: '五', meaning: 'Số năm' },
      { item: 'yú', note: 'ü đứng một mình ➔ viết yu', hanzi: '鱼', meaning: 'Con cá' },
      { item: 'wǒ', note: 'uo đứng một mình ➔ viết wo', hanzi: '我', meaning: 'Tôi' },
    ],
  },
  {
    id: 'rule_u_umlaut_drop',
    title: 'Quy tắc bỏ dấu 2 chấm của ü sau j, q, x',
    tabLabel: 'ü sau j, q, x',
    summary: 'Khi ü ghép với các thanh mẫu mặt lưỡi j, q, x, ta bỏ dấu hai chấm nhưng VẪN PHÁT ÂM LÀ [y] (ü). Giữ nguyên hai chấm sau n và l.',
    details: [
      'j + ü ➔ ju (vẫn đọc là jü): ví dụ 居 (jū).',
      'q + ü ➔ qu (vẫn đọc là qü): ví dụ 去 (qù).',
      'x + ü ➔ xu (vẫn đọc là xü): ví dụ 需 (xū).',
      'BẮT BUỘC giữ hai chấm sau n và l để phân biệt với u: nǚ (女 - con gái) khác nǔ (努 - nỗ lực); lǜ (绿 - xanh lục) khác lù (路 - đường đi).',
    ],
    examples: [
      { item: 'jū', note: 'Viết ju, đọc [tɕy]', hanzi: '居', meaning: 'Ở, cư trú' },
      { item: 'qù', note: 'Viết qu, đọc [tɕʰy]', hanzi: '去', meaning: 'Đi' },
      { item: 'xū', note: 'Viết xu, đọc [ɕy]', hanzi: '需', meaning: 'Cần thiết' },
      { item: 'nǚ', note: 'Giữ nguyên ü để phân biệt với nǔ', hanzi: '女', meaning: 'Nữ, phụ nữ' },
      { item: 'lǜ', note: 'Giữ nguyên ü để phân biệt với lù', hanzi: '绿', meaning: 'Màu xanh lục' },
    ],
  },
  {
    id: 'rule_contractions',
    title: 'Quy tắc rút gọn iou, uei, uen',
    tabLabel: 'iou, uei, uen',
    summary: 'Khi ba vận mẫu iou, uei, uen ghép với các thanh mẫu phía trước, chúng được viết rút gọn lại.',
    details: [
      'iou ➔ iu: ví dụ j + iou ➔ jiǔ (九 - số chín), l + iou ➔ liù (六 - số sáu).',
      'uei ➔ ui: ví dụ d + uei ➔ duì (对 - đúng), g + uei ➔ guì (贵 - đắt).',
      'uen ➔ un: ví dụ c + uen ➔ chūn (春 - mùa xuân), l + uen ➔ lùn (论 - bàn luận).',
      'Khi đứng độc lập (không có thanh mẫu), viết đầy đủ theo quy tắc y/w: you, wei, wen.',
    ],
    examples: [
      { item: 'jiǔ', note: 'Gốc là j + iou', hanzi: '九', meaning: 'Số 9' },
      { item: 'duì', note: 'Gốc là d + uei', hanzi: '对', meaning: 'Đúng' },
      { item: 'chūn', note: 'Gốc là ch + uen', hanzi: '春', meaning: 'Mùa xuân' },
      { item: 'guì', note: 'Gốc là g + uei', hanzi: '贵', meaning: 'Quý, đắt' },
    ],
  },
  {
    id: 'rule_tone_marks',
    title: 'Thứ tự ưu tiên đánh dấu thanh điệu (a, o, e, i, u, ü)',
    tabLabel: 'Đánh dấu thanh điệu',
    summary: 'Dấu thanh điệu luôn được đánh trên đầu nguyên âm theo thứ tự ưu tiên độ mở miệng: a ➔ o ➔ e ➔ i ➔ u ➔ ü.',
    details: [
      '1. Có nguyên âm "a" thì luôn đánh dấu trên "a" (ví dụ: bā, hǎo, mài).',
      '2. Không có "a", tìm xem có "o" hoặc "e" không (ví dụ: gōu, lèi, gē).',
      '3. Nếu "i" và "u" đi liền nhau (iu hoặc ui), đánh dấu vào nguyên âm đứng SAU (ví dụ: jiǔ đánh trên u; duì đánh trên i).',
      '4. Khi đánh dấu trên "i", dấu thanh điệu thay thế cho dấu chấm trên đầu chữ i (ví dụ: nǐ, qī).',
    ],
    examples: [
      { item: 'hǎo', note: 'Có a, đánh trên a', hanzi: '好', meaning: 'Tốt' },
      { item: 'gē', note: 'Không a, có e, đánh trên e', hanzi: '哥', meaning: 'Anh trai' },
      { item: 'jiǔ', note: 'iu đi liền, đánh trên u', hanzi: '九', meaning: 'Số 9' },
      { item: 'guì', note: 'ui đi liền, đánh trên i', hanzi: '贵', meaning: 'Đắt' },
    ],
  },
];

// -----------------------------------------------------------------------------
// 5. MINIMAL-PAIR PHONETIC CONTRASTS (PHÂN BIỆT ÂM DỄ NHẦM)
// -----------------------------------------------------------------------------
export interface MinimalPairContrast {
  id: string;
  title: string;
  soundA: {
    symbol: string;
    tag: string;
    desc: string;
    sample: string;
    hanzi: string;
    meaning: string;
  };
  soundB: {
    symbol: string;
    tag: string;
    desc: string;
    sample: string;
    hanzi: string;
    meaning: string;
  };
  keyDifference: string;
}

export const MINIMAL_PAIR_CONTRASTS: MinimalPairContrast[] = [
  {
    id: 'contrast_b_p',
    title: 'Phân biệt b và p (Bật hơi vs Không bật hơi)',
    soundA: {
      symbol: 'b',
      tag: 'Không bật hơi',
      desc: 'Hai môi khép lại, bật hơi nhẹ, không có luồng gió mạnh.',
      sample: 'bā',
      hanzi: '八',
      meaning: 'Số tám',
    },
    soundB: {
      symbol: 'p',
      tag: 'Bật hơi mạnh',
      desc: 'Hai môi mím chặt tích khí rồi bật luồng hơi gió cực mạnh dứt khoát.',
      sample: 'pā',
      hanzi: '趴',
      meaning: 'Nằm sấp',
    },
    keyDifference: 'Âm "b" không bật hơi (đặt tờ giấy trước miệng không lay động); âm "p" bật hơi gió mạnh phụt ra (tờ giấy bay mạnh).',
  },
  {
    id: 'contrast_d_t',
    title: 'Phân biệt d và t (Đầu lưỡi tắc)',
    soundA: {
      symbol: 'd',
      tag: 'Không bật hơi',
      desc: 'Đầu lưỡi chạm lợi trên, hạ nhẹ, phát âm như "t" tiếng Việt.',
      sample: 'dà',
      hanzi: '大',
      meaning: 'To, lớn',
    },
    soundB: {
      symbol: 't',
      tag: 'Bật hơi mạnh',
      desc: 'Đầu lưỡi chạm lợi trên nén hơi rồi hạ phắt xuống, bật hơi gió mạnh.',
      sample: 'tā',
      hanzi: '他',
      meaning: 'Anh ấy',
    },
    keyDifference: '"d" là âm tắc không bật hơi; "t" là âm tắc bật luồng hơi gió cực mạnh.',
  },
  {
    id: 'contrast_g_k',
    title: 'Phân biệt g và k (Cuống lưỡi tắc)',
    soundA: {
      symbol: 'g',
      tag: 'Không bật hơi',
      desc: 'Cuống lưỡi chạm ngạc mềm, hạ nhẹ, phát âm tựa "c/k" tiếng Việt.',
      sample: 'gē',
      hanzi: '哥',
      meaning: 'Anh trai',
    },
    soundB: {
      symbol: 'k',
      tag: 'Bật hơi mạnh',
      desc: 'Cuống lưỡi ép ngạc mềm rồi bật phụt luồng hơi mạnh từ cuống họng.',
      sample: 'kē',
      hanzi: '棵',
      meaning: 'Cây (lượng từ)',
    },
    keyDifference: '"g" phát âm nhẹ nhàng; "k" bật phụt hơi gió mạnh từ sâu cuống họng.',
  },
  {
    id: 'contrast_z_cs_vs_zh_ch_sh',
    title: 'Phân biệt z, c, s (Thẳng lưỡi) và zh, ch, sh (Uốn lưỡi)',
    soundA: {
      symbol: 'z, c, s',
      tag: 'Đầu lưỡi trước (Thẳng lưỡi)',
      desc: 'Đầu lưỡi duỗi thẳng tắp chạm mặt sau răng trên, miệng dẹt ngang.',
      sample: 'sān',
      hanzi: '三',
      meaning: 'Số ba',
    },
    soundB: {
      symbol: 'zh, ch, sh',
      tag: 'Đầu lưỡi sau (Uốn lưỡi)',
      desc: 'Đầu lưỡi uốn cong lên chạm ngạc cứng phía sau chân răng trên.',
      sample: 'shān',
      hanzi: '山',
      meaning: 'Ngọn núi',
    },
    keyDifference: 'Nhóm z/c/s lưỡi thẳng tắp chạm răng; nhóm zh/ch/sh bắt buộc phải uốn cong đầu lưỡi lên vòm họng ngạc cứng.',
  },
  {
    id: 'contrast_n_vs_ng',
    title: 'Phân biệt âm đuôi -n (Mũi trước) và -ng (Mũi sau)',
    soundA: {
      symbol: '-n',
      tag: 'Mũi trước',
      desc: 'Đầu lưỡi chạm chắc vào lợi trên ngắt âm, hơi thoát qua mũi.',
      sample: 'nán',
      hanzi: '南',
      meaning: 'Phương nam',
    },
    soundB: {
      symbol: '-ng',
      tag: 'Mũi sau',
      desc: 'Cuống lưỡi nâng cao chạm ngạc mềm ngắt âm, đầu lưỡi nằm tự do.',
      sample: 'gǎng',
      hanzi: '港',
      meaning: 'Hải cảng',
    },
    keyDifference: 'Âm đuôi "-n" đầu lưỡi phải chạm lợi trên; âm đuôi "-ng" cuống lưỡi chạm ngạc mềm trong cuống họng, đầu lưỡi không chạm răng.',
  },
  {
    id: 'contrast_u_vs_u_umlaut',
    title: 'Phân biệt u và ü (Môi sau vs Môi trước chu nhỏ)',
    soundA: {
      symbol: 'u',
      tag: 'Nguyên âm sau',
      desc: 'Cuống lưỡi nâng sau, môi chu tròn bình thường.',
      sample: 'lù',
      hanzi: '路',
      meaning: 'Con đường',
    },
    soundB: {
      symbol: 'ü',
      tag: 'Nguyên âm trước',
      desc: 'Đầu lưỡi nằm trước chạm răng dưới, môi chu tròn nhỏ như huýt sáo.',
      sample: 'lǜ',
      hanzi: '绿',
      meaning: 'Màu xanh lục',
    },
    keyDifference: 'Vị trí lưỡi của "u" nằm sâu phía sau; vị trí lưỡi của "ü" nằm sát phía trước chân răng dưới nhưng môi chu tròn nhỏ.',
  },
  {
    id: 'contrast_n_vs_l',
    title: 'Phân biệt n và l (Âm mũi vs Âm bên)',
    soundA: {
      symbol: 'n',
      tag: 'Âm mũi',
      desc: 'Hơi thoát hoàn toàn qua khoang mũi, nghẹt mũi lại sẽ khó phát âm.',
      sample: 'nǐ',
      hanzi: '你',
      meaning: 'Bạn, anh, chị',
    },
    soundB: {
      symbol: 'l',
      tag: 'Âm bên',
      desc: 'Hơi thoát qua hai bên mép lưỡi, bóp mũi vẫn phát âm bình thường.',
      sample: 'lǐ',
      hanzi: '里',
      meaning: 'Bên trong',
    },
    keyDifference: 'Âm "n" hơi đi qua mũi; âm "l" hơi đi qua hai bên mép lưỡi.',
  },
];

// Semantic and convenient alias exports for beginner modules
export const BEGINNER_TONES = FOUR_TONES_DATA;

export interface BeginnerToneSandhiItem {
  ruleId: string;
  name: string;
  description: string;
  examples: {
    hanzi: string;
    originalPinyin: string;
    actualPinyin: string;
    meaning: string;
  }[];
}

export const BEGINNER_TONE_SANDHI: BeginnerToneSandhiItem[] = TONE_SANDHI_RULES.map((r) => ({
  ruleId: r.id,
  name: r.title,
  description: r.explanation,
  examples: r.examples.map((ex) => ({
    hanzi: ex.hanzi,
    originalPinyin: ex.original,
    actualPinyin: ex.pronounced,
    meaning: ex.meaning,
  })),
}));

export interface BeginnerPinyinRuleItem {
  id: string;
  title: string;
  summary: string;
  explanation: string;
  examples: {
    spelled: string;
    actual?: string;
    hanzi: string;
    meaning: string;
  }[];
}

export const BEGINNER_PINYIN_RULES: BeginnerPinyinRuleItem[] = SPECIAL_PINYIN_RULES.map((r) => ({
  id: r.id,
  title: r.title,
  summary: r.summary,
  explanation: r.details.join(' '),
  examples: r.examples.map((ex) => ({
    spelled: ex.item,
    actual: ex.note,
    hanzi: ex.hanzi || ex.item,
    meaning: ex.meaning || ex.note,
  })),
}));

export const BEGINNER_MINIMAL_PAIRS = MINIMAL_PAIR_CONTRASTS;

export const BEGINNER_ALL_FINALS: BeginnerPhoneticItem[] = [
  ...BEGINNER_SIMPLE_FINALS,
  ...BEGINNER_COMPOUND_FINALS,
  ...BEGINNER_NASAL_FINALS,
  BEGINNER_RETROFLEX_FINAL,
];
