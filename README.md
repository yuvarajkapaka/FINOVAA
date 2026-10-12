# FINOVA — Learn Money. Master Decisions.

FINOVA is a gamified financial literacy and investment simulator that teaches users how to manage money, save, understand investment concepts, and make informed financial decisions through interactive lessons, virtual trading, financial-life scenarios, and decision replay.

> **Strictly Educational Simulation**: This application does not connect to live market brokerages, execute real-money transactions, or provide actual financial advice.

---

## 🏗️ Architecture & Technology Stack

- **Frontend**:
  - React 19 + Vite
  - Tailwind CSS (Fintech Theme)
  - Lucide React (Iconography)
  - Recharts (Financial and Portfolio Charts)
- **Backend**:
  - Node.js (v20+) / Express.js
  - SQLite (Native `node:sqlite` engine with WAL mode and foreign key enforcement)
  - REST API Architecture
- **Financial Rule Engine**:
  - Integer minor currency units (paise / cents) to prevent floating-point inaccuracies
  - Conservation of money guarantee (transfers between cash, savings, and investments do not leak or mint unauthorized capital)
  - Deterministic 100-point Financial Literacy & Smart Decisions scoring rubric

---

## 📁 Project Structure

```
FINOVA/
├── package.json              # Root workspace scripts
├── README.md                 # Setup and run instructions
├── client/                   # Frontend Vite + React application
│   ├── index.html            # Main HTML with Inter typography & metadata
│   ├── package.json          # Client dependencies
│   ├── postcss.config.js     # PostCSS configuration
│   ├── tailwind.config.js    # Tailwind config with custom FINOVA fintech palette
│   ├── vite.config.js        # Vite config with /api reverse proxy to port 5000
│   └── src/
│       ├── App.jsx           # Initial verification view & API status check
│       ├── index.css         # Tailwind directives & global styling
│       └── main.jsx          # React DOM entry point
└── server/                   # Backend Node.js + Express + SQLite application
    ├── package.json          # Server dependencies
    ├── data/                 # SQLite database storage (auto-generated)
    └── src/
        ├── config.js         # Port and environment configuration
        ├── index.js          # Express app, middleware, routes, and error handlers
        └── db/
            └── database.js   # SQLite database connection & pragmas
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20 or v22+ (verified with Node v24)
- **npm**: v10+

### 1. Installation

Install dependencies for both backend and frontend from the root:
```bash
# From the FINOVA root directory
npm run install:all
```

Or install separately:
```bash
# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
```

### 2. Running the Application

You can run the backend and frontend in separate terminal windows:

#### Terminal 1 — Start the Backend Server (Port 5000)
```bash
npm run dev:server
# or: cd server && npm run dev
```
The server will start at `http://localhost:5000` with `/api/health` available.

#### Terminal 2 — Start the Frontend Dev Server (Port 3000)
```bash
npm run dev:client
# or: cd client && npm run dev
```
The frontend will open at `http://localhost:3000` with requests to `/api/*` proxied to the backend.

---

## 🩺 Health Check Verification

Test the backend health check directly via `curl` or browser:
```bash
curl http://localhost:5000/api/health
```

Expected Response:
```json
{
  "status": "healthy",
  "app": "FINOVA API",
  "tagline": "Learn Money. Master Decisions.",
  "version": "1.0.0",
  "timestamp": "2026-10-12T...",
  "uptime": 12,
  "database": "connected"
}
```

---

## 🎯 Phased Roadmap

- [x] **Phase 1**: Workspace Inspection, Project Scaffold, Dependencies, SQLite Setup, and Health Endpoint Verification.
- [x] **Phase 2**: Virtual Wallet & Transaction Ledger (₹1,00,000 virtual balance, paise precision, atomic transactions, overdraft prevention, Indian Rupee formatting, responsive UI).
- [x] **Phase 3**: Savings Goals & Emergency Fund (Dedicated emergency cushion, purpose-driven custom goals, zero-leakage accounting, progress metrics).
- [x] **Phase 4**: Learn to Invest Academy (15 curated lessons, Indian Rupee case studies, server-graded quizzes, 25-point Financial Knowledge Score).
- [x] **Phase 5**: Fictional Investment Marketplace & Portfolio (6 educational asset classes, deterministic pricing engine, buy/sell atomic validation, Recharts asset allocation, zero wealth-leakage).
- [x] **Phase 7**: 100-Point Financial Literacy Score & Leaderboard (4 scoring pillars, percentage-based savings fairness, duplicate prevention, personal milestones roadmap).
- [ ] **Phase 8**: AI Financial Mentor (LLM API integration with read-only educational guidance).

---

## 💳 Core API Endpoints

