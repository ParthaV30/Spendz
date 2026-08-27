# Expense Tracker

A multi-user web-based expense tracker application for managing personal finances. Track expenses by category, set budgets, and view detailed analytics.

## Features

- **User Authentication**: Secure registration and login
- **Expense Management**: Add, edit, and delete expenses with categories and dates
- **Categories**: Create custom categories or use system defaults
- **Budget Tracking**: Set monthly budgets per category and monitor spending
- **Reports & Analytics**: View spending trends, category breakdowns, and monthly summaries
- **Multi-User**: Each user manages their own expenses privately

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form
- **Validation**: Zod
- **Charts**: Recharts

## Prerequisites

- Node.js (v18+)
- npm or yarn
- PostgreSQL (or Docker)
- Git

## Installation

### 1. Clone the repository
```bash
cd C:\Users\sarat\OneDrive\Desktop\Expense-Tracker
```

### 2. Setup Environment Variables
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=expense_tracker
PORT=3000
JWT_SECRET=your-secret-key-here
```

### 3. Start PostgreSQL (using Docker)
```bash
docker-compose up -d
```

### 4. Install Dependencies
```bash
npm run install-deps
```

This will install dependencies for both backend and frontend.

## Development

### Start Backend Server
```bash
cd backend
npm run dev
```

Backend runs on `http://localhost:3000`

### Start Frontend Dev Server (in another terminal)
```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173`

## Project Structure

```
Expense-Tracker/
├── backend/                      # Node.js/Express API
│   ├── src/
│   │   ├── db/                  # Database connection and schema
│   │   ├── middleware/          # Express middleware (auth, error handling)
│   │   ├── repositories/        # Data access layer
│   │   ├── routes/              # API routes
│   │   ├── app.js              # Express app factory
│   │   └── index.js            # Server entry point
│   └── package.json
│
├── frontend/                     # React SPA
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   ├── context/             # React context (Auth)
│   │   ├── pages/               # Page components
│   │   ├── App.jsx             # Main app component
│   │   └── main.jsx            # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── docker-compose.yml           # PostgreSQL development setup
├── .env.example                 # Environment variables template
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user (requires auth)

### Categories
- `GET /api/v1/categories` - Get all categories
- `POST /api/v1/categories` - Create category
- `PATCH /api/v1/categories/:id` - Update category
- `DELETE /api/v1/categories/:id` - Delete category

### Expenses
- `GET /api/v1/expenses` - Get all expenses (with filters)
- `POST /api/v1/expenses` - Create expense
- `GET /api/v1/expenses/:id` - Get single expense
- `PATCH /api/v1/expenses/:id` - Update expense
- `DELETE /api/v1/expenses/:id` - Delete expense

### Budgets
- `GET /api/v1/budgets/status` - Get budget status for date range
- `PUT /api/v1/budgets` - Create or update budget
- `DELETE /api/v1/budgets/:id` - Delete budget

## Usage

### Register a New User
1. Go to `http://localhost:5173/register`
2. Enter email, password, and name
3. Click "Sign up"

### Add an Expense
1. Go to "Expenses" page
2. Click "Add Expense"
3. Select category, enter amount, date, and optional note
4. Save

### Set a Budget
1. Go to "Budgets" page
2. Select month
3. Set amount for each category
4. Monitor progress toward your budget

### View Reports
1. Go to "Reports" page
2. Select date range
3. View spending trends and category breakdown

## Testing

### Run Backend Tests
```bash
cd backend
npm test
```

### Run Frontend Tests
```bash
cd frontend
npm test
```

## Database

### Database Schema

#### Users
```sql
- id (UUID, PK)
- email (UNIQUE)
- password_hash
- name
- created_at, updated_at
```

#### Categories
```sql
- id (UUID, PK)
- user_id (FK to users)
- name
- color (hex code)
- icon (optional)
```

#### Expenses
```sql
- id (UUID, PK)
- user_id (FK to users)
- category_id (FK to categories)
- amount (DECIMAL)
- description
- expense_date
- created_at, updated_at
```

#### Budgets
```sql
- id (UUID, PK)
- user_id (FK to users)
- category_id (FK to categories)
- amount (DECIMAL)
- period ('monthly')
- reset_date
```

## Security Features

- Password hashing with bcryptjs
- JWT-based authentication
- CORS enabled
- Input validation
- User data isolation (each user sees only their data)
- SQL parameterization (prevents SQL injection)

## Development Roadmap

### Phase 1: Authentication ✓
- User registration and login
- JWT token management
- Protected routes

### Phase 2: Expenses & Categories ✓
- Create, read, update, delete expenses
- Category management
- Data filtering

### Phase 3: Reports & Analytics
- Monthly summaries
- Category breakdown charts
- Spending trends
- Expense filtering by date range

### Phase 4: Budgets
- Budget creation and management
- Budget progress tracking
- Over-budget alerts

### Phase 5: Polish & Deploy
- Performance optimization
- Accessibility improvements
- Security hardening
- Deployment setup

## Deployment

### Build for Production

#### Backend
```bash
cd backend
npm run build
npm start
```

#### Frontend
```bash
cd frontend
npm run build
```

### Environment Variables for Production
- Set strong `JWT_SECRET`
- Configure production database URL
- Set `NODE_ENV=production`
- Enable HTTPS
- Configure CORS appropriately

## Support & Contribution

For issues or feature requests, please create a GitHub issue.

## License

MIT License - feel free to use this project for personal or commercial purposes.

---

**Ready to track your expenses?** Start by registering an account and adding your first expense! 💰
