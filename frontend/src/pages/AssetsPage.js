// frontend/src/pages/AssetsPage.js
import { authService } from '../services/AuthService.js';
import { assetService } from '../services/AssetService.js';
import { router } from '../core/Router.js';

export class AssetsPage {
  constructor(container) {
    this.container = container;
    this.assets = [];
    this.loading = true;
    this.filters = {
      type: '',
      category: '',
      search: ''
    };
    this.stats = null;
  }

  async render() {
    this.container.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="assets-page">
        <header class="page-header">
          <button class="back-btn" id="back-btn">← Back</button>
          <h1>Asset Library</h1>
          <div class="header-actions">
            <button class="primary-btn" id="upload-btn">+ Upload Asset</button>
          </div>
        </header>

        ${this.stats ? `
          <div class="stats-bar">
            <div class="stat-item">
              <span class="stat-value">${this.stats.total}</span>
              <span class="stat-label">Total Assets</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${this.stats.byType?.MODEL || 0}</span>
              <span class="stat-label">3D Models</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${this.stats.byType?.TEXTURE || 0}</span>
              <span class="stat-label">Textures</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${this.formatSize(this.stats.totalSize)}</span>
              <span class="stat-label">Total Size</span>
            </div>
          </div>
        ` : ''}

        <div class="filters-bar">
          <input type="text" id="search-input" class="search-input" 
            placeholder="Search assets..." value="${this.filters.search}" />
          <select id="type-filter" class="filter-select">
            <option value="">All Types</option>
            <option value="MODEL" ${this.filters.type === 'MODEL' ? 'selected' : ''}>3D Models</option>
            <option value="TEXTURE" ${this.filters.type === 'TEXTURE' ? 'selected' : ''}>Textures</option>
            <option value="AUDIO" ${this.filters.type === 'AUDIO' ? 'selected' : ''}>Audio</option>
            <option value="VIDEO" ${this.filters.type === 'VIDEO' ? 'selected' : ''}>Video</option>
          </select>
          <select id="category-filter" class="filter-select">
            <option value="">All Categories</option>
            <option value="furniture" ${this.filters.category === 'furniture' ? 'selected' : ''}>Furniture</option>
            <option value="electronics" ${this.filters.category === 'electronics' ? 'selected' : ''}>Electronics</option>
            <option value="decoration" ${this.filters.category === 'decoration' ? 'selected' : ''}>Decoration</option>
            <option value="clothing" ${this.filters.category === 'clothing' ? 'selected' : ''}>Clothing</option>
            <option value="architecture" ${this.filters.category === 'architecture' ? 'selected' : ''}>Architecture</option>
          </select>
        </div>

        <div class="assets-grid" id="assets-grid">
          ${this.loading ? this.renderLoading() : this.renderAssets()}
        </div>
      </div>
    `;

    this.attachEventListeners();
    
    if (this.loading) {
      await this.loadData();
    }
  }

  async loadData() {
    try {
      const [assetsData, stats] = await Promise.all([
        assetService.list(this.filters),
        assetService.getStats()
      ]);
      this.assets = assetsData.assets || [];
      this.stats = stats;
      this.loading = false;
      
      document.getElementById('assets-grid').innerHTML = this.renderAssets();
      this.attachCardListeners();
      this.updateStats();
    } catch (error) {
      console.error('[Assets] Load error:', error);
      this.loading = false;
      document.getElementById('assets-grid').innerHTML = `
        <div class="error-state">
          <p>Failed to load assets</p>
          <button class="primary-btn" id="retry-btn">Retry</button>
        </div>
      `;
      document.getElementById('retry-btn').addEventListener('click', () => this.loadData());
    }
  }

  updateStats() {
    if (!this.stats) return;
    const statItems = document.querySelectorAll('.stat-item .stat-value');
    if (statItems.length >= 4) {
      statItems[0].textContent = this.stats.total;
      statItems[1].textContent = this.stats.byType?.MODEL || 0;
      statItems[2].textContent = this.stats.byType?.TEXTURE || 0;
      statItems[3].textContent = this.formatSize(this.stats.totalSize);
    }
  }

  renderLoading() {
    return `
      <div class="loading-state">
        <div class="spinner-large"></div>
        <p>Loading assets...</p>
      </div>
    `;
  }

  renderAssets() {
    if (this.assets.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">📦</div>
          <h3>No assets found</h3>
          <p>Upload your first 3D asset to get started</p>
          <button class="primary-btn" id="empty-upload-btn">+ Upload Asset</button>
        </div>
      `;
    }