### Virtual Wallet & Transaction Ledger (Phase 2)
All monetary values are calculated and validated strictly in integer minor units (**paise**, where ₹1.00 = 100 paise) to eliminate floating-point arithmetic errors.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/wallet` | Fetch current virtual wallet state (cash, savings, total) |
| `GET` | `/api/wallet/categories` | Retrieve valid income and expense categories |
| `GET` | `/api/transactions` | Query ledger audit history (sorted newest first, with pagination) |
| `POST` | `/api/wallet/income` | Credit simulated income (`amount`, `category`, `description`) |
| `POST` | `/api/wallet/expense` | Debit simulated expense with overdraft prevention |
| `POST` | `/api/wallet/transfer-to-savings` | Allocate cash to savings buffer (guarantees conservation of money) |
| `POST` | `/api/wallet/withdraw-from-savings` | Transfer savings back to available liquid cash |

### Savings Goals & Emergency Fund (Phase 3)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/goals` | List all goals with progress percentages, target/saved amounts, and totals |
| `GET` | `/api/goals/categories` | Predefined goal categories (Emergency, Education, Tech, Travel, etc.) |
| `GET` | `/api/goals/emergency-fund` | Dedicated Emergency Fund goal details & core financial principles |
| `POST` | `/api/goals` | Create a new savings goal (`name`, `target_amount`, `target_date`, `category`) |
| `PUT` | `/api/goals/:id` | Update goal target amount, timeline, or category |
| `POST` | `/api/goals/:id/contribute` | Fund goal from Available Cash or Unallocated Savings |
| `POST` | `/api/goals/:id/withdraw` | Release funds from goal back to Liquid Cash |
| `DELETE` | `/api/goals/:id` | Safely remove goal (auto-refunds any saved funds to liquid cash) |

### Learn to Invest Academy (Phase 4)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/academy/lessons` | List 15 lessons with user completion and quiz status |
| `GET` | `/api/academy/progress` | Get authoritative Financial Knowledge Score out of 25.0 and breakdown |
| `GET` | `/api/academy/lessons/:id` | Get lesson content, case studies, and sanitized quiz questions |
| `POST` | `/api/academy/lessons/:id/complete` | Mark a lesson as read / completed |
| `POST` | `/api/academy/lessons/:id/quiz` | Submit quiz answers for server-side evaluation and feedback |

#### 📐 Financial Knowledge Scoring Formula (25.0 pts Max)
1. **Lesson Reading Completion (10.0 pts)**:
   $$\text{Reading Score} = \min\left(10, \frac{\text{Completed Lessons}}{15} \times 10\right)$$
2. **Quiz Mastery (15.0 pts)**:
   $$\text{Quiz Score} = \sum_{i=1}^{15} \left(\frac{\text{Best Correct Answers}_i}{\text{Total Questions}_i}\right) \times 1.0\text{ pt}$$
3. **Total Financial Knowledge Score**:
   $$\text{Score} = \min(25.0, \text{round}(\text{Reading Score} + \text{Quiz Score}, 1))$$

### Virtual Investment Marketplace & Portfolio (Phase 5)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/marketplace/assets` | Retrieve all 6 simulated assets with current cycle prices, change %, and history |
| `GET` | `/api/marketplace/assets/:id` | Detailed asset info, risk/return profiles, and full price cycle history |
| `POST` | `/api/marketplace/advance` | Authoritative market advance trigger (updates cycle and appends prices) |
| `POST` | `/api/marketplace/buy` | Buy virtual units (`asset_id`, `quantity`). Deducts cash, records holding & ledger |
| `POST` | `/api/marketplace/sell` | Sell virtual units (`asset_id`, `quantity`). Credits cash, updates cost basis & logs P&L |
| `GET` | `/api/portfolio` | Full valuation dashboard: holdings, cost basis, unrealized/realized P&L, allocation |

### Financial-Life Simulation & Decision Replay (Phase 6)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/simulation/scenarios` | Returns catalog of 5 deterministic educational scenarios with choices |
| `GET` | `/api/simulation/snapshot` | Returns authoritative, immutable virtual financial baseline state |
| `POST` | `/api/simulation/evaluate` | Evaluates decisions against immutable snapshot without touching real accounts |

#### 📐 Scenarios & Transparent Evaluation Labels
- **Scenario A: Sudden Emergency (₹8,000)** — Tests emergency fund vs. cash vs. investment liquidation.
- **Scenario B: Income Shortfall (₹10,000)** — Tests discretionary spending trimming vs. cushion drawing.
- **Scenario C: Goal Deadline (₹12,000 deficit)** — Tests milestone completion vs. deadline extension vs. emergency fund raiding.
- **Scenario D: Simulated Market Downturn (-18% pullback)** — Tests holding the course vs. tactical dip buying vs. panic selling.
- **Scenario E: Financial Opportunity (₹25,000 bonus)** — Tests 100% emergency buffer vs. 50/50 balanced split vs. 100% equity compounding.

