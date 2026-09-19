# Thought Catcher — Backend PRD (v4)

*Companion to the product PRD (17 Sep 2026 research → 18 Sep 2026 product plan). Scope: everything needed server-side to support the P0 client build in the 12-day Shipaton window (18–30 Sep 2026), built security-first with an explicit path toward enterprise-grade compliance.*

*v4 changes: cross-device sync promoted from P1 to a required v1 feature; revenue model confirmed as subscription-only for now, with pay-per-use consumables deferred to Phase 2; added a full Security & Compliance Architecture section; added a compliance roadmap that's honest about what's achievable in 12 days on a free-tier stack vs. what's a later-phase milestone; build order updated accordingly.*

## 1. Purpose & Scope

The client is offline-first: every capture is written to local Room/SQLite before anything touches the network. The backend exists to:

- Turn a raw capture into an enriched note (title, type, summary, tags) via an AI gateway — for every user, signed in or not.
- **Sync captures across devices for signed-in users — now a required v1 capability, not optional.**
- Authenticate users and manage accounts (including deletion, for Play policy and privacy compliance).
- Gate the Pro tier via RevenueCat entitlement checks. **Revenue model for v1 is subscription-only; pay-per-use consumables are explicitly Phase 2** (see §7).
- Protect user data with a security architecture that's real today and extensible toward formal certification later, rather than security theater.
- Never become a reason a capture is lost, delayed, or blocked.

**Out of scope (P2, post-Shipaton):** resurfacing/nudge engine, project clustering, convert-to-task, semantic/vector search, "chat with your whole brain," Assistant/App Actions backend, pay-per-use billing, formal compliance certification.

## 2. Architecture Overview

- The capture is sent to Groq, which returns a title, type, short summary, and tags. The app never blocks on this — the note updates in place once ready.
- Every signed-in user's captures are written to Firestore and sync to any other device on the same account via a live listener — no custom sync logic, Firestore does this natively. This is now a core part of the account experience, not a stretch feature.
- Whenever someone subscribes to Pro (or cancels), RevenueCat notifies the backend via webhook so it can unlock or lock premium features.
- Every write path — capture, sync, enrichment, entitlement — passes through Firestore Security Rules and Cloud Functions that assume the request could be hostile, not just clumsy.

**Guiding principle unchanged: the backend is a helper, not a dependency.** Security additions in this version harden *how* the backend does its job — they don't change the offline-first guarantee that a capture is never lost.

## 3. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Backend platform | Firebase | Managed infra, generous free tier, encryption at rest and in transit by default |
| Database | Firestore | Native realtime sync (powers cross-device sync and enrichment-status push); per-document Security Rules |
| Sign-in | Firebase Auth | Email/OTP or Google sign-in; supports MFA if enabled later |
| Server logic | Firebase Cloud Functions | Hosts the Groq call and the RevenueCat webhook; secrets never touch the client |
| AI enrichment | Groq (Llama-class model) | Fast, cheap, simple API |
| Payments | RevenueCat | Required for Shipaton eligibility; subscription entitlements only in v1 |
| Abuse/integrity | **Firebase App Check** | Verifies requests to Cloud Functions/Firestore come from your genuine app binary, not a script or a tampered client — closes the obvious hole in the device-ID quota system |
| Audit logging | Firestore `audit_log` collection + Cloud Functions structured logging | Every account-deletion, entitlement-change, and admin action is recorded with actor, timestamp, and outcome |

## 4. What Data the Backend Needs to Store

### Identities
- **Device ID** — client-generated anonymous ID, used for free-tier quota before any account exists. Verified via App Check, not trusted blindly.
- **Users** — account info, free/Pro plan, RevenueCat customer ID.

On sign-in, device-ID history migrates onto the new user ID.

### Captures
Text (or voice-transcript reference), creation time, enrichment status (`pending`/`processing`/`done`/`failed`), a client-generated UUID as the Firestore document ID, and `device_id` or `user_id`. **Signed-in users' captures are written to Firestore as the primary sync mechanism, not an optional mirror** — local Room stays the offline cache and safety net, Firestore is now the cross-device source of truth for that account.

### Enrichments
Kept separate from the raw capture so the original is never overwritten.

### Usage
Rolling daily + weekly AI enrichment counters per device/user (see §6).

### Entitlements
Plan status (`active`/`in_grace_period`/`in_billing_retry`/`expired`), mirrored from RevenueCat, which remains the source of truth.

### Audit log (new)
Append-only records of: account deletions, entitlement changes, admin/support access to a user's data (if that's ever needed), and failed-auth spikes. Each entry: actor, action, target, timestamp, result. Never deletable, only retained/rotated per the retention policy in §8.

## 5. What the Backend Needs to Do (API-level)

