# YUYAN — Khả Năng Truy Xuất Nguồn Gốc Nội Dung (Content Traceability)

Tài liệu này ghi nhận nguyên tắc và quy trình truy xuất nguồn gốc nội dung cho toàn bộ 146 bài học, 9,178 câu thoại, 8,456 từ vựng, 146 đoạn văn và 214 bộ thủ trong hệ thống YUYAN.

---

## 1. Tính Toàn Vẹn Của Giáo Trình HSK (Integrity Guarantee)
1. **Không can thiệp văn bản gốc**: Toàn bộ câu chữ tiếng Trung trong `data/hsk/lessons.json` được trích xuất nguyên vẹn từ gói tài liệu tác giả HSK chính thống. Không tự ý biên tập, thay đổi trật tự câu, hoặc tạo mới bài học giả định.
2. **Bộ bóc tách hội thoại (Bài Khóa Parser)**:
   - Khi bài học ở dạng hội thoại nhân vật (vd: `周宇航：哎，林子轩...`), hệ thống sử dụng `src/data/hsk/dialogueParser.ts` để phân tách hai phần:
     - `speaker`: Tên nhân vật thoại (`周宇航`, `林子轩`, `安娜`, `大卫`...).
     - `spokenContent`: Nội dung câu thoại thực tế sau dấu hai chấm (`：` hoặc `:`).
   - Đảm bảo động cơ âm thanh (`audioManager`) **chỉ phát âm** phần `spokenContent`, bảo vệ trải nghiệm luyện nghe và nói của học viên.
3. **Liên kết chéo Thực Thể (Cross-Entity Traceability)**:
   - Từ vựng trong bài học (`lessonRepository.getLessonVocabulary`) liên kết trực tiếp với Từ điển (`DictionaryView`) và bảng Hán tự (`HanziView`).
   - Mỗi từ vựng có mã bài học `hsk${level}-bai${lessonNumber}` xác định chính xác bài học xuất hiện đầu tiên.
   - Mỗi Hán tự chỉ định rõ Bộ thủ trực thuộc trong 214 Bộ thủ Khang Hy (`RadicalView`).

---

## 2. Kiểm Soát Trực Quan & Giao Diện Người Dùng (Visual Traceability)
1. **Theme Tokens Không Rò Rỉ (No Theme Leaks)**:
   - Toàn bộ màu nền giao diện được gán bằng biến CSS động: `--bg-canvas`, `--surface`, `--surface-secondary`, `--surface-elevated`.
   - Thuộc tính `color-scheme: light` và `color-scheme: dark` được thiết lập trên `:root` và `.dark` để ngăn trình duyệt render thanh cuộn trắng trong chế độ nền tối.
2. **Không Dùng Dữ Liệu Cố Định Trên Giao Diện (No Hardcoded Profile)**:
   - Thông tin học viên được quản lý độc lập tại `learnerRepository`.
   - Thay đổi họ tên, email, mục tiêu tại Cài đặt (`SettingsView`) lập tức cập nhật thanh điều hướng trên cùng (`TopNavbar`), thanh bên (`Sidebar`), và trang chủ (`DashboardView`) mà không cần tải lại trang.
