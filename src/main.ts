import './styles/main.css';
import { Game } from './app/Game';

window.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.getElementById('app');
  if (!appContainer) {
    console.error('Failed to locate #app container element.');
    return;
  }

  // Check WebGL Support
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      showFatalError('WebGL is not supported or enabled on your browser. Please use a WebGL-compatible browser.');
      return;
    }
  } catch (e) {
    showFatalError('Failed to initialize WebGL graphics context.');
    return;
  }

  // Initialize Game
  try {
    const game = new Game(appContainer);
    (window as any).__PHANTOM_GAME__ = game;
  } catch (err) {
    console.error('Fatal initialization error:', err);
    showFatalError(`An unexpected error occurred during tactical deployment: ${err}`);
  }
});

function showFatalError(msg: string): void {
  const errorOverlay = document.createElement('div');
  errorOverlay.className = 'menu-layer';
  errorOverlay.innerHTML = `
    <div class="menu-card tactical-frame" style="border-color: #ef4444;">
      <h2 style="color: #ef4444; font-size: 2rem;">HARDWARE / BROWSER INCOMPATIBILITY</h2>
      <p style="color: #cbd5e1; margin: 16px 0;">${msg}</p>
      <button class="btn-tactical btn-secondary" onclick="location.reload()">RETRY INITIALIZATION</button>
    </div>
  `;
  document.body.appendChild(errorOverlay);
}
