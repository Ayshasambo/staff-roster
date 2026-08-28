/**
 * API Client for Staff Roster Backend with Token Authentication
 */

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Attach Bearer token from localStorage if available
  const token = localStorage.getItem('staff_roster_token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // If unauthorized, clear invalid token
      if (res.status === 401 && endpoint !== '/auth/login') {
        localStorage.removeItem('staff_roster_token');
        localStorage.removeItem('staff_roster_user');
      }

      const errorMessage = data.error || data.message || `Request failed (${res.status})`;
      const error = new Error(errorMessage);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (!navigator.onLine) {
      throw new Error('You are currently offline. Actions requiring server connection cannot be completed.');
    }
    throw err;
  }
}

export const api = {
  // Auth Endpoints
  auth: {
    login: (phonenumber, pin) => request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phonenumber, pin }),
    }),
    me: () => request('/auth/me'),
    changePin: (currentPin, newPin) => request('/auth/change-pin', {
      method: 'PATCH',
      body: JSON.stringify({ currentPin, newPin }),
    }),
  },

  // Staff Endpoints
  staff: {
    getActive: () => request('/staff'),
    getAll: () => request('/staff/all'),
    create: (data) => request('/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id, data) => request(`/staff/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    deactivate: (id) => request(`/staff/${id}/deactivate`, {
      method: 'PATCH',
    }),
    activate: (id) => request(`/staff/${id}/activate`, {
      method: 'PATCH',
    }),
  },

  // Leave Endpoints
  leaves: {
    getAll: (staffId) => request(staffId ? `/leaves?staffId=${staffId}` : '/leaves'),
    create: (data) => request('/leaves', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    approve: (id) => request(`/leaves/${id}/approve`, {
      method: 'PATCH',
    }),
    reject: (id) => request(`/leaves/${id}/reject`, {
      method: 'PATCH',
    }),
  },

  // Roster Endpoints
  roster: {
    getAll: () => request('/rosters'),
    getByMonth: (year, month) => request(`/rosters/${year}/${month}`),
    generate: (year, month) => request('/rosters/generate', {
      method: 'POST',
      body: JSON.stringify({ year: Number(year), month: Number(month) }),
    }),
    update: (id, shifts) => request(`/rosters/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ shifts }),
    }),
    publish: (id) => request(`/rosters/${id}/publish`, {
      method: 'PATCH',
    }),
  },
};
