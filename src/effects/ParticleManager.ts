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
}

export class ParticleManager {
  private scene: THREE.Scene;
  private tracers: BulletTracer[] = [];
  private particles: Particle[] = [];
  private muzzleFlashLight: THREE.PointLight;
  private muzzleFlashMesh: THREE.Mesh;
  private muzzleFlashTimer: number = 0;

  private sparkMat = new THREE.MeshBasicMaterial({ color: 0xffaa22 });
  private dustMat = new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.8 });
  private tracerMat = new THREE.LineBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.9 });

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Muzzle flash light
    this.muzzleFlashLight = new THREE.PointLight(0xffb347, 0, 8);
    this.scene.add(this.muzzleFlashLight);

    // Muzzle flash cross billboard
    const flashGeo = new THREE.PlaneGeometry(0.12, 0.12);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffe680,
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
    // 30 tracer lines
    for (let i = 0; i < 30; i++) {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0)
      ]);
      const line = new THREE.Line(geo, this.tracerMat.clone());
      line.visible = false;
      this.scene.add(line);
      this.tracers.push({
        line,
        startTime: 0,
        duration: 0.12,
        active: false
      });
    }

    // 80 spark / dust particles
    const particleGeo = new THREE.BoxGeometry(0.04, 0.04, 0.04);
    for (let i = 0; i < 80; i++) {
      const mesh = new THREE.Mesh(particleGeo, i % 2 === 0 ? this.sparkMat : this.dustMat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 0.35,
        active: false
      });
    }
  }

  public showMuzzleFlash(worldPos: THREE.Vector3): void {
    this.muzzleFlashLight.position.copy(worldPos);
    this.muzzleFlashLight.intensity = 3.5;
    this.muzzleFlashMesh.position.copy(worldPos);
    this.muzzleFlashMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    (this.muzzleFlashMesh.material as THREE.MeshBasicMaterial).opacity = 0.9;
    this.muzzleFlashTimer = 0.05; // visible for 50ms
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
    (tracer.line.material as THREE.LineBasicMaterial).opacity = 0.85;
  }

  public createImpactEffect(point: THREE.Vector3, normal: THREE.Vector3 = new THREE.Vector3(0, 1, 0), isFlesh: boolean = false): void {
    const count = isFlesh ? 6 : 8;
    let spawned = 0;

    for (const p of this.particles) {
      if (!p.active) {
        p.active = true;
        p.mesh.visible = true;
        p.mesh.position.copy(point);
        p.life = 0;
        p.maxLife = 0.25 + Math.random() * 0.15;

        // Scatter velocity along reflection normal + random spread
        const speed = 2.5 + Math.random() * 3.5;
        p.velocity.copy(normal).multiplyScalar(speed);
        p.velocity.x += (Math.random() - 0.5) * speed * 0.8;
        p.velocity.y += Math.random() * speed * 0.6;
        p.velocity.z += (Math.random() - 0.5) * speed * 0.8;

        if (isFlesh) {
          (p.mesh.material as THREE.MeshBasicMaterial).color.setHex(0xb91c1c); // crimson blood
        } else {
          (p.mesh.material as THREE.MeshBasicMaterial).color.setHex(Math.random() > 0.4 ? 0xffaa22 : 0x777777);
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
          (t.line.material as THREE.LineBasicMaterial).opacity = alpha * 0.85;
        }
      }
    }

    // Update particles
    for (const p of this.particles) {
      if (p.active) {
        p.life += delta;
        if (p.life >= p.maxLife) {
          p.active = false;
          p.mesh.visible = false;
        } else {
          p.velocity.y -= 9.8 * delta; // gravity
          p.mesh.position.addScaledVector(p.velocity, delta);
          const scale = 1 - p.life / p.maxLife;
          p.mesh.scale.setScalar(scale);
        }
      }
    }
  }
}
