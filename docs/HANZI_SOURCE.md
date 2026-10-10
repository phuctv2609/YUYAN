# YUYAN — Đặc tả Kho Ký tự Chữ Hán Chuẩn hóa (Canonical Hanzi Source)

> **Dự án:** YUYAN (语言)  
> **Tài liệu:** Thiết kế & Đặc tả Thực thể Ký tự Chữ Hán (Canonical Hanzi)  
> **Mã văn bản:** `DOC-HNZ-006`  
> **Trạng thái:** Hoàn thiện (`PRODUCTION_READY`)

---

## 1. Giới thiệu & Phạm vi Dữ liệu

Kho ký tự Hán tự chuẩn hóa của YUYAN lưu trữ tại `src/data/hanzi/canonicalHanzi.ts` bao gồm **1,059 chữ Hán độc lập**, bao phủ toàn bộ kho ngữ liệu của 146 bài học HSK 1–6 và 8,456 mục từ vựng.

Mỗi ký tự được xây dựng theo mô hình chuẩn hóa đa chiều (`CanonicalHanzi`), tích hợp các trường thông tin học thuật nghiêm ngặt.

---

## 2. Cấu trúc Mô hình Thực thể `CanonicalHanzi`

```typescript
export interface StrokePath {
  index: number; // Thứ tự nét viết (1, 2, 3...)
  type: string; // Tên nét chữ Hán: 横 (Ngang), 竖 (Sổ), 撇 (Phẩy), 捺 (Mác), 折 (Gập), 点 (Chấm)
  nameVi: string; // Tên gọi tiếng Việt của nét
  pathData?: string; // Dữ liệu tọa độ SVG
}

export interface CanonicalHanzi {
  char: string; // Ký tự Giản thể (e.g. "学")
  traditional: string; // Ký tự Phồn thể (e.g. "學")
  pinyin: string[]; // Phiên âm Pinyin kèm dấu (e.g. ["xué"])
  pinyinNumbers: string[]; // Phiên âm Pinyin dạng số thanh điệu (e.g. ["xue2"])
  meanings: string[]; // Nghĩa dịch Hán Việt và giải nghĩa (e.g. ["Học", "Học tập"])
  strokeCount: number; // Tổng số nét (e.g. 8)
  radical: string; // Bộ thủ đại diện (e.g. "子")
  radicalNumber: number; // Số thứ tự bộ thủ Khang Hy (e.g. 39)
  components: string[]; // Các thành phần cấu tạo (e.g. ["⺍", "冖", "子"])
  decomposition: string; // Công thức chiết tự không gian (e.g. "⿳⺍冖子")
  structure: 'single' | 'left-right' | 'top-bottom' | 'surround' | 'semi-surround' | 'other';
  structureNameVi: string; // Tên kết cấu: "Kết cấu Trên - Dưới"
  strokeData: StrokePath[]; // Danh sách tuần tự từng nét theo quy tắc bút thuận
  hskLevels: number[]; // Các cấp độ HSK xuất hiện (e.g. [1])
  vocabularyIds: string[]; // Danh sách từ vựng HSK kết nối (e.g. ["学习", "学生", "大学"])
  exampleIds: string[]; // Danh sách câu bài khóa kết nối
  mnemonic?: string; // Câu thần chú ghi nhớ hình ảnh/ngữ nghĩa
}
```

---

## 3. Hệ thống Quy tắc Bút thuận & Bảng vẽ Điền Tự Cách (田字格)

Module `HanziView` (`src/components/modules/HanziView.tsx`) cung cấp trải nghiệm luyện viết trực quan:

1. **Hiển thị Thứ tự Nét:** Mỗi nét được gắn nhãn số, phân loại loại nét (Héng, Shù, Piě, Nà, Zhé, Diǎn) và tên gọi tiếng Việt chuẩn.
2. **Khung vẽ Lưới Ô chữ Điền (田字格 Canvas):**
   - Kích thước chuẩn 256x256 pixel.
   - Lớp bóng mờ chữ mẫu (Ghost Character Guide) màu xám nhạt nằm dưới nền giúp người học định vị trọng tâm nét chữ.
   - Bút vẽ độ phân giải cao hỗ trợ chuột trên Desktop và cảm ứng đa điểm chạm (`Touch Events`) trên thiết bị di động.
   - Nút "Xóa bảng" cho phép làm sạch bề mặt để thực hành nhiều lần.
3. **Phát âm Chuẩn:** Nút nghe gọi trực tiếp `audioManager.playText(char)` đảm bảo ngữ điệu đơn âm chuẩn `zh-CN`.
