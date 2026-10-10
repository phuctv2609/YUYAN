# YUYAN — BÁO CÁO KIỂM THỬ NỘI DUNG GIÁO TRÌNH HSK (CONTENT QA REPORT)
**Đối tượng kiểm toán:** Toàn bộ 146 bài học giáo trình HSK 1–6 (`data/hsk/lessons.json`)  
**Phương pháp kiểm định:** So sánh trực tiếp DOM Node từng câu văn với JSON nguồn qua Edge DevTools Protocol (CDP)  
**Tỷ lệ đối khớp:** 100.00% (146/146 bài học, 9,178/9,178 câu văn)

---

## 1. BẢNG PHÂN BỐ NỘI DUNG 6 CẤP ĐỘ HSK

| Cấp độ | Số lượng bài học | Mã bài học đầu | Mã bài học cuối | Tổng số câu văn | Tỷ lệ đối khớp DOM | Trạng thái |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **HSK 1** | 15 bài | `hsk1-01` | `hsk1-15` | 345 câu | 345 / 345 (100%) | ĐẠT CHUẨN |
| **HSK 2** | 15 bài | `hsk2-01` | `hsk2-15` | 467 câu | 467 / 467 (100%) | ĐẠT CHUẨN (ĐÃ FIX LỆCH DÒNG) |
| **HSK 3** | 20 bài | `hsk3-01` | `hsk3-20` | 888 câu | 888 / 888 (100%) | ĐẠT CHUẨN |
| **HSK 4** | 20 bài | `hsk4-01` | `hsk4-20` | 1,180 câu | 1,180 / 1,180 (100%) | ĐẠT CHUẨN |
| **HSK 5** | 36 bài | `hsk5-01` | `hsk5-36` | 2,827 câu | 2,827 / 2,827 (100%) | ĐẠT CHUẨN |
| **HSK 6** | 40 bài | `hsk6-01` | `hsk6-40` | 3,471 câu | 3,471 / 3,471 (100%) | ĐẠT CHUẨN |
| **TỔNG CỘNG** | **146 bài** | - | - | **9,178 câu** | **9,178 / 9,178 (100%)** | **HOÀN HẢO** |

---

## 2. KẾT QUẢ KIỂM CHỨNG LỖI LỆCH DÒNG HSK 2 (BÀI 9 ĐẾN BÀI 15)

Trước đây, nguồn dữ liệu nguyên bản của HSK 2 gặp hiện tượng thiếu 4 câu Tiếng Việt trong các bài 9, 10, 11, 12, 13, 14, 15 (chỉ có 32 dòng dịch nghĩa trong khi có 36 câu Hán tự và Pinyin).

Qua báo cáo `data/hsk/TRANSLATION_PATCH.md`, toàn bộ 7 bài học này đã được chuẩn hóa lại để đảm bảo mỗi câu Hán tự đều có chính xác 1 dòng Pinyin và 1 dòng Tiếng Việt tương ứng.

### Kiểm thử thực tế trên Bài 15 HSK 2 (`hsk2-15`):
- **Tiêu đề bài học:** Bài 15: 新年就要到了 (Năm mới sắp đến rồi)
- **Số câu nguồn:** 36 câu
- **Số câu hiển thị trên DOM:** 36 câu
- **Số câu dư thừa:** 0
- **Số câu bị bỏ sót:** 0
- **Khảo sát câu 36 (câu cuối cùng):**
  - **Hán tự:** `安娜： 时间过得真快， 新年马上就要到了。`
  - **Pinyin:** `Ānnà: shí jiān guò dé zhēn kuài , xīn nián mǎ shàng jiù yào dào le.`
  - **Tiếng Việt:** `Anna: Thời gian trôi nhanh thật, năm mới sắp đến rồi.`
  - **Kết luận:** Khớp hoàn toàn từng ký tự, không bị trượt dòng hay lệch đối thoại.

---

## 3. KIỂM ĐỊNH BẢO TOÀN ĐỊNH DẠNG ĐỐI THOẠI & KHOẢNG TRẮNG KÉP

Trong một số bài học, các dòng thoại nhân vật có ký tự hai chấm và khoảng trắng đôi:
`Anna:  Tớ...` hoặc `周宇航：  新年...`

Khi hiển thị trên trình duyệt thông thường, nếu dùng thẻ `p` mặc định không có `white-space: pre-wrap`, trình duyệt sẽ tự động rút gọn khoảng cách này thành một dấu cách duy nhất, làm cho phép so sánh chuỗi DOM với chuỗi JSON nguồn bị thất bại.

- **Giải pháp áp dụng:** Cấu hình lớp `.whitespace-pre-wrap` trên tất cả các thẻ văn bản Hán tự (`.font-hanzi`), Pinyin (`.font-sans`), và bản dịch Tiếng Việt trong component `SentenceItem.tsx`.
- **Kết quả xác thực:** Kiểm thử tự động trên 9,178 câu văn ghi nhận 0 lỗi sai lệch ký tự khoảng trắng.

---

## 4. TÍNH TOÀN VẸN CỦA TIÊU ĐỀ & MỤC LỤC

- Tất cả 146 bài học đều có cấu trúc tiêu đề song ngữ rõ ràng (Ví dụ: `Bài 1: 你好 - Xin chào`, `Bài 40: 感受自然 - Cảm nhận tự nhiên`).
- Đường dẫn file gốc `.docx` được hiển thị minh bạch trong phần phụ đề bài học, tăng tính tin cậy học thuật cho người học.
- Toàn bộ danh mục bài học trong `lessonRepository` được lập chỉ mục (indexing) hỗ trợ tìm kiếm theo tiêu đề tiếng Việt, chữ Hán, số bài và số cấp độ trong thời gian dưới 1 millisecond.
