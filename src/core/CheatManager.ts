import * as THREE from 'three';
import { CheatState } from '../types';
import { AudioManager } from './AudioManager';
import { BotManager } from '../ai/BotManager';

export class CheatManager {
  public state: CheatState = {
    godMode: false,
    infiniteAmmo: false,
    oneShotKill: false,
    superSpeed: false,
    superJump: false,
    aimbot: false,
    wallhack: false,
    freezeBots: false
  };

  private audioManager: AudioManager;
  private botManager: BotManager;
  private espHelpers: THREE.BoxHelper[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene, audioManager: AudioManager, botManager: BotManager) {
    this.scene = scene;
    this.audioManager = audioManager;
    this.botManager = botManager;
  }

  public toggleGodMode(): boolean {
    this.state.godMode = !this.state.godMode;
    this.audioManager.playElimination();
    return this.state.godMode;
  }

  public toggleInfiniteAmmo(): boolean {
    this.state.infiniteAmmo = !this.state.infiniteAmmo;
    this.audioManager.playReload('magIn');
    return this.state.infiniteAmmo;
  }

  public toggleOneShotKill(): boolean {
    this.state.oneShotKill = !this.state.oneShotKill;
    this.audioManager.playHitmarker(true);
    return this.state.oneShotKill;
  }

  public toggleSuperSpeed(): boolean {
    this.state.superSpeed = !this.state.superSpeed;
    this.audioManager.playFootstep();
    return this.state.superSpeed;
  }

  public toggleSuperJump(): boolean {
    this.state.superJump = !this.state.superJump;
    this.audioManager.playFootstep();
    return this.state.superJump;
  }

  public toggleAimbot(): boolean {
    this.state.aimbot = !this.state.aimbot;
    this.audioManager.playHitmarker(true);
    return this.state.aimbot;
  }

  public toggleWallhack(): boolean {
    this.state.wallhack = !this.state.wallhack;
    this.updateWallhackVisuals();
    return this.state.wallhack;
  }

  public toggleFreezeBots(): boolean {
    this.state.freezeBots = !this.state.freezeBots;
    this.audioManager.playEmptyClick();
    return this.state.freezeBots;
  }

  public nukeAllBots(onBotKilled: (bot: any) => void): number {
    let count = 0;
    for (const bot of this.botManager.bots) {
      if (bot.isAlive) {
        bot.takeDamage(9999, true, 'TACTICAL NUKE');
        onBotKilled(bot);
        count++;
      }
    }
    this.audioManager.playGunshot('LONGSHOT');
    return count;
  }

  public updateWallhackVisuals(): void {
    // Clear existing ESP helpers
    for (const helper of this.espHelpers) {
      this.scene.remove(helper);
      helper.dispose();
    }
    this.espHelpers = [];

    if (!this.state.wallhack) return;

    // Attach glowing X-ray wireframe bounding box helpers to every bot
    for (const bot of this.botManager.bots) {
      if (bot.isAlive) {
        const helper = new THREE.BoxHelper(bot.mesh, 0xff0055);
        (helper.material as THREE.LineBasicMaterial).depthTest = false; // RENDER THROUGH WALLS!
        (helper.material as THREE.LineBasicMaterial).transparent = true;
        (helper.material as THREE.LineBasicMaterial).opacity = 0.95;
        helper.renderOrder = 999;
        this.scene.add(helper);
        this.espHelpers.push(helper);
      }
    }
  }

  public update(delta: number): void {
    if (this.state.wallhack) {
      for (const helper of this.espHelpers) {
        helper.update();
      }
    }
  }

  public findAimbotTarget(cameraPos: THREE.Vector3, cameraDir: THREE.Vector3): THREE.Vector3 | null {
    if (!this.state.aimbot) return null;

    let closestDist = Infinity;
    let targetPos: THREE.Vector3 | null = null;

    for (const bot of this.botManager.bots) {
      if (!bot.isAlive) continue;

      const headPos = new THREE.Vector3().copy(bot.mesh.position);
      headPos.y += 1.62; // Aim directly at bot head

      const toTarget = new THREE.Vector3().subVectors(headPos, cameraPos);
      const dist = toTarget.length();
      toTarget.normalize();

      // Check if bot is generally in front of player
      const dot = cameraDir.dot(toTarget);
      if (dot > 0.5 && dist < closestDist) {
        closestDist = dist;
        targetPos = headPos;
      }
    }

    return targetPos;
  }
}
