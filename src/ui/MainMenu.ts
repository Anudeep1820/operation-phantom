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

        <div class="menu-footer">
          <span>OPTIMIZED FOR MOBILE & DESKTOP BROWSERS • THREE.JS + TS</span>
        </div>
      </div>

      <!-- Controls Briefing Modal (Fullscreen Centered Overlay) -->
      <div id="briefing-modal" class="briefing-modal" style="display: none;">
        <div class="briefing-content tactical-frame">
          <div class="briefing-header">
            <h3>TACTICAL FIELD MANUAL</h3>
            <button id="btn-close-briefing-x" class="btn-close-modal" aria-label="Close">✕</button>
          </div>
          
          <div class="briefing-section">
            <h4>🖥️ DESKTOP CONTROLS</h4>
            <ul>
              <li><strong>W, A, S, D:</strong> Move Operative / Drive Buggy</li>
              <li><strong>Mouse:</strong> Look & Aim (Click to lock pointer)</li>
              <li><strong>Left Click:</strong> Fire Weapon</li>
              <li><strong>Right Click:</strong> Aim Down Sights (ADS) & High-Power Sniper Scope</li>
              <li><strong>E:</strong> Enter / Exit Tactical Buggy Vehicle</li>
              <li><strong>Shift:</strong> Sprint</li>
              <li><strong>Space:</strong> Jump</li>
              <li><strong>C:</strong> Crouch</li>
              <li><strong>R:</strong> Reload</li>
              <li><strong>1, 2, 3:</strong> Switch Weapons (AR-7, Viper-9, Longshot)</li>
              <li><strong>ESC:</strong> Pause Game</li>
            </ul>
          </div>

          <div class="briefing-section">
            <h4>📱 MOBILE TOUCH CONTROLS</h4>
            <ul>
              <li><strong>Left Virtual Stick:</strong> 360° Movement & Steering</li>
              <li><strong>Right Screen Area:</strong> Swipe to Aim</li>
              <li><strong>FIRE Button:</strong> Tap or Hold to shoot</li>
              <li><strong>ADS Button:</strong> Toggle Weapon Sight / Sniper Optics</li>
              <li><strong>DRIVE Button:</strong> Mount or Dismount Military Buggy</li>
              <li><strong>JUMP / CROUCH / RUN:</strong> Movement Modifiers</li>
              <li><strong>⏸ Button:</strong> Top-right Pause button</li>
            </ul>
          </div>

          <div class="briefing-section">
            <h4>🛡️ TACTICAL FEATURES</h4>
            <ul>
              <li><strong>Tactical Buggy:</strong> Mount to travel fast across the 260m combat zone and eliminate enemy bots by collision.</li>
              <li><strong>Totem of Undying:</strong> Protects you from one fatal blow, releasing golden energy that fully restores your health.</li>
            </ul>
          </div>

          <div class="briefing-footer">
            <button id="btn-close-briefing" class="btn-tactical btn-secondary btn-small">CLOSE MANUAL</button>
          </div>
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

    const closeX = this.container.querySelector('#btn-close-briefing-x');
    if (closeX) {
      closeX.addEventListener('click', () => {
        briefingModal.style.display = 'none';
      });
    }

    briefingModal.addEventListener('click', (e) => {
      if (e.target === briefingModal) {
        briefingModal.style.display = 'none';
      }
    });
  }

  public setVisible(visible: boolean): void {
    this.container.style.display = visible ? 'flex' : 'none';
  }
}
