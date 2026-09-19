# Thought Catcher — Technical Backend PRD

**Version:** 1.0
**Platform:** Android-first, extensible to iOS
**Backend:** Firebase
**AI:** Provider-agnostic LLM/STT gateway
**Primary principle:** Local-first, backend-assisted

---

## 1. Product Context

Thought Catcher is a personal idea-capture application designed around one simple promise:

**Capture a thought before it disappears.**

Users can capture thoughts through voice, text, widgets, Android assistant integrations, or future iOS Shortcuts/Siri integrations. The application immediately stores the thought locally. Backend services then synchronize the thought, transcribe/process it when required, and use AI to generate structured information such as:

* Title
* Summary
* Type/category
* Tags
* Transcript

The target users are students, developers, creators, builders and other high-thought-volume users.

The backend must therefore be treated as a **helper rather than a dependency**. A network failure, AI failure, authentication problem or cloud outage must never cause an already-captured thought to disappear. This follows the existing product and backend requirements.

---

# 2. Product Architecture

```text
                  CAPTURE SOURCES
                         │
        ┌────────────────┼────────────────┐
        │                │                │
      App            Widget          Assistant
        │                │          / Shortcuts
        │                │                │
        └────────────────┼────────────────┘
                         ↓
                  Android Client
                         │
                  Save Immediately
                         ↓
                  Room / SQLite
                  Local Source
                    of Truth
                         │
                  Background Queue
                         │
              ┌──────────┴──────────┐
              ↓                     ↓
           Sync API             AI Pipeline
              │                     │
         Firestore             AI Gateway
                                    │
                           ┌────────┼────────┐
                           ↓        ↓        ↓
                         Groq    OpenAI  Anthropic
                           │
                           ↓
                    Enriched Thought
                           │
                           ↓
                     Firestore
                           │
                    Realtime Listener
                           ↓
                     Other Devices
```

The existing frontend contract establishes the local database as the source of truth for display and Firebase as the synchronization/reconciliation layer.

---

# 3. Recommended Technology Stack

| Layer           | Technology                             | Purpose                               |
| --------------- | -------------------------------------- | ------------------------------------- |
| Mobile          | Kotlin + Android                       | Primary application                   |
| Local DB        | Room / SQLite                          | Offline-first storage                 |
| Background jobs | WorkManager                            | Sync/upload/retry                     |
| Backend         | Firebase                               | Managed mobile backend                |
| Database        | Firestore                              | Sync + cloud persistence              |
| Authentication  | Firebase Auth                          | Google/email authentication           |
| Server logic    | Cloud Functions                        | AI, webhooks, secure operations       |
| AI Gateway      | TypeScript Cloud Functions             | Provider abstraction                  |
| LLM             | Groq initially; OpenAI/Anthropic-ready | Enrichment                            |
| STT             | Device STT + provider abstraction      | Transcription                         |
| Storage         | Firebase Storage                       | Audio when cloud retention is enabled |
| Payments        | RevenueCat                             | Subscription entitlement              |
| Protection      | Firebase App Check                     | Application integrity                 |
| Monitoring      | Firebase/Google Cloud + Crashlytics    | Observability                         |

Firebase is appropriate for v1 because Firestore provides realtime synchronization, Firebase Auth provides mobile authentication, and Cloud Functions keeps AI/API secrets away from the client.

A containerized service such as Cloud Run can be introduced later if AI workloads, streaming, or custom processing outgrow Functions.

---

# 4. Core Data Flow

## Normal text thought

```text
User enters text
      ↓
Generate UUID
      ↓
Save locally
      ↓
Show "Captured"
      ↓
Queue sync
      ↓
Firestore
      ↓
AI enrichment
      ↓
Update enrichment
      ↓
Realtime update → client
```

## Voice thought

```text
Voice
 ↓
Local recording
 ↓
Local audio
 ↓
Optional on-device STT
 ↓
Provisional transcript
 ↓
Save thought
 ↓
Upload when online
 ↓
Server STT / AI
 ↓
Canonical transcript
 ↓
LLM enrichment
 ↓
Store results
```

The existing frontend PRD already defines provisional on-device transcription followed by canonical server transcription.

