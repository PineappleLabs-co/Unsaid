# Thought Catcher — Frontend PRD & UI/UX Requirements

**Version:** 0.2 (aligned with Backend PRD v4) · **Platform:** Android-first · **Scope:** Frontend product experience, screens, flows, states, UI system, frontend↔backend data contract.

*v0.2 changes from v0.1, made to resolve conflicts with the backend PRD: transcription pipeline now explicitly server-side (Groq) with an optional on-device provisional transcript, not audio-upload-only; audio retention default changed from "Keep" to "Delete after transcription" to match the backend's data-minimization stance; Resurfacing and Lightweight Projects moved from P1 to **P2**, matching the backend's Shipaton-window scope; semantic/"Related thoughts" search explicitly marked P2; local-database-as-source-of-truth framing confirmed as the shared contract (backend syncs to it, doesn't override it); data contract extended with the fields the backend needs (`version` for optimistic concurrency, `transcript_source`) and an explicit AI-toggle gate.*

## 0. Capture Interaction Contract (LOCKED RULES)

These rules override anything else in this document if there is a conflict. Unaffected by backend alignment — these are client-local guarantees.

| # | Rule |
|---|---|
| C1 | Every tap on the face captures. Tap 1 starts recording immediately. No pre-screen, no explanatory dialog, no confirmation before recording. |
| C2 | Tap 2 stops AND saves in one action. No separate Stop then Save. One tap = done, saved once. |
| C3 | Never auto-stop on silence. Only Tap 2 or a hard safety cap ends a recording. |
| C4 | Audio is written to local storage continuously while recording. Nothing exists only in memory. |
| C5 | Leaving mid-recording never loses the thought. App close, lock, incoming call, or OS kill all convert the in-progress capture into a Held Thought. |
| C6 | Held Thoughts stay visible (widget + Inbox banner) until dealt with. Dismissing from the widget removes only the widget card; the thought is never deleted by dismissal. |
| C7 | Deletion only happens in Thought Detail (with undo), plus the in-recording "Discard" (with 5s undo). |
| C8 | AI never blocks capture. Save is confirmed from local storage before any network or AI activity. |
| C9 | No mandatory metadata (title, category, tags, project, priority) at capture time. |

### 0.1 Recording state machine

```
        Tap 1                          Tap 2
IDLE ───────────► RECORDING ───────────────► SAVED (local) ──► AI QUEUED
                    │
                    ├── Discard (small, secondary) ──► DISCARDED (5s undo)
                    │
                    └── Interruption (app closed / lock / call / OS kill / mic lost)
                              │
                              ▼
                        HELD THOUGHT ──► user opens ──► REVIEW SHEET
                              │            (Play · Continue · Save · Discard)
                              ├── user dismisses (widget ✕) ─► Inbox as raw thought, widget card removed
                              └── untouched for 30 min [H] ─► auto-committed to Inbox ─► AI QUEUED
```

### 0.2 Interruption behaviour

| Situation | Behaviour |
|---|---|
| Home / switch app while recording started in-app | Recording finalizes gracefully; becomes Held Thought. Widget + Inbox banner show "Unfinished thought · 0:14". |
| Recording started from widget / Quick Settings tile / shortcut | Continues in a foreground capture session with a visible notification ("Catching a thought… tap to save") so the user can return to their previous app. Tap 2 = notification action or widget. [H] |
| Screen locks | Same as above depending on start surface; audio never dropped. |
| Incoming call / another app takes the mic | Finalize audio captured so far → Held Thought. |
| App killed by OS | Chunked audio on disk is recovered on next launch → Held Thought. |
| Microphone permission revoked mid-recording | Finalize what exists → Held Thought + permission banner. |
| Storage nearly full | Warn before recording; on failure, finalize what exists and show error. |
| Hard cap reached (10 min [H]) | Warn at 9:30, auto-save at 10:00 (never discard). |

### 0.3 Held Thought lifecycle

- Created when a capture (voice or text draft) is interrupted or left unfinished.
- Shown in: widget "Unfinished thought" card, Inbox top banner, Home hero sub-line.
- Tap → Review Sheet: Play · Continue recording (appends) · Save now · Discard.
- Double-tap on the widget card [H] → resume recording immediately (append). Confirm intended double-tap behaviour with team (still open — see Open Questions).
- Dismiss (✕) → widget card removed; thought is committed to Inbox as a raw thought and sent to AI. Nothing is deleted.
- Auto-commit: untouched after 30 min [H] → committed to Inbox, AI processing begins.
- When the user opens/refers to it → committed immediately and AI processing starts.
- Text drafts follow the identical lifecycle.

## 1. Product Summary

Thought Catcher is an Android-first personal idea inbox. Its promise: "Capture the thought before it disappears." The user taps once to start speaking (or types), taps once more to save, and returns to what they were doing. AI organizes the thought later, in the background. The product is about continuity of thought, not notes, knowledge management, or an AI assistant.

Core loop: **CAPTURE → SAVE → ORGANIZE → RECALL → RESURFACE.**

## 2. Product Goals

| Goal | Measure |
|---|---|
| G1 Fastest possible capture | Intent → saved ≤ 3s (from widget/launch); from Home ≤ 2 taps |
| G2 Zero lost thoughts | 0 thoughts lost on interruption, offline, or AI failure |
| G3 Calm, premium, understandable in 5s | New-user test: can state purpose within 5s |
| G4 Useful recall | User finds an old thought via search in ≤ 10s [H] |
| G5 Repeat capture | ≥ 3 thoughts captured in first week [H] |

Non-goals: folders, rich-text editing, collaboration, chat with AI, dashboards, task management (P1 light only).

## 3. Target Users

Beachhead: students, creators, developers/builders, startup/product thinkers, high-thought-volume people. Not everyone. Design language and copy target people who capture in motion (walking, commuting, coding, between classes).

## 4. Core User Problem

Ideas appear when hands and attention are busy. Existing tools add friction (open app → choose note → type) or scatter thoughts across chats, notes and recorders. Result: thoughts vanish or become unretrievable.

## 5. Core User Journey

```
Thought appears
 → opens capture (widget / tile / app / shortcut)
 → Tap 1: recording starts instantly
 → speaks (pauses are fine)
 → Tap 2: saved locally, "Captured ✓"
 → returns to previous context
 → AI enriches in background (transcript, title, type, summary, tags)
 → thought appears organized in Inbox
 → later: searches by keyword/meaning OR gets resurfaced
```

## 6. Information Architecture

```
Thought Catcher
├── Home (capture hero + recent thoughts + optional resurfaced card [P2])
│   ├── Voice capture (in-place on hero)
│   └── Text capture (bottom sheet)
├── Inbox (feed + filter chips + search)
│   └── Thought Detail
│       └── Edit (inline)
└── Profile
    ├── Account (login / sign up / logout / delete account)
    ├── Privacy & data (audio retention, export, delete)
    ├── Notifications & resurfacing [P2]
    ├── AI processing
    ├── Sync
    ├── Help
    └── About
```

Auth, Splash, Permission and Review Sheet are overlays/flows, not tabs.

## 7. Navigation Recommendation

Recommended: 3-destination bottom bar — **Home · Inbox · Profile.** Capture is the hero of Home, not a tab.

| Option evaluated | Verdict |
|---|---|
| Hamburger drawer | Rejected — hides content, adds a tap, unnecessary for 3 destinations |
| 5-tab bar (Home/Inbox/Search/Projects/Profile) | Rejected — clutter, Projects is P2, Search lives inside Inbox |
| Single screen + FAB | Rejected — Inbox needs breathing room and back-stack clarity |
| Home / Inbox / Profile | **Selected** — simple, thumb-reachable, no tutorial needed |

Rules: Android back from a tab → Home; from Home → exit app (never traps). Back during recording = same as leaving the app (Held Thought), never a discard. Search is a field at the top of Inbox (also reachable by a search icon on Home) [H].

## 8. Complete Screen List

| ID | Screen | Priority |
|---|---|---|
| S1 | Splash | P0 |
| S2 | Mic permission primer (contextual, only on first Tap 1) | P0 |
| S3 | Home (hero capture + recent) | P0 |
| S4 | Voice capture (Home hero in recording state) | P0 |
| S5 | Text capture sheet | P0 |
| S6 | Held Thought review sheet | P0 |
| S7 | Inbox | P0 |
| S8 | Thought Detail (+ inline edit) | P0 |
| S9 | Search (inside Inbox) | P0 |
| S10 | Login / Sign up | P0 |
| S11 | Profile / Settings | P0 |
| S12 | Privacy & Data | P0 |
| S13 | Help | P0 (minimal) |
| S14 | About | P0 (minimal) |
| S15 | Resurfaced thought card + notification | **P2** *(was P1 — aligned with backend scope)* |
| S16 | Notification & resurfacing settings | **P2** *(was P1)* |
| S17 | Lightweight projects | **P2** *(was P1)* |

## 9. Screen-by-Screen UI Requirements

### S1 Splash
Warm paper background, static face silhouette fades in, line: "Had a thought?" then "Capture it before it disappears." Max 1.2s, never blocks: if Home is ready sooner, transition immediately. Use Android 12+ system splash → seamless handoff. Never shown again on warm start.

### S2 Mic permission (contextual)
Not shown at install. Triggered by the user's first Tap 1. Pre-prompt line: "Thought Catcher needs your microphone to hear your thoughts. Audio stays on your device until you choose otherwise." → system dialog. Denied: face shows disabled state; "Type instead" as primary; link "Open settings" (deep link). Text capture always works.

### S3 Home

| Zone | Content |
|---|---|
| Top | Wordmark (small, left). Search icon (right). |
| Hero (≈55% height) | 3D face, headline "Had a thought?", helper "Tap to speak" |
| Secondary | Text link/button "Type instead" under the face |
| Held banner (conditional) | "Unfinished thought · 0:14 — Review" |
| Recent | 3 latest thoughts as compact rows + "See all" |
| Resurfaced (conditional, **P2**) | One card max: "You had this thought 4 days ago" |
| Bottom bar | Home · Inbox · Profile |

No categories, folders or pickers on Home.

### S4 Voice capture (in-place, no new screen)

| State | UI |
|---|---|
| Idle | Face breathing, "Tap to speak" |
| Recording (after Tap 1) | Face listening pose, soft ring pulsing to input level, "Listening…", timer 00:07, helper "Tap to save", small Discard text button at bottom |
| Saving | <300ms; face settles |
| Saved | Face nod + check, "Captured ✓", sub-line "Saved safely. AI organization will continue when available." (shown only if offline; else "Organizing…"). Auto-returns to Idle after 1.5s |

Bottom nav dims during recording to remove distraction. No Stop button, no Save button, no silence auto-stop — the face itself is Tap 2. Haptic: light tick on start, double tick on save (setting-controlled). Discard: tap → immediate discard with 5s "Undo" snackbar.

### S5 Text capture
Bottom sheet from "Type instead" (also widget/shortcut "Type" action opens straight into it, keyboard up). Prompt: "What's on your mind?"; multiline field auto-focused; Save button enabled when non-empty. Draft is autosaved locally as the user types. Leaving/closing = Held Thought (text). No confirm dialog. After Save: sheet dismisses, snackbar "Captured ✓".

### S6 Held Thought review sheet
Elements: audio player (or text preview), duration, Continue recording, Save now, Discard. Opening or saving commits it and starts AI.

### S7 Inbox
Top: title "Inbox", search field, horizontally scrollable filter chips. Body: chronological feed grouped by day headers (Today / Yesterday / date). Held banner pinned at top when applicable. Pull-to-refresh (sync). Swipe left on card = delete with undo [H].

### S8 Thought Detail

| Section | Style |
|---|---|
| Title (AI, editable) | Large text, "AI" micro-label |
| Your thought (RAW) | White surface card, labeled "Your thought", transcript + audio player |
| Organized by AI (GENERATED) | Tinted surface, labeled "Organized by AI", summary, type, tags, project |
| Meta | Timestamp, voice/text indicator, sync status |
| Actions | Edit, Delete (overflow), Retry AI (when failed) |

Raw vs AI distinction is mandatory: different surface tint + explicit label. Every AI field editable inline; edits mark field "Edited by you" and are never overwritten by later re-processing — **enforced server-side per-field**, not just hidden in the UI (see §25.3). Transcript is editable but original audio and original transcript are preserved (version accessible via "View original"). If a capture's transcript was first produced on-device as a **provisional** transcript, and the canonical server (Groq) transcript arrives later, the canonical version silently replaces it **unless** the user has already edited the transcript — in which case the user's edit wins and the canonical transcript is discarded.

### S9 Search (inside Inbox)
Single field: "Search your thoughts". Results appear as the same compact cards.
- **P0:** keyword search (title, transcript, summary, tags), works offline on local data.
- **P2** [H]: meaning-based results section "Related thoughts" when online — deferred with the backend's semantic search scope; not expected in the Shipaton build.

Recent searches (max 5). Empty result: "Nothing found. Try different words."

### S10 Login / Sign up
App works without account (local-first). Account prompt appears only after the 3rd capture or in Profile: "Back up and sync your thoughts" [H]. Screen: Continue with Google, Email + password, toggle Login/Sign up, Forgot password. Skip = "Not now". Anonymous data migrates into the account on sign-up; never lost — this is the client side of the backend's device-ID → user-ID migration (Backend PRD §4, §6).

### S11 Profile / Settings
Single list, no dashboard: Account · Privacy & data · Notifications · AI processing · Audio retention · Sync · Export · Help · About · Log out.

### S12 Privacy & Data
Human-readable rows: "Audio stays on this device" toggle-state, "Send to AI for organizing" (on/off), audio retention (**Delete after transcription** [default] / Keep / 30 days), Export (all thoughts), Delete all thoughts, Delete account (triggers the backend's 7-day soft-delete grace window — see Backend PRD §8).

### S13 Help
Accordion, 6 items: How Thought Catcher works · How voice capture works · How AI organization works · How resurfacing works · Privacy · Contact support.

### S14 About
Wordmark + face, one-line description, version, team/company, Privacy Policy, Terms, Contact.

## 10. Detailed User Flows

### 10.1 First launch
```
Install → Splash → Home (no tutorial, no account)
 → Tap face → mic permission (contextual) → recording begins
 → Tap face → Captured ✓ → (after 3rd capture) soft "Back up your thoughts?" card in Inbox
```

### 10.2 Voice capture (Contract C1–C9)
```
Home/Widget → Tap 1 → RECORDING (timer runs, no silence stop)
 → Tap 2 → local save → "Captured ✓" → return to context → AI queued
 → Interruption at any time → Held Thought (widget/Inbox banner)
```

### 10.3 Text capture
```
Type instead → sheet + keyboard → type (autosave draft) → Save → Captured ✓
 └─ leave → Held Thought (text)
```

### 10.4 AI processing (updated pipeline)

Voice captures follow a two-stage transcription path so the offline/instant guarantee (C8) and the backend's server-side Groq pipeline can both be true at once:

1. **Provisional (on-device, optional):** if on-device speech recognition is available, a provisional transcript is generated locally and shown immediately, marked internally as `transcript_source: provisional`. This is a UX nicety, not a requirement — if unavailable or offline, the card simply shows "Voice thought · 0:14" until the server responds.
2. **Canonical (server-side, via Groq):** once connectivity allows, the audio uploads and Groq returns the canonical transcript plus title/type/summary/tags. This **replaces** the provisional transcript and marks `transcript_source: server`, unless the user already edited the transcript — an edit always wins and the incoming canonical transcript is discarded for that field.

```
Saved (local) ──► QUEUED ──► PROCESSING ──► COMPLETE
   │                ├────────► PARTIAL (e.g., transcript ok, title failed)
   │                └────────► FAILED ──► Retry (manual + auto backoff)
   └── OFFLINE ──► WAITING FOR CONNECTION ──► auto-resumes
```

| State | Card display | Detail display |
|---|---|---|
| Queued/Offline | Raw text or "Voice thought · 0:14", subtle "Waiting to organize" | Raw only |
| Processing | Shimmer on title/summary lines, calm dot indicator | "Organizing…" |
| Complete | Title, summary, type, tags | Full |
| Partial | Whatever exists + "Some details missing" | Available fields + Retry |
| Failed | Raw content + "Couldn't organize · Retry" | Raw + Retry button |

Raw thought is always visible in every state. If the user has turned **"Send to AI" off** (S12), a capture never leaves the device for enrichment at all — it stays in a `disabled` enrichment state indefinitely and is still fully usable, searchable (keyword, locally), and syncable if signed in.

### 10.5 Search
```
Inbox → tap search → type → local instant results → (online, P2) "Related thoughts" → tap → Detail.
```

### 10.6 Resurfacing (P2)
```
Notification/Home card → Open (Detail) / Snooze (3 days) / Dismiss / "Why am I seeing this?"
(bottom sheet: "You captured this 4 days ago and haven't opened it since.")
```

### 10.7 Sign up
```
Profile/soft prompt → sign up → local thoughts merge → sync indicator → done.
```

### 10.8 Logout
```
Profile → Log out → confirm ("Your thoughts stay on this device") → returns to local-only mode; data retained.
```

## 11. Inbox Design Requirements

Card anatomy (compact, ≤ 96dp tall):
```
[type icon] Title (1 line, AI)                    [voice/text glyph]
  Summary (max 2 lines, muted)
  Type chip · tag · tag · +2                        2h ago  [status dot]
```

Status dot: none when complete/synced; pulsing when processing; outline when offline/unsynced; error color when failed. Cards without AI yet show raw first line as title. One tap opens Detail. No inline expansion. Density: 5–6 cards visible per screen.

## 12. Category / Filter System

Horizontal chip row: All · Ideas · Projects · Content · Learning · Reminders · Personal · Other (8 max visible; overflow "More"). Categories from spec are grouped: SaaS/Student project/Hackathon/Coding → Projects; Content idea → Content; Movie/Recommendation/Fun → Personal; Goal/Reminder → Reminders; Learning → Learning. [H] — validate grouping with users; backend may return finer types displayed as the card's type label.

Single-select chips; tap again to clear. Tag filtering: tap a tag on a card → filters Inbox by that tag (dismissible filter pill). Type is editable in Detail via a simple picker sheet. No separate screens per category.

## 13. Resurfacing Experience (P2 — aligned with backend scope; deferred past Shipaton)

MVP logic [H]: once per day max, pick a thought older than 3 days, never opened again, not dismissed. Formats: Home card (primary) and optional notification (default OFF until user opts in during Profile or after 5th capture). Copy: "You had this thought 4 days ago. AI portfolio generator. Still interested?" [Open] [Snooze] [Dismiss]. Controls: frequency (Off / Few per week / Daily), quiet hours, per-thought "Stop resurfacing this". Anti-spam: 2 consecutive dismissals → reduce frequency and ask "Show fewer reminders?"

## 14. Authentication (summary)

Local-first anonymous default → optional account for sync/backup. Login, sign up, forgot password, logout, delete account (in Privacy & Data — triggers backend's 7-day grace-window deletion). Auth never blocks capture.

## 15. Required States Matrix

| Screen | Default | Loading | Empty | Error | Offline | Processing | Success | Permission denied |
|---|---|---|---|---|---|---|---|---|
| Home | Face + recent | Face static, skeleton rows | "Your thoughts will appear here" | Recent list failed → hide, face still works | Small "Offline · saving locally" pill | AI dots on rows | Captured ✓ | Face disabled → Type instead |
| Voice capture | Idle | n/a (instant) | n/a | "Couldn't record. Try again or type." | Works normally | Post-save "Organizing…" | Captured ✓ | Primer → Settings link |
| Text capture | Empty field | n/a | Save disabled | "Couldn't save locally" (rare) + keep text | Works normally | — | Snackbar | n/a |
| Inbox | Feed | Skeleton cards | "Nothing here yet. Your first thought is one tap away." | "Couldn't refresh" + retry (local list still shown) | Local list + "Offline" pill | Per-card | — | n/a |
| Detail | Full | Skeleton | n/a | "Couldn't load audio" (text still shown) | Local content, audio if cached | "Organizing…" | "Saved" toast on edit | n/a |
| Search | Field | Spinner under field | "Nothing found" | "Search unavailable. Showing local results." | Keyword only | — | — | n/a |
| Auth | Form | Button spinner | n/a | Inline field errors | "You're offline. Try again later." | — | Synced ✓ | n/a |

## 16. Android-Specific Requirements

| Area | Requirement |
|---|---|
| Widget | See §17 |
| App shortcuts (long-press icon) | "Speak a thought", "Type a thought" — both start capture instantly |
| Quick Settings tile | See §18 |
| Back behavior | Standard system back; never discards; during recording = Held Thought |
| Mic permission | Contextual on first Tap 1; handle "Only this time", denied, permanently denied |
| Foreground capture session | For widget/tile-started recording; visible notification; mic-type foreground service |
| Offline | Full capture and keyword search offline |
| Lock screen | Widget/tile capture allowed from lock screen; no thought content shown on lock screen (notifications show generic text by default) |
| Screen sizes | Phone portrait primary; face scales; foldables/tablets: centered max content width (≈600dp) |
| Predictive back, edge-to-edge, Material system bars | Supported |
| Accessibility | TalkBack labels ("Start capturing a thought" / "Recording, 7 seconds, double-tap to save"), 48dp min targets, font scaling to 200%, contrast ≥ 4.5:1, reduce-motion → static face, haptics optional, screenreader announcements for state changes |
| Notification permission (Android 13+) | Requested only when the user enables resurfacing (P2) |

## 17. Widget Requirements

| Widget | Size | Content |
|---|---|---|
| Capture (P0) | 2×1 | Face glyph + "Tap to speak", secondary mic-off "Type" icon |
| Capture + Held (P0) | 2×2 | Same + Unfinished thought card ("0:14 · Tap to review · ✕") when a Held Thought exists |
| Recent (P1) | 4×2 | Latest 3 thoughts titles (respects lock-screen privacy) |

Behavior: Tap 1 on widget starts recording immediately (via foreground capture session) without opening the full app. Widget switches to "Listening 00:07 · Tap to save". Tap 2 saves. Toast "Captured ✓". Held card: tap = Review Sheet, ✕ = remove card only (thought goes to Inbox), double-tap [H] = resume recording. Widget states: idle, recording, saved (2s), held, error (mic denied → opens app to Type). Widget respects system theme (light/dark).

## 18. Quick Settings Tile

Tile "Catch a thought": inactive = "Tap to speak"; active while recording with elapsed time; tap again to save. Works from lock screen where OS allows; uses foreground capture session and notification. Long-press tile opens app to Home.

## 19. Notification Requirements

| Notification | Priority | Content | Actions |
|---|---|---|---|
| Active capture (ongoing) | P0 | "Catching a thought… 00:12" | Save, Discard |
| Held thought reminder | P0 | "You have an unfinished thought" (only if untouched 15 min [H]) | Review, Save |
| Processing failed | P1 (silent, in-app badge preferred) | — | Retry |
| Resurfacing | **P2** | "You had this thought 4 days ago" | Open, Snooze, Dismiss |

Channels: Capture (ongoing, low importance, no sound), Resurfacing (default, user-controllable). Lock screen visibility: generic text unless user opts in.

## 20. Privacy UX

| Moment | UX |
|---|---|
| Recording | Persistent visible indicator (timer + ring; system mic indicator respected); ongoing notification when in background |
| Local storage | Profile → Privacy: "Your thoughts are saved on this device first." |
| AI processing | First time only, inline note on first Captured: "Your thought is sent securely to AI to organize it. You can turn this off in Privacy." Toggle available — **enforced server-side**: when off, the backend never receives the capture for enrichment (Backend PRD §6/§9). |
| Audio retention | Choice: **Delete audio after transcription [default]** / Keep audio / Auto-delete after 30 days. *(Changed from v0.1's "Keep" default to match the backend's data-minimization stance — see Open Questions, now resolved.)* |
| Deletion | Delete thought (undo 5s → permanent, incl. audio and AI data). Delete all. Delete account with plain-language description of what is removed — backend soft-deletes immediately, hard-deletes after 7 days. |
| Export | Export all as JSON/Markdown/ZIP with audio (P0-lite: text export via the backend's export endpoint; audio export P1) |
| Sync | State visible: "Synced / Waiting / Off". Explain that sync requires an account. |
| Language | Plain, short, no legalese in primary screens; legal text only via Terms/Policy links |

## 21. Help / About (content spec)

Help: 6 accordion items (see S13), each ≤ 80 words, one contact action (email/support form). About: as S14. No feature marketing.

## 22. Design System

Personality: calm, premium, trustworthy, quiet. Restrained palette, generous space, one accent. No gradients, glassmorphism, neon or "AI sparkle" motifs. AI is signalled by a small text label, not decoration.

### 22.1 Color palette (5 + 1 functional) — [H] validate contrast/brand feel

| Role | Name | Hex |
|---|---|---|
| Background | Paper | #F6F3EE |
| Surface | Porcelain | #FFFFFF |
| Primary text / primary button | Ink | #1C1B1A |
| Secondary text / borders | Stone | #77726A |
| Accent (recording, active chip, AI label) | Sage | #4F7A6A |
| Functional: error / destructive | Clay | #B3413A |

AI-generated surfaces use Sage at 8% tint on Porcelain. Recording ring uses Sage (not red) to stay calm; error uses Clay only. Dark theme: P1 [H] (Ink background, Paper text, same Sage).

### 22.2 Typography

UI: Inter (or system Roboto fallback). Hero headline: a soft serif (e.g., Newsreader) [H], used only on Home headline and splash.

| Style | Size / weight |
|---|---|
| Display (hero) | 28sp serif |
| Title | 22sp / 600 |
| Card title | 16sp / 600 |
| Body | 15sp / 400 |
| Caption / meta | 12sp / 500 |
| Timer | 32sp tabular numerals |

### 22.3 Shape, elevation, icons

Radius: cards 16dp, chips full pill, buttons 14dp, sheets 24dp top. Elevation: cards flat with 1dp Stone@15% border; only sheets and the face have soft shadow. Icons: 1.5dp line icons, rounded caps, single style (Material Symbols Rounded, light weight). Spacing scale: 4 / 8 / 12 / 16 / 24 / 32dp; screen margin 20dp.

## 23. Component Requirements

| Component | Spec |
|---|---|
| Face hero | See §24 |
| Primary button | Ink fill, Paper text, 52dp tall, full width in sheets |
| Secondary/text button | Stone text, no fill |
| Text input | Porcelain fill, 1dp border, 16dp radius, min 3 lines for thought entry |
| Thought card | See §11 |
| Chip | 32dp, Paper with border; selected = Sage fill, white text |
| Tag | Text-only, muted, # not required |
| Type label | Small icon + text, muted |
| Bottom bar | 3 items, icon + label, Ink selected, no badge except Held dot |
| Recording indicator | Ring around face + timer + "Listening…" |
| AI processing indicator | Small pulsing Sage dot + "Organizing…"; shimmer lines on cards |
| Snackbar | Ink background, single action (Undo/Retry) |
| Bottom sheet | Text capture, Review, pickers |
| Audio player | Play/pause, scrubber, duration, speed (P1) |
| Banner | Held thought, offline pill, permission notice |
| Empty state | Line illustration (face outline), 1 sentence, 1 action |
| Skeleton | Paper-toned shimmer, no color |

## 24. 3D Face Interaction Requirements (product signature)

Concept: a minimal, matte, faceless-leaning head/bust — soft planes, subtle brow and nose ridge, no eyes, no mouth by default. It is the button. It reads as "a mind listening," not a character.

| Aspect | Spec |
|---|---|
| Shape | Simplified bust, ~1:1.2 ratio, low-poly-smooth, human but abstract |
| Material | Matte porcelain/clay, subtle subsurface softness, Paper/Porcelain tones, no textures |
| Lighting | Single soft key light from top-left, gentle ambient; no dramatic contrast |
| Idle | Slow "breathing" scale (≤2%) and 3–5° parallax with device tilt; hint ring pulses once on first launch |
| Listening (after Tap 1) | Head tilts ~8° forward; soft Sage ring/halo expands with voice amplitude; surface remains still |
| Saving | Quick settle, 300ms |
| Success | Small nod + check mark near chin/ring, 800ms, returns to idle |
| Processing (background) | Not shown on hero; use dot indicators in cards |
| Error | Ring turns Clay briefly, head slightly lowers; message below |
| Denied/disabled | Desaturated face, no breathing |

Usability safeguards:
1. Persistent text label under the face ("Tap to speak") so it never depends on discovering the face is a button.
2. Large tap target (entire hero area ≥ 200dp), with tap feedback (ripple/haptic) on Tap 1 immediately, before any 3D animation completes.
3. Recording must start before animation; visuals follow audio state, never gate it.
4. Performance budget: ≤ 60fps on mid-range devices; fallback to pre-rendered 2D/Lottie on low-end devices or Battery Saver.
5. Reduce-motion / accessibility: static image, timer and text carry all state.
6. Face must render without loading spinner (bundled asset, first frame < 300ms).
7. Widget/tile use a flat 2D face glyph derived from the 3D asset.

## 25. Frontend–Backend Data Requirements

### 25.1 Client-owned identity & sync principles

- Client generates thought ID (UUID) and timestamps. Create is idempotent — this UUID is the same value the Backend PRD (§5) uses as the Firestore document ID, so the two contracts are already aligned on the idempotency key.
- **Local database is the source of truth for display; the backend (Firestore) is the sync and cross-device reconciliation layer, not an authoritative override.** This is the confirmed, shared framing between frontend and backend — the backend PRD's earlier "Firestore is the source of truth" language has been corrected to match this.
- Every thought carries two independent statuses: `sync_status` and `enrichment_status`.
- If the user has "Send to AI" off, `enrichment_status` is set to `disabled` and the backend never receives that capture's content for enrichment, even if sync is otherwise on.

### 25.2 Thought object (conceptual)

| Field | Type | Notes |
|---|---|---|
| id | UUID | client-generated; also the Firestore document ID |
| created_at / updated_at | timestamp | client + server |
| source | voice / text | |
| capture_state | held / committed | held = unfinished (§0.3); backend must not enrich or sync a `held` capture |
| raw_text | string | user-entered text (text capture) |
| audio | ref + duration + retention flag | if voice |
| transcript | string + transcript_edited flag | AI or edited |
| transcript_source | provisional / server | provisional = on-device recognition (if available); server = canonical Groq transcript. Never downgrades from server back to provisional |
| title / summary | string + \*_edited_by_user flags | AI-generated |
| type | enum | AI-generated, editable |
| tags | string[] | AI-generated, editable |
| project_id | optional | P2 |
| sync_status | local_only / syncing / synced / conflict / error | |
| enrichment_status | pending / processing / complete / partial / failed / disabled | `disabled` = "Send to AI" is off for this capture |
| enrichment_error | code + message | |
| version | integer | optimistic-concurrency counter; sent as `base_version` on every Update call, incremented server-side on each accepted write |
| deleted | soft-delete flag + timestamp | for undo/sync |

### 25.3 API expectations (conceptual — implementation by backend team)

| Capability | Purpose | Input | Expected output | Loading | Error | Offline |
|---|---|---|---|---|---|---|
| Create thought | Persist a thought remotely | Thought object (id, source, text/audio ref, timestamps) — only once `capture_state` is `committed` | Ack + server version | Silent (background) | Retry w/ backoff; local stays valid; status error after N fails | Queue; sync later |
| Upload & transcribe voice | Send audio for canonical transcription | Audio file + thought id | Upload ack; canonical transcript via enrichment, `transcript_source: server` | Progress on detail only | Retry; keep local audio | Queue upload; provisional (on-device) transcript shown meanwhile if available |
| Get thought | Fetch one thought | id | Full thought incl. AI fields | Skeleton | "Couldn't load" + local fallback | Local copy |
| Get inbox | Paged feed | cursor, filters (type, tag), page size | Thoughts + next cursor + sync token | Skeleton | Banner + local list | Local list |
| Update thought | Edit fields | id + changed fields + `base_version` | Updated thought, new `version` | Optimistic | Version conflict → return both versions; revert + snackbar | Queue edit |
| Delete thought | Soft delete | id | Ack | Optimistic + Undo | Restore + snackbar | Queue deletion |
| Search | Keyword + semantic query, mode | query, mode | Ranked thoughts, `match_type` (keyword/related) — semantic is **P2** | Spinner | Fall back to local keyword | Local keyword only |
| AI enrichment status | Track processing | thought id(s) | status + fields (transcript, title, type, summary, tags) per field availability | Dot/shimmer | failed + reason | Stays pending |
| Retry enrichment | Manual retry | id | New status | Dot | Error toast | Disabled + "Waiting for connection" |
| Categories/types | List type set | — | Enum list + display names | Cached | Use bundled default | Bundled |
| Tags | Suggest/list tags | prefix | Tag list + counts | — | Local tags | Local |
| Projects (P2) | List/create/assign | name / ids | Project objects | — | Toast | Queue |
| Resurfacing (P2) | Get candidate | user prefs | Thought id + reason text ("4 days old, unopened") | Hidden until ready | No card | Local rule fallback |
| Resurfacing feedback (P2) | Snooze/dismiss | id + action | Ack | — | Local | Queue |
| Authentication | Sign up, login, logout, delete account, refresh | credentials/OAuth token | Session + user | Button spinner | Inline errors | Local mode continues |
| Sync | Bidirectional | changes since token | Server changes + conflicts | Sync status pill | Retry; show "Sync paused" | Queue |
| Export | Get all data | format | File/URL | Progress | Retry | Local export of text |

**Contract requirements for backend:** partial enrichment results must be returned per field; enrichment must be idempotent and must not overwrite user-edited fields (checked via each field's `*_edited_by_user` flag before any write); a capture's `capture_state` must be `committed` before the backend enriches or syncs it; conflicts return both versions using the `version`/`base_version` field; deletion propagates to audio and AI data within the account-deletion grace window (Backend PRD §8) or immediately for a single-thought delete; if "Send to AI" is off, no capture content is transmitted for enrichment under any circumstance.

## 26. MVP Scope

| Priority | Features |
|---|---|
| P0 | Splash; contextual mic permission; two-tap voice capture (Contract C1–C9); text capture; instant local save; Held Thoughts; Home; Inbox with chips; Thought Detail with raw vs AI distinction; edit/delete with undo; AI enrichment states (processing/failed/partial/retry/offline); keyword search; anonymous mode + login/sign up/logout; **cross-device sync (core, not stretch — Backend PRD §5/§11)**; Profile with Privacy, Help, About; widget (capture + held); app shortcuts; Quick Settings tile; ongoing capture notification |
| P1 | Dark theme; recent widget; audio export; audio speed control |
| P2 | Resurfacing (Home card, notifications, snooze, controls); lightweight projects; task/reminder conversion; semantic/"Related thoughts" search; web app; share sheet & browser capture; AI chat; knowledge graph; collaboration; complex productivity features |

Anti-creep rule: any proposed screen must justify "does it help capture, organize, retrieve or rediscover a thought?"

## 27. Acceptance Criteria

**Voice capture**
- Tap 1 starts audio writing within 300ms; timer starts at 00:00.
- No control other than face (Tap 2) and Discard is required to save.
- Silence of any length (tested up to 2 minutes) does not stop recording.
- Tap 2 shows "Captured ✓" within 500ms, offline included.
- Force-kill during recording, then relaunch: audio present as Held Thought.
- Home/lock/call interruption yields a Held Thought; no discard occurs.
- Discard offers 5s undo.

**Held thought**
- Appears in widget and Inbox banner; tap opens Review Sheet; Continue appends audio.
- Widget ✕ removes card only; thought exists in Inbox.
- Untouched Held Thought auto-commits after the configured window and enters AI queue.

**Text capture**
- Field focused with keyboard within 300ms of opening; Save enabled on first character.
- Leaving mid-typing preserves text as Held Thought.

**AI processing**
- Raw thought visible in all AI states; failure never removes content.
- Offline shows "Waiting to organize"; auto-resumes on reconnect without user action.
- Partial results render immediately; Retry only regenerates missing fields.
- Edited fields are never overwritten by later processing, enforced server-side.
- A provisional (on-device) transcript, if shown, is replaced by the canonical server transcript without user action, unless the user has already edited it.

**Inbox**
- Renders from local storage in < 500ms; supports 1,000+ thoughts smoothly; chips filter instantly.

**Thought Detail**
- Raw content and AI content visually and textually distinct; audio playable offline if retained.

**Search**
- Keyword results < 300ms locally; offline works; empty state shown when no matches.

**Authentication**
- User can capture ≥ 3 thoughts with no account; sign-up merges local thoughts without loss.

**Resurfacing (P2)**
- Max 1 card/day by default; Snooze, Dismiss, "Why this?" available; two dismissals reduce frequency.

**Privacy**
- Recording state always visibly indicated; AI-processing toggle honored (off = never sent, verified server-side, not just hidden client-side); delete removes audio and AI data; default audio retention is **delete after transcription**.

**Accessibility**
- All flows completable with TalkBack; targets ≥ 48dp; text scales to 200% without truncation of primary actions.

## 28. UX Risks

| Risk | Mitigation |
|---|---|
| 3D face not obviously a button | Persistent "Tap to speak" label, hint ring, big tap area |
| 3D performance/battery | Fallback 2D, frame budget, Battery Saver mode |
| Accidental Tap 2 / accidental start | Haptics, visible timer, easy Review from Held/Inbox; short recordings (< 1s) auto-discarded with undo [H] |
| Unattended long recording (no silence stop) | Visible timer, 10-min cap, ongoing notification |
| Background mic misperceived as spying | Persistent notification, clear privacy copy, foreground-service only when started from widget/tile |
| Held Thoughts clutter | Auto-commit window, single banner not a list |
| AI mislabels feel wrong | Everything editable, clear "Organized by AI" label |
| Category grouping mismatch | Validate chips with student/creator users |
| Notification fatigue | Off by default, 1/day cap, dismiss-based backoff |
| Auth friction | Anonymous mode, delayed prompt |
| Lock-screen exposure | Generic notification text by default |
| Provisional vs. canonical transcript mismatch confuses the user | Provisional transcript upgrades silently in place; never surfaced as a jarring rewrite once the user has already read it |

## 29. UI Simplification Recommendations

1. One capture surface (Home hero) — no separate voice screen.
2. Merge Stop+Save into a single Tap 2.
3. Search inside Inbox, not its own tab.
4. Filter chips instead of category screens; no folders.
5. Detail screen edits inline; no separate Edit screen.
6. Settings as one list; Help and About as short static pages.
7. Show only one contextual banner at a time (Held > Offline > Sync).
8. Ask permissions only at moment of use.
9. No onboarding carousel.
10. Defer Projects and Resurfacing to **P2**, matching the backend's Shipaton-window scope — not just "until P0 is validated."

## 30. Final Recommended Frontend Architecture (conceptual)

Layers: UI (screens/components) → presentation state (per-screen state models) → domain (capture, held-thought rules, transcription — provisional local + canonical server, enrichment status, search) → local data store (source of truth) → sync/queue layer (background, network-aware) → backend API.

- Local-first: all reads from local store; writes commit locally then enqueue.
- Capture module isolated from the rest of the app so widget, tile, shortcut and in-app hero share one implementation and the same Held Thought logic.
- Background work: upload/transcription/enrichment/sync run as queued jobs with backoff; UI only observes status.
- Feature flags: semantic search (P2), resurfacing (P2), audio retention default.
- Design tokens for color, type, spacing; component library shared across app and widgets.
- Analytics (privacy-safe): time-to-save, Tap1→Tap2 duration, held-thought rate, AI failure rate, search success.

```
APP
├── Splash (≤1.2s: "Had a thought?" / "Capture it before it disappears.")
├── Main (bottom bar: Home · Inbox · Profile)
│   ├── HOME
│   │   ├── Face hero ── Tap 1: recording starts ── Tap 2: saved ("Captured ✓")
│   │   │     • timer, "Listening…", small Discard (5s undo)
│   │   │     • no Stop/Save buttons, no silence auto-stop
│   │   ├── "Type instead" ── Text sheet (Save)
│   │   ├── Held-thought banner (if any) ── Review Sheet
│   │   ├── Recent thoughts (3) + See all
│   │   └── [P2] Resurfaced card
│   ├── INBOX
│   │   ├── Search field (keyword; related thoughts P2)
│   │   ├── Filter chips (All · Ideas · Projects · Content · Learning · Reminders · Personal · Other)
│   │   ├── Held banner
│   │   └── Feed of compact cards ── Thought Detail
│   │         ├── Your thought (raw: text/transcript + audio)
│   │         ├── Organized by AI (title, summary, type, tags) — all editable
│   │         └── Retry (if failed/partial), Delete (undo)
│   └── PROFILE
│       ├── Account (Login / Sign up / Log out) — optional
│       ├── Privacy & data · Notifications · AI processing · Audio retention · Sync · Export
│       ├── Help
│       └── About
└── OUTSIDE THE APP
    ├── Widget 2×1 / 2×2 (Tap 1 / Tap 2 capture + Unfinished-thought card)
    ├── App shortcuts (Speak, Type)
    ├── Quick Settings tile
    └── Notifications (Active capture; Held reminder; [P2] Resurfacing)
```

Navigation rules: three tabs, no drawer, capture is the hero of Home. Back never discards. Capture rules: Contract §0 (C1–C9).

## Open Questions for the Team

1. **Double-tap behavior** (still open): the note mentioned double-tap on the widget/held item. This PRD assumes double-tap = resume recording; confirm or change.
2. **Auto-commit window / hard cap** (still open): 30 min auto-commit and 10 min hard recording cap are both assumed — confirm.
3. **Background recording scope** (still open): confirm recording continues only when started from widget/tile/shortcut, and finalizes when leaving the in-app hero.
4. ~~Audio retention default~~ — **Resolved:** delete after transcription, aligned with the backend's data-minimization stance (user can still choose Keep).
5. ~~Semantic search in P0 or P1~~ — **Resolved:** P2, deferred with the backend's scope; not expected in the Shipaton build.
