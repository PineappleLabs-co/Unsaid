# Thought-Catcher Complete Project Features Specification

This document provides a comprehensive technical breakdown of all features, services, AI integrations, monetization architectures, privacy protocols, and sync mechanisms implemented across the **Thought-Catcher** ecosystem.

---

## 1. System Architecture & High-Level Flow

Thought-Catcher is built as a **Local-First, AI-Augmented Cognitive Workspace** consisting of a React + Vite (Capacitor-ready) frontend and an asynchronous Python FastAPI backend backed by SQLAlchemy and Groq LLM infrastructure.

```mermaid
flowchart TB
    subgraph Client["Frontend Client (React + Vite / Capacitor)"]
        UI[Glassmorphic UI / Onboarding / Capture]
        AudioRec[MediaRecorder & SpeechRecognition]
        SyncEng[Local Mutation Queue & Sync Engine]
        Storage[(Local Storage / IndexedDB)]
        UI --> AudioRec
        UI --> SyncEng
        SyncEng <--> Storage
    end

    subgraph Backend["FastAPI Backend (Async Core)"]
        AuthLayer[Dual Auth: Device-ID & Bearer JWT]
        ThoughtSvc[Thought Management Service]
        SyncSvc[Bi-directional Delta Sync Service]
        SearchSvc[Multi-field Fuzzy Search Service]
        PrivacySvc[GDPR/CCPA Privacy & Purge Service]
        RevCatSvc[RevenueCat Webhook & Entitlement Service]
        
        AIGateway[AI Gateway & Routing]
        AgentEngine[Multi-Agent Expansion Engine]
        STTEngine[Whisper Audio STT Service]
        AICache[(In-Memory AI Semantic Cache)]
        Audit[(Immutable Audit Log)]
        DB[(PostgreSQL / SQLite Database)]
    end

    subgraph External["External Services & APIs"]
        GroqAPI[Groq LLaMA 3.3 70B & Whisper API]
        RevCatAPI[RevenueCat In-App Purchases Engine]
    end

    SyncEng <-->|/api/v1/sync| SyncSvc
    AudioRec -->|/api/v1/thoughts/{id}/audio| STTEngine
    UI -->|/api/v1/enrichment/{id}/expand| AgentEngine

    SyncSvc --> DB
    ThoughtSvc --> DB
    SearchSvc --> DB
    PrivacySvc --> DB
    PrivacySvc --> Audit
    RevCatSvc --> DB
    RevCatSvc --> Audit

    AIGateway <--> AICache
    AIGateway --> GroqAPI
    STTEngine --> GroqAPI
    AgentEngine --> GroqAPI
    RevCatAPI -->|Webhooks| RevCatSvc
```

---

## 2. AI Integrations & Intelligence Layer

