import { PlayerStats } from '../types';

export interface MatchResultsCallbacks {
  onRestart: () => void;
  onMainMenu: () => void;
  onResume?: () => void;
  onOpenSettings?: () => void;
}

export class MatchResults {
  private container: HTMLElement;
  private pauseContainer: HTMLElement;
  private callbacks: MatchResultsCallbacks;

  constructor(parent: HTMLElement, callbacks: MatchResultsCallbacks) {
    this.callbacks = callbacks;

    // Results container
    this.container = document.createElement('div');
    this.container.id = 'match-results-layer';
    this.container.className = 'menu-layer';
    this.container.style.display = 'none';
    parent.appendChild(this.container);

    // Pause container
    this.pauseContainer = document.createElement('div');
    this.pauseContainer.id = 'pause-menu-layer';
    this.pauseContainer.className = 'menu-layer';
    this.pauseContainer.style.display = 'none';
    parent.appendChild(this.pauseContainer);

    this.buildPauseUI();
  }

  private buildPauseUI(): void {
    this.pauseContainer.innerHTML = `
      <div class="menu-card tactical-frame pause-card">
        <h2 class="pause-title">COMBAT SUSPENDED</h2>
        <div class="pause-actions">
          <button id="btn-pause-resume" class="btn-tactical btn-primary">RESUME MISSION</button>
          <button id="btn-pause-settings" class="btn-tactical btn-secondary">SETTINGS</button>
          <button id="btn-pause-abort" class="btn-tactical btn-danger">ABORT TO MENU</button>
        </div>
      </div>
    `;

    const resumeBtn = this.pauseContainer.querySelector('#btn-pause-resume')!;
    resumeBtn.addEventListener('click', () => {
      this.hidePause();
      if (this.callbacks.onResume) this.callbacks.onResume();
    });

    const settingsBtn = this.pauseContainer.querySelector('#btn-pause-settings')!;
    settingsBtn.addEventListener('click', () => {
      if (this.callbacks.onOpenSettings) this.callbacks.onOpenSettings();
    });

    const abortBtn = this.pauseContainer.querySelector('#btn-pause-abort')!;
    abortBtn.addEventListener('click', () => {
      this.hidePause();
      this.callbacks.onMainMenu();
    });
  }

  public showResults(isVictory: boolean, stats: PlayerStats, alphaScore: number, omegaScore: number): void {
    const accuracyPct = stats.accuracy.shotsFired > 0
      ? Math.round((stats.accuracy.shotsHit / stats.accuracy.shotsFired) * 100)
      : 0;
    const kd = stats.deaths > 0 ? (stats.kills / stats.deaths).toFixed(2) : stats.kills.toFixed(2);

    this.container.innerHTML = `
      <div class="menu-card tactical-frame results-card ${isVictory ? 'victory' : 'defeat'}">
        <div class="results-banner">
          <span class="outcome-tag">${isVictory ? 'MISSION ACCOMPLISHED' : 'MISSION FAILED'}</span>
          <h1 class="outcome-title">${isVictory ? 'VICTORY' : 'DEFEAT'}</h1>
          <div class="match-score-summary">ALPHA: ${alphaScore} — OMEGA: ${omegaScore}</div>
        </div>

        <div class="results-stats-grid">
          <div class="stat-box">
            <span class="stat-label">ELIMINATIONS</span>
            <span class="stat-num">${stats.kills}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">DEATHS</span>
            <span class="stat-num">${stats.deaths}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">K/D RATIO</span>
            <span class="stat-num">${kd}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">HEADSHOTS</span>
            <span class="stat-num">${stats.headshots}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">ACCURACY</span>
            <span class="stat-num">${accuracyPct}%</span>
          </div>
        </div>

        <div class="results-actions">
          <button id="btn-results-restart" class="btn-tactical btn-primary">REDEPLOY (PLAY AGAIN)</button>
          <button id="btn-results-menu" class="btn-tactical btn-secondary">MAIN MENU</button>
        </div>
      </div>
    `;

    const restartBtn = this.container.querySelector('#btn-results-restart')!;
    restartBtn.addEventListener('click', () => {
      this.container.style.display = 'none';
      this.callbacks.onRestart();
    });

    const menuBtn = this.container.querySelector('#btn-results-menu')!;
    menuBtn.addEventListener('click', () => {
      this.container.style.display = 'none';
      this.callbacks.onMainMenu();
    });

    this.container.style.display = 'flex';
  }

  public showPause(): void {
    this.pauseContainer.style.display = 'flex';
  }

  public hidePause(): void {
    this.pauseContainer.style.display = 'none';
  }

  public hideResults(): void {
    this.container.style.display = 'none';
  }
}
