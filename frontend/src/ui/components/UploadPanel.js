// frontend/src/ui/components/UploadPanel.js
import { uploadService } from '../../services/UploadService.js';
import { EventBus } from '../../core/EventBus.js';

export class UploadPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.uploads = [];
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    EventBus.on('upload:progress', (data) => this.updateProgress(data));
    EventBus.on('upload:complete', (data) => this.onUploadComplete(data));
    EventBus.on('upload:error', (data) => this.onUploadError(data));
  }

  async handleFileSelect(event) {
    const files = Array.from(event.target.files);
    
    for (const file of files) {
      await this.startUpload(file);
    }
  }

  async startUpload(file) {
    const uploadId = `upload_${Date.now()}_${Math.random()}`;
    
    this.uploads.push({
      id: uploadId,
      fileName: file.name,
      fileSize: file.size,
      progress: 0,
      status: 'uploading'
    });

    this.render();

    try {
      await uploadService.uploadFile(file, (percent) => {
        this.updateProgress({ uploadId, percent });
      });
    } catch (error) {
      console.error('Upload failed:', error);
    }
  }

  updateProgress({ uploadId, percent }) {
    const upload = this.uploads.find(u => u.id === uploadId);
    if (upload) {
      upload.progress = percent;
      this.render();
    }
  }

  onUploadComplete({ uploadId, asset }) {
    const upload = this.uploads.find(u => u.id === uploadId);
    if (upload) {
      upload.status = 'complete';
      upload.asset = asset;
      this.render();
      
      // Remove from list after 3 seconds
      setTimeout(() => {
        this.uploads = this.uploads.filter(u => u.id !== uploadId);
        this.render();
      }, 3000);
    }
  }

  onUploadError({ uploadId, error }) {
    const upload = this.uploads.find(u => u.id === uploadId);
    if (upload) {
      upload.status = 'error';
      upload.error = error.message;
      this.render();
    }
  }

  cancelUpload(uploadId) {
    uploadService.cancelUpload(uploadId);
    this.uploads = this.uploads.filter(u => u.id !== uploadId);
    this.render();
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${this.getStyles()}</style>
      
      <div class="upload-panel">
        <div class="upload-header">
          <h3>Upload Assets</h3>
          <label class="upload-btn">
            <input type="file" multiple accept=".glb,.gltf,.jpg,.jpeg,.png,.webp,.mp3,.wav,.mp4" style="display: none;" />
            <span>Choose Files</span>
          </label>
        </div>

        <div class="upload-list">
          ${this.uploads.length === 0 ? `
            <div class="empty-state">
              <p>No uploads in progress</p>
              <p class="hint">Drag & drop files here or click "Choose Files"</p>
            </div>
          ` : ''}
          
          ${this.uploads.map(upload => `
            <div class="upload-item ${upload.status}">
              <div class="upload-info">
                <div class="file-name">${upload.fileName}</div>
                <div class="file-size">${this.formatFileSize(upload.fileSize)}</div>
              </div>
              
              ${upload.status === 'uploading' ? `
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${upload.progress}%"></div>
                </div>
                <div class="progress-text">${Math.round(upload.progress)}%</div>
                <button class="cancel-btn" data-upload-id="${upload.id}">✕</button>
              ` : ''}
              
              ${upload.status === 'complete' ? `
                <div class="status-badge success">✓ Complete</div>
              ` : ''}
              
              ${upload.status === 'error' ? `
                <div class="status-badge error">✕ Failed</div>
                <div class="error-message">${upload.error}</div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Event listeners
    const fileInput = this.shadowRoot.querySelector('input[type="file"]');
    fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

    this.shadowRoot.querySelectorAll('.cancel-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const uploadId = e.target.dataset.uploadId;
        this.cancelUpload(uploadId);
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
        padding: 16px;
        border-radius: 8px;
      }
      .upload-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .upload-header h3 {
        margin: 0;
        font-size: 16px;
        color: #fff;
      }
      .upload-btn {
        background: #007acc;
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.15s;
      }
      .upload-btn:hover {
        background: #0098ff;
      }
      .upload-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .empty-state {
        text-align: center;
        padding: 32px;
        color: #858585;
      }
      .empty-state .hint {
        font-size: 12px;
        margin-top: 8px;
      }
      .upload-item {
        background: #2d2d30;
        border: 1px solid #3e3e42;
        border-radius: 6px;
        padding: 12px;
        position: relative;
      }
      .upload-item.complete {
        border-color: #4ade80;
      }
      .upload-item.error {
        border-color: #f87171;
      }
      .upload-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      .file-name {
        font-weight: 500;
        color: #fff;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 70%;
      }
      .file-size {
        color: #858585;
        font-size: 12px;
      }
      .progress-bar {
        height: 6px;
        background: #1e1e1e;
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 4px;
      }
      .progress-fill {
        height: 100%;
        background: #007acc;
        transition: width 0.3s ease;
      }
      .progress-text {
        font-size: 11px;
        color: #858585;
      }
      .cancel-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        background: transparent;
        border: none;
        color: #858585;
        cursor: pointer;
        font-size: 16px;
        padding: 4px 8px;
      }
      .cancel-btn:hover {
        color: #fff;
      }
      .status-badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
      }
      .status-badge.success {
        background: rgba(74, 222, 128, 0.2);
        color: #4ade80;
      }
      .status-badge.error {
        background: rgba(248, 113, 113, 0.2);
        color: #f87171;
      }
      .error-message {
        font-size: 11px;
        color: #f87171;
        margin-top: 4px;
      }
    `;
  }
}

customElements.define('upload-panel', UploadPanel);