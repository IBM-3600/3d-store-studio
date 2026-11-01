// frontend/src/pages/NotFoundPage.js
import { router } from '../core/Router.js';
import { authService } from '../services/AuthService.js';

export class NotFoundPage {
  constructor(container) {
    this.container = container;
  }

  async render() {
    const isAuth = authService.isAuthenticated();
    
    this.container.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="not-found-page">
        <div class="not-found-content">
          <div class="error-code">404</div>
          <h1>Page Not Found</h1>
          <p>The page you're looking for doesn't exist or has been moved.</p>
          <button class="primary-btn" id="home-btn">
            ${isAuth ? '← Back to Dashboard' : '← Go to Login'}
          </button>
        </div>
      </div>
    `;

    document.getElementById('home-btn').addEventListener('click', () => {
      router.navigate(isAuth ? '/dashboard' : '/login');
    });
  }

  getStyles() {
    return `
      .not-found-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #1e1e1e;
        color: #ccc;
      }
      .not-found-content {
        text-align: center;
      }
      .error-code {
        font-size: 120px;
        font-weight: 700;
        color: #007acc;
        line-height: 1;
        margin-bottom: 16px;
      }
      .not-found-content h1 {
        color: #fff;
        font-size: 32px;
        margin: 0 0 12px 0;
      }
      .not-found-content p {
        color: #858585;
        margin: 0 0 32px 0;
      }
      .primary-btn {
        background: #007acc;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
      }
      .primary-btn:hover {
        background: #0098ff;
      }
    `;
  }

  destroy() {}
}