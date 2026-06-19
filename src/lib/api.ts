const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const getAuthHeader = () => {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new ApiError(response.status, error.error || 'Request failed');
  }
  return response.json();
};

// Auth API
export const authApi = {
  register: async (data: {
    email: string;
    username: string;
    password: string;
    displayName?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  login: async (data: { login: string; password: string }) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};

// Users API
export const usersApi = {
  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: getAuthHeader(),
    });
    return handleResponse(response);
  },

  updateProfile: async (data: { displayName?: string; avatarUrl?: string }) => {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  searchUsers: async (query: string) => {
    const response = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}`, {
      headers: getAuthHeader(),
    });
    return handleResponse(response);
  },
};

// Moods API
export const moodsApi = {
  createMood: async (data: { moodType: string; isVisible?: boolean }) => {
    const response = await fetch(`${API_BASE_URL}/moods`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getCurrentMood: async () => {
    const response = await fetch(`${API_BASE_URL}/moods/current`, {
      headers: getAuthHeader(),
    });
    return handleResponse(response);
  },

  getMoodHistory: async (limit = 50, offset = 0) => {
    const response = await fetch(`${API_BASE_URL}/moods/history?limit=${limit}&offset=${offset}`, {
      headers: getAuthHeader(),
    });
    return handleResponse(response);
  },

  acknowledgeMood: async (moodId: string) => {
    const response = await fetch(`${API_BASE_URL}/moods/${moodId}/acknowledge`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    return handleResponse(response);
  },
};

// Contacts API
export const contactsApi = {
  getContacts: async () => {
    const response = await fetch(`${API_BASE_URL}/contacts`, {
      headers: getAuthHeader(),
    });
    return handleResponse(response);
  },

  sendFriendRequest: async (username: string) => {
    const response = await fetch(`${API_BASE_URL}/contacts/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ username }),
    });
    return handleResponse(response);
  },

  getFriendRequests: async () => {
    const response = await fetch(`${API_BASE_URL}/contacts/requests`, {
      headers: getAuthHeader(),
    });
    return handleResponse(response);
  },

  handleFriendRequest: async (requestId: string, action: 'accept' | 'reject') => {
    const response = await fetch(`${API_BASE_URL}/contacts/request/${requestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ action }),
    });
    return handleResponse(response);
  },

  removeContact: async (contactId: string) => {
    const response = await fetch(`${API_BASE_URL}/contacts/${contactId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return handleResponse(response);
  },
};

export { ApiError };