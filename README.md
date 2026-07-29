# Expense Pilot — Smart Personal Finance Platform

Expense Pilot is a high-performance, full-stack personal finance application built with a clean 3-tier backend architecture (**Routes → Validation → Services → Database**). It provides complete expense management, category budget enforcement, real-time analytics, and a rule-based financial insights engine.

---

## 📸 Application Screenshots

### 📊 Dashboard Overview
![Dashboard Overview](docs/screenshots/dashboard.png)

### 💸 Expenses Management & History
![Expenses View](docs/screenshots/expenses.png)

### 🎯 Smart Category Budgets
![Budgets View](docs/screenshots/budgets.png)

### 💡 Rule-Based Financial Insights Engine
![Financial Insights View](docs/screenshots/insights.png)

---

## 🏛️ System Architecture

```
Client Layer (React SPA + Vite + Tailwind CSS)
       ↓  HTTP / REST API (JWT Authenticated)
Validation Layer (express-validator / middleware/validate.js)
       ↓  Sanitized Request Data
Service Layer (src/services/insightsService.js & budgetService.js)
       ↓  SQL Prepared Statements
Data Layer (PostgreSQL Database Pool with Indexes & Constraints)
```

```
                        +----------------------------+
                        |  React SPA (Vite + Router) |
                        +----------------------------+
                                      |  HTTP / REST
                                      v
                        +----------------------------+
                        |  Express REST API Gateway  |
                        +----------------------------+
                                      |
              +-----------------------+-----------------------+
              |                       |                       |
              v                       v                       v
      +---------------+       +---------------+       +---------------+
      |  Auth Routes  |       | Expense Routes|       | Insights Route|
      +---------------+       +---------------+       +---------------+
              |                       |                       |
              |                       v (CSV Streaming)       |
              |               +---------------+               |
              +-------------->| Insights      |<--------------+
                              | Service       |
                              +---------------+
                                      |
                                      v
                              +---------------+
                              | PostgreSQL DB |
                              | (Indexed Pool)|
                              +---------------+
```

---

## 🛠️ Tech Stack & Rationalization

* **Frontend**: React 18 SPA, Vite 5, React Router DOM v6, Tailwind CSS, Recharts, Lucide React.
* **Backend**: Node.js, Express.js (3-tier layered architecture).
* **Database**: PostgreSQL with connection pooling (`pg`), explicit indexes on `(user_id, date)` and `(user_id, category)`.
* **Security & Auth**: JWT (JSON Web Tokens), `bcryptjs` password hashing, `helmet` security headers, CORS protection.
* **Validation**: `express-validator` middleware for input sanitization and schema verification before service execution.

---

## ✨ Core Features & Engineering Highlights

### 1. Financial Insights Engine (`InsightsService`)
Deterministic, explainable rule-based recommendation engine evaluating user behavior:
- **Category Concentration Alert**: Triggers when a single category accounts for $>40\%$ of total spend.
- **Weekend Spikes**: Warns when average weekend spend exceeds $1.5\times$ weekday averages.
- **Budget Overruns**: Highlights category spend exceeding defined monthly caps.

### 2. Streaming CSV Data Export (`GET /api/expenses/export`)
- Streams user expense history directly to browser as an attachment using HTTP `Content-Disposition` and `text/csv` headers.

### 3. Smart Budget Shield
- Category-level monthly caps with real-time SQL calculations (`LEFT JOIN` / subqueries) comparing actual spend vs. limits with warning progress indicators.

### 4. Expense Management & Search
- Full CRUD operations with server-side pagination, category filtering, and keyword search across notes/categories.

---

## 📁 Repository Structure

```
expense pilot/
├── api/                           # Backend Express REST API
│   ├── src/
│   │   ├── app.js                 # App setup, CORS, Helmet, router mounts
│   │   ├── server.js              # HTTP server listener
│   │   ├── db/
│   │   │   ├── pool.js            # PostgreSQL Connection Pool singleton
│   │   │   └── schema.sql         # SQL DDL (Users, Expenses, Budgets + Indexes)
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT protection middleware
│   │   │   ├── validate.js        # Request validation interceptor
│   │   │   └── errorHandler.js    # Global error response handler
│   │   ├── routes/
│   │   │   ├── auth.js            # Authentication routes (/api/auth)
│   │   │   ├── expenses.js        # Expense CRUD & CSV export (/api/expenses)
│   │   │   ├── budgets.js         # Budget caps & progress (/api/budgets)
│   │   │   └── insights.js        # Financial insights & analytics (/api/insights)
│   │   └── services/              # Domain Business Logic Layer
│   │       └── insightsService.js # Business rules & SQL aggregations
│   └── package.json
│
└── frontend/                      # Pure React SPA Client
    ├── index.html
    ├── vite.config.js
    ├── src/
    │   ├── App.jsx                # React Router DOM v6 route definitions
    │   ├── main.jsx               # React entry point
    │   ├── components/Layout.jsx  # Navigation sidebar & layout frame
    │   ├── lib/api.js             # Axios client with JWT interceptors
    │   └── pages/                 # SPA Views (Dashboard, Expenses, Budgets, Insights)
    └── package.json
```

---

## 🚀 Quick Start

### 1. Database Setup
```bash
createdb expense_tracker
psql expense_tracker < api/src/db/schema.sql
```

### 2. Start API Gateway (Port 5000)
```bash
cd api
cp .env.example .env    # Configure DATABASE_URL & JWT_SECRET
npm install
npm run dev
```

### 3. Start Frontend Client (Port 3000)
```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 Production Deployment Guide (100% Free Tier)

### Step 1: Database (Neon.tech / Supabase / Render PostgreSQL)
1. Create a free PostgreSQL database instance on [Neon.tech](https://neon.tech) or [Render](https://render.com).
2. Copy the connection string (`DATABASE_URL`), for example:
   `postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/expense_tracker?sslmode=require`
3. Run the database initialization schema:
   ```bash
   psql "YOUR_DATABASE_URL" < api/src/db/schema.sql
   ```

### Step 2: Backend API Gateway (Render / Railway / Koyeb)
1. Create a new **Web Service** connected to your GitHub repository on [Render](https://render.com).
2. Set the **Root Directory** to `api`.
3. Set the **Build Command** to `npm install` and **Start Command** to `npm start`.
4. Add the following **Environment Variables**:
   * `NODE_ENV`: `production`
   * `DATABASE_URL`: *(Your PostgreSQL URL from Step 1)*
   * `JWT_SECRET`: *(A secure random string)*
   * `FRONTEND_URL`: *(Your deployed Vercel frontend URL from Step 3, e.g. `https://expense-pilot.vercel.app`)*

### Step 3: Frontend Client (Vercel)
1. Import your repository into [Vercel](https://vercel.com).
2. Set the **Root Directory** to `frontend`.
3. Set the **Environment Variable**:
   * `VITE_API_URL`: *(Your Render backend URL from Step 2, e.g. `https://expense-pilot-api.onrender.com`)*
4. Deploy! Vercel will automatically build the React SPA with rewrite rules configured in `vercel.json`.

---

## 📝 Recommended Resume Bullet Point

> **Expense Pilot** – Built a full-stack expense management platform using React, Express.js, PostgreSQL, and JWT authentication. Designed RESTful APIs with input validation and CSV streaming, implemented a 3-tier backend architecture (Routes → Validation → Services → DB), and engineered a rule-based financial insights engine to generate deterministic spending advice.