**Evaluation Labels**:
- `Goal-Aligned`: Directly advances milestones or long-term growth without compromising stability.
- `Budget-Aware`: Exercises cash-flow discipline, rebalancing, or living within adjusted means.
- `Liquidity Preserved`: Protects defensive emergency reserves and liquid buffers.
- `Goal Trade-Off`: Accepts a delay in a non-urgent milestone to avoid financial stress.
- `Learning Opportunity`: Highlights behavioral pitfalls (panic selling, raiding emergency funds for luxury).

### Financial Literacy Score & Leaderboard (Phase 7)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/score` | Centralized backend score out of 100.0, category breakdowns, and tier status |
| `GET` | `/api/leaderboard` | Personal progress board, cohort ranking, and next recommended milestones |
| `POST` | `/api/score/record-activity` | Records verified investment learning action (strictly idempotent) |
| `GET` | `/api/score/literacy-check` | Returns sanitized 4-question Investment Literacy Comprehension Check |
| `POST` | `/api/score/literacy-check` | Evaluates and grades comprehension check answers on the backend (+4.0 pts) |

#### 📐 100-Point Scoring Rubric (4 Pillars)
$$\text{Total Literacy Score} = \min(100.0, A + B + C + D)$$

1. **Category A: Savings Progress (30.0 pts max)**:
   - **Emergency Cushion (15.0 pts)**: $\min(15, \frac{\text{Emergency Saved}}{\text{Emergency Target}} \times 15)$
   - **Goal Milestones (15.0 pts)**: Average progress across active funded goals. Empty goals award 0 points; raw rupee amounts do not affect score.
2. **Category B: Financial Knowledge (25.0 pts max)**:
   - Direct integration with authoritative Academy engine (10.0 pts reading completion + 15.0 pts quiz accuracy).
3. **Category C: Decision-Making (25.0 pts max)**:
   - Unique scenario replays ($5 \times 3.0 = 15.0$ pts max) + Side-by-side trade-off comparisons ($5 \times 2.0 = 10.0$ pts max).
4. **Category D: Investment Learning (20.0 pts max)**:
   - 4 asset class explorations (8.0 pts) + allocation review (4.0 pts) + market cycle review (4.0 pts) + comprehension check (4.0 pts).
   - **Wealth Independence Invariant**: Portfolio valuation, trade sizes, and simulated profit/loss **never** alter points or ranking.

### AI Financial Mentor (Phase 8)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/mentor/status` | Discovers local Ollama models dynamically, reports connection health and suggested questions |
| `GET` | `/api/mentor/context` | Read-only authoritative financial context shared with the mentor |
| `POST` | `/api/mentor/chat` | Accepts user question, injects verified context, and queries local model or educational fallback |

#### 🤖 Local Ollama & Model Configuration
- **Dynamic Model Inspection**: Discovers installed models via `GET /api/tags` rather than assuming a static model. Prioritizes local Qwen models (e.g. `qwen3.5:latest`) and adapts to any installed model.
- **ChatML Fast Formatting**: Utilizes raw prompt formatting with thinking tag suppression (`<think>...</think>`) to ensure snappy generation (~10-15s) on consumer laptop GPUs.
- **Strict Read-Only Guardrails**:
  - Financial values are fetched strictly from authoritative backend services (`walletService`, `goalService`, `marketService`, `scoreService`, `simulationService`).
  - Chat input is untrusted; user-claimed balances are ignored.
  - Zero permissions to execute trades, modify wallet balances, or alter scores.
- **Graceful Offline Fallback Engine**: If Ollama is offline or times out (50s threshold), FINOVA seamlessly serves rich, beginner-friendly educational explanations covering compound interest, diversification, portfolio breakdown, inflation, and score improvement without breaking the app.

---

### Automated Tests
Run the complete backend test suite:
```bash
cd server
npm test
```
All **56 tests across 7 test suites** verify:
- Virtual wallet ledger, overdraft protection, and paise conversion.
- Savings goals creation, progress metrics, and auto-refund upon deletion.
- Learn to Invest Academy reading status, quiz evaluation, and score limits.
- Marketplace catalog retrieval, deterministic price advancement, and price history.
- Buy/sell order validations, realized P&L, and wealth conservation invariants.
- Life simulation scenario catalog, immutable snapshot capture, and deterministic alternative choice comparisons.
- Total preservation of real database accounts during hypothetical decision replays.
- 100-point literacy score calculations, category caps, wealth/portfolio independence, and duplicate prevention.
- AI Financial Mentor status check, dynamic model inspection, verified context builder, input validation, educational fallback engine, and zero-mutation financial invariants.



