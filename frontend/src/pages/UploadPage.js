// frontend/src/pages/UploadPage.js
import { authService } from '../services/AuthService.js';
import { assetService } from '../services/AssetService.js';
import { router } from '../core/Router.js';
import '../ui/components/ModelPreview.js';

export class UploadPage {
  constructor(container) {
    this.container = container;
    this.selectedFile = null;
    this.previewUrl = null;
    this.uploading = false;
    this.uploadProgress = 0;
    this.modelStats = null;
    this.formData = {
      name: '',
      description: '',
      category: '',
      tags: [],
      vendor: '',
      brand: '',
      dimensions: null,
      polygonCount: null,
      materialCount: null,
      shopifyId: '',
      price: '',
      sku: '',
      externalUrl: '' 
    };
    this.tagInput = '';
  }

  render() {
    this.container.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="upload-page">
        <header class="page-header">
          <button class="back-btn" id="back-btn">← Back</button>
          <h1>Upload 3D Asset</h1>
        </header>

        <div class="upload-content">
          <!-- Left: Preview -->
          <div class="preview-section">
            <div class="preview-header">
              <h3>3D Preview</h3>
              ${this.selectedFile ? `<button class="text-btn" id="clear-preview">Clear</button>` : ''}
            </div>
            <div class="preview-container">
              <model-preview id="model-preview"></model-preview>
            </div>
            ${this.modelStats ? `
              <div class="model-stats">
                <div class="stat">
                  <span class="stat-label">Triangles</span>
                  <span class="stat-value">${this.modelStats.triangles.toLocaleString()}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Materials</span>
                  <span class="stat-value">${this.modelStats.materials}</span>
                </div>
                <div class="stat">
                  <span class="stat-label">Size</span>
                  <span class="stat-value">${this.modelStats.dimensions.width.toFixed(2)} × ${this.modelStats.dimensions.height.toFixed(2)} × ${this.modelStats.dimensions.depth.toFixed(2)} m</span>
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Right: Form -->
          <div class="form-section">
            <!-- File Upload Area -->
            <div class="upload-area" id="upload-area">
              <input type="file" id="file-input" accept=".glb,.gltf,.fbx,.obj,.jpg,.jpeg,.png,.webp,.hdr,.mp3,.wav,.mp4" style="display: none;" />
              ${this.selectedFile ? `
                <div class="file-selected">
                  <div class="file-icon">${this.getFileIcon(this.selectedFile.name)}</div>
                  <div class="file-info">
                    <div class="file-name">${this.selectedFile.name}</div>
                    <div class="file-size">${this.formatSize(this.selectedFile.size)}</div>
                  </div>
                  <button class="icon-btn" id="change-file" title="Change file">🔄</button>
                </div>
              ` : `
                <div class="upload-placeholder">
                  <div class="upload-icon">📤</div>
                  <div class="upload-text">Drag & drop your 3D file here</div>
                  <div class="upload-hint">or click to browse</div>
                  <div class="upload-formats">Supported: GLB, GLTF, FBX, OBJ, HDR, images, audio, video</div>
                </div>
              `}
            </div>

            ${this.uploading ? `
              <div class="upload-progress">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${this.uploadProgress}%"></div>
                </div>
                <div class="progress-text">Uploading... ${Math.round(this.uploadProgress)}%</div>
              </div>
            ` : ''}

              <!-- ─── OR: External URL ─── -->
              <div class="url-divider">
                <span>OR paste an external URL</span>
              </div>

              <div class="url-option">
                <label for="asset-url">Asset URL (optional)</label>
                <div class="url-input-row">
                  <input 
                    type="url" 
                    id="asset-url" 
                    name="asset-url"
                    placeholder="https://example.com/assets/model.glb"
                    value="${this.escapeHtml(this.formData.externalUrl || '')}"
                  />
                  <button type="button" class="secondary-btn" id="fetch-url-btn">🔗 Fetch</button>
                </div>
                <small class="form-hint">
                  Use this when your asset is already hosted elsewhere (CDN, another server).
                  Supported: .glb, .gltf, .jpg, .png, .webp, .mp3, .wav, .mp4, .hdr
                </small>
                
                <div id="url-status" class="url-status hidden"></div>
              </div>

            <!-- Metadata Form -->
            <form id="asset-form" class="asset-form">
              <div class="form-section-title">Basic Information</div>
              
              <div class="form-group">
                <label for="name">Name *</label>
                <input type="text" id="name" name="name" required 
                  value="${this.escapeHtml(this.formData.name)}"
                  placeholder="e.g., Modern Sofa" />
              </div>

              <div class="form-group">
                <label for="description">Description</label>
                <textarea id="description" name="description" rows="3"
                  placeholder="Describe this asset...">${this.escapeHtml(this.formData.description)}</textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="category">Category</label>
                  <select id="category" name="category">
                    <option value="">Select category</option>
                    <option value="furniture" ${this.formData.category === 'furniture' ? 'selected' : ''}>Furniture</option>
                    <option value="electronics" ${this.formData.category === 'electronics' ? 'selected' : ''}>Electronics</option>
                    <option value="decoration" ${this.formData.category === 'decoration' ? 'selected' : ''}>Decoration</option>
                    <option value="clothing" ${this.formData.category === 'clothing' ? 'selected' : ''}>Clothing</option>
                    <option value="accessories" ${this.formData.category === 'accessories' ? 'selected' : ''}>Accessories</option>
                    <option value="food" ${this.formData.category === 'food' ? 'selected' : ''}>Food & Beverage</option>
                    <option value="architecture" ${this.formData.category === 'architecture' ? 'selected' : ''}>Architecture</option>
                    <option value="nature" ${this.formData.category === 'nature' ? 'selected' : ''}>Nature</option>
                    <option value="vehicle" ${this.formData.category === 'vehicle' ? 'selected' : ''}>Vehicle</option>
                    <option value="other" ${this.formData.category === 'other' ? 'selected' : ''}>Other</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="vendor">Vendor</label>
                  <input type="text" id="vendor" name="vendor"
                    value="${this.escapeHtml(this.formData.vendor)}"
                    placeholder="e.g., IKEA" />
                </div>
              </div>

              <div class="form-group">
                <label>Tags</label>
                <div class="tags-input">
                  <div class="tags-list">
                    ${this.formData.tags.map((tag, i) => `
                      <span class="tag">
                        ${this.escapeHtml(tag)}
                        <button type="button" class="tag-remove" data-index="${i}">×</button>
                      </span>
                    `).join('')}
                  </div>
                  <input type="text" id="tag-input" 
                    placeholder="${this.formData.tags.length === 0 ? 'Type and press Enter to add tags' : 'Add more...'}"
                    value="${this.escapeHtml(this.tagInput)}" />
                </div>
              </div>

              <div class="form-section-title">3D Model Details</div>

              <div class="form-row">
                <div class="form-group">
                  <label for="polygonCount">Polygon Count</label>
                  <input type="number" id="polygonCount" name="polygonCount"
                    value="${this.formData.polygonCount || ''}"
                    placeholder="Auto-detected" 
                    ${this.modelStats ? `value="${this.modelStats.triangles}"` : ''} />
                </div>
                <div class="form-group">
                  <label for="materialCount">Material Count</label>
                  <input type="number" id="materialCount" name="materialCount"
                    value="${this.formData.materialCount || ''}"
                    placeholder="Auto-detected"
                    ${this.modelStats ? `value="${this.modelStats.materials}"` : ''} />
                </div>
              </div>

              <div class="form-row-3">
                <div class="form-group">
                  <label for="dim-width">Width (m)</label>
                  <input type="number" step="0.01" id="dim-width" name="dim-width"
                    value="${this.modelStats?.dimensions?.width?.toFixed(2) || ''}"
                    placeholder="0.00" />
                </div>
                <div class="form-group">
                  <label for="dim-height">Height (m)</label>
                  <input type="number" step="0.01" id="dim-height" name="dim-height"
                    value="${this.modelStats?.dimensions?.height?.toFixed(2) || ''}"
                    placeholder="0.00" />
                </div>
                <div class="form-group">
                  <label for="dim-depth">Depth (m)</label>
                  <input type="number" step="0.01" id="dim-depth" name="dim-depth"
                    value="${this.modelStats?.dimensions?.depth?.toFixed(2) || ''}"
                    placeholder="0.00" />
                </div>
              </div>

              <div class="form-section-title">Product Information (Optional)</div>

              <div class="form-row">
                <div class="form-group">
                  <label for="shopifyId">Shopify Product ID</label>
                  <input type="text" id="shopifyId" name="shopifyId"
                    value="${this.escapeHtml(this.formData.shopifyId)}"
                    placeholder="Link to Shopify product" />
                </div>
                <div class="form-group">
                  <label for="sku">SKU</label>
                  <input type="text" id="sku" name="sku"
                    value="${this.escapeHtml(this.formData.sku)}"
                    placeholder="e.g., SOFA-001" />
                </div>
              </div>

              <div class="form-group">
                <label for="price">Price ($)</label>
                <input type="number" step="0.01" id="price" name="price"
                  value="${this.formData.price}"
                  placeholder="0.00" />
              </div>
              

              <!-- remote settings  -->
              <div class="form-section-title">Storage Location</div>
              <div class="storage-option">
              <label class="storage-checkbox">
                <input type="checkbox" id="uploadToRemote" name="uploadToRemote" />
                <span class="checkbox-text">
                  <strong>Upload to MiniBucket CDN</strong>
                  <small>Store this asset in your configured remote storage instead of local disk</small>
                </span>
              </label>
              
              <div id="remote-status" class="remote-status"></div>
            </div>

              <div class="form-actions">
                <button type="button" class="secondary-btn" id="cancel-btn">Cancel</button>
                <button type="submit" class="primary-btn" id="submit-btn" 
                  ${!this.selectedFile || this.uploading ? 'disabled' : ''}>
                  ${this.uploading ? 'Uploading...' : '📤 Upload Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>
  .storage-option {
    background: #1e1e1e;
    border: 1px solid #3e3e42;
    border-radius: 6px;
    padding: 16px;
  }
  .storage-checkbox {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    cursor: pointer;
  }
  .storage-checkbox input[type="checkbox"] {
    width: 18px;
    height: 18px;
    margin-top: 2px;
    cursor: pointer;
    flex-shrink: 0;
  }
  .checkbox-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .checkbox-text strong {
    color: #fff;
    font-size: 14px;
  }
  .checkbox-text small {
    color: #858585;
    font-size: 12px;
  }
  .s3-status {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #3e3e42;
    font-size: 12px;
  }
  .s3-status.configured {
    color: #4ade80;
  }
  .s3-status.not-configured {
    color: #fbbf24;
  }
</style>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    // Back button
    document.getElementById('back-btn').addEventListener('click', () => {
      router.navigate('/assets');
    });

    // Upload area
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    // ─── URL input handling ───
      const urlInput = document.getElementById('asset-url');
      const fetchBtn = document.getElementById('fetch-url-btn');
   

      // Live validation: disable one method when the other is used
      urlInput.addEventListener('input', (e) => {
        this.formData.externalUrl = e.target.value.trim();
        this.updateInputModes();
      });

      // Fetch button: validate URL and try to get metadata
      fetchBtn.addEventListener('click', () => {
        this.fetchUrlMetadata();
      });

      // URL input: try to auto-detect on Enter
      urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.fetchUrlMetadata();
        }
      });

      // Initial mode update
      this.updateInputModes();

    uploadArea.addEventListener('click', (e) => {
      if (e.target.id !== 'change-file' && !e.target.closest('#change-file')) {
        fileInput.click();
      }
    });

    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      if (e.dataTransfer.files.length > 0) {
        this.handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleFileSelect(e.target.files[0]);
      }
    });

    // Change file button
    document.getElementById('change-file')?.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });

    // Clear preview
    document.getElementById('clear-preview')?.addEventListener('click', () => {
      this.selectedFile = null;
      this.previewUrl = null;
      this.modelStats = null;
      document.getElementById('model-preview').clear();
      this.render();
    });

    // Tag input
    const tagInput = document.getElementById('tag-input');
    tagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const value = tagInput.value.trim();
        if (value && !this.formData.tags.includes(value)) {
          this.formData.tags.push(value);
          this.tagInput = '';
          this.render();
          // Refocus tag input
          setTimeout(() => document.getElementById('tag-input')?.focus(), 0);
        }
      } else if (e.key === 'Backspace' && tagInput.value === '' && this.formData.tags.length > 0) {
        this.formData.tags.pop();
        this.render();
        setTimeout(() => document.getElementById('tag-input')?.focus(), 0);
      }
    });

    // Tag remove buttons
    this.shadowRoot?.querySelectorAll('.tag-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        this.formData.tags.splice(index, 1);
        this.render();
      });
    });
    document.querySelectorAll('.tag-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        this.formData.tags.splice(index, 1);
        this.render();
      });
    });

    // Form input listeners (save to formData as user types)
    ['name', 'description', 'category', 'vendor', 'shopifyId', 'sku', 'price', 'polygonCount', 'materialCount'].forEach(field => {
      const input = document.getElementById(field);
      if (input) {
        input.addEventListener('input', (e) => {
          this.formData[field] = e.target.value;
        });
      }
    });

    // Form submit
    document.getElementById('asset-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // Cancel
    document.getElementById('cancel-btn').addEventListener('click', () => {
      router.navigate('/assets');
    });

  }

  async handleFileSelect(file) {
    this.selectedFile = file;
    
    // Create preview URL for 3D models
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
    this.previewUrl = URL.createObjectURL(file);
    // Update name if empty
    if (!this.formData.name) {
      this.formData.name = file.name.replace(/\.[^/.]+$/, '');
    }

    this.render();

    // Try to load 3D preview for supported formats
    const ext = file.name.toLowerCase().split('.').pop();
    if (['glb', 'gltf'].includes(ext)) {
      try {
        const preview = document.getElementById('model-preview');
        this.modelStats = await preview.loadModel(this.previewUrl, file.name);
        
        // Auto-fill dimensions and polygon count
        if (this.modelStats) {
          this.formData.dimensions = this.modelStats.dimensions;
          this.formData.polygonCount = this.modelStats.triangles;
          this.formData.materialCount = this.modelStats.materials;
        }
        
        this.render();
      } catch (error) {
        console.warn('[Upload] Could not preview model:', error);
      }
    }
  }

  // async handleSubmit() {
  //   if (!this.selectedFile) return;

  //   // Validate
  //   if (!this.formData.name.trim()) {
  //     alert('Please enter a name for the asset');
  //     return;
  //   }

  //   this.uploading = true;
  //   this.uploadProgress = 0;
  //   this.render();

  //   try {
  //     // Collect dimensions
  //     const width = parseFloat(document.getElementById('dim-width')?.value) || this.modelStats?.dimensions?.width || null;
  //     const height = parseFloat(document.getElementById('dim-height')?.value) || this.modelStats?.dimensions?.height || null;
  //     const depth = parseFloat(document.getElementById('dim-depth')?.value) || this.modelStats?.dimensions?.depth || null;
  //     const uploadToRemote = document.getElementById('uploadToRemote')?.checked || false;


  //     const metadata = {
  //       name: this.formData.name.trim(),
  //       description: this.formData.description.trim(),
  //       category: this.formData.category,
  //       tags: this.formData.tags,
  //       vendor: this.formData.vendor.trim(),
  //       brand: this.formData.brand?.trim() || '',
  //       polygonCount: this.formData.polygonCount || document.getElementById('polygonCount')?.value || null,
  //       materialCount: this.formData.materialCount || document.getElementById('materialCount')?.value || null,
  //       shopifyId: this.formData.shopifyId.trim(),
  //       sku: this.formData.sku.trim(),
  //       price: this.formData.price || null,
  //       uploadToRemote: uploadToRemote 
  //     };

  //     if (width || height || depth) {
  //       metadata.dimensions = {
  //         width: width || 0,
  //         height: height || 0,
  //         depth: depth || 0
  //       };
  //     }

  //     const result = await assetService.upload(this.selectedFile, metadata, (progress) => {
  //       this.uploadProgress = progress;
  //       const progressFill = document.querySelector('.progress-fill');
  //       const progressText = document.querySelector('.progress-text');
  //       if (progressFill) progressFill.style.width = `${progress}%`;
  //       if (progressText) progressText.textContent = `Uploading... ${Math.round(progress)}%`;
  //     });

  //     this.uploading = false;
      
  //     // Show success message
  //     this.showSuccess(result.asset);
      
  //   } catch (error) {
  //     console.error('[Upload] Submit error:', error);
  //     this.uploading = false;
  //     alert('Upload failed: ' + error.message);
  //     this.render();
  //   }
  // }

  async handleSubmit() {
    const hasFile = !!this.selectedFile;
    const hasUrl = this.formData.externalUrl && this.formData.externalUrl.trim().length > 0;

    if (!hasFile && !hasUrl) {
      alert('Please either upload a file or provide an external URL');
      return;
    }

    if (!this.formData.name.trim()) {
      alert('Please enter a name for the asset');
      return;
    }

    this.uploading = true;
    this.uploadProgress = 0;
    this.render();

    try {
      let result;

      if (hasFile) {
        // ─── Path A: Upload file ───
        const metadata = this.buildMetadata();
        result = await assetService.upload(this.selectedFile, metadata, (progress) => {
          this.uploadProgress = progress;
          const progressFill = document.querySelector('.progress-fill');
          const progressText = document.querySelector('.progress-text');
          if (progressFill) progressFill.style.width = `${progress}%`;
          if (progressText) progressText.textContent = `Uploading... ${Math.round(progress)}%`;
        });
      } else {
        // ─── Path B: Register external URL ───
        const metadata = this.buildMetadata();
        result = await assetService.registerExternalUrl(this.formData.externalUrl.trim(), metadata);
      }

      this.uploading = false;
      this.showSuccess(result.asset);

    } catch (error) {
      console.error('[Upload] Submit error:', error);
      this.uploading = false;
      alert('Failed: ' + error.message);
      this.render();
    }
  }

  /**
   * Build metadata object shared by both upload paths
   */
  buildMetadata() {
    const width = parseFloat(document.getElementById('dim-width')?.value) || this.modelStats?.dimensions?.width || null;
    const height = parseFloat(document.getElementById('dim-height')?.value) || this.modelStats?.dimensions?.height || null;
    const depth = parseFloat(document.getElementById('dim-depth')?.value) || this.modelStats?.dimensions?.depth || null;

    const metadata = {
      name: this.formData.name.trim(),
      description: this.formData.description.trim(),
      category: this.formData.category,
      tags: this.formData.tags,
      vendor: this.formData.vendor.trim(),
      brand: this.formData.brand?.trim() || '',
      polygonCount: this.formData.polygonCount || null,
      materialCount: this.formData.materialCount || null,
      shopifyId: this.formData.shopifyId.trim(),
      sku: this.formData.sku.trim(),
      price: this.formData.price || null,
      uploadToRemote: document.getElementById('uploadToRemote')?.checked || false
    };

    if (width || height || depth) {
      metadata.dimensions = { width: width || 0, height: height || 0, depth: depth || 0 };
    }

    return metadata;
  }

      /**
     * Update UI based on whether a file or URL is selected.
     * Only one method can be active at a time.
     */
    updateInputModes() {
      const hasFile = !!this.selectedFile;
      const hasUrl = this.formData.externalUrl && this.formData.externalUrl.trim().length > 0;

      const urlInput = document.getElementById('asset-url');
      const fetchBtn = document.getElementById('fetch-url-btn');
      const uploadArea = document.getElementById('upload-area');
      const fileInput = document.getElementById('file-input');
      const submitBtn = document.getElementById('submit-btn');

      // Disable URL input when file is selected
      if (hasFile) {
        urlInput.disabled = true;
        fetchBtn.disabled = true;
        uploadArea.classList.remove('dimmed');
      } else {
        urlInput.disabled = false;
        fetchBtn.disabled = !hasUrl;
        uploadArea.classList.toggle('dimmed', hasUrl);
      }

      // Disable file input when URL is entered
      if (hasUrl) {
        fileInput.disabled = true;
        uploadArea.style.pointerEvents = 'none';
      } else {
        fileInput.disabled = false;
        uploadArea.style.pointerEvents = 'auto';
      }

      // Enable submit if either file or URL is present
      if (submitBtn) {
        submitBtn.disabled = (!hasFile && !hasUrl) || this.uploading;
        submitBtn.textContent = hasUrl 
          ? '🔗 Register External Asset' 
          : this.uploading ? 'Uploading...' : '📤 Upload Asset';
      }
    }

    /**
     * Fetch metadata from the external URL (name, type, size).
     */
    async fetchUrlMetadata() {
      const url = this.formData.externalUrl.trim();
      if (!url) return;

      // Basic URL validation
      try {
        new URL(url);
      } catch {
        this.showUrlStatus('Please enter a valid URL', 'error');
        return;
      }

      const statusEl = document.getElementById('url-status');
      statusEl.className = 'url-status loading';
      statusEl.textContent = '🔍 Fetching asset information...';
      statusEl.classList.remove('hidden');

      try {
        const response = await fetch('/api/assets/fetch-url-info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authService.getToken()}`
          },
          body: JSON.stringify({ url })
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to fetch URL info');
        }

