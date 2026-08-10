# Purrsist — Product Requirements Document (MVP)

## 1. Overview

**Name:** Purrsist

**Concept:** An async capture-and-reference tool, not a real-time planner. You don't need to be "in the app" at any particular moment for it to work — capture a thought whenever it hits, AI sorts and files it in the background, and the app surfaces things back to you on its own schedule (Morning Digest, Weekly Recap, Scheduled reminders) rather than requiring active check-ins throughout the day. It's what the user's current Notes-app habit is already trying to be — just organized, and something you can actually reference over time.

**Platform plan:**

- **V1 (MVP):** Web app, built as an installable PWA (Progressive Web App) — works as a regular website in any browser on any device (Mac, Windows, iPhone, Android) with no install required, and can optionally be installed for a home-screen icon, its own window, and push notifications. Built for quick iteration with Claude Code / Cursor.
- **V2:** Wrap/port to iOS and Android (React Native or Capacitor, decided once the web app's data model is proven out).

## 2. Problem Statement

The user has ADHD and no consistent routine. Their current system — notes app to-do lists plus scattered AI chat conversations — is disorganized, hard to search, and gives no visibility into patterns over time. There's no single place that captures the day's plan, the day's actions, and no way to look back and see progress. On top of that, the moment something needs to get out of their head, opening an app/categorizing it is itself friction — competing habits like texting themselves or writing on paper next to a laptop are winning specifically because they require zero decisions and stay visible.

## 3. Goals

- One place to write everything down (tasks, errands, reminders) instead of scattered notes/chats — and unlike Notes, something you can actually reference and find things in later.
- Capture that's as fast and frictionless as texting yourself — but that actually gets organized without extra effort, on its own schedule, not because the user has to actively manage it.
- A repeatable daily structure that's simple enough to fill out even on a bad day.
- An archive that quietly builds a real history, so patterns become visible later.
- Reminders that make sure nothing quietly falls through the cracks.

## 4. Target User

Just the individual user (single-user app for MVP — no multi-user/social features).

## 5. Design Principles

These came out of comparing Purrsist against real competing habits (texting yourself a to-do list, keeping a paper list next to a laptop) — both beat "just use an app" for specific reasons worth designing around:

1. **Capture must be near-zero-decision.** The one input the user gives (a significance tap) should be fast enough it doesn't feel like a decision, and everything else — categorizing, deciding where it lives — happens automatically via AI right after submit, not by the user. Organizing/correcting happens later, in a separate review pass, not at the moment of capture (see Backlog, §7).
2. **The daily view must be glanceable, not just accessible.** A paper list next to a laptop wins because it's always in view with no action required to check it. Being installable as a PWA (home-screen icon on iPhone/Mac, no browser chrome) is how Purrsist borrows that same always-there quality Notes gets for free from iCloud sync — it's in MVP for exactly this reason (see Platform plan, §1). A pinned/compact widget-style view remains a Phase 2 goal once the core layout is proven out.
3. **Organizing should happen for free where possible.** Friction and organization don't have to be solved at the same moment — light auto-suggestion and passive structure (grouping by recency, surfacing stale items) can do some of the organizing work without asking anything of the user.
4. **The whole app should feel as simple as texting yourself or typing into ChatGPT — not like a dashboard.** The benchmark isn't "a well-organized productivity tool," it's "as easy as the bad habits it's replacing." That means: minimal screens, minimal navigation, one obvious thing to do on each screen, and no setup required before the app is useful. Fun should come from small, lightweight touches (a flame icon on a win, a bit of playful copy) — never from anything that adds an extra tap or decision.
5. **Nothing time-sensitive should depend on a single silent channel.** Push notifications can fail quietly — OS permissions get revoked, the PWA might not be installed, the device might be offline — with no clear signal to the user that anything went wrong. For Scheduled reminders (§7), push is a bonus channel, never the only one: the item is already visible ahead of time in the Backlog's "Upcoming" grouping, and it lands in that day's Morning Digest email regardless of whether push fired. Email is the guarantee; push is the nice-to-have.
6. **This is an async capture/reference tool, not a real-time planner.** Nothing about Purrsist requires the user to be actively engaged with the app at a specific moment for it to do its job. Capture happens whenever a thought occurs; organizing (AI sorting), reminding (Morning Digest, Weekly Recap, Scheduled reminders), and reflecting (the "Done" list) all happen on their own schedule in the background. Future features should be evaluated against this — anything that only works if the user is actively watching the app in real time is a mismatch with what Purrsist actually is.

### Onboarding (MVP)

Kept deliberately thin, in line with Principle 4:

1. Sign up (email + password) — the only setup step required.
2. User lands immediately in today's empty Daily Entry / capture box — no tutorial modal, no multi-step wizard, no forced tour.
3. First capture is a designed "aha moment," not just a blank box. The user's very first real capture should visibly demonstrate the payoff — a brief, one-time highlight showing where the AI placed it and why (e.g. "Sorted as Errand → added to today's Should-Do"). No tooltip tour, just a single moment of visible payoff on the action the user already took. This matters more for whether someone comes back tomorrow than anything explained up front.
4. Habits mostly build themselves: repeatedly capturing the same thing (e.g. "drink water" 5x) triggers a one-tap suggestion to turn it into a daily habit (see Habit suggestion, §7). Manually adding a habit up front is also possible, but never required before the app is useful.
5. Everything else (Backlog, Archive, Collection) is reachable via a minimal nav — realistically just 3–4 destinations (Today / Backlog / Archive / Collection), not a sprawling menu.

## 6. Core Concept: The Daily Entry

Every calendar day = one Daily Entry record. Filling it out is the core loop. Editing is same-day only — once the day passes, the entry locks and becomes read-only, viewable anytime from the archive as a reference (not editable retroactively).

**Mental model — three lists, one invisible:**

- **Daily** — bounded (1 Must-Do, 2 Should-Dos, 3 Quick Wins, plus Habits), today only.
- **Backlog** — unbounded, everything not currently on today's list.
- **Done** — not a screen. Checked-off items (from Daily or Backlog) simply disappear from active view but aren't deleted — they're the data behind the Weekly Recap email (§7). Nothing in the UI ever shows a "Done" list; it exists only as evidence in your inbox once a week.

## 7. MVP Feature Scope

### Build Sequencing: v1.0 vs v1.1

Everything below is still MVP scope — nothing here is Phase 2. This is purely about build order, so a first vibe-coding pass has a clear, shippable target instead of trying to build everything from §7 at once.

#### v1.0 — the core loop (ship this first)

- Quick add (significance tap + text + submit) and AI sorting (type + placement, with Backlog fallback)
- Backlog list (recency grouping) + Review pass + manual Promote to today + Check off in place
- Daily Dashboard: Must-Do, Should-Dos, Quick Wins, Habit Checklist, Daily Reminder, Day outcome badge
- Today auto-creates; End-of-day nudge & carryover (Must-Do/Should-Do/Quick Win)
- Habit management (add/edit/remove/archive)
- Archive (view past locked days, read-only)
- Morning Digest email (yesterday's recap + today's nudge)
- Onboarding (thin signup, first-capture "aha moment")
- PWA installability

This alone already solves the core problem: a better, organized, reference-able replacement for the Notes-app habit, with one reliable daily email touchpoint.

#### v1.1 — retention & polish (layer on once v1.0 is working end to end)

- Scheduled reminders (AI date detection, "Upcoming" grouping, auto-placement, push notification)
- Habit suggestion (frequency-based prompt to auto-create habits from repeated captures)
- Stale item surfacing (Backlog) + Bulk archive
- Stagnation nudge (Dashboard carryover hygiene)
- Weekly Recap email
- Weekly Stray Cat Rescue + Collection gallery
- Re-engagement email

These are all things designed specifically around habit-formation and long-term stickiness — genuinely valuable, but they assume v1.0 is already working and being used, so there's real data (capture activity, check-offs) for them to act on.

### Section 0 — Brain Dump / Backlog

**Why:** The user's current method (a single running Notes list mixing errands, appointments, subscriptions, shopping items, and one-off tasks) is unorganized and never gets checked off. This section is the direct replacement for that list — designed so low-friction capture and eventual organization don't fight each other.

| Item | Behavior |
| --- | --- |
| **Quick add** | Capture flow: open app → tap a significance level (Red = big deal, Yellow = matters, Green = eventually / just don't want to forget it) → type the item → submit. One tap plus text, nothing else required in the moment. This tap reflects how important the item is, independent of timing — not "do this today." A future-dated item (like an interview next Tuesday) still gets tapped Red because it's a big deal, even though it isn't due today; the date (below) is a separate signal that controls when it surfaces. |
| **AI sorting** | On submit, an AI call (Anthropic API) classifies the item's type (Task / Errand / Reminder / Shopping) and decides placement — whether it should auto-populate into today's Must-Do/Should-Do/Quick Win (respecting that Must-Do has 1 slot, Should-Do has 2, Quick Win has 3 — it won't overwrite something already filled) or simply stay in the Backlog. The significance tap (red/yellow/green) is a strong signal into that decision, but the AI also reads the text itself. If the AI call fails or is unavailable, the item safely falls back to the Backlog as Uncategorized rather than blocking capture. |
| **Backlog list** | Everything not auto-placed onto today's dashboard lands here, tagged by type. Passively grouped by recency (Today / This Week / Older) with zero effort required from the user. |
| **Review (not manual triage)** | Because the AI already sorts and places most items, this becomes a quick review/undo pass rather than tagging from scratch — a fast swipe-through to correct anything the AI got wrong (re-tag, move between slots, or send back to Backlog). |
| **Stale item surfacing** | Items sitting untouched for several days automatically surface at the top of the review pass as a gentle "these have been sitting a while" nudge — not a blocker, just visibility. |
| **Shopping/grocery sub-list** | Items tagged "Shopping" collect into a grouped sub-list (mirrors the "Grocery store" sub-list in the user's current Notes habit). |
| **Promote to today (manual)** | Still available as a manual action from the Backlog for anything the AI left there, or anything the user wants to move later. |
| **Check off in place** | Items can also just be checked off directly in the backlog if they don't need to go through a specific day (e.g. "cancel subscriptions," "pay speeding ticket"). Once checked, an item disappears from the active Backlog view — it's not deleted, just moved into the invisible "Done" list (§6), where it becomes part of the Weekly Recap. |
| **Scheduled reminders** | Captured the same way as anything else — same tap-then-type flow, no separate form. When the AI sorting call detects date language in the text (e.g. "interview next Tuesday," "renew passport on the 15th"), it extracts a target date instead of placing the item immediately — the significance tap and the date are independent signals (how big a deal, vs. when it surfaces), so tapping Red for something next week is exactly right, not a mismatch. Until the target date, it sits in the Backlog under a visible "Upcoming" grouping showing its date, so it's never a surprise. On the target date, it auto-attempts placement onto that day's Dashboard using the same placement logic as regular AI sorting (Must-Do if the slot's open and it was tapped Red, otherwise Should-Do), and always appears in that morning's Morning Digest email — this is the guaranteed surface (Principle 5). A push notification also fires that morning since the app is a PWA (§1), but it's a bonus on top, not the only thing standing between the user and missing it. |
| **Habit suggestion** | A simple frequency counter (not an AI call) tracks when the same or near-identical item text has been captured repeatedly (e.g. "drink water" 5 times). Once it crosses a threshold, a one-tap prompt appears: "You've added 'Drink water' 5 times — want to make this a daily habit?" Yes adds it straight to the Habit Checklist (see Section 1 below); No dismisses it, and that item won't prompt again. This is how habits get built from actual usage instead of upfront setup — in line with Principle 4's thin onboarding. |
| **Bulk archive** | A single action ("Archive everything older than [X]") to clear out an aging Backlog in one move, so it can never rebuild into the overwhelming pile the user's Notes list became. Archived-without-completing items are distinct from the "Done" list (§6) — they don't count as accomplishments in the Weekly Recap, they just move out of active view. Nothing is ever deleted; archived items remain reachable if needed. |

**Note on AI sorting:** each capture makes one lightweight API call (e.g. to the Anthropic API) with the item's text and significance tap, and gets back a type + placement decision — and, when applicable, an extracted target date for Scheduled reminders (above). This adds a small per-item cost and a bit of latency (roughly a second) compared to pure keyword rules — worth it here since the payoff (auto-placement onto today's dashboard, or the right future date) is the main point of the feature. The fallback-to-Backlog behavior means a slow or failed API call never blocks capture itself.

### Section 1 — Daily Dashboard / Productivity

| Item | Behavior |
| --- | --- |
| **1 Must-Do** | Single text field + checkbox. If checked, the day counts as a "win." If unchecked at day's end, it carries over to tomorrow the same way Should-Dos/Quick Wins do (see End-of-day nudge & carryover below). |
| **2 Should-Dos** | Two text fields + checkboxes. Important, but movable to another day. |
| **3 Quick Wins** | Three text fields + checkboxes. Framed as sub-10-minute tasks. |
| **Habit Checklist** | A user-managed list of recurring habits (e.g. drink water, take a walk, journal — whatever the user sets). Persists identically day to day until the user edits the list. Each day, user simply checks off which habits were done — plain checkbox, no numeric tracking beyond done/not done. |
| **Daily Reminder** | One free-text field the user fills in fresh each day (a task, an affirmation, a "don't do X" reminder). Not recurring — it's meant to be re-entered daily. |
| **Day outcome** | Computed, not entered: day = "Win" if Must-Do is checked. Simple visual indicator (e.g. a badge/flame icon), not a full analytics view. |
| **Today auto-creates** | Opening the app auto-creates/loads today's Daily Entry — no explicit "start today" action needed. |
| **End-of-day nudge & carryover** | If the Must-Do, a Should-Do, or a Quick Win is left unchecked as the day ends, the app prompts the user (a couple of nudges, in-app only — see note below) to confirm/check it off. If it's still unchecked after that, it automatically carries over into tomorrow's corresponding slot rather than disappearing. |
| **Stagnation nudge** | Each dashboard item tracks a consecutive-carryover count. Once something has carried over 5 days in a row, the app surfaces a one-tap nudge: "This has carried over 5 days — send it to Backlog, or keep it on the list?" Keeping it just resets nothing (it can keep carrying over and will nudge again after another 5 days); sending it to Backlog clears it from today's slot, freeing that slot up, without deleting the item. This is the Daily Dashboard's version of the Backlog's stale-item surfacing (§7) — visibility without forcing a decision. |
| **Morning Digest email** | Sends once a day, in the morning — two jobs in one email: (1) a quick recap of yesterday's accomplishments (Must-Do hit or not, Should-Dos/Quick Wins completed, habits checked off — pulled from the "Done" list, §6), and (2) a nudge to fill in/review today's Must-Do, Should-Dos, Quick Wins, and Daily Reminder if they're not set yet. One email, one purpose (start the day, close the loop on the last one) — not a running nag throughout the day. Requires a scheduled job (e.g. cron) and an email-sending service (e.g. Resend/SendGrid). |
| **Weekly Recap email** | Sends Sunday evening, covering the Monday–Sunday week — a plain-list email of what got done that week, pulled from the "Done" list (§6): how many Must-Dos were hit (e.g. "5/7"), how many Should-Dos and Quick Wins were completed, habit check-in counts per habit, and how many Backlog items got checked off. No charts or streak framing — just a straightforward list, so reflecting on the week takes seconds. This is a read-only snapshot — nothing resets or clears when it sends; Monday's Daily Dashboard just continues as normal, same carryover rules as any other day. This is the actual "payoff" mechanic for checking things off: earning a spot on this list, rather than an in-the-moment animation. Email-only by design — nothing added to the app's UI. |
| **Weekly Stray Cat Rescue** | A gamified layer on top of the Weekly Recap. Each day (Monday–Sunday) counts as "active" if the user did anything at all with the app that day — capturing something new counts, not just checking something off. Simple flat threshold: 6 or 7 active days that week → rescue a new stray cat; 5 or fewer → no cat that week (no penalty beyond simply not rescuing one — nothing is lost or shown as a failure). Tying it to any interaction — including plain capture — keeps the bar low and rewards the core habit the whole app is built around: consistently getting things out of your head, not necessarily finishing them. Each cat is cute/funny and has a name. The cat rescued (if any) is revealed in that Sunday's Weekly Recap email — the framing is "look who you picked up this week" — and every cat ever rescued lives permanently in a simple in-app Collection (a little cattery gallery), not a pet that needs daily care. See "making it legible" and the guardrails below; both are load-bearing, not optional polish. |
| **Re-engagement email** | Triggered (not scheduled) — if there's been no capture activity for 5+ days, a single low-pressure email goes out. Tone matters here as much as the mechanic: no guilt, no "you broke your streak," nothing shame-based — just an easy, welcoming "whenever you're ready" nudge back in. Won't re-fire again until there's been fresh activity followed by another 5+ day gap. |

**Note on making the Stray Cat Rescue legible (so it never feels arbitrary):**

- Explained once, plainly, in onboarding and on the Collection screen itself: "Interact with Purrsist on 6+ days this week — capturing something counts, not just checking it off — and you'll rescue a new stray, revealed in Sunday's recap."
- A quiet, low-key "X/7 days active this week" counter lives on the Collection screen only (not the main Dashboard) — informational, never framed as a countdown or urgency.
- The Weekly Recap always states the day-count plainly, win or not (e.g. "You showed up 6/7 days this week — welcome [Cat Name]!" / "You showed up 3/7 days this week — no new stray this time"), so the mechanic is self-teaching from the emails alone even if the in-app counter is never checked — consistent with the app's async nature (Principle 6).

**Note on the Stray Cat Rescue — guardrails (non-negotiable, not polish):**

- **No decay.** No hunger, sadness, neglect states, or anything that can run away/die from a quiet week. The cattery only ever grows.
- **No randomness.** Which cat is rescued next is deterministic (e.g. the next one in a fixed sequence), never a random "which cat did I get" pull — that's the slot-machine pattern this whole design has been avoiding.
- **No loss for a bad week.** Falling short of 6 active days means no new cat that week, not a step backward — no cat already rescued is ever at risk.
- **Cat art & names:** actual illustrations and names are outside PRD scope — a small fixed set of pre-made cats (illustrated and named once, not generated per-user) is the realistic MVP approach rather than real-time generation.

**Habit management (separate from the daily check-off):**

- Add / edit / remove / archive a habit.
- Editing the habit list going forward doesn't rewrite past days' archived data.

**Glanceability (from §5):** this view should be designed to work as something left open in a tab while the user works — minimal enough to check at a glance, not something that requires digging in. A pinned/compact view and eventually a home-screen widget are Phase 2 goals (see §12) once the core layout is proven out.

**Note on the end-of-day nudge:** this only needs to trigger while the app is open (e.g. a banner/modal shown once it's late in the day) — this is separate from the Morning Digest email above. Between the in-app end-of-day nudge and the next morning's digest, unfinished items get two natural check-ins without needing a barrage of emails throughout the day.

**Note on reminder channels:** email is the primary channel for the recurring Morning Digest/Weekly Recap (works reliably everywhere, no setup). Push notifications are also in MVP scope, but only for Scheduled reminders (above) — since the app is a PWA (§1), push works once installed to the home screen, with the known iOS caveat that it requires that installation step (iOS 16.4+) to function. SMS remains a Phase 2 option if a paid provider (e.g. Twilio) is added later.

## 8. Archive / History (MVP-level only)

- Every completed Daily Entry is saved and retrievable, read-only once the day has passed (same-day-only editing — see §6).
- MVP needs: a simple way to browse/select a past date and view what was logged that day.
- Not in MVP: streaks, heatmaps, graphs, trend lines, or any visualized motivational display of progress. These come once there's enough real data to make them meaningful (Phase 2). (The Weekly Recap email in §7 is a plain-text list, not a visualization, so it doesn't require this — it's just a query over already-saved data.)

## 9. Explicitly Out of Scope for MVP

- Fitness tracking (workout logs, macro/goal tracking) — moved to Phase 2 to keep MVP focused on the core capture-and-organize loop (§12).
- Mental/mood tracking (mood/energy/focus scales, journaling) — moved to Phase 2, same reasoning (§12).
- Oura Ring integration — was tied to Fitness/Mental, deferred along with them.
- AI/Claude chat interface embedded in the app for open-ended conversational logging. (Note: this is different from the AI sorting in §7, which is a single structured classification call at capture time, not a chat — sorting is in MVP scope.)
- Analytics: streaks, graphs, heatmaps, mood-vs-habit correlation views.
- General push notifications and SMS/text reminders as a routine channel — deferred to Phase 2. (Push is in MVP only for the specific case of Scheduled reminders, §7 — not as a general notification system.)
- Native iOS/Android apps (web-first; native wrapping is a later phase).
- Multi-user accounts, sharing, or social features.
- Editing/backfilling past days — same-day-only editing is the confirmed MVP behavior (§6); past days are view-only.

## 10. Suggested Data Model (for scaffolding)

- **User** — auth account (email/password or similar simple login) so data syncs across devices/browsers from V1; `last_capture_at` (timestamp, drives the Re-engagement email trigger).
- **DailyEntry** — `date` (unique per user), `must_do`, `should_do_1`, `should_do_2`, `quick_win_1/2/3` (text + bool each + a `carried_over_from` reference and a `carryover_count` — consecutive days unchecked, reset to 0 when checked or sent to Backlog, triggers the Stagnation nudge at 5), `daily_reminder` (text), `win_status` (derived), `locked` (bool — true once the day has passed), `morning_digest_sent` (bool — whether that day's single Morning Digest has gone out), `notes`.
- **Habit** — `name`, `active` (bool), `created_at`, `archived_at`.
- **HabitCheckIn** — `habit_id`, `date`, `done` (bool).
- **BacklogItem** — `text`, `normalized_text` (lowercased/trimmed, used to detect repeats for habit suggestions), `significance` (red/yellow/green, set at capture — independent of timing), `tag` (task/errand/reminder/shopping — set by AI, user-correctable), `ai_placement` (nullable — which DailyEntry slot, if any, the AI auto-placed it into), `target_date` (nullable — set by AI when date language is detected; presence of this field is what puts an item in the "Upcoming" grouping), `status` (active / done / archived — archived is distinct from done, since Bulk archive clears clutter without counting as an accomplishment), `created_at`, `last_touched_at` (used for stale-item surfacing), `promoted_to` (nullable reference to a DailyEntry slot if manually promoted later).
- **HabitSuggestionDismissal** — `normalized_text`, `dismissed_at` (so a declined habit suggestion doesn't keep reappearing for that item).
- **Cat** — a small fixed, pre-made set: `id`, `sequence_order` (determines which one's rescued next — deterministic, not random), `name`, `image` reference.
- **CatRescued** — `user_id`, `cat_id`, `week_start_date` (which Mon–Sun week it was rescued for) — append-only, nothing is ever removed from this. (Active-day count for the threshold is computed at Weekly Recap time from that week's activity across DailyEntry check-offs, HabitCheckIns, and BacklogItem captures — no new field needed to store it.)

(Fitness and Mental entities — WorkoutType, WorkoutLog, GoalSetting, MacroLog, MentalLog — are deferred to Phase 2; see §12.)

## 11. Resolved Decisions

| Question | Decision |
| --- | --- |
| Editing past days? | Same-day-only editing. Past days lock and are view-only for reference (§6, §8). |
| Today's entry creation | Auto-creates on app open — no explicit "start today" step (§7). |
| Auth for V1 | Simple login, so data syncs across devices/browsers from the start (§10). |
| Unchecked Must-Do/Should-Do/Quick Win at day's end | In-app nudge (a couple of reminders while the app is open); if still unchecked, it auto-carries into tomorrow's matching slot rather than vanishing — same behavior for all three (§7). |
| MVP scope | Trimmed to Backlog + Daily Dashboard + email/notification system (Morning Digest, Weekly Recap, Scheduled reminders, Re-engagement email, Stray Cat Rescue). Fitness and Mental sections moved to Phase 2 (§9). |
| Payoff for checking things off | Primarily a weekly, email-only plain-list recap of what got done (§7) — reflecting the real motivator (seeing accumulated progress) rather than instant feedback. Later extended with the Weekly Stray Cat Rescue (§7), a deliberately constrained form of gamification: deterministic, no decay, no loss for a bad week — the manipulative patterns (streaks, randomness, animations) are what was ruled out, not gamification itself. |
| Cross-device visibility | Solved via building as a PWA in MVP (installable, home-screen icon on iPhone/Mac) rather than waiting for native apps — borrows the same "always there" quality that makes Notes/iCloud sync sticky (§1, §5). |
| Date-specific reminders ("remind me next Tuesday") | Captured through the same quick-add box — AI detects date language and schedules it. Visible in Backlog under "Upcoming" beforehand; auto-placed onto that day's Dashboard and pushed via notification when it arrives (§7). |
| Email cadence | Consolidated from 3x/day to a single Morning Digest — combines yesterday's recap with a nudge to fill in today's Dashboard, avoiding the "spam" risk of frequent emails (§7). |
| Habit-formation additions | Added a designed first-capture "aha moment" (§5), a Bulk archive action so Backlog can't recreate the old Notes-pile problem (§7), and a non-shaming Re-engagement email after 5+ inactive days (§7) — deliberately without streaks, loss framing, or gamified rewards. |
| Weekly Stray Cat Rescue threshold | Single flat threshold: 6 or 7 active days that week (any interaction counts, including just capturing something — not required to be consecutive) → rescue a new stray cat; 5 or fewer → no cat (never a penalty). Made legible via onboarding copy, a quiet counter on the Collection screen, and the Weekly Recap always stating the day-count plainly (§7). Chosen over a completion-only or streak-based bar to reward simply showing up. |
| Build sequencing | MVP split internally into v1.0 (core capture/organize/reference loop + Morning Digest) and v1.1 (Scheduled reminders, Habit suggestion, Stale/Bulk archive, Stagnation nudge, Weekly Recap, Stray Cat Rescue, Re-engagement email) — see the Build Sequencing subsection at the top of §7. Nothing here is Phase 2; it's purely build order so v1.0 ships as a complete, usable thing on its own. |

## 12. Phase 2 Roadmap (Post-MVP)

- Fitness section: workout type/log, goal (cut/bulk/maintain) + target macros, daily macro logging.
- Mental section: mood/energy/focus (1–5) scales + notes, framed around tracking how habits/routine affect mood over time.
- Oura Ring integration (readiness, sleep, calorie burn feed into Fitness/Mental sections automatically).
- AI-assisted conversational logging (chat-based food/workout entry that populates the structured fields).
- Historical dashboard: streaks, completion %, calendar heatmap, mood/habit correlation charts.
- Push notifications and SMS reminders as a general, everyday channel (beyond the Scheduled-reminder-specific push already in MVP), plus SMS via a paid provider like Twilio.
- Home-screen widget / pinned compact view of the Daily Dashboard, and lower-friction capture (e.g. iOS Shortcut, widget quick-add) — building on the PWA foundation already in MVP.
- Native iOS/Android apps.

## 13. Success Metrics

- Daily entry completion rate (does the user actually fill it out day over day?).
- Habit check-off consistency over time.
- Backlog triage frequency — is stuff actually getting organized, or piling up uncategorized?
- Subjective: user reports feeling more organized / less reliant on scattered notes and AI chats within the first few weeks.
