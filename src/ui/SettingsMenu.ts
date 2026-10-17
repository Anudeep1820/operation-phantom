import { GameSettings, GraphicsQuality } from '../types';

export interface SettingsCallbacks {
  onSave: (newSettings: GameSettings) => void;
  onClose: () => void;
}

export class SettingsMenu {
  private container: HTMLElement;
  private settings: GameSettings;
  private callbacks: SettingsCallbacks;

  constructor(parent: HTMLElement, currentSettings: GameSettings, callbacks: SettingsCallbacks) {
    this.settings = { ...currentSettings };
    this.callbacks = callbacks;

    this.container = document.createElement('div');
    this.container.id = 'settings-menu-layer';
    this.container.className = 'menu-layer';
    this.container.style.display = 'none';
    parent.appendChild(this.container);

    this.buildUI();
  }

  private buildUI(): void {
    this.container.innerHTML = `
      <div class="menu-card tactical-frame settings-card">
        <h2 class="settings-title">SYSTEM SETTINGS</h2>

        <div class="settings-grid">
          <!-- Graphics Preset -->
          <div class="setting-item">
            <label>GRAPHICS QUALITY</label>
            <div class="btn-group-toggle">
              <button class="toggle-btn ${this.settings.graphicsQuality === 'low' ? 'active' : ''}" data-val="low">LOW (MOBILE)</button>
              <button class="toggle-btn ${this.settings.graphicsQuality === 'medium' ? 'active' : ''}" data-val="medium">MEDIUM</button>
              <button class="toggle-btn ${this.settings.graphicsQuality === 'high' ? 'active' : ''}" data-val="high">HIGH</button>
            </div>
          </div>

          <!-- Resolution Scale -->
          <div class="setting-item">
            <label>RESOLUTION SCALE: <span id="res-val">${Math.round(this.settings.resolutionScale * 100)}%</span></label>
            <input type="range" id="res-slider" min="0.5" max="1.0" step="0.05" value="${this.settings.resolutionScale}">
          </div>

          <!-- Mouse Sensitivity -->
          <div class="setting-item">
            <label>MOUSE SENSITIVITY: <span id="mouse-val">${this.settings.mouseSensitivity}</span></label>
            <input type="range" id="mouse-slider" min="0.001" max="0.006" step="0.0002" value="${this.settings.mouseSensitivity}">
          </div>

          <!-- Touch Sensitivity -->
          <div class="setting-item">
            <label>TOUCH SENSITIVITY: <span id="touch-val">${this.settings.touchSensitivity}</span></label>
            <input type="range" id="touch-slider" min="0.001" max="0.008" step="0.0005" value="${this.settings.touchSensitivity}">
          </div>

          <!-- Master Volume -->
          <div class="setting-item">
            <label>MASTER VOLUME: <span id="vol-val">${Math.round(this.settings.masterVolume * 100)}%</span></label>
            <input type="range" id="vol-slider" min="0" max="1.0" step="0.05" value="${this.settings.masterVolume}">
          </div>

          <!-- SFX Volume -->
          <div class="setting-item">
            <label>SFX VOLUME: <span id="sfx-val">${Math.round(this.settings.sfxVolume * 100)}%</span></label>
            <input type="range" id="sfx-slider" min="0" max="1.0" step="0.05" value="${this.settings.sfxVolume}">
          </div>

          <!-- Toggles -->
          <div class="setting-item-row">
            <label>
              <input type="checkbox" id="chk-fps" ${this.settings.showFps ? 'checked' : ''}>
              SHOW FPS & PERFORMANCE
            </label>
            <label>
              <input type="checkbox" id="chk-shake" ${this.settings.cameraShake ? 'checked' : ''}>
              CAMERA SHAKE
            </label>
          </div>
        </div>

        <div class="settings-actions">
          <button id="btn-save-settings" class="btn-tactical btn-primary">SAVE & APPLY</button>
          <button id="btn-close-settings" class="btn-tactical btn-secondary">BACK</button>
        </div>
      </div>
    `;

    // Bind inputs
    const qualityBtns = this.container.querySelectorAll('.toggle-btn');
    qualityBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        qualityBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.settings.graphicsQuality = btn.getAttribute('data-val') as GraphicsQuality;
      });
    });

    const resSlider = this.container.querySelector('#res-slider') as HTMLInputElement;
    const resVal = this.container.querySelector('#res-val')!;
    resSlider.addEventListener('input', () => {
      this.settings.resolutionScale = parseFloat(resSlider.value);
      resVal.textContent = `${Math.round(this.settings.resolutionScale * 100)}%`;
    });

    const mouseSlider = this.container.querySelector('#mouse-slider') as HTMLInputElement;
    const mouseVal = this.container.querySelector('#mouse-val')!;
    mouseSlider.addEventListener('input', () => {
      this.settings.mouseSensitivity = parseFloat(mouseSlider.value);
      mouseVal.textContent = `${this.settings.mouseSensitivity}`;
    });

    const touchSlider = this.container.querySelector('#touch-slider') as HTMLInputElement;
    const touchVal = this.container.querySelector('#touch-val')!;
    touchSlider.addEventListener('input', () => {
      this.settings.touchSensitivity = parseFloat(touchSlider.value);
      touchVal.textContent = `${this.settings.touchSensitivity}`;
    });

    const volSlider = this.container.querySelector('#vol-slider') as HTMLInputElement;
    const volVal = this.container.querySelector('#vol-val')!;
    volSlider.addEventListener('input', () => {
      this.settings.masterVolume = parseFloat(volSlider.value);
      volVal.textContent = `${Math.round(this.settings.masterVolume * 100)}%`;
    });

    const sfxSlider = this.container.querySelector('#sfx-slider') as HTMLInputElement;
    const sfxVal = this.container.querySelector('#sfx-val')!;
    sfxSlider.addEventListener('input', () => {
      this.settings.sfxVolume = parseFloat(sfxSlider.value);
      sfxVal.textContent = `${Math.round(this.settings.sfxVolume * 100)}%`;
    });

    const chkFps = this.container.querySelector('#chk-fps') as HTMLInputElement;
    chkFps.addEventListener('change', () => {
      this.settings.showFps = chkFps.checked;
    });

    const chkShake = this.container.querySelector('#chk-shake') as HTMLInputElement;
    chkShake.addEventListener('change', () => {
      this.settings.cameraShake = chkShake.checked;
    });

    const saveBtn = this.container.querySelector('#btn-save-settings')!;
    saveBtn.addEventListener('click', () => {
      this.callbacks.onSave(this.settings);
      this.setVisible(false);
    });

    const closeBtn = this.container.querySelector('#btn-close-settings')!;
    closeBtn.addEventListener('click', () => {
      this.callbacks.onClose();
      this.setVisible(false);
    });
  }

  public setVisible(visible: boolean): void {
    this.container.style.display = visible ? 'flex' : 'none';
  }
}
