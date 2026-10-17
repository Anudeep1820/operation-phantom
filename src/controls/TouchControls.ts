export interface TouchInputState {
  moveX: number; // -1 to 1
  moveZ: number; // -1 to 1
  lookDeltaX: number;
  lookDeltaY: number;
  isFiring: boolean;
  isADS: boolean;
  isJump: boolean;
  isCrouch: boolean;
  isSprint: boolean;
  wantsReload: boolean;
  switchWeaponRequest: number | null; // 1, 2, or 3
  isPauseRequested: boolean;
  isCheatRequested: boolean;
}

export class TouchControls {
  private container: HTMLElement;
  public state: TouchInputState = {
    moveX: 0,
    moveZ: 0,
    lookDeltaX: 0,
    lookDeltaY: 0,
    isFiring: false,
    isADS: false,
    isJump: false,
    isCrouch: false,
    isSprint: false,
    wantsReload: false,
    switchWeaponRequest: null,
    isPauseRequested: false,
    isCheatRequested: false
  };

  private joystickContainer!: HTMLElement;
  private joystickKnob!: HTMLElement;
  private touchLookArea!: HTMLElement;

  private joystickPointerId: number | null = null;
  private joystickOrigin = { x: 0, y: 0 };
  private joystickRadius = 55;

  private lookPointerId: number | null = null;
  private lastLookPos = { x: 0, y: 0 };

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'touch-controls-layer';
    this.container.className = 'touch-controls-layer';
    parent.appendChild(this.container);

