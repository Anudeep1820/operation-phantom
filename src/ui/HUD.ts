import { PlayerStats, WeaponStats, KillFeedEntry } from '../types';

export class HUD {
  private container: HTMLElement;
  private healthValEl!: HTMLElement;
  private healthFillEl!: HTMLElement;
  private armorValEl!: HTMLElement;
  private armorFillEl!: HTMLElement;
  private ammoValEl!: HTMLElement;
  private reserveValEl!: HTMLElement;
  private weaponNameEl!: HTMLElement;
  private crosshairEl!: HTMLElement;
  private sniperScopeEl!: HTMLElement;
  private reflexSightEl!: HTMLElement;
  private hitmarkerEl!: HTMLElement;
  private damageFlashEl!: HTMLElement;
  private totemFlashEl!: HTMLElement;
  private matchTimerEl!: HTMLElement;
  private scoreAlphaEl!: HTMLElement;
  private scoreOmegaEl!: HTMLElement;
  private killFeedEl!: HTMLElement;
  private deathOverlayEl!: HTMLElement;
  private deathCountdownEl!: HTMLElement;
  private damageNumbersContainer!: HTMLElement;
  private vehiclePromptEl!: HTMLElement;
  private vehiclePromptText!: HTMLElement;
  private totemBadgeEl!: HTMLElement;

  private hitmarkerTimeout: number | null = null;
  private alphaTapCount: number = 0;
  private alphaTapTimer: number = 0;

  public onOpenCheats: (() => void) | null = null;
  public onPauseGame: (() => void) | null = null;
  public onVehicleInteract: (() => void) | null = null;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'hud-layer';
    this.container.className = 'hud-layer';
    parent.appendChild(this.container);

