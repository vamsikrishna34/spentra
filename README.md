# Spentra

**AI-Powered Personal Finance & Expense Tracker**

Spentra is a full-stack personal finance application that combines voice logging, OCR receipt scanning, predictive spending analytics, and an AI financial coach to help users track expenses, manage budgets, and achieve financial goals.

## Architecture

```
Spentra/
├── backend/          FastAPI Python backend with AI agents (Google Gemini)
│   ├── agents/       Specialized AI agents (parser, coach, export)
│   ├── routers/      Modular API endpoints (transactions, budgets, analytics, exports)
│   ├── services/     External integrations (currency converter)
│   └── database/     Supabase/PostgreSQL connection pool
├── frontend/         React + TypeScript + Tailwind CSS responsive web app
│   └── src/
│       ├── components/   Modular UI components
│       ├── services/     API client wrappers
│       └── types/        TypeScript interfaces
└── database/         SQL schema & seed scripts
```

## Tech Stack

- **Backend:** FastAPI, Python, Google GenAI (Gemini), Pydantic
- **Frontend:** React, TypeScript, Tailwind CSS, Vite, Lucide Icons
- **Database:** PostgreSQL via Supabase
- **AI:** Google Gemini for natural language parsing, coaching, and document generation

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- A Supabase project (for PostgreSQL)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Fill in your API keys
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_BASE_URL to your backend URL
npm run dev
```

### Database

Run the SQL scripts in `database/schema.sql` against your Supabase/PostgreSQL instance, optionally followed by `database/seed.sql` for mock data.

## Features

- **Voice & Text Logging** — Log transactions via voice or natural language text
- **OCR Receipt Scanning** — Upload receipt images for automatic extraction
- **Budget Health Bars** — Visual green/yellow/red indicators for planned vs. actual spending
- **Predictive Analytics** — Safe daily spend calculations and spending velocity warnings
- **AI Financial Coach** — Real-time chat sidebar with personalized nudges
- **Multi-Format Export** — One-click Excel, Word, and PDF report generation
- **Currency Conversion** — Live exchange rate support for multi-currency transactions
