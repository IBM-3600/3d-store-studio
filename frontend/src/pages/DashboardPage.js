// frontend/src/pages/DashboardPage.js
import { authService } from '../services/AuthService.js';
import { router } from '../core/Router.js';

export class DashboardPage {
  constructor(container) {
    this.container = container;
    this.worlds = [];
    this.loading = true;
  }

  async render() {
    this.container.innerHTML = `
      <style>${this.getStyles()}</style>
      ${this.renderShell()}
    `;

    await this.loadData();
    this.attachCardListeners();
  }

  renderShell() {
    const user = authService.getUser();
    
    return `
      <div class="dashboard">
        <header class="dashboard-header">
          <div class="header-left">
            <span class="logo-icon">🏪</span>
            <h1>3D Store Studio</h1>
          </div>
          <div class="header-right">
              <button class="icon-btn" id="store-apps-btn" title="Applications">🎨</button>
              <button class="icon-btn" id="assets-btn" title="Asset Library">📦</button>
              <button class="icon-btn" id="upload-btn" title="Upload Asset">📤</button>
              <button class="icon-btn" id="settings-btn" title="Settings">⚙️</button>
            <button class="icon-btn" id="logout-btn" title="Logout">🚪</button>
            
            <div class="user-info">
              <span class="user-avatar">${user.email[0].toUpperCase()}</span>
              <div class="user-details">
                <div class="user-name">${user.email}</div>
                <div class="user-role">${user.role}</div>
              </div>
            </div>
            
          </div>
        </header>

        <div class="dashboard-content">
          <div class="content-header">
            <h2>Your Worlds</h2>
            <button class="primary-btn" id="create-world-btn">+ New World</button>
          </div>

          <div class="worlds-grid" id="worlds-grid">
            ${this.loading ? this.renderLoading() : this.renderWorlds()}
          </div>
        </div>
      </div>
    `;
  }

  renderLoading() {
    return `
      <div class="loading-state">
        <div class="spinner-large"></div>
        <p>Loading worlds...</p>
      </div>
    `;
  }

