import * as THREE from 'three';
import { GameSettings, GameState, GraphicsQuality } from '../types';
import { AudioManager } from '../core/AudioManager';
import { InputManager } from '../core/InputManager';
import { PerformanceManager } from '../core/PerformanceManager';
import { ParticleManager } from '../effects/ParticleManager';
import { CheatManager } from '../core/CheatManager';
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
import { CheatMenu } from '../ui/CheatMenu';
import { TotemSystem } from '../combat/TotemSystem';
import { VehicleController } from '../vehicles/VehicleController';

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
  private cheatManager!: CheatManager;
  private totemSystem!: TotemSystem;
  private vehicleController!: VehicleController;
  private mapData!: MapData;

  // UI Layers
  private hud!: HUD;
  private mainMenu!: MainMenu;
  private settingsMenu!: SettingsMenu;
  private matchResults!: MatchResults;
  private cheatMenu!: CheatMenu;

  // State
  public state: GameState = 'MENU';
  public isDrivingVehicle: boolean = false;
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

    // 2. Scene & Azure Daylight Atmospheric Fog (Zero Darkness!)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.FogExp2(0xdbeafe, 0.001);

    // 3. Camera (900m far plane for massive open world exploration)
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 900);
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

    // 8. Cheat Manager
    this.cheatManager = new CheatManager(this.scene, this.audioManager, this.botManager);

    // 9. Totem of Undying System
    this.totemSystem = new TotemSystem(this.audioManager);

    // 10. Tactical Vehicle Buggy
    this.vehicleController = new VehicleController(
      this.mapData.vehicleSpawn,
      this.scene,
      this.audioManager,
      this.mapData.colliders
    );

    // 11. Player Controller
    this.playerController = new PlayerController(this.camera, this.mapData.colliders, this.audioManager);
    this.playerController.setPosition(this.mapData.playerSpawn);

    // 12. Combat Systems
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

    // 13. Practice Match Mode
    this.practiceMode = new PracticeMode({ targetScore: 15, matchDurationSec: 300 }, (isVictory) => {
      this.handleMatchEnd(isVictory);
    });

    // 12. Performance Manager
    this.performanceManager = new PerformanceManager(this.container, this.renderer);
    this.performanceManager.setVisible(this.settings.showFps);

    // 13. Input Manager
    this.inputManager = new InputManager(this.renderer.domElement);

    // 14. UI Systems
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

    // 15. Cheat Menu UI
    this.cheatMenu = new CheatMenu(this.container, this.cheatManager, {
      onClose: () => {
        if (this.state === 'PLAYING') {
          this.inputManager.requestPointerLock();
        }
      },
      onNuke: () => {
        this.cheatManager.nukeAllBots((bot) => {
          this.damageSystem.playerStats.kills++;
          this.hud.addKillFeedEntry({
            id: Math.random().toString(36).substring(2, 9),
            killer: 'OPERATIVE',
            victim: bot.name,
            weapon: 'TACTICAL NUKE',
            isHeadshot: true,
            isPlayerKill: true,
            timestamp: Date.now()
          });
          this.practiceMode.registerPlayerKill();
        });
        this.hud.showDamageNumber(9999, true);
      },
      onHeal: () => {
        this.damageSystem.playerStats.health = 100;
        this.damageSystem.playerStats.armor = 100;
        this.hud.updateVitals(this.damageSystem.playerStats);
        this.audioManager.playReload('magIn');
      }
    });

    // Wire HUD Callbacks
    this.hud.onOpenCheats = () => this.openCheatMenu();
    this.hud.onPauseGame = () => this.handlePause();
    this.hud.onVehicleInteract = () => this.toggleVehicleInteract();

    // 16. Window Listeners
    window.addEventListener('resize', () => this.handleResize());
    window.addEventListener('blur', () => this.handlePause());

    // 17. Start Loop
    this.animate();
  }

  public openCheatMenu(): void {
    this.cheatMenu.setVisible(true);
    this.inputManager.exitPointerLock();
  }

  public toggleVehicleInteract(): void {
    if (this.isDrivingVehicle) {
      // Exit vehicle
      this.isDrivingVehicle = false;
      this.vehicleController.isOccupied = false;
      const exitPos = this.vehicleController.position.clone().add(new THREE.Vector3(-2.4, 0, 0));
      this.playerController.setPosition(exitPos);
      this.camera.position.set(exitPos.x, exitPos.y + 1.65, exitPos.z);
      this.playerController.weaponManager.currentWeapon.modelData.mesh.visible = true;
      this.hud.showVehiclePrompt('DRIVE TACTICAL BUGGY [E]');
      this.inputManager.touchControls.setVehicleMode(false);
    } else {
      const dist = this.playerController.position.distanceTo(this.vehicleController.position);
      if (dist < 6.5) {
        // Mount vehicle
        this.isDrivingVehicle = true;
        this.vehicleController.isOccupied = true;
        this.playerController.weaponManager.currentWeapon.modelData.mesh.visible = false;
        this.hud.showVehiclePrompt('EXIT TACTICAL VEHICLE [E]');
        this.inputManager.touchControls.setVehicleMode(true);
      }
    }
  }

  public startMatch(): void {
    this.audioManager.unlock();
    this.damageSystem.resetPlayer();
    this.totemSystem.reset();
    this.hud.setTotemActive(true);
    this.hud.hideVehiclePrompt();

    this.isDrivingVehicle = false;
    this.vehicleController.isOccupied = false;
    this.vehicleController.position.copy(this.mapData.vehicleSpawn);
    this.vehicleController.speed = 0;
    this.vehicleController.yaw = 0;

    this.playerController.respawn(this.mapData.playerSpawn);
    this.playerController.weaponManager.currentWeapon.modelData.mesh.visible = true;
    this.botManager.initBots(this.mapData.botSpawns, this.mapData.waypoints, 4);
    this.practiceMode.startMatch();

    this.state = 'PLAYING';
    this.mainMenu.setVisible(false);
    this.matchResults.hideResults();
    this.matchResults.hidePause();
    this.cheatMenu.setVisible(false);
    this.hud.hideDeathOverlay();
    this.hud.setVisible(true);
    this.inputManager.touchControls.setVisible(true);

    // Request pointer lock for desktop
    this.inputManager.requestPointerLock();
  }

  public handlePause(): void {
    if (this.state !== 'PLAYING') return;
    if (this.cheatMenu.isVisible()) return; // Don't trigger pause if cheat menu is open
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
    this.cheatMenu.setVisible(false);
    this.mainMenu.setVisible(true);
    this.inputManager.exitPointerLock();
    this.botManager.clear();
  }

  private handleMatchEnd(isVictory: boolean): void {
    this.state = 'GAMEOVER';
    this.inputManager.exitPointerLock();
    this.hud.setVisible(false);
    this.inputManager.touchControls.setVisible(false);
    this.cheatMenu.setVisible(false);
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
    // 1. Check Cheat Request (Desktop ~ / F1 or Mobile secret tap)
    if (this.inputManager.consumeCheatRequest()) {
      this.openCheatMenu();
      return;
    }

    // 2. Check Pause Request (ESC or HUD ⏸ Pause button)
    if (this.inputManager.consumePauseRequest()) {
      this.handlePause();
      return;
    }

    // 3. Update Totem System
    this.totemSystem.update(delta);

    // 4. Check Vehicle Interact Request (KeyE or Mobile DRIVE button)
    if (this.inputManager.consumeVehicleInteract()) {
      this.toggleVehicleInteract();
    }

    // Vehicle Proximity Prompt
    const distToVehicle = this.playerController.position.distanceTo(this.vehicleController.position);
    if (this.isDrivingVehicle) {
      this.hud.showVehiclePrompt('EXIT TACTICAL VEHICLE [E]');
      this.inputManager.touchControls.setVehicleMode(true);
    } else if (distToVehicle < 6.5) {
      this.hud.showVehiclePrompt('DRIVE TACTICAL BUGGY [E]');
      this.inputManager.touchControls.setVehicleMode(false);
    } else {
      this.hud.hideVehiclePrompt();
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
        this.totemSystem.reset();
        this.hud.setTotemActive(true);
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

    const moveInput = this.inputManager.getMovementInput();
    const lookInput = this.inputManager.getLookDelta();
    const currentWeapon = this.playerController.weaponManager.currentWeapon;

    if (this.isDrivingVehicle) {
      // --- DRIVING TACTICAL BUGGY MODE ---
      this.vehicleController.update(
        delta,
        moveInput.moveZ,
        moveInput.moveX,
        (crushedBot) => {
          this.damageSystem.playerStats.kills++;
          this.hud.addKillFeedEntry({
            id: Math.random().toString(36).substring(2, 9),
            killer: 'OPERATIVE (BUGGY)',
            victim: crushedBot.name,
            weapon: 'TACTICAL BUGGY',
            isHeadshot: false,
            isPlayerKill: true,
            timestamp: Date.now()
          });
          this.practiceMode.registerPlayerKill();
          this.hud.showDamageNumber(300, true);
        },
        this.botManager.getBots()
      );

      // Lock player model & seat position to buggy
      const seatPos = this.vehicleController.getDriverSeatWorldPos();
      this.playerController.setPosition(seatPos);

      // Chase camera third-person view
      const targetCamPos = this.vehicleController.getChaseCameraPos();
      this.camera.position.lerp(targetCamPos, 0.2);
      this.camera.lookAt(this.vehicleController.getLookTarget());

      // Hide first person viewmodel while driving
      currentWeapon.modelData.mesh.visible = false;
    } else {
      // --- FOOT COMBAT MODE ---
      // Update vehicle idle physics (roll to stop)
      this.vehicleController.update(delta, 0, 0);

      // 5. Weapon Switch Request
      const switchReq = this.inputManager.consumeWeaponSwitch();
      if (switchReq) {
        this.playerController.weaponManager.switchWeapon(switchReq);
      }

      // 6. Reload Request
      if (this.inputManager.consumeReload()) {
        currentWeapon.reload();
      }

      // 7. Movement & Look
      this.playerController.handleLookDelta(lookInput.deltaX, lookInput.deltaY, lookInput.isTouch);
      this.playerController.update(
        delta,
        moveInput.moveX,
        moveInput.moveZ,
        moveInput.isJump,
        moveInput.isCrouch,
        moveInput.isSprint,
        this.cheatManager.state.superSpeed,
        this.cheatManager.state.superJump
      );

      // 8. ADS Sync
      currentWeapon.isADS = this.inputManager.isADS();

      // 9. Firing Logic (with Infinite Ammo cheat)
      const isFireHeld = this.inputManager.isFiring();
      if (isFireHeld) {
        const canFireNow = currentWeapon.stats.automatic || !this.wasMouseDown;
        if (canFireNow) {
          if (currentWeapon.shoot(currentTime, this.cheatManager.state.infiniteAmmo)) {
            this.handlePlayerShot(currentWeapon);
          }
        }
      }
      this.wasMouseDown = isFireHeld;
    }

    // 10. Update Particles & Cheats
    this.particleManager.update(delta);
    this.cheatManager.update(delta);

    // 11. Update Bots (with Totem of Undying, God Mode and Freeze Bots cheats)
    this.botManager.update(
      delta,
      this.playerController.position,
      (dmg) => {
        if (this.totemSystem.isInvulnerable) return;

        this.damageSystem.damagePlayer(
          dmg,
          'Omega Bot',
          this.cheatManager.state.godMode,
          () => {
            if (this.totemSystem.hasTotem) {
              const saved = this.totemSystem.triggerTotem();
              if (saved) {
                this.hud.triggerTotemRevival();
                return true;
              }
            }
            return false;
          }
        );
      },
      this.cheatManager.state.freezeBots
    );

    // 12. Update Practice Mode
    this.practiceMode.update(delta, () => {
      this.damageSystem.resetPlayer();
      this.totemSystem.reset();
      this.hud.setTotemActive(true);
      this.playerController.respawn(this.mapData.playerSpawn);
      this.hud.hideDeathOverlay();
    });

    // 11. Update HUD & Active Cheats Badge
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

    // Update Active Cheats Pills on HUD
    const activeCheats: string[] = [];
    if (this.cheatManager.state.godMode) activeCheats.push('🛡️ GOD MODE');
    if (this.cheatManager.state.infiniteAmmo) activeCheats.push('♾️ INF AMMO');
    if (this.cheatManager.state.oneShotKill) activeCheats.push('💥 INSTA-KILL');
    if (this.cheatManager.state.superSpeed) activeCheats.push('⚡ SPEED');
    if (this.cheatManager.state.superJump) activeCheats.push('🚀 MOON JUMP');
    if (this.cheatManager.state.aimbot) activeCheats.push('🎯 AIMBOT');
    if (this.cheatManager.state.wallhack) activeCheats.push('👁️ ESP');
    if (this.cheatManager.state.freezeBots) activeCheats.push('🧊 FROZEN');
    this.hud.updateActiveCheats(activeCheats);
  }

  private handlePlayerShot(currentWeapon: any): void {
    this.damageSystem.recordShot();

    // Aimbot auto-lock snap
    if (this.cheatManager.state.aimbot) {
      const cameraDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
      const aimTarget = this.cheatManager.findAimbotTarget(this.camera.position, cameraDir);
      if (aimTarget) {
        this.camera.lookAt(aimTarget);
        const euler = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
        this.playerController.yaw = euler.y;
        this.playerController.pitch = euler.x;
      }
    }

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
      const isOneShot = this.cheatManager.state.oneShotKill;
      this.damageSystem.processPlayerHit(
        hitResult.target,
        currentWeapon.stats,
        hitResult.isHeadshot || false,
        isOneShot
      );
      this.hud.triggerHitmarker(hitResult.isHeadshot || false || isOneShot);

      // Display floating damage number
      const estDamage = isOneShot ? 9999 : (hitResult.isHeadshot ? currentWeapon.stats.damage * 2.2 : currentWeapon.stats.damage);
      this.hud.showDamageNumber(estDamage, hitResult.isHeadshot || false || isOneShot);

      if (hitResult.target.health <= 0) {
        this.practiceMode.registerPlayerKill();
      }
    }
  }
}
