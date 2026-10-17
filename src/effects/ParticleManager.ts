import * as THREE from 'three';

interface BulletTracer {
  line: THREE.Line;
  startTime: number;
  duration: number;
  active: boolean;
}

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  active: boolean;
  gravity: number;
}

interface ShellCasing {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  rotVelocity: THREE.Vector3;
  life: number;
  maxLife: number;
  active: boolean;
}

export class ParticleManager {
  private scene: THREE.Scene;
  private tracers: BulletTracer[] = [];
  private particles: Particle[] = [];
  private casings: ShellCasing[] = [];
  private muzzleFlashLight: THREE.PointLight;
  private muzzleFlashMesh: THREE.Mesh;
  private muzzleFlashTimer: number = 0;

  private sparkMat = new THREE.MeshBasicMaterial({ color: 0xffcc33 });
  private bloodMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  private dustMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.8 });
  private brassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // High-intensity Muzzle flash light
    this.muzzleFlashLight = new THREE.PointLight(0xffea75, 0, 14, 1.2);
    this.scene.add(this.muzzleFlashLight);

    // Muzzle flash starburst
    const flashGeo = new THREE.PlaneGeometry(0.24, 0.24);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0
    });
    this.muzzleFlashMesh = new THREE.Mesh(flashGeo, flashMat);
    this.scene.add(this.muzzleFlashMesh);

    // Pre-allocate pools
    this.initPools();
  }

  private initPools(): void {
    // 35 luminous tracer lines
    const tracerMat = new THREE.LineBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.95 });
    for (let i = 0; i < 35; i++) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0)
      ]);
      const line = new THREE.Line(geo, tracerMat.clone());
      line.visible = false;
      this.scene.add(line);
      this.tracers.push({
        line,
        startTime: 0,
        duration: 0.16,
        active: false
      });
    }

    // 120 impact sparks, dust, and blood particles
    const particleGeo = new THREE.BoxGeometry(0.045, 0.045, 0.045);
    for (let i = 0; i < 120; i++) {
      const mesh = new THREE.Mesh(particleGeo, this.sparkMat.clone());
      mesh.visible = false;
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 0.4,
        active: false,
        gravity: 12.0
      });
    }

    // 25 Brass Shell Casings
    const casingGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.035, 8);
    for (let i = 0; i < 25; i++) {
      const mesh = new THREE.Mesh(casingGeo, this.brassMat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.casings.push({
        mesh,
        velocity: new THREE.Vector3(),
        rotVelocity: new THREE.Vector3(),
        life: 0,
        maxLife: 1.2,
        active: false
      });
    }
  }

  public showMuzzleFlash(worldPos: THREE.Vector3): void {
    this.muzzleFlashLight.position.copy(worldPos);
    this.muzzleFlashLight.intensity = 5.5;
    this.muzzleFlashMesh.position.copy(worldPos);
    this.muzzleFlashMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    (this.muzzleFlashMesh.material as THREE.MeshBasicMaterial).opacity = 1.0;
    this.muzzleFlashTimer = 0.06; // 60ms flash
  }

  public ejectShellCasing(chamberPos: THREE.Vector3, cameraRight: THREE.Vector3, cameraUp: THREE.Vector3): void {
    const casing = this.casings.find(c => !c.active);
    if (!casing) return;

    casing.active = true;
    casing.mesh.visible = true;
    casing.mesh.position.copy(chamberPos);
    casing.life = 0;

    // Eject to the right and slightly up
    casing.velocity.set(0, 0, 0)
      .addScaledVector(cameraRight, 1.8 + Math.random() * 0.8)
      .addScaledVector(cameraUp, 1.2 + Math.random() * 0.6);

    casing.rotVelocity.set(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20
    );
  }

  public createTracer(start: THREE.Vector3, end: THREE.Vector3): void {
    const tracer = this.tracers.find(t => !t.active) || this.tracers[0];
    tracer.active = true;
    tracer.startTime = performance.now();
    const positions = (tracer.line.geometry.attributes.position as THREE.BufferAttribute);
    positions.setXYZ(0, start.x, start.y, start.z);
    positions.setXYZ(1, end.x, end.y, end.z);
    positions.needsUpdate = true;
    tracer.line.visible = true;
    (tracer.line.material as THREE.LineBasicMaterial).opacity = 0.95;
  }

  public createImpactEffect(point: THREE.Vector3, normal: THREE.Vector3 = new THREE.Vector3(0, 1, 0), isFlesh: boolean = false): void {
    const count = isFlesh ? 14 : 10;
    let spawned = 0;

    for (const p of this.particles) {
      if (!p.active) {
        p.active = true;
        p.mesh.visible = true;
        p.mesh.position.copy(point);
        p.life = 0;
        p.maxLife = 0.3 + Math.random() * 0.2;

        const speed = isFlesh ? (3.0 + Math.random() * 4.0) : (4.5 + Math.random() * 5.0);
        p.velocity.copy(normal).multiplyScalar(speed);
        p.velocity.x += (Math.random() - 0.5) * speed * 0.9;
        p.velocity.y += Math.random() * speed * 0.7;
        p.velocity.z += (Math.random() - 0.5) * speed * 0.9;

        if (isFlesh) {
          (p.mesh.material as THREE.MeshBasicMaterial).color.setHex(0xdc2626); // vivid blood red
          p.gravity = 14.0;
        } else {
          (p.mesh.material as THREE.MeshBasicMaterial).color.setHex(Math.random() > 0.3 ? 0xffcc33 : 0xffffff);
          p.gravity = 18.0;
        }

        spawned++;
        if (spawned >= count) break;
      }
    }
  }

  public update(delta: number): void {
    const now = performance.now();

    // Update muzzle flash
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= delta;
      if (this.muzzleFlashTimer <= 0) {
        this.muzzleFlashLight.intensity = 0;
        (this.muzzleFlashMesh.material as THREE.MeshBasicMaterial).opacity = 0;
      }
    }

    // Update tracers
    for (const t of this.tracers) {
      if (t.active) {
        const elapsed = (now - t.startTime) / 1000;
        if (elapsed >= t.duration) {
          t.active = false;
          t.line.visible = false;
        } else {
          const alpha = 1 - elapsed / t.duration;
          (t.line.material as THREE.LineBasicMaterial).opacity = alpha * 0.95;
        }
      }
    }

    // Update particles (sparks, blood)
    for (const p of this.particles) {
      if (p.active) {
        p.life += delta;
        if (p.life >= p.maxLife) {
          p.active = false;
          p.mesh.visible = false;
        } else {
          p.velocity.y -= p.gravity * delta;
          p.mesh.position.addScaledVector(p.velocity, delta);
          const scale = 1 - p.life / p.maxLife;
          p.mesh.scale.setScalar(scale);
        }
      }
    }

    // Update shell casings
    for (const c of this.casings) {
      if (c.active) {
        c.life += delta;
        if (c.life >= c.maxLife || c.mesh.position.y < 0.05) {
          c.active = false;
          c.mesh.visible = false;
        } else {
          c.velocity.y -= 14.0 * delta; // gravity
          c.mesh.position.addScaledVector(c.velocity, delta);
          c.mesh.rotation.x += c.rotVelocity.x * delta;
          c.mesh.rotation.y += c.rotVelocity.y * delta;
          c.mesh.rotation.z += c.rotVelocity.z * delta;
        }
      }
    }
  }
}
