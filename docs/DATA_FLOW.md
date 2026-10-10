# YUYAN — Luồng Dữ liệu Một chiều & Vòng đời Sự kiện (Data Flow & Event Lifecycle)

> **Dự án:** YUYAN (语言)  
> **Tài liệu:** Thiết kế Luồng Dữ liệu Một Chiều & Vòng đời Xử lý  
> **Mã văn bản:** `DOC-FLW-011`  
> **Trạng thái:** Hoàn thiện (`PRODUCTION_READY`)

---

## 1. Kiến trúc Luồng Dữ liệu Một chiều (Unidirectional Data Flow)

YUYAN tuân thủ nghiêm ngặt mô hình luồng dữ liệu một chiều (Unidirectional Data Flow - UDF):

```mermaid
sequenceDiagram
    autonumber
    actor Learner as Học viên
    participant UI as Giao diện UI (React View)
    participant Repo as Repository Layer
    participant Store as Local Storage / Memory
    participant Audio as AudioManager
    participant TTS as BrowserTTSProvider

    Learner->>UI: Bấm nút Nghe câu / Học từ
    UI->>Repo: Truy vấn dữ liệu qua Repository (e.g. resolveSentenceTrack)
    Repo-->>UI: Trả về Dữ liệu chuẩn hóa (AudioTrackMetadata)
    UI->>Audio: Gọi audioManager.playTrack(metadata)
    Audio->>Audio: Làm sạch chuỗi (sanitize) & Kiểm tra Cache
    Audio->>TTS: Yêu cầu phát âm zh-CN
    TTS->>TTS: Kiểm tra giọng đọc tiếng Trung hợp lệ
    TTS-->>Learner: Phát âm thanh tiếng Trung chuẩn
    TTS-->>Audio: Sự kiện onEnded
    Audio-->>UI: Cập nhật AudioState (isSpeaking = false)
    UI->>Store: Cập nhật tiến độ học tập (ProgressRepository)
    Store-->>UI: Bắn tín hiệu Observable phản ứng giao diện
```

---

## 2. Vòng đời Xử lý Bài tập & Ghi nhận Lỗi sai (Exercise & Mistake Lifecycle)

Khi học viên làm bài tập trong các module `ListeningPracticeView` hoặc `SentenceOrderingView`:

```mermaid
flowchart TD
    Start[Bắt đầu làm bài tập] --> LoadQuestion[Nạp câu hỏi từ LessonRepository / VocabularyRepository]
    LoadQuestion --> UserAction[Học viên chọn đáp án / Kéo thả xếp câu]
    UserAction --> Evaluate{Đánh giá kết quả}
    
    Evaluate -- ĐÚNG --> SuccessSound[Phát âm / Hiển thị màu xanh thành công]
    SuccessSound --> IncScore[Tăng điểm & Cập nhật ProgressRepository]
    IncScore --> NextQuestion[Chuyển câu tiếp theo]
    
    Evaluate -- SAI --> ErrorSound[Hiển thị màu đỏ lỗi sai]
    ErrorSound --> LogMistake[Ghi nhận vào MistakeRepository]
    LogMistake --> PersistLocalStorage[Lưu trữ bền vững vào localStorage]
    LogMistake --> ShowExplanation[Hiển thị giải thích & đáp án đúng thực tế]
    ShowExplanation --> NextQuestion
```

---

## 3. Quản lý Khôi phục Trạng thái khi Khởi động Ứng dụng (App Boot & State Hydration)

Khi học viên mở ứng dụng:
1. `App.tsx` đọc `window.location.pathname` để xác định route hiện tại.
2. Nếu tại đường dẫn gốc `/`, đọc `localStorage.getItem('yuyan_study_state_v1')` để khôi phục bài học đang học dở dang.
3. Nếu dữ liệu lưu trữ bị hỏng hoặc chứa JSON không hợp lệ, hệ thống tự động bọc trong khối `try/catch`, xóa khóa lưu trữ hỏng và nạp bài HSK 1 Bài 1 một cách an toàn mà không làm sập ứng dụng.
4. `learnerRepository` nạp thông tin người học và đồng bộ thanh mục tiêu ngày.
