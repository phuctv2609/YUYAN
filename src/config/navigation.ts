import {
  Home,
  GraduationCap,
  BookOpen,
  Languages,
  FileSpreadsheet,
  Layers,
  Headphones,
  Mic,
  PenTool,
  MoveHorizontal,
  AlertCircle,
  Quote,
  Award,
  Bot,
  BookMarked,
  TrendingUp,
  Settings,
  Briefcase,
  LucideIcon,
} from 'lucide-react';

export interface NavItemConfig {
  id: string;
  label: string;
  shortLabel?: string;
  path: string;
  icon: LucideIcon;
  badge?: string;
  description?: string;
}

export const MAIN_NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'dashboard',
    label: 'Trang chủ',
    shortLabel: 'Trang chủ',
    path: '/dashboard',
    icon: Home,
    description: 'Tổng quan tiến độ & bài học gần nhất',
  },
  {
    id: 'beginner',
    label: 'Người mới',
    shortLabel: 'Cơ bản',
    path: '/beginner',
    icon: GraduationCap,
    badge: 'Mới',
    description: 'Pinyin, thanh điệu & mẫu câu vỡ lòng',
  },
  {
    id: 'lesson',
    label: 'Bài học HSK',
    shortLabel: 'Bài học',
    path: '/hsk/1/lesson/1',
    icon: BookOpen,
    description: '146 bài học chuẩn HSK 1–6 chính thức',
  },
  {
    id: 'vocabulary',
    label: 'Từ vựng HSK',
    shortLabel: 'Từ vựng',
    path: '/vocabulary',
    icon: Languages,
    description: '11.470 từ vựng chuẩn HSK 2.0 & HSK 3.0 phân cấp rõ ràng',
  },
  {
    id: 'specialized',
    label: 'Chuyên ngành',
    shortLabel: 'Ngành',
    path: '/specialized',
    icon: Briefcase,
    badge: '26 Ngành',
    description: '10.000 từ vựng và thuật ngữ thực tế chuẩn hóa từ 26 lĩnh vực then chốt',
  },
  {
    id: 'hanzi',
    label: 'Hán tự',
    shortLabel: 'Hán tự',
    path: '/hanzi',
    icon: FileSpreadsheet,
    description: '1,059 Hán tự chi tiết kèm thứ tự nét',
  },
  {
    id: 'radicals',
    label: '214 Bộ thủ',
    shortLabel: 'Bộ thủ',
    path: '/radicals',
    icon: Layers,
    description: 'Đầy đủ 214 bộ thủ Khang Hy tra cứu nhanh',
  },
  {
    id: 'listening',
    label: 'Luyện nghe',
    shortLabel: 'Nghe',
    path: '/listening',
    icon: Headphones,
    description: 'Nghe hội thoại chuẩn Bắc Kinh có kiểm tra',
  },
  {
    id: 'speaking',
    label: 'Luyện nói',
    shortLabel: 'Nói',
    path: '/speaking',
    icon: Mic,
    description: 'Luyện phát âm câu mẫu chuẩn giọng bản xứ',
  },
  {
    id: 'writing',
    label: 'Luyện viết',
    shortLabel: 'Viết',
    path: '/writing',
    icon: PenTool,
    description: 'Tập tô & viết Hán tự trực tiếp trên màn hình',
  },
  {
    id: 'sentence-ordering',
    label: 'Xếp câu',
    shortLabel: 'Xếp câu',
    path: '/sentence-ordering',
    icon: MoveHorizontal,
    description: 'Sắp xếp trật tự từ tiếng Trung chuẩn ngữ pháp',
  },
  {
    id: 'mistakes',
    label: 'Sổ câu sai',
    shortLabel: 'Câu sai',
    path: '/mistakes',
    icon: AlertCircle,
    description: 'Ghi nhớ và ôn tập các câu làm sai',
  },
  {
    id: 'grammar',
    label: 'Ngữ pháp',
    shortLabel: 'Ngữ pháp',
    path: '/grammar',
    icon: Quote,
    description: 'Các điểm ngữ pháp trọng tâm theo cấp độ',
  },
  {
    id: 'exam',
    label: 'Thi HSK',
    shortLabel: 'Thi thử',
    path: '/exam',
    icon: Award,
    description: 'Đề thi mô phỏng HSK có tính điểm thật',
  },
  {
    id: 'ai',
    label: 'AI Trợ lý',
    shortLabel: 'AI',
    path: '/ai',
    icon: Bot,
    description: 'Gia sư Yuyan AI thông minh, luyện nói và giải đáp tiếng Trung',
  },
  {
    id: 'dictionary',
    label: 'Từ điển CVDICT',
    shortLabel: 'Từ điển',
    path: '/dictionary',
    icon: BookMarked,
    description: 'Tra cứu 122.595 mục từ Hán-Việt với Pinyin & ví dụ câu',
  },
];

export const SECONDARY_NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'progress',
    label: 'Tiến độ',
    shortLabel: 'Tiến độ',
    path: '/progress',
    icon: TrendingUp,
    description: 'Thống kê ghi nhớ SRS & chuỗi học liên tục',
  },
  {
    id: 'settings',
    label: 'Cài đặt',
    shortLabel: 'Cài đặt',
    path: '/settings',
    icon: Settings,
    description: 'Hồ sơ học viên, chủ đề giao diện & bộ nhớ',
  },
];

export const MOBILE_BOTTOM_NAV_IDS: string[] = [
  'dashboard',
  'beginner',
  'lesson',
  'dictionary',
  'progress',
];

export const ALL_NAV_ITEMS: NavItemConfig[] = [...MAIN_NAV_ITEMS, ...SECONDARY_NAV_ITEMS];

export function getNavItemById(id: string): NavItemConfig | undefined {
  return ALL_NAV_ITEMS.find((item) => item.id === id);
}
