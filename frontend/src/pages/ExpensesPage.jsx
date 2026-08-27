import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';

const ExpensesPage = () => {
  const { token } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const res = await fetch('/api/v1/expenses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Expenses</h1>

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
                </tr>
              </thead>
              <tbody>
                {data?.data?.expenses?.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      No expenses yet
                    </td>
                  </tr>
                ) : (
                  data?.data?.expenses?.map(expense => (
                    <tr key={expense.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">{expense.expense_date}</td>
                      <td className="px-6 py-4 text-sm">{expense.category_name}</td>
                      <td className="px-6 py-4 text-sm">{expense.description}</td>
                      <td className="px-6 py-4 text-sm text-right font-medium">${expense.amount}</td>
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
