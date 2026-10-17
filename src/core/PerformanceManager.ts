import * as THREE from 'three';

export class PerformanceManager {
  private domEl: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private isVisible: boolean = false;

  private frameCount: number = 0;
  private lastTime: number = performance.now();
  private fps: number = 60;
  private frameTime: number = 16.6;

  constructor(parent: HTMLElement, renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;

    this.domEl = document.createElement('div');
    this.domEl.id = 'perf-overlay';
    this.domEl.className = 'perf-overlay';
    this.domEl.style.display = 'none';
    parent.appendChild(this.domEl);
  }

  public setVisible(visible: boolean): void {
    this.isVisible = visible;
    this.domEl.style.display = visible ? 'block' : 'none';
  }

  public update(): void {
    if (!this.isVisible) return;

    this.frameCount++;
    const now = performance.now();
    const delta = now - this.lastTime;

    if (delta >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / delta);
      this.frameTime = parseFloat((delta / this.frameCount).toFixed(1));
      this.frameCount = 0;
      this.lastTime = now;

      const drawCalls = this.renderer.info.render.calls;
      const triangles = this.renderer.info.render.triangles;

      this.domEl.innerHTML = `
        <span class="perf-tag">FPS: ${this.fps}</span>
        <span class="perf-tag">${this.frameTime}ms</span>
        <span class="perf-tag">DC: ${drawCalls}</span>
        <span class="perf-tag">Δ: ${triangles}</span>
      `;
    }
  }
}