| Capability | What it's for |
|---|---|
| Sign in / create session | Links device to account; migrates device-ID history |
| **Sync captures (core, not optional)** | Every signed-in user's captures live in Firestore, keyed by the capture UUID as the document ID so retries never duplicate. This is what makes cross-device sync work — a second device signed into the same account gets the full capture history immediately via a listener, no explicit "sync" action needed |
| Request enrichment | Quota-checked call to Groq via Cloud Function, keyed by device/user ID |
| Enrichment status | Firestore listener on the capture document; poll-on-resume fallback |
| Fetch captures | Signed-in only; primarily for first load and reinstall recovery, since the listener handles live updates |
| Search (P1) | Local-first; cloud fallback once sync is in place |
| Delete account | In-app trigger → soft-delete → 7-day grace window → scheduled hard-delete, logged to the audit log |
| Receive RevenueCat updates | Deduplicated webhook handling; updates plan/entitlement status |

## 6. AI Enrichment — Quota & Flow

- **Free tier:** 2 enrichments/day, up to 10/week, whichever limit hits first. Starting numbers — tune once real Groq cost is measured.
- **Past the quota (v1):** blocks further free enrichment and surfaces the Pro paywall via the existing RevenueCat subscription entitlement. **Pay-per-use consumable billing is explicitly Phase 2** — noted, not built now, so the Cloud Function's gating logic stays simple (one boolean: within quota or not, plus Pro-active-or-not) rather than needing a metered-billing integration this cycle.
- App Check verifies the request came from the real app before the quota check runs, so quota can't be trivially hammered by a script calling the Cloud Function directly.
- On failure: capture stays untouched and usable, status set to `failed`, one automatic retry with backoff, then a manual retry surfaces in the UI. A failed attempt doesn't consume quota.
- Target turnaround ~2–4 seconds for the majority of calls; a design target, not an SLA yet.
- Per-enrichment cost logged daily so spend stays visible and well under ₹199/month per Pro user.

## 7. RevenueCat & Revenue Model

**Phase 1 (this build): subscription-only.**
- Free tier as above; Pro at ₹199/month or ₹1,499–1,999/year, unlocking unlimited enrichment, sync, and resurfacing (once resurfacing ships post-Shipaton).
- RevenueCat webhook → Cloud Function, verified by shared secret, deduplicated by event ID against a processed-events collection.
- Entitlement status tracked as `active`/`in_grace_period`/`in_billing_retry`/`expired` — a payment hiccup doesn't instantly lock out a paying user.
- RevenueCat remains the source of truth; the backend's copy is a cache.
- At least one purchase must flow through RevenueCat's SDK before the Sep 26–27 submission buffer — test this early, not last.

**Phase 2 (post-Shipaton, not built now):** pay-per-use consumable enrichment packs for users who exceed quota without wanting a full subscription. Requires a separate RevenueCat consumable product, metered-usage tracking beyond the simple daily/weekly counters, and its own gating logic in the Cloud Function. Deliberately deferred so v1 ships on the simpler model.

## 8. Privacy, Data Protection & Deletion

- Voice transcribed on-device wherever possible; the backend usually only sees text.
- Any audio that does reach the backend is deleted right after transcription unless the user opts to keep it.
- **Account deletion:** in-app trigger → immediate soft-delete (access blocked, sync/enrichment stopped) → **7-day grace window** for accidental-tap recovery → scheduled Cloud Function hard-deletes all associated Firestore documents, logged to the audit log.
- **Data subject rights (built toward, not just DPDP):** the same deletion flow satisfies "right to erasure" under GDPR (EU) and CCPA/CPRA (California) as well as DPDP (India) — they're aligned enough that one well-built flow covers all three. A basic **data export** endpoint (return a user's captures + account info as JSON) is a small addition on top of the fetch-captures endpoint and covers GDPR's "right to access/portability" — worth adding in the same work as deletion since it reuses the same query.
- **Data residency:** Firestore location is set to a single region at project creation. For a v1 focused on India, `asia-south1` (Mumbai) keeps data in-country, which matters for DPDP. **True "worldwide" compliance (e.g., EU personal data staying in the EU under GDPR data-residency expectations) needs a multi-region strategy — a real architecture change, not a config flag — and is a Phase 2/3 item**, not something a single Firebase project does out of the box.
- Consent: mic permission requested only at first capture; a plain-language notice on what leaves the device and where it's processed (Groq, Firebase); privacy policy and Play Data Safety form kept in sync with actual behavior.

## 9. Security & Compliance Architecture

