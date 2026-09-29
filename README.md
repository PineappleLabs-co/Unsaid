# 🧠 UNSAID — Thought Catcher

> **Capture what you can't say out loud.** An offline-first, AI-powered voice journaling app for Android — built with Expo React Native and a FastAPI Python backend.

---

## 📁 Project Structure

```
Unsaid/
├── Backend/          # FastAPI Python backend (AI + sync + storage)
│   ├── app/
│   │   ├── main.py         # FastAPI entry point
│   │   ├── config.py       # Settings (env-driven)
│   │   ├── database.py     # SQLAlchemy async setup
│   │   ├── api/v1/         # REST API routers
│   │   ├── ai/             # Groq Whisper STT + LLM enrichment
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── repositories/   # DB access layer
│   ├── requirements.txt
│   └── .env                # Your environment config (copy from .env.example)
│
├── mobile/           # Expo React Native Android App
│   ├── App.tsx             # Root navigator & global state
│   ├── app.json            # Expo config (permissions, slug, icons)
│   ├── src/
│   │   ├── screens/        # All 19 app screens
│   │   ├── components/     # Shared UI components
│   │   ├── services/
│   │   │   ├── api.ts          # Backend HTTP client
│   │   │   ├── audioService.ts # Expo Audio recording
│   │   │   ├── storage.ts      # AsyncStorage persistence
│   │   │   └── syncEngine.ts   # Offline-first mutation queue
│   │   ├── data/mockData.ts    # Seed/offline fallback data
│   │   ├── theme.ts            # Design tokens (colors, spacing)
│   │   └── types.ts            # Shared TypeScript types
│   └── package.json
│
├── docs/             # Architecture & design docs
├── firestore/        # Firestore rules (optional Firebase integration)
└── FEATURES.md       # Full product feature specification
```

---

## 🚀 Quick Start

### 1. Backend (FastAPI)

```bash
cd Backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env       # Windows
# cp .env.example .env       # macOS/Linux
# Edit .env — add your GROQ_API_KEY

# Run the API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- **API Base:** http://localhost:8000
- **Interactive Docs:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health

### 2. Mobile App (Expo)

```bash
cd mobile

# Install dependencies
npm install

# Start Expo dev server
npx expo start

# Run on Android emulator
npx expo start --android

# Run on physical Android device (scan QR with Expo Go)
npx expo start
```

> **Physical Device:** Change the API URL in `mobile/src/services/api.ts`:
> ```ts
> const DEFAULT_HOST = 'http://YOUR_PC_LOCAL_IP:8000/api/v1';
> ```
> Android Emulator automatically uses `http://10.0.2.2:8000/api/v1`.

---

## 🔑 Environment Variables

Edit `Backend/.env` (copied from `.env.example`):

| Variable | Description | Required |
|---|---|---|
| `GROQ_API_KEY` | Groq API key (Whisper STT + Llama LLM) | ✅ Yes |
| `DATABASE_URL` | SQLite default or PostgreSQL for prod | Optional |
| `GROQ_WHISPER_MODEL` | `whisper-large-v3-turbo` | Optional |
| `GROQ_LLAMA_MODEL` | `llama-3.3-70b-versatile` | Optional |
| `FREE_TIER_DAILY_LIMIT` | Daily AI enrichment cap for free users | Optional |
| `APP_ENV` | `development` or `production` | Optional |

---

## 🏗️ Architecture

```
┌─────────────────────────────────┐
│   Expo Android App (mobile/)    │
│                                 │
│  Audio Recording (expo-audio)   │
│       ↓                         │
│  Offline Queue (syncEngine.ts)  │
│       ↓  (when online)          │
│  API Client (api.ts)            │
└──────────────┬──────────────────┘
               │ HTTP REST
               ▼
┌─────────────────────────────────┐
│   FastAPI Backend (Backend/)    │
│                                 │
│  POST /api/v1/thoughts          │  ← Create thought
│  POST /api/v1/thoughts/:id/audio│  ← Upload audio
│  GET  /api/v1/enrichment/status │  ← Poll AI status
│  POST /api/v1/sync              │  ← Delta sync
│  POST /api/v1/enrichment/expand │  ← AI expansion
└──────────────┬──────────────────┘
               │
     ┌─────────┴──────────┐
     ▼                    ▼
┌─────────┐        ┌────────────┐
│  Groq   │        │  SQLite /  │
│ Whisper │        │  Postgres  │
│  + LLM  │        │  Database  │
└─────────┘        └────────────┘
```

---

## 📱 App Screens

| Screen | Description |
|---|---|
| **Splash** | Animated brand intro |
| **Onboarding** (Step 1-3) | Feature highlights |
| **Account / Login** | Guest, Email, or Google auth |
| **Microphone** | Permission request |
| **Record** | Voice capture with live waveform |
| **Saved** | Post-capture confirmation |
| **Category** | Tag thought by category |
| **Notes** | Thought history list |
| **Note Detail** | Rich text editor |
| **Thought Detail** | AI-enriched thought view |
| **Take Further** | AI expansion modal (Plan / Research / Features / Summary) |
| **Pro Plan** | Upgrade paywall modal |
| **Profile** | User settings & plan management |
| **About / Help / Privacy** | Info & compliance screens |

---

## 🤖 AI Features

- **Transcription**: Groq Whisper STT converts audio → text in real time
- **Auto-Enrichment**: Llama 3.3 70B generates title, summary, tags & category
- **Deep Expansion**: 4 AI modes — Project Plan, Domain Research, Feature Specs, Executive Summary
- **Offline-first**: All captures work without internet; AI enrichment runs when reconnected

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Mobile** | Expo 57, React Native 0.86, TypeScript |
| **Audio** | expo-audio (M4A recording → Whisper) |
| **Local Storage** | AsyncStorage + offline mutation queue |
| **Backend** | FastAPI, Python 3.11+ |
| **AI / STT** | Groq (Whisper-large-v3-turbo + Llama 3.3 70B) |
| **Database** | SQLite (dev) / PostgreSQL (prod) |
| **ORM** | SQLAlchemy async + aiosqlite |
| **LLM Framework** | LangChain + LangGraph |

---

## 🧪 Testing

```bash
cd Backend
pytest -v
```

---

## 📄 License

MIT License — see [mobile/LICENSE](./mobile/LICENSE)
