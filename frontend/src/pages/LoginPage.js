// frontend/src/pages/LoginPage.js
import { authService } from '../services/AuthService.js';
import { router } from '../core/Router.js';

export class LoginPage {
  constructor(container) {
    this.container = container;
    this.error = null;
    this.loading = false;
  }

  async render() {
    this.container.innerHTML = `
      <style>${this.getStyles()}</style>
      
      <div class="login-page">
        <div class="login-container">
          <div class="login-header">
            <div class="logo">
              <span class="logo-icon">🏪</span>
              <h1>3D Store Studio</h1>
            </div>
            <p class="subtitle">Professional Virtual Shopping Environment Editor</p>
          </div>

          <form class="login-form" id="login-form">
            <div class="form-group">
              <label for="email">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                placeholder="admin@example.com"
                required
                autocomplete="email"
              />
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                placeholder="••••••••"
                required
                autocomplete="current-password"
              />
            </div>

            <div class="form-options">
              <label class="checkbox-label">
                <input type="checkbox" id="remember" name="remember" />
                <span>Remember me</span>
              </label>
              <a href="#" class="forgot-link">Forgot password?</a>
            </div>

            ${this.error ? `<div class="error-message">${this.error}</div>` : ''}

            <button type="submit" class="submit-btn" ${this.loading ? 'disabled' : ''}>
              ${this.loading ? `
                <span class="spinner"></span>
                Signing in...
              ` : 'Sign In'}
            </button>
          </form>

          <div class="login-footer">
            <p>Demo credentials:</p>
            <div class="demo-creds">
              <div class="cred-item">
                <strong>Admin:</strong> admin@example.com / admin123
              </div>
              <div class="cred-item">
                <strong>Editor:</strong> editor@example.com / editor123
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    const form = document.getElementById('login-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleLogin();
    });

    // Auto-fill demo credentials on double-click
    const demoCreds = document.querySelectorAll('.cred-item');
    demoCreds[0]?.addEventListener('dblclick', () => {
      document.getElementById('email').value = 'admin@example.com';
      document.getElementById('password').value = 'admin123';
    });
    demoCreds[1]?.addEventListener('dblclick', () => {
      document.getElementById('email').value = 'editor@example.com';
      document.getElementById('password').value = 'editor123';
    });
  }

  async handleLogin() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      this.error = 'Please enter email and password';
      this.render();
      return;
    }

    this.loading = true;
    this.error = null;
    this.render();

    try {
      const result = await authService.login(email, password);
      if (result) {
        router.navigate('/dashboard');
      }else {
        this.error = result.message || 'Invalid credentials';
        this.loading = false;
        this.render();
      }
    } catch (error) {
      this.error = error.message || 'Invalid credentials';
      this.loading = false;
      this.render();
    }
  }

  getStyles() {
    return `
      .login-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #1e1e1e 0%, #2d2d30 100%);
        padding: 20px;
      }
      .login-container {
        background: #252526;
        border: 1px solid #3e3e42;
        border-radius: 12px;
        padding: 40px;
        width: 100%;
        max-width: 420px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      }
      .login-header {
        text-align: center;
        margin-bottom: 32px;
      }
      .logo {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-bottom: 12px;
      }
      .logo-icon {
        font-size: 40px;
      }
      .logo h1 {
        font-size: 24px;
        color: #fff;
        margin: 0;
        font-weight: 600;
      }
      .subtitle {
        color: #858585;
        font-size: 14px;
        margin: 0;
      }
      .login-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .form-group label {
        color: #ccc;
        font-size: 13px;
        font-weight: 500;
      }
      .form-group input {
        background: #1e1e1e;
        border: 1px solid #3e3e42;
        color: #fff;
        padding: 10px 12px;
        border-radius: 6px;
        font-size: 14px;
        transition: border-color 0.15s;
      }
      .form-group input:focus {
        outline: none;
        border-color: #007acc;
      }
      .form-options {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
      }
      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #ccc;
        cursor: pointer;
      }
      .forgot-link {
        color: #007acc;
        text-decoration: none;
      }
      .forgot-link:hover {
        text-decoration: underline;
      }
      .error-message {
        background: rgba(248, 113, 113, 0.1);
        border: 1px solid rgba(248, 113, 113, 0.3);
        color: #f87171;
        padding: 10px 12px;
        border-radius: 6px;
        font-size: 13px;
      }
      .submit-btn {
        background: #007acc;
        color: white;
        border: none;
        padding: 12px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      .submit-btn:hover:not(:disabled) {
        background: #0098ff;
      }
      .submit-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
      .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      .login-footer {
        margin-top: 24px;
        padding-top: 20px;
        border-top: 1px solid #3e3e42;
        text-align: center;
      }
      .login-footer p {
        color: #858585;
        font-size: 12px;
        margin: 0 0 12px 0;
      }
      .demo-creds {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .cred-item {
        background: #1e1e1e;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        color: #ccc;
        cursor: pointer;
        transition: background 0.15s;
      }
      .cred-item:hover {
        background: #2d2d30;
      }
      .cred-item strong {
        color: #007acc;
      }
    `;
  }

  destroy() {
    // Cleanup if needed
  }
}