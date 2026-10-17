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
  private hitmarkerEl!: HTMLElement;
  private damageFlashEl!: HTMLElement;
  private matchTimerEl!: HTMLElement;
  private scoreAlphaEl!: HTMLElement;
  private scoreOmegaEl!: HTMLElement;
  private killFeedEl!: HTMLElement;
  private deathOverlayEl!: HTMLElement;
  private deathCountdownEl!: HTMLElement;
  private damageNumbersContainer!: HTMLElement;

  private hitmarkerTimeout: number | null = null;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'hud-layer';
    this.container.className = 'hud-layer';
    parent.appendChild(this.container);

    this.buildHUD();
  }

  private buildHUD(): void {
    this.container.innerHTML = `
      <!-- Match Header -->
      <div class="hud-top-match-bar">
        <div class="team-score alpha">
          <span class="team-tag">ALPHA</span>
          <span id="score-alpha" class="score-num">0</span>
        </div>
        <div class="match-time-box">
          <span id="match-timer" class="match-timer">05:00</span>
          <span class="mode-tag">SKIRMISH</span>
        </div>
        <div class="team-score omega">
          <span id="score-omega" class="score-num">0</span>
          <span class="team-tag">OMEGA</span>
        </div>
      </div>

      <!-- Top Right Kill Feed -->
      <div id="kill-feed" class="kill-feed-container"></div>

      <!-- Damage Direction Flash -->
      <div id="damage-flash" class="damage-flash"></div>

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

      <!-- Sniper Scope Overlay -->
      <div id="sniper-scope-overlay" class="sniper-scope-overlay">
        <div class="scope-cross-h"></div>
        <div class="scope-cross-v"></div>
        <div class="scope-circle"></div>
      </div>

      <!-- Hitmarker Feedback -->
      <div id="hud-hitmarker" class="hud-hitmarker">
        <div class="hm-line hm-tl"></div>
        <div class="hm-line hm-tr"></div>
        <div class="hm-line hm-bl"></div>
        <div class="hm-line hm-br"></div>
      </div>

      <!-- Elimination Death Screen Overlay -->
      <div id="death-overlay" class="death-overlay" style="display: none;">
        <div class="death-card">
          <div class="death-skull">💀</div>
          <h2 class="death-title">OPERATIVE DOWN</h2>
          <p class="death-sub">ELIMINATED IN ACTION</p>
          <div class="death-timer-box">
            <span>RESPAWNING IN</span>
            <span id="death-countdown" class="death-countdown">3.0s</span>
          </div>
        </div>
      </div>

      <!-- Bottom Status Cluster -->
      <div class="hud-bottom-bar">
        <!-- Health & Armor Panel -->
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
    this.hitmarkerEl = this.container.querySelector('#hud-hitmarker')!;
    this.damageFlashEl = this.container.querySelector('#damage-flash')!;
    this.matchTimerEl = this.container.querySelector('#match-timer')!;
    this.scoreAlphaEl = this.container.querySelector('#score-alpha')!;
    this.scoreOmegaEl = this.container.querySelector('#score-omega')!;
    this.killFeedEl = this.container.querySelector('#kill-feed')!;
    this.deathOverlayEl = this.container.querySelector('#death-overlay')!;
    this.deathCountdownEl = this.container.querySelector('#death-countdown')!;
    this.damageNumbersContainer = this.container.querySelector('#damage-numbers-container')!;
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

    // Sniper scope visibility
    if (weapon.id === 'LONGSHOT' && isADS) {
      this.sniperScopeEl.style.display = 'block';
      this.crosshairEl.style.display = 'none';
    } else {
      this.sniperScopeEl.style.display = 'none';
      this.crosshairEl.style.display = isADS ? 'none' : 'block';
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
    el.textContent = isHeadshot ? `-${Math.round(damage)} HEADSHOT!` : `-${Math.round(damage)}`;

    // Randomize initial position around center reticle
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
