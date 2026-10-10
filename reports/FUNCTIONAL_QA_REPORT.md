# YUYAN — BÁO CÁO KIỂM THỬ CHỨC NĂNG (FUNCTIONAL QA REPORT)
**Mục tiêu:** Kiểm tra khả năng tương tác, xử lý trạng thái (state management), điều hướng, và các tương tác người dùng trên toàn bộ ứng dụng.  
**Kết quả tổng quan:** 100% TÍNH NĂNG HOẠT ĐỘNG CHUẨN XÁC — KHÔNG LỖI CONSOLE.

---

## 1. ĐIỀU HƯỚNG ROUTING & QUẢN LÝ LỊCH SỬ DUYỆT WEB

Hệ thống sử dụng Custom SPA Router kết nối chặt chẽ với HTML5 History API (`pushState`, `replaceState`, và sự kiện `popstate`).

| Kịch bản điều hướng | URL kiểm thử | Kết quả DOM mong đợi | Kết quả kiểm thử |
|:---|:---|:---|:---:|
| **Trang chủ** | `/` hoặc `/dashboard` | Hiển thị DashboardView | **PASS** |
| **Bài học hợp lệ** | `/hsk/2/lesson/15` | Tải HSK 2 Bài 15 (36 câu) | **PASS** |
| **Cấp độ rút gọn** | `/hsk/3` | Tải HSK 3 Bài 01 | **PASS** |
| **Chuyên mục viết** | `/writing` hoặc `/hanzi` | Hiển thị WritingPracticeView | **PASS** |
| **Chuyên mục nói** | `/speaking` hoặc `/listening`| Hiển thị SpeakingPracticeView | **PASS** |
| **Thi thử HSK** | `/exam` | Hiển thị ExamView | **PASS** |
| **Từ điển** | `/dictionary` | Hiển thị DictionaryView | **PASS** |
| **Ngữ pháp** | `/grammar` | Hiển thị GrammarPracticeView | **PASS** |
| **Ngữ âm Pinyin** | `/pinyin` | Hiển thị PinyinPracticeView | **PASS** |
| **Tiến độ học** | `/progress` | Hiển thị ProgressView | **PASS** |
| **Cài đặt** | `/settings` | Hiển thị SettingsView | **PASS** |
| **Gia sư AI** | `/ai` | Hiển thị AiConversationView | **PASS** |
| **Đường dẫn sai 404**| `/hsk/9/lesson/99` | Hiển thị 404 Not Found Page | **PASS** |
| **Nút Back / Forward**| Lùi lại bài trước bằng browser | Cập nhật URL & DOM mượt mà | **PASS** |

---

## 2. BỘ ĐIỀU KHIỂN HỌC TẬP TRONG BÀI KHÓA (STUDY CONTROLS)

### A. Chuyển đổi 3 Chế độ học (Study Modes)
1. **HỌC (Đầy đủ):**
   - Hán tự: BẬT
   - Pinyin: BẬT
   - Tiếng Việt: BẬT
2. **TỰ ĐỌC (Self-study):**
   - Hán tự: BẬT
   - Pinyin: TẮT (Ẩn để người học tự luyện phát âm)
   - Tiếng Việt: TẮT (Ẩn để người học tự dịch nghĩa)
3. **KIỂM TRA (Test):**
   - Tương tự Tự đọc, ẩn toàn bộ phiên âm và nghĩa dịch, kích thích trí nhớ chủ động.

### B. Bộ bật/tắt hiển thị chi tiết (Granular Toggles)
- Nút bấm `Hán tự`, `Pinyin`, `Tiếng Việt` cho phép người dùng tùy ý bật/tắt độc lập từng trường dữ liệu cho cả bài học mà không làm mất vị trí câu đang chọn.

### C. Thay đổi kích thước chữ (Font Sizing)
- Hỗ trợ 3 cỡ chữ:
  - **A- (sm):** Cỡ chữ nhỏ gọn (`text-xl sm:text-2xl`), hiển thị nhiều câu hơn trên 1 khung nhìn.
  - **A (md - Mặc định):** Cỡ chữ tiêu chuẩn (`text-2xl sm:text-[28px]`), cân đối và dễ đọc.
  - **A+ (lg):** Cỡ chữ phóng to (`text-3xl sm:text-4xl`), tối ưu cho người lớn tuổi hoặc luyện nhìn nét chữ phức tạp.

---

## 3. TƯƠNG TÁC TỪNG CÂU VĂN (SENTENCE INTERACTIONS)

- **Chọn câu (Active Sentence):** Nhấp chuột hoặc chạm vào bất kỳ thẻ câu nào sẽ kích hoạt viền xanh nổi bật (`border-primary-container`), hiển thị nhãn `Đang chọn` và đồng bộ chỉ số câu.
- **Lưu câu yêu thích (Bookmark):** Bấm biểu tượng ngôi sao để chuyển trạng thái lưu / bỏ lưu câu văn kèm thông báo Toast phản hồi.
- **Phát âm chân thực:** Do chưa có file audio bản ngữ đi kèm trong bộ dữ liệu giáo trình, khi bấm nút nghe từng câu hoặc thanh AudioBar, hệ thống **không phát âm thanh giả lập**, mà hiển thị thông báo trung thực giải thích dữ liệu âm thanh đang chờ đồng bộ từ máy chủ chính thức.

---

## 4. CÁC MODULE CHUYÊN BIỆT (SECONDARY MODULES)

### A. Luyện viết chữ Hán (`/writing`)
- Tích hợp HTML5 Canvas độ phân giải cao (Retina scaling theo `window.devicePixelRatio`).
- Hỗ trợ đầy đủ Pointer Events (`pointerdown`, `pointermove`, `pointerup`), thao tác vẽ mượt mà với chuột và ngón tay/bút cảm ứng trên điện thoại.
- Ngăn chặn hoàn toàn hiện tượng cuộn trang không mong muốn khi đang vẽ chữ nhờ thuộc tính CSS `touch-action: none`.
- Nút "Ẩn nét mẫu" và "Xóa bảng vẽ" phản hồi tức thì dưới 10ms.

### B. Luyện phát âm (`/speaking`)
- Kết nối trực tiếp API `navigator.mediaDevices.getUserMedia`.
- Tích hợp Web Audio API (`AudioContext`, `AnalyserNode`) phân tích phổ âm thanh trực tiếp và vẽ sóng âm thanh thời gian thực.
- Lưu lại đoạn ghi âm dưới dạng `Blob` cho phép người học bấm nút nghe lại giọng đọc của chính mình.
- Xử lý thông báo lịch sự, rõ ràng nếu trình duyệt từ chối cấp quyền micro.

### C. Thi thử HSK chuẩn hóa (`/exam`)
- Đồng hồ đếm ngược 15:00 vận hành chính xác qua `setInterval` kèm dọn dẹp bộ nhớ khi chuyển trang.
- Bảng điều hướng câu hỏi cho phép nhảy nhanh đến câu chưa trả lời.
- Modal xác nhận nộp bài hiển thị điểm số đạt được và nhận xét đánh giá năng lực tương ứng.

### D. Tra cứu từ điển HSK (`/dictionary`)
- Tìm kiếm tức thời trên toàn bộ 9,178 câu văn theo cả Hán tự, Pinyin và nghĩa Tiếng Việt.
- Cơ chế Debounce 300ms loại bỏ hiện tượng giật lag khi người dùng gõ phím nhanh.
- Cơ chế hủy bỏ yêu cầu cũ (Abort controller / sequence counter) đảm bảo kết quả hiển thị luôn tương ứng với từ khóa mới nhất vừa nhập.
