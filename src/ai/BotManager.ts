import * as THREE from 'three';
import { BotController } from './BotController';
import { AudioManager } from '../core/AudioManager';
import { ParticleManager } from '../effects/ParticleManager';

export class BotManager {
  public bots: BotController[] = [];
  private scene: THREE.Scene;
  private audioManager: AudioManager;
  private particleManager: ParticleManager;
  private colliders: THREE.Box3[];

  constructor(
    scene: THREE.Scene,
    audioManager: AudioManager,
    particleManager: ParticleManager,
    colliders: THREE.Box3[]
  ) {
    this.scene = scene;
    this.audioManager = audioManager;
    this.particleManager = particleManager;
    this.colliders = colliders;
  }

  public initBots(spawns: THREE.Vector3[], waypoints: THREE.Vector3[], count: number = 4): void {
    // Clear existing
    this.clear();

    const botNames = ['Wraith-01', 'Specter-02', 'Vandal-03', 'Apex-04'];
    for (let i = 0; i < Math.min(count, spawns.length); i++) {
      // Offset waypoints slightly per bot for distinct routes
      const botWaypoints = [...waypoints].sort(() => Math.random() - 0.5);
      const bot = new BotController(
        `bot-${i}`,
        botNames[i] || `Omega-0${i + 1}`,
        spawns[i],
        botWaypoints,
        this.scene,
        this.audioManager,
        this.particleManager,
        this.colliders
      );
      this.bots.push(bot);
    }
  }

  public getBots(): BotController[] {
    return this.bots;
  }

  public getTargetMeshes(): THREE.Mesh[] {
    const meshes: THREE.Mesh[] = [];
    for (const b of this.bots) {
      if (b.isAlive) {
        meshes.push(b.headMesh);
        meshes.push(b.bodyMesh);
      }
    }
    return meshes;
  }

  private nextAllowedFireTime: number = 0;

  public update(delta: number, playerPos: THREE.Vector3, onShootPlayer?: (dmg: number) => void, isFrozen: boolean = false): void {
    const now = performance.now() / 1000;
    let tokenClaimed = false;

    for (const b of this.bots) {
      // Only 1 bot can shoot during this tick if the global cooldown has elapsed
      const canShoot = !tokenClaimed && (now >= this.nextAllowedFireTime);

      b.update(delta, playerPos, (dmg) => {
        if (onShootPlayer) onShootPlayer(dmg);
        // Stagger next bot fire by 0.6s to 0.9s
        this.nextAllowedFireTime = now + 0.65;
        tokenClaimed = true;
      }, isFrozen, canShoot);
    }
  }

  public clear(): void {
    for (const b of this.bots) {
      this.scene.remove(b.mesh);
    }
    this.bots = [];
  }
}
