# Design System — Drift Cleanup (status)

Companion to `design-system-audit.md`. This tracks the token-drift migration.
As of this pass, **all safe snapping is done** — see below. What's left is a
short list of deliberate keeps.

---

## Done — no visual change

### Structure
| Change | Scope |
|---|---|
| `GripIcon` re-exported from `icons/index.ts` | 1 file |
| All `:root` blocks → `src/styles/tokens.css`; `globals.css` `@import`s it | 2 files |
| Deprecated `.hintText` / `.sectionLabel` / `.btnPrimary` / `.btnSecondary` removed | globals.css |
| `--radius-block` / `--radius-row` aliases deleted | tokens.css |

### New scales in tokens.css
| Token(s) | Notes |
|---|---|
| `--space-1..16` (incl. new `--space-7: 1.75rem`) | 4px base |
| `--duration-fast/base/enter/exit/pop/aha/spring/spin` | 1:1 with existing durations |
| `--ease-base/spring/overshoot` | |
| `--shadow-focus` | dedupes the repeated focus wash |
| `--text-meta-size` (0.8125rem) · `--text-kicker-size` (0.6875rem) | size-only; consumers keep their own weight/tracking |

### Exact swaps (0px delta)
- `border-radius: 999px` → `var(--radius-full)` — 20 sites
- `border-radius: 0.75rem` → `var(--radius-md)` — auth-form
- raw `120/160/180/220/260/420/700ms` → `var(--duration-*)` — 61 sites / 15 files
- `cubic-bezier(0.22,1,0.36,1)` → `var(--ease-spring)`; `cubic-bezier(0.16,1,0.3,1)` → `var(--ease-overshoot)`
- `rgba(122,58,32,0.12)` → `var(--accent-soft)`; `rgba(0,0,0,0.28)` → `color-mix(#000 28%)`
- `0 0 0 3px var(--accent-soft)` → `var(--shadow-focus)` — 2 sites

### Snapped (≤2px delta)

**Radius** — 5 sites
| Was | Now | Δ |
|---|---|---|
| `0.65rem` (backlog) | `--radius-md` | +1.6px |
| `0.85rem` ×2 (archive-date-picker) | `--radius-md` | −1.6px |
| `1.25rem` ×2 (auth-shell, backlog) | `--radius-lg` | −2px |

**Font size** — 56 declarations
| Was | Now | Δ |
|---|---|---|
| `0.625rem` | `--text-kicker-size` (0.6875) | +1px |
| `0.6875rem` | `--text-kicker-size` | 0 |
| `0.8125rem` (18×) | `--text-meta-size` | 0 |
| `0.9rem` | `--text-support-size` (0.875) | −0.4px |
| `0.9375rem` / `0.95rem` / `0.975rem` | `--text-body-size` (1rem) | +0.4 – +1px |

**Spacing** — 312 values across 27 files, mapped to nearest `--space-*` step.
Worst case is −2px (`1.125rem 1.25rem` section-block padding → `--space-4 --space-5`);
everything else is ≤1.6px. Zero-delta exact matches (`0.25/0.5/0.75/1/1.25/1.5/1.75/2/2.5/3/4rem`)
migrated in the same pass.

Verified in the browser: home, Today, Backlog, Habits, Settings, Archive,
Collection + cat-detail modal, task create/delete — all render unchanged, no
console errors.

---

## Deliberate keeps (not snapped — on purpose)

### Heading one-offs — snapping would change the design
| Value | Where | Why kept |
|---|---|---|
| `font-size: 1.1rem` | home `.subtitle` | hero lede; nearest heading token is a responsive clamp — wrong role |
| `font-size: 1.25rem` | backlog `.reviewText` | review-pass card text, weight 500 + own tracking; clamp would shrink it on mobile |
| `font-size: 1.35rem` | collection `.detailName` | cat-name in detail modal; −6px to force onto `--text-section-size` |

### `font-size: 0.875rem` raw — ~13 sites
Already equals `--text-support-size` **and** `--text-label-size` (both 0.875rem),
so it's on-scale, not drift. Left raw because picking which name applies is a
per-site call (nav label vs secondary text). Swap opportunistically during the
component passes.

### Off-scale with no clean step — 1–2 sites each
| Value | Where | Nearest | Δ |
|---|---|---|---|
| `2.25rem` | auth panel padding; `min-height` on a control | `--space-8` | ±4px |
| `0.875rem` | auth-form input vertical padding | `--space-3`/`--space-4` | ±2px (tie) |
| `0.1rem` / `0.05rem` | 3 tight `gap`s, 1 nudge margin | `--space-1` | +2.4px (150% of original) |

### Negative margins — 5 sites
`-0.35rem` / `-0.5rem` / `-0.65rem` optical-overlap nudges (add-to-backlog,
daily-dashboard, backlog, habits, app-top-bar). Left as literals — `calc(-1 * var(--space-n))`
adds noise for a deliberate visual tweak.

### Layout tokens in tokens.css
`--app-content-pad-x/top` (1.25rem/1.5rem → 2rem), `--app-content-pad-bottom` (5.5rem),
`--btn-pad-x` (1.1rem). Centralized already, not "drift". Could be expressed via
`--space-*` but `5.5rem` and `1.1rem` have no step and buttons are padding-sensitive.
Leave for a dedicated button/layout pass.
