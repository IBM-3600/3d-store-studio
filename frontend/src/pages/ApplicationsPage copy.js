// frontend/src/pages/ApplicationsPage.js
import { authService } from '../services/AuthService.js';
import { router } from '../core/Router.js';

export class ApplicationsPage {
  constructor(container) {
    this.container = container;
    this.apps = [];
    this.loading = true;
  }

  async render() {
    this.container.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="apps-page">
        <header class="page-header">
          <button class="back-btn" id="back-btn">← Back</button>
          <h1>Applications</h1>
          <div class="header-actions">
            <button class="primary-btn" id="register-app-btn">+ Register 3D Store</button>
          </div>
        </header>

        <div class="apps-description">
          <p>Register your online 3D stores as applications to enable publishing, 
          real-time updates, and integration with the Studio.</p>
        </div>

        <div class="apps-grid" id="apps-grid">
          ${this.loading ? this.renderLoading() : this.renderApps()}
        </div>
      </div>
    `;

    this.attachEventListeners();
    
    if (this.loading) {
      await this.loadApps();
    }
  }

  async loadApps() {
    try {
      const response = await fetch('/api/applications', {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });

      if (!response.ok) throw new Error('Failed to load applications');

      const data = await response.json();
      this.apps = data.applications || [];
      this.loading = false;
      
      document.getElementById('apps-grid').innerHTML = this.renderApps();
      this.attachCardListeners();
    } catch (error) {
      console.error('[Apps] Load error:', error);
      this.loading = false;
      document.getElementById('apps-grid').innerHTML = `
        <div class="error-state">
          <p>Failed to load applications</p>
        </div>
      `;
    }
  }

  renderLoading() {
    return `
      <div class="loading-state">
        <div class="spinner-large"></div>
        <p>Loading applications...</p>
      </div>
    `;
  }

  renderApps() {
    if (this.apps.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">🏪</div>
          <h3>No applications registered</h3>
          <p>Register your first 3D store to start publishing</p>
          <button class="primary-btn" id="empty-register-btn">+ Register 3D Store</button>
        </div>
      `;
    }