    this.buildHUD();
  }

  private buildHUD(): void {
    this.container.innerHTML = `
      <!-- Match Header Bar -->
      <div class="hud-top-match-bar">
        <!-- Secret Cheat Trigger on ALPHA pill (Triple-tap) -->
        <div id="score-alpha-box" class="team-score alpha" title="Alpha Squad">
          <span class="team-tag">ALPHA</span>
          <span id="score-alpha" class="score-num">0</span>
        </div>
        <div class="match-time-box">
          <span id="match-timer" class="match-timer">05:00</span>
          <span class="mode-tag">OPEN WORLD COMBAT</span>
        </div>
        <div class="team-score omega">
          <span id="score-omega" class="score-num">0</span>
          <span class="team-tag">OMEGA</span>
        </div>
        <!-- Prominent In-Game Pause Button -->
        <button id="btn-hud-pause" class="hud-pause-btn" aria-label="Pause Game">
          ⏸ PAUSE
        </button>
      </div>

      <!-- Top Right Kill Feed -->
      <div id="kill-feed" class="kill-feed-container"></div>

      <!-- Damage Direction Flash -->
      <div id="damage-flash" class="damage-flash"></div>

      <!-- Golden Totem of Undying Revival Flash -->
      <div id="totem-flash" class="totem-flash"></div>

      <!-- Floating Damage Numbers Container -->
      <div id="damage-numbers-container" class="damage-numbers-container"></div>

      <!-- Center Crosshair -->
      <div id="hud-crosshair" class="hud-crosshair">
        <div class="ch-bar ch-top"></div>
        <div class="ch-bar ch-bottom"></div>
        <div class="ch-bar ch-left"></div>
        <div class="ch-bar ch-right"></div>
        <div class="ch-dot"></div>
      </div>

      <!-- Sniper Scope Tactical Overlay (Longshot) -->
      <div id="sniper-scope-overlay" class="sniper-scope-overlay">
        <div class="scope-cross-h"></div>
        <div class="scope-cross-v"></div>
        <div class="scope-circle"></div>
        <div class="scope-red-dot"></div>
        <div class="scope-ticks-left"></div>
        <div class="scope-ticks-right"></div>
      </div>

      <!-- Holographic / Reflex Sight Overlay (AR-7 Striker & Viper-9 ADS) -->
      <div id="reflex-sight-overlay" class="reflex-sight-overlay" style="display: none;">
        <div class="reflex-reticle">
          <div class="reflex-ring"></div>
          <div class="reflex-dot"></div>
          <div class="reflex-tick reflex-tick-t"></div>
          <div class="reflex-tick reflex-tick-b"></div>
          <div class="reflex-tick reflex-tick-l"></div>
          <div class="reflex-tick reflex-tick-r"></div>
        </div>
      </div>

      <!-- Hitmarker Feedback -->
      <div id="hud-hitmarker" class="hud-hitmarker">
        <div class="hm-line hm-tl"></div>
        <div class="hm-line hm-tr"></div>
        <div class="hm-line hm-bl"></div>
        <div class="hm-line hm-br"></div>
      </div>

      <!-- Vehicle Interaction Prompt -->
      <div id="vehicle-prompt" class="vehicle-prompt" style="display: none;">
        <span class="vp-badge">[E]</span>
        <span id="vp-text" class="vp-text">DRIVE TACTICAL BUGGY</span>
      </div>

      <!-- Elimination Death Screen Overlay -->
      <div id="death-overlay" class="death-overlay" style="display: none;">
        <div class="death-card">
          <div class="death-skull">💀</div>
          <h2 class="death-title">OPERATIVE DOWN</h2>
          <p class="death-sub">ELIMINATED IN ACTION</p>
          <div class="death-timer-box">
            <span>TACTICAL RESPAWN IN</span>
            <span id="death-countdown" class="death-countdown">3.0s</span>
          </div>
        </div>
      </div>

      <!-- Bottom Status Cluster -->
      <div class="hud-bottom-bar">
        <!-- Health, Armor & Totem Panel -->
        <div class="hud-vitals-panel">
          <div class="vital-row health-row">
            <div class="vital-label">HP</div>
            <div class="vital-bar-track">
              <div id="health-fill" class="vital-bar-fill health-fill" style="width: 100%"></div>
            </div>
            <div id="health-val" class="vital-val">100</div>
          </div>
          <div class="vital-row armor-row">
            <div class="vital-label">AP</div>
            <div class="vital-bar-track">
              <div id="armor-fill" class="vital-bar-fill armor-fill" style="width: 100%"></div>
            </div>
            <div id="armor-val" class="vital-val">100</div>
          </div>
          <!-- Totem of Undying Indicator -->
          <div id="totem-badge" class="totem-badge active">
            <span class="totem-icon">⚚</span>
            <span class="totem-label">TOTEM OF UNDYING READY</span>
          </div>
        </div>

        <!-- Weapon & Ammo Panel -->
        <div class="hud-ammo-panel">
          <div id="hud-weapon-name" class="weapon-name">AR-7 STRIKER</div>
          <div class="ammo-count-box">
            <span id="ammo-val" class="ammo-current">30</span>
            <span class="ammo-slash">/</span>
            <span id="reserve-val" class="ammo-reserve">120</span>
          </div>
        </div>
      </div>
    `;

    this.healthValEl = this.container.querySelector('#health-val')!;
    this.healthFillEl = this.container.querySelector('#health-fill')!;
    this.armorValEl = this.container.querySelector('#armor-val')!;
    this.armorFillEl = this.container.querySelector('#armor-fill')!;
    this.ammoValEl = this.container.querySelector('#ammo-val')!;
    this.reserveValEl = this.container.querySelector('#reserve-val')!;
    this.weaponNameEl = this.container.querySelector('#hud-weapon-name')!;
    this.crosshairEl = this.container.querySelector('#hud-crosshair')!;
    this.sniperScopeEl = this.container.querySelector('#sniper-scope-overlay')!;
    this.reflexSightEl = this.container.querySelector('#reflex-sight-overlay')!;
    this.hitmarkerEl = this.container.querySelector('#hud-hitmarker')!;
    this.damageFlashEl = this.container.querySelector('#damage-flash')!;
    this.totemFlashEl = this.container.querySelector('#totem-flash')!;
    this.matchTimerEl = this.container.querySelector('#match-timer')!;
    this.scoreAlphaEl = this.container.querySelector('#score-alpha')!;
    this.scoreOmegaEl = this.container.querySelector('#score-omega')!;
    this.killFeedEl = this.container.querySelector('#kill-feed')!;
    this.deathOverlayEl = this.container.querySelector('#death-overlay')!;
    this.deathCountdownEl = this.container.querySelector('#death-countdown')!;
    this.damageNumbersContainer = this.container.querySelector('#damage-numbers-container')!;
    this.vehiclePromptEl = this.container.querySelector('#vehicle-prompt')!;
    this.vehiclePromptText = this.container.querySelector('#vp-text')!;
    this.totemBadgeEl = this.container.querySelector('#totem-badge')!;

    // Prominent In-Game Pause Button
    const pauseBtn = this.container.querySelector('#btn-hud-pause') as HTMLElement;
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        if (this.onPauseGame) this.onPauseGame();
      });
    }

    // Vehicle Prompt Click (for mobile touch interaction!)
    this.vehiclePromptEl.addEventListener('click', () => {
      if (this.onVehicleInteract) this.onVehicleInteract();
    });

    // SECRET CHEAT TRIGGER: Triple-tap ALPHA pill within 1.2 seconds!
    const alphaBox = this.container.querySelector('#score-alpha-box') as HTMLElement;
    if (alphaBox) {
      alphaBox.addEventListener('click', () => {
        const now = Date.now();
        if (now - this.alphaTapTimer < 1200) {
          this.alphaTapCount++;
          if (this.alphaTapCount >= 3) {
            this.alphaTapCount = 0;
            if (this.onOpenCheats) this.onOpenCheats();
          }
        } else {
          this.alphaTapCount = 1;
        }
        this.alphaTapTimer = now;
      });
    }
  }

  public showVehiclePrompt(text: string): void {
    this.vehiclePromptEl.style.display = 'flex';
    this.vehiclePromptText.textContent = text;
  }

  public hideVehiclePrompt(): void {
    this.vehiclePromptEl.style.display = 'none';
  }

  public triggerTotemRevival(): void {
    this.totemFlashEl.classList.add('flash');
    this.totemBadgeEl.className = 'totem-badge consumed';
    this.totemBadgeEl.innerHTML = `<span class="totem-icon">✖</span><span class="totem-label">TOTEM CONSUMED</span>`;
    setTimeout(() => {
      this.totemFlashEl.classList.remove('flash');
    }, 600);
  }

  public resetTotemBadge(): void {
    this.totemBadgeEl.className = 'totem-badge active';
    this.totemBadgeEl.innerHTML = `<span class="totem-icon">⚚</span><span class="totem-label">TOTEM OF UNDYING READY</span>`;
  }

  public setTotemActive(active: boolean): void {
    if (active) {
      this.resetTotemBadge();
    } else {
      this.totemBadgeEl.className = 'totem-badge consumed';
      this.totemBadgeEl.innerHTML = `<span class="totem-icon">✖</span><span class="totem-label">TOTEM CONSUMED</span>`;
    }
  }

  public updateActiveCheats(_activeCheats: string[]): void {
    // Hidden from public HUD view as requested
  }

  public updateVitals(stats: PlayerStats): void {
    const hp = Math.max(0, Math.round(stats.health));
    const ap = Math.max(0, Math.round(stats.armor));

    this.healthValEl.textContent = `${hp}`;
    this.healthFillEl.style.width = `${(hp / stats.maxHealth) * 100}%`;

    this.armorValEl.textContent = `${ap}`;
    this.armorFillEl.style.width = `${(ap / stats.maxArmor) * 100}%`;
  }

  public updateWeapon(weapon: WeaponStats, currentAmmo: number, reserveAmmo: number, isADS: boolean): void {
    this.weaponNameEl.textContent = weapon.name.toUpperCase();
    this.ammoValEl.textContent = `${currentAmmo}`;
    this.reserveValEl.textContent = `${reserveAmmo}`;

    if (isADS) {
      if (weapon.id === 'LONGSHOT') {
        // High-Magnification Sniper Scope
        this.sniperScopeEl.style.display = 'block';
        this.reflexSightEl.style.display = 'none';
        this.crosshairEl.style.display = 'none';
      } else {
        // Holographic Red Dot Reflex Sight for AR-7 Striker & Viper-9!
        this.sniperScopeEl.style.display = 'none';
        this.reflexSightEl.style.display = 'flex';
        this.crosshairEl.style.display = 'none';

        if (weapon.id === 'VIPER9') {
          this.reflexSightEl.classList.add('green-optic');
        } else {
          this.reflexSightEl.classList.remove('green-optic');
        }
      }
    } else {
      this.sniperScopeEl.style.display = 'none';
      this.reflexSightEl.style.display = 'none';
      this.crosshairEl.style.display = 'block';
    }
  }

  public updateCrosshairSpread(spreadPx: number): void {
    const offset = Math.max(5, Math.min(32, spreadPx));
    const top = this.crosshairEl.querySelector('.ch-top') as HTMLElement;
    const bottom = this.crosshairEl.querySelector('.ch-bottom') as HTMLElement;
    const left = this.crosshairEl.querySelector('.ch-left') as HTMLElement;
    const right = this.crosshairEl.querySelector('.ch-right') as HTMLElement;

    if (top) top.style.transform = `translate(-50%, -${offset}px)`;
    if (bottom) bottom.style.transform = `translate(-50%, ${offset}px)`;
    if (left) left.style.transform = `translate(-${offset}px, -50%)`;
    if (right) right.style.transform = `translate(${offset}px, -50%)`;
  }

  public triggerHitmarker(isHeadshot: boolean): void {
    if (this.hitmarkerTimeout) {
      clearTimeout(this.hitmarkerTimeout);
    }
    this.hitmarkerEl.className = `hud-hitmarker active ${isHeadshot ? 'critical' : ''}`;
    this.hitmarkerTimeout = window.setTimeout(() => {
      this.hitmarkerEl.className = 'hud-hitmarker';
    }, 130);
  }

  public showDamageNumber(damage: number, isHeadshot: boolean): void {
    const el = document.createElement('div');
    el.className = `dmg-number ${isHeadshot ? 'headshot' : ''}`;
    el.textContent = isHeadshot ? `-${Math.round(damage)} CRITICAL!` : `-${Math.round(damage)}`;

    const rx = (Math.random() - 0.5) * 80;
    const ry = -30 - Math.random() * 40;
    el.style.transform = `translate(${rx}px, ${ry}px)`;

    this.damageNumbersContainer.appendChild(el);
    setTimeout(() => {
      el.remove();
    }, 700);
  }

  public triggerDamageFlash(): void {
    this.damageFlashEl.classList.add('flash');
    setTimeout(() => {
      this.damageFlashEl.classList.remove('flash');
    }, 220);
  }

  public showDeathOverlay(countdownSec: number): void {
    this.deathOverlayEl.style.display = 'flex';
    this.deathCountdownEl.textContent = `${countdownSec.toFixed(1)}s`;
    this.crosshairEl.style.display = 'none';
    this.sniperScopeEl.style.display = 'none';
    this.reflexSightEl.style.display = 'none';
  }

  public hideDeathOverlay(): void {
    this.deathOverlayEl.style.display = 'none';
    this.crosshairEl.style.display = 'block';
  }

  public updateMatchInfo(timeRemainingSec: number, alphaScore: number, omegaScore: number): void {
    const mins = Math.floor(timeRemainingSec / 60);
    const secs = Math.floor(timeRemainingSec % 60);
    this.matchTimerEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    this.scoreAlphaEl.textContent = `${alphaScore}`;
    this.scoreOmegaEl.textContent = `${omegaScore}`;
  }

  public addKillFeedEntry(entry: KillFeedEntry): void {
    const el = document.createElement('div');
    el.className = `kill-feed-row ${entry.isPlayerKill ? 'player-kill' : ''}`;
    el.innerHTML = `
      <span class="kf-killer">${entry.killer}</span>
      <span class="kf-icon">[${entry.weapon}]</span>
      ${entry.isHeadshot ? '<span class="kf-hs">🎯</span>' : ''}
      <span class="kf-victim">${entry.victim}</span>
    `;
    this.killFeedEl.prepend(el);

    setTimeout(() => {
      el.classList.add('fade-out');
      setTimeout(() => el.remove(), 400);
    }, 4000);
  }

  public setVisible(visible: boolean): void {
    this.container.style.display = visible ? 'block' : 'none';
  }
}