## Assistant/Shortcut thought

```text
Siri / Gemini / Assistant
          ↓
Platform STT
          ↓
Text
          ↓
Thought Catcher capture action
          ↓
Local thought
          ↓
Normal enrichment pipeline
```

This should be implemented as another capture adapter rather than another backend architecture.

---

# 5. Firestore Data Model

Recommended structure:

```text
users/{uid}

users/{uid}/thoughts/{thoughtId}

users/{uid}/usage/{period}

users/{uid}/entitlements/{product}

users/{uid}/devices/{deviceId}

users/{uid}/audit/{auditId}

processed_events/{eventId}
```

### Thought

```json
{
  "id": "uuid",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",

  "source": "voice",
  "captureMethod": "native",

  "captureState": "committed",

  "rawText": "...",
  "audio": {
    "storagePath": "...",
    "durationMs": 12000,
    "retention": "delete_after_transcription"
  },

  "transcript": "...",
  "transcriptSource": "server",
  "transcriptEdited": false,

  "title": "...",
  "titleEdited": false,

  "summary": "...",
  "summaryEdited": false,

  "type": "idea",
  "tags": ["AI", "Web3"],

  "syncVersion": 4,

  "enrichmentStatus": "complete",
  "enrichmentError": null,

  "deleted": false,
  "deletedAt": null
}
```

The core fields follow the existing frontend data contract, including `version`, `transcript_source`, `capture_state`, `sync_status` and `enrichment_status`.

---

# 6. Firestore Strategy

### Denormalization

Keep the thought document self-contained enough for Inbox rendering.

Avoid requiring:

```text
thought → title collection
thought → tag collection
thought → summary collection
```

Instead store the commonly displayed data together.

Use separate collections for:

* User
* Usage
* Entitlements
* Audit logs
* Processed webhook events

### Indexes

Initially index:

```text
uid + createdAt
uid + type
uid + tags
uid + enrichmentStatus
uid + deleted
```

Avoid creating indexes for every possible field combination until actual queries require them.

### Security

Firestore rules should enforce:

```text
request.auth.uid == resource.data.uid
```

or equivalent ownership rules.

Clients must never be trusted to decide which user's data they can access.

The backend PRD specifically requires server-side Firestore authorization and App Check.

---

# 7. API Architecture

Use:

```text
/api/v1/...
```

for custom HTTP APIs.

Firestore realtime listeners remain the preferred mechanism for realtime thought updates.

The backend should not create unnecessary REST endpoints for operations that Firestore can safely handle directly.

---

# 8. Authentication APIs

### POST `/api/v1/auth/session`

Creates/validates a backend session.

**Request**

```json
{
  "firebaseIdToken": "..."
}
```

**Response**

```json
{
  "userId": "uid",
  "plan": "free",
  "sessionExpiresAt": "timestamp"
}
```

Authentication: Firebase ID token.

---

### POST `/api/v1/auth/migrate-anonymous`

Migrates anonymous/device history to an authenticated account.

```json
{
  "deviceId": "device-uuid",
  "thoughtIds": ["uuid1", "uuid2"]
}
```

The migration must be idempotent.

---

### POST `/api/v1/auth/logout`

Client-side Firebase logout is normally sufficient; backend session state should not be required for ordinary requests.

---

# 9. Thought APIs

### POST `/api/v1/thoughts`

Creates/syncs a committed thought.

```json
{
  "id": "uuid",
  "source": "text",
  "rawText": "...",
  "createdAt": "timestamp",
  "baseVersion": 0
}
```

Response:

```json
{
  "id": "uuid",
  "version": 1,
  "syncStatus": "synced"
}
```

Idempotency key:

```text
thought.id
```

---

### GET `/api/v1/thoughts/{id}`

Returns one thought.

Authentication required.

---

### GET `/api/v1/thoughts`

Parameters:

```text
cursor
limit
type
tag
updatedAfter
```

Example:

```text
GET /api/v1/thoughts?limit=30&cursor=abc
```

Response:

```json
{
  "items": [],
  "nextCursor": "xyz"
}
```

Use cursor pagination rather than offset pagination.

---

### PATCH `/api/v1/thoughts/{id}`

Updates user-editable fields.

