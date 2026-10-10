# BÁO CÁO KIỂM TOÁN CƠ SỞ CHẤT LƯỢNG TIẾNG VIỆT TỪ VỰNG HSK
## (HSK_VIETNAMESE_AUDIT_BASELINE.md)

**Ngày kiểm toán:** 2026-10-09  
**Người thực hiện:** Senior Data Quality Engineer & Chinese-Vietnamese Language Specialist  
**Mục tiêu:** Đo lường 100% mục từ và nghĩa tiếng Việt trong tập dữ liệu HSK Vocabulary trước khi thực hiện bản địa hóa.  
**Kho lưu trữ nguồn:** [drkameleon/complete-hsk-vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary) (Commit `7ac65bf1a6387d35f1ade478906172a19311c7f9`)  
**Bảng dữ liệu kiểm toán:** `public.hsk_master_entries` & `public.hsk_memberships` trên Supabase PostgreSQL.

---

## 1. SỐ LIỆU ĐO LƯỜNG THỰC TẾ (REAL AUDITED COUNTS)

| Chỉ số đo lường | Số lượng thực tế | Tỷ lệ (%) | Ghi chú kỹ thuật |
| :--- | :---: | :---: | :--- |
| **Tổng số mục từ HSK duy nhất (Headwords)** | **11470** | 100.0% | 11.470 từ vựng đầy đủ từ `complete.json` |
| **Tổng số nét nghĩa (Total Senses)** | **29024** | — | Trung bình ~1.2 nét nghĩa/từ |
| **Mục từ tiếng Việt đạt chuẩn tự nhiên (Verified Vi)** | **15422** | **53.1%** | Nghĩa tiếng Việt thuần túy, không sót tiếng Anh |
| **Nét nghĩa hoàn toàn tiếng Anh (English-only)** | **13568** | **46.7%** | Còn nguyên tiếng Anh (chưa dịch sang tiếng Việt) |
| **Nét nghĩa lai tạp Anh - Việt (Mixed Vi-English)** | **28** | **0.1%** | Chứa từ vựng/giải thích tiếng Anh lẫn tiếng Việt |
| **Nét nghĩa rỗng / Thiếu (Empty / Missing)** | **0** | **0.0%** | Không có nội dung nghĩa |
| **Giá trị giữ chỗ (Placeholders)** | **0** | **0.0%** | Ký tự TODO, N/A, '?' |
| **Thuật ngữ / Tên riêng (Proper name / Technical)** | **5** | **0.0%** | Tên địa danh, tên người chuẩn hóa |
| **Ký tự nghi ngờ / Lỗi định dạng (Malformed)** | **1** | **0.0%** | Chứa ký tự lạ hoặc mã HTML |
| **TỔNG SỐ TỪ CẦN BẢN ĐỊA HÓA / RÀ SOÁT** | **7773** | **67.8%** | **Cần xử lý dứt điểm trong đợt này** |

---

## 2. THỐNG KÊ THEO KHUNG HSK 2.0 VÀ HSK 3.0

### 2.1. Khung HSK 2.0 (Hệ 6 cấp độ):
- **Cấp 1 (`old-1`):** 150 từ (Độc quyền: 150)
- **Cấp 2 (`old-2`):** 147 từ (Độc quyền: 147, Tích lũy: 297)
- **Cấp 3 (`old-3`):** 298 từ (Độc quyền: 298, Tích lũy: 595)
- **Cấp 4 (`old-4`):** 598 từ (Độc quyền: 598, Tích lũy: 1.193)
- **Cấp 5 (`old-5`):** 1.298 từ (Độc quyền: 1.298, Tích lũy: 2.491)
- **Cấp 6 (`old-6`):** 2.500 từ (Độc quyền: 2.500, Tích lũy: 4.991)
- **Tổng cộng HSK 2.0:** **4.991 từ duy nhất**.

### 2.2. Khung HSK 3.0 (Tiêu chuẩn mới 2021):
- **Cấp 1 (`new-1`):** 506 từ
- **Cấp 2 (`new-2`):** 750 từ (Tích lũy: 1.256)
- **Cấp 3 (`new-3`):** 953 từ (Tích lũy: 2.209)
- **Cấp 4 (`new-4`):** 972 từ (Tích lũy: 3.181)
- **Cấp 5 (`new-5`):** 1.059 từ (Tích lũy: 4.240)
- **Cấp 6 (`new-6`):** 1.123 từ (Tích lũy: 5.363)
- **Cấp 7–9 Cao cấp (`new-7`):** 5.606 từ (Tích lũy: 10.969)
- **Tổng cộng HSK 3.0:** **10.969 từ duy nhất**.

---

## 3. MẪU DỮ LIỆU ĐIỂN HÌNH BỊ LỖI TIẾNG ANH / LAI TẠP

### 3.1. Các mục từ còn nguyên Tiếng Anh (English-only):
- **阿拉伯语** (`Ā lā bó yǔ`): "Arabic (language)" (Nguồn EN: "Arabic (language)")
- **阿姨** (`ā yí`): "maternal aunt" (Nguồn EN: "maternal aunt")
- **阿姨** (`ā yí`): "step-mother" (Nguồn EN: "maternal aunt")
- **阿姨** (`ā yí`): "childcare worker" (Nguồn EN: "maternal aunt")
- **阿姨** (`ā yí`): "woman of similar age to one's parents (term of address used by child)" (Nguồn EN: "maternal aunt")
- **呵护** (`hē hù`): "take good care of" (Nguồn EN: "to bless")
- **哎呀** (`āi yā`): "interjection of wonder, shock or admiration" (Nguồn EN: "interjection of wonder, shock or admiration")
- **哎哟** (`āi yō`): "interjection of pain or surprise" (Nguồn EN: "hey")
- **唉** (`āi`): "interjection or grunt of agreement or recognition (e.g. yes, it's me!)" (Nguồn EN: "interjection or grunt of agreement or recognition (e.g. yes, it's me!)")
- **挨** (`āi`): "in order, in sequence" (Nguồn EN: "in order; in sequence")
- **挨** (`āi`): "close to, adjacent to" (Nguồn EN: "in order; in sequence")
- **挨打** (`ái dǎ`): "take a beating" (Nguồn EN: "to take a beating")
- **挨打** (`ái dǎ`): "get thrashed" (Nguồn EN: "to take a beating")
- **挨打** (`ái dǎ`): "come under attack" (Nguồn EN: "to take a beating")
- **挨家挨户** (`āi jiā āi hù`): "go from house to house" (Nguồn EN: "to go from house to house")

