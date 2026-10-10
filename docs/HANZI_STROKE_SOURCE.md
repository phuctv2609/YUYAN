# YUYAN — Đặc tả Kiến trúc Hoạt họa & Dữ liệu Nét bút Chữ Hán (Hanzi Stroke Order Architecture)

> **Dự án:** YUYAN (语言)  
> **Tài liệu:** Đặc tả Nguồn Dữ liệu & Công cụ Hoạt họa Bút thuận Hán tự (Hanzi Stroke Order Engine)  
> **Mã văn bản:** `DOC-HNZ-STR-007`  
> **Trạng thái:** Hoàn thiện (`PRODUCTION_READY`)  
> **Ngày cập nhật:** 04/10/2026  

---

## 1. Tổng quan & Mục tiêu Kỹ thuật

Trải nghiệm học chữ Hán trực quan tại YUYAN đòi hỏi không chỉ hiển thị glyph tĩnh mà người học phải:
1. **Quan sát chuẩn xác bút thuận (Stroke Order):** Chiều hướng bút vẽ, điểm bắt đầu và điểm kết thúc của từng nét.
2. **Điều khiển linh hoạt:** Phát toàn bộ hoạt họa, chuyển tiếp từng nét (Step-by-Step 1..N), chọn tốc độ hoạt họa (0.75x, 1x, 1.5x), bật/tắt nét mờ hướng dẫn.
3. **Thực hành viết tương tác (Interactive Quiz / Tracing Mode):** Người học tự vẽ trên màn hình bằng chuột hoặc cảm ứng ngón tay/bút stylus, nhận phản hồi ngay lập tức (đúng hướng nét, sai thứ tự nét, cảnh báo gợi ý sau 3 lần sai).
4. **Vận hành Ngoại tuyến (Zero-Dependency Offline Capable):** Toàn bộ dữ liệu nét của 1,059 chữ Hán độc lập trong hệ thống bài học HSK 1–6 được đóng gói nội bộ tại `public/data/strokes/*.json`, không bị phụ thuộc vào mạng internet hay lỗi chặn mạng quốc tế.

---

## 2. Nguồn Gốc Dữ liệu & Bản quyền

Dữ liệu nét bút được chuẩn hóa từ dự án mã nguồn mở **Make Me a Hanzi** (CC-BY-SA 4.0 / Arphic Public License) kết hợp với thư viện công nghiệp **HanziWriter** (`hanzi-writer` & `hanzi-writer-data`):

1. **Kho Dữ liệu Ngoại tuyến Nội bộ:**
   - Vị trí: `public/data/strokes/${encodeURIComponent(char)}.json`
   - Số lượng: **1,059 tệp JSON** (Bao phủ 100% toàn bộ ký tự trong 146 bài học HSK 1–6).
   - Tỷ lệ đáp ứng ngoại tuyến: **100%** (`Copied: 1059, Missing: 0`).
2. **Cơ chế Dự phòng Cấp hai (Secondary Fallback):**
   - Khi chạy trong môi trường kiểm thử hoặc với ký tự mở rộng ngoài 1,059 chữ HSK cốt lõi, bộ nạp dữ liệu tự động fallback sang jsDelivr CDN:
     `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(char)}.json`
3. **Giấy phép & Thuộc tính (Attribution):**
   - Lưu trữ tại: `data/hanzi-source/MAKEMEAHANZI_COPYING.txt`
   - Tham chiếu từ điển: `data/hanzi-source/makemeahanzi-dictionary.txt`

---

## 3. Kiến trúc Component `HanziStrokeWriter.tsx`

Được đặt tại `src/components/hanzi/HanziStrokeWriter.tsx`, component hỗ trợ:

```typescript
export interface HanziStrokeWriterProps {
  character: string;
  size?: number; // Mặc định: 260px (responsive cho cả Mobile & Desktop)
  className?: string;
  showControls?: boolean; // Mặc định: true
  onCompleteQuiz?: (summary: { totalMistakes: number }) => void;
  onStrokeChange?: (currentStroke: number, totalStrokes: number) => void;
}
```

### Các Chế độ Vận hành (Modes):

| Chế độ | Tên tiếng Việt | Tính năng chi tiết |
| :--- | :--- | :--- |
| `animate` | **Hoạt họa toàn bộ** | Phát video hoạt họa từng nét từ đầu đến cuối; điều chỉnh tốc độ 0.75x, 1x, 1.5x; bật/tắt nét mờ (outline) |
| `step` | **Từng nét một** | Duyệt chi tiết từng nét (`Nét K / N`), xem lại nét hiện tại, nút Next/Prev stroke kèm tên nét |
| `quiz` | **Tập viết tương tác** | Chế độ đồ nét thông minh, kiểm tra tọa độ và hướng vẽ thực tế, hiển thị số lỗi và thông báo chúc mừng |

---

## 4. Tích hợp trong Toàn bộ Nền tảng

Component `HanziStrokeWriter` được tích hợp vào các vị trí trọng yếu của YUYAN:

1. **Chi tiết Chữ Hán (`src/components/modules/HanziView.tsx`):**
   - Cung cấp tab chuyển đổi giữa "Hoạt họa & Luyện nét (HanziWriter)" và "Tự do viết (Canvas Điền Tự Cách)".
   - Giải quyết triệt để khuyết điểm hiển thị glyph tĩnh trước đây.
2. **Phòng Luyện viết Hán tự (`src/components/modules/WritingPracticeView.tsx`):**
   - Tích hợp bộ chuyển chế độ "Chuẩn hóa nét (HanziWriter)" và "Tự do viết (Canvas Mễ tự cách)".
   - Đồng bộ bảng chọn từ vựng mẫu và kiểm tra số nét chuẩn.
3. **Khả năng tương thích Giao diện Tối (Dark Mode Resilience):**
   - Tự động hiệu chỉnh màu nét bút: `#1D4ED8` (Light) sang `#60A5FA` (Dark).
   - Màu bộ thủ: `#0284C7` (Light) sang `#38BDF8` (Dark).
   - Màu lưới Mễ tự cách (米字格): Tọa độ SVG mờ tự thích ứng, triệt tiêu 100% vệt sáng chói trong chế độ ban đêm.