```json
{
  "baseVersion": 4,
  "changes": {
    "title": "My corrected title"
  }
}
```

Server increments `version`.

If versions conflict:

```json
{
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "Thought was modified elsewhere.",
    "serverVersion": 5,
    "serverData": {}
  }
}
```

The frontend PRD already requires optimistic concurrency through `version`/`base_version`.

---

### DELETE `/api/v1/thoughts/{id}`

Performs a soft delete.

```json
{
  "deleted": true
}
```

Single-thought deletion should propagate to associated AI/audio data according to retention rules.

---

# 10. Search API

### GET `/api/v1/search`

```text
GET /api/v1/search?q=machine+learning&mode=keyword
```

Response:

```json
{
  "results": [
    {
      "thoughtId": "uuid",
      "matchType": "keyword",
      "score": 0.91
    }
  ]
}
```

P0:

**Local keyword search**

P2:

**Cloud semantic search**

The existing PRD explicitly defers semantic/"Related thoughts" search.

---

# 11. AI API

### POST `/api/v1/ai/enrich`

```json
{
  "thoughtId": "uuid"
}
```

Response:

```json
{
  "thoughtId": "uuid",
  "status": "processing"
}
```

The actual LLM call should happen server-side.

The client should never receive:

```text
GROQ_API_KEY
OPENAI_API_KEY
ANTHROPIC_API_KEY
```

---

### GET `/api/v1/ai/enrich/{thoughtId}`

Returns current enrichment state.

```json
{
  "status": "partial",
  "fields": {
    "title": "...",
    "summary": "...",
    "tags": []
  }
}
```

Firestore listeners should normally make this polling unnecessary.

---

### POST `/api/v1/ai/enrich/{thoughtId}/retry`

Only retries failed/missing fields.

---

# 12. AI Gateway

Do not directly couple application code to Groq.

Create:

```text
AIProvider
├── GroqProvider
├── OpenAIProvider
└── AnthropicProvider
```

Interface:

```typescript
interface AIProvider {
  enrichThought(input: EnrichmentInput): Promise<EnrichmentResult>;
}
```

Configuration:

```text
PRIMARY_AI_PROVIDER=groq
FALLBACK_AI_PROVIDER=openai
```

This lets the application switch providers without rewriting the enrichment system.

---

# 13. Prompt Management

Do not hard-code large prompts inside Cloud Functions.

Store:

```text
prompts/
  thought-enrichment/
    v1
    v2
  summarization/
  classification/
```

Each prompt should have:

```json
{
  "name": "thought-enrichment",
  "version": "v3",
  "model": "llama...",
  "systemPrompt": "...",
  "outputSchema": {},
  "temperature": 0.2,
  "active": true
}
```

Every AI request should log:

```text
provider
model
promptVersion
inputTokens
outputTokens
latency
cost
status
```

This makes model/prompt changes measurable.

---

# 14. LLM Output Contract

Use structured JSON rather than free-form responses.

```json
{
  "title": "string",
  "summary": "string",
  "type": "idea",
  "tags": ["string"]
}
```

Validate the response with a schema before writing to Firestore.

If validation fails:

```text
LLM response
 ↓
Schema validation
 ↓
FAIL
 ↓
Retry / fallback
```

Never blindly store arbitrary LLM output.

---

# 15. AI Cost Control

Free users currently have a proposed:

**2 enrichments/day + 10/week**

with Pro users receiving unlimited enrichment. These numbers are explicitly described as starting values to be tuned against real Groq cost.

Track:

```text
userId
provider
model
inputTokens
outputTokens
estimatedCost
timestamp
```

Optimization:

* Keep prompts short.
* Don't resend unchanged fields.
* Retry only failed fields.
* Cache deterministic operations where appropriate.
* Use cheaper models for classification.
* Reserve expensive models for complex processing.
* Enforce quotas before calling the provider.

---

# 16. AI Failure Strategy

```text
Request
  ↓
Primary provider
  ↓
Success → save
  │
  └── failure
        ↓
     retry/backoff
        ↓
     fallback provider
        ↓
     partial/failed
```

The original raw thought must remain untouched.

The existing backend requirements specify automatic retry and manual retry while ensuring failed attempts don't consume quota.

