# SỔ ĐĂNG KÝ NGUỒN GỐC DỮ LIỆU & BẢN QUYỀN (SOURCE & LICENSE REGISTRY)
**Hệ thống:** YUYAN Chinese Learning Platform  
**Ngày cập nhật:** 2026-10-09  

Tài liệu này ghi nhận đầy đủ xuất xứ, mã băm, cam kết bản quyền và nghĩa vụ pháp lý đối với tất cả các tập dữ liệu được tích hợp trong hai phân hệ **Từ vựng HSK (HSK Vocabulary)** và **Từ điển Toàn cầu (Global Dictionary)**.

---

## 1. PHÂN HỆ TỪ VỰNG HSK (HSK VOCABULARY SYSTEM)

### 1.1. Nguồn chính (Primary Source)
* **Tên dự án:** `complete-hsk-vocabulary`
* **Tác giả / Maintainer:** Yanis Zafirópulos (Dr.Kameleon)
* **Kho lưu trữ:** [https://github.com/drkameleon/complete-hsk-vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary)
* **Commit ghim (Pinned Commit):** `7ac65bf1a6387d35f1ade478906172a19311c7f9`
* **Phiên bản phát hành:** `v1.4`
* **Giấy phép phần mềm:** **MIT License**
* **Toàn văn bản quyền:**
  ```text
  MIT License
  Copyright (c) 2026 Yanis Zafirópulos (aka Dr.Kameleon)
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files...
  ```

### 1.2. Các nguồn thành phần phái sinh bên dưới (Underlying Data Sources)
| Thành phần dữ liệu | Nguồn tác giả / Dự án | Giấy phép | Ghi chú tích hợp trong YUYAN |
| :--- | :--- | :--- | :--- |
| **Bảng từ HSK 2.0 (Old)** | [clem109/hsk-vocabulary](https://github.com/clem109/hsk-vocabulary) | Public Domain (Unlicense) | Khung 6 cấp: `old-1` đến `old-6` |
| **Bảng từ HSK 3.0 (New)** | [elkmovie/hsk30](https://github.com/elkmovie/hsk30) | MIT License | Khung 7 cấp: `new-1` đến `new-7` (Dải 7–9) |
| **Bảng từ HSK 3.0 (2021 Revision)** | [drkameleon/complete-hsk-vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary) | MIT License | Danh sách điều chỉnh: `newest-1` đến `newest-7` |
| **Định nghĩa từ vựng (Meanings)** | [CC-CEDICT](https://www.mdbg.net/chinese/dictionary) | CC BY-SA 4.0 | Được YUYAN bản địa hóa 100% sang tiếng Việt |
| **Bộ thủ Hán tự (Radicals)** | [MakeMeAHanzi](https://github.com/skishore/makemeahanzi) | ODbL / CC BY-SA 3.0 | 214 Bộ thủ Khang Hy |
| **Tần suất từ (Frequency)** | [krmanik/HSK-3.0-words-list](https://github.com/krmanik/HSK-3.0-words-list) | MIT License | Thứ hạng tần suất từ |
| **Từ loại (Parts of Speech)** | SUBTLEX-CH & HanLP | Apache 2.0 | Mã POS và nhãn tiếng Việt tương ứng |

---

## 2. PHÂN HỆ TỪ ĐIỂN TOÀN CẦU (GLOBAL DICTIONARY SYSTEM)

### 2.1. Nguồn chính (Primary Source)
* **Tên dự án:** `CVDICT` (Từ điển Trung - Việt mã nguồn mở)
* **Tác giả:** Phong Phan (`ph0ngp`)
* **Kho lưu trữ:** [https://github.com/ph0ngp/CVDICT](https://github.com/ph0ngp/CVDICT)
* **Commit ghim (Pinned Commit):** `c379d909e308343a247e51619f7839a2060a271c`
* **Tập tin nguồn:** `CVDICT.u8` (10.803.314 bytes)
* **Mã băm SHA-256:** `4dde4b204193efa9c192d7f7daeab1bb579c8ccd7c41ed90d1b6caee22ba0948`
* **Số mục từ:** **122.595 mục từ**
* **Giấy phép:** **Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)**
* **Nghĩa vụ pháp lý & Attribution:**
  - Giữ nguyên thông tin ghi nhận công lao tác giả Phong Phan trên toàn bộ giao diện từ điển YUYAN và tài liệu kỹ thuật.
  - Áp dụng điều khoản Chia sẻ tương tự (Share-Alike) cho các bản phái sinh và dịch nghĩa liên quan.

---

## 3. LÕI BÀI KHÓA GIÁO TRÌNH YUYAN (YUYAN CURRICULUM CORE — PROTECTED)

* **Số lượng bài học:** **146 bài học** (HSK 1 đến HSK 6).
* **Số lượng câu bài khóa:** **9.178 câu thoại**.
* **Trạng thái bản quyền nội dung:** Thuộc bản quyền giáo trình nội bộ YUYAN.
* **Quy tắc bảo vệ:** **100% READ-ONLY**. Các phân hệ Từ vựng HSK và Từ điển Toàn cầu chỉ truy vấn đọc (Read-only reference) để tạo liên kết hiển thị ngữ cảnh câu bài học, tuyệt đối không chỉnh sửa cấu trúc dữ liệu, câu thoại, speaker hay bản dịch của bài khóa.
