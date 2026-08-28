
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = data.error || data.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (!navigator.onLine) {
      throw new Error('You are offline. Please check your internet connection.');
    }
    throw err;
  }
}

export const api = {
  auth: {
    login: (phonenumber, pin) => request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        phonenumber,
        pin
      }),
    }),

    me: () => request('/auth/me'),

    changePin: (currentPin, newPin) => request('/auth/change-pin', {
      method: 'PATCH',
      body: JSON.stringify({
        currentPin,
        newPin
      }),
    }),
  },
  // Staff Endpoints
  staff: {
    getActive: () => request('/staff'),
    getAll: () => request('/staff/all'),
    create: (staffData) => request('/staff', {
      method: 'POST',
      body: JSON.stringify(staffData),
    }),
    update: (id, staffData) => request(`/staff/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(staffData),
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
    getAll: () => request('/leaves'),
    create: (leaveData) => request('/leaves', {
      method: 'POST',
      body: JSON.stringify(leaveData),
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
