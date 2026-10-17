import * as THREE from 'three';
import { GameSettings, GameState, GraphicsQuality } from '../types';
import { AudioManager } from '../core/AudioManager';
import { InputManager } from '../core/InputManager';
import { PerformanceManager } from '../core/PerformanceManager';
import { ParticleManager } from '../effects/ParticleManager';
import { NeonDistrict, MapData } from '../maps/NeonDistrict';
import { PlayerController } from '../player/PlayerController';
import { BotManager } from '../ai/BotManager';
import { HitDetection } from '../combat/HitDetection';
import { DamageSystem } from '../combat/DamageSystem';
import { PracticeMode } from '../game-modes/PracticeMode';
import { HUD } from '../ui/HUD';
import { MainMenu } from '../ui/MainMenu';
import { SettingsMenu } from '../ui/SettingsMenu';
import { MatchResults } from '../ui/MatchResults';

export class Game {
  private container: HTMLElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;

  // Game Systems
  private audioManager!: AudioManager;
  private inputManager!: InputManager;
  private particleManager!: ParticleManager;
  private performanceManager!: PerformanceManager;
  private hitDetection!: HitDetection;
  private damageSystem!: DamageSystem;
  private botManager!: BotManager;
  private playerController!: PlayerController;
  private practiceMode!: PracticeMode;
  private mapData!: MapData;

  // UI Layers
  private hud!: HUD;
  private mainMenu!: MainMenu;
  private settingsMenu!: SettingsMenu;
  private matchResults!: MatchResults;

  // State
  public state: GameState = 'MENU';
  private lastFrameTime: number = performance.now();
  private wasMouseDown: boolean = false;

  // Settings
  public settings: GameSettings = {
    mouseSensitivity: 0.0022,
    touchSensitivity: 0.0035,
    graphicsQuality: 'medium',
    resolutionScale: 1.0,
    masterVolume: 0.8,
    sfxVolume: 0.8,
    showFps: true,
    cameraShake: true,
    aimAssist: true
  };

  constructor(container: HTMLElement) {
    this.container = container;
    this.init();
  }

