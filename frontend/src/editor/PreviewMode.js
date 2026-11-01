// src/editor/PreviewMode.js
import { EventBus } from '../core/EventBus.js';

export class PreviewMode {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.isActive = false;
    this.originalUIState = null;
  }

  toggle() {
    if (this.isActive) {
      this.exit();
    } else {
      this.enter();
    }
  }

  enter() {
    this.isActive = true;
    
    // Hide editor UI
    document.querySelector('.left-panel').style.display = 'none';
    document.querySelector('.right-panel').style.display = 'none';
    document.querySelector('.statusbar').style.display = 'none';
    document.querySelector('.toolbar').style.display = 'none';
    
    // Expand viewport to full screen
    document.querySelector('.viewport').style.gridColumn = '1 / -1';
    document.querySelector('.viewport').style.gridRow = '1 / -1';

    // Disable editor controls
    this.sceneManager.transformControl.detach();
    this.sceneManager.orbit.enabled = true;

    // Add exit button
    const exitBtn = document.createElement('button');
    exitBtn.id = 'exit-preview-btn';
    exitBtn.textContent = '✕ Exit Preview (Esc)';
    exitBtn.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      z-index: 1000;
    `;
    exitBtn.addEventListener('click', () => this.exit());
    document.body.appendChild(exitBtn);

    // Escape key to exit
    this.escHandler = (e) => {
      if (e.key === 'Escape') this.exit();
    };
    document.addEventListener('keydown', this.escHandler);

    EventBus.emit('preview:entered');
  }

  exit() {
    this.isActive = false;

    // Restore UI
    document.querySelector('.left-panel').style.display = 'flex';
    document.querySelector('.right-panel').style.display = 'block';
    document.querySelector('.statusbar').style.display = 'flex';
    document.querySelector('.toolbar').style.display = 'flex';
    
    document.querySelector('.viewport').style.gridColumn = '';
    document.querySelector('.viewport').style.gridRow = '';

    // Remove exit button
    const exitBtn = document.getElementById('exit-preview-btn');
    if (exitBtn) exitBtn.remove();

    // Remove escape handler
    if (this.escHandler) {
      document.removeEventListener('keydown', this.escHandler);
    }

    EventBus.emit('preview:exited');
  }
}