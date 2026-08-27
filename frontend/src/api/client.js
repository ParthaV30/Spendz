const API_BASE = '/api/v1';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('accessToken');
  }

  setToken(token) {
    this.token = token;
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` })
    };
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: this.getHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API Error');
    }

    return data;
  }

  // Auth
  async register(email, password, name) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name })
    });
  }

  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Categories
  async getCategories() {
    return this.request('/categories');
  }

  async createCategory(name, color, icon) {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify({ name, color, icon })
    });
  }

  async updateCategory(id, updates) {
    return this.request(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  async deleteCategory(id) {
    return this.request(`/categories/${id}`, { method: 'DELETE' });
  }

  // Expenses
  async getExpenses(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const queryString = params.toString();
    return this.request(`/expenses${queryString ? '?' + queryString : ''}`);
  }

  async createExpense(categoryId, amount, description, expenseDate) {
    return this.request('/expenses', {
      method: 'POST',
      body: JSON.stringify({ categoryId, amount, description, expenseDate })
    });
  }

  async updateExpense(id, updates) {
    return this.request(`/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  async deleteExpense(id) {
    return this.request(`/expenses/${id}`, { method: 'DELETE' });
  }

  // Budgets
  async getBudgetStatus(startDate, endDate) {
    const params = new URLSearchParams({ startDate, endDate });
    return this.request(`/budgets/status?${params}`);
  }

  async upsertBudget(categoryId, amount, period = 'monthly') {
    return this.request('/budgets', {
      method: 'PUT',
      body: JSON.stringify({ categoryId, amount, period })
    });
  }

  async deleteBudget(id) {
    return this.request(`/budgets/${id}`, { method: 'DELETE' });
  }
}

export default new ApiClient();