  private init(): void {
    // 1. Three.js Renderer
    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
      stencil: false,
      depth: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2) * this.settings.resolutionScale);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 2. Scene & Bright Atmospheric Twilight Fog (never pitch black)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111622);
    this.scene.fog = new THREE.FogExp2(0x111622, 0.005);

    // 3. Camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 400);
    this.scene.add(this.camera);

    // 4. Audio Manager
    this.audioManager = new AudioManager();

    // 5. Build Map
    this.mapData = NeonDistrict.create();
    this.scene.add(this.mapData.group);

    // 6. Particles & Effects
    this.particleManager = new ParticleManager(this.scene);

    // 7. Bot Manager
    this.botManager = new BotManager(this.scene, this.audioManager, this.particleManager, this.mapData.colliders);

    // 8. Player Controller
    this.playerController = new PlayerController(this.camera, this.mapData.colliders, this.audioManager);
    this.playerController.setPosition(this.mapData.playerSpawn);

    // 9. Combat Systems
    this.hitDetection = new HitDetection(
      this.camera,
      this.scene,
      this.botManager,
      this.particleManager,
      this.audioManager
    );

    this.damageSystem = new DamageSystem({
      onKillFeed: (entry) => {
        this.hud.addKillFeedEntry(entry);
      },
      onPlayerDamaged: (amount, health, armor) => {
        this.audioManager.playHurt();
        this.hud.triggerDamageFlash();
        if (this.settings.cameraShake) {
          this.playerController.addCameraShake(amount * 0.005);
        }
      },
      onPlayerKilled: () => {
        this.playerController.triggerDeath();
        this.hud.showDeathOverlay(3.0);
        this.practiceMode.triggerPlayerDeath();
        this.practiceMode.registerBotKill();
      }
    });

    // 10. Practice Match Mode
    this.practiceMode = new PracticeMode({ targetScore: 15, matchDurationSec: 300 }, (isVictory) => {
      this.handleMatchEnd(isVictory);
    });

    // 11. Performance Manager
    this.performanceManager = new PerformanceManager(this.container, this.renderer);
    this.performanceManager.setVisible(this.settings.showFps);

    // 12. Input Manager
    this.inputManager = new InputManager(this.renderer.domElement);

    // 13. UI Systems
    this.hud = new HUD(this.container);
    this.hud.setVisible(false);
    this.inputManager.touchControls.setVisible(false);

    this.mainMenu = new MainMenu(this.container, {
      onStartMatch: () => this.startMatch(),
      onOpenSettings: () => this.settingsMenu.setVisible(true)
    });

    this.settingsMenu = new SettingsMenu(this.container, this.settings, {
      onSave: (newSettings) => this.applySettings(newSettings),
      onClose: () => {
        if (this.state === 'PAUSED') {
          this.matchResults.showPause();
        }
      }
    });

    this.matchResults = new MatchResults(this.container, {
      onRestart: () => this.startMatch(),
      onMainMenu: () => this.returnToMainMenu(),
      onResume: () => this.resumeMatch(),
      onOpenSettings: () => {
        this.matchResults.hidePause();
        this.settingsMenu.setVisible(true);
      }
    });

    // 14. Window Listeners
    window.addEventListener('resize', () => this.handleResize());
    window.addEventListener('blur', () => this.handlePause());

    // 15. Start Loop
    this.animate();
  }

  public startMatch(): void {
    this.audioManager.unlock();
    this.damageSystem.resetPlayer();
    this.playerController.respawn(this.mapData.playerSpawn);
    this.botManager.initBots(this.mapData.botSpawns, this.mapData.waypoints, 4);
    this.practiceMode.startMatch();

    this.state = 'PLAYING';
    this.mainMenu.setVisible(false);
    this.matchResults.hideResults();
    this.matchResults.hidePause();
    this.hud.hideDeathOverlay();
    this.hud.setVisible(true);
    this.inputManager.touchControls.setVisible(true);

    // Request pointer lock for desktop
    this.inputManager.requestPointerLock();
  }

  public handlePause(): void {
    if (this.state !== 'PLAYING') return;
    this.state = 'PAUSED';
    this.matchResults.showPause();
    this.inputManager.exitPointerLock();
  }

  public resumeMatch(): void {
    if (this.state !== 'PAUSED') return;
    this.state = 'PLAYING';
    this.matchResults.hidePause();
    this.inputManager.requestPointerLock();
  }

  public returnToMainMenu(): void {
    this.state = 'MENU';
    this.hud.setVisible(false);
    this.inputManager.touchControls.setVisible(false);
    this.matchResults.hidePause();
    this.matchResults.hideResults();
    this.mainMenu.setVisible(true);
    this.inputManager.exitPointerLock();
    this.botManager.clear();
  }

  private handleMatchEnd(isVictory: boolean): void {
    this.state = 'GAMEOVER';
    this.inputManager.exitPointerLock();
    this.hud.setVisible(false);
    this.inputManager.touchControls.setVisible(false);
    this.matchResults.showResults(
      isVictory,
      this.damageSystem.playerStats,
      this.practiceMode.alphaScore,
      this.practiceMode.omegaScore
    );
  }

  private handleResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2) * this.settings.resolutionScale);
  }

  public applySettings(s: GameSettings): void {
    this.settings = { ...s };
    this.playerController.mouseSensitivity = s.mouseSensitivity;
    this.playerController.touchSensitivity = s.touchSensitivity;
    this.audioManager.setVolumes(s.masterVolume, s.sfxVolume);
    this.performanceManager.setVisible(s.showFps);

    // Apply Graphics Presets
    if (s.graphicsQuality === 'low') {
      this.renderer.shadowMap.enabled = false;
      this.renderer.setPixelRatio(0.85);
    } else if (s.graphicsQuality === 'medium') {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.BasicShadowMap;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5) * s.resolutionScale);
    } else {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2) * s.resolutionScale);
    }
    this.renderer.shadowMap.needsUpdate = true;
  }

  // --- Main Animation Loop ---
  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const now = performance.now();
    let delta = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    // Clamp delta to prevent physics exploding on tab switch
    if (delta > 0.1) delta = 0.1;

    // Performance monitor
    this.performanceManager.update();

    if (this.state === 'PLAYING') {
      this.updatePlaying(delta, now / 1000);
    }

    this.renderer.render(this.scene, this.camera);
  };

  private updatePlaying(delta: number, currentTime: number): void {
    // 1. Check Pause Request
    if (this.inputManager.consumePauseRequest()) {
      this.handlePause();
      return;
    }

    // --- CHECK ELIMINATION STATE ---
    if (!this.damageSystem.playerStats.isAlive) {
      this.hud.showDeathOverlay(this.practiceMode.playerRespawnTimer);
      this.playerController.update(delta, 0, 0, false, false, false);
      this.particleManager.update(delta);
      this.botManager.update(delta, this.playerController.position);

      this.practiceMode.update(delta, () => {
        // Player respawn ready
        this.damageSystem.resetPlayer();
        this.playerController.respawn(this.mapData.playerSpawn);
        this.hud.hideDeathOverlay();
      });

      this.hud.updateVitals(this.damageSystem.playerStats);
      this.hud.updateMatchInfo(
        this.practiceMode.timeRemaining,
        this.practiceMode.alphaScore,
        this.practiceMode.omegaScore
      );
      return;
    }

    // 2. Weapon Switch Request
    const switchReq = this.inputManager.consumeWeaponSwitch();
    if (switchReq) {
      this.playerController.weaponManager.switchWeapon(switchReq);
    }

    // 3. Reload Request
    if (this.inputManager.consumeReload()) {
      this.playerController.weaponManager.currentWeapon.reload();
    }

    // 4. Movement & Look
    const moveInput = this.inputManager.getMovementInput();
    const lookInput = this.inputManager.getLookDelta();

    this.playerController.handleLookDelta(lookInput.deltaX, lookInput.deltaY, lookInput.isTouch);
    this.playerController.update(
      delta,
      moveInput.moveX,
      moveInput.moveZ,
      moveInput.isJump,
      moveInput.isCrouch,
      moveInput.isSprint
    );

    // 5. ADS Sync
    this.playerController.weaponManager.currentWeapon.isADS = this.inputManager.isADS();

    // 6. Firing Logic
    const isFireHeld = this.inputManager.isFiring();
    const currentWeapon = this.playerController.weaponManager.currentWeapon;

    if (isFireHeld) {
      // Automatic rifles fire continuously; semi-auto pistols/snipers require fresh press
      const canFireNow = currentWeapon.stats.automatic || !this.wasMouseDown;
      if (canFireNow) {
        if (currentWeapon.shoot(currentTime)) {
          this.handlePlayerShot(currentWeapon);
        }
      }
    }
    this.wasMouseDown = isFireHeld;

    // 7. Update Particles
    this.particleManager.update(delta);

    // 8. Update Bots
    this.botManager.update(delta, this.playerController.position, (dmg) => {
      this.damageSystem.damagePlayer(dmg, 'Omega Bot');
    });

    // 9. Update Practice Mode
    this.practiceMode.update(delta, () => {
      // Player respawn ready
      this.damageSystem.resetPlayer();
      this.playerController.respawn(this.mapData.playerSpawn);
      this.hud.hideDeathOverlay();
    });

    // 10. Update HUD
    const isMoving = Math.abs(moveInput.moveX) > 0.1 || Math.abs(moveInput.moveZ) > 0.1;
    const spreadVal = currentWeapon.getEffectiveSpread(isMoving, moveInput.isCrouch) * 600;
    this.hud.updateCrosshairSpread(spreadVal);
    this.hud.updateVitals(this.damageSystem.playerStats);
    this.hud.updateWeapon(
      currentWeapon.stats,
      currentWeapon.currentAmmo,
      currentWeapon.reserveAmmo,
      currentWeapon.isADS
    );
    this.hud.updateMatchInfo(
      this.practiceMode.timeRemaining,
      this.practiceMode.alphaScore,
      this.practiceMode.omegaScore
    );
  }

  private handlePlayerShot(currentWeapon: any): void {
    this.damageSystem.recordShot();

    // Recoil kick to camera
    this.playerController.applyRecoil(
      currentWeapon.stats.recoilVertical,
      currentWeapon.stats.recoilHorizontal
    );

    // Compute gun muzzle world position
    const muzzleLocal = currentWeapon.modelData.muzzlePosition;
    const muzzleWorld = muzzleLocal.clone().applyMatrix4(this.camera.matrixWorld);

    // Show muzzle flash
    this.particleManager.showMuzzleFlash(muzzleWorld);

    // Eject spent brass shell casing
    const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
    const chamberPos = this.camera.position.clone()
      .addScaledVector(camRight, 0.14)
      .addScaledVector(camUp, -0.12)
      .addScaledVector(new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion), 0.35);
    this.particleManager.ejectShellCasing(chamberPos, camRight, camUp);

    // Raycast hit detection
    const isMoving = this.playerController.velocity.length() > 1.0;
    const spread = currentWeapon.getEffectiveSpread(isMoving, this.playerController.isCrouching);
    const hitResult = this.hitDetection.fireRaycast(spread, currentWeapon.stats.range, muzzleWorld);

    if (hitResult.hit && hitResult.target) {
      this.damageSystem.processPlayerHit(hitResult.target, currentWeapon.stats, hitResult.isHeadshot || false);
      this.hud.triggerHitmarker(hitResult.isHeadshot || false);

      // Display floating damage number
      const estDamage = hitResult.isHeadshot ? currentWeapon.stats.damage * 2.2 : currentWeapon.stats.damage;
      this.hud.showDamageNumber(estDamage, hitResult.isHeadshot || false);

      if (hitResult.target.health <= 0) {
        this.practiceMode.registerPlayerKill();
      }
    }
  }
}
