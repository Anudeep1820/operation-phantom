import * as THREE from 'three';
import { AudioManager } from '../core/AudioManager';
import { WeaponManager } from '../weapons/WeaponManager';

export class PlayerController {
  public camera: THREE.PerspectiveCamera;
  public position: THREE.Vector3 = new THREE.Vector3();
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public isGrounded: boolean = true;
  public isCrouching: boolean = false;
  public isSprinting: boolean = false;

  public pitch: number = 0; // X rotation (vertical look)
  public yaw: number = 0;   // Y rotation (horizontal look)

  private cameraHeight: number = 1.7; // default standing height
  private crouchHeight: number = 0.95;
  private currentHeight: number = 1.7;

  // Speeds (units per second)
  private walkSpeed: number = 6.0;
  private sprintSpeed: number = 9.2;
  private crouchSpeed: number = 3.2;
  private jumpForce: number = 6.2;
  private gravity: number = 18.0;

  // Recoil offset springs
  public recoilPitchOffset: number = 0;
  public recoilYawOffset: number = 0;

  // Camera Shake
  private cameraShakeIntensity: number = 0;

  // Footstep audio tracking
  private footstepCycle: number = 0;

  // References
  private colliders: THREE.Box3[] = [];
  private audioManager: AudioManager;
  public weaponManager: WeaponManager;

  // Sensitivity
  public mouseSensitivity: number = 0.0022;
  public touchSensitivity: number = 0.0035;

  constructor(camera: THREE.PerspectiveCamera, colliders: THREE.Box3[], audioManager: AudioManager) {
    this.camera = camera;
    this.colliders = colliders;
    this.audioManager = audioManager;
    this.weaponManager = new WeaponManager(this.camera, this.audioManager);
    this.position.set(0, this.currentHeight, -36);
  }

  public setPosition(pos: THREE.Vector3): void {
    this.position.copy(pos);
    this.position.y += this.currentHeight;
    this.velocity.set(0, 0, 0);
  }

  public handleLookDelta(deltaX: number, deltaY: number, isTouch: boolean = false): void {
    const sens = isTouch ? this.touchSensitivity : this.mouseSensitivity;
    // Rotate yaw (horizontal)
    this.yaw -= deltaX * sens;
    // Rotate pitch (vertical) clamped to -85 deg and +85 deg
    this.pitch -= deltaY * sens;
    const maxPitch = Math.PI / 2 - 0.05;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
  }

  public applyRecoil(vertical: number, horizontal: number): void {
    this.recoilPitchOffset += vertical;
    this.recoilYawOffset += (Math.random() - 0.5) * horizontal * 2;
  }

  public addCameraShake(amount: number): void {
    this.cameraShakeIntensity = Math.min(this.cameraShakeIntensity + amount, 0.4);
  }

