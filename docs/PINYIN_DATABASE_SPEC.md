# YUYAN — PINYIN DATABASE FUTURE-PROOF SPECIFICATION & DATA CONTRACT

> **Status:** ARCHITECTURE PLANNING & SPECIFICATION ONLY  
> **Scope:** Conceptual Data Contract for Future Pinyin Domain Implementation  
> **Strict Boundaries:** DO NOT implement database yet • DO NOT seed data • DO NOT create bulk audio • DO NOT modify 146 HSK lessons • DO NOT alter existing HSK source database  

---

## 1. PURPOSE & ARCHITECTURAL OBJECTIVE

Currently, the YUYAN Chinese-learning platform does not have an independent, fully normalized Pinyin database. This document serves as the formal **Data Contract & Architecture Specification** to ensure that when the Pinyin domain is constructed in the future:

1. **No major schema breaking changes** will be required across the application.
2. **The existing HSK database remains 100% intact** and requires zero modifications.
3. **No bulk Pinyin data migrations** or mass search-and-replace will be needed.
4. **The pronunciation and audio resolution engine** will have stable, deterministic interfaces.
5. **UI components** will consume a normalized linguistic model rather than ad-hoc string manipulations.

This is an **ARCHITECTURE PLANNING** specification.  
**NO real database is provisioned, NO records are seeded, NO bulk audio files are generated, and NO HSK lessons are edited under this contract.**

---

## 2. EXISTING HSK DATABASE PRESERVATION

The existing HSK curriculum database (`data/hsk/lessons.json` and related repositories) represents an authoritative, independent dataset structured as:

```json
{
  "hanzi": "学习",
  "pinyin": "xuéxí",
  "translation": "học tập"
}
```

### Architectural Invariant: Zero In-Place Pollution
The future Pinyin system must consume this existing representation via a **Runtime Pinyin Resolver Layer** without requiring extra phonetic columns or nested structures inside every HSK lesson, vocabulary word, or dialogue sentence.

```
┌───────────────────────────────┐
│ Existing HSK Dataset          │  (Unchanged: hanzi, pinyin, translation)
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│ Runtime Pinyin Resolver       │  (Orthography Normalizer & Linguistic Parser)
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│ Future Pinyin Domain DB       │  (Independent Normalized Phonetic Tables)
└───────────────────────────────┘
```

**Anti-Pattern Prohibited:** Copying bulky pronunciation metadata into 9,178 HSK sentences or thousands of vocabulary records.

---

## 3. INDEPENDENT PINYIN DOMAIN TOPOLOGY

The future Pinyin database shall exist as a modular, standalone domain:

```
Pinyin Domain (Future)
├── 1. Initials (声母 - Shēngmǔ)
├── 2. Finals (韵母 - Yùnmǔ)
│   ├── Simple Finals (单韵母 - Dānyùnmǔ)
│   ├── Compound Finals (复韵母 - Fùyùnmǔ)
│   └── Nasal Finals (鼻韵母 - Bíyùnmǔ)
├── 3. Syllables (音节 - Yīnjié)
├── 4. Tones (声调 - Shēngdiào: 1, 2, 3, 4, 5)
├── 5. Pronunciation Rules (Apical vowels, retroflex, etc.)
├── 6. Orthography Normalization Rules (j/q/x + ü, iou/uei/uen reductions, y/w)
└── 7. Audio Metadata & Target Resolution
```

---

## 4. LINGUISTIC MODEL: ATOMIC UNITS VS. ENGLISH LETTERS

### The Cardinal Rule
**Pinyin MUST NOT be modeled as arbitrary Latin character sequences.**  
Pinyin is a phonological transcription system for Standard Mandarin Chinese governed by:
$$\text{Syllable (音节)} = [\text{Initial (声母)}] + \text{Final (韵母)} + \text{Tone (声调)}$$

### Examples:
- **`xué` (学):**
  - Initial = `x`
  - Canonical Final = `üe`
  - Tone = `2` (阳平)
  - *(NOT `x` + `u` + `e` Latin letters)*
- **`zhōng` (中):**
  - Initial = `zh`
  - Canonical Final = `ong`
  - Tone = `1` (阴平)
  - *(NOT `z` + `h` + `o` + `n` + `g` Latin letters)*

---

## 5. INITIALS / 声母 (SHĒNGMǓ) SPECIFICATION

Standard Mandarin possesses **21 canonical consonantal initials** (plus zero-initial syllables):