    this.buildTouchUI();
    this.attachEventListeners();
  }

  private buildTouchUI(): void {
    this.container.innerHTML = `
      <!-- Left Movement Joystick Zone -->
      <div id="touch-joystick-zone" class="touch-zone-left">
        <div id="joystick-base" class="joystick-base">
          <div id="joystick-knob" class="joystick-knob"></div>
        </div>
        <button id="touch-sprint-btn" class="touch-btn sprint-btn" aria-label="Sprint">
          <span class="btn-icon">⚡</span>
          <span class="btn-label">RUN</span>
        </button>
      </div>

      <!-- Right Camera Aim Swipe Zone -->
      <div id="touch-look-zone" class="touch-zone-right"></div>

      <!-- Right Action Combat Buttons -->
      <div class="touch-actions-cluster">
        <!-- Weapon Switch Row -->
        <div class="touch-weapon-dock">
          <button id="touch-wpn-1" class="touch-wpn-pill active" data-slot="1">AR-7</button>
          <button id="touch-wpn-2" class="touch-wpn-pill" data-slot="2">VIPER</button>
          <button id="touch-wpn-3" class="touch-wpn-pill" data-slot="3">SNIPER</button>
        </div>

        <!-- Combat Action Buttons -->
        <div class="touch-action-buttons">
          <button id="touch-ads-btn" class="touch-btn ads-btn" aria-label="Aim Down Sights">
            <span class="btn-icon">🎯</span>
            <span class="btn-label">ADS</span>
          </button>
          
          <button id="touch-reload-btn" class="touch-btn reload-btn" aria-label="Reload">
            <span class="btn-icon">🔄</span>
            <span class="btn-label">RELOAD</span>
          </button>

          <button id="touch-jump-btn" class="touch-btn jump-btn" aria-label="Jump">
            <span class="btn-icon">▲</span>
            <span class="btn-label">JUMP</span>
          </button>

          <button id="touch-crouch-btn" class="touch-btn crouch-btn" aria-label="Crouch">
            <span class="btn-icon">▼</span>
            <span class="btn-label">CROUCH</span>
          </button>

          <!-- Primary Fire Trigger Button -->
          <button id="touch-fire-btn" class="touch-btn fire-btn" aria-label="Fire Weapon">
            <div class="fire-inner-ring">
              <span class="fire-label">FIRE</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Mobile Top Bar: Pause & Cheats Buttons -->
      <div class="touch-top-bar">
        <button id="touch-cheats-btn" class="touch-btn cheat-btn" aria-label="Operative Cheats">⚡</button>
        <button id="touch-pause-btn" class="touch-btn pause-btn" aria-label="Pause Menu">⏸</button>
      </div>
    `;

    this.joystickContainer = this.container.querySelector('#joystick-base') as HTMLElement;
    this.joystickKnob = this.container.querySelector('#joystick-knob') as HTMLElement;
    this.touchLookArea = this.container.querySelector('#touch-look-zone') as HTMLElement;
  }

  private attachEventListeners(): void {
    const joystickZone = this.container.querySelector('#touch-joystick-zone') as HTMLElement;

    // --- JOYSTICK POINTER EVENTS ---
    joystickZone.addEventListener('pointerdown', (e: PointerEvent) => {
      if (this.joystickPointerId !== null) return;
      this.joystickPointerId = e.pointerId;
      joystickZone.setPointerCapture(e.pointerId);

      const rect = this.joystickContainer.getBoundingClientRect();
      this.joystickOrigin = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
      this.handleJoystickMove(e.clientX, e.clientY);
    });

    joystickZone.addEventListener('pointermove', (e: PointerEvent) => {
      if (e.pointerId !== this.joystickPointerId) return;
      this.handleJoystickMove(e.clientX, e.clientY);
    });

    const resetJoystick = (e: PointerEvent) => {
      if (e.pointerId !== this.joystickPointerId) return;
      this.joystickPointerId = null;
      this.state.moveX = 0;
      this.state.moveZ = 0;
      this.joystickKnob.style.transform = `translate(0px, 0px)`;
    };
    joystickZone.addEventListener('pointerup', resetJoystick);
    joystickZone.addEventListener('pointercancel', resetJoystick);

    // --- CAMERA LOOK POINTER EVENTS ---
    this.touchLookArea.addEventListener('pointerdown', (e: PointerEvent) => {
      if (this.lookPointerId !== null) return;
      this.lookPointerId = e.pointerId;
      this.touchLookArea.setPointerCapture(e.pointerId);
      this.lastLookPos = { x: e.clientX, y: e.clientY };
    });

    this.touchLookArea.addEventListener('pointermove', (e: PointerEvent) => {
      if (e.pointerId !== this.lookPointerId) return;
      const dx = e.clientX - this.lastLookPos.x;
      const dy = e.clientY - this.lastLookPos.y;
      this.state.lookDeltaX += dx;
      this.state.lookDeltaY += dy;
      this.lastLookPos = { x: e.clientX, y: e.clientY };
    });

    const resetLook = (e: PointerEvent) => {
      if (e.pointerId !== this.lookPointerId) return;
      this.lookPointerId = null;
    };
    this.touchLookArea.addEventListener('pointerup', resetLook);
    this.touchLookArea.addEventListener('pointercancel', resetLook);

    // --- FIRE BUTTON ---
    const fireBtn = this.container.querySelector('#touch-fire-btn') as HTMLElement;
    fireBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.state.isFiring = true;
    });
    window.addEventListener('pointerup', () => {
      this.state.isFiring = false;
    });

    // --- ADS TOGGLE ---
    const adsBtn = this.container.querySelector('#touch-ads-btn') as HTMLElement;
    adsBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.state.isADS = !this.state.isADS;
      adsBtn.classList.toggle('active', this.state.isADS);
    });

    // --- RELOAD BUTTON ---
    const reloadBtn = this.container.querySelector('#touch-reload-btn') as HTMLElement;
    reloadBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.state.wantsReload = true;
    });

    // --- JUMP BUTTON ---
    const jumpBtn = this.container.querySelector('#touch-jump-btn') as HTMLElement;
    jumpBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.state.isJump = true;
    });
    jumpBtn.addEventListener('pointerup', () => {
      this.state.isJump = false;
    });

    // --- CROUCH BUTTON ---
    const crouchBtn = this.container.querySelector('#touch-crouch-btn') as HTMLElement;
    crouchBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.state.isCrouch = !this.state.isCrouch;
      crouchBtn.classList.toggle('active', this.state.isCrouch);
    });

    // --- SPRINT TOGGLE ---
    const sprintBtn = this.container.querySelector('#touch-sprint-btn') as HTMLElement;
    sprintBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.state.isSprint = !this.state.isSprint;
      sprintBtn.classList.toggle('active', this.state.isSprint);
    });

    // --- WEAPON SELECTOR PILLS ---
    const wpnPills = this.container.querySelectorAll('.touch-wpn-pill');
    wpnPills.forEach((pill) => {
      pill.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        wpnPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const slot = parseInt(pill.getAttribute('data-slot') || '1', 10);
        this.state.switchWeaponRequest = slot;
      });
    });

    // --- PAUSE & CHEATS BUTTONS ---
    const pauseBtn = this.container.querySelector('#touch-pause-btn') as HTMLElement;
    pauseBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.state.isPauseRequested = true;
    });

    const cheatBtn = this.container.querySelector('#touch-cheats-btn') as HTMLElement;
    if (cheatBtn) {
      cheatBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.state.isCheatRequested = true;
      });
    }
  }

  private handleJoystickMove(clientX: number, clientY: number): void {
    const dx = clientX - this.joystickOrigin.x;
    const dy = clientY - this.joystickOrigin.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(dist, this.joystickRadius);

    const angle = Math.atan2(dy, dx);
    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    this.joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;

    const normDist = clampedDist / this.joystickRadius;
    this.state.moveX = Math.cos(angle) * normDist;
    this.state.moveZ = -Math.sin(angle) * normDist; // inverted for forward/back
  }

  public consumeLookDelta(): { dx: number; dy: number } {
    const res = { dx: this.state.lookDeltaX, dy: this.state.lookDeltaY };
    this.state.lookDeltaX = 0;
    this.state.lookDeltaY = 0;
    return res;
  }

  public setVisible(visible: boolean): void {
    this.container.style.display = visible ? 'block' : 'none';
  }
}