### 2.1 Multi-Provider AI Gateway (`AIGateway`)
- **Location:** [`Backend/app/ai/gateway.py`](file:///c:/Users/ASUS/Documents/GitHub/Thought-Catcher/Backend/app/ai/gateway.py)
- **Primary Model:** Groq LLaMA 3.3 70B Versatile (`llama-3.3-70b-versatile` / `openai/gpt-oss-120b`).
- **Autonomous Fallback Provider:** If Groq API credentials are missing or exceed rate limits, the system switches without crashing to a local deterministic extractor [`FallbackAIProvider`](file:///c:/Users/ASUS/Documents/GitHub/Thought-Catcher/Backend/app/ai/fallback_provider.py).
- **Prompt Templating & Versioning:** Prompts are decoupled from Python code in versioned JSON manifests under `prompts/thought-enrichment/v1.json`, allowing runtime hyperparameter adjustments (temperature, max tokens) without redeployment.

### 2.2 Semantic Response Caching
- **Location:** [`Backend/app/ai/cache.py`](file:///c:/Users/ASUS/Documents/GitHub/Thought-Catcher/Backend/app/ai/cache.py)
- **Zero-Token Acceleration:** SHA-256 content hashing of normalized text payloads. If identical input text with the same prompt version has been enriched previously, the response is served instantly from memory with **0 token cost** and <5ms latency.

### 2.3 AI Safety & Input Guardrails
- **Location:** [`Backend/app/ai/guardrails.py`](file:///c:/Users/ASUS/Documents/GitHub/Thought-Catcher/Backend/app/ai/guardrails.py)
- **Prompt Injection Defense:** Strips recursive prompt injection triggers (e.g., `Ignore previous instructions`, `SYSTEM PROMPT:`, markdown code block exploits).
- **JSON Repair & Pydantic Validation:** Automatically repairs malformed JSON formatting emitted by LLMs (stripping preamble text, fixing unescaped quotes) and strictly enforces output schema typing.
- **Tag Normalization:** Normalizes generated tags into clean lowercase kebab-case/slug strings with duplicate filtering.

### 2.4 Multi-Agent Thought Expansion Engine ("Take This Thought Further")
- **Location:** [`Backend/app/ai/expansion_agents.py`](file:///c:/Users/ASUS/Documents/GitHub/Thought-Catcher/Backend/app/ai/expansion_agents.py) & [`Frontend/src/screens/TakeFurtherModal.tsx`](file:///c:/Users/ASUS/Documents/GitHub/Thought-Catcher/Frontend/src/screens/TakeFurtherModal.tsx)
- Users can dispatch thoughts into 4 distinct specialized AI agent workflows:
  1. **Plan Mode (Project Architect & Execution Strategist):** Generates milestone checklists, chronological execution plans, strategic insights, and dependency breakdowns.
  2. **Research Mode (Market & Domain Analyst):** Performs domain context synthesis, technological feasibility analysis, risk identification, and comparative market nuance analysis.
  3. **Features Mode (Principal Product Manager):** Produces concrete product features, UX specifications, prioritized acceptance criteria (P0/P1/P2), and behavioral trade-offs.
  4. **Summary Mode (Executive Idea Synthesizer):** Distills core hypotheses, extracts primary decisions, and generates immediate next steps.

### 2.5 Audio Transcription & Speech-to-Text (STT)
- **Location:** [`Backend/app/services/transcription_service.py`](file:///c:/Users/ASUS/Documents/GitHub/Thought-Catcher/Backend/app/services/transcription_service.py) & [`Frontend/src/screens/RecordScreen.tsx`](file:///c:/Users/ASUS/Documents/GitHub/Thought-Catcher/Frontend/src/screens/RecordScreen.tsx)
- **Dual Engine Transcription:**
  - **Provisional Live Preview:** Uses the browser `webkitSpeechRecognition` for real-time text transcription feedback during voice capture.
  - **High-Fidelity Server Transcription:** Uploads audio chunks (`audio/webm`) to the backend `/api/v1/thoughts/{id}/audio` endpoint, executing high-precision transcription via Groq Whisper (`whisper-large-v3`).
- **Post-Transcription Auto-Enrichment:** Once transcription completes, the backend automatically triggers async AI title/summary/tag generation.

### 2.6 AI Telemetry & Observability
- **Location:** [`Backend/app/models/entities.py`](file:///c:/Users/ASUS/Documents/GitHub/Thought-Catcher/Backend/app/models/entities.py#L156-L172)
- Database entity `AITelemetryRecord` tracks every AI generation with:
  - Input/Output token counts
  - Execution latency in milliseconds
  - Precise estimated USD cost calculation
  - Provider model and status tracking

---

## 3. Monetization & RevenueCat Integration

### 3.1 Entitlement Management & Tier Control
- **Location:** [`Backend/app/services/revenuecat_service.py`](file:///c:/Users/ASUS/Documents/GitHub/Thought-Catcher/Backend/app/services/revenuecat_service.py) & [`Backend/app/models/entities.py`](file:///c:/Users/ASUS/Documents/GitHub/Thought-Catcher/Backend/app/models/entities.py#L112-L122)
- **Subscription Tiers:**
  - **Free Tier:** 2 AI credits / month, standard capture, basic categorization.
  - **Pro Tier:** 50 AI credits / month, all multi-agent expansion models, export to PDF/Docs, priority support.

### 3.2 Idempotent Webhook Ingestion Engine
- **Location:** [`Backend/app/api/v1/webhooks.py`](file:///c:/Users/ASUS/Documents/GitHub/Thought-Catcher/Backend/app/api/v1/webhooks.py)
- **Deduplication:** Uses `ProcessedWebhookRecord` to store unique event IDs; duplicate webhook deliveries from RevenueCat are safely ignored.
- **Lifecycle Event State Machine:**
  - `INITIAL_PURCHASE`, `RENEWAL`, `UNCANCELLATION` $\rightarrow$ Entitlement status set to `active`.
  - `BILLING_ISSUE` $\rightarrow$ Entitlement status set to `in_grace_period`.
  - `EXPIRATION` $\rightarrow$ Entitlement status set to `expired`.
  - `CANCELLATION` $\rightarrow$ Retains `active` status until `expiration_at_ms` is reached, then transitions to `expired`.

### 3.3 Paywall & Subscription Interface
- **Location:** [`Frontend/src/screens/ProPlanModal.tsx`](file:///c:/Users/ASUS/Documents/GitHub/Thought-Catcher/Frontend/src/screens/ProPlanModal.tsx)
- Dynamic Monthly vs. Yearly billing toggle (highlighting a 40% discount on yearly plans).
- Visual tier comparison cards with detailed feature lists and glassmorphic UI effects.

---

## 4. Privacy, Compliance & Account Lifecycle (GDPR / CCPA / Apple Store Guidelines)

### 4.1 Full Data Export Package (Right to Access / Data Portability)
- **Location:** [`Backend/app/services/privacy_service.py`](file:///c:/Users/ASUS/Documents/GitHub/Thought-Catcher/Backend/app/services/privacy_service.py#L18-L50)
- **Endpoint:** `GET /api/v1/privacy/export`
- Exports all captures, raw text, voice transcripts, metadata, tags, audio references, and plan information in a clean, portable JSON package.
- Automatically generates an immutable audit log entry upon export.

### 4.2 Account Deletion with 7-Day Grace Period (Right to be Forgotten)
- **Location:** [`Backend/app/services/privacy_service.py`](file:///c:/Users/ASUS/Documents/GitHub/Thought-Catcher/Backend/app/services/privacy_service.py#L51-L106)
- **Endpoint:** `POST /api/v1/privacy/delete-account`
- Performs an instantaneous **Soft Delete** on the user record and associated thoughts.
- Computes `hard_delete_scheduled_at = now + 7 days`.
- Protects users against accidental deletion while ensuring compliance with Apple App Store guidelines.

### 4.3 Account Restoration Window
- **Location:** [`Backend/app/services/privacy_service.py`](file:///c:/Users/ASUS/Documents/GitHub/Thought-Catcher/Backend/app/services/privacy_service.py#L107-L152)
- **Endpoint:** `POST /api/v1/privacy/restore-account`
- Allows users who log back in within the 7-day grace window to fully reactivate their account and restore soft-deleted thoughts with a single tap.

### 4.4 Hard Purge Cascading Service
- **Location:** [`Backend/app/services/purge_service.py`](file:///c:/Users/ASUS/Documents/GitHub/Thought-Catcher/Backend/app/services/purge_service.py)
- Scheduled background task `HardPurgeService.execute_scheduled_hard_purge()`:
  1. Identifies all user records where `is_deleted = True` and `hard_delete_scheduled_at <= now`.
  2. Permanently removes all associated raw voice audio files from physical disk storage.
  3. Cascades hard deletions across `ThoughtRecord`, `EntitlementRecord`, `DeviceSessionRecord`, and `UserRecord`.
  4. Records an unalterable system audit record for verifiable data protection compliance.

### 4.5 Immutable Audit Logging
- **Location:** [`Backend/app/models/entities.py`](file:///c:/Users/ASUS/Documents/GitHub/Thought-Catcher/Backend/app/models/entities.py#L131-L154)
- Tracks all critical security and data lifecycle events (`account_delete_requested`, `account_restored`, `account_hard_deleted`, `data_exported`, `entitlement_updated`).

---

## 5. Local-First Offline Synchronization Engine

### 5.1 Client Mutation Queue & Optimistic UI
- **Location:** [`Frontend/src/services/syncEngine.ts`](file:///c:/Users/ASUS/Documents/GitHub/Thought-Catcher/Frontend/src/services/syncEngine.ts)
- Captures, edits, and deletions are written immediately to local state and queued in `QueuedMutation` storage.
- **Mutation Coalescing:** Multiple consecutive updates to the same thought while offline are merged into a single mutation payload before network transmission.
- **Offline Deletion Optimization:** Creating and deleting a thought while offline eliminates redundant server network requests.

### 5.2 Bi-Directional Delta Sync Protocol
- **Location:** [`Backend/app/services/sync_service.py`](file:///c:/Users/ASUS/Documents/GitHub/Thought-Catcher/Backend/app/services/sync_service.py) & [`Backend/app/api/v1/sync.py`](file:///c:/Users/ASUS/Documents/GitHub/Thought-Catcher/Backend/app/api/v1/sync.py)
- **Endpoint:** `POST /api/v1/sync`
- Sends `last_sync_timestamp` and `client_changes`.
- Server pushes back only records updated since `last_sync_timestamp`.
- **Conflict Resolution:** Utilizes optimistic locking via numerical record `version` counters and timestamp ordering.

### 5.3 Auto-Reconnection & Periodic Sync Pulse
- Listens to browser `window.addEventListener('online')` events to flush queued mutations immediately when connectivity is restored.
- Runs a non-blocking 30-second background sync interval to pull upstream remote updates.

### 5.4 Anonymous Device Session to Authenticated Account Migration
- **Location:** [`Backend/app/services/auth_service.py`](file:///c:/Users/ASUS/Documents/GitHub/Thought-Catcher/Backend/app/services/auth_service.py) & [`Backend/app/api/v1/auth.py`](file:///c:/Users/ASUS/Documents/GitHub/Thought-Catcher/Backend/app/api/v1/auth.py)
- **Endpoint:** `POST /api/v1/auth/migrate`
- When an anonymous user registers or logs in via Google/Email, all thoughts previously associated with their `device_id` are automatically claimed and linked to their new authenticated `user_id`.

---

## 6. Voice Capture, Media & Thought Management

### 6.1 Dynamic Voice Recording & Waveform State
- **Location:** [`Frontend/src/screens/RecordScreen.tsx`](file:///c:/Users/ASUS/Documents/GitHub/Thought-Catcher/Frontend/src/screens/RecordScreen.tsx)
- States: `listening` $\rightarrow$ `paused` $\rightarrow$ `capturing` (transcribing).
- Real-time elapsed duration counter (`MM : SS`).
- Live pulse orb animations reacting to recording states.

### 6.2 Capture State Control (`held` vs `committed`)
- Thoughts can be stored in `held` (draft/provisional) state or `committed` (finalized) state.
- Enables frictionless quick-captures without cluttering organized history.

### 6.3 Privacy-Centric Audio Retention Policies
- **Location:** [`Backend/app/models/entities.py`](file:///c:/Users/ASUS/Documents/GitHub/Thought-Catcher/Backend/app/models/entities.py#L60)
- Configurable per-capture:
  - `delete_after_transcription`: Automatically purges the audio file once transcription completes to protect privacy and save disk space.
  - `keep`: Retains the audio file reference for playback.

### 6.4 Full CRUD & User Edit Tracking
- Complete REST operations for creating, listing (with pagination/cursors), updating, soft-deleting, and restoring thoughts.
- Boolean flags track whether AI-generated fields were customized by the user (`title_edited_by_user`, `summary_edited_by_user`, `tags_edited_by_user`, `type_edited_by_user`).

---

## 7. Search, Discovery & Organization System

### 7.1 Multi-Field Fuzzy Search
- **Location:** [`Backend/app/services/search_service.py`](file:///c:/Users/ASUS/Documents/GitHub/Thought-Catcher/Backend/app/services/search_service.py) & [`Backend/app/api/v1/search.py`](file:///c:/Users/ASUS/Documents/GitHub/Thought-Catcher/Backend/app/api/v1/search.py)
- **Endpoint:** `GET /api/v1/search?q={query}`
- Searches simultaneously across `title`, `summary`, `transcript`, `raw_text`, and `tags`.
- Computes matching relevance scores and returns categorized match types (`title_match`, `tag_match`, `content_match`).

### 7.2 Semantic Taxonomy & Categories
- **Automatic Categorization:** Thoughts are classified into 7 core taxonomies:
  - `ideas`: Creative concepts, brainstorms, hypotheses.
  - `projects`: Actionable work initiatives and deliverables.
  - `content`: Writing, video, social media drafts.
  - `learning`: Study notes, book insights, courses.
  - `reminders`: Time-sensitive tasks and errands.
  - `personal`: Life reflections and private notes.
  - `other`: General unclassified thoughts.

### 7.3 Frontend Discovery Screens
- **Location:** [`Frontend/src/screens/HistoryScreen.tsx`](file:///c:/Users/ASUS/Documents/GitHub/Thought-Catcher/Frontend/src/screens/HistoryScreen.tsx), [`CategoryScreen.tsx`](file:///c:/Users/ASUS/Documents/GitHub/Thought-Catcher/Frontend/src/screens/CategoryScreen.tsx), [`SavedScreen.tsx`](file:///c:/Users/ASUS/Documents/GitHub/Thought-Catcher/Frontend/src/screens/SavedScreen.tsx)
- Search bar with instant real-time filtering.
- Category browsing grid with dynamic badge counters.
- Detailed thought inspector with Markdown rendering and one-click clipboard copying.

---

## 8. Complete API Endpoint Reference Matrix

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/auth/session` | Get current device/user session & quota status | Device-ID |
| `POST` | `/api/v1/auth/migrate` | Migrate anonymous device thoughts to user account | User Token |
| `POST` | `/api/v1/thoughts` | Create a new thought | Device-ID or User |
| `GET` | `/api/v1/thoughts` | List paginated thoughts with category filters | Device-ID or User |
| `GET` | `/api/v1/thoughts/{id}` | Get single thought by ID | Device-ID or User |
| `PATCH` | `/api/v1/thoughts/{id}` | Update thought fields with optimistic version check | Device-ID or User |
| `DELETE` | `/api/v1/thoughts/{id}` | Soft-delete a thought | Device-ID or User |
| `POST` | `/api/v1/thoughts/{id}/restore` | Restore a soft-deleted thought | Device-ID or User |
| `POST` | `/api/v1/thoughts/{id}/audio` | Upload audio recording for STT transcription | Device-ID or User |
| `GET` | `/api/v1/enrichment/{id}/status` | Check background AI enrichment status | Device-ID or User |
| `POST` | `/api/v1/enrichment/{id}/retry` | Manually re-trigger AI enrichment | Device-ID or User |
| `POST` | `/api/v1/enrichment/{id}/expand` | Run multi-agent expansion (Plan/Research/Features/Summary) | Device-ID or User |
| `GET` | `/api/v1/search` | Search thoughts by fuzzy keyword query | Device-ID or User |
| `POST` | `/api/v1/sync` | Bi-directional delta sync for offline mutations | Device-ID or User |
| `POST` | `/api/v1/webhooks/revenuecat` | RevenueCat subscription webhook receiver | Webhook Signature / Secret |
| `GET` | `/api/v1/privacy/export` | Export complete user data package (JSON) | Device-ID or User |
| `POST` | `/api/v1/privacy/delete-account` | Request account soft deletion with 7-day grace period | User Token |
| `POST` | `/api/v1/privacy/restore-account` | Restore soft-deleted account within 7 days | User Token |

---

## 9. Security, Authentication & Data Protection

1. **Dual Actor Context Resolution:** Every request resolves identity via `X-Device-ID` header (for anonymous onboarding) and `Authorization: Bearer <token>` (for authenticated users).
2. **Row-Level Tenant Isolation:** Database queries enforce scoped ownership checks (`user_id == current_user` OR `device_id == current_device`), preventing cross-user data leakage.
3. **Optimistic Concurrency Control:** Write operations require a matching `base_version` number to prevent lost updates during concurrent multi-device sync.
4. **Defensive AI Execution:** Prompt injection sanitization, schema validation, and fallback mechanisms prevent prompt exploits and service disruption.
