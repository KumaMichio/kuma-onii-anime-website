import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để thêm JWT token
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (email: string, username: string, password: string) =>
    api.post('/auth/register', { email, username, password }),
  getProfile: () => api.post('/auth/profile'),
};

// External phim.nguonc.com (proxied by backend)
export const sourceAPI = {
  getFilmsUpdated: (page = 1) => api.get('/source/films/phim-moi-cap-nhat', { params: { page } }),
  getFilmsDanhSach: (slug: string, page = 1) =>
    api.get(`/source/films/danh-sach/${encodeURIComponent(slug)}`, { params: { page } }),
  getFilmsTheLoai: (slug: string, page = 1) =>
    api.get(`/source/films/the-loai/${encodeURIComponent(slug)}`, { params: { page } }),
  getFilmsQuocGia: (slug: string, page = 1) =>
    api.get(`/source/films/quoc-gia/${encodeURIComponent(slug)}`, { params: { page } }),
  getFilmsNamPhatHanh: (slug: string, page = 1) =>
    api.get(`/source/films/nam-phat-hanh/${encodeURIComponent(slug)}`, { params: { page } }),
  searchFilms: (keyword: string) =>
    api.get('/source/films/search', { params: { keyword } }),
  getFilmDetail: (slug: string) => api.get(`/source/film/${encodeURIComponent(slug)}`),
};

// User persistence (favorites / watch progress)
export const userMediaAPI = {
  toggleFavorite: (filmSlug: string) => api.post(`/user-media/favorites/${encodeURIComponent(filmSlug)}`),
  listFavorites: () => api.get('/user-media/favorites'),
  getFavoriteStatus: (filmSlug: string) =>
    api.get(`/user-media/favorites/${encodeURIComponent(filmSlug)}/status`),

  updateProgress: (payload: { filmSlug: string; episodeNumber: number; progress: number }) =>
    api.post('/user-media/watch/progress', payload),

  getProgress: (params: { filmSlug: string; episodeNumber: number }) =>
    api.get('/user-media/watch/progress', { params }),

  getContinueWatching: (params?: { limit?: number }) =>
    api.get('/user-media/watch/continue', { params: params ?? {} }),
};

