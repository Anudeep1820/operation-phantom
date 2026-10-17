import * as THREE from 'three';
import { AudioManager } from '../core/AudioManager';

export class VehicleController {
  public mesh: THREE.Group;
  public position: THREE.Vector3 = new THREE.Vector3();
  public forward: THREE.Vector3 = new THREE.Vector3(0, 0, 1);
  public speed: number = 0;
  public steeringAngle: number = 0;
  public yaw: number = 0;

  public isOccupied: boolean = false;
  private maxSpeed: number = 19.0;
  private reverseMaxSpeed: number = -8.0;
  private acceleration: number = 24.0;
  private brakeForce: number = 32.0;
  private friction: number = 5.0;
  private steerSpeed: number = 2.4;

  // Wheel meshes for physical rotation & steering
  private wheels: THREE.Mesh[] = [];
  private frontWheelL!: THREE.Mesh;
  private frontWheelR!: THREE.Mesh;
  private headlightL!: THREE.SpotLight;
  private headlightR!: THREE.SpotLight;

  private scene: THREE.Scene;
  private audioManager: AudioManager;
  private colliders: THREE.Box3[];

  constructor(spawnPos: THREE.Vector3, scene: THREE.Scene, audioManager: AudioManager, colliders: THREE.Box3[]) {
    this.scene = scene;
    this.audioManager = audioManager;
    this.colliders = colliders;
    this.position.copy(spawnPos);
    this.position.y = 0.5;

    this.mesh = new THREE.Group();
    (this.mesh as any).isVehicle = true;
    this.buildVehicleMesh();
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);
  }

  private buildVehicleMesh(): void {
    // Materials
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x2e382c, // Tactical military olive drab
      roughness: 0.6,
      metalness: 0.4
    });

    const rollCageMat = new THREE.MeshStandardMaterial({
      color: 0x1f2421,
      roughness: 0.4,
      metalness: 0.8
    });

    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.9,
      metalness: 0.1
    });

    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.8,
      roughness: 0.2
    });

    const lightLensMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // 1. Main Chassis Hull
    const hullGeo = new THREE.BoxGeometry(1.8, 0.55, 3.4);
    const hull = new THREE.Mesh(hullGeo, chassisMat);
    hull.position.set(0, 0.45, 0);
    hull.castShadow = true;
    this.mesh.add(hull);

    // Front Slanted Hood
    const hoodGeo = new THREE.BoxGeometry(1.6, 0.35, 1.2);
    const hood = new THREE.Mesh(hoodGeo, chassisMat);
    hood.position.set(0, 0.65, 1.1);
    hood.rotation.x = 0.15;
    this.mesh.add(hood);

    // 2. Tubular Roll Cage
    const cageGeo = new THREE.BoxGeometry(1.6, 1.0, 1.8);
    const cage = new THREE.Mesh(cageGeo, rollCageMat);
    cage.position.set(0, 1.1, -0.2);
    this.mesh.add(cage);

    // Windshield frame
    const windFrame = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 0.08), rollCageMat);
    windFrame.position.set(0, 1.0, 0.7);
    windFrame.rotation.x = -0.35;
    this.mesh.add(windFrame);

    // 3. Front Bullbar
    const bullbar = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.4, 0.2), rollCageMat);
    bullbar.position.set(0, 0.45, 1.85);
    this.mesh.add(bullbar);

    // 4. Wheels
    const createWheel = (x: number, y: number, z: number, isFront: boolean): THREE.Mesh => {
      const wGroup = new THREE.Group();

      const tireGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 16);
      const tire = new THREE.Mesh(tireGeo, wheelMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wGroup.add(tire);

      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.34, 12), rimMat);
      rim.rotation.z = Math.PI / 2;
      wGroup.add(rim);

      const parentMesh = new THREE.Mesh();
      parentMesh.add(wGroup);
      parentMesh.position.set(x, y, z);
      this.mesh.add(parentMesh);
      this.wheels.push(tire);
      return parentMesh;
    };

    this.frontWheelL = createWheel(-1.05, 0.42, 1.15, true);
    this.frontWheelR = createWheel(1.05, 0.42, 1.15, true);
    createWheel(-1.05, 0.42, -1.15, false);
    createWheel(1.05, 0.42, -1.15, false);

    // 5. Dual High-Beam Headlights
    const lensL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12), lightLensMat);
    lensL.rotation.x = Math.PI / 2;
    lensL.position.set(-0.55, 0.65, 1.75);
    this.mesh.add(lensL);

    const lensR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12), lightLensMat);
    lensR.rotation.x = Math.PI / 2;
    lensR.position.set(0.55, 0.65, 1.75);
    this.mesh.add(lensR);

    // Realistic spot headlights casting onto the terrain
    this.headlightL = new THREE.SpotLight(0xfffbeb, 4.0, 45, Math.PI / 5, 0.4);
    this.headlightL.position.set(-0.55, 0.65, 1.8);
    this.headlightL.target.position.set(-0.55, 0, 15);
    this.mesh.add(this.headlightL);
    this.mesh.add(this.headlightL.target);

    this.headlightR = new THREE.SpotLight(0xfffbeb, 4.0, 45, Math.PI / 5, 0.4);
    this.headlightR.position.set(0.55, 0.65, 1.8);
    this.headlightR.target.position.set(0.55, 0, 15);
    this.mesh.add(this.headlightR);
    this.mesh.add(this.headlightR.target);
  }

  public update(
    delta: number,
    throttleInput: number, // 1 for forward, -1 for reverse
    steerInput: number,    // -1 for left, 1 for right
    onCrushBot?: (bot: any) => void,
    bots: any[] = []
  ): void {
    if (this.isOccupied) {
      // Throttle acceleration / braking
      if (throttleInput > 0) {
        this.speed = Math.min(this.maxSpeed, this.speed + this.acceleration * delta);
      } else if (throttleInput < 0) {
        this.speed = Math.max(this.reverseMaxSpeed, this.speed - this.acceleration * delta);
      } else {
        // Friction roll to stop
        if (this.speed > 0) {
          this.speed = Math.max(0, this.speed - this.friction * delta);
        } else if (this.speed < 0) {
          this.speed = Math.min(0, this.speed + this.friction * delta);
        }
      }

      // Steering
      const steerTarget = -steerInput * 0.45;
      this.steeringAngle = THREE.MathUtils.lerp(this.steeringAngle, steerTarget, delta * 8.0);
      this.frontWheelL.rotation.y = this.steeringAngle;
      this.frontWheelR.rotation.y = this.steeringAngle;

      // Turn vehicle based on speed and steering
      if (Math.abs(this.speed) > 0.5) {
        const turnDir = this.speed > 0 ? 1 : -1;
        this.yaw += this.steeringAngle * this.steerSpeed * delta * turnDir;
      }
    } else {
      // Unoccupied decelerate
      if (Math.abs(this.speed) > 0.1) {
        this.speed = THREE.MathUtils.lerp(this.speed, 0, delta * 6.0);
      } else {
        this.speed = 0;
      }
    }

    // Apply orientation
    this.mesh.rotation.y = this.yaw;
    this.forward.set(Math.sin(this.yaw), 0, Math.cos(this.yaw));

    // Vehicle Collision Resolution with Map Walls, Barriers & Buildings
    const vRadius = 1.35; // Physical vehicle collision envelope
    const stepX = this.forward.x * this.speed * delta;
    const stepZ = this.forward.z * this.speed * delta;

    // Test X-axis movement
    const testX = this.position.x + stepX;
    const boxX = new THREE.Box3(
      new THREE.Vector3(testX - vRadius, 0.1, this.position.z - vRadius),
      new THREE.Vector3(testX + vRadius, 1.8, this.position.z + vRadius)
    );
    let collideX = false;
    for (const col of this.colliders) {
      if (col.intersectsBox(boxX)) {
        collideX = true;
        break;
      }
    }
    if (!collideX) {
      this.position.x = testX;
    } else {
      if (Math.abs(this.speed) > 4.0) {
        this.audioManager.playHurt();
      }
      this.speed *= -0.25; // Elastic bounce from wall
    }

    // Test Z-axis movement
    const testZ = this.position.z + stepZ;
    const boxZ = new THREE.Box3(
      new THREE.Vector3(this.position.x - vRadius, 0.1, testZ - vRadius),
      new THREE.Vector3(this.position.x + vRadius, 1.8, testZ + vRadius)
    );
    let collideZ = false;
    for (const col of this.colliders) {
      if (col.intersectsBox(boxZ)) {
        collideZ = true;
        break;
      }
    }
    if (!collideZ) {
      this.position.z = testZ;
    } else {
      if (Math.abs(this.speed) > 4.0) {
        this.audioManager.playHurt();
      }
      this.speed *= -0.25;
    }

    this.mesh.position.copy(this.position);

    // Physically spin wheels based on travel distance
    const wheelSpin = (this.speed * delta) / 0.42;
    for (const w of this.wheels) {
      w.rotation.x += wheelSpin;
    }

    // Check Running Over / Crushing Enemy Bots
    if (Math.abs(this.speed) > 5.0 && onCrushBot) {
      for (const bot of bots) {
        if (bot.isAlive && this.position.distanceTo(bot.mesh.position) < 2.4) {
          bot.takeDamage(300, true, 'TACTICAL VEHICLE');
          onCrushBot(bot);
          this.audioManager.playHurt();
        }
      }
    }
  }

  public getDriverSeatWorldPos(): THREE.Vector3 {
    return new THREE.Vector3(-0.35, 1.1, -0.2).applyMatrix4(this.mesh.matrixWorld);
  }

  public getChaseCameraPos(): THREE.Vector3 {
    const behind = new THREE.Vector3().copy(this.forward).multiplyScalar(-6.5);
    behind.y += 2.8;
    return new THREE.Vector3().copy(this.position).add(behind);
  }

  public getLookTarget(): THREE.Vector3 {
    const front = new THREE.Vector3().copy(this.forward).multiplyScalar(8.0);
    front.y += 1.2;
    return new THREE.Vector3().copy(this.position).add(front);
  }
}
