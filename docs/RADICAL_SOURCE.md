# YUYAN — Đặc tả 214 Bộ thủ Khang Hy Chuẩn hóa (Kangxi Radicals Source)

> **Dự án:** YUYAN (语言)  
> **Tài liệu:** Thiết kế & Đặc tả Hệ thống 214 Bộ thủ Khang Hy  
> **Mã văn bản:** `DOC-RAD-007`  
> **Trạng thái:** Hoàn thiện (`PRODUCTION_READY`)

---

## 1. Tầm quan trọng của Bộ thủ Khang Hy trong YUYAN

Bộ thủ Khang Hy (康熙部首) là hệ thống phân loại 214 bộ thủ được chuẩn hóa từ thế kỷ 18, là chìa khóa vàng giúp người học hiểu được bản chất biểu ý (Ideographic) và biểu âm (Phonetic) của chữ Hán.

Tại YUYAN, bộ dữ liệu 214 bộ thủ được biên soạn trọn vẹn tại `src/data/radicals/kangxi214.ts`, không thiếu bất kỳ bộ thủ nào (độ phủ 100%).

---

## 2. Cấu trúc Mô hình `CanonicalRadical`

```typescript
export interface CanonicalRadical {
  id: string; // Mã định danh chuẩn: radical_001 .. radical_214
  char: string; // Ký tự bộ thủ nguyên bản (e.g. "水", "人", "手")
  radicalNumber: number; // Số thứ tự Khang Hy từ 1 đến 214
  nameZh: string; // Tên gọi tiếng Trung (e.g. "水字旁", "单人旁")
  nameVi: string; // Tên gọi Hán Việt chuẩn (e.g. "Thủy", "Nhân", "Thủ")
  meaning: string; // Ý nghĩa biểu đạt (e.g. "Nước, chất lỏng", "Con người")
  strokeCount: number; // Số nét của bộ thủ (1 đến 17 nét)
  variants: string[]; // Các dạng biến thể khi ghép chữ (e.g. ["氵"] của "水", ["亻"] của "人")
  semanticCategory: string; // Nhóm ý nghĩa: Con người, Tự nhiên, Động vật, Đồ vật, v.v.
  mnemonic: string; // Câu thần chú ghi nhớ hình tượng
  characterIds: string[]; // Các chữ Hán trong HSK thuộc bộ thủ này
  vocabularyIds: string[]; // Các từ vựng HSK tiêu biểu liên quan
}
```

---

## 3. Phân loại Ý nghĩa & Phân bố Số nét (1 đến 17 Nét)

### 3.1. Phân bố theo số lượng nét:
- **1 nét (Bộ 1 – 6):** 一, 丨, 丶, 丿, 乙, 亅 (Nét căn bản).
- **2 nét (Bộ 7 – 29):** 二, 人, 儿, 入, 八, 冂, 冖, 冫, 几, 凵, 刀, 力, 勹, 匕, 匚, 匸, 十, 卜, 卩, 厂, 厶, 又.
- **3 nét (Bộ 30 – 60):** 口, 囗, 土, 士, 夂, 夊, 夕, 大, 女, 子, 宀, 寸, 小, 尢, 尸, 屮, 山, 巛, 工, 己, 巾, 干, 幺, 广, 廴, 廾, 弋, 弓, 彐, 彡, 彳.
- **4 nét (Bộ 61 – 94):** 心, 戈, 戶, 手, 支, 攴, 文, 斗, 斤, 方, 无, 日, 曰, 月, 木, 欠, 止, 歹, 殳, 毋, 比, 毛, 氏, 气, 水, 火, 爪, 父, 爻, 爿, 片, 牙, 牛, 犬.
- ...
- **17 nét (Bộ 214):** 龠 (Nhạc cụ cổ).

### 3.2. Nhóm phân loại ý nghĩa (Semantic Categories):
1. **Con người & Hành vi:** Nhân (人/亻), Nữ (女), Tử (子), Thủ (手/扌), Tâm (心/忄), Khẩu (口), Mục (目), Túc (足).
2. **Tự nhiên & Vũ trụ:** Nhật (日), Nguyệt (月), Thủy (水/氵), Hỏa (火/灬), Thổ (土), Kim (金/钅), Mộc (木).
3. **Động vật & Sinh vật:** Điểu (鸟), Ngư (鱼), Khuyển (犬/犭), Ngưu (牛/牜), Trùng (虫), Mã (马).
4. **Vật dụng, Công cụ, Nơi chốn:** Đao (刀/刂), Môn (门), Thực (食/饣), Xa (车), Cung (弓), Y (衣/衤).

---

## 4. Tương tác Người dùng trong `RadicalView`

- **Bộ lọc kép:** Người dùng có thể lọc tức thì theo cả số nét (1–17) hoặc theo nhóm ý nghĩa chỉ bằng một cú nhấp.
- **Tìm kiếm thông minh:** Tìm bằng ký tự, biến thể (`氵`), số thứ tự (`85`), tên Hán Việt (`Thủy`), hoặc nghĩa (`nước`).
- **Modal chi tiết đa liên kết:** Xem giải thích chi tiết, phát âm bộ thủ, và danh sách các chữ Hán HSK liên quan. Nhấp vào chữ Hán sẽ chuyển ngay sang màn hình `HanziView`.