**What's real and built in this cycle:**
- **Encryption in transit:** TLS enforced by default on all Firebase/Firestore/Cloud Functions traffic — nothing to configure, but explicitly verified, not assumed.
- **Encryption at rest:** Firestore encrypts all stored data by default with Google-managed keys.
- **AuthN/AuthZ:** Firebase Auth for identity; Firestore Security Rules enforce that a request can only read/write documents matching its own `uid` or `device_id` — checked server-side on every request, not just hidden by client UI.
- **App Check:** blocks requests that don't originate from the genuine, unmodified app — the real defense against quota abuse and API scraping, not just a nice-to-have.
- **Secrets management:** Groq API key and RevenueCat webhook secret live only in Cloud Functions environment config, never shipped in the app binary.
- **Audit logging:** every deletion, entitlement change, and any admin data access is recorded, append-only, with actor/action/timestamp.
- **Least privilege:** no service-account keys with broad project access are ever embedded client-side; Cloud Functions run with scoped IAM roles, not project-owner permissions.
- **Rate limiting / abuse control:** the daily/weekly quota plus App Check double as the practical rate-limit layer for a project this size.

**What's a real, honest roadmap item — not built in 12 days, and flagged as such rather than claimed:**

| Milestone | What it requires | Realistic phase |
|---|---|---|
| SOC 2 Type I / II | Months of evidence collection against documented controls, plus a paid third-party audit | Phase 3 — only pursue once there's a paying enterprise customer asking for it |
| ISO 27001 | Formal ISMS documentation, risk assessments, external certification audit | Phase 3, same trigger as SOC 2 |
| Multi-region data residency (true "worldwide" compliance) | Per-region Firestore instances or a different data architecture, plus routing logic | Phase 2/3, once there's real non-India user volume |
| Customer-managed encryption keys (CMEK) | Firestore Enterprise-tier feature, has cost implications | Phase 2, if a customer specifically requires it |
| Formal penetration test | Paid third-party engagement | Before any enterprise sales conversation, not before Shipaton |
| Signed DPAs with sub-processors | Google Cloud/Firebase already offers a standard DPA (usable now, no extra build work) — but formalizing your own DPA template for customers is a legal/business task, not an engineering one | Phase 2, business-side |
| Incident response runbook + breach-notification process (72-hour clocks under both GDPR and DPDP) | A written, rehearsed process — cheap to write, but genuinely needs to exist before it's true to claim | Should be drafted in Phase 2, even if never yet exercised |

This table is the honest version of "enterprise-grade" for a project at this stage: the engineering foundation is built correctly from day one, and the parts that require money, time, or a legal process are named rather than hand-waved.

## 10. Reliability & Data Integrity

- **Reliability:** local-first on the client remains the real safety net; the backend adds sync, enrichment, and entitlement on top, never as the only copy of the data until sync succeeds.
- **Idempotency:** capture UUID as Firestore document ID; RevenueCat events deduplicated by event ID.
- **Data isolation:** enforced by Firestore Security Rules per-document, backed by App Check — not just application-layer checks.
- **Backups:** Firestore is replicated by Google across zones by default (durability, not a substitute for a restorable backup). A scheduled export to Cloud Storage is a lightweight, low-cost addition worth doing once core features are stable — flagged as a Day 11 stretch item, not core P0.

## 11. Backend Build Order (mapped to the 12-day plan)

| Client-side day | Backend task |
|---|---|
| Day 1–2 | Firestore setup (users, device IDs, captures, enrichments, usage counters, entitlements, audit log) with **Security Rules and App Check wired in from the start** |
| Day 4–5 | AI enrichment Cloud Function — quota checks, Groq call, retry/failure handling, status via Firestore listener |
| Day 6–7 | **Cross-device sync as a core deliverable**: capture writes to Firestore for signed-in users, listener-based fetch on second device, anonymous→account migration |
| Day 8 | Integration pass #1: capture → enrich → sync → second-device read-back, on a flaky-network simulation |
| Day 9 | RevenueCat webhook Cloud Function (dedup, grace-period states); real subscription tested end-to-end |
| Day 10 | Account deletion (soft-delete + 7-day grace + scheduled hard-delete) + data export endpoint + audit log wiring |
| Day 11 | Integration pass #2, cost/latency check against real Groq usage, optional Cloud Storage export as a backup stretch goal |
| Day 12 | Buffer only — reserved for client submission |

## 12. Open Questions

- Confirm daily/weekly quota numbers (proposed 2/day, 10/week) against real Groq pricing.
- Firestore region: `asia-south1` (Mumbai) proposed for DPDP alignment — confirm before Day 1, since changing region later means migrating data.
- Data export endpoint: build now alongside deletion (recommended, low incremental cost) or defer to Phase 2?
- Who owns drafting the incident-response/breach-notification runbook, and by when — it doesn't need engineering time, but it does need to exist before "compliant" is said out loud to anyone outside the team.
