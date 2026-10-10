# YUYAN Instant Auto-Sync Engine

Công cụ tự động hóa đồng bộ mã nguồn cục bộ lên kho chứa GitHub (`https://github.com/phuctv2609/YUYAN.git`) trên môi trường Windows thông qua PowerShell `System.IO.FileSystemWatcher`.

---

## 1. Tính Năng Nổi Bật

1. **Phát hiện tức thì sau khi lưu file:** Lắng nghe các sự kiện thay đổi (`Changed`, `Created`, `Deleted`, `Renamed`) từ hệ thống tệp Windows theo thời gian thực.
2. **Debounce 3 giây:** Tự động gộp các sự kiện liên tiếp của một thao tác lưu file để tránh sinh nhiều commit rác.
3. **Bảo mật tuyệt đối (Security Gate):**
   - Loại trừ hoàn toàn và tự động hủy bỏ chu trình đồng bộ nếu phát hiện các file nhạy cảm: `.env*`, `*.key`, `*.pem`, `id_rsa`, `id_ed25519`...
   - Tự động quét diff đã stage trước khi commit để chặn đứng các mẫu khóa API (Gemini Key, Supabase Secret JWT...).
4. **Loại trừ thư mục phụ trợ:** Bỏ qua `\.git\`, `node_modules\`, `dist\`, `build\`, `scratch\`, `tools\autosync\`, `\.temp\`.
5. **Chống va chạm và phân kỳ:** Tự động kiểm tra `git fetch` trước khi đẩy (`push`). Nếu remote có commit mới, tiến trình tự động dừng và thông báo thay vì ghi đè hoặc xung đột.
6. **Khóa đơn tiến trình (PID Mutex):** Không cho phép chạy nhiều phiên bản watcher cùng lúc.

---

## 2. Hướng Dẫn Sử Dụng

### Khởi động Watcher chạy nền:
```powershell
powershell -ExecutionPolicy Bypass -File .\tools\autosync\start-autosync.ps1
```

### Kiểm tra trạng thái và log hoạt động:
```powershell
powershell -ExecutionPolicy Bypass -File .\tools\autosync\status-autosync.ps1
```

### Dừng Watcher:
```powershell
powershell -ExecutionPolicy Bypass -File .\tools\autosync\stop-autosync.ps1
```

### Chạy trực tiếp ở chế độ tương tác (Foreground Console):
```powershell
powershell -ExecutionPolicy Bypass -File .\tools\autosync\yuyan-autosync.ps1
```

---

## 3. Cấu Trúc Thư Mục

* `yuyan-autosync.ps1`: Động cơ watcher chính.
* `start-autosync.ps1`: Khởi chạy watcher dưới dạng tiến trình nền ẩn.
* `stop-autosync.ps1`: Dừng tiến trình watcher an toàn.
* `status-autosync.ps1`: Xem trạng thái PID, bộ nhớ và các dòng log gần nhất.
* `autosync.log`: Tệp nhật ký theo dõi (được cấu hình trong `.gitignore`).
* `.autosync.pid`: Tệp lưu PID tiến trình đang chạy (được cấu hình trong `.gitignore`).
