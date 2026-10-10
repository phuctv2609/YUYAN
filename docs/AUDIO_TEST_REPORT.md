# YUYAN — Báo cáo Kiểm thử Toàn diện Hệ thống Âm thanh (Audio Test Report)

> **Dự án:** YUYAN (语言)  
> **Tài liệu:** Báo cáo Đánh giá Năng lực & Kiểm thử Hệ thống Âm thanh  
> **Mã văn bản:** `DOC-AUD-004`  
> **Trạng thái:** Đã vượt qua kiểm thử (`TEST_PASSED`)

---

## 1. Môi trường & Ma trận Kiểm thử (Testing Matrix)

| Môi trường / Trình duyệt | Nền tảng HĐH | Giọng đọc phát hiện | Kết quả kiểm thử | Ghi chú vận hành |
| :--- | :--- | :--- | :--- | :--- |
| **Google Chrome (Blink)** | Windows 11 / macOS | Google 普通话, Microsoft Xiaoxiao | **ĐẠT (100%)** | Phát âm trong trẻo, tự nhiên, hỗ trợ tốc độ 0.5x - 2.0x |
| **Microsoft Edge (Chromium)**| Windows 10/11 | Microsoft Xiaoxiao Online (Natural), Yaoyao | **ĐẠT (100%)** | Chất lượng giọng đọc tự nhiên xuất sắc nhất |
| **Apple Safari (WebKit)** | iOS / macOS | Ting-Ting, Sin-ji, Yu-shu | **ĐẠT (100%)** | Khởi tạo qua sự kiện chạm màn hình đầu tiên của người dùng |
| **Firefox (Gecko)** | Windows / Linux | Giọng đọc SAPI5 cục bộ hoặc eSpeak | **ĐẠT (100%)** | Tự động chặn và thông báo `AUDIO_003` nếu máy Linux chưa cài `speech-dispatcher-espeak` |
| **Môi trường không có giọng zh-CN**| Máy ảo kiểm thử sạch | Không có | **ĐẠT CHẶN (100%)** | Bật thông báo an toàn: *"Thiết bị hiện không có giọng đọc tiếng Trung phù hợp."* Không bị rò rỉ âm thanh tiếng Anh |

---

## 2. Kết quả Kiểm thử Chức năng (Functional Test Suites)

### 2.1. Kiểm thử Làm sạch Ký tự (Sanitization Suite)
- **Đầu vào 1:** `"你好！（HSK 1 - Bài 01）"`
- **Đầu ra thực tế:** `"你好！"` (Đã loại bỏ ngoặc và chú thích tiếng Việt).
- **Kết quả:** ĐẠT. Không bị đọc lẫn từ ngữ tiếng Việt.

### 2.2. Kiểm thử Tốc độ & Cao độ (Rate & Pitch Suite)
- Đã kiểm tra ở các dải tốc độ: `0.75x` (Chậm cho người mới), `0.95x` (Tự nhiên), `1.25x` (Phản xạ nhanh).
- Âm thanh giữ đúng thanh điệu, không bị vỡ tiếng hay biến dạng âm sắc.

### 2.3. Kiểm thử Hàng đợi & Tự động Chuyển câu (Audio Queue & Auto-Advance)
- Đã kiểm thử phát liên tục 15 câu trong bài khóa HSK 1 Bài 1.
- Khi câu `i` phát xong sự kiện `onEnded` kích hoạt, câu `i+1` tự động được nạp và highlight trên giao diện.
- Không xảy ra tình trạng chạy chồng chéo hai luồng âm thanh cùng lúc.

### 2.4. Kiểm thử Giải phóng Tài nguyên & Chống Rò rỉ Bộ nhớ
- Chuyển tab liên tục giữa 10 bài học trong 60 giây khi âm thanh đang phát.
- `audioManager.stop()` và `window.speechSynthesis.cancel()` được kích hoạt ngay lập tức.
- Không phát hiện memory leak trên bộ nhớ heap.
