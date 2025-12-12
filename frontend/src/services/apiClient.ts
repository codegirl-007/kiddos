import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor: attach access token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor: handle token refresh
api.interceptors.response.use(
  response => response.data,
  async error => {
    const originalRequest = error.config;
    
    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        // Try to refresh token
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        
        const { accessToken } = response.data.data;
        localStorage.setItem('access_token', accessToken);
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        // Only redirect if we're not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error.response?.data || error);
  }
);

// Auth API
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  
  logout: () => api.post('/auth/logout'),
  
  getCurrentUser: () => api.get('/auth/me'),
  
  refresh: () => api.post('/auth/refresh')
};

// Channels API
export const channelsApi = {
  getAll: () => api.get('/channels'),
  
  add: (channelInput: string) =>
    api.post('/channels', { channelInput }),
  
  remove: (channelId: string) =>
    api.delete(`/channels/${channelId}`),
  
  refresh: (channelId: string) =>
    api.put(`/channels/${channelId}/refresh`)
};

// Videos API
export const videosApi = {
  getAll: (params?: any) => api.get('/videos', { params }),
  
  search: (query: string, params?: any) =>
    api.get('/videos/search', { params: { q: query, ...params } }),
  
  refresh: (channelIds?: string[]) =>
    api.post('/videos/refresh', { channelIds })
};

// Settings API
export const settingsApi = {
  getTimeLimit: () => api.get('/settings/time-limit'),
  
  setTimeLimit: (dailyLimit: number) =>
    api.put('/settings/time-limit', { dailyLimit }),
  
  heartbeat: (sessionId: string, route: string, video?: { title: string; channelName: string }, timeLimit?: { timeUsed: number; dailyLimit: number }) => api.post('/settings/heartbeat', { sessionId, route, videoTitle: video?.title, videoChannel: video?.channelName, timeUsed: timeLimit?.timeUsed, dailyLimit: timeLimit?.dailyLimit }),
  
  getConnectionStats: () => api.get('/settings/connection-stats')
};

// Word Groups API
export const wordGroupsApi = {
  getAll: () => api.get('/word-groups'),
  
  create: (name: string) =>
    api.post('/word-groups', { name }),
  
  update: (id: number, name: string) =>
    api.put(`/word-groups/${id}`, { name }),
  
  delete: (id: number) =>
    api.delete(`/word-groups/${id}`),
  
  addWord: (groupId: number, word: string) =>
    api.post(`/word-groups/${groupId}/words`, { word }),
  
  deleteWord: (wordId: number) =>
    api.delete(`/word-groups/words/${wordId}`)
};

// Users API (admin only)
export const usersApi = {
  getAll: () => api.get('/users'),
  
  create: (userData: { username: string; password: string; role?: 'admin' | 'user' }) =>
    api.post('/users', userData),
  
  update: (id: number, userData: { username?: string; role?: 'admin' | 'user' }) =>
    api.put(`/users/${id}`, userData),
  
  delete: (id: number) =>
    api.delete(`/users/${id}`),
  
  changePassword: (id: number, password: string) =>
    api.put(`/users/${id}/password`, { password })
};

// Settings Profiles API (admin only)
export const settingsProfilesApi = {
  getAll: () => api.get('/settings-profiles'),
  
  getById: (id: number) => api.get(`/settings-profiles/${id}`),
  
  create: (data: { name: string; description?: string; dailyTimeLimit?: number; enabledApps?: string[] }) =>
    api.post('/settings-profiles', data),
  
  update: (id: number, data: { name?: string; description?: string; isActive?: boolean }) =>
    api.put(`/settings-profiles/${id}`, data),
  
  delete: (id: number) => api.delete(`/settings-profiles/${id}`),
  
  updateSettings: (id: number, settings: { dailyTimeLimit?: number; enabledApps?: string[] }) =>
    api.put(`/settings-profiles/${id}/settings`, settings),
  
  regenerateCode: (id: number) => api.post(`/settings-profiles/${id}/regenerate-code`)
};

// Magic Code API (public)
export const magicCodeApi = {
  getSettingsByCode: (code: string) => api.get(`/magic-code/${code}`)
};

// Speech Sounds API (admin only)
export const speechSoundsApi = {
  clearPronunciationsCache: () => api.delete('/speech-sounds/cache')
};
