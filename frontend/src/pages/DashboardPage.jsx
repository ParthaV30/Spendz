import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600 mb-8">Welcome back, {user?.name}!</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-sm">This Month</p>
            <p className="text-3xl font-bold">$0.00</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-sm">Transactions</p>
            <p className="text-3xl font-bold">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-sm">Budget Used</p>
            <p className="text-3xl font-bold">0%</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-sm">Categories</p>
            <p className="text-3xl font-bold">0</p>
          </div>
        </div>

        <div className="flex gap-4">
          <Link to="/expenses" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            View Expenses
          </Link>
          <Link to="/budgets" className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            View Budgets
          </Link>
          <Link to="/reports" className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            View Reports
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
