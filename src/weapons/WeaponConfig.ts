import { WeaponStats, WeaponType } from '../types';

export const WEAPON_CONFIGS: Record<WeaponType, WeaponStats> = {
  VIPER9: {
    id: 'VIPER9',
    name: 'Viper-9',
    category: 'Pistol',
    damage: 34,
    headshotMultiplier: 2.2,
    fireRate: 400, // max semi-auto clicks/min
    magCapacity: 15,
    maxReserveAmmo: 60,
    reloadTime: 1.4,
    spread: 0.012,
    spreadMovePenalty: 0.025,
    recoilVertical: 0.028,
    recoilHorizontal: 0.008,
    recoilRecovery: 12.0,
    automatic: false,
    adsFov: 62,
    adsSpeed: 14.0,
    range: 120,
    speedMultiplier: 1.05
  },
  AR7: {
    id: 'AR7',
    name: 'AR-7 Striker',
    category: 'Rifle',
    damage: 26,
    headshotMultiplier: 2.5,
    fireRate: 620, // automatic RPM
    magCapacity: 30,
    maxReserveAmmo: 120,
    reloadTime: 2.1,
    spread: 0.018,
    spreadMovePenalty: 0.05,
    recoilVertical: 0.045,
    recoilHorizontal: 0.018,
    recoilRecovery: 9.0,
    automatic: true,
    adsFov: 52,
    adsSpeed: 10.0,
    range: 200,
    speedMultiplier: 0.95
  },
  LONGSHOT: {
    id: 'LONGSHOT',
    name: 'Longshot',
    category: 'Sniper',
    damage: 115,
    headshotMultiplier: 2.6,
    fireRate: 48, // bolt action cycle
    magCapacity: 5,
    maxReserveAmmo: 25,
    reloadTime: 3.0,
    spread: 0.002,
    spreadMovePenalty: 0.12,
    recoilVertical: 0.12,
    recoilHorizontal: 0.03,
    recoilRecovery: 6.0,
    automatic: false,
    adsFov: 16, // deep high-magnification scope zoom
    adsSpeed: 12.0,
    range: 400,
    speedMultiplier: 0.85
  }
};