Use exponential backoff:

```text
1s → 5s → 30s → 2m
```

with a maximum retry count.

---

# 17. Speech-to-Text Architecture

There should be two paths.

### Path A — On-device STT

```text
Microphone
 ↓
Android/iOS STT
 ↓
Provisional transcript
 ↓
Local DB
```

Advantages:

* Fast
* Works offline
* Better privacy
* No upload required immediately

### Path B — Server STT

```text
Audio
 ↓
Encrypted upload
 ↓
Storage
 ↓
STT provider
 ↓
Canonical transcript
 ↓
LLM
```

The server transcript becomes canonical unless the user has manually edited the transcript. This behavior is already defined in the frontend PRD.

---

# 18. Audio API

### POST `/api/v1/audio/upload`

Use multipart upload or signed upload URLs.

Recommended production approach:

```text
Client
 ↓
Request signed upload URL
 ↓
Firebase Storage
 ↓
Notify backend
 ↓
Transcription job
```

### POST `/api/v1/transcriptions`

```json
{
  "thoughtId": "uuid",
  "audioPath": "..."
}
```

Response:

```json
{
  "jobId": "job_123",
  "status": "queued"
}
```

### GET `/api/v1/transcriptions/{jobId}`

```json
{
  "jobId": "job_123",
  "status": "complete",
  "transcript": "..."
}
```

---

# 19. Audio Specification

Recommended:

```text
Container: M4A
Codec: AAC
Sample rate: 16 kHz
Channels: Mono
```

For raw STT pipelines, PCM/WAV can be supported.

Audio should be stored only as long as required.

Default:

```text
Capture
 ↓
Transcription
 ↓
Canonical transcript
 ↓
Delete audio
```

The existing product requirement sets **delete after transcription** as the default retention behavior.

---

# 20. Assistant / Shortcut Integration

Treat assistant capture as another input adapter.

### Android

Expose an App Action such as:

```text
Capture Thought
    parameter:
       thoughtText
```

Conceptually:

```text
Gemini / Assistant
       ↓
Platform STT
       ↓
thoughtText
       ↓
Thought Catcher
       ↓
Create local thought
```

### iOS

Expose an App Intent:

```text
CaptureThoughtIntent
    input: String
```

Shortcuts can then connect:

```text
Dictate Text
     ↓
Capture Thought
```

The important backend decision is that **the assistant does not need to upload audio to Thought Catcher**. It supplies text, which enters the normal text-thought pipeline.

---

# 21. Realtime Synchronization

Firestore listeners should handle realtime updates.

```text
Device A
 ↓
Firestore
 ↓
Realtime listener
 ↓
Device B
```

Use local Room as the UI source.

When a Firestore change arrives:

```text
Firestore event
 ↓
Validate version
 ↓
Update local DB
 ↓
UI observes Room
```

This prevents the UI from being directly dependent on network latency.

---

# 22. Sync Conflict Handling

Every thought has:

```text
version
```

Client sends:

```text
base_version
```

Server accepts only when versions match.

Example:

```text
Device A → version 4
Device B → version 4

A updates → version 5

B tries update using version 4
        ↓
VERSION_CONFLICT
```

Return both versions so the client can resolve the conflict.

---

# 23. Rate Limits

Suggested starting limits:

| Endpoint       |            Limit |
| -------------- | ---------------: |
| Authentication |        10/min/IP |
| Thought writes |      60/min/user |
| Search         |      60/min/user |
| AI enrichment  | quota-controlled |
| AI retry       |  10/hour/thought |
| Audio upload   |     20/hour/user |
| Export         |      3/hour/user |

These should be configuration values rather than hard-coded constants.

App Check + Firebase Rules + application quotas provide the first abuse-control layer.

---

# 24. Caching

### Client

Primary cache:

```text
Room
```

### Backend

Use caching only where useful:

* User entitlement
* AI configuration
* Prompt versions
* Category definitions

Do not aggressively cache individual thoughts because Firestore realtime synchronization already provides the required mechanism.

---

# 25. API Error Contract

All APIs should return a consistent format:

```json
{
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "The thought has changed.",
    "requestId": "req_123",
    "retryable": false
  }
}
```

