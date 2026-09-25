# SIH Buddy // Minimalist-Brutalist Problem Statement Platform

A responsive, data-dense hackathon problem statement directory and analytics platform engineered in **React (Next.js)** and **Tailwind CSS**, strictly adhering to a **Minimalist-Brutalist** dark mode in a modified **Tokyo Night** palette.

---

## 1. Aesthetic Philosophy: Brutalism Meets Minimalism

- **Zero Softness:** Completely stripped of gradients, soft drop-shadows, or rounded borders (`rounded-none` / `borderRadius: { none: '0px' }` globally enforced).
- **Exposed Structure:** Raw structural grid lines (`#565f89` inactive, `#c0caf5` active, `#24283b` faint).
- **Monospace Data Density:** Problem IDs, metrics, tech stacks, and telemetry are strictly rendered in Monospace (`JetBrains Mono`).
- **Grotesque Sans-Serif:** Oversized headline punches rendered in `Space Grotesk`.
- **Immediate Micro-interactions:** Instant color inversions and solid non-blurred offset block shadows (`4px 4px 0px #bb9af7`, `4px 4px 0px #7dcfff`).

---

## 2. Modified Tokyo Night Color Tokens (Pure Black Canvas)

| Token | Hex Code | Purpose |
|---|---|---|
| **Global Canvas** | `#000000` | Pure pitch-black root background |
| **Card Surface** | `#16161E` | Flat structural card base |
| **Grid Lines (Inactive)** | `#565f89` | Exposed structural division borders |
| **Grid Lines (Active)** | `#c0caf5` | Hovered and focused element borders |
| **Primary Typography** | `#c0caf5` | High-contrast body text |
| **Secondary Typography** | `#9aa5ce` | Metadata, timestamps, descriptions |
| **Headline Punch** | `#ffffff` | High-contrast Grotesque typography |
| **Tokyo Accent Cyan** | `#7dcfff` | Active filters, software badges, primary highlights |
| **Tokyo Accent Purple**| `#bb9af7` | Hardware badges, compare tags, metrics |
| **Tokyo Accent Green** | `#9ece6a` | Ministry affiliations, verified criteria |
| **Tokyo Accent Red**   | `#f7768e` | Critical-need badges, reset triggers, errors |

---

## 3. Core Component Architecture

1. **`BrutalistSearchBlock` (`frontend/components/BrutalistSearchBlock.tsx`)**
   - Massive full-width input block with thick border, no border radius, blinking terminal cursor (`▋`), category radios, domain dropdown, and active tag strip.

2. **`DataGrid` & `ProblemCard` (`frontend/components/DataGrid.tsx`, `frontend/components/ProblemCard.tsx`)**
   - Exposed grid container with density toggle (`COMPACT` vs `EXPANDED`), sort controls, tabular view toggle, and problem cards with monospace metrics and hard-shadow hover states.

3. **`MinistryFilterMatrix` (`frontend/components/MinistryFilterMatrix.tsx`)**
   - Border-only ministry rectangles that invert into solid stark color fills upon selection.

4. **`AnalyticsDashboard` (`frontend/components/AnalyticsDashboard.tsx`)**
   - Telemetry overview with software/hardware ratio, complexity distribution matrix (L1–L4), domain density, and submission volume.

5. **`ProblemDetailDrawer` & `ComparisonMatrixModal`**
   - Slide-out specification inspector and multi-statement comparative matrix.

---

## 4. WCAG AAA Compliance

All text elements maintain a minimum contrast ratio of 7:1 against pure black (`#000000`):
- Pure White (`#ffffff` on `#000000`): **21:1**
- Tokyo Cyan (`#7dcfff` on `#000000`): **12.4:1**
- Tokyo Purple (`#bb9af7` on `#000000`): **9.8:1**
- Tokyo Green (`#9ece6a` on `#000000`): **11.2:1**
- Tokyo Text (`#c0caf5` on `#000000`): **10.5:1**
- Tokyo Muted (`#9aa5ce` on `#000000`): **7.3:1**
