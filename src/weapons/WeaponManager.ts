import * as THREE from 'three';
import { WeaponType } from '../types';
import { Weapon } from './Weapon';
import { WEAPON_CONFIGS } from './WeaponConfig';
import { AudioManager } from '../core/AudioManager';

export class WeaponManager {
  public weapons: Map<WeaponType, Weapon> = new Map();
  public currentWeaponType: WeaponType = 'AR7';
  public currentWeapon: Weapon;
  private camera: THREE.Camera;
  private audioManager: AudioManager;

  constructor(camera: THREE.Camera, audioManager: AudioManager) {
    this.camera = camera;
    this.audioManager = audioManager;

    // Instantiate all 3 weapons
    this.weapons.set('VIPER9', new Weapon(WEAPON_CONFIGS.VIPER9, audioManager));
    this.weapons.set('AR7', new Weapon(WEAPON_CONFIGS.AR7, audioManager));
    this.weapons.set('LONGSHOT', new Weapon(WEAPON_CONFIGS.LONGSHOT, audioManager));

    this.currentWeapon = this.weapons.get('AR7')!;
    this.camera.add(this.currentWeapon.modelData.mesh);
  }

  public switchWeapon(type: WeaponType): void {
    if (type === this.currentWeaponType || !this.weapons.has(type)) return;

    // Detach old weapon
    this.currentWeapon.cancelReload();
    this.currentWeapon.isADS = false;
    this.camera.remove(this.currentWeapon.modelData.mesh);

    // Attach new weapon
    this.currentWeaponType = type;
    this.currentWeapon = this.weapons.get(type)!;
    this.camera.add(this.currentWeapon.modelData.mesh);

    this.audioManager.playReload('magIn');
  }

  public switchToNext(): void {
    const list: WeaponType[] = ['AR7', 'VIPER9', 'LONGSHOT'];
    const idx = list.indexOf(this.currentWeaponType);
    const nextIdx = (idx + 1) % list.length;
    this.switchWeapon(list[nextIdx]);
  }

  public update(delta: number, isMoving: boolean, moveSpeed: number): void {
    this.currentWeapon.update(delta, isMoving, moveSpeed);
  }
}
