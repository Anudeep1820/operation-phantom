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

  // Animation joints
  private leftLeg!: THREE.Group;
  private rightLeg!: THREE.Group;
  private leftArm!: THREE.Group;
  private rightArm!: THREE.Group;
  private walkCycle: number = 0;

  // Navigation & Combat
  private waypoints: THREE.Vector3[] = [];
  private currentWaypointIndex: number = 0;
  private moveSpeed: number = 3.6;
  private detectionRange: number = 50;
  private aimAccuracySpread: number = 0.12; // Realistic human aim error
  private fireCooldown: number = 0;
  private reactionDelayTimer: number = 0.7; // Human reaction delay before firing!
  private respawnTimer: number = 0;

  // Visuals
  private vestMat: THREE.MeshStandardMaterial;
  private uniformMat: THREE.MeshStandardMaterial;

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

    this.mesh = new THREE.Group();

    // High quality military materials
    this.uniformMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Tactical slate camo
      roughness: 0.75,
      metalness: 0.2
    });

    this.vestMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b, // Dark crimson tactical armor vest
      roughness: 0.5,
      metalness: 0.5
    });

    const armorPlateMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.8
    });

    const helmetMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.7
    });

    const visorGlowMat = new THREE.MeshBasicMaterial({
      color: 0xff3b3b // Glowing red optics
    });

    // 1. Torso & Ballistic Plate Carrier
    const torsoGroup = new THREE.Group();
    const torsoGeo = new THREE.BoxGeometry(0.48, 0.65, 0.28);
    this.bodyMesh = new THREE.Mesh(torsoGeo, this.vestMat);
    this.bodyMesh.position.set(0, 1.15, 0);
    this.bodyMesh.castShadow = true;
    (this.bodyMesh as any).botInstance = this;
    (this.bodyMesh as any).isHead = false;
    torsoGroup.add(this.bodyMesh);

    // Ballistic chest plate
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.4, 0.08), armorPlateMat);
    plate.position.set(0, 1.18, 0.15);
    torsoGroup.add(plate);

    // Ammo Mag Pouches on Chest
    for (let p = -0.12; p <= 0.12; p += 0.12) {
      const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.16, 0.07), armorPlateMat);
      pouch.position.set(p, 1.0, 0.18);
      torsoGroup.add(pouch);
    }
    this.mesh.add(torsoGroup);

    // 2. Head with Tactical Helmet, Visor & Headset (Headshot Target!)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.62, 0);

    const headGeo = new THREE.BoxGeometry(0.24, 0.26, 0.24);
    this.headMesh = new THREE.Mesh(headGeo, this.uniformMat);
    this.headMesh.castShadow = true;
    (this.headMesh as any).botInstance = this;
    (this.headMesh as any).isHead = true;
    headGroup.add(this.headMesh);

    // Combat Helmet Shell
    const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.28), helmetMat);
    helmet.position.set(0, 0.07, 0);
    headGroup.add(helmet);

    // Tactical Visor / NVG Goggles
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.07, 0.08), visorGlowMat);
    visor.position.set(0, 0.02, 0.13);
    headGroup.add(visor);

    this.mesh.add(headGroup);

    // 3. Limbs with Joints for Walking Animation
    // Left Leg
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.14, 0.85, 0);
    const legGeo = new THREE.BoxGeometry(0.18, 0.8, 0.2);
    const legLMesh = new THREE.Mesh(legGeo, this.uniformMat);
    legLMesh.position.set(0, -0.4, 0);
    legLMesh.castShadow = true;
    this.leftLeg.add(legLMesh);

    // Knee pad
    const kneeL = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.14, 0.06), armorPlateMat);
    kneeL.position.set(0, -0.38, 0.11);
    this.leftLeg.add(kneeL);
    this.mesh.add(this.leftLeg);

    // Right Leg
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.14, 0.85, 0);
    const legRMesh = new THREE.Mesh(legGeo, this.uniformMat);
    legRMesh.position.set(0, -0.4, 0);
    legRMesh.castShadow = true;
    this.rightLeg.add(legRMesh);

    const kneeR = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.14, 0.06), armorPlateMat);
    kneeR.position.set(0, -0.38, 0.11);
    this.rightLeg.add(kneeR);
    this.mesh.add(this.rightLeg);

    // Left Arm
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.3, 1.4, 0);
    const armGeo = new THREE.BoxGeometry(0.15, 0.65, 0.16);
    const armLMesh = new THREE.Mesh(armGeo, this.uniformMat);
    armLMesh.position.set(0, -0.3, 0.12);
    armLMesh.rotation.x = -0.4;
    this.leftArm.add(armLMesh);
    this.mesh.add(this.leftArm);

    // Right Arm & Weapon
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.3, 1.4, 0);
    const armRMesh = new THREE.Mesh(armGeo, this.uniformMat);
    armRMesh.position.set(0, -0.3, 0.15);
    armRMesh.rotation.x = -0.65;
    this.rightArm.add(armRMesh);

    // Modeled Tactical Rifle in bot hands
    const rifle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.65), armorPlateMat);
    rifle.position.set(-0.15, -0.35, 0.35);
    this.rightArm.add(rifle);
    this.mesh.add(this.rightArm);

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
    if (isHeadshot) damage *= 2.5;

    if (this.armor > 0) {
      const absorbed = Math.min(this.armor, damage * 0.5);
      this.armor -= absorbed;
      damage -= absorbed * 0.5;
    }

    this.health -= damage;
    this.flashHit();

    if (this.health <= 0) {
      this.die();
      return { killed: true, finalDamage: damage };
    }

    this.state = 'ENGAGE';
    return { killed: false, finalDamage: damage };
  }

  private flashHit(): void {
    this.vestMat.color.setHex(0xffffff);
    setTimeout(() => {
      this.vestMat.color.setHex(0x991b1b);
    }, 80);
  }

  public die(): void {
    this.isAlive = false;
    this.state = 'DEAD';
    this.respawnTimer = 4.0;
    this.audioManager.playElimination();

    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = 0.2;
  }

  public update(
    delta: number,
    playerPos: THREE.Vector3,
    onShootPlayer?: (dmg: number) => void,
    isFrozen: boolean = false,
    canShootThisTick: boolean = true
  ): void {
    if (isFrozen) return;

    if (!this.isAlive) {
      this.respawnTimer -= delta;
      if (this.respawnTimer <= 0) {
        const randWp = this.waypoints[Math.floor(Math.random() * this.waypoints.length)];
        this.mesh.rotation.x = 0;
        this.mesh.position.y = 0;
        this.spawn(randWp);
      }
      return;
    }

    this.position.set(this.mesh.position.x, 0, this.mesh.position.z);
    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.mesh.position);
    const distToPlayer = toPlayer.length();
    const hasLOS = distToPlayer < this.detectionRange && this.checkLineOfSight(playerPos);

    if (hasLOS) {
      this.state = 'ENGAGE';
    } else if (this.state === 'ENGAGE') {
      this.state = 'PATROL';
      this.reactionDelayTimer = 0.7; // Reset reaction time
    }

    if (this.state === 'ENGAGE') {
      this.handleEngage(delta, toPlayer, distToPlayer, onShootPlayer, canShootThisTick);
    } else {
      this.handlePatrol(delta);
    }
  }

  private checkLineOfSight(targetPos: THREE.Vector3): boolean {
    const origin = new THREE.Vector3(this.mesh.position.x, 1.5, this.mesh.position.z);
    const dir = new THREE.Vector3().subVectors(targetPos, origin).normalize();
    const ray = new THREE.Ray(origin, dir);
    const dist = origin.distanceTo(targetPos);

    for (const box of this.colliders) {
      const hit = ray.intersectBox(box, new THREE.Vector3());
      if (hit && origin.distanceTo(hit) < dist - 0.5) {
        return false;
      }
    }
    return true;
  }

  private handleEngage(
    delta: number,
    toPlayer: THREE.Vector3,
    dist: number,
    onShootPlayer?: (dmg: number) => void,
    canShootThisTick: boolean = true
  ): void {
    const angle = Math.atan2(toPlayer.x, toPlayer.z);
    this.mesh.rotation.y = angle;

    // Tactical repositioning & walking
    if (dist > 16) {
      const forward = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
      this.mesh.position.addScaledVector(forward, this.moveSpeed * 0.6 * delta);
      this.animateLegs(delta, 1.5);
    } else {
      this.resetLegs();
    }

    // Reaction delay before firing
    if (this.reactionDelayTimer > 0) {
      this.reactionDelayTimer -= delta;
      return;
    }

    // Coordinated Firing: Only fires if authorized to prevent unfair multi-bot firing!
    this.fireCooldown -= delta;
    if (this.fireCooldown <= 0 && canShootThisTick) {
      this.fireWeapon(onShootPlayer, dist);
      this.fireCooldown = 1.2 + Math.random() * 0.8; // Controlled human cadence
    }
  }

  private fireWeapon(onShootPlayer?: (dmg: number) => void, dist: number = 10): void {
    const muzzlePos = new THREE.Vector3(0.25, 1.15, 0.7).applyMatrix4(this.mesh.matrixWorld);
    this.particleManager.showMuzzleFlash(muzzlePos);
    this.audioManager.playGunshot('AR7');

    // Human-like distance falloff accuracy
    const hitChance = Math.max(0.18, 0.65 - (dist / 40) * 0.35);
    if (Math.random() < hitChance && onShootPlayer) {
      const damage = 8 + Math.floor(Math.random() * 8);
      onShootPlayer(damage);
    }
  }

  private handlePatrol(delta: number): void {
    if (this.waypoints.length === 0) return;

    const targetWp = this.waypoints[this.currentWaypointIndex];
    const toWp = new THREE.Vector3().subVectors(targetWp, this.mesh.position);
    toWp.y = 0;
    const dist = toWp.length();

    if (dist < 2.0) {
      this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
    } else {
      toWp.normalize();
      const angle = Math.atan2(toWp.x, toWp.z);
      this.mesh.rotation.y = angle;
      this.mesh.position.addScaledVector(toWp, this.moveSpeed * delta);
      this.animateLegs(delta, 2.0);
    }
  }

  private animateLegs(delta: number, speedMultiplier: number): void {
    this.walkCycle += delta * 7.0 * speedMultiplier;
    const legSwing = Math.sin(this.walkCycle) * 0.45;
    this.leftLeg.rotation.x = legSwing;
    this.rightLeg.rotation.x = -legSwing;
  }

  private resetLegs(): void {
    this.leftLeg.rotation.x = 0;
    this.rightLeg.rotation.x = 0;
  }
}
