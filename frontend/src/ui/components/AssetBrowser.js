// src/ui/components/AssetBrowser.js
import { EventBus } from '../../core/EventBus.js';
import { apiService } from '../../services/ApiService.js';
import { assetService } from '../../services/AssetService.js';

export class AssetBrowser extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.api = apiService;
    this.products = [];
    this.assets = [];
    this.searchTerm = '';
  }

  async connectedCallback() {
    this.render();
    await this.loadProducts();
    await this.loadAssets();
  }

  async loadProducts() {
    try {
      const result = await this.api.get('/api/products?limit=100');
      this.products =Array.isArray(result.products) ? result.products : [];
      //
      this.render();
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  }

  async loadAssets() {
    try {
      const result = await this.api.get('/api/assets?limit=100');
      this.assets = result.assets || [];
      console.log(this.assets)
      this.render();
    } catch (err) {
      console.error('Failed to load assets:', err);
    }
  }

 async render() {
    if(Array.isArray(this.products) && Array.isArray(this.assets)) {
    const filteredProducts = this.products.filter(p => 
      p.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );

    const filteredAssets = this.assets.filter(p => 
      p.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );

    this.shadowRoot.innerHTML = `
      <style>${this.getStyles()}</style>
      
      <div class="search-bar">
        <input id="search-bar-input" type="text" placeholder="Search products/assets..." value="${this.searchTerm}" />
      </div>
      
      <div class="asset-grid">
        ${(this.searchTerm !== '' ? filteredProducts : this.products ).map(product => `
          <div class="asset-item" draggable="true" data-product-id="${product.id}">
            <img class="asset-thumbnail" src="${product.images?.[0] || '/assets/placeholder.png'}" alt="${product.name}" />
            <div class="asset-name">${product.name}</div>
            <div class="asset-price">$${product.price}</div>
          </div>
        `).join('')}
        ${(this.searchTerm !== '' ? filteredAssets : this.assets) .map(asset => `
          <div class="asset-item" draggable="true" data-product-id="${asset.id}">
            <img class="asset-thumbnail" src="${asset.images?.[0] || '/assets/placeholder.png'}" alt="${asset.name}" />
            <div class="asset-name">${asset.name}</div>
            <div class="asset-price">$${asset.price}</div>
          </div>
        `).join('')}
      </div>
    `;
        }
    this.attachEventListeners();
  }

  attachEventListeners() {
    // Search
    const searchInput = this.shadowRoot.getElementById('search-bar-input');
    searchInput.addEventListener('input', (e) => {
      this.searchTerm = e.target.value;
      this.render();
    });

    // Drag and drop
    this.shadowRoot.querySelectorAll('.asset-item').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        const productId = item.dataset.productId;
        const product = this.products.find(p => p.id === productId);
        
        e.dataTransfer.setData('application/json', JSON.stringify({
          type: 'product',
          productId: product.id,
          name: product.name,
          modelUrl: product.modelUrl,
          thumbnailUrl: product.images?.[0]
        }));
        
        item.classList.add('dragging');
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
      });
    });
  }

  getStyles() {
    return `
      :host {
        display: block;
        background: #252526;
        color: #ccc;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      .search-bar {
        padding: 12px;
        border-bottom: 1px solid #3e3e42;
      }
      .search-bar input {
        width: 100%;
        background: #2d2d30;
        border: 1px solid #3e3e42;
        color: #ccc;
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 12px;
      }
      .search-bar input:focus {
        outline: none;
        border-color: #007acc;
      }
      .asset-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 8px;
        padding: 12px;
        overflow-y: auto;
        flex: 1;
      }
      .asset-item {
        aspect-ratio: 1;
        background: #2d2d30;
        border: 1px solid #3e3e42;
        border-radius: 4px;
        cursor: grab;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 8px;
        transition: all 0.15s;
      }
      .asset-item:hover {
        border-color: #007acc;
        background: #2a2d2e;
      }
      .asset-item.dragging {
        opacity: 0.5;
      }
      .asset-thumbnail {
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 3px;
        margin-bottom: 4px;
      }
      .asset-name {
        font-size: 11px;
        text-align: center;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 100%;
        margin-bottom: 2px;
      }
      .asset-price {
        font-size: 10px;
        color: #858585;
      }
    `;
  }
}

customElements.define('studio-asset-browser', AssetBrowser);