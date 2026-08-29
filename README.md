# ROOMMATE — Shared Bachelor Room Expense Tracker

> Production-quality, multi-group financial application for tracking shared expenses, calculating net member balances, and executing optimized debt settlements without floating-point precision loss.

---

## 🚀 Key Features

- **Multi-Group Isolation:** Support for multiple bachelor rooms, apartment groups, or trip expenses per user with complete data boundary security.
- **Integer Minor Currency Calculations:** All monetary figures are stored as integer minor units (paise/cents) to eliminate floating-point rounding errors.
- **4 Expense Split Methods:**
  - **Equal Split:** Splitting bill total with remainder distribution to guarantee `sum(splits) === total`.
  - **Exact Amount Split:** User-defined exact amounts validated server-side.
  - **Percentage Split:** Validated to strictly sum to 100%.
  - **Shares Split:** Proportional share allocation.
- **Smart Debt Simplification Solver:** Implements a Min-Cash-Flow Greedy algorithm that reduces multi-person debt chains into minimal direct payments.
- **Monthly Accounting Period Locking:** Admin lock safeguard that prevents retrospective modifications or deletions of expenses in locked accounting periods.
- **Category Budgets:** Category budget limits per month with alerts at 80% (warning) and 100% (exceeded).
- **Recurring Expenses Engine:** Automated daily, weekly, monthly, and yearly scheduled shared room bills.
- **Audit Operations Trail:** Complete log of expense additions, edits, deletions, member role changes, and period lock/unlock events.
- **Invitation System:** Cryptographically secure invitation tokens for onboarding roommates via email/link.

---

## 🛠 Tech Stack

- **Framework:** Next.js (App Router, Server Actions)
- **Language:** TypeScript
- **Styling & UI:** Tailwind CSS, Lucide React Icons, Glassmorphism design system
- **Charts & Data Visualization:** Recharts
- **Database & ORM:** PostgreSQL / SQLite with Prisma ORM
- **Authentication:** JWT HTTP-Only Cookie Session with `bcryptjs` password hashing & Zod input validation
- **Testing:** Node & TSX test suite (`npx tsx src/__tests__/run-tests.ts`)

---

## 📦 Local Setup Instructions

### 1. Prerequisites
- Node.js v18+
- npm v9+

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
DATABASE_URL="file:./dev.db"
JWT_SECRET="roommate-super-secret-jwt-key-change-in-production-2026"
NODE_ENV="development"
```

### 3. Database Migration & Seeding
Sync database schema and populate with sample seed data:
```bash
# Push Prisma Schema to database
npx prisma db push

# Seed sample data (Chennai Bachelor Room group with Arun, Rahul, Karthik, Vijay)
npx tsx prisma/seed.ts
```

### 4. Running Financial Tests
Run the unit test suite covering split rounding, net balances, smart debt simplification, and month locking:
```bash
npm test
```

### 5. Running Development Server
Start Next.js local server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Login Credentials (from Seed)

| Role | Name | Email | Password |
|---|---|---|---|
| **Admin** | Arun Kumar | `arun@example.com` | `Password123!` |
| **Member** | Rahul Sharma | `rahul@example.com` | `Password123!` |
| **Member** | Karthik Raj | `karthik@example.com` | `Password123!` |
| **Member** | Vijay Sethu | `vijay@example.com` | `Password123!` |

---

## 📐 Financial Calculation Architecture

### Net Balance Formula
$$\text{Net Balance} = (\text{Total Paid}) - (\text{Share Consumed}) + (\text{Settlements Sent}) - (\text{Settlements Received})$$
- $\text{Net Balance} > 0$: Member is owed money.
- $\text{Net Balance} < 0$: Member owes money.

### Smart Settlement Algorithm (Min-Cash-Flow)
1. Compute net balances for all group members.
2. Separate into **Debtors** (negative balance) and **Creditors** (positive balance).
3. Sort both lists in descending order of magnitude.
4. Iteratively match max debtor $D$ and max creditor $C$, settling amount $X = \min(|D|, C)$.
5. Output simplified transaction $D \rightarrow C : X$ and update balances until all debts reach zero.
