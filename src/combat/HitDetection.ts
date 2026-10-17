import * as THREE from 'three';
import { HitResult } from '../types';
import { BotManager } from '../ai/BotManager';
import { ParticleManager } from '../effects/ParticleManager';
import { AudioManager } from '../core/AudioManager';

export class HitDetection {
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private botManager: BotManager;
  private particleManager: ParticleManager;
  private audioManager: AudioManager;
  private raycaster: THREE.Raycaster;

  constructor(
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    botManager: BotManager,
    particleManager: ParticleManager,
    audioManager: AudioManager
  ) {
    this.camera = camera;
    this.scene = scene;
    this.botManager = botManager;
    this.particleManager = particleManager;
    this.audioManager = audioManager;
    this.raycaster = new THREE.Raycaster();
  }

  public fireRaycast(spread: number, range: number, muzzleWorldPos: THREE.Vector3): HitResult {
    // Center of screen (0, 0 in NDC)
    const rayDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);

    // Apply spread perturbation
    if (spread > 0) {
      const spreadX = (Math.random() - 0.5) * spread;
      const spreadY = (Math.random() - 0.5) * spread;
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
      rayDir.addScaledVector(right, spreadX);
      rayDir.addScaledVector(up, spreadY);
      rayDir.normalize();
    }

    this.raycaster.set(this.camera.position, rayDir);
    this.raycaster.far = range;

    // Intersect the scene
    const hits = this.raycaster.intersectObjects(this.scene.children, true);

    let finalHit: THREE.Intersection | null = null;
    let hitBotInstance: any = null;
    let isHead = false;

    for (const h of hits) {
      // Ignore invisible meshes
      if (!h.object.visible) continue;
      // Ignore weapon models attached to camera
      if (this.isDescendantOf(h.object, this.camera)) continue;
      // Ignore vehicle meshes (so buggy never blocks gun shots)
      if ((h.object as any).isVehicle || this.hasAncestorFlag(h.object, 'isVehicle')) continue;

      // Check if this object or any parent belongs to a bot
      let curr: THREE.Object3D | null = h.object;
      let foundBot: any = null;
      let foundHead = false;

      while (curr && curr !== this.scene) {
        if ((curr as any).botInstance) {
          foundBot = (curr as any).botInstance;
        }
        if ((curr as any).isHead === true) {
          foundHead = true;
        }
        curr = curr.parent;
      }

      finalHit = h;
      if (foundBot && foundBot.isAlive) {
        hitBotInstance = foundBot;
        isHead = foundHead;
      }
      break;
    }

    if (finalHit) {
      const hitPoint = finalHit.point;
      const hitNormal = finalHit.face ? finalHit.face.normal.clone().applyQuaternion(finalHit.object.quaternion) : new THREE.Vector3(0, 1, 0);

      // Create bullet tracer from gun muzzle to impact
      this.particleManager.createTracer(muzzleWorldPos, hitPoint);

      // Create impact sparks / blood
      const isFlesh = hitBotInstance !== null;
      this.particleManager.createImpactEffect(hitPoint, hitNormal, isFlesh);

      if (isFlesh) {
        this.audioManager.playHitmarker(isHead);
      }

      return {
        hit: true,
        point: hitPoint,
        normal: hitNormal,
        distance: finalHit.distance,
        target: hitBotInstance,
        isHeadshot: isHead
      };
    } else {
      // Ray went into distance
      const farPoint = new THREE.Vector3().copy(this.camera.position).addScaledVector(rayDir, range);
      this.particleManager.createTracer(muzzleWorldPos, farPoint);
      return { hit: false };
    }
  }

  private isDescendantOf(child: THREE.Object3D, parent: THREE.Object3D): boolean {
    let curr = child.parent;
    while (curr) {
      if (curr === parent) return true;
      curr = curr.parent;
    }
    return false;
  }

  private hasAncestorFlag(child: THREE.Object3D, flag: string): boolean {
    let curr = child.parent;
    while (curr) {
      if ((curr as any)[flag] === true) return true;
      curr = curr.parent;
    }
    return false;
  }
}
