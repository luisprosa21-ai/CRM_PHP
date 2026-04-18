/**
 * Simple hash-based SPA router with parameter support.
 */
export class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.beforeEach = null;
  }

  addRoute(path, handler) {
    this.routes[path] = handler;
    return this;
  }

  navigate(path) {
    window.location.hash = path;
  }

  start() {
    window.addEventListener('hashchange', () => this._resolve());
    window.addEventListener('load', () => this._resolve());
    this._resolve();
  }

  getCurrentRoute() {
    return this.currentRoute;
  }

  _resolve() {
    const hash = window.location.hash.slice(1) || '/';
    const { handler, params } = this._match(hash);

    if (handler) {
      if (this.beforeEach) {
        const allowed = this.beforeEach(hash, params);
        if (allowed === false) return;
      }
      this.currentRoute = { path: hash, params };
      handler(params);
    } else {
      this.navigate('/');
    }
  }

  _match(hash) {
    // Try exact match first
    if (this.routes[hash]) {
      return { handler: this.routes[hash], params: {} };
    }

    // Try parameterized routes
    const hashParts = hash.split('/').filter(Boolean);

    for (const [path, handler] of Object.entries(this.routes)) {
      const routeParts = path.split('/').filter(Boolean);

      if (routeParts.length !== hashParts.length) continue;

      const params = {};
      let match = true;

      for (let i = 0; i < routeParts.length; i++) {
        if (routeParts[i].startsWith(':')) {
          params[routeParts[i].slice(1)] = decodeURIComponent(hashParts[i]);
        } else if (routeParts[i] !== hashParts[i]) {
          match = false;
          break;
        }
      }

      if (match) {
        return { handler, params };
      }
    }

    return { handler: null, params: {} };
  }
}

export const router = new Router();