  public update(
    delta: number,
    inputMoveX: number,
    inputMoveZ: number,
    isJumpPressed: boolean,
    isCrouchPressed: boolean,
    isSprintActive: boolean
  ): void {
    // 1. Crouch & Height interpolation
    this.isCrouching = isCrouchPressed;
    const targetHeight = this.isCrouching ? this.crouchHeight : 1.7;
    this.currentHeight = THREE.MathUtils.lerp(this.currentHeight, targetHeight, delta * 12.0);

    // 2. Movement Speeds
    this.isSprinting = isSprintActive && !this.isCrouching && inputMoveZ > 0;
    let baseSpeed = this.isCrouching ? this.crouchSpeed : this.isSprinting ? this.sprintSpeed : this.walkSpeed;
    baseSpeed *= this.weaponManager.currentWeapon.stats.speedMultiplier;

    // 3. Movement Direction relative to camera yaw
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();

    const moveDir = new THREE.Vector3();
    moveDir.addScaledVector(right, inputMoveX);
    moveDir.addScaledVector(forward, inputMoveZ);

    if (moveDir.lengthSq() > 1.0) {
      moveDir.normalize();
    }

    // 4. Horizontal Velocity
    const targetVelX = moveDir.x * baseSpeed;
    const targetVelZ = moveDir.z * baseSpeed;
    const accelRate = this.isGrounded ? 16.0 : 4.0;
    this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, targetVelX, delta * accelRate);
    this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, targetVelZ, delta * accelRate);

    // 5. Jump & Gravity
    if (this.isGrounded) {
      this.velocity.y = 0;
      if (isJumpPressed && !this.isCrouching) {
        this.velocity.y = this.jumpForce;
        this.isGrounded = false;
        this.audioManager.playFootstep();
      }
    } else {
      this.velocity.y -= this.gravity * delta;
    }

    // 6. Collision Detection with World Colliders
    this.resolveCollisions(delta);

    // 7. Ground Snap / Level Floor
    if (this.position.y <= this.currentHeight) {
      this.position.y = this.currentHeight;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    // 8. Recoil Decay
    const recoveryRate = this.weaponManager.currentWeapon.stats.recoilRecovery;
    this.recoilPitchOffset = THREE.MathUtils.lerp(this.recoilPitchOffset, 0, delta * recoveryRate);
    this.recoilYawOffset = THREE.MathUtils.lerp(this.recoilYawOffset, 0, delta * recoveryRate);

    // 9. Camera Shake Decay
    this.cameraShakeIntensity = THREE.MathUtils.lerp(this.cameraShakeIntensity, 0, delta * 8.0);
    const shakeX = (Math.random() - 0.5) * this.cameraShakeIntensity;
    const shakeY = (Math.random() - 0.5) * this.cameraShakeIntensity;

    // 10. Update Camera Transform
    const totalPitch = this.pitch + this.recoilPitchOffset + shakeY;
    const totalYaw = this.yaw + this.recoilYawOffset + shakeX;

    this.camera.position.set(this.position.x, this.position.y, this.position.z);
    this.camera.rotation.set(0, 0, 0);
    this.camera.rotateY(totalYaw);
    this.camera.rotateX(totalPitch);

    // 11. ADS FOV Interpolation
    const targetFov = this.weaponManager.currentWeapon.isADS
      ? this.weaponManager.currentWeapon.stats.adsFov
      : 75;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, delta * 12.0);
    this.camera.updateProjectionMatrix();

    // 12. Footstep Audio Trigger
    const horizSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
    const isMoving = horizSpeed > 0.5 && this.isGrounded;
    if (isMoving) {
      this.footstepCycle += delta * horizSpeed * 1.8;
      if (this.footstepCycle >= Math.PI) {
        this.footstepCycle = 0;
        this.audioManager.playFootstep();
      }
    } else {
      this.footstepCycle = 0;
    }

    // 13. Weapon Manager Update
    this.weaponManager.update(delta, isMoving, horizSpeed);
  }

  private resolveCollisions(delta: number): void {
    const radius = 0.45;
    const height = this.currentHeight;

    // Try moving along X
    const newPosX = this.position.x + this.velocity.x * delta;
    const boxX = new THREE.Box3(
      new THREE.Vector3(newPosX - radius, this.position.y - height + 0.1, this.position.z - radius),
      new THREE.Vector3(newPosX + radius, this.position.y + 0.1, this.position.z + radius)
    );

    let collideX = false;
    for (const col of this.colliders) {
      if (col.intersectsBox(boxX)) {
        collideX = true;
        this.velocity.x = 0;
        break;
      }
    }
    if (!collideX) this.position.x = newPosX;

    // Try moving along Z
    const newPosZ = this.position.z + this.velocity.z * delta;
    const boxZ = new THREE.Box3(
      new THREE.Vector3(this.position.x - radius, this.position.y - height + 0.1, newPosZ - radius),
      new THREE.Vector3(this.position.x + radius, this.position.y + 0.1, newPosZ + radius)
    );

    let collideZ = false;
    for (const col of this.colliders) {
      if (col.intersectsBox(boxZ)) {
        collideZ = true;
        this.velocity.z = 0;
        break;
      }
    }
    if (!collideZ) this.position.z = newPosZ;

    // Try moving along Y
    this.position.y += this.velocity.y * delta;
  }
}