  renderWorlds() {
    if (this.worlds.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">🏗️</div>
          <h3>No worlds yet</h3>
          <p>Create your first virtual store to get started</p>
          <button class="primary-btn" id="empty-create-btn">+ Create World</button>
        </div>
      `;
    }

    return this.worlds.map(world => `
      <div class="world-card" data-world-id="${world.id}">
        <div class="world-thumbnail">
          ${world.thumbnailUrl 
            ? `<img src="${world.thumbnailUrl}" alt="${world.name}" />`
            : `<div class="world-placeholder">🏬</div>`
          }
        </div>
        <div class="world-info">
          <h3 class="world-name">${world.name}</h3>
          <p class="world-description">${world.description || 'No description'}</p>
          <div class="world-meta">
            <span class="status-badge ${world.status.toLowerCase()}">${world.status}</span>
            <span class="version">v${world.version || 1}</span>
            <span class="date">${this.formatDate(world.updatedAt)}</span>
          </div>
        </div>
        <div class="world-actions">
          <button class="action-btn edit-btn" data-world-id="${world.id}" title="Edit">✏️</button>
          <button class="action-btn menu-btn" data-world-id="${world.id}" title="More">⋯</button>
        </div>
      </div>
    `).join('');
  }

  async loadData() {
    try {
      const token = authService.getToken();
      const response = await fetch('/api/worlds', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load worlds');

      const data = await response.json();
      this.worlds = data.worlds || [];
      this.loading = false;
      
      document.getElementById('worlds-grid').innerHTML = this.renderWorlds();
      
    } catch (error) {
      console.error('[Dashboard] Load error:', error);
      this.loading = false;
      document.getElementById('worlds-grid').innerHTML = `
        <div class="error-state">
          <p>Failed to load worlds</p>
          <button class="primary-btn" id="retry-btn">Retry</button>
        </div>
      `;
      document.getElementById('retry-btn').addEventListener('click', () => this.loadData());
    }
  }
  
  attachCardListeners() {
    // Header buttons

    document.getElementById('store-apps-btn')?.addEventListener('click', () => {
      router.navigate('/applications');
    });
    document.getElementById('assets-btn').addEventListener('click', () => {
      router.navigate('/assets');
    });
  
    document.getElementById('upload-btn').addEventListener('click', () => {
      router.navigate('/upload');
    });
    
    document.getElementById('logout-btn').addEventListener('click', () => {
      authService.logout();
    });

    document.getElementById('settings-btn').addEventListener('click', () => {
      router.navigate('/settings',true);
    });

    document.getElementById('create-world-btn').addEventListener('click', () => {
      this.showCreateWorldModal();
    });

    document.getElementById('empty-create-btn')?.addEventListener('click', () => {
      this.showCreateWorldModal();
    });


    // World cards
    document.querySelectorAll('.world-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.action-btn')) return;
        const worldId = card.dataset.worldId;
        router.navigate(`/editor/${worldId}`);
      });
    });

    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const worldId = btn.dataset.worldId;
        router.navigate(`/editor/${worldId}`);
      });
    });
  }

  showCreateWorldModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>Create New World</h2>
          <button class="close-btn">&times;</button>
        </div>
        <form id="create-world-form">
          <div class="form-group">
            <label for="world-name">Name</label>
            <input type="text" id="world-name" required placeholder="My Virtual Store" />
          </div>
          <div class="form-group">
            <label for="world-description">Description</label>
            <textarea id="world-description" rows="3" placeholder="A brief description..."></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="secondary-btn cancel-btn">Cancel</button>
            <button type="submit" class="primary-btn">Create</button>
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

    modal.querySelector('#create-world-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('world-name').value.trim();
      const description = document.getElementById('world-description').value.trim();

      try {
        const response = await fetch('/api/worlds', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authService.getToken()}`
          },
          body: JSON.stringify({ name, description })
        });

        if (!response.ok) throw new Error('Failed to create world');

        const data = await response.json();
        modal.remove();
        router.navigate(`/editor/${data.world.id}`);
      } catch (error) {
        console.log('Failed to create world: ' + error.message);
      }
    });
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  }

  getStyles() {
    return `
      .dashboard {
        min-height: 100vh;
        background: #1e1e1e;
        color: #ccc;
      }
      .dashboard-header {
        background: #252526;
        border-bottom: 1px solid #3e3e42;
        padding: 12px 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .logo-icon {
        font-size: 28px;
      }
      .header-left h1 {
        font-size: 18px;
        color: #fff;
        margin: 0;
        font-weight: 600;
      }
      .header-right {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .user-info {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .user-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #007acc;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 14px;
      }
      .user-details {
        display: flex;
        flex-direction: column;
      }
      .user-name {
        font-size: 13px;
        color: #fff;
      }
      .user-role {
        font-size: 11px;
        color: #858585;
        text-transform: uppercase;
      }
      .icon-btn {
        background: transparent;
        border: 1px solid #3e3e42;
        color: #ccc;
        width: 36px;
        height: 36px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.15s;
      }
      .icon-btn:hover {
        background: #2d2d30;
        border-color: #007acc;
      }
      .dashboard-content {
        max-width: 1400px;
        margin: 0 auto;
        padding: 32px 24px;
      }
      .content-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }
      .content-header h2 {
        color: #fff;
        font-size: 24px;
        margin: 0;
      }
      .primary-btn {
        background: #007acc;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.15s;
      }
      .primary-btn:hover {
        background: #0098ff;
      }
      .secondary-btn {
        background: #2d2d30;
        color: #ccc;
        border: 1px solid #3e3e42;
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
      }
      .secondary-btn:hover {
        background: #2a2d2e;
      }
      .worlds-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 20px;
      }
      .world-card {
        background: #252526;
        border: 1px solid #3e3e42;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.2s;
      }
      .world-card:hover {
        border-color: #007acc;
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      }
      .world-thumbnail {
        height: 160px;
        background: #1e1e1e;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .world-thumbnail img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .world-placeholder {
        font-size: 64px;
        opacity: 0.3;
      }
      .world-info {
        padding: 16px;
      }
      .world-name {
        font-size: 16px;
        color: #fff;
        margin: 0 0 6px 0;
      }
      .world-description {
        font-size: 13px;
        color: #858585;
        margin: 0 0 12px 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .world-meta {
        display: flex;
        gap: 8px;
        align-items: center;
        font-size: 12px;
      }
      .status-badge {
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }
      .status-badge.draft {
        background: rgba(251, 191, 36, 0.2);
        color: #fbbf24;
      }
      .status-badge.published {
        background: rgba(74, 222, 128, 0.2);
        color: #4ade80;
      }
      .version {
        color: #858585;
      }
      .date {
        color: #858585;
        margin-left: auto;
      }
      .world-actions {
        display: flex;
        gap: 4px;
        padding: 0 16px 16px;
      }
      .action-btn {
        background: #2d2d30;
        border: 1px solid #3e3e42;
        color: #ccc;
        width: 32px;
        height: 32px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.15s;
      }
      .action-btn:hover {
        background: #007acc;
        border-color: #007acc;
        color: white;
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
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      .empty-icon {
        font-size: 64px;
        margin-bottom: 16px;
      }
      .empty-state h3 {
        color: #fff;
        margin: 0 0 8px 0;
      }
      .empty-state p {
        color: #858585;
        margin: 0 0 24px 0;
      }
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
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
        max-width: 480px;
      }
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
      .modal-header h2 {
        margin: 0;
        color: #fff;
        font-size: 18px;
      }
      .close-btn {
        background: transparent;
        border: none;
        color: #858585;
        font-size: 24px;
        cursor: pointer;
      }
      .close-btn:hover {
        color: #fff;
      }
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
        resize: vertical;
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
    `;
  }

  destroy() {}
}