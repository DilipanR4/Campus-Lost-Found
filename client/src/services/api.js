const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Ensures cookies are sent and received
    ...options,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // DB & Server Health
  async getStatus() {
    return request('/status');
  },

  // Auth
  async getMe() {
    return request('/auth/me');
  },

  async login(username, password) {
    return request('/auth/login', {
      method: 'POST',
      body: { username, password },
    });
  },

  async register(username, password, name, role) {
    return request('/auth/register', {
      method: 'POST',
      body: { username, password, name, role },
    });
  },

  async logout() {
    return request('/auth/logout', {
      method: 'POST',
    });
  },

  // Items
  async getItems() {
    return request('/items');
  },

  async createItem(itemData) {
    return request('/items', {
      method: 'POST',
      body: itemData,
    });
  },

  async updateItemStatus(id, status) {
    return request(`/items/${id}/status`, {
      method: 'PUT',
      body: { status },
    });
  },

  async submitClaim(id, claimData) {
    return request(`/items/${id}/claim`, {
      method: 'POST',
      body: claimData,
    });
  },

  async reviewClaim(id, claimId, reviewData) {
    return request(`/items/${id}/claims/${claimId}`, {
      method: 'PUT',
      body: reviewData,
    });
  },

  async getMatches(id) {
    return request(`/items/${id}/matches`);
  },

  async deleteItem(id) {
    return request(`/items/${id}`, {
      method: 'DELETE',
    });
  },
};