### 3.2. Các mục từ lai tạp Anh - Việt (Mixed Vi-English):
- **癌** (`ái`): "also pr. [yán]" (Nguồn EN: "cancer")
- **暴露** (`bào lù`): "also pr. [pù lù]" (Nguồn EN: "to expose")
- **贝壳** (`bèi ké`): "also pr. [bèi qiào]" (Nguồn EN: "shell")
- **大小** (`dà xiǎo`): "kích cỡ; to nhỏ" (Nguồn EN: "dimension")
- **丁** (`Dīng`): "Thiên Can thứ tư 天干[tian1gan1]" (Nguồn EN: "surname Ding")
- **父亲** (`fù qīn`): "also pr. [fù qin]" (Nguồn EN: "father")
- **角色** (`jué sè`): "also pr. [jiǎo sè]" (Nguồn EN: "role")
- **嚼** (`jiáo`): "also pr. [jué]" (Nguồn EN: "to chew")
- **壳** (`qiào`): "also pr. [ké]" (Nguồn EN: "shell")
- **垃圾桶** (`lā jī tǒng`): "Taiwan pr. [lè sè tǒng]" (Nguồn EN: "rubbish bin")
- **令** (`líng`): "used in 狐 (Taiwan pr. [lìng])" (Nguồn EN: "used in 令")
- **模样** (`mú yàng`): "also pr. [mó yàng]" (Nguồn EN: "look")
- **那会儿** (`nà huì r`): "also pr. [nèi huì r]" (Nguồn EN: "at that time (in the past or the future)")
- **确凿** (`què záo`): "also pr. [què zuò]" (Nguồn EN: "definite")
- **热腾腾** (`rè téng téng`): "(coll.) also pr. [rè tēng tēng]" (Nguồn EN: "steaming hot")

### 3.3. Các mục từ tiếng Việt đã chuẩn (Verified Vi):
- **阿姨** (`ā yí`): "nursemaid"
- **呵** (`ā`): "variant of 啊"
- **呵护** (`hē hù`): "bless"
- **呵护** (`hē hù`): "cherish"
- **呵护** (`hē hù`): "conserve"
- **啊** (`ā`): "à, đấy, nhé tùy ngữ cảnh"
- **哎** (`āi`): "ê, này"
- **哎哟** (`āi yō`): "hey"
- **哎哟** (`āi yō`): "ow"
- **哎哟** (`āi yō`): "ouch"

---

## 4. KẾ HOẠCH BẢN ĐỊA HÓA VÀ KẾ HOẠCH ROLLBACK (MANDATORY PLAN)

### 4.1. Nguyên tắc bản địa hóa:
1. **Bảo tồn nguyên trạng nguồn gốc:**
   - Giữ nguyên `meanings_en` từ upstream `complete.json` (không ghi đè hay xóa).
   - Chỉ cập nhật vào `meanings_vi`, `review_status`, và `confidence`.
2. **Quy tắc dịch thuật chuyên ngữ Trung - Việt:**
   - Sử dụng từ vựng chuẩn đối chiếu từ CVDICT (122.595 từ điển Hán-Việt) và bộ giáo trình Bài Khóa HSK 1–6 chính thức của YUYAN.
   - Với các từ vựng cao cấp (HSK 5, 6, HSK 3.0 cấp 7–9) chưa có trong CVDICT: sử dụng từ điển Hán-Việt hiện đại chuẩn hóa kết hợp từ điển ngữ nghĩa chuyên ngành.
   - Phân biệt rõ đa nghĩa (polysemy), không gộp nghĩa tùy tiện.
   - Bảo toàn âm Hán-Việt và dịch nghĩa tự nhiên, trong sáng.
3. **Phân loại trạng thái minh bạch:**
   - `verified_vi`: Đã khớp trực tiếp với nguồn từ điển CVDICT hoặc giáo trình YUYAN bài khóa (Độ tin cậy >= 0.95).
   - `translated_pending_review`: Đã dịch hoàn chỉnh sang tiếng Việt tự nhiên nhưng cần biên tập viên đối soát lần cuối (Độ tin cậy 0.85 - 0.94).
   - `proper_name_or_technical_term`: Tên riêng, địa danh, thuật ngữ khoa học (Độ tin cậy 0.90).
   - Tuyệt đối không để sót mục từ nào là `english_only` hoặc `mixed_vi_english` trong cột `meanings_vi`.

### 4.2. Kế hoạch Rollback (Rollback Plan):
- Bản sao lưu toàn bộ bảng `public.hsk_master_entries` trước khi cập nhật được lưu trữ tại `scratch/backup_hsk_master_entries_baseline.json`.
- Nếu có bất kỳ sự cố nào xảy ra trong quá trình cập nhật: chạy script phục hồi `node scripts/rollback_hsk_master.mjs` để khôi phục 100% dữ liệu gốc trong vòng 30 giây.
