# YUYAN Instant Auto-Sync Engine

Công cụ tự động hóa đồng bộ mã nguồn cục bộ lên kho chứa GitHub (`https://github.com/phuctv2609/YUYAN.git`) trên môi trường Windows thông qua PowerShell `System.IO.FileSystemWatcher`.

---

## 1. Tính Năng Nổi Bật

1. **Phát hiện tức thì sau khi lưu file:** Lắng nghe các sự kiện thay đổi (`Changed`, `Created`, `Deleted`, `Renamed`) từ hệ thống tệp Windows theo thời gian thực.
2. **Debounce 3 giây:** Tự động gộp các sự kiện liên tiếp của một thao tác lưu file để tránh sinh nhiều commit rác.
3. **Bảo mật tuyệt đối (Security Gate):**
   - Loại trừ hoàn toàn và tự động hủy bỏ chu trình đồng bộ nếu phát hiện các file nhạy cảm: `.env*`, `*.key`, `*.pem`, `*.pfx`, `id_rsa`, `id_ed25519`, `credentials`, `service_role`, `token`...
   - Tự động chạy `git diff --cached --check` để chặn ký tự lỗi / conflict markers.
   - Tự động quét diff đã stage trước khi commit để chặn đứng các mẫu khóa API (Gemini Key, Supabase Secret JWT, GitHub PAT, Private Key...).
4. **Loại trừ thư mục phụ trợ:** Bỏ qua `\.git\`, `node_modules\`, `dist\`, `build\`, `scratch\`, `tools\autosync\`, `\.temp\`, `backups\`.
5. **Stage đúng file thay đổi (Không chạy blind `git add -A`):** Chỉ stage đúng đường dẫn các file được sửa đổi hoặc xóa.
6. **Chống va chạm và phân kỳ:** Tự động kiểm tra `git fetch` trước khi đẩy (`push`). Nếu remote có commit mới, tiến trình tự động dừng và thông báo thay vì ghi đè hoặc xung đột. Tuyệt đối không bao giờ force-push.
7. **Khóa đơn tiến trình (PID Mutex & Concurrency Lock):** Không cho phép chạy nhiều phiên bản watcher hoặc nhiều chu trình Git đồng thời.
8. **Tự động khởi động khi mở Workspace / Windows Login:** Tích hợp sẵn với `.vscode/tasks.json` (`folderOpen`) và script tạo shortcut trong thư mục Windows Startup.

---

## 2. Hướng Dẫn Sử Dụng & Lệnh Điều Khiển

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

### Đăng ký tự động chạy khi đăng nhập Windows:
```powershell
powershell -ExecutionPolicy Bypass -File .\tools\autosync\register-startup.ps1
```

### Hủy đăng ký Windows Startup:
```powershell
powershell -ExecutionPolicy Bypass -File .\tools\autosync\unregister-startup.ps1
```

### Chạy trực tiếp ở chế độ tương tác (Foreground Console):
```powershell
powershell -ExecutionPolicy Bypass -File .\tools\autosync\yuyan-autosync.ps1
```

---

## 3. Cấu Trúc Thư Mục

* `yuyan-autosync.ps1`: Động cơ watcher chính.
* `start-autosync.ps1`: Khởi chạy watcher dưới dạng tiến trình nền ẩn (WMI detached).
* `stop-autosync.ps1`: Dừng tiến trình watcher an toàn.
* `status-autosync.ps1`: Xem trạng thái PID, bộ nhớ và các dòng log gần nhất.
* `register-startup.ps1`: Tạo shortcut Windows Startup tự động chạy khi mở máy.
* `unregister-startup.ps1`: Xóa shortcut Windows Startup.
* `autosync.log`: Tệp nhật ký theo dõi (được cấu hình trong `.gitignore`).
* `.autosync.pid`: Tệp lưu PID tiến trình đang chạy (được cấu hình trong `.gitignore`).
* `.sync.lock`: Tệp khóa chống xung đột thao tác Git đồng thời (được cấu hình trong `.gitignore`).
