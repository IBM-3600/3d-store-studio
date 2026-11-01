// frontend/src/services/AuthService.js
import { EventBus } from '../core/EventBus.js';

export class AuthService {
  constructor() {
    this.token = null;
    this.user = null;
    this.tokenKey = 'studio_auth_token';
    this.userKey = 'studio_auth_user';
    
    // Restore session from storage
    this.restoreSession();
  }

  restoreSession() {
    try {
      const token = localStorage.getItem(this.tokenKey);
      const user = localStorage.getItem(this.userKey);
      
      if (token && user) {
        this.token = token;
        this.user = JSON.parse(user);
        
        // Check if token is expired
        const payload = this.decodeToken(token);
        if (payload.exp * 1000 < Date.now()) {
          this.clearSession();
          return;
        }
        
        console.log('[Auth] Session restored for:', this.user.email);
      }
    } catch (error) {
      console.error('[Auth] Failed to restore session:', error);
      this.clearSession();
    }
  }

  decodeToken(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      return {};
    }
  }

  async login(email, password) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      
      this.token = data.token;
      this.user = data.user;
      
      // Persist session
      localStorage.setItem(this.tokenKey, this.token);
      localStorage.setItem(this.userKey, JSON.stringify(this.user));
      
      EventBus.emit('auth:login', this.user);
      console.log('[Auth] Login successful:', this.user.email);
      
      return this.user;
    } catch (error) {
      console.error('[Auth] Login error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      if (this.token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('[Auth] Logout API error:', error);
    } finally {
      this.clearSession();
      EventBus.emit('auth:logout');
      console.log('[Auth] Logged out');
    }
  }

  clearSession() {
    this.token = null;
    this.user = null;
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  isAuthenticated() {
    if (!this.token || !this.user) return false;
    
    const payload = this.decodeToken(this.token);
    return payload.exp * 1000 > Date.now();
  }

  getToken() {
    return this.token;
  }

  getUser() {
    return this.user;
  }

  hasRole(role) {
    return this.user?.role === role;
  }

  hasAnyRole(roles) {
    return roles.includes(this.user?.role);
  }

  // Fetch wrapper with auth headers
  async authenticatedFetch(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, { ...options, headers });

    // Handle 401 - token expired or invalid
    if (response.status === 401) {
      this.clearSession();
      EventBus.emit('auth:token_expired');
      window.location.hash = '#/login';
      throw new Error('Session expired');
    }

    return response;
  }
}

export const authService = new AuthService();