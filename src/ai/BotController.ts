import * as THREE from 'three';
import { AudioManager } from '../core/AudioManager';
import { ParticleManager } from '../effects/ParticleManager';

export type BotState = 'PATROL' | 'ENGAGE' | 'RELOAD' | 'DEAD';

export class BotController {
  public id: string;
  public name: string;
  public mesh: THREE.Group;
  public headMesh: THREE.Mesh;
  public bodyMesh: THREE.Mesh;

  public position: THREE.Vector3 = new THREE.Vector3();
  public health: number = 100;
  public maxHealth: number = 100;
  public armor: number = 50;
  public isAlive: boolean = true;
  public state: BotState = 'PATROL';

  // Navigation & Combat
  private waypoints: THREE.Vector3[] = [];
  private currentWaypointIndex: number = 0;
  private moveSpeed: number = 3.6;
  private detectionRange: number = 42;
  private fovAngle: number = Math.PI * 0.75; // 135 deg viewcone
  private aimAccuracySpread: number = 0.08; // human-like inaccuracy
  private fireCooldown: number = 0;
  private burstCount: number = 0;
  private maxBurst: number = 4;
  private reactionDelay: number = 0.25;
  private reactionTimer: number = 0;
  private reloadTimer: number = 0;
  private respawnTimer: number = 0;

  // Visuals
  private baseColor = 0xb91c1c; // Omega Red
  private visorMat: THREE.MeshBasicMaterial;
  private bodyMat: THREE.MeshStandardMaterial;

  private scene: THREE.Scene;
  private audioManager: AudioManager;
  private particleManager: ParticleManager;
  private colliders: THREE.Box3[];

  constructor(
    id: string,
    name: string,
    spawnPos: THREE.Vector3,
    waypoints: THREE.Vector3[],
    scene: THREE.Scene,
    audioManager: AudioManager,
    particleManager: ParticleManager,
    colliders: THREE.Box3[]
  ) {
    this.id = id;
    this.name = name;
    this.waypoints = waypoints;
    this.scene = scene;
    this.audioManager = audioManager;
    this.particleManager = particleManager;
    this.colliders = colliders;

    // Create 3D Tactical Bot Mesh
    this.mesh = new THREE.Group();

    this.bodyMat = new THREE.MeshStandardMaterial({
      color: 0x242830,
      metalness: 0.6,
      roughness: 0.4
    });

    const armorVestMat = new THREE.MeshStandardMaterial({
      color: 0x8b1010, // Dark tactical red armor
      metalness: 0.4,
      roughness: 0.6
    });

    this.visorMat = new THREE.MeshBasicMaterial({
      color: 0xff2222 // Glowing red visor
    });

    // Torso / Body
    const bodyGeo = new THREE.BoxGeometry(0.5, 0.75, 0.3);
    this.bodyMesh = new THREE.Mesh(bodyGeo, armorVestMat);
    this.bodyMesh.position.set(0, 1.1, 0);
    this.bodyMesh.castShadow = true;
    (this.bodyMesh as any).botInstance = this;
    (this.bodyMesh as any).isHead = false;
    this.mesh.add(this.bodyMesh);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.2, 0.75, 0.22);
    const legL = new THREE.Mesh(legGeo, this.bodyMat);
    legL.position.set(-0.14, 0.38, 0);
    legL.castShadow = true;
    this.mesh.add(legL);

    const legR = new THREE.Mesh(legGeo, this.bodyMat);
    legR.position.set(0.14, 0.38, 0);
    legR.castShadow = true;
    this.mesh.add(legR);

    // Head (Separate mesh for Headshot Detection!)
    const headGeo = new THREE.BoxGeometry(0.28, 0.28, 0.28);
    this.headMesh = new THREE.Mesh(headGeo, this.bodyMat);
    this.headMesh.position.set(0, 1.62, 0);
    this.headMesh.castShadow = true;
    (this.headMesh as any).botInstance = this;
    (this.headMesh as any).isHead = true;
    this.mesh.add(this.headMesh);

    // Visor
    const visorGeo = new THREE.BoxGeometry(0.24, 0.08, 0.06);
    const visor = new THREE.Mesh(visorGeo, this.visorMat);
    visor.position.set(0, 1.62, 0.13);
    this.mesh.add(visor);

    // Bot Weapon (procedural carbine held in front)
    const gunGeo = new THREE.BoxGeometry(0.08, 0.1, 0.45);
    const gun = new THREE.Mesh(gunGeo, this.bodyMat);
    gun.position.set(0.22, 1.15, 0.25);
    this.mesh.add(gun);

