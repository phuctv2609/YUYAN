# YUYAN — Tài liệu Giới hạn Kỹ thuật & Phụ thuộc Ngoại vi (Known Limitations)

Tài liệu này xác định các giới hạn kỹ thuật hiện tại, phụ thuộc môi trường chạy (runtime dependencies), và các hành vi dự phòng (fallback behaviors) của nền tảng học tiếng Trung YUYAN.

---

## 1. Hệ thống Âm thanh & Phát âm (Speech Synthesis / Web Speech API)

### 1.1 Khả dụng của giọng đọc tiếng Trung (Mandarin Chinese / `zh-CN`)
- **Phụ thuộc:** Web Speech API (`window.speechSynthesis`) phụ thuộc hoàn toàn vào hệ điều hành (Windows, macOS, iOS, Android) và trình duyệt (Chrome, Edge, Safari, Firefox).
- **Hành vi kiểm tra:**
  - `audioManager` thực hiện quét các giọng đọc có mã ngôn ngữ `zh-CN`, `zh-TW`, `zh-HK` hoặc `zh`.
  - Nếu hệ thống hoặc trình duyệt không cài đặt gói ngôn ngữ tiếng Trung, `audioManager` chủ động kích hoạt mã lỗi `AUDIO-002` ("Không tìm thấy giọng đọc tiếng Trung chuẩn trên thiết bị").
  - **Quy tắc bất biến:** YUYAN **tuyệt đối không dự phòng** sang các giọng đọc tiếng Anh hoặc tiếng Việt để đọc văn bản tiếng Trung, tránh sai lệch phát âm nghiêm trọng cho người học.
- **Khuyến nghị người dùng:**
  - Trên Windows: Cài đặt gói ngôn ngữ "Chinese (Simplified, China)" trong Settings > Time & Language > Speech.
  - Trên trình duyệt: Sử dụng Google Chrome hoặc Microsoft Edge (Edge cung cấp Microsoft Natural Voices như Xiaoxiao, Yunxi với chất lượng tự nhiên cao).

### 1.2 Nhận dạng giọng nói (Speech Recognition / STT) & Ghi âm (MediaRecorder)
- **Quyền riêng tư & bảo mật:** Yêu cầu quyền truy cập Micro (`getUserMedia`) từ người dùng. Trình duyệt chỉ cho phép cấp quyền trên giao thức bảo mật `https://` hoặc `localhost` / `127.0.0.1`.
- **Đánh giá phát âm thực tế:**
  - Chức năng Luyện nói sử dụng Web MediaRecorder thu âm giọng người học trực tiếp để nghe lại và đối chiếu với giọng chuẩn Bắc Kinh.
  - Web Speech API SpeechRecognition (nếu có trên Chrome) hỗ trợ so khớp từ khóa. Khi trình duyệt không hỗ trợ Web Speech Recognition API (ví dụ Firefox hoặc một số phiên bản iOS Safari), hệ thống ghi nhận bản thu âm thực và cung cấp phát âm chuẩn để tự đối chiếu, **không tạo điểm số ảo ngẫu nhiên**.

---

## 2. Lưu trữ Dữ liệu Cục bộ & Đồng bộ (Persistence & Storage)

### 2.1 Hạn mức LocalStorage
- **Cơ chế lưu trữ:** Tiến trình học tập, danh sách lỗi sai, sổ tay ghi chú, lịch sử luyện tập, và thông tin `StudentProfile` được lưu trữ tại `localStorage`.
- **Hạn mức dung lượng:** Hầu hết các trình duyệt cấp hạn mức từ 5MB - 10MB cho mỗi origin.
- **Tối ưu hóa:**
  - Toàn bộ 146 bài học HSK, 9.178 câu hội thoại, 8.456 từ vựng, 146 đoạn văn đọc hiểu, 214 bộ thủ Khang Hy, và 1.059 chữ Hán chuẩn được đóng gói tĩnh trong ứng dụng (bundled static assets), **không chiếm dụng dung lượng `localStorage`**.
  - `localStorage` chỉ lưu trữ ID bài học đã hoàn thành, mốc thời gian, ghi chú cá nhân, và hồ sơ người học dạng JSON tinh gọn (< 500 KB).

### 2.2 Đồng bộ Đa thiết bị
- Phiên bản hiện tại là kiến trúc Client-First (SPA). Dữ liệu tiến độ được lưu trên trình duyệt của thiết bị hiện tại.
- Để chuyển đổi thiết bị mà không mất tiến trình, người học có thể sử dụng cấu trúc kho dữ liệu `learnerRepository` (sẵn sàng kết nối REST/GraphQL Backend hoặc Cloud Database khi nâng cấp hạ tầng cloud).

---

## 3. Khả năng Hiển thị & Kiểu chữ Chữ Hán (Hanzi & Pinyin Typography)

### 3.1 Phông chữ chữ Hán
- Ứng dụng tích hợp cấu hình phông chữ có thứ tự ưu tiên:
  `font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', 'SimHei', sans-serif;`
- Đảm bảo hiển thị chuẩn xác các nét chữ giản thể hiện đại. Trên các thiết bị cũ không có sẵn phông chữ tiếng Trung, giao diện ưu tiên tải Google Fonts (Noto Sans SC) hoặc phông hệ thống dự phòng.

### 3.2 Luyện viết chữ Hán (Hanzi Writing Practice)
- Mô-đun Luyện viết hiện tại cung cấp bảng vẽ HTML5 Canvas đa điểm chạm (touch/mouse), lưới Mễ tự (米字格) chuẩn sư phạm, điều chỉnh độ đậm nét bút và màu sắc tương thích hoàn toàn theo chủ đề Sáng/Tối.
- Bảng vẽ mô phỏng nét viết tự do; việc tự động chấm điểm từng nét theo chuẩn vector (SVG stroke-order animated tracing) sẽ được tích hợp chuyên sâu thông qua thư viện HanziWriter ở các gói cập nhật nâng cao.

---

## 4. Hiệu năng & Đóng gói Ứng dụng (Bundle Size & Code Splitting)

- Bundle JavaScript hiện tại (~16 MB uncompressed, ~2.8 MB gzip) tích hợp toàn bộ kho dữ liệu HSK 1–6, từ điển, bộ thủ và bài học để đảm bảo tốc độ phản hồi tức thì (zero-latency navigation) không cần chờ đợi mạng.
- Khi triển khai môi trường sản xuất băng thông thấp, kiến trúc mã nguồn đã được tổ chức phân lớp sẵn sàng cho tính năng Dynamic Code Splitting (`React.lazy()` và `import()`) theo từng cấp độ HSK.