| Group | Category (Articulatory) | Initials | Future Enum ID |
|:---|:---|:---:|:---:|
| Labials (双唇/唇齿) | Biliabial & Labiodental | `b`, `p`, `m`, `f` | `LABIAL` |
| Alveolars (舌尖中) | Alveolar plosives & nasals | `d`, `t`, `n`, `l` | `ALVEOLAR` |
| Velars (舌面后/舌根) | Velar stops & fricatives | `g`, `k`, `h` | `VELAR` |
| Palatals (舌面前) | Alveolo-palatal affricates | `j`, `q`, `x` | `PALATAL` |
| Retroflexes (舌尖后/翘舌) | Post-alveolar retroflex | `zh`, `ch`, `sh`, `r` | `RETROFLEX` |
| Dental Sibilants (舌尖前/平舌) | Alveolar sibilants | `z`, `c`, `s` | `DENTAL_SIBILANT` |
| Zero Initial (零声母) | Vowel-initial onset | `Ø` | `ZERO_INITIAL` |

---

## 6. FINALS / 韵母 (YÙNMǓ) SPECIFICATION

Finals are **atomic phonetic units**. Under no circumstances shall compound or nasal finals be synthesized by string-concatenating individual English letters.

The canonical classification contains **36 standard finals**:

### A. Simple Finals (单韵母 - 6 units)
`a`, `o`, `e`, `i`, `u`, `ü`

### B. Compound Finals (复韵母 - 13 units)
- Front-falling & back-falling diphthongs: `ai`, `ei`, `ao`, `ou`
- Rising diphthongs & triphthongs: `ia`, `ie`, `iao`, `iou` *(orthographic `iu`)*
- Labialized diphthongs & triphthongs: `ua`, `uo`, `uai`, `uei` *(orthographic `ui`)*
- Palatalized diphthongs: `üe`

### C. Nasal Finals (鼻韵母 - 16 units)
- Front Nasals (前鼻音 [-n]): `an`, `en`, `in`, `un` *(canonical `uen`)*, `ün`, `ian`, `uan`, `üan`
- Back Nasals (后鼻音 [-ŋ]): `ang`, `eng`, `ing`, `ong`, `iang`, `uang`, `ueng`, `iong`

### D. Special Rhotic Final (特殊韵母 - 1 unit)
- `er` (rhotacized vowel, syllables like `ér`, `ěr`, `èr`)

---

## 7. CRITICAL LINGUISTIC RULES & CONTEXTUAL DIFFERENTIATION

### 7.1 Rule for Vowel `e` Contexts
The letter `e` represents distinct phonemes depending on the final:
- In isolated `e`: Back unrounded vowel $[\gamma]$ (e.g. `gē`, `kě`).
- In `ei`: Front close-mid diphthong $[e\text{ɪ}]$ (e.g. `běi`).
- In `en`: Mid-central vowel with alveolar nasal $[ən]$ (e.g. `rén`).
- In `eng`: Back vowel with velar nasal $[aŋ] / [\gammaŋ]$ (e.g. `péng`).
- In `ie`: Front vowel following glide $[i\varepsilon]$ (e.g. `xiě`).
- In `üe`: Front vowel following rounded glide $[y\varepsilon]$ (e.g. `xué`).
- In `er`: Retroflex vowel $[\alpha\text{ɻ}]$ (e.g. `ér`).

**Design Requirement:** `e`, `ei`, `en`, `eng`, `ie`, `üe`, and `er` must each have an independent, distinct phonetic final record.

### 7.2 Rule for Vowel `a` Contexts
`a`, `ai`, `ao`, `an`, `ang`, `ia`, `iao`, `ian`, `iang`, `ua`, `uai`, `uan`, `uang`, `üan` are all distinct units.  
Specifically, $[a]$ shifts position:
- `an` $[an]$ (front-a).
- `ang` $[aŋ]$ (back-a).  
*Never construct nasal finals by evaluating `a` then appending `n` or `ng`.*

### 7.3 Nasal Distinction: Front (-n) vs Back (-ng)
- `an ≠ ang`
- `en ≠ eng`
- `in ≠ ing`
- `ian ≠ iang`
- `uan ≠ uang`
- `un (uen) ≠ ueng`

---

## 8. PHONETIC NORMALIZATION & ORTHOGRAPHY RULES

### 8.1 Reduced Triphthong & Nasal Orthography
In Standard Pinyin orthography, three finals undergo graphical reduction when preceded by an initial:
1. **`iou` $\rightarrow$ `iu`**: `l + iou` is written `liu`. Canonical final is `iou`.
2. **`uei` $\rightarrow$ `ui`**: `g + uei` is written `gui`. Canonical final is `uei`.
3. **`uen` $\rightarrow$ `un`**: `d + uen` is written `dun`. Canonical final is `uen`.

