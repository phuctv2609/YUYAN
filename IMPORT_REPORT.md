# YUYAN — Professional Vocabulary 10,000 Import Report

**Timestamp**: 2026-10-08T19:34:00+07:00  
**Target Table**: `public.specialized_vocabulary`  
**Target Database**: Supabase PostgreSQL 17 (`umeyobuqigbscjucxshs`)  
**Status**: COMPLETE & VERIFIED

---

## 1. Accounting Summary
- **Source Package**: `YUYAN_Professional_Vocabulary_10000_v2`
- **Total Source Records**: **10,000**
- **Imported Records**: **10,000**
- **Distinct Primary Keys (`id`)**: **10,000**
- **Verification Rule**: `COUNT(*) = 10000` & `COUNT(DISTINCT id) = 10000` -> **PASSED**

---

## 2. Domain Distribution Verification (Section 36)
| Domain ID | Lĩnh vực (Tiếng Việt) | 领域 (中文) | Record Count | Status |
| :--- | :--- | :--- | :---: | :---: |
| `legal_hr_office` | Pháp lý, Nhân sự & Văn phòng | 法律、人力与商务 | 2,400 | Verified |
| `mechanical_manufacturing` | Cơ khí & Sản xuất chế tạo | 机械与制造 | 1,600 | Verified |
| `daily_chemicals_lifestyle` | Hóa mỹ phẩm & Đời sống | 日化与生活 | 1,600 | Verified |
| `it_electronics` | Công nghệ Thông tin & Điện tử | 信息技术与电子 | 1,220 | Verified |
| `logistics_customs` | Logistics & Hải quan | 物流与海关 | 800 | Verified |
| `architecture_construction_materials` | Kiến trúc, Xây dựng & Vật liệu | 建筑与建材 | 800 | Verified |
| `finance_banking_accounting` | Tài chính, Ngân hàng & Kế toán | 金融、银行与会计 | 400 | Verified |
| `healthcare_pharma` | Y tế, Bệnh viện & Dược phẩm | 医疗、医院与药剂 | 400 | Verified |
| `hotel_tourism_food` | Khách sạn, Du lịch & Ẩm thực | 酒店、旅游与餐饮 | 400 | Verified |
| `textile_footwear` | Dệt may & Da giày | 纺织服装与鞋业 | 380 | Verified |
| **TOTAL** | | | **10,000** | **EXACT 10,000** |

---

## 3. Duplicate & Provenance Accounting
- **Unique Records (`unique`)**: 9,876
- **Keep Primary (`keep_primary`)**: 62
- **Hidden Provenance Duplicates (`retain_source_duplicate_hidden`)**: 62
- **Review Required Flags (`status = review_required`)**: 10,000
- **Learner Catalog View (`specialized_catalog`)**: Exposes primary non-duplicate terms (`unique` & `keep_primary`).
