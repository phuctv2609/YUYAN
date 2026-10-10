# YUYAN — Bản đồ Miền Dữ liệu (Database Domain Map / DDD Architecture)

> **Dự án:** YUYAN (语言)  
> **Tài liệu:** Thiết kế Kiến trúc Hướng miền (Domain-Driven Design - DDD Bounded Contexts)  
> **Mã văn bản:** `DOC-DOM-010`  
> **Trạng thái:** Hoàn thiện (`PRODUCTION_READY`)

---

## 1. Phân định Miền Giới hạn (Bounded Contexts)

Hệ thống YUYAN được phân tách thành 6 Bounded Contexts độc lập, đảm bảo nguyên lý trách nhiệm đơn lẻ (Single Responsibility Principle) và khả năng mở rộng lên cơ sở dữ liệu phân tán (PostgreSQL / SQLite / IndexedDB):

```mermaid
graph TB
    subgraph Curriculum_Domain["1. Miền Giáo trình & Ngữ liệu (Curriculum Domain)"]
        LessonAgg[Lesson Aggregate]
        SentenceEntity[Sentence Entity]
        ReadingPassage[Reading Passage Entity]
    end

    subgraph Orthography_Domain["2. Miền Ký tự & Bộ thủ (Orthography Domain)"]
        RadicalEntity[Radical Entity]
        HanziAggregate[Canonical Hanzi Aggregate]
        StrokePathValue[Stroke Path Value Object]
    end

    subgraph Lexicology_Domain["3. Miền Từ vựng & Từ điển (Lexicology Domain)"]
        VocabularyItem[Vocabulary Item Entity]
        DictionaryEntry[Dictionary Entry Aggregate]
        CollocationVO[Collocation Value Object]
    end

    subgraph Learner_Domain["4. Miền Học viên & Tiến độ (Learner & Progress Domain)"]
        LearnerProfile[Learner Profile Aggregate]
        StudySession[Study Session Entity]
        DailyGoalVO[Daily Goal Value Object]
    end

    subgraph Mistake_Domain["5. Miền Phân tích Lỗi sai (Mistake Tracking Domain)"]
        MistakeRecord[Mistake Record Aggregate]
        ErrorCategoryVO[Error Category Value Object]
    end

    subgraph Audio_Domain["6. Miền Dịch vụ Âm thanh (Audio Subsystem Domain)"]
        AudioTrack[Audio Track Value Object]
        AudioStateStore[Audio State Observable]
        AudioCacheLRU[Audio Cache LRU Store]
    end

    Curriculum_Domain --> Orthography_Domain
    Curriculum_Domain --> Lexicology_Domain
    Lexicology_Domain --> Orthography_Domain
    Curriculum_Domain --> Mistake_Domain
    Learner_Domain --> Mistake_Domain
    Curriculum_Domain --> Audio_Domain
    Lexicology_Domain --> Audio_Domain
    Orthography_Domain --> Audio_Domain
```

---

## 2. Chi tiết Từng Bounded Context

### 2.1. Curriculum Domain (Miền Giáo trình)
- **Aggregate Root:** `Lesson`
- **Thực thể con:** `Sentence`, `LessonSection`, `ReadingPassage`
- **Bất biến (Invariants):** Một bài học phải có ít nhất 1 câu bài khóa; thứ tự câu `index` là số nguyên tăng dần liên tục bắt đầu từ 1.

### 2.2. Orthography Domain (Miền Ký tự & Bộ thủ)
- **Aggregate Root:** `CanonicalHanzi`
- **Thực thể tham chiếu:** `CanonicalRadical`
- **Value Objects:** `StrokePath`, `CharacterDecomposition`
- **Bất biến:** Mọi chữ Hán phải thuộc về một bộ thủ Khang Hy hợp lệ từ 1 đến 214; số nét `strokeCount` phải bằng độ dài danh sách `strokeData`.

### 2.3. Lexicology Domain (Miền Từ vựng)
- **Aggregate Root:** `DictionaryEntry`
- **Thực thể con:** `EnrichedVocabularyItem`
- **Value Objects:** `PartOfSpeech`, `Collocation`
- **Bất biến:** Từ vựng phải có phiên âm Pinyin và nghĩa tiếng Việt không rỗng.

### 2.4. Learner & Progress Domain (Miền Học viên)
- **Aggregate Root:** `LearnerProfile`
- **Thực thể con:** `ProgressRecord`, `DailyStreak`
- **Bất biến:** Thời gian học tập `studyMinutes` và số từ đã thuộc không được là số âm.

### 2.5. Mistake Tracking Domain (Miền Lỗi sai)
- **Aggregate Root:** `LearnerMistake`
- **Bất biến:** Lỗi sai phải ghi nhận đáp án người dùng đã chọn và đáp án đúng thực tế của bài tập.
