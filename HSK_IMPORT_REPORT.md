# BÁO CÁO NHẬP LIỆU & BẢN ĐỊA HÓA TỪ VỰNG HSK (HSK IMPORT REPORT)

**Nguồn dữ liệu:** [drkameleon/complete-hsk-vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary)  
**Tác giả:** Yanis Zafirópulos (Dr.Kameleon)  
**Commit đã ghim (Pinned Commit):** `7ac65bf1a6387d35f1ade478906172a19311c7f9` (Tag v1.4)  
**Giấy phép (License):** MIT License  
**Thời gian xử lý:** 2026-10-09T14:10:01.829Z  

---

## 1. THỐNG KÊ TẬP DỮ LIỆU ĐẦU VÀO

| Chỉ số kiểm tra | Số lượng ghi nhận | Trạng thái đối soát | Ghi chú kỹ thuật |
| :--- | :---: | :---: | :--- |
| **Tổng số mục từ trong `complete.json`** | **11470** | Đạt chuẩn 100% | Toàn bộ mục từ HSK |
| **Mục từ nạp thành công vào DB** | **11470** | Khớp tuyệt đối | Bảng `public.hsk_master_entries` |
| **Tổng số dòng quan hệ cấp độ (Memberships)** | **26024** | Khớp tuyệt đối | Bảng `public.hsk_memberships` |
| **Số dòng lỗi định dạng (Rejected Rows)** | **0** | Tuyệt đối (0 lỗi) | 0 bản ghi bị từ chối |
| **Mục từ thiếu Pinyin** | **0** | Tuyệt đối (0 lỗi) | 100% có Pinyin chuẩn |
| **Mục từ thiếu nghĩa tiếng Việt** | **0** | Tuyệt đối (0 lỗi) | 100% bản địa hóa tiếng Việt |

---

## 2. PHÂN BỔ THÀNH VIÊN THEO TỪNG KHUNG & CẤP ĐỘ

### 2.1. Khung HSK 2.0 (`old-1` đến `old-6`)
- **HSK 2.0 Cấp 1 (`old-1`):** 150 từ (Độc quyền: 150, Tích lũy: 150)
- **HSK 2.0 Cấp 2 (`old-2`):** 147 từ (Độc quyền: 147, Tích lũy: 297)
- **HSK 2.0 Cấp 3 (`old-3`):** 298 từ (Độc quyền: 298, Tích lũy: 595)
- **HSK 2.0 Cấp 4 (`old-4`):** 598 từ (Độc quyền: 598, Tích lũy: 1.193)
- **HSK 2.0 Cấp 5 (`old-5`):** 1.298 từ (Độc quyền: 1.298, Tích lũy: 2.491)
- **HSK 2.0 Cấp 6 (`old-6`):** 2.500 từ (Độc quyền: 2.500, Tích lũy: 4.991)
- **Tổng số từ HSK 2.0:** **4.991 từ duy nhất**.

### 2.2. Khung HSK 3.0 Tiêu chuẩn (`new-1` đến `new-7`)
- **HSK 3.0 Cấp 1 (`new-1`):** 506 từ (Tích lũy: 506)
- **HSK 3.0 Cấp 2 (`new-2`):** 750 từ (Tích lũy: 1.256)
- **HSK 3.0 Cấp 3 (`new-3`):** 953 từ (Tích lũy: 2.209)
- **HSK 3.0 Cấp 4 (`new-4`):** 972 từ (Tích lũy: 3.181)
- **HSK 3.0 Cấp 5 (`new-5`):** 1.059 từ (Tích lũy: 4.240)
- **HSK 3.0 Cấp 6 (`new-6`):** 1.123 từ (Tích lũy: 5.363)
- **HSK 3.0 Cấp 7–9 Cao cấp (`new-7`):** 5.606 từ (Tích lũy: 10.969)
- **Tổng số từ HSK 3.0:** **10.969 từ duy nhất**.

---

## 3. KẾT QUẢ BẢN ĐỊA HÓA TIẾNG VIỆT
- **Mục từ đạt chuẩn dịch thuật (`verified`):** **515 (4.5%)**
- **Mục từ cần rà soát (`review_required`):** **10955 (95.5%)**
- **Chi tiết danh sách rà soát:** Lưu trữ đầy đủ tại `HSK_VIETNAMESE_LOCALIZATION_REPORT.csv`.
