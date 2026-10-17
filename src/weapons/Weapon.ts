import * as THREE from 'three';
import { WeaponStats, WeaponType } from '../types';
import { WeaponModelData, WeaponModelGenerator } from './WeaponModelGenerator';
import { AudioManager } from '../core/AudioManager';

export class Weapon {
  public stats: WeaponStats;
  public currentAmmo: number;
  public reserveAmmo: number;
  public isReloading: boolean = false;
  public reloadProgress: number = 0;
  public modelData: WeaponModelData;
  public isADS: boolean = false;
  public adsAlpha: number = 0; // 0 to 1

  private nextFireTime: number = 0;
  private currentRecoilKick: number = 0;
  private currentRecoilRot: number = 0;
  private slideKick: number = 0;
  private audioManager: AudioManager;

  constructor(stats: WeaponStats, audioManager: AudioManager) {
    this.stats = stats;
    this.audioManager = audioManager;
    this.currentAmmo = stats.magCapacity;
    this.reserveAmmo = stats.maxReserveAmmo;
    this.modelData = WeaponModelGenerator.createWeaponModel(stats.id);
  }

  public canShoot(currentTime: number, isInfiniteAmmo: boolean = false): boolean {
    return (
      !this.isReloading &&
      (isInfiniteAmmo || this.currentAmmo > 0) &&
      currentTime >= this.nextFireTime
    );
  }

  public shoot(currentTime: number, isInfiniteAmmo: boolean = false): boolean {
    if (!this.canShoot(currentTime, isInfiniteAmmo)) {
      if (this.currentAmmo <= 0 && !this.isReloading && currentTime >= this.nextFireTime) {
        this.audioManager.playEmptyClick();
        this.nextFireTime = currentTime + 0.25;
      }
      return false;
    }

    if (!isInfiniteAmmo) {
      this.currentAmmo--;
    } else {
      this.currentAmmo = this.stats.magCapacity;
      this.reserveAmmo = this.stats.maxReserveAmmo;
    }
    const fireInterval = 60 / this.stats.fireRate;
    this.nextFireTime = currentTime + fireInterval;

    // Trigger procedural sound
    this.audioManager.playGunshot(this.stats.id);

    // Apply viewmodel recoil impulse
    this.currentRecoilKick = this.stats.id === 'LONGSHOT' ? 0.08 : 0.045;
    this.currentRecoilRot = this.stats.id === 'LONGSHOT' ? 0.18 : 0.09;
    this.slideKick = 0.05;

    return true;
  }

  public reload(): boolean {
    if (this.isReloading || this.currentAmmo >= this.stats.magCapacity || this.reserveAmmo <= 0) {
      return false;
    }

    this.isReloading = true;
    this.reloadProgress = 0;
    this.audioManager.playReload('magOut');

    setTimeout(() => {
      if (this.isReloading) this.audioManager.playReload('magIn');
    }, (this.stats.reloadTime * 0.5) * 1000);

    setTimeout(() => {
      if (this.isReloading) this.audioManager.playReload('boltRack');
    }, (this.stats.reloadTime * 0.8) * 1000);

    return true;
  }

  public cancelReload(): void {
    this.isReloading = false;
    this.reloadProgress = 0;
  }

  public update(delta: number, isMoving: boolean, moveSpeed: number): void {
    // Reload timing
    if (this.isReloading) {
      this.reloadProgress += delta / this.stats.reloadTime;
      if (this.reloadProgress >= 1.0) {
        const needed = this.stats.magCapacity - this.currentAmmo;
        const available = Math.min(needed, this.reserveAmmo);
        this.currentAmmo += available;
        this.reserveAmmo -= available;
        this.isReloading = false;
        this.reloadProgress = 0;
      }
    }

    // ADS interpolation
    const adsTarget = this.isADS ? 1.0 : 0.0;
    this.adsAlpha = THREE.MathUtils.lerp(this.adsAlpha, adsTarget, delta * this.stats.adsSpeed);

    // Recoil recovery
    this.currentRecoilKick = THREE.MathUtils.lerp(this.currentRecoilKick, 0, delta * this.stats.recoilRecovery);
    this.currentRecoilRot = THREE.MathUtils.lerp(this.currentRecoilRot, 0, delta * this.stats.recoilRecovery);
    this.slideKick = THREE.MathUtils.lerp(this.slideKick, 0, delta * 25.0);

    if (this.modelData.slideMesh) {
      this.modelData.slideMesh.position.z = -0.02 + this.slideKick;
    }

    // Interpolate viewmodel position between default hipfire and ADS
    const targetPos = new THREE.Vector3().lerpVectors(
      this.modelData.defaultPosition,
      this.modelData.adsPosition,
      this.adsAlpha
    );

    // Recoil offset
    targetPos.z += this.currentRecoilKick;
    targetPos.y += this.currentRecoilKick * 0.3;

    // Movement bobbing
    if (isMoving && this.adsAlpha < 0.5) {
      const bobTime = performance.now() * 0.008 * moveSpeed;
      targetPos.x += Math.sin(bobTime) * 0.006;
      targetPos.y += Math.abs(Math.cos(bobTime)) * 0.006;
    }

    // Reload animation dip
    if (this.isReloading) {
      const dip = Math.sin(this.reloadProgress * Math.PI) * 0.12;
      targetPos.y -= dip;
      targetPos.z -= dip * 0.5;
    }

    this.modelData.mesh.position.copy(targetPos);

    // Rotation (default vs ADS + recoil pitch)
    const targetRotX = THREE.MathUtils.lerp(
      this.modelData.defaultRotation.x,
      this.modelData.adsRotation.x,
      this.adsAlpha
    ) + this.currentRecoilRot;

    this.modelData.mesh.rotation.set(
      targetRotX,
      this.modelData.defaultRotation.y,
      this.modelData.defaultRotation.z
    );
  }

  public getEffectiveSpread(isMoving: boolean, isCrouching: boolean): number {
    let spread = this.stats.spread;
    if (this.isADS) {
      spread *= 0.3;
    }
    if (isMoving) {
      spread += this.stats.spreadMovePenalty;
    }
    if (isCrouching) {
      spread *= 0.7;
    }
    return spread;
  }
}