    this.scene.add(this.mesh);
    this.spawn(spawnPos);
  }

  public spawn(pos: THREE.Vector3): void {
    this.position.copy(pos);
    this.mesh.position.copy(this.position);
    this.health = this.maxHealth;
    this.armor = 50;
    this.isAlive = true;
    this.state = 'PATROL';
    this.mesh.visible = true;
    this.mesh.rotation.set(0, Math.random() * Math.PI * 2, 0);
  }

  public takeDamage(amount: number, isHeadshot: boolean, attackerName: string): { killed: boolean; finalDamage: number } {
    if (!this.isAlive) return { killed: false, finalDamage: 0 };

    let damage = amount;
    if (isHeadshot) damage *= 2.2;

    // Armor absorption: absorbs 50% damage
    if (this.armor > 0) {
      const absorbed = Math.min(this.armor, damage * 0.5);
      this.armor -= absorbed;
      damage -= absorbed * 0.5;
    }

    this.health -= damage;

    // Flash body red
    this.flashHit();

    if (this.health <= 0) {
      this.die();
      return { killed: true, finalDamage: damage };
    }

    // Retaliate if damaged
    this.state = 'ENGAGE';
    return { killed: false, finalDamage: damage };
  }

  private flashHit(): void {
    this.bodyMat.color.setHex(0xffffff);
    setTimeout(() => {
      this.bodyMat.color.setHex(0x242830);
    }, 80);
  }

  public die(): void {
    this.isAlive = false;
    this.state = 'DEAD';
    this.respawnTimer = 4.0; // 4 second respawn delay
    this.audioManager.playElimination();

    // Death fall animation: tilt backward
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = 0.2;
  }

  public update(delta: number, playerPos: THREE.Vector3, onShootPlayer?: (dmg: number) => void): void {
    if (!this.isAlive) {
      this.respawnTimer -= delta;
      if (this.respawnTimer <= 0) {
        // Respawn at a waypoint
        const randWp = this.waypoints[Math.floor(Math.random() * this.waypoints.length)];
        this.mesh.rotation.x = 0;
        this.mesh.position.y = 0;
        this.spawn(randWp);
      }
      return;
    }

    // Update position sync
    this.position.set(this.mesh.position.x, 0, this.mesh.position.z);

    // Vector to player
    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.mesh.position);
    const distToPlayer = toPlayer.length();

    // Check Line of Sight
    const hasLOS = distToPlayer < this.detectionRange && this.checkLineOfSight(playerPos);

    if (hasLOS) {
      this.state = 'ENGAGE';
    } else if (this.state === 'ENGAGE') {
      // Lost sight, return to patrol after small search
      this.state = 'PATROL';
    }

    if (this.state === 'ENGAGE') {
      this.handleEngage(delta, playerPos, toPlayer, distToPlayer, onShootPlayer);
    } else if (this.state === 'PATROL') {
      this.handlePatrol(delta);
    }
  }

  private checkLineOfSight(targetPos: THREE.Vector3): boolean {
    const origin = new THREE.Vector3(this.mesh.position.x, 1.5, this.mesh.position.z);
    const dir = new THREE.Vector3().subVectors(targetPos, origin).normalize();
    const ray = new THREE.Ray(origin, dir);
    const dist = origin.distanceTo(targetPos);

    // Check against all static world colliders
    for (const box of this.colliders) {
      const hit = ray.intersectBox(box, new THREE.Vector3());
      if (hit && origin.distanceTo(hit) < dist - 0.5) {
        return false; // wall blocks line of sight
      }
    }
    return true;
  }

  private handleEngage(
    delta: number,
    playerPos: THREE.Vector3,
    toPlayer: THREE.Vector3,
    dist: number,
    onShootPlayer?: (dmg: number) => void
  ): void {
    // Face player
    const angle = Math.atan2(toPlayer.x, toPlayer.z);
    this.mesh.rotation.y = angle;

    // Tactical strafing / advance
    if (dist > 14) {
      const forward = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
      this.mesh.position.addScaledVector(forward, this.moveSpeed * 0.7 * delta);
    }

    // Fire logic
    this.fireCooldown -= delta;
    if (this.fireCooldown <= 0) {
      // Shoot at player
      this.fireWeapon(onShootPlayer, dist);
      this.burstCount++;

      if (this.burstCount >= this.maxBurst) {
        this.burstCount = 0;
        this.fireCooldown = 0.9 + Math.random() * 0.5; // burst pause
      } else {
        this.fireCooldown = 0.12; // automatic rate
      }
    }
  }

  private fireWeapon(onShootPlayer?: (dmg: number) => void, dist: number = 10): void {
    const muzzlePos = new THREE.Vector3(0.22, 1.15, 0.45).applyMatrix4(this.mesh.matrixWorld);
    this.particleManager.showMuzzleFlash(muzzlePos);
    this.audioManager.playGunshot('AR7');

    // Bot accuracy check based on distance
    const hitChance = Math.max(0.2, 0.75 - (dist / 40) * 0.4);
    if (Math.random() < hitChance) {
      if (onShootPlayer) {
        const damage = 10 + Math.floor(Math.random() * 8);
        onShootPlayer(damage);
      }
    }
  }

  private handlePatrol(delta: number): void {
    if (this.waypoints.length === 0) return;

    const targetWp = this.waypoints[this.currentWaypointIndex];
    const toWp = new THREE.Vector3().subVectors(targetWp, this.mesh.position);
    toWp.y = 0;
    const dist = toWp.length();

    if (dist < 1.5) {
      // Pick next waypoint
      this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
    } else {
      toWp.normalize();
      const angle = Math.atan2(toWp.x, toWp.z);
      this.mesh.rotation.y = angle;
      this.mesh.position.addScaledVector(toWp, this.moveSpeed * delta);
    }
  }
}
