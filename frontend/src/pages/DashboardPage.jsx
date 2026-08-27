import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useExpenses, useCategories, useBudgetStatus } from '../api/hooks';

const DashboardPage = () => {
  const { user } = useAuth();
  const currentDate = new Date();
  const monthStart = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
  const monthEnd = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-31`;

  const { data: expenses = [] } = useExpenses({});
  const { data: categories = [] } = useCategories();
  const { data: budgets = [] } = useBudgetStatus(monthStart, monthEnd);

  const thisMonthExpenses = expenses.filter(e => e.expense_date.startsWith(monthStart.substring(0, 7)));
  const monthlyTotal = thisMonthExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const budgetUsed = budgets.length > 0
    ? Math.round(budgets.reduce((sum, b) => sum + (b.percentUsed || 0), 0) / budgets.length)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600 mb-8">Welcome back, {user?.name}! 👋</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
            <p className="text-gray-500 text-sm">This Month</p>
            <p className="text-3xl font-bold">${monthlyTotal.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1">{thisMonthExpenses.length} transactions</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
            <p className="text-gray-500 text-sm">Transactions</p>
            <p className="text-3xl font-bold">{expenses.length}</p>
            <p className="text-xs text-gray-400 mt-1">Total all time</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-600">
            <p className="text-gray-500 text-sm">Budget Used</p>
            <p className="text-3xl font-bold">{budgetUsed}%</p>
            <p className="text-xs text-gray-400 mt-1">Average across budgets</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-600">
            <p className="text-gray-500 text-sm">Categories</p>
            <p className="text-3xl font-bold">{categories.length}</p>
            <p className="text-xs text-gray-400 mt-1">Total</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Recent Expenses</h2>
              {thisMonthExpenses.length === 0 ? (
                <p className="text-gray-500">No expenses this month</p>
              ) : (
                <div className="space-y-3">
                  {thisMonthExpenses.slice(0, 5).map(expense => (
                    <div key={expense.id} className="flex justify-between items-center pb-3 border-b">
                      <div>
                        <p className="font-medium">{expense.category_name}</p>
                        <p className="text-sm text-gray-500">{expense.expense_date}</p>
                      </div>
                      <p className="font-bold">${parseFloat(expense.amount).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">Budget Status</h2>
              {budgets.slice(0, 3).map(budget => (
                <div key={budget.categoryId} className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{budget.categoryName}</span>
                    <span className="text-sm text-gray-600">{budget.percentUsed.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-full rounded-full ${
                        budget.percentUsed >= 100 ? 'bg-red-600' :
                        budget.percentUsed >= 80 ? 'bg-yellow-600' :
                        'bg-green-600'
                      }`}
                      style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <Link to="/expenses" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            ➕ Add Expense
          </Link>
          <Link to="/budgets" className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium">
            💰 Manage Budgets
          </Link>
          <Link to="/reports" className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium">
            📊 View Reports
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
