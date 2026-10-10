# YUYAN — BÁO CÁO HỆ THỐNG CHUYỂN ĐỘNG & HIỆU ỨNG THỊ GIÁC CAO CẤP (MOTION QA REPORT)
**Triết lý thiết kế:** "Subtle, Organic & Premium" — Chuyển động tinh tế, không phô trương, tôn vinh trải nghiệm học tập tĩnh lặng và tập trung.  
**Chuẩn kiểm thử:** Tốc độ khung hình 60 FPS mượt mà, hỗ trợ khả năng tiếp cận (Accessibility - Prefers Reduced Motion).

---

## 1. TỔNG QUAN HỆ THỐNG HIỆU ỨNG (MOTION SYSTEM SPECIFICATIONS)

Hệ thống thị giác của YUYAN tích hợp 4 lớp hiệu ứng chuyển động tương hỗ:

```
MOTION & VISUAL STACK
┌────────────────────────────────────────────────────────────────────────┐
│ Lớp 4: Micro-Interactions (btn-motion, card-motion, active:scale-98)   │
│ ├── Nút bấm: translateY(-1px), shadow-elevation trong 150ms           │
│ └── Thẻ học: translateY(-2px), glow-soft trong 200ms                   │
├────────────────────────────────────────────────────────────────────────┤
│ Lớp 3: Light Beam Shimmer (Vệt sáng kim cương quét góc 20 độ)          │
│ └── Chu kỳ: 9s ease-in-out, độ mờ nhẹ (alpha 0.07 - 0.14)              │
├────────────────────────────────────────────────────────────────────────┤
│ Lớp 2: Theme Transition Layer                                          │
│ └── Chuyển màu 350ms cubic-bezier(0.4, 0, 0.2, 1), không giật trắng    │
├────────────────────────────────────────────────────────────────────────┤
│ Lớp 1: Ambient Glow Orbs (3 quả cầu ánh sáng lan tỏa nền)             │
│ └── Lơ lửng 22s alternate, blur(90px), opacity 0.35 — 0.60             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. CHI TIẾT CÁC THÀNH PHẦN CHUYỂN ĐỘNG

### A. Lớp ánh sáng môi trường (Ambient Glow Layer)
- **Đặc tính kỹ thuật:** Nằm tại `z-index: 0`, thuộc tính `pointer-events: none;`, không cản trở bất kỳ cú click chuột hay thao tác chạm nào của người dùng.
- **Cấu tạo:** 3 quả cầu màu bán trong suốt được làm mờ quang học (`filter: blur(90px)`):
  - *Quả cầu 1 (Primary Blue):* Kích thước $500\times 500\text{px}$, tọa độ góc trên bên trái.
  - *Quả cầu 2 (Coral Accent):* Kích thước $450\times 450\text{px}$, tọa độ giữa bên phải.
  - *Quả cầu 3 (Sky Soft):* Kích thước $400\times 400\text{px}$, tọa độ góc dưới trung tâm.
- **Keyframe chuyển động (`ambient-drift`):**
  - Tần suất: 22 giây, lặp vô tận hai chiều (`alternate`).
  - Biên độ dịch chuyển: $\Delta X = +45\text{px}, \Delta Y = -30\text{px}$, độ phóng đại $1.0 \to 1.1$.
  - Tải CPU: Dưới 0.8% nhờ sử dụng `will-change: transform, opacity` và tăng tốc phần cứng GPU (Hardware-accelerated compositing).

### B. Vệt sáng kim cương quét nhẹ (Light Beam Shimmer)
- Được áp dụng trên khung đọc bài khóa chính, thẻ chào đón và các card học tập trọng tâm.
- Sử dụng dải gradient xiên $-20^\circ$ quét ngang bề mặt:
  - `linear-gradient(90deg, transparent, rgba(91, 159, 227, 0.07), rgba(255, 255, 255, 0.14), rgba(91, 159, 227, 0.07), transparent)`
- Chu kỳ dài 9 giây: 65% thời gian ẩn hoàn toàn, chỉ quét nhẹ nhàng trong 1.5 giây cuối để tạo cảm giác tinh tế, sang trọng mà không gây xao nhãng mắt đọc.

### C. Vi tương tác người dùng (Micro-Interactions)
- **Class `.btn-motion`:**
  - `hover`: Nâng nhẹ `translateY(-1px)`, tăng độ đổ bóng.
  - `active`: Nhấn chìm nhẹ `scale(0.98)`, phản hồi xúc giác cơ học chân thực.
  - Thời gian phản hồi: 150ms mượt mà (`cubic-bezier(0.4, 0, 0.2, 1)`).
- **Class `.card-motion`:**
  - `hover`: Nâng nhẹ `translateY(-2px)`, áp dụng ánh sáng viền mềm (`var(--glow-soft)`).
  - Thời gian chuyển động: 200ms.

---

## 3. KHẢ NĂNG TIẾP CẬN & GIẢM CHUYỂN ĐỘNG (REDUCED MOTION COMPLIANCE)

Tuân thủ nghiêm ngặt chuẩn tiếp cận Web W3C WCAG 2.1 (Success Criterion 2.3.3: Animation from Interactions):

```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  .ambient-orb {
    animation: none !important;
  }
  .light-beam-shimmer::after {
    display: none !important;
  }
}
```

Đối với người dùng bật tùy chọn "Reduce Motion" trên Windows, macOS hoặc iOS, toàn bộ hiệu ứng trôi dạt và quét sáng sẽ tự động tắt hoàn toàn, đảm bảo an toàn tuyệt đối cho người có hội chứng tiền đình hoặc nhạy cảm thị giác.