    return this.assets.map(asset => `
      <div class="asset-card" data-asset-id="${asset.id}">
        <div class="asset-thumbnail">
          ${asset.thumbnailUrl 
            ? `<img src="${asset.thumbnailUrl}" alt="${asset.name}" />`
            : `<div class="asset-placeholder">${this.getTypeIcon(asset.type)}</div>`
          }
          <div class="asset-type-badge">${asset.type}</div>
        </div>
        <div class="asset-info">
          <h3 class="asset-name">${this.escapeHtml(asset.name)}</h3>
          ${asset.category ? `<div class="asset-category">${asset.category}</div>` : ''}
          <div class="asset-meta">
            <span class="asset-size">${this.formatSize(asset.size)}</span>
            ${asset.format ? `<span class="asset-format">.${asset.format}</span>` : ''}
          </div>
          ${asset.tags && asset.tags.length > 0 ? `
            <div class="asset-tags">
              ${asset.tags.slice(0, 3).map(tag => `<span class="mini-tag">${this.escapeHtml(tag)}</span>`).join('')}
              ${asset.tags.length > 3 ? `<span class="mini-tag">+${asset.tags.length - 3}</span>` : ''}
            </div>
          ` : ''}
        </div>
        <div class="asset-actions">
          <button class="action-btn" data-action="edit" data-id="${asset.id}" title="Edit">✏️</button>
          <button class="action-btn" data-action="delete" data-id="${asset.id}" title="Delete">🗑️</button>
        </div>
      </div>
    `).join('');
  }

  getTypeIcon(type) {
    const icons = {
      MODEL: '📦',
      TEXTURE: '🖼️',
      AUDIO: '🎵',
      VIDEO: '🎬',
      HDRI: '🌅'
    };
    return icons[type] || '📄';
  }

  attachEventListeners() {
    document.getElementById('back-btn').addEventListener('click', () => {
      router.navigate('/dashboard');
    });

    document.getElementById('upload-btn').addEventListener('click', () => {
      router.navigate('/upload');
    });

    // Search with debounce
    let searchTimeout;
    document.getElementById('search-input').addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.filters.search = e.target.value;
        this.loading = true;
        this.loadData();
      }, 300);
    });

    document.getElementById('type-filter').addEventListener('change', (e) => {
      this.filters.type = e.target.value;
      this.loading = true;
      this.loadData();
    });

    document.getElementById('category-filter').addEventListener('change', (e) => {
      this.filters.category = e.target.value;
      this.loading = true;
      this.loadData();
    });
  }

  attachCardListeners() {
    document.getElementById('empty-upload-btn')?.addEventListener('click', () => {
      router.navigate('/upload');
    });

    document.querySelectorAll('.asset-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.action-btn')) return;
        const assetId = card.dataset.assetId;
        this.showAssetDetails(assetId);
      });
    });

    document.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        router.navigate(`/upload?edit=${btn.dataset.id}`);
      });
    });

    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this asset?')) {
          try {
            await assetService.delete(btn.dataset.id);
            this.loading = true;
            await this.loadData();
          } catch (error) {
            alert('Failed to delete: ' + error.message);
          }
        }
      });
    });
  }

  async showAssetDetails(assetId) {
    try {
      const asset = await assetService.get(assetId);
      
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal">
          <div class="modal-header">
            <h2>${this.escapeHtml(asset.name)}</h2>
            <button class="close-btn">&times;</button>
          </div>
          <div class="modal-body">
            ${asset.description ? `<p class="asset-description">${this.escapeHtml(asset.description)}</p>` : ''}
            
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Type</span>
                <span class="detail-value">${asset.type}</span>
              </div>
              ${asset.format ? `
                <div class="detail-item">
                  <span class="detail-label">Format</span>
                  <span class="detail-value">${asset.format.toUpperCase()}</span>
                </div>
              ` : ''}
              <div class="detail-item">
                <span class="detail-label">Size</span>
                <span class="detail-value">${this.formatSize(asset.size)}</span>
              </div>
              ${asset.category ? `
                <div class="detail-item">
                  <span class="detail-label">Category</span>
                  <span class="detail-value">${asset.category}</span>
                </div>
              ` : ''}
              ${asset.vendor ? `
                <div class="detail-item">
                  <span class="detail-label">Vendor</span>
                  <span class="detail-value">${this.escapeHtml(asset.vendor)}</span>
                </div>
              ` : ''}
              ${asset.dimensions ? `
                <div class="detail-item full-width">
                  <span class="detail-label">Dimensions</span>
                  <span class="detail-value">${asset.dimensions.width.toFixed(2)} × ${asset.dimensions.height.toFixed(2)} × ${asset.dimensions.depth.toFixed(2)} m</span>
                </div>
              ` : ''}
              ${asset.polygonCount ? `
                <div class="detail-item">
                  <span class="detail-label">Polygons</span>
                  <span class="detail-value">${asset.polygonCount.toLocaleString()}</span>
                </div>
              ` : ''}
              ${asset.price ? `
                <div class="detail-item">
                  <span class="detail-label">Price</span>
                  <span class="detail-value">$${asset.price.toFixed(2)}</span>
                </div>
              ` : ''}
              ${asset.sku ? `
                <div class="detail-item">
                  <span class="detail-label">SKU</span>
                  <span class="detail-value">${this.escapeHtml(asset.sku)}</span>
                </div>
              ` : ''}
            </div>

            ${asset.tags && asset.tags.length > 0 ? `
              <div class="detail-tags">
                <div class="detail-label">Tags</div>
                <div class="tags-list">
                  ${asset.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                </div>
              </div>
            ` : ''}

            <div class="detail-url">
              <div class="detail-label">URL</div>
              <code>${asset.url}</code>
            </div>
          </div>
          <div class="modal-footer">
            <button class="secondary-btn" id="modal-edit">Edit</button>
            <button class="primary-btn" id="modal-close">Close</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      modal.querySelector('.close-btn').addEventListener('click', () => modal.remove());
      modal.querySelector('#modal-close').addEventListener('click', () => modal.remove());
      modal.querySelector('#modal-edit').addEventListener('click', () => {
        modal.remove();
        router.navigate(`/upload?edit=${asset.id}`);
      });
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
      });
    } catch (error) {
      alert('Failed to load asset details: ' + error.message);
    }
  }

  formatSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  getStyles() {
    return `
      .assets-page {
        min-height: 100vh;
        background: #1e1e1e;
        color: #ccc;
        padding: 24px;
      }
      .page-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
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
      .back-btn:hover {
        background: #2a2d2e;
      }
      .page-header h1 {
        color: #fff;
        margin: 0;
        flex: 1;
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
      .stats-bar {
        max-width: 1400px;
        margin: 0 auto 24px;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
      }
      .stat-item {
        background: #252526;
        border: 1px solid #3e3e42;
        border-radius: 8px;
        padding: 16px;
        text-align: center;
      }
      .stat-value {
        display: block;
        font-size: 24px;
        font-weight: 600;
        color: #fff;
        margin-bottom: 4px;
      }
      .stat-label {
        font-size: 12px;
        color: #858585;
      }
      .filters-bar {
        max-width: 1400px;
        margin: 0 auto 24px;
        display: flex;
        gap: 12px;
      }
      .search-input {
        flex: 1;
        background: #252526;
        border: 1px solid #3e3e42;
        color: #fff;
        padding: 10px 14px;
        border-radius: 6px;
        font-size: 14px;
      }
      .search-input:focus {
        outline: none;
        border-color: #007acc;
      }
      .filter-select {
        background: #252526;
        border: 1px solid #3e3e42;
        color: #fff;
        padding: 10px 14px;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
      }
      .assets-grid {
        max-width: 1400px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 16px;
      }
      .asset-card {
        background: #252526;
        border: 1px solid #3e3e42;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.2s;
      }
      .asset-card:hover {
        border-color: #007acc;
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      }
      .asset-thumbnail {
        height: 160px;
        background: #1e1e1e;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
      }
      .asset-thumbnail img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .asset-placeholder {
        font-size: 64px;
        opacity: 0.3;
      }
      .asset-type-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        backdrop-filter: blur(4px);
      }
      .asset-info {
        padding: 12px;
      }
      .asset-name {
        font-size: 14px;
        color: #fff;
        margin: 0 0 4px 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .asset-category {
        font-size: 11px;
        color: #007acc;
        text-transform: uppercase;
        margin-bottom: 6px;
      }
      .asset-meta {
        display: flex;
        gap: 8px;
        font-size: 11px;
        color: #858585;
        margin-bottom: 6px;
      }
      .asset-tags {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
      }
      .mini-tag {
        background: #2d2d30;
        color: #ccc;
        padding: 1px 6px;
        border-radius: 3px;
        font-size: 10px;
      }
      .asset-actions {
        display: flex;
        gap: 4px;
        padding: 0 12px 12px;
      }
      .action-btn {
        background: #2d2d30;
        border: 1px solid #3e3e42;
        color: #ccc;
        width: 28px;
        height: 28px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
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
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
      }
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
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
      .modal-body {
        margin-bottom: 20px;
      }
      .asset-description {
        color: #ccc;
        font-size: 14px;
        margin: 0 0 16px 0;
        line-height: 1.5;
      }
      .detail-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 16px;
      }
      .detail-item {
        background: #1e1e1e;
        padding: 10px;
        border-radius: 6px;
      }
      .detail-item.full-width {
        grid-column: 1 / -1;
      }
      .detail-label {
        display: block;
        font-size: 11px;
        color: #858585;
        margin-bottom: 4px;
        text-transform: uppercase;
      }
      .detail-value {
        color: #fff;
        font-size: 14px;
        font-weight: 500;
      }
      .detail-tags {
        margin-bottom: 16px;
      }
      .detail-tags .tags-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 6px;
      }
      .tag {
        background: #007acc;
        color: white;
        padding: 3px 10px;
        border-radius: 4px;
        font-size: 12px;
      }
      .detail-url {
        background: #1e1e1e;
        padding: 10px;
        border-radius: 6px;
      }
      .detail-url code {
        color: #4ade80;
        font-size: 12px;
        word-break: break-all;
      }
      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
    `;
  }

  destroy() {}
}