The future system must preserve canonical representation while displaying standard orthography:
$$\text{Display: } \texttt{liu} \iff \text{Canonical: } \texttt{l + iou}$$
$$\text{Display: } \texttt{gui} \iff \text{Canonical: } \texttt{g + uei}$$
$$\text{Display: } \texttt{dun} \iff \text{Canonical: } \texttt{d + uen}$$

### 8.2 Apical Vowels (舌尖元音): Special `i`
The letter `i` represents three distinct phonetic values in Standard Mandarin:
1. **Standard Palatal `i` $[i]$**: After `b, p, m, d, t, n, l, j, q, x` (e.g., `nǐ`, `tī`).
2. **Dental Apical `i` $[ɿ]$ (舌尖前元音)**: After `z, c, s` (e.g., `zǐ`, `cì`, `sī`).
3. **Retroflex Apical `i` $[ʅ]$ (舌尖后元音)**: After `zh, ch, sh, r` (e.g., `zhī`, `chī`, `shì`, `rì`).

**Contract:** The pronunciation engine must support `pronunciationClass` tags:
- `VOWEL_STANDARD_I`
- `VOWEL_APICAL_FRONT` (Dental: `z, c, s`)
- `VOWEL_APICAL_BACK` (Retroflex: `zh, ch, sh, r`)

### 8.3 The `ü` Integrity & `j / q / x` Orthography Rule
In standard spelling, umlaut `ü` is omitted after `j, q, x` because `u` never occurs with `j, q, x`:
- `ju, qu, xu` $\rightarrow$ Phonetic: `j+ü, q+ü, x+ü`.
- `jue, que, xue` $\rightarrow$ Phonetic: `j+üe, q+üe, x+üe`.
- `juan, quan, xuan` $\rightarrow$ Phonetic: `j+üan, q+üan, x+üan`.
- `jun, qun, xun` $\rightarrow$ Phonetic: `j+ün, q+ün, x+ün`.

However, after `n` and `l`, both `u` and `ü` contrast:
- `lu` (路) vs `lü` (绿).
- `nu` (怒) vs `nü` (女).

**Invariant:** Canonical representation MUST preserve `ü`. Display mapping converts `j+ü` to `ju`, but linguistic identity remains `ü`.

### 8.4 Semivowel `y` and `w` Rules
`y` and `w` are orthographic glides for syllables without consonantal initials:
- `i` series: `yi` $(i)$, `ya` $(ia)$, `ye` $(ie)$, `yao` $(iao)$, `you` $(iou)$, `yan` $(ian)$, `yang` $(iang)$, `yin` $(in)$, `ying` $(ing)$, `yong` $(iong)$.
- `u` series: `wu` $(u)$, `wa` $(ua)$, `wo` $(uo)$, `wai` $(uai)$, `wei` $(uei)$, `wan` $(uan)$, `wang` $(uang)$, `wen` $(uen)$, `weng` $(ueng)$.
- `ü` series: `yu` $(ü)$, `yue` $(üe)$, `yuan` $(üan)$, `yun` $(ün)$.

---

## 9. TONES (声调 - SHĒNGDIÀO) SPECIFICATION

Standard Mandarin tone system metadata:

| Tone # | Traditional Name | Pitch Contour | Tone Mark Example | Neutral Pitch Description |
|:---:|:---:|:---:|:---:|:---|
| 1 | 一声 / 阴平 (Yīnpíng) | 55 (High level) | `ā` | High flat |
| 2 | 二声 / 阳平 (Yángpíng) | 35 (High rising) | `á` | Mid-to-high rise |
| 3 | 三声 / 上声 (Shǎngshēng) | 214 (Low dipping) | `ǎ` | Low dip (211 in sandhi) |
| 4 | 四声 / 去声 (Qùshēng) | 51 (High falling) | `à` | Sharp drop |
| 5 | 轻声 / 轻声 (Qīngshēng) | Variable neutral | `a` (no mark) | Short, light, pitch follows preceding tone |

Tone numbers `1..5` must be stored as discrete metadata rather than concatenated onto the root final string.

---

## 10. CONCEPTUAL DATA SCHEMA (TYPESCRIPT CONTRACT ONLY)

