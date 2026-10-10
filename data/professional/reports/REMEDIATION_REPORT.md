# YUYAN Professional Vocabulary v2 — Remediation Report
## What was preserved
- Original ZIP contents are preserved under `source_raw/` unchanged.
- All 10,000 source records remain represented in the processed dataset; no source rows were silently deleted.

## Definite fixes applied
- Exact repeated-full-string Hanzi fixed: 99 records.
- Conservative Vietnamese cleanup applied: 4539 records.
- Self-only collocation values removed from customer-facing field: 9901 records.
- Same category/subcategory duplicate rows retained but hidden from customer default views: 62 rows across 62 groups.

## Important status
- Every processed record remains `review_required`. No linguistic QA claim has been fabricated.
- Every rewritten example is marked `yuyan_generated_original` + `review_required`; it must pass linguistic review before dictionary-grade publication.
- `customer_visible=false` and `publish_gate=blocked_review_required` prevent accidental customer publication.

## Taxonomy review
- `daily_chemicals_lifestyle`: 1500 records flagged for possible category/subcategory mismatch.
  - khoa học: 20
  - nghiên cứu: 20
  - thí nghiệm: 20
  - lý thuyết: 20
  - dữ liệu: 20
  - mẫu: 20
  - biến số: 20
  - giả thuyết: 20
  - phương pháp: 20
  - kết quả: 20
  - kết luận: 20
  - luận văn/bài báo: 20
  - tạp chí: 20
  - tài liệu học thuật: 20
  - thống kê: 20
  - mô hình: 20
  - phân tích: 20
  - đo lường: 20
  - thiết bị đo: 20
  - phát hiện: 20
  - nông nghiệp: 20
  - trồng trọt: 20
  - chăn nuôi/nuôi trồng: 20
  - chăn nuôi: 20
  - thủy sản: 20
  - nông sản: 20
  - lương thực: 20
  - rau củ: 20
  - trái cây: 20
  - phân bón: 20
  - thuốc nông nghiệp: 20
  - nhà kính: 20
  - chế biến: 20
  - đóng gói: 20
  - bảo quản lạnh: 20
  - môi trường: 20
  - bảo vệ môi trường: 20
  - năng lượng: 20
  - điện lực: 20
  - dầu mỏ: 20
  - khí tự nhiên: 20
  - năng lượng hạt nhân: 20
  - năng lượng mặt trời: 20
  - năng lượng gió: 20
  - năng lượng mới: 20
  - ô nhiễm: 20
  - nước thải: 20
  - khí thải: 20
  - rác thải: 20
  - phát thải carbon: 20
  - khí hậu: 20
  - tài nguyên nước: 20
  - sinh thái: 20
  - phát thải: 20
  - tái chế: 20
  - thể thao: 20
  - bóng đá: 20
  - bóng rổ: 20
  - bóng chuyền: 20
  - tennis: 20
  - cầu lông: 20
  - bóng bàn: 20
  - bơi lội: 20
  - thể hình: 20
  - huấn luyện: 20
  - vận động viên: 20
  - huấn luyện viên: 20
  - thi đấu: 20
  - trọng tài: 20
  - đội bóng: 20
  - giải đấu: 20
  - vô địch: 20
  - thành tích: 20
  - thể lực: 20
  - phục hồi: 20
- `textile_footwear`: 304 records flagged for possible category/subcategory mismatch.
  - nghệ thuật: 19
  - mỹ thuật: 19
  - hội họa: 19
  - nhiếp ảnh: 19
  - điện ảnh: 19
  - âm nhạc: 19
  - kịch: 19
  - múa: 19
  - thiết kế đồ họa: 19
  - thiết kế UI: 19
  - thiết kế UX: 19
  - hoạt hình: 19
  - thiết kế game: 19
  - làm đẹp: 19
  - trang điểm: 19
  - trang sức: 19

## Category counts
- `architecture_construction_materials`: 800
- `daily_chemicals_lifestyle`: 1600
- `finance_banking_accounting`: 400
- `healthcare_pharma`: 400
- `hotel_tourism_food`: 400
- `it_electronics`: 1220
- `legal_hr_office`: 2400
- `logistics_customs`: 800
- `mechanical_manufacturing`: 1600
- `textile_footwear`: 380

## Quality flags
- `EXAMPLE_GENERATED_ORIGINAL_REVIEW_REQUIRED`: 10000
- `COLLOCATION_REQUIRES_REVIEW`: 9901
- `AUTO_NORMALIZED_VIETNAMESE`: 4539
- `TAXONOMY_REVIEW_DAILY_CATEGORY_MISMATCH`: 1500
- `TAXONOMY_REVIEW_TEXTILE_CATEGORY_MISMATCH`: 304
- `AUTO_FIXED_DUPLICATED_HANZI`: 99
- `DUPLICATE_SAME_CATEGORY_SUBCATEGORY`: 62

## Release rule
The v2 dataset is import-safe and QA-aware, but not marked production-published. Publish only records that pass linguistic/terminology review.

- Exact repeated-full-string Pinyin fixed: 99 records.

- Additional self-collocations cleared after Hanzi correction: 99 records.
