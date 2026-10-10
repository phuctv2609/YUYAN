# YUYAN — SPECIALIZED VOCABULARY COVERAGE REPORT
**Source Authority:** `https://tiengtrung.vn/tu-vung-tieng-trung-1000-chuyen-nganh`  
**Database:** Supabase PostgreSQL 17 (`umeyobuqigbscjucxshs`)  
**Status:** Ingested & Verified  
**Date:** October 2026

---

## 1. Summary Statistics
- **Total Specialized Industrial & Professional Domains:** 10
- **Total Specialized Categories:** 46
- **Total Specialized Terminology Records:** 2,234
- **Hanzi / Pinyin / Vietnamese Coverage:** 100% authentic data, zero placeholder/mock entries.
- **Example Sentences & Collocations:** Systematically generated with domain-appropriate Mandarin usage contexts.

---

## 2. Domain & Category Breakdown

| # | Domain ID | Domain (Việt / 中文) | Categories | Total Terms | Primary Industry Scope |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `logistics_customs` | Logistics & Hải quan / 物流与海关 | 4 | 153 | Thuế XNK, thủ tục hải quan, xuất nhập cảnh, bưu chính |
| 2 | `manufacturing_machinery` | Cơ khí & Chế tạo / 机械与制造 | 5 | 298 | Quản lý nhà máy, linh kiện máy móc, dụng cụ ngũ kim, thiết bị cơ khí |
| 3 | `garment_textile` | Dệt may & Da giầy / 纺织服装与鞋业 | 5 | 203 | May mặc thời trang, vải sợi, máy may công nghiệp, sản xuất giày da |
| 4 | `it_electronics` | CNTT & Điện tử / 信息技术与电子 | 5 | 349 | Thiết bị điện, viễn thông điện thoại, phần cứng máy tính, web & internet |
| 5 | `finance_accounting` | Tài chính - Ngân hàng - Kế toán / 金融银行会计 | 6 | 308 | Nghiệp vụ ngân hàng, kiểm toán, kế toán Trung Quốc, bảo hiểm |
| 6 | `medical_healthcare` | Y tế & Dược phẩm / 医疗与药剂 | 5 | 100 | Bác sĩ chuyên khoa, cơ cấu bệnh viện, bệnh học, vị thuốc đông y |
| 7 | `hospitality_dining` | Khách sạn & Ẩm thực / 酒店与餐饮 | 3 | 124 | Dịch vụ khách sạn, văn hóa ẩm thực Trung Hoa, đồ uống & pha chế |
| 8 | `construction_architecture` | Kiến trúc & Xây dựng / 建筑与建材 | 3 | 106 | Kết cấu xây dựng, vật liệu gỗ mỹ nghệ, dầu mỏ và hóa dầu |
| 9 | `business_legal` | Pháp lý, Nhân sự & Văn phòng / 法律与商务 | 5 | 211 | Luật pháp, tư pháp hình sự, tuyển dụng việc làm, văn phòng phẩm |
| 10 | `beauty_lifestyle` | Hóa mỹ phẩm & Đời sống / 日化与生活 | 5 | 382 | Cắt tóc salon, nhiếp ảnh studio, thể thao golf & quần vợt |
| **TOTAL** | **10 Domains** | | **46** | **2,234** | **Comprehensive Multi-Industry Coverage** |

---

## 3. Data Integrity & Verification

1. **Foreign Key Integrity:** All 2,234 items link validly to `specialized_categories(id)` and `specialized_domains(id)`.
2. **PostgreSQL Trigram Search:** GIN trigram index `idx_spec_vocab_hanzi_trgm` active on `hanzi` enables instant substring and fuzzy queries.
3. **Pinyin Accuracy:** All items include tone-marked Pinyin verified against standard Mandarin phonology.
4. **Vietnamese Context:** Industry-standard Vietnamese terminology decoded from authoritative sources without Mojibake or entity encoding corruptions.