        const info = await response.json();

        // Auto-fill form fields
        if (info.fileName && !this.formData.name) {
          this.formData.name = info.fileName.replace(/\.[^/.]+$/, '');
          document.getElementById('name').value = this.formData.name;
        }
        if (info.format) {
          // Format detection is handled server-side
        }
        if (info.size) {
          // Display size in status
        }

        statusEl.className = 'url-status success';
        statusEl.innerHTML = `
          ✓ Asset accessible<br>
          <small>
            Type: <strong>${info.mimeType || 'unknown'}</strong> • 
            Size: <strong>${this.formatSize(info.size || 0)}</strong> • 
            Format: <strong>${(info.format || 'unknown').toUpperCase()}</strong>
          </small>
        `;

      } catch (error) {
        statusEl.className = 'url-status error';
        statusEl.textContent = `✕ ${error.message}`;
      }
    }

    showUrlStatus(message, type) {
      const statusEl = document.getElementById('url-status');
      statusEl.className = `url-status ${type}`;
      statusEl.textContent = message;
      statusEl.classList.remove('hidden');
    }

  showSuccess(asset) {
    this.container.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="upload-page">
        <div class="success-state">
          <div class="success-icon">✅</div>
          <h2>Upload Successful!</h2>
          <p>Your asset "${this.escapeHtml(asset.name)}" has been uploaded and saved.</p>
          <div class="success-details">
            <div class="detail-row">
              <span class="detail-label">File:</span>
              <span class="detail-value">${this.escapeHtml(asset.name)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Size:</span>
              <span class="detail-value">${this.formatSize(asset.size)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Type:</span>
              <span class="detail-value">${asset.type}</span>
            </div>
            ${asset.format ? `
              <div class="detail-row">
                <span class="detail-label">Format:</span>
                <span class="detail-value">${asset.format.toUpperCase()}</span>
              </div>
            ` : ''}
          </div>
          <div class="success-actions">
            <button class="secondary-btn" id="upload-another">Upload Another</button>
            <button class="primary-btn" id="view-assets">View All Assets</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('upload-another').addEventListener('click', () => {
      this.selectedFile = null;
      this.previewUrl = null;
      this.modelStats = null;
      this.formData = {
        name: '', description: '', category: '', tags: [],
        vendor: '', brand: '', dimensions: null, polygonCount: null,
        materialCount: null, shopifyId: '', price: '', sku: ''
      };
      this.render();
    });

    document.getElementById('view-assets').addEventListener('click', () => {
      router.navigate('/assets');
    });
  }

  getFileIcon(fileName) {
    const ext = fileName.toLowerCase().split('.').pop();
    const icons = {
      glb: '📦', gltf: '📦', fbx: '📦', obj: '📦',
      jpg: '🖼️', jpeg: '🖼️', png: '🖼️', webp: '🖼️',
      hdr: '🌅',
      mp3: '🎵', wav: '🎵',
      mp4: '🎬'
    };
    return icons[ext] || '📄';
  }

  formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
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
      .upload-page {
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
      }
      .upload-content {
        max-width: 1400px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
      }
      @media (max-width: 1024px) {
        .upload-content {
          grid-template-columns: 1fr;
        }
      }
      .preview-section, .form-section {
        background: #252526;
        border: 1px solid #3e3e42;
        border-radius: 8px;
        padding: 20px;
      }
      .preview-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      .preview-header h3 {
        color: #fff;
        margin: 0;
        font-size: 16px;
      }
      .text-btn {
        background: transparent;
        border: none;
        color: #007acc;
        cursor: pointer;
        font-size: 13px;
      }
      .text-btn:hover {
        text-decoration: underline;
      }
      .preview-container {
        height: 400px;
        border-radius: 8px;
        overflow: hidden;
        background: #1a1a1a;
      }
      .model-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin-top: 12px;
      }
      .stat {
        background: #1e1e1e;
        padding: 10px;
        border-radius: 6px;
        text-align: center;
      }
      .stat-label {
        display: block;
        font-size: 11px;
        color: #858585;
        margin-bottom: 4px;
      }
      .stat-value {
        display: block;
        font-size: 14px;
        color: #fff;
        font-weight: 600;
      }
      .upload-area {
        background: #1e1e1e;
        border: 2px dashed #3e3e42;
        border-radius: 8px;
        padding: 24px;
        cursor: pointer;
        transition: all 0.2s;
        margin-bottom: 16px;
      }
      .upload-area:hover {
        border-color: #007acc;
        background: #252526;
      }
      .upload-area.drag-over {
        border-color: #007acc;
        background: rgba(0, 122, 204, 0.1);
      }
      .upload-placeholder {
        text-align: center;
        padding: 20px;
      }
      .upload-icon {
        font-size: 48px;
        margin-bottom: 12px;
      }
      .upload-text {
        color: #fff;
        font-size: 16px;
        margin-bottom: 4px;
      }
      .upload-hint {
        color: #858585;
        font-size: 13px;
        margin-bottom: 12px;
      }
      .upload-formats {
        color: #858585;
        font-size: 11px;
      }
      .file-selected {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .file-icon {
        font-size: 32px;
      }
      .file-info {
        flex: 1;
      }
      .file-name {
        color: #fff;
        font-size: 14px;
        font-weight: 500;
        word-break: break-all;
      }
      .file-size {
        color: #858585;
        font-size: 12px;
        margin-top: 2px;
      }
      .icon-btn {
        background: transparent;
        border: 1px solid #3e3e42;
        color: #ccc;
        width: 32px;
        height: 32px;
        border-radius: 4px;
        cursor: pointer;
      }
      .icon-btn:hover {
        background: #2d2d30;
      }
      .upload-progress {
        margin-bottom: 16px;
      }
      .progress-bar {
        height: 6px;
        background: #1e1e1e;
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 6px;
      }
      .progress-fill {
        height: 100%;
        background: #007acc;
        transition: width 0.3s;
      }
      .progress-text {
        font-size: 12px;
        color: #858585;
      }
      .asset-form {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .form-section-title {
        color: #fff;
        font-size: 14px;
        font-weight: 600;
        margin-top: 8px;
        padding-top: 12px;
        border-top: 1px solid #3e3e42;
      }
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .form-group label {
        color: #ccc;
        font-size: 12px;
        font-weight: 500;
      }
      .form-group input, .form-group textarea, .form-group select {
        background: #1e1e1e;
        border: 1px solid #3e3e42;
        color: #fff;
        padding: 8px 10px;
        border-radius: 4px;
        font-size: 13px;
        font-family: inherit;
        resize: vertical;
      }
      .form-group input:focus, .form-group textarea:focus, .form-group select:focus {
        outline: none;
        border-color: #007acc;
      }
      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .form-row-3 {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 12px;
      }
      .tags-input {
        background: #1e1e1e;
        border: 1px solid #3e3e42;
        border-radius: 4px;
        padding: 6px;
        min-height: 38px;
      }
      .tags-list {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-bottom: 4px;
      }
      .tag {
        background: #007acc;
        color: white;
        padding: 2px 8px;
        border-radius: 3px;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .tag-remove {
        background: transparent;
        border: none;
        color: white;
        cursor: pointer;
        padding: 0;
        font-size: 14px;
        line-height: 1;
      }
      .tags-input input {
        background: transparent;
        border: none;
        color: #fff;
        padding: 4px;
        width: 100%;
        font-size: 13px;
      }
      .tags-input input:focus {
        outline: none;
      }
      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #3e3e42;
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
      .primary-btn:hover:not(:disabled) {
        background: #0098ff;
      }
      .primary-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
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
      .success-state {
        max-width: 600px;
        margin: 60px auto;
        text-align: center;
        background: #252526;
        border: 1px solid #3e3e42;
        border-radius: 12px;
        padding: 40px;
      }
      .success-icon {
        font-size: 64px;
        margin-bottom: 16px;
      }
      .success-state h2 {
        color: #fff;
        margin: 0 0 8px 0;
      }
      .success-state p {
        color: #858585;
        margin: 0 0 24px 0;
      }
      .success-details {
        background: #1e1e1e;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 24px;
        text-align: left;
      }
      .detail-row {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        border-bottom: 1px solid #2d2d30;
      }
      .detail-row:last-child {
        border-bottom: none;
      }
      .detail-label {
        color: #858585;
        font-size: 13px;
      }
      .detail-value {
        color: #fff;
        font-size: 13px;
        font-weight: 500;
      }
      .success-actions {
        display: flex;
        justify-content: center;
        gap: 12px;
      }
      .url-divider {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 20px 0;
        color: #858585;
        font-size: 12px;
      }
      .url-divider::before,
      .url-divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: #3e3e42;
      }
      .url-option {
        background: #1e1e1e;
        border: 1px solid #3e3e42;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
      }
      .url-option label {
        display: block;
        color: #ccc;
        font-size: 13px;
        font-weight: 500;
        margin-bottom: 8px;
      }
      .url-input-row {
        display: flex;
        gap: 8px;
        margin-bottom: 8px;
      }
      .url-input-row input {
        flex: 1;
        background: #252526;
        border: 1px solid #3e3e42;
        color: #fff;
        padding: 10px 12px;
        border-radius: 6px;
        font-size: 13px;
        font-family: monospace;
      }
      .url-input-row input:focus {
        outline: none;
        border-color: #007acc;
      }
      .url-input-row input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .url-status {
        margin-top: 8px;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
      }
      .url-status.hidden { display: none; }
      .url-status.success {
        background: rgba(74, 222, 128, 0.1);
        border: 1px solid rgba(74, 222, 128, 0.3);
        color: #4ade80;
      }
      .url-status.error {
        background: rgba(248, 113, 113, 0.1);
        border: 1px solid rgba(248, 113, 113, 0.3);
        color: #f87171;
      }
      .url-status.loading {
        background: rgba(0, 122, 204, 0.1);
        border: 1px solid rgba(0, 122, 204, 0.3);
        color: #007acc;
      }

      /* Dim the drop area when URL is being used */
      .upload-area.dimmed {
        opacity: 0.4;
        pointer-events: none;
      }
      .upload-area.has-file ~ .url-option {
        opacity: 0.5;
      }
    `;
  }

  destroy() {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }
}