Standard categories:

```text
AUTH_REQUIRED
FORBIDDEN
VALIDATION_ERROR
NOT_FOUND
RATE_LIMITED
VERSION_CONFLICT
AI_UNAVAILABLE
TRANSCRIPTION_FAILED
STORAGE_ERROR
INTERNAL_ERROR
```

Never expose provider API errors directly to clients.

---

# 26. Security

### Authentication

Use Firebase Auth:

* Google
* Email/password
* Future OAuth providers

Firebase ID tokens are verified server-side.

### Authorization

Every backend operation checks:

```text
authenticated user
+
resource ownership
+
requested operation
```

### Secrets

Store API keys only in:

```text
Google Secret Manager / Cloud Functions secrets
```

Never:

```text
Android APK
iOS binary
Git repository
Firestore
```

### Encryption

Use:

* TLS in transit
* Firebase/Google-managed encryption at rest

The current backend PRD already specifies both.

---

# 27. Privacy

Data categories:

```text
Account information
Thought text
Transcripts
Audio
AI-generated metadata
Usage information
```

Minimize what leaves the device.

If:

```text
sendToAI = false
```

then:

```text
audio/text → AI service
```

must never occur.

This must be enforced server-side, not merely hidden in the UI.

---

# 28. Account Deletion

```text
DELETE /api/v1/account
        ↓
soft delete
        ↓
disable access
        ↓
stop sync + AI
        ↓
7-day recovery period
        ↓
hard delete
        ↓
audit log
```

Also provide:

```text
GET /api/v1/account/export
```

returning JSON/ZIP/Markdown as appropriate.

The existing backend specification requires the 7-day deletion grace period and recommends a data-export endpoint.

---

# 29. RevenueCat

RevenueCat remains the source of truth.

```text
Purchase
 ↓
RevenueCat
 ↓
Webhook
 ↓
Cloud Function
 ↓
Validate signature
 ↓
Deduplicate event ID
 ↓
Update entitlement cache
```

Supported states:

```text
active
in_grace_period
in_billing_retry
expired
```

The webhook must be idempotent.

---

# 30. Repository Structure

```text
thought-catcher/
│
├── android/
│   ├── app/
│   ├── core/
│   ├── capture/
│   ├── database/
│   ├── sync/
│   ├── ai/
│   └── integrations/
│
├── functions/
│   └── src/
│       ├── api/
│       ├── auth/
│       ├── thoughts/
│       ├── ai/
│       ├── transcription/
│       ├── revenuecat/
│       ├── webhooks/
│       └── shared/
│
├── firestore/
│   ├── rules/
│   └── indexes/
│
├── prompts/
│   ├── enrichment/
│   └── classification/
│
├── infrastructure/
│
├── docs/
│
└── .github/
    └── workflows/
```

---

# 31. Environment Strategy

Three environments:

```text
development
staging
production
```

Separate:

* Firebase projects
* Firestore databases
* API secrets
* RevenueCat environments
* AI keys where possible
* Analytics

Example:

```env
ENVIRONMENT=staging

FIREBASE_PROJECT_ID=thought-catcher-staging

AI_PROVIDER=groq
AI_MODEL=...

REVENUECAT_WEBHOOK_SECRET=...
```

Never commit `.env` files containing secrets.

---

# 32. CI/CD

Every pull request:

```text
GitHub
 ↓
Lint
 ↓
Unit tests
 ↓
Type checks
 ↓
Android tests
 ↓
Backend tests
 ↓
Security checks
```

Merge to staging:

```text
Build
 ↓
Deploy Cloud Functions
 ↓
Deploy Firestore rules
 ↓
Deploy Android internal build
```

Production:

```text
Release branch
 ↓
Integration tests
 ↓
Manual approval
 ↓
Firebase deployment
 ↓
Android Play Console rollout
```

Use staged rollout for mobile releases.

---

# 33. Observability

Track:

### Application

* Crash-free sessions
* ANR rate
* Capture failures
* Held Thought rate
* Local DB errors

### Backend

* API latency
* Function failures
* Firestore errors
* Sync conflicts
* Queue depth

### AI

