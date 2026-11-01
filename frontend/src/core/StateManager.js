export class StateManager {
  constructor() {
    this.state = {};
    this.listeners = new Map();
  }

  get(key) {
    return key ? this.state[key] : this.state;
  }

  set(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;
    
    // Notify listeners
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach(callback => {
        try {
          callback(value, oldValue);
        } catch (error) {
          console.error(`[StateManager] Error in listener for "${key}":`, error);
        }
      });
    }
  }

  update(key, updates) {
    const currentValue = this.state[key] || {};
    this.set(key, { ...currentValue, ...updates });
  }

  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key).push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(key);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  reset() {
    this.state = {};
    this.listeners.clear();
  }
}