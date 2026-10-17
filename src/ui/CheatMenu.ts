import { CheatManager } from '../core/CheatManager';
import { DamageSystem } from '../combat/DamageSystem';
import { PracticeMode } from '../game-modes/PracticeMode';

export interface CheatMenuCallbacks {
  onClose: () => void;
  onNuke: () => void;
  onHeal: () => void;
}

export class CheatMenu {
  private container: HTMLElement;
  private cheatManager: CheatManager;
  private callbacks: CheatMenuCallbacks;

  constructor(parent: HTMLElement, cheatManager: CheatManager, callbacks: CheatMenuCallbacks) {
    this.cheatManager = cheatManager;
    this.callbacks = callbacks;

    this.container = document.createElement('div');
    this.container.id = 'cheat-menu-layer';
    this.container.className = 'menu-layer cheat-menu-layer';
    this.container.style.display = 'none';
    parent.appendChild(this.container);

    this.buildUI();
  }

  private buildUI(): void {
    const s = this.cheatManager.state;
    this.container.innerHTML = `
      <div class="menu-card tactical-frame cheat-card">
        <div class="cheat-header">
          <div class="cheat-badge">⚡ PHANTOM OVERRIDE V2.0</div>
          <h2 class="cheat-title">OPERATIVE CHEAT ENGINE</h2>
          <p class="cheat-sub">ACTIVATE TACTICAL GODLIKE AUGMENTATIONS</p>
        </div>

        <div class="cheat-grid">
          <!-- God Mode -->
          <button id="chk-godmode" class="cheat-toggle-btn ${s.godMode ? 'active' : ''}">
            <span class="cheat-icon">🛡️</span>
            <div class="cheat-info">
              <span class="cheat-name">GOD MODE</span>
              <span class="cheat-desc">Invulnerability, zero damage</span>
            </div>
            <span class="cheat-status">${s.godMode ? 'ON' : 'OFF'}</span>
          </button>

          <!-- Infinite Ammo -->
          <button id="chk-infammo" class="cheat-toggle-btn ${s.infiniteAmmo ? 'active' : ''}">
            <span class="cheat-icon">♾️</span>
            <div class="cheat-info">
              <span class="cheat-name">INFINITE AMMO</span>
              <span class="cheat-desc">Bottomless clip, no reloading</span>
            </div>
            <span class="cheat-status">${s.infiniteAmmo ? 'ON' : 'OFF'}</span>
          </button>

          <!-- One Shot Kill -->
          <button id="chk-oneshot" class="cheat-toggle-btn ${s.oneShotKill ? 'active' : ''}">
            <span class="cheat-icon">💥</span>
            <div class="cheat-info">
              <span class="cheat-name">INSTA-KILL (9999 DMG)</span>
              <span class="cheat-desc">1 shot obliterates any bot</span>
            </div>
            <span class="cheat-status">${s.oneShotKill ? 'ON' : 'OFF'}</span>
          </button>

          <!-- Super Speed -->
          <button id="chk-speed" class="cheat-toggle-btn ${s.superSpeed ? 'active' : ''}">
            <span class="cheat-icon">⚡</span>
            <div class="cheat-info">
              <span class="cheat-name">FLASH SPEED (2.5X)</span>
              <span class="cheat-desc">Blistering operative movement</span>
            </div>
            <span class="cheat-status">${s.superSpeed ? 'ON' : 'OFF'}</span>
          </button>

          <!-- Moon Jump -->
          <button id="chk-jump" class="cheat-toggle-btn ${s.superJump ? 'active' : ''}">
            <span class="cheat-icon">🚀</span>
            <div class="cheat-info">
              <span class="cheat-name">MOON JUMP (3X)</span>
              <span class="cheat-desc">Leap onto rooftops & balconies</span>
            </div>
            <span class="cheat-status">${s.superJump ? 'ON' : 'OFF'}</span>
          </button>

          <!-- Aimbot -->
          <button id="chk-aimbot" class="cheat-toggle-btn ${s.aimbot ? 'active' : ''}">
            <span class="cheat-icon">🎯</span>
            <div class="cheat-info">
              <span class="cheat-name">AIMBOT AUTO-LOCK</span>
              <span class="cheat-desc">Magnetic headshot snap</span>
            </div>
            <span class="cheat-status">${s.aimbot ? 'ON' : 'OFF'}</span>
          </button>

          <!-- Wallhack ESP -->
          <button id="chk-wallhack" class="cheat-toggle-btn ${s.wallhack ? 'active' : ''}">
            <span class="cheat-icon">👁️</span>
            <div class="cheat-info">
              <span class="cheat-name">WALLHACK (X-RAY ESP)</span>
              <span class="cheat-desc">See bots through walls & buildings</span>
            </div>
            <span class="cheat-status">${s.wallhack ? 'ON' : 'OFF'}</span>
          </button>

          <!-- Freeze Bots -->
          <button id="chk-freeze" class="cheat-toggle-btn ${s.freezeBots ? 'active' : ''}">
            <span class="cheat-icon">🧊</span>
            <div class="cheat-info">
              <span class="cheat-name">FREEZE ENEMY BOTS</span>
              <span class="cheat-desc">Stop all enemy bots in place</span>
            </div>
            <span class="cheat-status">${s.freezeBots ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        <!-- Direct Action Cheats -->
        <div class="cheat-actions-row">
          <button id="btn-nuke" class="btn-tactical btn-danger">
            <span class="btn-text">💣 TACTICAL NUKE</span>
            <span class="btn-subtext">WIPE ALL BOTS INSTANTLY</span>
          </button>

          <button id="btn-heal" class="btn-tactical btn-primary">
            <span class="btn-text">🩹 FULL HEAL</span>
            <span class="btn-subtext">100 HP + 100 AP NOW</span>
          </button>
        </div>

        <button id="btn-close-cheats" class="btn-tactical btn-secondary btn-full">
          RESUME WITH CHEATS ACTIVE
        </button>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const bindToggle = (btnId: string, toggleFn: () => boolean) => {
      const btn = this.container.querySelector(btnId) as HTMLElement;
      if (!btn) return;
      btn.addEventListener('click', () => {
        const active = toggleFn();
        btn.classList.toggle('active', active);
        const statusSpan = btn.querySelector('.cheat-status') as HTMLElement;
        if (statusSpan) statusSpan.textContent = active ? 'ON' : 'OFF';
      });
    };

    bindToggle('#chk-godmode', () => this.cheatManager.toggleGodMode());
    bindToggle('#chk-infammo', () => this.cheatManager.toggleInfiniteAmmo());
    bindToggle('#chk-oneshot', () => this.cheatManager.toggleOneShotKill());
    bindToggle('#chk-speed', () => this.cheatManager.toggleSuperSpeed());
    bindToggle('#chk-jump', () => this.cheatManager.toggleSuperJump());
    bindToggle('#chk-aimbot', () => this.cheatManager.toggleAimbot());
    bindToggle('#chk-wallhack', () => this.cheatManager.toggleWallhack());
    bindToggle('#chk-freeze', () => this.cheatManager.toggleFreezeBots());

    const nukeBtn = this.container.querySelector('#btn-nuke')!;
    nukeBtn.addEventListener('click', () => {
      this.callbacks.onNuke();
    });

    const healBtn = this.container.querySelector('#btn-heal')!;
    healBtn.addEventListener('click', () => {
      this.callbacks.onHeal();
    });

    const closeBtn = this.container.querySelector('#btn-close-cheats')!;
    closeBtn.addEventListener('click', () => {
      this.setVisible(false);
      this.callbacks.onClose();
    });
  }

  public setVisible(visible: boolean): void {
    this.container.style.display = visible ? 'flex' : 'none';
  }

  public isVisible(): boolean {
    return this.container.style.display === 'flex';
  }
}
