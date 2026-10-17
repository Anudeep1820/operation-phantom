import { TouchControls } from '../controls/TouchControls';
import { WeaponType } from '../types';

export class InputManager {
  private domElement: HTMLElement;
  public touchControls: TouchControls;

  // Keyboard state
  private keys: Record<string, boolean> = {};

  // Mouse state
  public isPointerLocked: boolean = false;
  private mouseDeltaX: number = 0;
  private mouseDeltaY: number = 0;
  public isMouseFiring: boolean = false;
  public isMouseADS: boolean = false;

  // Requests
  public switchWeaponRequest: WeaponType | null = null;
  public wantsReload: boolean = false;
  public isPauseRequested: boolean = false;
  public isCheatRequested: boolean = false;

  constructor(domElement: HTMLElement) {
    this.domElement = domElement;
    this.touchControls = new TouchControls(domElement);

    this.setupKeyboard();
    this.setupMouse();
  }

  private setupKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (e.code === 'KeyR') {
        this.wantsReload = true;
      }
      if (e.code === 'Digit1') {
        this.switchWeaponRequest = 'AR7';
      }
      if (e.code === 'Digit2') {
        this.switchWeaponRequest = 'VIPER9';
      }
      if (e.code === 'Digit3') {
        this.switchWeaponRequest = 'LONGSHOT';
      }
      if (e.code === 'Escape') {
        this.isPauseRequested = true;
      }
      if (e.code === 'Backquote' || e.code === 'F1') {
        this.isCheatRequested = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  private setupMouse(): void {
    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.domElement;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isPointerLocked) {
        this.mouseDeltaX += e.movementX;
        this.mouseDeltaY += e.movementY;
      }
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isMouseFiring = true;
      }
      if (e.button === 2) {
        e.preventDefault();
        this.isMouseADS = !this.isMouseADS;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isMouseFiring = false;
      }
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  public requestPointerLock(): void {
    try {
      this.domElement.requestPointerLock();
    } catch (e) {
      // Ignore if browser restricts
    }
  }

  public exitPointerLock(): void {
    try {
      if (document.exitPointerLock) {
        document.exitPointerLock();
      }
    } catch (e) {}
  }

  public getMovementInput(): { moveX: number; moveZ: number; isSprint: boolean; isJump: boolean; isCrouch: boolean } {
    let moveX = 0;
    let moveZ = 0;

    // Keyboard WASD
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ -= 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    // Combine with virtual joystick
    moveX += this.touchControls.state.moveX;
    moveZ += this.touchControls.state.moveZ;

    // Clamp
    moveX = Math.max(-1, Math.min(1, moveX));
    moveZ = Math.max(-1, Math.min(1, moveZ));

    const isSprint = this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.touchControls.state.isSprint;
    const isJump = this.keys['Space'] || this.touchControls.state.isJump;
    const isCrouch = this.keys['KeyC'] || this.touchControls.state.isCrouch;

    return { moveX, moveZ, isSprint, isJump, isCrouch };
  }

  public getLookDelta(): { deltaX: number; deltaY: number; isTouch: boolean } {
    // Touch deltas
    const touchDelta = this.touchControls.consumeLookDelta();

    // Mouse deltas
    const mDx = this.mouseDeltaX;
    const mDy = this.mouseDeltaY;
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;

    if (Math.abs(touchDelta.dx) > 0 || Math.abs(touchDelta.dy) > 0) {
      return { deltaX: touchDelta.dx, deltaY: touchDelta.dy, isTouch: true };
    }
    return { deltaX: mDx, deltaY: mDy, isTouch: false };
  }

  public isFiring(): boolean {
    return this.isMouseFiring || this.touchControls.state.isFiring;
  }

  public isADS(): boolean {
    return this.isMouseADS || this.touchControls.state.isADS;
  }

  public consumeReload(): boolean {
    const res = this.wantsReload || this.touchControls.state.wantsReload;
    this.wantsReload = false;
    this.touchControls.state.wantsReload = false;
    return res;
  }

  public consumeWeaponSwitch(): WeaponType | null {
    if (this.switchWeaponRequest) {
      const w = this.switchWeaponRequest;
      this.switchWeaponRequest = null;
      return w;
    }
    if (this.touchControls.state.switchWeaponRequest !== null) {
      const slot = this.touchControls.state.switchWeaponRequest;
      this.touchControls.state.switchWeaponRequest = null;
      if (slot === 1) return 'AR7';
      if (slot === 2) return 'VIPER9';
      if (slot === 3) return 'LONGSHOT';
    }
    return null;
  }

  public consumePauseRequest(): boolean {
    const res = this.isPauseRequested || this.touchControls.state.isPauseRequested;
    this.isPauseRequested = false;
    this.touchControls.state.isPauseRequested = false;
    return res;
  }

  public consumeCheatRequest(): boolean {
    const res = this.isCheatRequested || this.touchControls.state.isCheatRequested;
    this.isCheatRequested = false;
    this.touchControls.state.isCheatRequested = false;
    return res;
  }
}

