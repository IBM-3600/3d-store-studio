// frontend/src/core/LayoutManager.js
import { EventBus } from './EventBus.js';

export class LayoutManager {
  constructor() {
    this.closedPanels = new Set();
    this.dockedPanels = new Map(); // panelId -> 'left' | 'right' | 'floating'
    
    this.setupListeners();
  }

  setupListeners() {
    EventBus.on('panel:close', ({ panelId }) => {
      this.closedPanels.add(panelId);
      this.applyLayout();
    });

    EventBus.on('panel:dock', ({ panelId }) => {
      const currentDock = this.dockedPanels.get(panelId) || 'right';
      const nextDock = currentDock === 'right' ? 'floating' : 'right';
      this.dockedPanels.set(panelId, nextDock);
      this.applyLayout();
    });
  }

  applyLayout() {
    // Example: Adjust CSS Grid template columns based on closed panels
    const leftPanel = document.querySelector('studio-outliner');
    const rightPanel = document.querySelector('studio-inspector');
    const viewport = document.querySelector('.editor-viewport');

    let gridTemplate = '';

    if (this.closedPanels.has('outliner') && this.closedPanels.has('inspector')) {
      gridTemplate = '1fr'; // Only viewport
    } else if (this.closedPanels.has('outliner')) {
      gridTemplate = '1fr 320px'; // Viewport + Right panel
    } else if (this.closedPanels.has('inspector')) {
      gridTemplate = '280px 1fr'; // Left panel + Viewport
    } else {
      gridTemplate = '280px 1fr 320px'; // Default
    }

    // Apply to the main editor container (adjust selector to match your layout)
    const editorMain = document.querySelector('.editor-main');
    if (editorMain) {
      editorMain.style.gridTemplateColumns = gridTemplate;
    }
  }

  // Method to restore a closed panel
  restorePanel(panelId) {
    this.closedPanels.delete(panelId);
    const panel = document.querySelector(`studio-panel-controls[panel-id="${panelId}"]`)?.closest('*');
    if (panel) {
      panel.removeAttribute('closed');
    }
    this.applyLayout();
  }
}

export const layoutManager = new LayoutManager();