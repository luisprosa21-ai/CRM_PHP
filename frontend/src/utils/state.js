/**
 * Simple state management store with subscription support.
 */
export class Store {
  constructor(initialState = {}) {
    this._state = { ...initialState };
    this._listeners = {};
  }

  getState(key) {
    if (key !== undefined) {
      return this._state[key];
    }
    return { ...this._state };
  }

  setState(partial) {
    const changedKeys = [];

    for (const [key, value] of Object.entries(partial)) {
      if (this._state[key] !== value) {
        changedKeys.push(key);
      }
      this._state[key] = value;
    }

    changedKeys.forEach((key) => this.notify(key));
  }

  subscribe(key, callback) {
    if (!this._listeners[key]) {
      this._listeners[key] = [];
    }
    this._listeners[key].push(callback);

    return () => {
      this._listeners[key] = this._listeners[key].filter((cb) => cb !== callback);
    };
  }

  notify(key) {
    if (this._listeners[key]) {
      this._listeners[key].forEach((cb) => cb(this._state[key], this._state));
    }
    if (this._listeners['*']) {
      this._listeners['*'].forEach((cb) => cb(this._state));
    }
  }
}

export const store = new Store({
  user: null,
  token: null,
  currentView: 'portal',
  notificationCount: 0,
  sidebarOpen: true,
  loading: false,
});