    return this.apps.map(app => `
      <div class="app-card" data-app-id="${app.id}">
        <div class="app-header">
          <div class="app-logo">
            ${app.logoUrl 
              ? `<img src="${app.logoUrl}" alt="${app.name}" />`
              : `<span class="app-icon">🏬</span>`
            }
          </div>
          <div class="app-status ${app.status.toLowerCase()}">${app.status}</div>
        </div>
        
        <div class="app-info">
          <h3 class="app-name">${this.escapeHtml(app.name)}</h3>
          <div class="app-slug">${app.slug}</div>
          ${app.website ? `<div class="app-website">${app.website}</div>` : ''}
          ${app.description ? `<p class="app-description">${this.escapeHtml(app.description)}</p>` : ''}
        </div>

        <div class="app-stats">
          <div class="stat">
            <span class="stat-value">${app.apiKeys?.length || 0}</span>
            <span class="stat-label">API Keys</span>
          </div>
          <div class="stat">
            <span class="stat-value">${app.environments?.length || 0}</span>
            <span class="stat-label">Environments</span>
          </div>
          <div class="stat">
            <span class="stat-value">${app._count?.publishedVersions || 0}</span>
            <span class="stat-label">Publishes</span>
          </div>
        </div>

        <div class="app-actions">
          <button class="action-btn primary" data-action="configure" data-id="${app.id}">⚙️ Configure</button>
          <button class="action-btn" data-action="integration" data-id="${app.id}">🔌 Integration</button>
        </div>
      </div>
    `).join('');
  }

  attachEventListeners() {
    document.getElementById('back-btn')?.addEventListener('click', () => {
      router.navigate('/dashboard');
    });

    document.getElementById('register-app-btn')?.addEventListener('click', () => {
      this.showRegisterModal();
    });

    document.getElementById('empty-register-btn')?.addEventListener('click', () => {
      this.showRegisterModal();
    });
  }

  attachCardListeners() {
    document.querySelectorAll('[data-action="configure"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        router.navigate(`/applications/${btn.dataset.id}`);
      });
    });

    document.querySelectorAll('[data-action="integration"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        router.navigate(`/applications/${btn.dataset.id}/integration`);
      });
    });

    document.querySelectorAll('.app-card').forEach(card => {
      card.addEventListener('click', () => {
        router.navigate(`/applications/${card.dataset.appId}`);
      });
    });
  }

  showRegisterModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>Register 3D Store</h2>
          <button class="close-btn">&times;</button>
        </div>
        <form id="register-form">
          <div class="form-group">
            <label for="app-name">Store Name *</label>
            <input type="text" id="app-name" required placeholder="My Virtual Mall" />
          </div>
          <div class="form-group">
            <label for="app-secret">Secret</label>
            <input type="text" id="app-secret" placeholder="Your secret key" />
          </div>
          <div class="form-group">
            <label for="app-website">Website URL</label>
            <input type="url" id="app-website" placeholder="https://mystore.com" />
          </div>
          <div class="form-group">
            <label for="app-description">Description</label>
            <textarea id="app-description" rows="3" placeholder="Describe your 3D store..."></textarea>
          </div>
          <div class="form-group">
            <label for="app-origins">Allowed Origins (comma-separated)</label>
            <input type="text" id="app-origins" placeholder="https://mystore.com, http://localhost:3000" />
          </div>
          <div class="modal-footer">
            <button type="button" class="secondary-btn cancel-btn">Cancel</button>
            <button type="submit" class="primary-btn">Register & Generate API Key</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.close-btn').addEventListener('click', () => modal.remove());
    modal.querySelector('.cancel-btn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    modal.querySelector('#register-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('app-name').value.trim();
      const website = document.getElementById('app-website').value.trim();
      const description = document.getElementById('app-description').value.trim();
      const originsStr = document.getElementById('app-origins').value.trim();
      const allowedOrigins = originsStr ? originsStr.split(',').map(o => o.trim()) : [];
      const secret = document.getElementById('app-secret').value.trim();

      if (!name) {
        alert('Store name is required');
        return;
      }
      if (!secret) {
        alert('Secret is required');
        return;
      }
      try {
        const response = await fetch('/api/applications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authService.getToken()}`
          },
          body: JSON.stringify({ name, website, description, allowedOrigins })
        });

        const result = await response.json();
        
        if (result.success) {
          modal.remove();
          
          // Show API key (only shown once!)
          this.showApiKeyModal(result.apiKey, result.application);
        } else {
          alert(result.error || 'Failed to register application');
        }
      } catch (error) {
        alert('Failed to register: ' + error.message);
      }
    });
  }

  showApiKeyModal(apiKey, app) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>🎉 Application Registered!</h2>
          <button class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="success-message">
            <p><strong>${this.escapeHtml(app.name)}</strong> has been registered successfully.</p>
          </div>
          
          <div class="api-key-section">
            <label>Your API Key (save this now, it won't be shown again):</label>
            <div class="api-key-display">
              <code id="api-key-value">${apiKey}</code>
              <button class="copy-btn" id="copy-key-btn">📋 Copy</button>
            </div>
          </div>

          <div class="warning-box">
            ⚠️ Store this API key securely. You cannot view it again after closing this dialog.
          </div>
        </div>
        <div class="modal-footer">
          <button class="primary-btn" id="done-btn">Done - Go to Configuration</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#copy-key-btn').addEventListener('click', () => {
      navigator.clipboard.writeText(apiKey);
      modal.querySelector('#copy-key-btn').textContent = '✓ Copied!';
    });

    modal.querySelector('.close-btn').addEventListener('click', () => {
      modal.remove();
      this.loadApps();
    });

    modal.querySelector('#done-btn').addEventListener('click', () => {
      modal.remove();
      router.navigate(`/applications/${app.id}`);
    });
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  getStyles() {
    return `
      .apps-page {
        min-height: 100vh;
        background: #1e1e1e;
        color: #ccc;
        padding: 24px;
        overflow-y: auto;
      }
      .page-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
        max-width: 1400px;
        margin-left: auto;
        margin-right: auto;
      }
      .back-btn {
        background: #2d2d30;
        border: 1px solid #3e3e42;
        color: #ccc;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
      }
      .back-btn:hover { background: #2a2d2e; }
      .page-header h1 { color: #fff; margin: 0; flex: 1; }
      .primary-btn {
        background: #007acc;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
      }
      .primary-btn:hover { background: #0098ff; }
      .secondary-btn {
        background: #2d2d30;
        color: #ccc;
        border: 1px solid #3e3e42;
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
      }
      .apps-description {
        max-width: 1400px;
        margin: 0 auto 24px;
        color: #858585;
        font-size: 14px;
      }
      .apps-grid {
        max-width: 1400px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 20px;
      }
      .app-card {
        background: #252526;
        border: 1px solid #3e3e42;
        border-radius: 8px;
        padding: 20px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .app-card:hover {
        border-color: #007acc;
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      }
      .app-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }
      .app-logo {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        background: #1e1e1e;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .app-logo img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .app-icon { font-size: 24px; }
      .app-status {
        padding: 3px 10px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }
      .app-status.active {
        background: rgba(74, 222, 128, 0.2);
        color: #4ade80;
      }
      .app-status.inactive {
        background: rgba(255, 255, 255, 0.1);
        color: #858585;
      }
      .app-info { margin-bottom: 16px; }
      .app-name {
        color: #fff;
        font-size: 16px;
        margin: 0 0 4px 0;
      }
      .app-slug {
        color: #858585;
        font-size: 12px;
        font-family: monospace;
        margin-bottom: 4px;
      }
      .app-website {
        color: #007acc;
        font-size: 12px;
        margin-bottom: 8px;
      }
      .app-description {
        color: #858585;
        font-size: 13px;
        margin: 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .app-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-bottom: 16px;
        padding: 12px;
        background: #1e1e1e;
        border-radius: 6px;
      }
      .stat { text-align: center; }
      .stat-value {
        display: block;
        font-size: 18px;
        font-weight: 600;
        color: #fff;
      }
      .stat-label {
        font-size: 11px;
        color: #858585;
      }
      .app-actions {
        display: flex;
        gap: 8px;
      }
      .action-btn {
        flex: 1;
        background: #2d2d30;
        border: 1px solid #3e3e42;
        color: #ccc;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
      }
      .action-btn:hover {
        background: #2a2d2e;
      }
      .action-btn.primary {
        background: #007acc;
        border-color: #007acc;
        color: white;
      }
      .action-btn.primary:hover {
        background: #0098ff;
      }
      .loading-state, .empty-state, .error-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px 20px;
      }
      .spinner-large {
        width: 40px;
        height: 40px;
        border: 3px solid #3e3e42;
        border-top-color: #007acc;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto 16px;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      .empty-icon { font-size: 64px; margin-bottom: 16px; }
      .empty-state h3 { color: #fff; margin: 0 0 8px 0; }
      .empty-state p { color: #858585; margin: 0 0 24px 0; }
      .modal-overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .modal {
        background: #252526;
        border: 1px solid #3e3e42;
        border-radius: 8px;
        padding: 24px;
        width: 100%;
        max-width: 550px;
        max-height: 90vh;
        overflow-y: auto;
      }
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
      .modal-header h2 { margin: 0; color: #fff; font-size: 18px; }
      .close-btn {
        background: transparent;
        border: none;
        color: #858585;
        font-size: 24px;
        cursor: pointer;
      }
      .close-btn:hover { color: #fff; }
      .form-group {
        margin-bottom: 16px;
      }
      .form-group label {
        display: block;
        color: #ccc;
        font-size: 13px;
        margin-bottom: 6px;
      }
      .form-group input, .form-group textarea {
        width: 100%;
        background: #1e1e1e;
        border: 1px solid #3e3e42;
        color: #fff;
        padding: 10px 12px;
        border-radius: 6px;
        font-size: 14px;
        font-family: inherit;
      }
      .form-group input:focus, .form-group textarea:focus {
        outline: none;
        border-color: #007acc;
      }
      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 20px;
      }
      .success-message {
        background: rgba(74, 222, 128, 0.1);
        border: 1px solid rgba(74, 222, 128, 0.3);
        padding: 12px;
        border-radius: 6px;
        margin-bottom: 16px;
      }
      .success-message p { margin: 0; color: #4ade80; }
      .api-key-section { margin-bottom: 16px; }
      .api-key-section label {
        display: block;
        color: #ccc;
        font-size: 13px;
        margin-bottom: 8px;
      }
      .api-key-display {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .api-key-display code {
        flex: 1;
        background: #1e1e1e;
        padding: 10px 12px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 12px;
        color: #4ade80;
        word-break: break-all;
      }
      .copy-btn {
        background: #2d2d30;
        border: 1px solid #3e3e42;
        color: #ccc;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        white-space: nowrap;
      }
      .copy-btn:hover { background: #2a2d2e; }
      .warning-box {
        background: rgba(251, 191, 36, 0.1);
        border: 1px solid rgba(251, 191, 36, 0.3);
        color: #fbbf24;
        padding: 12px;
        border-radius: 6px;
        font-size: 13px;
      }
    `;
  }

  destroy() {}
}