* Provider latency
* Failure rate
* Token usage
* Cost
* Retry rate
* Partial enrichment rate

### Product

* Time-to-save
* Captures/user
* AI success rate
* Search success
* Account conversion

The frontend PRD already identifies time-to-save, held-thought rate and AI failure rate as useful analytics.

---

# 34. Implementation Phases

## Phase 1 — Core capture

Build:

* Room
* Thought model
* Voice capture
* Text capture
* Held Thoughts
* Offline operation

**Goal:** capturing works perfectly without internet.

---

## Phase 2 — Firebase

Build:

* Firebase Auth
* Firestore
* Security Rules
* App Check
* Sync queue
* Cross-device sync

**Goal:** same account works across devices.

---

## Phase 3 — AI

Build:

* AI gateway
* Groq provider
* Structured output
* Prompt versioning
* Enrichment state machine
* Retry/fallback
* Usage tracking

**Goal:** raw thought → reliable structured thought.

---

## Phase 4 — Speech

Build:

* On-device provisional STT
* Audio upload
* Server transcription
* Canonical transcript
* Audio deletion

---

## Phase 5 — Integrations

Build:

* Widget
* Quick Settings
* App shortcuts
* Android App Actions
* iOS App Intent/Shortcuts adapter

---

## Phase 6 — Account + monetization

Build:

* RevenueCat
* Pro entitlement
* Account deletion
* Data export
* Privacy settings

---

## Phase 7 — Production hardening

Build:

* Monitoring
* Rate limiting
* Backup/export
* Security testing
* Load testing
* Failure recovery
* Play Store release

---

# 35. Critical Path

The dependency chain is:

```text
Local Thought Model
        ↓
Capture Engine
        ↓
Room Persistence
        ↓
Sync Engine
        ↓
Firestore
        ↓
AI Gateway
        ↓
STT + LLM
        ↓
Enrichment State
        ↓
Inbox / Detail
```

Do **not** start with:

* Semantic search
* AI chat
* Projects
* Resurfacing
* Knowledge graph
* Complex analytics

Those are outside the core MVP scope.

---

# 36. Main Technical Risks

### AI provider outage

Mitigation:

```text
Groq
 ↓ failure
retry
 ↓
fallback provider
 ↓
partial/failed state
```

The raw thought always remains.

### AI cost explosion

Mitigation:

* quotas
* token tracking
* cheaper models
* prompt optimization
* field-level retries

### Sync conflicts

Mitigation:

```text
UUID + version + baseVersion
```

### Android process death

Mitigation:

```text
continuous disk writes
+
Held Thought recovery
```

### Backend outage

Mitigation:

```text
Room remains operational
↓
queue operations
↓
sync when backend returns
```

### Vendor lock-in

Mitigation:

Keep interfaces around:

```text
AIProvider
STTProvider
StorageProvider
AuthProvider
```

Firebase can remain the initial implementation without making the product logic completely dependent on Firebase APIs.

---

# 37. Definition of Done

The backend is considered MVP-ready when:

* A user can capture without an account.
* A thought survives offline operation.
* Interrupted recordings become Held Thoughts.
* Local data survives app/process failure.
* Signed-in thoughts sync between devices.
* Duplicate sync requests don't create duplicates.
* AI can enrich a thought asynchronously.
* AI failures never destroy raw data.
* User edits cannot be overwritten by AI.
* AI can be disabled.
* Audio follows the configured retention policy.
* Account deletion works.
* Data export works.
* RevenueCat entitlement changes work.
* Firestore security rules prevent cross-user access.
* App Check is enabled.
* AI/API secrets never reach the mobile client.
* Monitoring detects backend/AI failures.

---

# 38. Final Backend Principle

The entire system should follow one rule:

```text
             USER THOUGHT
                  ↓
          SAVE LOCALLY FIRST
                  ↓
          ┌───────┴───────┐
          ↓               ↓
        SYNC             AI
          ↓               ↓
      CLOUD DATA      STRUCTURE
          └───────┬───────┘
                  ↓
             BETTER RECALL
```

The backend should **improve the thought after capture, never stand between the user and capture**.

That principle is the foundation for the architecture, API design, AI integration, offline behavior, synchronization and failure handling.
