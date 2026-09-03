# Purrsist — Design System Audit

**Date:** September 2026  
**Scope:** Complete inventory of current visual system + proposed dark-first redesign foundation  
**Stack:** Next.js App Router · TypeScript · Tailwind CSS v4 · CSS Modules · Supabase · Vercel

---

## Table of Contents

1. [Overview](#1-overview)
2. [Current State — Color](#2-current-state--color)
3. [Current State — Typography](#3-current-state--typography)
4. [Current State — Spacing & Layout](#4-current-state--spacing--layout)
5. [Current State — Radius, Shadow & Border](#5-current-state--radius-shadow--border)
6. [Current State — Motion](#6-current-state--motion)
7. [Current State — Icons](#7-current-state--icons)
8. [Current State — Components](#8-current-state--components)
9. [Current State — Z-Index](#9-current-state--z-index)
10. [Drift & Issues](#10-drift--issues)
11. [Proposed Design System](#11-proposed-design-system)
12. [Migration Priorities](#12-migration-priorities)

---

## 1. Overview

Purrsist is a single-user productivity PWA. The current codebase has a **warm light theme** (`#f7f1e7` background, terracotta accent, earth-tone category blocks) as the only active theme. A dark theme exists in CSS but is **fully inert** — no toggle is wired.

The existing token system is well-intentioned and mostly coherent, but suffers from **type scale drift** (raw `rem` values in ~30 locations bypassing `--text-*` tokens), **hardcoded border-radius values** not using the scale, and **hardcoded `rgba()` colour values** outside the token system. There are no design token files — everything lives in a single `:root` block inside `globals.css`.

**Design direction for the redesign:** Dark-first, premium. Warm charcoal base with amber accent. Sharp typographic hierarchy, single sans-serif font. Subtle depth through surface layering rather than heavy shadows.

---

## 2. Current State — Color

### 2.1 Core Semantic Tokens (`:root`)

| Token | Light Value | Notes |
|---|---|---|
| `--background` | `#f7f1e7` | Page base |
| `--foreground` | `#4a2e18` | Primary text |
| `--surface` | `#fffdf8` | Card / panel fill |
| `--border` | `#e6dcc8` | Default structural edge |
| `--muted` | `#8a7d5f` | Secondary text, meta |
| `--accent` | `#7a3a20` | Primary interactive |
| `--accent-hover` | `#5c2c17` | Accent hover state |
| `--accent-foreground` | `#f7f1e7` | Text on accent fills |
| `--accent-soft` | `rgba(122, 58, 32, 0.12)` | Focus ring wash, highlight |
| `--danger` | `#e07a6a` | Destructive actions |
| `--success` | `#8fbf8a` | Completion, positive state |
| `--surface-glass` | `color-mix(in srgb, var(--background) 78%, transparent)` | Nav backdrop |
| `--border-muted` | `color-mix(in srgb, var(--border) 70%, transparent)` | Quiet structural edge |

### 2.2 Category Triads

Each task category has a background, foreground, and border token used for full-bleed section blocks and pill variants.

| Category | `--*-bg` | `--*-fg` | `--*-border` |
|---|---|---|---|
| Must-Do (red) | `#debba0` | `#7a3a20` | `#a86e48` |
| Should-Do (yellow) | `#e2ce92` | `#6b4f0e` | `#b5943c` |
| Quick Win (green) | `#c5d5b8` | `#3d5230` | `#6f8a5e` |
| Quick Win done | — | `#5c6b50` | — |

Each category also has `--*-bg-fill` and `--*-bg-fill-selected` gradient variants (165deg, two-stop `color-mix` blends).

### 2.3 Support Section Tokens

Used for Habits and Daily Reminder sections — a soft warm wash derived from the foreground.

| Token | Value |
|---|---|
| `--support-bg` | `color-mix(in srgb, var(--foreground) 14%, #f5efe6)` |
| `--support-fg` | `var(--foreground)` |
| `--support-border` | `color-mix(in srgb, var(--foreground) 28%, var(--border))` |
| `--support-bg-fill` | Gradient as above |

### 2.4 Dark Theme Tokens (`:root[data-theme="dark"]`) — currently inert

| Token | Dark Value |
|---|---|
| `--background` | `#0c0b09` |
| `--foreground` | `#f4efe6` |
| `--surface` | `#161410` |
| `--border` | `#2a261f` |
| `--muted` | `#9a9183` |
| `--accent` | `#d4a853` (amber) |
| `--accent-hover` | `#e0b965` |
| `--accent-foreground` | `#1a150c` |
| `--accent-soft` | `rgba(212, 168, 83, 0.18)` |
| `--danger` | `#e07a6a` (same) |
| `--success` | `#8fbf8a` (same) |

Dark category tokens are `color-mix(in srgb, <base-colour> 22%, var(--surface))` backgrounds with the raw colour as foreground — a muted glow-on-dark approach.

Dark `--font-display` overrides to `var(--font-geist-sans)` — no serif in dark mode.

### 2.5 Hardcoded Colour Values (outside token system)

These bypass the token contract and must be migrated:

| Value | Location | Should become |
|---|---|---|
| `rgba(122, 58, 32, 0.14)` | `home.module.css`, `auth-shell.module.css` | `var(--accent-soft)` (adjust alpha) |
| `rgba(122, 58, 32, 0.12)` | `auth-shell.module.css` | `var(--accent-soft)` |
| `rgba(0, 0, 0, 0.28)` | `win-payoff.module.css`, `collection-screen.module.css`, `button.module.css` | `color-mix(in srgb, #000 28%, transparent)` shadow token |
| `#f5efe6` | `globals.css` (support-bg) | Should be `var(--background)` or a named primitive |

---

## 3. Current State — Typography

### 3.1 Font Families

| Token | Value | Usage |
|---|---|---|
| `--font-display` | `var(--font-source-serif), serif` | Page titles, section headings (light only) |
| `--font-ui` | `var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif` | All body, label, input, nav |
| `--font-sans` (Tailwind `@theme`) | `var(--font-geist-sans)` | Tailwind `font-sans` utility |
| `--font-mono` (Tailwind `@theme`) | `var(--font-geist-mono)` | Tailwind `font-mono` utility |

Both `Source Serif Pro` and `Geist Sans` are loaded via Next.js `next/font`.

### 3.2 Type Scale Tokens

Defined in `:root` and used by global utility classes (`.pageTitle`, `.sectionHeading`, etc.).

| Role | Token prefix | Size | Weight | Tracking | Leading |
|---|---|---|---|---|---|
| Page title | `--text-page-title-*` | `clamp(2rem, 5vw, 2.5rem)` | 600 | `-0.035em` | `1.1` |
| Section heading | `--text-section-*` | `clamp(1.125rem, 2.2vw, 1.25rem)` | 600 | `-0.02em` | `1.25` |
| Body | `--text-body-*` | `1rem` | 400 | `0` | `1.55` |
| Support / meta | `--text-support-*` | `0.875rem` | 400 | `0` | `1.45` |
| Label / button | `--text-label-*` | `0.875rem` | 600 | `0` | `1.3` |
| Input | `--text-input-*` | `1rem` | 500 | `0` | `1.45` |

### 3.3 Global Type Utility Classes (`globals.css`)

| Class | Status | Notes |
|---|---|---|
| `.pageTitle` | Active | Uses display font + scale tokens |
| `.sectionHeading` | Active | Uses display font + scale tokens |
| `.bodyText` | Active | — |
| `.supportText` | Active | Includes `color: var(--muted)` |
| `.labelText` | Active | — |
| `.inputText` | Active | — |
| `.pageSubtitle` | Active | Alias of `.bodyText` + muted colour |
| `.hintText` | **Deprecated** | Use `.supportText` |
| `.sectionLabel` | **Deprecated** | Use `.sectionHeading` |
| `.btnPrimary` | **Deprecated** | Use `<Button variant="primary" />` |
| `.btnSecondary` | **Deprecated** | Use `<Button variant="secondary" />` |

### 3.4 Type Scale Drift (raw values not using tokens)

The following ad-hoc `font-size` values appear across CSS module files, bypassing the token system:

`0.625rem`, `0.6875rem`, `0.75rem`, `0.8125rem`, `0.875rem` (hardcoded), `0.9rem`, `0.9375rem`, `0.95rem`, `0.975rem`, `1.1rem`, `1.25rem`, `1.35rem`, `clamp(1.35rem, 3vw, 1.75rem)`, `clamp(1.375rem, 3.2vw, 1.625rem)`, `clamp(1.75rem, 4vw, 2.1rem)`, `clamp(3rem, 10vw, 5rem)`

**Affected files:** `backlog.module.css`, `collection-screen.module.css`, `daily-dashboard.module.css`, `habits-page.module.css`, `home.module.css`, `auth-form.module.css`, `auth-shell.module.css`, `archive-date-picker.module.css`, `archive-entry-view.module.css`, `settings.module.css`, and others.

**Tracking anomalies** (not expressed through tokens): `0.18em` (brand mark), `0.1em` (uppercase kickers), `0.08em`, `0.04em`, `0.02em` (chips).

---

## 4. Current State — Spacing & Layout

### 4.1 Layout Tokens

| Token | Value | Breakpoint |
|---|---|---|
| `--app-content-max` | `40rem` | — |
| `--app-content-pad-x` | `1.25rem` → `2rem` | `≥640px` |
| `--app-content-pad-top` | `1.5rem` → `2rem` | `≥640px` |
| `--app-content-pad-bottom` | `5.5rem` | — |

### 4.2 Gap & Padding Patterns in CSS Modules

No spacing scale tokens exist. All values are freehand. Observed patterns:

| Level | Values used |
|---|---|
| Page / screen gap | `1.75rem`, `2rem` |
| Section / card internal gap | `1.15rem`, `1.25rem`, `1.5rem` |
| Row / item gap | `0.65rem`, `0.75rem`, `0.85rem` |
| Tight intra-element gap | `0.2rem`, `0.25rem`, `0.35rem`, `0.4rem`, `0.45rem`, `0.5rem` |
| Nav gap | `0.35rem` |
| Standard section block padding | `1.125rem 1.25rem` |
| Standard row padding | `0.55rem 0.7rem` / `0.5rem 0.65rem` |
| Input padding | `0 1rem` / `0.7rem 1rem` / `0.85rem 0.95rem` |
| Card padding | `1.5rem` |
| Auth panel padding | `2.25rem 1.75rem` → `2.5rem` |
| Compact button padding | `0.45rem 0.8rem`, `0.4rem 0.65rem` |

---

## 5. Current State — Radius, Shadow & Border

### 5.1 Radius Scale

| Token | Value | Intended use |
|---|---|---|
| `--radius-sm` | `0.375rem` (6px) | Checkboxes, badges, compact chrome |
| `--radius-md` | `0.75rem` (12px) | Inputs, buttons, icon tiles, task rows |
| `--radius-lg` | `1.125rem` (18px) | Cards, section blocks, banners |
| `--radius-full` | `999px` | Category pills, segmented nav only |
| `--radius-block` | `= --radius-lg` | Legacy alias |
| `--radius-row` | `= --radius-md` | Legacy alias |

**Ad-hoc radius values not using tokens:** `0.65rem`, `0.85rem`, `1.25rem`, `999px` (hardcoded directly) found in `home.module.css`, `auth-form.module.css`, `auth-shell.module.css`.

### 5.2 Box Shadows

No shadow tokens defined. All shadows are one-off values:

| Location | Value |
|---|---|
| Rescue toast | `0 14px 36px color-mix(in srgb, #000 40%, transparent)` |
| Collection detail | `0 18px 48px color-mix(in srgb, #000 45%, transparent)` |
| Collection card highlight ring | `0 0 0 1px color-mix(in srgb, var(--accent) 28%, transparent)` |
| Highlight pulse peak | `0 0 0 8px color-mix(in srgb, var(--accent) 40%, transparent)` |
| Win toast | `0 10px 24px rgba(0, 0, 0, 0.28)` |
| Account menu dropdown | `0 6px 20px -8px color-mix(in srgb, var(--foreground) 30%, transparent)` |
| View tabs border | `0 1px 0 color-mix(in srgb, var(--foreground) 4%, transparent)` |
| Avatar inset (open state) | `inset 0 1px 2px rgba(0, 0, 0, 0.28)` |
| Focus rings | `0 0 0 3px var(--accent-soft)` |

### 5.3 Border System

| Token | Value |
|---|---|
| `--border-width` | `1px` |
| `--border-style` | `solid` |
| `--border-default` | `1px solid var(--border)` |
| `--border-muted` | `color-mix(in srgb, var(--border) 70%, transparent)` |
| `--border-muted-default` | `1px solid var(--border-muted)` |

**Conventions (documented in comments):**
- Solid borders for controls, cards, and structure
- Dotted/dashed borders reserved exclusively for empty slots and drop zones
- Category-coloured borders only for selected state or category blocks

---

## 6. Current State — Motion

### 6.1 Transition Token

```css
--btn-transition:
  color 160ms ease,
  border-color 160ms ease,
  background-color 160ms ease,
  box-shadow 160ms ease,
  transform 160ms ease,
  opacity 160ms ease;
```

**160ms ease** is the universal baseline for all micro-interactions.

### 6.2 Keyframe Inventory

| Keyframe | File | Description | Duration |
|---|---|---|---|
| `ahaIn` | `first-capture-aha.module.css` | Fade + slide up | 260ms |
| `ahaOut` | `first-capture-aha.module.css` | Fade + slide up | 260ms |
| `promoteIn` | `backlog.module.css` | Fade + slide down | 180ms |
| `iconPop` | `button.module.css`, `daily-dashboard.module.css` | Scale 1→1.2→1 | 250ms |
| `sectionPop` | `daily-dashboard.module.css` | Scale 1→1.03→1 | 250ms |
| `savingSpin` | `daily-dashboard.module.css` | Full rotation | 700ms linear ∞ |
| `itemExit` | `habits-page.module.css` | Collapse + fade (opacity, translate, max-height, padding) | 220ms |
| `itemExitReduced` | `habits-page.module.css` | Fade only (reduced motion) | 120ms |
| `detailIn` | `collection-screen.module.css` | Fade + scale from 0.98 | 180ms ease-out |
| `highlightPulse` | `collection-screen.module.css` | Box-shadow ripple expand/fade | 1.4s ease-out |
| `toastOut` | `rescue-toast.module.css` | Fade out | 220ms |
| `toastFromBottom` | `toast-shell.module.css` | Fade + translateY(10px) up | — |
| `toastFromTop` | `toast-shell.module.css` | Fade + translateY(-10px) down | — |
| `layerIn` / `layerOut` | `win-payoff.module.css` | Confetti overlay fade | — |
| `confettiBurst` | `win-payoff.module.css` | Per-piece rotate + translate + scale + fade via CSS custom props | `var(--duration)` per piece |

All keyframes include `@media (prefers-reduced-motion: reduce)` counterparts that disable or simplify them.

### 6.3 Timing Scale

| Duration | Easing | Use |
|---|---|---|
| `120ms` | `ease` | Reduced-motion fallback exit |
| `160ms` | `ease` | Universal micro-interaction baseline |
| `180ms` | `ease` | Detail card entry, promote menu |
| `220ms` | `ease` | Toast exit, item collapse exit |
| `250ms` | `ease` | Icon/section pop celebration |
| `260ms` | `ease` | Aha card in/out |
| `420ms` | `cubic-bezier(0.22, 1, 0.36, 1)` | Win toast spring entrance |
| `700ms` | `linear infinite` | Saving spinner |
| `1400ms` | `ease-out` | Highlight pulse ring |
| variable | `cubic-bezier(0.16, 1, 0.3, 1)` | Confetti burst (spring overshoot) |

---

## 7. Current State — Icons

**System:** Custom hand-authored SVG React components. No third-party icon library.

### 7.1 Icon Inventory

| Component | Type | Size options | Export in `index.ts` |
|---|---|---|---|
| `ChevronLeftIcon` | Stroke | 20, 24 | Yes |
| `PlusIcon` | Stroke | 20, 24 | Yes |
| `CloseIcon` | Stroke | 20, 24 | Yes |
| `TrashIcon` | Stroke | 20, 24 | Yes |
| `CheckIcon` | Stroke | 20, 24 | Yes |
| `StarIcon` | Fill | 20, 24 | Yes |
| `GripIcon` | Fill | 20, 24 | **Missing** |
| `PawPrintIcon` | Fill | 20, 24 | Yes |
| `CatHeadIcon` | Hybrid (stroke + fill) | 20, 24 | Yes |
| `InfoIcon` | Stroke | 20, 24 | Yes |
| `SettingsIcon` | Stroke | 20, 24 | Yes |

**`IconProps`:** `size?: 20 | 24`, `title?: string`, plus SVG passthrough props.  
**`ICON_STROKE`:** exported constant `= 2` — stroke width for all stroke icons.

**Issue:** `GripIcon` is exported from `icons.tsx` but missing from `index.ts` re-exports.

### 7.2 Icon Conventions

- Stroke icons use: `stroke="currentColor"`, `strokeWidth={2}`, `strokeLinecap="round"`, `strokeLinejoin="round"`, `fill="none"`
- Fill icons use: `fill="currentColor"`, `stroke="none"`
- `CatHeadIcon` is hybrid: outlined path (stroke) + filled ellipses (pupils, nose)

---

## 8. Current State — Components

### 8.1 UI Primitives (`src/components/ui/`)

| Component | File | Variants / Props |
|---|---|---|
| `Button` | `button.tsx` | `variant: "primary" \| "secondary" \| "category" \| "nav"` · `selected?` · `category?: "red" \| "yellow" \| "green"` · `href?` · `disabled?` |
| `IconButton` | `icon-button.tsx` | `label: string` · `icon: ReactElement` · `iconSize?: 20 \| 24` · `tone?: "default" \| "ghost"` · `active?` · `href?` · `disabled?` |
| `ToastShell` | `toast-shell.tsx` | `anchor: ToastAnchor` · `entering?` · `leaving?` |
| `ViewTabs` | `view-tabs.tsx` | `options: {value, label}[]` · `value` · `onChange` |

### 8.2 Navigation (`src/components/nav/`)

| Component | File | Notes |
|---|---|---|
| `AppNav` | `app-nav.tsx` | Bottom pill nav, `usePathname`-driven |
| `AppTopBar` | `app-top-bar.tsx` | Sticky top bar, category counters, save-account CTA |
| `AccountMenu` | `account-menu.tsx` | Dropdown avatar menu, `displayName` + `email` |

### 8.3 Feature Components

| Area | Component | Key notes |
|---|---|---|
| **Auth** | `AuthForm`, `TryItButton`, `SaveAccountForm`, `TrialBanner`, `LogInInsteadButton` | Login/signup, guest → account conversion |
| **Daily** | `DailyDashboard`, `TodoRow`, `SortableTodoRow`, `HabitManager`, `DueReminders`, `EndOfDayNudge`, `RescueToast`, `WinPayoff`, `AddToBacklog`, `ReminderManager` | Core daily loop |
| **Backlog** | `BacklogScreen`, `BacklogItemRow`, `BacklogDraftRow`, `BacklogArchivedPanel`, `ReviewPass`, `SignificanceDot` | Backlog management + promote flow |
| **Habits** | `HabitsPage`, `HabitRow`, `HabitDraftRow` | Habit CRUD + archive |
| **Archive** | `ArchiveScreen`, `ArchiveDatePicker`, `ArchiveEntryView` | Past entry review |
| **Collection** | `CollectionScreen`, `CatPortraits` (SVG set) | Cat rescue gallery |
| **Capture** | `QuickAdd`, `FirstCaptureAha` | Capture input + first-time moment |

### 8.4 CSS Module File Index (30 files)

```
src/app/(app)/dashboard/dashboard.module.css
src/app/(app)/settings/settings.module.css
src/app/(app)/settings/how-it-works/how-it-works.module.css
src/app/(auth)/auth-shell.module.css
src/app/home.module.css
src/components/archive/archive-date-picker.module.css
src/components/archive/archive-entry-view.module.css
src/components/archive/archive-screen.module.css
src/components/auth/auth-form.module.css
src/components/auth/log-in-instead-button.module.css
src/components/auth/save-account-form.module.css
src/components/auth/trial-banner.module.css
src/components/auth/try-it-button.module.css
src/components/backlog/backlog.module.css
src/components/capture/first-capture-aha.module.css
src/components/capture/quick-add.module.css
src/components/collection/collection-screen.module.css
src/components/daily/add-to-backlog.module.css
src/components/daily/daily-dashboard.module.css
src/components/daily/end-of-day-nudge.module.css
src/components/daily/habit-manager.module.css
src/components/daily/rescue-toast.module.css
src/components/daily/win-payoff.module.css
src/components/habits/habits-page.module.css
src/components/nav/account-menu.module.css
src/components/nav/app-nav.module.css
src/components/nav/app-top-bar.module.css
src/components/ui/button.module.css
src/components/ui/toast-shell.module.css
src/components/ui/view-tabs.module.css
```

---

## 9. Current State — Z-Index

| Layer | Value | Component |
|---|---|---|
| App nav (floating pill) | `20` | `app-nav.module.css` |
| Top bar (sticky) | `30` | `app-top-bar.module.css` |
| Account menu dropdown | `40` | `account-menu.module.css` |
| Backlog review overlay | `40` | `backlog.module.css` |
| Collection detail backdrop | `40` | `collection-screen.module.css` |
| Toast shells | `70` | `toast-shell.module.css` |
| Win payoff confetti layer | `80` | `win-payoff.module.css` |

---

## 10. Drift & Issues

### Critical

| # | Issue | Location | Fix |
|---|---|---|---|
| 1 | `GripIcon` missing from `index.ts` | `src/components/icons/index.ts` | Add re-export |
| 2 | Dark theme defined but no setter wired | `globals.css`, all pages | Add `data-theme` toggle and persist to `localStorage` |
| 3 | Deprecated global classes still active | `globals.css` | Phase out `.hintText`, `.sectionLabel`, `.btnPrimary`, `.btnSecondary` once no usages remain |

### Token Drift

| # | Issue | Instances | Fix |
|---|---|---|---|
| 4 | Raw `rem` font sizes bypassing `--text-*` tokens | ~30+ across CSS modules | Migrate to `var(--text-*-size)` or new proposed scale tokens |
| 5 | Ad-hoc border-radius values not using scale tokens | `home.module.css`, `auth-form.module.css`, `auth-shell.module.css` | Replace `0.65rem`, `0.85rem`, `1.25rem` with `--radius-sm/md/lg` |
| 6 | Hardcoded `rgba()` colour values | `home.module.css`, `auth-shell.module.css`, `win-payoff.module.css`, `collection-screen.module.css`, `button.module.css` | Replace with token equivalents |
| 7 | No spacing scale tokens | All 30 CSS modules | Introduce `--space-*` scale |
| 8 | No shadow tokens | 8 locations | Introduce `--shadow-*` tokens |
| 9 | Tracking values not in token system | `home.module.css`, several chip styles | Absorb into type scale tokens |

### Architecture

| # | Issue | Notes |
|---|---|---|
| 10 | All tokens in single `:root` block in `globals.css` | Token file grows with every feature; hard to scan |
| 11 | Light theme is default; dark theme is an override | For dark-first redesign, invert this relationship |
| 12 | `--radius-block` and `--radius-row` legacy aliases still referenced in some modules | Remove once migrations confirm |
| 13 | Tailwind `@theme` only bridges `background`, `foreground`, `font-sans`, `font-mono` | Other tokens not accessible as Tailwind utilities |

---

## 11. Proposed Design System

### 11.1 Direction

**Dark-first, premium, warm.** The redesign targets the existing dark theme's palette as the default. Earth-warm charcoal base (`#0c0b09`) with amber accent (`#d4a853`). Single sans-serif typeface throughout (no conditional serif). Hierarchy through weight, size, and colour — not uppercase or decorative letterforms. Surfaces layered via subtle `--surface` and `--surface-2` tokens rather than heavy shadows.

---

### 11.2 Proposed Color Palette

#### Base Primitives (design-time reference — not tokens)

| Name | Hex | Role |
|---|---|---|
| Charcoal 950 | `#0c0b09` | Page base (dark) |
| Charcoal 900 | `#161410` | Surface / card |
| Charcoal 800 | `#1e1b16` | Elevated surface |
| Charcoal 700 | `#2a261f` | Structural border |
| Charcoal 600 | `#3a352b` | Quiet border / divider |
| Charcoal 400 | `#9a9183` | Muted / secondary text |
| Cream 50 | `#f4efe6` | Primary text (dark) |
| Cream 100 | `#ede5d8` | Secondary text (dark) |
| Amber 400 | `#d4a853` | Accent |
| Amber 300 | `#e0b965` | Accent hover |
| Amber 500 | `#b8902e` | Accent pressed |
| Coral 400 | `#e07a6a` | Danger |
| Sage 400 | `#8fbf8a` | Success |
| Parchment 100 | `#f7f1e7` | Page base (light) |
| Parchment 50 | `#fffdf8` | Surface (light) |
| Terracotta 600 | `#7a3a20` | Accent (light) |

#### Proposed Semantic Tokens

All tokens defined in `src/styles/tokens.css` as `:root` (dark default) + `[data-theme="light"]` override.

```css
/* Dark (default — :root) */
--color-bg:            #0c0b09;
--color-bg-fill:       /* amber radial wash + linear gradient */
--color-surface:       #161410;
--color-surface-2:     #1e1b16;   /* NEW — elevated cards, popovers */
--color-border:        #2a261f;
--color-border-muted:  color-mix(in srgb, var(--color-border) 60%, transparent);
--color-text:          #f4efe6;
--color-text-2:        #ede5d8;   /* NEW — secondary body text */
--color-muted:         #9a9183;
--color-accent:        #d4a853;
--color-accent-hover:  #e0b965;
--color-accent-press:  #b8902e;   /* NEW */
--color-accent-fg:     #1a150c;
--color-accent-subtle: rgba(212, 168, 83, 0.14);
--color-danger:        #e07a6a;
--color-danger-subtle: rgba(224, 122, 106, 0.14);  /* NEW */
--color-success:       #8fbf8a;
--color-success-subtle:rgba(143, 191, 138, 0.14);  /* NEW */
--color-glass:         color-mix(in srgb, var(--color-bg) 80%, transparent);
```

```css
/* Light override — [data-theme="light"] */
--color-bg:            #f7f1e7;
--color-surface:       #fffdf8;
--color-surface-2:     #f2ebe0;
--color-border:        #e6dcc8;
--color-text:          #4a2e18;
--color-text-2:        #6b4f2e;
--color-muted:         #8a7d5f;
--color-accent:        #7a3a20;
--color-accent-hover:  #5c2c17;
--color-accent-press:  #3d1c0f;
--color-accent-fg:     #f7f1e7;
--color-accent-subtle: rgba(122, 58, 32, 0.10);
```

#### Proposed Category Tokens (updated for dark default)

```css
/* Must-Do (red) */
--color-must-bg:        color-mix(in srgb, #e07a6a 18%, var(--color-surface));
--color-must-fg:        #e07a6a;
--color-must-border:    color-mix(in srgb, #e07a6a 38%, var(--color-border));

/* Should-Do (amber) */
--color-should-bg:      color-mix(in srgb, #d4a853 18%, var(--color-surface));
--color-should-fg:      #d4a853;
--color-should-border:  color-mix(in srgb, #d4a853 38%, var(--color-border));

/* Quick Win (sage) */
--color-quick-bg:       color-mix(in srgb, #8fbf8a 18%, var(--color-surface));
--color-quick-fg:       #8fbf8a;
--color-quick-border:   color-mix(in srgb, #8fbf8a 38%, var(--color-border));

/* Support sections */
--color-support-bg:     color-mix(in srgb, var(--color-text) 10%, var(--color-surface));
--color-support-fg:     var(--color-text);
--color-support-border: color-mix(in srgb, var(--color-text) 22%, var(--color-border));
```

---

### 11.3 Proposed Typography

**Single typeface:** Geist Sans throughout. Source Serif is dropped from the dark-first system (it was already removed in dark mode). This simplifies font loading and achieves hierarchy purely through weight and size.

```css
--font-base: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
--font-mono: var(--font-geist-mono), ui-monospace, monospace;
```

#### Proposed Type Scale

Five semantic roles. Each has `size`, `weight`, `tracking`, `leading` sub-tokens.

| Role | Token | Size | Weight | Tracking | Leading |
|---|---|---|---|---|---|
| Display | `--text-display-*` | `clamp(2rem, 5vw, 2.5rem)` | 700 | `-0.04em` | `1.05` |
| Title | `--text-title-*` | `clamp(1.125rem, 2.2vw, 1.25rem)` | 600 | `-0.025em` | `1.2` |
| Body | `--text-body-*` | `1rem` | 400 | `-0.01em` | `1.55` |
| Caption | `--text-caption-*` | `0.875rem` | 400 | `0` | `1.45` |
| Label | `--text-label-*` | `0.875rem` | 600 | `0.005em` | `1.3` |

**Removes:** `--text-input-*` (fold into `--text-body-*`), `--text-section-*` (rename to `--text-title-*`), `--text-page-title-*` (rename to `--text-display-*`), `--text-support-*` (rename to `--text-caption-*`).

**Migration:** Find-replace all `var(--text-page-title-*)` → `var(--text-display-*)`, `var(--text-section-*)` → `var(--text-title-*)`, `var(--text-support-*)` → `var(--text-caption-*)`.

---

### 11.4 Proposed Spacing Scale

4px base unit, 10 steps. Replaces the current freehand values.

```css
--space-1:  0.25rem;   /*  4px */
--space-2:  0.5rem;    /*  8px */
--space-3:  0.75rem;   /* 12px */
--space-4:  1rem;      /* 16px */
--space-5:  1.25rem;   /* 20px */
--space-6:  1.5rem;    /* 24px */
--space-8:  2rem;      /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
```

**Layout tokens** (unchanged names, updated to use scale):
```css
--app-content-max:         40rem;
--app-content-pad-x:       var(--space-5);   /* 20px → 32px at ≥640px */
--app-content-pad-top:     var(--space-6);   /* 24px → 32px at ≥640px */
--app-content-pad-bottom:  var(--space-12);  /* 48px + nav height */
```

**Common layout patterns → space tokens:**

| Current | Proposed | Value |
|---|---|---|
| `gap: 1.75rem` (page gap) | `--space-8` | `2rem` |
| `gap: 1.25rem` (section gap) | `--space-5` | `1.25rem` |
| `gap: 0.75rem` (row gap) | `--space-3` | `0.75rem` |
| `gap: 0.5rem` (tight gap) | `--space-2` | `0.5rem` |
| `padding: 1.125rem 1.25rem` (section block) | `--space-4 --space-5` | `1rem 1.25rem` |
| `padding: 0.55rem 0.7rem` (row) | `--space-2 --space-3` | `0.5rem 0.75rem` |

---

### 11.5 Proposed Radius Scale

Keep the current 4-step scale. Rename legacy aliases.

```css
--radius-xs:   0.25rem;   /*  4px — NEW: tag pills, tight inline chips */
--radius-sm:   0.375rem;  /*  6px — checkboxes, badges */
--radius-md:   0.75rem;   /* 12px — inputs, buttons, task rows */
--radius-lg:   1.125rem;  /* 18px — cards, section blocks */
--radius-full: 999px;     /* category pills, segmented nav */
```

**Remove:** `--radius-block`, `--radius-row` (remove after migration).  
**Enforce:** no hardcoded `0.65rem`, `0.85rem`, `1.25rem` values — map to nearest step.

---

### 11.6 Proposed Shadow System

Three named elevation levels + interactive states. Shadows use `--color-bg` as the shadow base for dark compatibility.

```css
--shadow-sm:    0 1px 3px  color-mix(in srgb, #000 30%, transparent),
                0 1px 2px  color-mix(in srgb, #000 20%, transparent);
--shadow-md:    0 6px 16px color-mix(in srgb, #000 40%, transparent),
                0 2px 6px  color-mix(in srgb, #000 24%, transparent);
--shadow-lg:    0 16px 48px color-mix(in srgb, #000 52%, transparent),
                0 6px 16px  color-mix(in srgb, #000 32%, transparent);
--shadow-inset: inset 0 1px 2px color-mix(in srgb, #000 28%, transparent);

/* Focus rings — from existing token, renamed */
--shadow-focus:       0 0 0 3px var(--color-accent-subtle);
--shadow-focus-input: 0 0 0 2px var(--color-accent-subtle);
```

**Mapping current usages:**

| Current value | Proposed token |
|---|---|
| `0 10px 24px rgba(0,0,0,0.28)` | `--shadow-md` |
| `0 14px 36px color-mix(…#000 40%…)` | `--shadow-md` / `--shadow-lg` |
| `0 18px 48px color-mix(…#000 45%…)` | `--shadow-lg` |
| `inset 0 1px 2px rgba(0,0,0,0.28)` | `--shadow-inset` |
| `0 6px 20px -8px …` (dropdown) | `--shadow-sm` |

---

### 11.7 Motion Principles

**Retain the existing timing scale** — it is well-crafted. Add two tokens for discoverability:

```css
--duration-fast:   120ms;   /* reduced-motion fallback */
--duration-base:   160ms;   /* universal micro-interaction */
--duration-enter:  180ms;   /* detail cards, menus */
--duration-exit:   220ms;   /* collapse, toast exit */
--duration-pop:    250ms;   /* celebration pop */
--duration-spring: 420ms;   /* reward spring entrance */

--ease-base:     ease;
--ease-spring:   cubic-bezier(0.22, 1, 0.36, 1);
--ease-overshoot:cubic-bezier(0.16, 1, 0.3, 1);
```

**Reduced motion contract:** All keyframe animations must include `@media (prefers-reduced-motion: reduce)` that either removes motion or substitutes a simple opacity-only fade. This is already implemented — maintain it as a hard requirement.

---

### 11.8 Icon System

**Retain custom SVG components.** Extend the set to cover gaps identified during backlog/habits redesign:

| Priority | Icon | Notes |
|---|---|---|
| Fix now | `GripIcon` | Add to `index.ts` |
| Phase 1 | `ArchiveIcon` | Backlog archive action |
| Phase 1 | `CalendarIcon` | Due date / archive date picker |
| Phase 1 | `BellIcon` | Reminder indicator |
| Phase 1 | `ChevronDownIcon` / `ChevronRightIcon` | Expand/collapse affordances |
| Phase 2 | `EditIcon` | Inline edit action |
| Phase 2 | `TagIcon` | Backlog item tag indicator |
| Phase 2 | `SearchIcon` | Future search feature |

**Conventions to enforce:**
- All new icons must accept `IconProps` (`size?: 20 | 24`, `title?: string`)
- Stroke icons: `strokeWidth={ICON_STROKE}`, `strokeLinecap="round"`, `strokeLinejoin="round"`, `fill="none"`
- Fill icons: `fill="currentColor"`, `stroke="none"`
- Export from both `icons.tsx` and `index.ts`

---

### 11.9 Component API — Consolidation Notes

| Component | Current state | Proposed change |
|---|---|---|
| `Button` | 4 variants: primary, secondary, category, nav | Keep variants; migrate colours to `--color-*` tokens |
| `IconButton` | 2 tones: default, ghost | Add `size?: "sm" \| "md"` for compact contexts |
| `ToastShell` | 4 anchors, entering/leaving props | No change; add `--shadow-md` for elevation |
| `ViewTabs` | Controlled uncontrolled tabs | No change to API |
| `AppNav` | Bottom pill nav | Migrate colours; add `aria-current` if missing |
| `SignificanceDot` | Red/yellow/green/null | Map to `--color-danger`, `--color-accent`, `--color-success` |

---

### 11.10 Token File Structure

Move tokens out of `globals.css` into a dedicated file:

```
src/styles/
  tokens.css       ← all :root custom properties (dark default + light override)
  globals.css      ← @import "./tokens.css"; Tailwind @theme; body/html base styles; global type classes
```

`globals.css` imports `tokens.css` first. This keeps the main stylesheet scannable and makes the token contract independently reviewable.

**Token naming migration summary:**

| Current | Proposed | Notes |
|---|---|---|
| `--background` | `--color-bg` | Namespace prefix |
| `--foreground` | `--color-text` | More precise |
| `--surface` | `--color-surface` | + `--color-surface-2` new |
| `--border` | `--color-border` | + `--color-border-muted` |
| `--muted` | `--color-muted` | |
| `--accent` | `--color-accent` | + `--color-accent-press` new |
| `--accent-soft` | `--color-accent-subtle` | |
| `--danger` | `--color-danger` | + `--color-danger-subtle` new |
| `--success` | `--color-success` | + `--color-success-subtle` new |
| `--must-do-*` | `--color-must-*` | Shorter, consistent |
| `--should-do-*` | `--color-should-*` | |
| `--quick-win-*` | `--color-quick-*` | |
| `--text-page-title-*` | `--text-display-*` | |
| `--text-section-*` | `--text-title-*` | |
| `--text-support-*` | `--text-caption-*` | |
| `--radius-block` | Remove | Use `--radius-lg` directly |
| `--radius-row` | Remove | Use `--radius-md` directly |
| `--font-display` / `--font-ui` | `--font-base` | Single font, simpler |

---

## 12. Migration Priorities

### Phase 0 — Quick Wins (no visual change)

1. Fix `GripIcon` missing from `src/components/icons/index.ts`
2. Create `src/styles/tokens.css` and move `:root` block from `globals.css` into it; update `globals.css` to `@import "./tokens.css"`
3. Rename legacy token aliases (`--radius-block`, `--radius-row`) in all CSS modules to their direct values
4. Remove `@deprecated` classes (`.hintText`, `.sectionLabel`, `.btnPrimary`, `.btnSecondary`) from `globals.css` after confirming zero usages

### Phase 1 — Token Rename & Dark Default

1. Apply new `--color-*` naming throughout `tokens.css`
2. Invert theme relationship: dark is `:root`, light is `[data-theme="light"]`
3. Wire up a theme toggle (initially just `<html data-theme="light">` from a server component reading a cookie, with a client-side setter)
4. Add `--space-*` scale to `tokens.css`
5. Add `--shadow-*` scale to `tokens.css`
6. Add `--duration-*` and `--ease-*` tokens to `tokens.css`

### Phase 2 — Type Scale Consolidation

1. Rename `--text-page-title-*` → `--text-display-*` in `tokens.css` and all CSS modules
2. Rename `--text-section-*` → `--text-title-*`; `--text-support-*` → `--text-caption-*`
3. Audit all 30 CSS modules — replace raw `rem` font sizes with `var(--text-*-size)` equivalents
4. Remove `--font-display` / `--font-ui` split; use single `--font-base`
5. Update global utility classes (`.pageTitle`, `.sectionHeading`, etc.) to use new tokens

### Phase 3 — Component Passes

Apply new tokens to components in this order:

1. `src/components/ui/button.tsx` + `button.module.css` — critical primitive
2. `src/components/ui/icon-button.tsx`
3. `src/components/nav/` — `AppTopBar`, `AppNav`, `AccountMenu`
4. `src/components/daily/daily-dashboard.module.css` — largest CSS file, most drift
5. `src/components/backlog/backlog.module.css`
6. `src/components/habits/habits-page.module.css`
7. Remaining components in `archive/`, `capture/`, `collection/`, `auth/`

### Phase 4 — Page Passes

Apply to page-level layouts and auth shell:

1. `src/app/(app)/layout.tsx` + `dashboard.module.css`
2. `src/app/(auth)/auth-shell.module.css`
3. `src/app/home.module.css`
4. Settings pages

### Phase 5 — Polish & Expansion

1. Extend icon set (Phase 1 icons from §11.8)
2. Remove unused `Source Serif Pro` font load from `layout.tsx`
3. Add `--color-danger-subtle` / `--color-success-subtle` usages to relevant components
4. Harden `@media (prefers-reduced-motion)` coverage audit

---

*This document is the source of truth for the design system redesign. Update it as decisions are made, tokens are renamed, or components are rebuilt.*
