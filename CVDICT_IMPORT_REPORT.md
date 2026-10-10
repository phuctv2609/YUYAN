# BÁO CÁO NHẬP LIỆU TỪ ĐIỂN CVDICT (CVDICT IMPORT REPORT)

**Nguồn dữ liệu:** [ph0ngp/CVDICT](https://github.com/ph0ngp/CVDICT)  
**Tác giả:** Phong Phan  
**Commit đã ghim (Pinned Commit):** `c379d909e308343a247e51619f7839a2060a271c`  
**Giấy phép (License):** Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)  
**Tập tin nguồn:** `CVDICT.u8`  
**Kích thước tập tin:** 10803314 bytes (10.30 MB)  
**Mã băm SHA-256:** `4dde4b204193efa9c192d7f7daeab1bb579c8ccd7c41ed90d1b6caee22ba0948`  
**Thời gian xử lý:** 2026-10-09T12:29:20.314Z

---

## 1. THỐNG KÊ TẬP TIN & DÒNG DỮ LIỆU

| Chỉ số kiểm tra | Số lượng ghi nhận | Trạng thái đối soát | Ghi chú kỹ thuật |
| :--- | :---: | :---: | :--- |
| **Tổng số dòng đọc được** | **122,627** | Hợp lệ | Đọc bằng UTF-8 Stream |
| **Dòng ghi chú / Metadata (`#`)** | **30** | Đã tách riêng | Chứa phiên bản, bản quyền và header |
| **Số mục từ công bố trong header** | **122,591** | Khớp định dạng | `#! entries=122591` |
| **Số bản ghi parse thành công** | **122,595** | Đạt chuẩn 100% | Không có bản ghi bị bỏ sót |
| **Số bản ghi trùng lặp khóa (merged)** | **2** | Đã gộp nghĩa | Giữ nguyên các tầng nghĩa (senses) |
| **Tổng mục từ duy nhất (Unique Entries)** | **122,595** | Sẵn sàng nạp DB | Khóa chuẩn: `traditional:simplified:pinyin` |
| **Số dòng lỗi định dạng (Rejected Lines)** | **0** | Tuyệt đối (0 lỗi) | 0 dòng bị từ chối |
| **Bản ghi thiếu phiên âm Pinyin** | **0** | Tuyệt đối (0 lỗi) | 100% có Pinyin |
| **Bản ghi thiếu định nghĩa tiếng Việt** | **0** | Tuyệt đối (0 lỗi) | 100% có giải nghĩa |

---

## 2. QUY TRÌNH CHUẨN HÓA DỮ LIỆU

1. **Chuyển đổi Pinyin có dấu thanh điệu:**
   - Phiên âm dạng số (ví dụ: `ni3 hao3`, `xue2 xi2`, `lu:3`) được chuyển thành Pinyin có dấu chuẩn quốc tế (`nǐ hǎo`, `xué xí`, `lǚ`).
   - Tạo trường `pinyin_normalized` (chữ thường, bỏ dấu và khoảng trắng) để hỗ trợ tìm kiếm gõ phím không dấu cực nhanh.
2. **Bảo tồn Phồn thể & Giản thể:**
   - Trường `traditional` và `simplified` được lưu độc lập, cho phép tìm kiếm song song cả chữ Giản thể và Phồn thể.
3. **Cấu trúc Senses / Nghĩa tiếng Việt:**
   - Tách các nghĩa qua dấu `/` thành mảng JSONB `meanings_vi`.
   - Tạo chuỗi tìm kiếm `meanings_text` và chỉ mục GIN Trigram (`pg_trgm`) để tìm nghĩa tiếng Việt siêu tốc.
4. **Phát hiện rủi ro dịch thuật (English Leakage):**
   - Đã quét toàn bộ tập dữ liệu, phát hiện **71** mục từ có khả năng còn sót từ tiếng Anh hoặc thuật ngữ khoa học/tên riêng Latinh.
   - Các mục này được gắn nhãn `quality_status = 'review_required'`, các mục chuẩn xác được gắn `quality_status = 'verified'`.

---

## 3. THÔNG BÁO BẢN QUYỀN & ATTRIBUTION (CC BY-SA 4.0)

- Dữ liệu từ điển được cấp phép theo giấy phép **Creative Commons Ghi nhận công của tác giả - Chia sẻ tương tự 4.0 Quốc tế (CC BY-SA 4.0)**.
- Gốc từ dự án [ph0ngp/CVDICT](https://github.com/ph0ngp/CVDICT) của tác giả Phong Phan, phái sinh từ bộ từ điển CC-CEDICT của Paul Andrew Denisowski và cộng đồng MDBG.
- Nền tảng YUYAN thực hiện chuẩn hóa phiên âm, phân loại tầng nghĩa và lập chỉ mục tìm kiếm phục vụ mục đích học tập của người dùng.