```typescript
/**
 * YUYAN Conceptual Pinyin Domain Model (Data Contract Only)
 * DO NOT INSTANTIATE AS A LIVE DATABASE IN CURRENT SCOPE
 */

export type InitialCategory = 
  | 'LABIAL'
  | 'ALVEOLAR'
  | 'VELAR'
  | 'PALATAL'
  | 'RETROFLEX'
  | 'DENTAL_SIBILANT'
  | 'ZERO_INITIAL';

export type FinalCategory = 
  | 'SIMPLE'
  | 'COMPOUND'
  | 'FRONT_NASAL'
  | 'BACK_NASAL'
  | 'SPECIAL';

export type PronunciationClass =
  | 'STANDARD'
  | 'APICAL_FRONT'    // zi, ci, si
  | 'APICAL_BACK'     // zhi, chi, shi, ri
  | 'RETROFLEX_RHOTIC'// er
  | 'NEUTRAL_TONE';

export interface PinyinInitialSchema {
  id: string;               // e.g. "init_zh"
  symbol: string;           // "zh"
  category: InitialCategory;
  ipa: string;              // "[ʈʂʰ]"
  displayOrder: number;
  descriptionVi: string;    // "Âm uốn lưỡi (đầu lưỡi chạm ngạc cứng)"
}

export interface PinyinFinalSchema {
  id: string;               // e.g. "final_ue"
  canonicalSymbol: string;  // "üe"
  displaySymbol: string;    // "üe" (or "ue" when bound to j/q/x)
  category: FinalCategory;
  ipa: string;              // "[yɛ]"
  isNasal: boolean;
  reducedFormFrom?: string; // "iou" -> "iu"
  contextNotesVi?: string;
}

export interface PinyinSyllableSchema {
  id: string;                  // e.g. "syl_xue_2"
  displayPinyin: string;       // "xué"
  displayPinyinAscii: string;  // "xue2"
  canonicalInitial: string;    // "x"
  canonicalFinal: string;      // "üe"
  tone: 1 | 2 | 3 | 4 | 5;
  pronunciationClass: PronunciationClass;
  isStandardOrthography: boolean;
}

export interface PronunciationTargetSchema {
  type: 'INITIAL' | 'FINAL' | 'SYLLABLE' | 'TONE' | 'CARRIER_EXAMPLE';
  targetSymbol: string;        // The exact sound being evaluated
  displayLabel: string;        // What the learner sees
  isCarrierExample: boolean;   // True if audio represents a whole word rather than pure phoneme
  audioUrl?: string;           // Verified native Mandarin asset URL
  status: 'VERIFIED' | 'MISSING' | 'PENDING';
}
```

---

## 11. RUNTIME PINYIN RESOLVER PIPELINE (FUTURE ARCHITECTURE)

When HSK or Vocabulary data is parsed, the resolver executes the following pipeline:

```
HSK Pinyin String ("xuéxí")
        │
        ▼ Step 1: Syllable Segmentation
["xué", "xí"]
        │
        ▼ Step 2: Tone Mark Extraction
["xue", tone: 2], ["xi", tone: 2]
        │
        ▼ Step 3: Longest Valid Initial Match
Initial: "x", Remainder: "ue"
        │
        ▼ Step 4: Orthography Normalization
"x" + "ue" ──(j/q/x rule)──> Canonical Final: "üe"
        │
        ▼ Step 5: Canonical Syllable Resolution
Canonical: { initial: "x", final: "üe", tone: 2 }
        │
        ▼ Step 6: Audio Target Dispatch
Target: Standard Mandarin zh-CN
```

---

## 12. MANDARIN AUDIO QUALITY & INTEGRITY RULES

1. **Native Mandarin Requirement:** Speech synthesis and audio assets must exclusively target Standard Mandarin (`zh-CN` / 普通话). Under no circumstance may English or default fallback voices be used for Chinese phonemes.
2. **Carrier vs Exact Distinction:** An audio recording of `mā` (妈) is a `CARRIER_EXAMPLE`, NOT the pure isolated audio of Initial `m`. The database schema must explicitly separate isolated phoneme assets from carrier example assets.
3. **Truthful Error Handling:** If no native Mandarin audio source is available on the client device, the system displays:
   > *"Thiết bị chưa có giọng đọc tiếng Trung phù hợp."*  
   with retry and OS language pack guidance.

---

## 13. COMPLIANCE & VERIFICATION CHECKLIST

- [x] **HSK Database Integrity:** 146 HSK lessons and all JSON repositories remain untouched.
- [x] **No Premature Implementation:** Zero database migrations or fake seed records created.
- [x] **Phonetic Model Soundness:** Initials, finals, syllables, and tones are modeled as linguistically sound atomic units.
- [x] **Orthographic Rules Documented:** Covers `e` contexts, `a` contexts, nasal front/back pairs, `iou/uei/uen` reductions, apical `i` front/back, and `j/q/x + ü` normalization.
- [x] **Ready for Future Implementation:** Provides an immutable specification for any developer building the Pinyin database.
