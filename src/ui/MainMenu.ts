export interface MainMenuCallbacks {
  onStartMatch: () => void;
  onOpenSettings: () => void;
}

export class MainMenu {
  private container: HTMLElement;
  private callbacks: MainMenuCallbacks;

  constructor(parent: HTMLElement, callbacks: MainMenuCallbacks) {
    this.callbacks = callbacks;
    this.container = document.createElement('div');
    this.container.id = 'main-menu-layer';
    this.container.className = 'menu-layer';
    parent.appendChild(this.container);

    this.buildMenu();
  }

  private buildMenu(): void {
    this.container.innerHTML = `
      <div class="menu-card tactical-frame">
        <div class="menu-brand">
          <div class="brand-badge">TACTICAL SYSTEM V2.0</div>
          <h1 class="brand-title">OPERATION<br><span class="brand-accent">PHANTOM</span></h1>
          <p class="brand-sub">BROWSER TACTICAL FIRST-PERSON SHOOTER</p>
        </div>

        <div class="menu-actions">
          <button id="btn-play" class="btn-tactical btn-primary">
            <span class="btn-glow"></span>
            <span class="btn-text">DEPLOY COMBAT</span>
            <span class="btn-subtext">NEON DISTRICT • 4V4 PRACTICE</span>
          </button>

          <button id="btn-settings" class="btn-tactical btn-secondary">
            <span class="btn-text">SETTINGS</span>
          </button>

          <button id="btn-briefing" class="btn-tactical btn-secondary">
            <span class="btn-text">BRIEFING & CONTROLS</span>
          </button>
        </div>

        <!-- Controls Briefing Modal -->
        <div id="briefing-modal" class="briefing-modal" style="display: none;">
          <div class="briefing-content">
            <h3>TACTICAL FIELD MANUAL</h3>
            
            <div class="briefing-section">
              <h4>🖥️ DESKTOP CONTROLS</h4>
              <ul>
                <li><strong>W, A, S, D:</strong> Move Operative</li>
                <li><strong>Mouse:</strong> Look / Aim (Click screen to lock pointer)</li>
                <li><strong>Left Mouse:</strong> Fire Weapon</li>
                <li><strong>Right Mouse:</strong> Aim Down Sights (ADS)</li>
                <li><strong>Shift:</strong> Sprint</li>
                <li><strong>Space:</strong> Jump</li>
                <li><strong>C:</strong> Crouch</li>
                <li><strong>R:</strong> Reload</li>
                <li><strong>1, 2, 3:</strong> Switch Weapons (AR-7, Viper-9, Longshot)</li>
                <li><strong>ESC:</strong> Pause Menu</li>
              </ul>
            </div>

            <div class="briefing-section">
              <h4>📱 MOBILE TOUCH CONTROLS</h4>
              <ul>
                <li><strong>Left Virtual Stick:</strong> Dynamic 360° Movement</li>
                <li><strong>Right Screen Area:</strong> Swipe to Look and Aim</li>
                <li><strong>FIRE Button:</strong> Trigger Weapon (Tap or Hold)</li>
                <li><strong>ADS Button:</strong> Toggle Weapon Sight / Sniper Zoom</li>
                <li><strong>JUMP / CROUCH / RUN:</strong> Dedicated Tactical Buttons</li>
                <li><strong>Top-Right Weapon Pills:</strong> Instant Quick-Swap</li>
              </ul>
            </div>

            <button id="btn-close-briefing" class="btn-tactical btn-small">CLOSE MANUAL</button>
          </div>
        </div>

        <div class="menu-footer">
          <span>OPTIMIZED FOR MOBILE & DESKTOP BROWSERS • THREE.JS + TS</span>
        </div>
      </div>
    `;

    // Hook buttons
    const playBtn = this.container.querySelector('#btn-play')!;
    playBtn.addEventListener('click', () => {
      this.callbacks.onStartMatch();
    });

    const settingsBtn = this.container.querySelector('#btn-settings')!;
    settingsBtn.addEventListener('click', () => {
      this.callbacks.onOpenSettings();
    });

    const briefingBtn = this.container.querySelector('#btn-briefing')!;
    const briefingModal = this.container.querySelector('#briefing-modal') as HTMLElement;
    briefingBtn.addEventListener('click', () => {
      briefingModal.style.display = 'flex';
    });

    const closeBriefingBtn = this.container.querySelector('#btn-close-briefing')!;
    closeBriefingBtn.addEventListener('click', () => {
      briefingModal.style.display = 'none';
    });
  }

  public setVisible(visible: boolean): void {
    this.container.style.display = visible ? 'flex' : 'none';
  }
}
