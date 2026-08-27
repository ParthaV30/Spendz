import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';

// Expenses
export const useExpenses = (filters) => {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => apiClient.getExpenses(filters),
    select: (data) => data.data?.expenses || []
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, amount, description, expenseDate }) =>
      apiClient.createExpense(categoryId, amount, description, expenseDate),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries(['budgets']);
    }
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }) => apiClient.updateExpense(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries(['budgets']);
    }
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries(['budgets']);
    }
  });
};

// Categories
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.getCategories(),
    select: (data) => data.data?.categories || []
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, color, icon }) =>
      apiClient.createCategory(name, color, icon),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
    }
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiClient.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
    }
  });
};

// Budgets
export const useBudgetStatus = (startDate, endDate) => {
  return useQuery({
    queryKey: ['budgets', startDate, endDate],
    queryFn: () => apiClient.getBudgetStatus(startDate, endDate),
    enabled: !!startDate && !!endDate,
    select: (data) => data.data?.budgets || []
  });
};

export const useUpsertBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, amount, period }) =>
      apiClient.upsertBudget(categoryId, amount, period),
    onSuccess: () => {
      queryClient.invalidateQueries(['budgets']);
    }
  });
};
