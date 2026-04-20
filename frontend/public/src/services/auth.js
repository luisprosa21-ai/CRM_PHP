/**
 * Authentication service.
 */
import { portalApi, crmApi, backofficeApi, bankApi } from './api.js';
import { store } from '../utils/state.js';

const AUTH_KEY = 'crm_auth';
const _authCallbacks = [];

function _persist(data) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
}

function _clear() {
  localStorage.removeItem(AUTH_KEY);
}

function _load() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function _setApis(token) {
  portalApi.setToken(token);
  crmApi.setToken(token);
  backofficeApi.setToken(token);
  bankApi.setToken(token);
}

function _notifyAuthChange(user) {
  _authCallbacks.forEach((cb) => cb(user));
}

export function initAuth() {
  const saved = _load();
  if (saved && saved.token) {
    store.setState({ user: saved.user, token: saved.token });
    _setApis(saved.token);
  }
}

export async function login(email, password, type = 'portal') {
  const api = type === 'portal' ? portalApi : crmApi;
  const result = await api.post('/login', { email, password });

  const token = result.data?.token || result.token;
  const user = result.data?.user || result.user || result.usuario;

  _setApis(token);
  _persist({ token, user });
  store.setState({ user, token });
  _notifyAuthChange(user);

  return { token, user };
}

export async function register(userData) {
  const result = await portalApi.post('/register', userData);
  const token = result.data?.token || result.token;
  const user = result.data?.user || result.user || result.usuario;

  if (token) {
    _setApis(token);
    _persist({ token, user });
    store.setState({ user, token });
    _notifyAuthChange(user);
  }

  return { token, user };
}

export function logout() {
  _clear();
  _setApis(null);
  store.setState({ user: null, token: null });
  _notifyAuthChange(null);
}

export function getCurrentUser() {
  const saved = _load();
  return saved ? saved.user : null;
}

export function isAuthenticated() {
  return !!store.getState('token');
}

export function getToken() {
  return store.getState('token');
}

export function getUserRole() {
  const user = store.getState('user');
  return user?.role || user?.rol || 'client';
}

export function onAuthChange(callback) {
  _authCallbacks.push(callback);
  return () => {
    const idx = _authCallbacks.indexOf(callback);
    if (idx >= 0) _authCallbacks.splice(idx, 1);
  };
}

// Listen for expired tokens
window.addEventListener('auth:expired', () => {
  logout();
  window.location.hash = '#/';
});
