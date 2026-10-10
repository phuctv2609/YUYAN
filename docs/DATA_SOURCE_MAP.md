# YUYAN — Bản Đồ Nguồn Dữ Liệu (Data Source Map)

Hệ thống giáo trình và tài nguyên số của nền tảng học tiếng Trung YUYAN ("Học tiếng Trung theo cách của bạn") được bảo chứng 100% tính nguyên vẹn, minh bạch nguồn gốc và không sử dụng dữ liệu giả mạo (zero fake data).

---

## 1. Dữ Liệu Giáo Trình HSK 1–6 Chính Thức (Authoritative Curriculum)
| Thực thể | Tệp nguồn lưu trữ | Số lượng bản ghi | Mô tả cấu trúc & Kiểm thử |
|---|---|---|---|
| **HSK Bài học** | `data/hsk/lessons.json` | **146 bài học** | HSK 1 (15 bài), HSK 2 (15 bài), HSK 3 (20 bài), HSK 4 (20 bài), HSK 5 (36 bài), HSK 6 (40 bài). Đầy đủ tiêu đề, mã bài, cấu trúc câu hội thoại. |
| **Câu hội thoại bài khóa** | `data/hsk/lessons.json` | **9,178 câu thoại** | Mỗi câu gồm Hán tự (Hanzi), Pinyin chuẩn thanh điệu, Bản dịch tiếng Việt chuẩn nghĩa, và tag người thoại (Speaker tag). |
| **Kho từ vựng HSK** | `data/hsk/vocabulary.json` | **8,456 từ vựng** | Hán tự, Pinyin, từ loại, nghĩa tiếng Việt, cấp độ HSK và bài học xuất hiện. |
| **Đoạn văn đọc hiểu** | `data/hsk/reading.json` | **146 đoạn văn** | Đoạn văn bài đọc (Reading passages), Pinyin, bản dịch tiếng Việt, từ mới tái xuất hiện và câu hỏi đọc hiểu. |

---

## 2. Dữ Liệu Hán Tự & Bộ Thủ Khang Hy (Character & Radical Knowledge Base)
| Thực thể | Tệp nguồn code | Số lượng bản ghi | Nguồn gốc học thuật |
|---|---|---|---|
| **214 Bộ thủ Khang Hy** | `src/data/radicals/kangxi214.ts` | **214 bộ thủ (100%)** | 214 Bộ thủ Khang Hy (康熙部首) phân loại từ 1 đến 17 nét, có Hán tự, Pinyin, Hán Việt, ý nghĩa biểu trưng và ví dụ Hán tự liên kết. |
| **Hán tự cơ bản & chuẩn** | `src/data/hanzi/canonicalHanzi.ts` | **1,059 Hán tự** | Hán tự cấp độ HSK 1–4 có số nét, Pinyin, nghĩa Hán Việt, nghĩa phổ thông, bộ thủ trực thuộc và liên kết từ vựng thực tế. |

---

## 3. Dữ Liệu Âm Thanh & Phát Âm (Audio Engine Architecture)
| Tầng ưu tiên | Nhà cung cấp / Module | Trạng thái kỹ thuật | Fallback & Xử lý lỗi |
|---|---|---|---|
| **1. Static Native Audio** | `staticAudioProvider.ts` | Tệp ghi âm giọng bản xứ khi có đường dẫn URL chính thức | Bỏ qua nếu chưa có tệp |
| **2. In-Memory Cache** | `audioCache.ts` | Bộ nhớ tạm lưu trữ phát âm đã tải trong phiên | Tránh tải trùng lặp |
| **3. Web Speech API** | `browserTTSProvider.ts` | Giọng đọc tiếng Trung phổ thông (`zh-CN`) chuẩn Bắc Kinh | Kiểm tra `voice.lang === 'zh-CN'`, loại bỏ hoàn toàn fallback sang tiếng Anh/Việt |
| **4. Unavailable State** | `audioErrors.ts` | Thông báo minh bạch mã lỗi `AUDIO-002` (Chưa cài giọng zh-CN) | Tuyệt đối không giả lập âm thanh |

---

## 4. Dữ Liệu Hồ Sơ Học Viên & Tiến Độ (Learner & SRS Persistence)
| Thực thể | Module phụ trách | Cơ chế lưu trữ | Khả năng phản ứng |
|---|---|---|---|
| **Hồ sơ học viên (StudentProfile)** | `src/data/repositories/learnerRepository.ts` | `localStorage` (`yuyan_learner_profile_v2`) | Đăng ký Observable (`subscribe`), đồng bộ tức thì trên TopNavbar, Sidebar, Dashboard, Settings |
| **Tiến độ học tập & SRS** | `src/data/repositories/progressRepository.ts` | `localStorage` (`yuyan_progress_v1`) | Ghi nhận từ đã học, từ cần ôn, thời gian ôn tập lặp lại ngắt quãng |
| **Sổ câu sai (Mistake Book)** | `src/data/repositories/mistakeRepository.ts` | `localStorage` (`yuyan_mistakes_v1`) | Lưu lại lịch sử câu làm sai trong phần kiểm tra và luyện tập |
