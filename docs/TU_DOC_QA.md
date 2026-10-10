# YUYAN — "TỰ ĐỌC" & LOCKED FRAME TRANSITION QA REPORT

**Date:** October 4, 2026  
**Role:** Senior Software Engineer + Principal QA Engineer  
**Scope:** Full Root-Cause Trace, Audio Subsystem Hardening, Locked Frame Transition Implementation, and Verification  

---

## 1. EXECUTIVE SUMMARY

An end-to-end engineering audit and repair was performed on the YUYAN lesson reading module, focusing on the **"TỰ ĐỌC"** (Self-Reading) functionality and the **Locked Single-Sentence Frame Transition** (Sections 32–42). All 10 automated test suites executed via Headless Microsoft Edge CDP passed with **100% success rate, 0 console errors, and 0 horizontal overflow**.

In addition, the **Future-Proof Pinyin Database Specification Contract** (`docs/PINYIN_DATABASE_SPEC.md`) was authored without modifying the existing authoritative HSK dataset (146 lessons, 9,178 sentences remain 100% untouched).

---

## 2. ROOT-CAUSE ANALYSIS OF "TỰ ĐỌC" DEFECTS

Prior to this intervention, the "TỰ ĐỌC" feature exhibited several critical architectural flaws:

```
[Defect Trace Before Fix]
Button ("TỰ ĐỌC")
  └──> Event (onClick)
        └──> Mode State ('self')
              ├──> Falsely treated only as a visibility toggle (hide Pinyin/Vi)
              ├──> Rendered inside an unconstrained vertical space-y-4 list
              └──> Audio Call:
                    ├──> No request ID token to kill stale async callbacks
                    ├──> Rapid clicking caused queue collision & overlapping utterances
                    └──> Voices loaded only once without voiceschanged listener
```

### Identified Root Causes:
1. **Semantic Misalignment:** "TỰ ĐỌC" was coded merely as a boolean switch (`showPinyin: false, showVietnamese: false`) inside an endless scrolling list, rather than activating a dedicated, focused single-sentence self-reading environment.
2. **Missing Stable Viewport / Frame Transition:** All sentences were laid out in a raw DOM flow. Toggling visibility or changing sentences caused page jumps and layout reflow.
3. **Web Speech API Stale Callback Race:** When the user rapidly changed sentences or clicked audio multiple times, previous utterances fired asynchronous `onend` and `onerror` callbacks after the new utterance started, corrupting `isSpeaking` state and inadvertently advancing the queue.
4. **Voice Loading Fragility:** `SpeechSynthesis.getVoices()` was evaluated synchronously on init. On systems where voices populate asynchronously, Chinese voices were temporarily missing, and listeners lacked proper multi-event registration.

---

## 3. ARCHITECTURAL REPAIRS & IMPLEMENTATION

### 3.1 Audio Subsystem Hardening (`browserTTSProvider.ts` & `audioManager.ts`)
- **Monotonic Request ID Token:** Added `currentRequestId` tracking. Utterance callbacks (`onstart`, `onend`, `onerror`) verify `this.currentRequestId === requestId` before committing any state mutation.
- **Immediate Cancellation:** Called `window.speechSynthesis.cancel()` before preparing any new utterance.
- **Robust `voiceschanged` Listener:** Implemented both `addEventListener('voiceschanged', ...)` and `onvoiceschanged = ...` to reload voices dynamically.
- **Truthful Mandarin Voice Requirement:** Guaranteed that only verified `zh-CN` / Mandarin voices are used. If unavailable, the system produces the exact truthful guidance:
  > *"Thiết bị chưa có giọng đọc tiếng Trung phù hợp."*
- **Empty Speech Text Guard:** Checks for empty/whitespace dialogue and warns cleanly without crashing.
- **Speaker Prefix Stripping:** Automatically splits on `：` to ensure speaker names (e.g. `周宇航：`) are never vocalized.

