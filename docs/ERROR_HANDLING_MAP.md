# YUYAN — Bản đồ Ma trận Xử lý Lỗi Toàn diện (Error Handling Map)

> **Dự án:** YUYAN (语言)  
> **Tài liệu:** Ma trận Xử lý Ngoại lệ, Phục hồi Lỗi & Giao diện Người dùng  
> **Mã văn bản:** `DOC-ERR-012`  
> **Trạng thái:** Hoàn thiện (`PRODUCTION_READY`)

---

## 1. Ma trận Mã Lỗi Hệ thống Âm thanh (Audio Subsystem Error Matrix)

Được định nghĩa tại `src/services/audio/audioErrors.ts`:

| Mã lỗi | Tên định danh | Nguyên nhân gốc rễ | Thông báo thân thiện tiếng Việt | Hành động phục hồi tự động |
| :--- | :--- | :--- | :--- | :--- |
| `AUDIO_001` | `INVALID_PAYLOAD` | Văn bản phát âm rỗng hoặc metadata không hợp lệ | "Dữ liệu âm thanh yêu cầu không hợp lệ hoặc để trống." | Bỏ qua yêu cầu, không làm gián đoạn bài học |
| `AUDIO_002` | `SPEECH_SYNTHESIS_UNSUPPORTED`| Trình duyệt không hỗ trợ Web Speech API | "Trình duyệt của bạn không hỗ trợ tính năng phát âm thanh tự động." | Đề xuất cập nhật trình duyệt Chrome/Edge |
| `AUDIO_003` | `NO_CHINESE_VOICE` | Thiết bị không có gói giọng đọc tiếng Trung `zh-CN` | "Thiết bị hiện không có giọng đọc tiếng Trung phù hợp." | Hướng dẫn cài gói giọng đọc Trung Quốc trong cài đặt hệ điều hành; **chặn tuyệt đối việc phát giọng tiếng Anh/Việt** |
| `AUDIO_004` | `PLAYBACK_FAILED` | Phần tử Audio gặp lỗi giải mã hoặc không phát được | "Không thể phát âm thanh. Vui lòng thử lại." | Giải phóng tài nguyên, thử lại một lần nữa |
| `AUDIO_005` | `TTS_GENERATION_FAILED` | Lỗi nội bộ trong quá trình `speechSynthesis.speak()` | "Quá trình tạo âm thanh phát sinh lỗi." | Dừng luồng phát âm, thiết lập trạng thái về `idle` |
| `AUDIO_006` | `AUDIO_ELEMENT_ERROR` | Lỗi phần tử HTMLAudioElement (file bị lỗi/không tồn tại) | "Tập tin âm thanh không thể tải hoặc bị hỏng." | Báo lỗi và ghi nhật ký debug |
| `AUDIO_007` | `AUTOPLAY_BLOCKED` | Trình duyệt chặn tự động phát âm khi chưa có tương tác | "Trình duyệt chặn tự động phát âm. Vui lòng bấm vào màn hình." | Chờ tương tác chạm/nhấp của người dùng |
| `AUDIO_008` | `NETWORK_ERROR` | Mất kết nối internet khi dùng dịch vụ âm thanh đám mây | "Lỗi kết nối mạng khi tải âm thanh." | Chuyển mạch sang bộ TTS cục bộ trên thiết bị |
| `AUDIO_009` | `PERMISSION_DENIED` | Người dùng từ chối quyền micro khi luyện nói | "Chưa được cấp quyền sử dụng microphone để ghi âm." | Hiển thị hướng dẫn mở quyền micro trên thanh địa chỉ |
| `AUDIO_010` | `TIMEOUT` | Yêu cầu phát âm vượt quá 10 giây mà không phản hồi | "Yêu cầu phát âm đã hết thời gian chờ." | Hủy bỏ luồng phát hiện tại và khôi phục giao diện |

---

## 2. Xử lý Lỗi Tầng Dữ liệu & Lưu trữ (Data & Storage Recovery)

### 2.1. Phục hồi Lỗi `localStorage` Bị Hỏng (Corrupted LocalStorage Recovery)
- **Tình huống:** Dữ liệu lưu trong trình duyệt bị chỉnh sửa hoặc chứa chuỗi JSON dị tật.
- **Giải pháp:** Trong `App.tsx`, `learnerRepository.ts`, `progressRepository.ts`, mọi lệnh `JSON.parse()` đều được bọc trong `try/catch`. Khi phát hiện lỗi:
  1. Ghi log cảnh báo `console.warn`.
  2. Xóa khóa bị hỏng `localStorage.removeItem(KEY)`.
  3. Khởi tạo lại với giá trị mặc định chuẩn an toàn.

### 2.2. Xử lý Lỗi Đường dẫn 404 & Bài học Không Tồn tại (Friendly 404 Routing)
- **Tình huống:** Người dùng truy cập đường dẫn không có thật, ví dụ `/hsk/7/lesson/99` hoặc `/unknown-module`.
- **Giải pháp:** Giao diện điều hướng thông minh hiển thị trang thông báo thân thiện:
  - Thông báo: *"Không tìm thấy trang: Đường dẫn bài học hoặc chuyên mục không tồn tại trong hệ thống giáo trình HSK 1–6."*
  - Cung cấp hai nút giải cứu: **Về Trang chủ** và **Học HSK 1 Bài 01**.

---

## 3. Khung Bảo vệ Toàn cục (Global UI ErrorBoundary)

Ứng dụng được bao bọc bởi `<ErrorBoundary>` (`src/components/ui/ErrorBoundary.tsx`):
- Bắt mọi lỗi ngoại lệ JavaScript chưa được xử lý trong cây DOM của React.
- Hiển thị giao diện phục hồi chuyên nghiệp với nút "Tải lại ứng dụng".
- Tuyệt đối không để ứng dụng bị màn hình trắng (White Screen of Death).
