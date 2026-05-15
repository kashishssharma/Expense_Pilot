# Smart Expense Tracker

AI-powered personal finance tracker with spending analysis, anomaly detection, and predictive budgeting.

## Architecture

```
Client (Next.js + React)
        ↓
Node.js + Express API
        ↓
Python/Django Intelligence
        ↓
PostgreSQL Database
```

## Services

| Service | Tech | Port | Description |
|---------|------|------|-------------|
| `api/` | Node.js + Express | 5000 | Auth, expenses, budgets, analytics proxy |
| `intelligence/` | Python + Django | 8000 | ML analytics, anomaly detection, predictions |
| `frontend/` | Next.js + React | 3000 | Dashboard, charts, expense management |

## Quick Start (Local Development)

### 1. PostgreSQL
Create a database and run the schema:
```bash
createdb expense_tracker
psql expense_tracker < api/src/db/schema.sql
```

### 2. Node.js API
```bash
cd api
cp .env.example .env    # Edit DATABASE_URL
npm install
npm run db:init         # Create tables
npm run dev             # Starts on :5000
```

### 3. Python Intelligence Service
```bash
cd intelligence
cp .env.example .env    # Edit DATABASE_URL
pip install -r requirements.txt
python manage.py runserver 8000   # Starts on :8000
```

### 4. Frontend
```bash
cd frontend
cp .env.example .env.local    # Edit API URL
npm install
npm run dev                   # Starts on :3000
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Get current user |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | List (with filters & pagination) |
| POST | `/api/expenses` | Create |
| PUT | `/api/expenses/:id` | Update |
| DELETE | `/api/expenses/:id` | Delete |

### Budgets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budgets` | List with spending |
| GET | `/api/budgets/summary` | Monthly overview |
| POST | `/api/budgets` | Create/update |
| DELETE | `/api/budgets/:id` | Delete |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/overview` | Dashboard stats (local SQL) |
| GET | `/api/analytics/spending` | ML spending patterns |
| GET | `/api/analytics/anomalies` | Anomaly detection |
| GET | `/api/analytics/predictions` | Spending forecast |
| GET | `/api/analytics/recommendations` | Budget recommendations |

## Deployment

### Frontend
1. Build and export the Next.js app
2. Set `NEXT_PUBLIC_API_URL` to your API server URL
3. Deploy to your preferred static hosting or Node.js server

### API
1. Deploy as a Node.js service
2. Connect to a PostgreSQL database
3. Set `DATABASE_URL`, `JWT_SECRET`, `INTELLIGENCE_URL`, `FRONTEND_URL`

### Intelligence
1. Deploy as a Python service
2. Set `DATABASE_URL`, `SECRET_KEY`
3. Start command: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