### 3.2 Locked Single-Sentence Reading Viewport (`LockedReadingFrame.tsx`)
Implemented the exact design specified in Sections 32–42:
- **Stable Viewport:** The outer container has a fixed, stable boundary with `overflow-hidden`. The page itself **does not scroll**.
- **Cohesive Object Movement:** Frame + speaker + Hanzi + Pinyin + Vietnamese + audio controls move together as **ONE cohesive object** using hardware-accelerated CSS `transform` and `opacity` (300ms smooth transition).
- **Next Sentence Peek Card:** The subsequent sentence is partially visible at the bottom of the viewport (scale 0.98, opacity 0.65). Clicking it promotes it directly to the active position.
- **Self-Reading Helper Hints:** In "TỰ ĐỌC" mode, Pinyin and Vietnamese are hidden by default to test learner recall, with interactive "Hiện gợi ý Pinyin" and "Hiện nghĩa Tiếng Việt" reveal buttons directly on the active card.
- **Stepper & Quick Sentence Scrubber:** Features a sentence counter (`Câu 03 / 33`), [Câu trước], [Câu tiếp theo], and numeric scrubber pills `[1] [2] [3]...` for instant jumping.
- **Layout Switcher:** Added a seamless switcher (`Khung từng câu` vs `Toàn bài`) in `StudyControls.tsx` allowing learners to alternate between the focused locked frame and the complete document list.

---

## 4. AUTOMATED CDP VERIFICATION MATRIX

The test suite (`scratch/tu_doc_and_frame_qa.mjs`) was executed against the live application running on Edge Headless:

| # | Test Scenario | Expected Outcome | Actual Outcome | Verdict |
|---|---|---|---|:---:|
| 1 | **Tự đọc Mode Activation** | Mode state activates, locked frame renders, Hanzi visible, Pinyin/Vi hidden | `H: true, P: false, V: false`, frame loaded | **PASSED** |
| 2 | **Locked Frame Next Transition** | Card 1 translates out; Card 2 takes active position | Active card index = `2`, Hanzi verified | **PASSED** |
| 3 | **Locked Frame Prev Transition** | Card 2 translates down; Card 1 returns to active position | Active card index = `1`, Hanzi verified | **PASSED** |
| 4 | **Quick Sentence Scrubber** | Clicking pill `3` immediately activates sentence 3 | Active card index = `3` | **PASSED** |
| 5 | **Active Sentence Audio Play** | Clicks audio button; triggers Mandarin audio without prefix | Audio requested, `Đang phát âm` badge shown | **PASSED** |
| 6 | **Rapid Audio Click Safety** | 3 rapid clicks on audio button; 0 duplicate queues or errors | Zero race condition, 0 console errors | **PASSED** |
| 7 | **Study Modes Compliance** | `learn` (H+P+V on), `self` (H on, P+V off), `test` (H on, P+V off) | All 3 modes verified in DOM | **PASSED** |
| 8 | **8 Visibility Permutations** | All $2^3 = 8$ combinations of H/P/V toggle cleanly in frame | All 8 permutations passed | **PASSED** |
| 9 | **Responsive Viewports** | Mobile (390x844) & Desktop (1440x900) have no horizontal overflow | `scrollWidth <= innerWidth` on both | **PASSED** |
| 10 | **Dark Mode Aesthetics** | Dark mode class activates; high contrast typography and cards | Verified via screenshots and CSS | **PASSED** |

---

## 5. ARTIFACTS GENERATED

1. `qa_desktop_tudoc_frame.png` — High-resolution desktop screenshot of the Locked Single-Sentence Reading Frame in light mode.
2. `qa_desktop_tudoc_dark.png` — Desktop screenshot of the Locked Reading Frame in dark mode.
3. `qa_mobile_tudoc_frame.png` — Mobile view (390x844) displaying responsive layout.
4. `docs/PINYIN_DATABASE_SPEC.md` — 13-chapter future-proof Pinyin database specification and data contract.

---

## 6. FINAL VERDICT

- **"TỰ ĐỌC" Mode:** **STABLE & PRODUCTION READY**
- **Locked Frame Transition:** **STABLE & PRODUCTION READY**
- **Audio Subsystem:** **HARDENED WITH REQUEST ID TOKENS**
- **Authoritative Data:** **100% UNTOUCHED (0 HSK MODIFICATIONS)**
- **Console Errors:** **0**
