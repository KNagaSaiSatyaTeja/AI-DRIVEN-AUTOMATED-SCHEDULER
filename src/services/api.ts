
import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (name: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  
  create: async (userData: { name: string; email: string; password: string; role: string }) => {
    const response = await api.post('/users', userData);
    return response.data;
  },
  
  update: async (id: string, userData: { name: string; email: string; role: string }) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

// Rooms API
export const roomsAPI = {
  getAll: async () => {
    console.log('Fetching all rooms');
    const response = await api.get('/rooms');
    return response.data;
  },
  
  create: async (roomData: { name: string; capacity: number }) => {
    const response = await api.post(`/rooms`, roomData);
    return response.data;
  },
  
  update: async (id: string, roomData: { name: string; capacity?: number }) => {
    const response = await api.put(`/rooms/${id}`, roomData);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/rooms/${id}`);
    return response.data;
  },
};

// Faculty API
export const facultyAPI = {
  getAll: async () => {
    const response = await api.get('/faculty');
    return response.data;
  },
  
  create: async (facultyData: { 
    name: string; 
    email: string; 
    department: string; 
    availability: { day: string; time: string; available: boolean }[] 
  }) => {
    const response = await api.post('/faculty', facultyData);
    return response.data;
  },
  
  update: async (id: string, facultyData: { 
    name: string; 
    email: string; 
    department: string; 
    availability: { day: string; time: string; available: boolean }[] 
  }) => {
    const response = await api.put(`/faculty/${id}`, facultyData);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/faculty/${id}`);
    return response.data;
  },
};

// Subjects API
export const subjectsAPI = {
  getAll: async () => {
    const response = await api.get('/subjects');
    return response.data;
  },
  
  create: async (subjectData: { 
    name: string; 
    code: string; 
    credits: number; 
    type: string 
  }) => {
    const response = await api.post('/subjects', subjectData);
    return response.data;
  },
  
  update: async (id: string, subjectData: { 
    name: string; 
    code: string; 
    credits: number; 
    type: string 
  }) => {
    const response = await api.put(`/subjects/${id}`, subjectData);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/subjects/${id}`);
    return response.data;
  },
};

// Timetable API
export const timetableAPI = {
  getAll: async (roomId?: string) => {
    const url = roomId ? `/timetable/room/${roomId}` : '/timetable';
    const response = await api.get(url);
    return response.data;
  },
  
  generate: async (roomId: string, config: any) => {
    const response = await api.post(`/timetable/room/${roomId}/generate`, config);
    return response.data;
  },
  
  update: async (roomId: string, id: string, config: any) => {
    const response = await api.put(`/timetable/room/${roomId}/${id}`, config);
    return response.data;
  },
  
  delete: async (roomId: string, id: string) => {
    const response = await api.delete(`/timetable/room/${roomId}/${id}`);
    return response.data;
  },
};

export default api;
