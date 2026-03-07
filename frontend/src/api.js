import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
console.log("API BASE URL:", import.meta.env.VITE_API_BASE_URL);

// ── Response interceptor: on 401, clear token and reload to login ─────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hrms_token');
      localStorage.removeItem('hrms_user');
      delete api.defaults.headers.common['Authorization'];
      // Only redirect if not already on login-implied root path
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:    (credentials)  => api.post('/api/v1/users/login', credentials),
  register: (userData)     => api.post('/api/v1/users/register', userData),
  me:       ()             => api.get('/api/v1/users/me'),
};

export const employeeAPI = {
  getAll: (skip = 0, limit = 10, search = null) => {
    let url = '/api/v1/employees/';
    const params = new URLSearchParams();
    
    if (skip > 0) params.append('skip', skip);
    if (limit !== 10) params.append('limit', limit);
    if (search) params.append('search', search);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return api.get(url);
  },
  getById: (employeeId) => api.get(`/api/v1/employees/${employeeId}`),
  create: (employeeData) => api.post('/api/v1/employees/', employeeData),
  delete: (employeeId) => api.delete(`/api/v1/employees/${employeeId}`),
};

export const attendanceAPI = {
  getAll: () => api.get('/api/v1/attendances/'),
  getByEmployee: (employeeId, startDate = null, endDate = null) => {
    let url = `/api/v1/attendances/employee/${employeeId}`;
    const params = new URLSearchParams();
    
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return api.get(url);
  },
  create: (attendanceData) => api.post('/api/v1/attendances/', attendanceData),
};

export default api;
