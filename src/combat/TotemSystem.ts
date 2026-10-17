import * as THREE from 'three';
import { AudioManager } from '../core/AudioManager';

export class TotemSystem {
  public hasTotem: boolean = true;
  public isInvulnerable: boolean = false;
  private invulnerableTimer: number = 0;
  private audioManager: AudioManager;

  constructor(audioManager: AudioManager) {
    this.audioManager = audioManager;
  }

  public reset(): void {
    this.hasTotem = true;
    this.isInvulnerable = false;
    this.invulnerableTimer = 0;
  }

  /**
   * Called when player takes lethal damage.
   * Returns true if Totem saved the player from death!
   */
  public triggerTotem(): boolean {
    if (!this.hasTotem) return false;

    // Consume totem
    this.hasTotem = false;
    this.isInvulnerable = true;
    this.invulnerableTimer = 3.5; // 3.5s golden immunity

    // Play celestial revival sound
    this.audioManager.playElimination();

    return true;
  }

  public update(delta: number): void {
    if (this.isInvulnerable) {
      this.invulnerableTimer -= delta;
      if (this.invulnerableTimer <= 0) {
        this.isInvulnerable = false;
      }
    }
  }
}
