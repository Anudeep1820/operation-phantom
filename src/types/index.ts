import * as THREE from 'three';

export type WeaponType = 'VIPER9' | 'AR7' | 'LONGSHOT';

export interface WeaponStats {
  id: WeaponType;
  name: string;
  category: 'Pistol' | 'Rifle' | 'Sniper';
  damage: number;
  headshotMultiplier: number;
  fireRate: number; // rounds per minute
  magCapacity: number;
  maxReserveAmmo: number;
  reloadTime: number; // seconds
  spread: number; // base spread
  spreadMovePenalty: number;
  recoilVertical: number;
  recoilHorizontal: number;
  recoilRecovery: number;
  automatic: boolean;
  adsFov: number; // degrees
  adsSpeed: number; // lerp speed
  range: number;
  speedMultiplier: number;
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  isAlive: boolean;
  kills: number;
  deaths: number;
  headshots: number;
  accuracy: { shotsFired: number; shotsHit: number };
}

export interface HitResult {
  hit: boolean;
  point?: THREE.Vector3;
  normal?: THREE.Vector3;
  distance?: number;
  target?: any;
  isHeadshot?: boolean;
}

export type GraphicsQuality = 'low' | 'medium' | 'high';

export interface GameSettings {
  mouseSensitivity: number;
  touchSensitivity: number;
  graphicsQuality: GraphicsQuality;
  resolutionScale: number;
  masterVolume: number;
  sfxVolume: number;
  showFps: boolean;
  cameraShake: boolean;
  aimAssist: boolean;
}

export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export interface KillFeedEntry {
  id: string;
  killer: string;
  victim: string;
  weapon: string;
  isHeadshot: boolean;
  isPlayerKill: boolean;
  timestamp: number;
}

export interface CheatState {
  godMode: boolean;
  infiniteAmmo: boolean;
  oneShotKill: boolean;
  superSpeed: boolean;
  superJump: boolean;
  aimbot: boolean;
  wallhack: boolean;
  freezeBots: boolean;
}

