# YUYAN — Danh mục Nguồn Dữ liệu & Hợp đồng Dịch vụ (API Source Catalog)

> **Dự án:** YUYAN (语言)  
> **Tài liệu:** Danh mục Dữ liệu & Giao diện Dịch vụ  
> **Mã văn bản:** `DOC-API-002`  
> **Trạng thái:** Chuẩn hóa (`PRODUCTION_READY`)

---

## 1. Bản đồ Nguồn Dữ liệu Bản địa (Local Authoritative Datasets)

Hệ thống YUYAN hoạt động dựa trên các bộ dữ liệu gốc chuẩn hóa, được lưu trữ tại `data/hsk/`:

| Tên tệp | Kích thước & Quy mô | Mục đích sử dụng | Cơ chế truy xuất |
| :--- | :--- | :--- | :--- |
| `data/hsk/lessons.json` | 146 bài học, 9,178 câu hoàn chỉnh | Nguồn sự thật duy nhất cho giáo trình HSK 1–6 (Bài khóa, câu, Pinyin, nghĩa tiếng Việt) | `lessonRepository.getLesson(level, num)` |
| `data/hsk/vocabulary.json` | 146 bài, 8,456 mục từ vựng có STT, từ loại, collocation | Nguồn từ vựng chính thức gắn với từng bài học và cấp độ HSK | `vocabularyRepository.getByLesson(level, num)` |
| `data/hsk/reading.json` | 146 bài đọc hiểu, câu hỏi trắc nghiệm, từ xuất hiện lại | Nguồn bài luyện đọc nâng cao và câu hỏi kiểm tra năng lực đọc hiểu | `readingRepository.getLessonReading(level, num)` |
| `src/data/radicals/kangxi214.ts` | 214 Bộ thủ Khang Hy chuẩn | Bảng danh mục 214 bộ thủ với số nét, phiên âm, tên Hán Việt, ý nghĩa, phân loại | `radicalRepository.getAll()`, `getByNumber(num)` |
| `src/data/hanzi/canonicalHanzi.ts` | 1,059 Chữ Hán chuẩn hóa | Phân tích chiết tự (Anatomy), cấu trúc không gian, nét vẽ tuần tự, từ vựng liên quan | `hanziRepository.getByChar(char)` |

---

## 2. Hợp đồng Tầng Kho Dữ liệu (Repository Abstraction Layer)

Mọi thành phần giao diện UI bị nghiêm cấm truy cập trực tiếp vào các tệp JSON thô. Tất cả tương tác phải thông qua các Repositories độc lập:

### 2.1. `LessonRepository` (`src/data/hsk/lessonRepository.ts`)
- `getLesson(level: number, lessonNumber: number): Lesson | undefined`
- `getAllLessons(): Lesson[]`
- `getLessonsByLevel(level: number): Lesson[]`
- `searchLessons(filter: LessonFilter): Lesson[]`
- `getLessonVocabulary(level: number, lessonNumber: number): LessonVocabulary | undefined`
- `getParsedLessonReading(level: number, lessonNumber: number): ParsedReadingData | undefined`

### 2.2. `VocabularyRepository` (`src/data/repositories/vocabularyRepository.ts`)
- `getAll(): EnrichedVocabularyItem[]`
- `getByLesson(level: number, lessonNumber: number): EnrichedVocabularyItem[]`
- `getByWord(word: string): EnrichedVocabularyItem[]`
- `getWordsContainingChar(char: string): EnrichedVocabularyItem[]`
- `search(options: VocabularyFilterOptions): EnrichedVocabularyItem[]`

### 2.3. `RadicalRepository` (`src/data/repositories/radicalRepository.ts`)
- `getAll(): CanonicalRadical[]`
- `getByNumber(num: number): CanonicalRadical | undefined`
- `getByChar(char: string): CanonicalRadical | undefined`
- `search(options: RadicalFilterOptions): CanonicalRadical[]`

### 2.4. `HanziRepository` (`src/data/repositories/hanziRepository.ts`)
- `getAll(): CanonicalHanzi[]`
- `getByChar(char: string): CanonicalHanzi | undefined`
- `getByRadical(radicalNumber: number): CanonicalHanzi[]`
- `search(options: HanziFilterOptions): CanonicalHanzi[]`

### 2.5. `DictionaryRepository` (`src/data/repositories/dictionaryRepository.ts`)
- `search(query: string, levelFilter?: number): DictionaryEntry[]`
- `getByWord(word: string): DictionaryEntry | undefined`

### 2.6. `LearnerRepository` & `ProgressRepository`
- Quản lý hồ sơ người học (Learner Profile), mục tiêu học tập (Daily Goal), thống kê tiến độ (Study Minutes, Learned Words, Completed Lessons) lưu trữ cục bộ với cơ chế khôi phục lỗi khi `localStorage` bị hỏng.

---

## 3. Kiến trúc Giao tiếp Âm thanh & Dịch vụ Ngoài (External Integrations)

| Dịch vụ | Giao diện | Bảo mật & Quyền riêng tư | Xử lý lỗi |
| :--- | :--- | :--- | :--- |
| **Browser SpeechSynthesis** | `window.speechSynthesis` | Xử lý cục bộ 100% trên thiết bị, không truyền tải dữ liệu người dùng ra internet | Mã lỗi `AUDIO_003` khi thiết bị thiếu giọng đọc tiếng Trung `zh-CN` |
| **MediaRecorder Audio Input** | `navigator.mediaDevices.getUserMedia` | Chỉ yêu cầu quyền micro khi người dùng bấm ghi âm; dữ liệu chỉ lưu trong bộ nhớ tạm | Thông báo rõ ràng: "Đã ghi âm — chưa có hệ thống chấm phát âm tự động" |
| **External TTS Proxy** | `/api/tts` (Tùy chọn cho Cloud) | Không bao giờ lưu API key trong mã nguồn frontend | Chuyển mạch an toàn về BrowserTTSProvider nếu proxy không khả dụng |
