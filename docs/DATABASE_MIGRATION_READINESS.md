# YUYAN — Kế hoạch & Sẵn sàng Chuyển đổi Cơ sở Dữ liệu (Database Migration Readiness)

> **Dự án:** YUYAN (语言)  
> **Tài liệu:** Đề án & Kịch bản Chuyển đổi Dữ liệu lên Hệ quản trị CSDL Quan hệ (PostgreSQL / SQLite)  
> **Mã văn bản:** `DOC-MIG-013`  
> **Trạng thái:** Sẵn sàng Triển khai (`PRODUCTION_READY`)

---

## 1. Mục tiêu Chuyển đổi

Hiện tại, YUYAN đang chạy trên tầng Repository trừu tượng nạp dữ liệu từ các tệp JSON tĩnh và IndexedDB/LocalStorage. Kiến trúc Repository độc lập này cho phép hệ thống chuyển đổi trực tiếp sang Cơ sở dữ liệu quan hệ (PostgreSQL / SQLite) hoặc Supabase / Cloud SQL mà **không cần sửa đổi bất kỳ dòng mã nào trong tầng giao diện UI**.

---

## 2. Lược đồ Cơ sở Dữ liệu Chuẩn hóa (PostgreSQL DDL Schemas)

```sql
-- ========================================================
-- 1. BẢNG 214 BỘ THỦ KHANG HY (radicals)
-- ========================================================
CREATE TABLE kangxi_radicals (
    radical_number INT PRIMARY KEY CHECK (radical_number BETWEEN 1 AND 214),
    char VARCHAR(10) NOT NULL,
    name_zh VARCHAR(50) NOT NULL,
    name_vi VARCHAR(100) NOT NULL,
    meaning TEXT NOT NULL,
    stroke_count INT NOT NULL CHECK (stroke_count BETWEEN 1 AND 17),
    variants TEXT[] DEFAULT '{}',
    semantic_category VARCHAR(100) NOT NULL,
    mnemonic TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_radicals_stroke ON kangxi_radicals(stroke_count);
CREATE INDEX idx_radicals_category ON kangxi_radicals(semantic_category);

-- ========================================================
-- 2. BẢNG CHỮ HÁN CHUẨN HÓA (hanzi)
-- ========================================================
CREATE TABLE canonical_hanzi (
    char VARCHAR(10) PRIMARY KEY,
    traditional VARCHAR(10) NOT NULL,
    radical_number INT NOT NULL REFERENCES kangxi_radicals(radical_number),
    stroke_count INT NOT NULL,
    pinyin TEXT[] NOT NULL,
    meanings TEXT[] NOT NULL,
    structure VARCHAR(50) NOT NULL,
    structure_name_vi VARCHAR(100) NOT NULL,
    decomposition VARCHAR(50),
    stroke_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    hsk_levels INT[] NOT NULL DEFAULT '{}',
    mnemonic TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hanzi_radical ON canonical_hanzi(radical_number);
CREATE INDEX idx_hanzi_stroke ON canonical_hanzi(stroke_count);
CREATE INDEX idx_hanzi_levels ON canonical_hanzi USING GIN(hsk_levels);

-- ========================================================
-- 3. BẢNG GIÁO TRÌNH BÀI HỌC HSK (lessons)
-- ========================================================
CREATE TABLE hsk_lessons (
    lesson_id VARCHAR(50) PRIMARY KEY,
    level INT NOT NULL CHECK (level BETWEEN 1 AND 6),
    lesson_number INT NOT NULL CHECK (lesson_number BETWEEN 1 AND 50),
    title VARCHAR(255) NOT NULL,
    source_file VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_level_lesson UNIQUE (level, lesson_number)
);

-- ========================================================
-- 4. BẢNG CÂU BÀI KHÓA (sentences)
-- ========================================================
CREATE TABLE lesson_sentences (
    id VARCHAR(100) PRIMARY KEY,
    lesson_id VARCHAR(50) NOT NULL REFERENCES hsk_lessons(lesson_id) ON DELETE CASCADE,
    sentence_index INT NOT NULL,
    hanzi TEXT NOT NULL,
    pinyin TEXT NOT NULL,
    vietnamese TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_lesson_sentence UNIQUE (lesson_id, sentence_index)
);

CREATE INDEX idx_sentences_lesson ON lesson_sentences(lesson_id);
-- Chỉ mục GIN phục vụ tra cứu toàn văn chữ Hán
CREATE INDEX idx_sentences_hanzi_trgm ON lesson_sentences USING gin (hanzi gin_trgm_ops);

-- ========================================================
-- 5. BẢNG TỪ VỰNG HSK (vocabulary)
-- ========================================================
CREATE TABLE hsk_vocabulary (
    id VARCHAR(100) PRIMARY KEY,
    lesson_id VARCHAR(50) REFERENCES hsk_lessons(lesson_id),
    stt INT,
    hanzi VARCHAR(100) NOT NULL,
    pinyin VARCHAR(150) NOT NULL,
    part_of_speech VARCHAR(50),
    vietnamese TEXT NOT NULL,
    collocations TEXT,
    hsk_level INT NOT NULL CHECK (hsk_level BETWEEN 1 AND 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vocab_hanzi ON hsk_vocabulary(hanzi);
CREATE INDEX idx_vocab_level ON hsk_vocabulary(hsk_level);

-- ========================================================
-- 6. BẢNG BÀI ĐỌC HIỂU (reading_passages)
-- ========================================================
CREATE TABLE reading_passages (
    lesson_id VARCHAR(50) PRIMARY KEY REFERENCES hsk_lessons(lesson_id) ON DELETE CASCADE,
    level INT NOT NULL,
    lesson_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    hanzi TEXT NOT NULL,
    pinyin TEXT NOT NULL,
    vietnamese TEXT NOT NULL,
    vocabulary_reappeared TEXT,
    comprehension_questions JSONB DEFAULT '[]'::jsonb
);

-- ========================================================
-- 7. BẢNG SỔ TAY CÂU SAI CỦA HỌC VIÊN (learner_mistakes)
-- ========================================================
CREATE TABLE learner_mistakes (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    prompt TEXT NOT NULL,
    selected_answer TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mistakes_user ON learner_mistakes(user_id, resolved);
```

---

## 3. Chiến lược Di chuyển Dữ liệu Không Gián đoạn (Zero-Downtime Migration)

1. **Giai đoạn 1 (Hiện tại):** Client-side Repositories đọc từ dữ liệu tĩnh JSON và localStorage. Đã hoạt động độc lập, không có lỗi.
2. **Giai đoạn 2 (Tạo Backend API):** Khởi tạo API REST/GraphQL kết nối PostgreSQL sử dụng các DDL schema ở trên.
3. **Giai đoạn 3 (Switch Provider):** Đổi triển khai nội bộ của các lớp Repository trong `src/data/repositories/` từ đọc file JSON sang gọi `fetch('/api/v1/...')`. Không ảnh hưởng đến bất kỳ thành phần React UI nào.
