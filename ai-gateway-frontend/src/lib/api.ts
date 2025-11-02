import { getToken } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

class ApiClient {
  private async request(endpoint: string, options: RequestInit = {}) {
    const token = getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      console.log('Making request to:', `${API_BASE_URL}${endpoint}`); // Debug log

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        mode: 'cors', // Explicitly set CORS mode
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        throw new Error(errorData.error || 'API request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth
  async login(username: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  // Providers
  async getProviders() {
    return this.request('/api/providers');
  }

  async createProvider(data: any) {
    return this.request('/api/providers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProvider(id: string, data: any) {
    return this.request(`/api/providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProvider(id: string) {
    return this.request(`/api/providers/${id}`, {
      method: 'DELETE',
    });
  }

  // Routers
  async getRouters() {
    return this.request('/api/routers');
  }

  async getRouter(id: string) {
    return this.request(`/api/routers/${id}`);
  }

  async createRouter(name: string) {
    return this.request('/api/routers', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async createRoutingRule(routerId: string, data: any) {
    return this.request(`/api/routers/${routerId}/rules`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteRoutingRule(routerId: string, ruleId: string) {
    return this.request(`/api/routers/${routerId}/rules/${ruleId}`, {
      method: 'DELETE',
    });
  }

  async deleteRouter(id: string) {
    return this.request(`/api/routers/${id}`, {
      method: 'DELETE',
    });
  }

  // Gateway Keys
  async getKeys() {
    return this.request('/api/keys');
  }

  async createKey(name: string, router_id: string) {
    return this.request('/api/keys', {
      method: 'POST',
      body: JSON.stringify({ name, router_id }),
    });
  }

  async toggleKey(id: string, is_active: boolean) {
    return this.request(`/api/keys/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ is_active }),
    });
  }

  async deleteKey(id: string) {
    return this.request(`/api/keys/${id}`, {
      method: 'DELETE',
    });
  }

  // Models
  async getGlobalModels() {
    return this.request('/api/user-models/global');
  }

  async getUserModels() {
    return this.request('/api/user-models');
  }

  async createUserModel(data: any) {
    return this.request('/api/user-models', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteUserModel(id: string) {
    return this.request(`/api/user-models/${id}`, {
      method: 'DELETE',
    });
  }

  // Logs
  async getLogs(limit = 100, offset = 0) {
    return this.request(`/api/logs?limit=${limit}&offset=${offset}`);
  }

  async getLogsSummary() {
    return this.request('/api/logs/summary');
  }

  async getLogsByProvider() {
    return this.request('/api/logs/by-provider');
  }

  async getLogsByModel() {
    return this.request('/api/logs/by-model');
  }
}

export const api = new ApiClient();
