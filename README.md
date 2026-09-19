# Thought Catcher

> **Capture a thought before it disappears.**

Thought Catcher is an offline-first idea inbox and capture system engineered for builders, creators, and high-thought-volume users.

---

## 🏗️ Architecture & Stack

- **Platform:** Android-first, local-first Room/SQLite source of truth with cloud reconciliation.
- **Backend:** Python 3.11+ / FastAPI / AsyncIO / Pydantic v2 / SQLAlchemy 2.0 Async / Firestore.
- **AI & STT Gateway:** Provider-agnostic gateway with Groq (Whisper + Llama 3.3 70B), semantic token caching, and automated fallback.
- **Monetization & Entitlements:** RevenueCat webhook processor with event deduplication.
- **Privacy & Security:** DPDP & GDPR aligned, 7-day grace period soft deletion pipeline, immutable audit logging, and Firebase App Check integrity verification.

---

## 🚀 Quickstart (Backend)

```bash
cd Backend
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Interactive API documentation: `http://localhost:8000/docs`

---

## 🧪 Testing

```bash
cd Backend
pytest -v
```
