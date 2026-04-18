/**
 * API service for communicating with the BFF.
 */
export class ApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  async request(method, path, data = null, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = { ...(options.headers || {}) };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = { method, headers };

    if (data && !(data instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      config.body = JSON.stringify(data);
    } else if (data instanceof FormData) {
      config.body = data;
    }

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }

      const contentType = response.headers.get('content-type') || '';
      let body;
      if (contentType.includes('application/json')) {
        body = await response.json();
      } else {
        body = await response.text();
      }

      if (!response.ok) {
        const error = new Error(body?.error || body?.message || `Error ${response.status}`);
        error.status = response.status;
        error.data = body;
        throw error;
      }

      return body;
    } catch (err) {
      if (err.status) throw err;
      throw new Error('Error de conexión. Inténtelo de nuevo.');
    }
  }

  async get(path) {
    return this.request('GET', path);
  }

  async post(path, data) {
    return this.request('POST', path, data);
  }

  async put(path, data) {
    return this.request('PUT', path, data);
  }

  async delete(path) {
    return this.request('DELETE', path);
  }

  async upload(path, formData) {
    return this.request('POST', path, formData);
  }
}

const BFF_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3001'
  : '';

export const portalApi = new ApiService(`${BFF_BASE}/portal`);
export const crmApi = new ApiService(`${BFF_BASE}/crm`);
export const bankApi = new ApiService(`${BFF_BASE}/banks`);
export const backofficeApi = new ApiService(`${BFF_BASE}/backoffice`);
