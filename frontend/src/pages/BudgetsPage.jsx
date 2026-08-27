import React, { useState } from 'react';
import { useBudgetStatus, useUpsertBudget, useCategories } from '../api/hooks';

const BudgetsPage = () => {
  const currentDate = new Date();
  const [period, setPeriod] = useState(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`);
  const [editingBudget, setEditingBudget] = useState(null);
  const [budgetAmount, setBudgetAmount] = useState('');

  const { data: budgets, isLoading } = useBudgetStatus(
    `${period}-01`,
    `${period}-31`
  );
  const { data: categories } = useCategories();
  const upsertBudget = useUpsertBudget();

  const handleSetBudget = async () => {
    if (editingBudget && budgetAmount) {
      await upsertBudget.mutateAsync({
        categoryId: editingBudget,
        amount: parseFloat(budgetAmount),
        period: 'monthly'
      });
      setEditingBudget(null);
      setBudgetAmount('');
    }
  };

  const getStatusColor = (budget) => {
    if (!budget.limitMinor || budget.limitMinor === 0) return 'bg-gray-200';
    if (budget.percentUsed >= 100) return 'bg-red-200';
    if (budget.percentUsed >= 80) return 'bg-yellow-200';
    return 'bg-green-200';
  };

  const getStatusText = (budget) => {
    if (!budget.limitMinor || budget.limitMinor === 0) return 'No budget';
    if (budget.percentUsed >= 100) return `Exceeded by $${((budget.spentMinor - budget.limitMinor) / 100).toFixed(2)}`;
    return `$${((budget.limitMinor - budget.spentMinor) / 100).toFixed(2)} remaining`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Budgets</h1>

        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700">Month</label>
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500"
          />
        </div>

        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-4">
            {budgets?.map(budget => (
              <div key={budget.categoryId} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{budget.categoryName}</h3>
                    <p className="text-sm text-gray-500">{getStatusText(budget)}</p>
                  </div>
                  {editingBudget === budget.categoryId ? (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={budgetAmount}
                        onChange={(e) => setBudgetAmount(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded"
                        placeholder="Amount"
                      />
                      <button
                        onClick={handleSetBudget}
                        disabled={upsertBudget.isPending}
                        className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingBudget(null)}
                        className="px-4 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingBudget(budget.categoryId);
                        setBudgetAmount(budget.limitMinor ? (budget.limitMinor / 100).toString() : '');
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      {budget.limitMinor ? 'Edit' : 'Set Budget'}
                    </button>
                  )}
                </div>

                {budget.limitMinor > 0 && (
                  <>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-full ${getStatusColor(budget)}`}
                        style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
                      />
                    </div>
                    <div className="mt-2 flex justify-between text-sm text-gray-600">
                      <span>Spent: ${(budget.spentMinor / 100).toFixed(2)}</span>
                      <span>Budget: ${(budget.limitMinor / 100).toFixed(2)}</span>
                      <span>{budget.percentUsed.toFixed(0)}%</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetsPage;
