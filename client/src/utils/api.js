const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Token Management
export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const removeToken = () => localStorage.removeItem('token');

export const getUser = () => {
  const userStr = localStorage.getItem('user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};
export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
  window.dispatchEvent(new Event('auth-change'));
};
export const removeUser = () => {
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('auth-change'));
};

// Generic Fetch Wrapper
async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(`${API_URL}/api${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

export const api = {
  auth: {
    signup: async (username, email, password) => {
      const data = await request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ username, email, password })
      });
      if (data.token) setToken(data.token);
      if (data.user) setUser(data.user);
      return data;
    },
    login: async (email, password) => {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (data.token) setToken(data.token);
      if (data.user) setUser(data.user);
      return data;
    },
    guest: async () => {
      const data = await request('/auth/guest', {
        method: 'POST'
      });
      if (data.token) setToken(data.token);
      if (data.user) setUser(data.user);
      return data;
    },
    logout: () => {
      removeToken();
      removeUser();
    },
    getMe: async () => {
      const data = await request('/auth/me');
      if (data.user) setUser(data.user);
      return data.user;
    }
  },
  dashboard: {
    getStats: async () => {
      return request('/dashboard/stats');
    },
    getHistory: async () => {
      return request('/dashboard/history');
    },
    getMatch: async (matchId) => {
      return request(`/dashboard/match/${matchId}`);
    },
    getLeaderboard: async () => {
      return request('/dashboard/leaderboard');
    },
    getPublicProfile: async (username) => {
      return request(`/dashboard/profile/${username}`);
    }
  }
};
