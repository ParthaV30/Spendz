import React, { useState } from 'react';
import { useExpenses, useCreateExpense, useDeleteExpense, useCategories } from '../api/hooks';

const ExpensesPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0]
  });

  const { data: expenses, isLoading } = useExpenses({});
  const { data: categories } = useCategories();
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createExpense.mutateAsync({
      categoryId: formData.categoryId,
      amount: parseFloat(formData.amount),
      description: formData.description,
      expenseDate: formData.expenseDate
    });
    setFormData({
      categoryId: '',
      amount: '',
      description: '',
      expenseDate: new Date().toISOString().split('T')[0]
    });
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Expenses</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'Add Expense'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                  >
                    <option value="">Select a category</option>
                    {categories?.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    value={formData.expenseDate}
                    onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={createExpense.isPending}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {createExpense.isPending ? 'Adding...' : 'Add Expense'}
              </button>
            </form>
          </div>
        )}

        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">Amount</th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {expenses?.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No expenses yet. Add your first expense!
                    </td>
                  </tr>
                ) : (
                  expenses?.map(expense => (
                    <tr key={expense.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">{expense.expense_date}</td>
                      <td className="px-6 py-4 text-sm">{expense.category_name}</td>
                      <td className="px-6 py-4 text-sm">{expense.description || '-'}</td>
                      <td className="px-6 py-4 text-sm text-right font-medium">${parseFloat(expense.amount).toFixed(2)}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => deleteExpense.mutate(expense.id)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpensesPage;
