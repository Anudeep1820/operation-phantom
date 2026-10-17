import * as THREE from 'three';

export interface MapData {
  group: THREE.Group;
  colliders: THREE.Box3[];
  playerSpawn: THREE.Vector3;
  botSpawns: THREE.Vector3[];
  waypoints: THREE.Vector3[];
  coverPoints: THREE.Vector3[];
}

export class NeonDistrict {
  public static create(): MapData {
    const group = new THREE.Group();
    const colliders: THREE.Box3[] = [];

    // --- MATERIALS ---
    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x2a2f38,
      roughness: 0.75,
      metalness: 0.15
    });

    const sidewalkMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.8,
      metalness: 0.1
    });

    const buildingMat1 = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.65,
      metalness: 0.25
    });

    const buildingMat2 = new THREE.MeshStandardMaterial({
      color: 0x3f4a5c,
      roughness: 0.6,
      metalness: 0.3
    });

    const containerCyanMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.45,
      metalness: 0.55
    });

    const containerOrangeMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.45,
      metalness: 0.55
    });

    const metalCrateMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.5,
      metalness: 0.6
    });

    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0xb91c1c, // Red explosive tactical barrel
      roughness: 0.4,
      metalness: 0.7
    });

    // Glowing Tactical Neon Materials
    const neonCyanMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const neonMagentaMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    const neonAmberMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const neonGreenMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
    const windowGlowMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc });
    const lampBulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Helper: Add box with optional collider
    function addBox(x: number, y: number, z: number, w: number, h: number, d: number, mat: THREE.Material, hasCollider = true): THREE.Mesh {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y + h / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);

      if (hasCollider) {
        const box = new THREE.Box3();
        box.setFromObject(mesh);
        colliders.push(box);
      }
      return mesh;
    }

    // --- 1. GROUND & HIGH-CONTRAST STREETS ---
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), asphaltMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    group.add(ground);

    // Elevated Sidewalk Curbs
    addBox(-14, 0, 0, 6, 0.35, 96, sidewalkMat, false);
    addBox(14, 0, 0, 6, 0.35, 96, sidewalkMat, false);

    // Glowing Road Center Stripes (Amber)
    for (let z = -46; z <= 46; z += 6) {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 3.2), neonAmberMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(0, 0.02, z);
      group.add(line);
    }

    // Pedestrian Crosswalks (White/Cyan stripes at intersections)
    for (let x = -8; x <= 8; x += 1.8) {
      const stripe1 = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 4), sidewalkMat);
      stripe1.rotation.x = -Math.PI / 2;
      stripe1.position.set(x, 0.02, -18);
      group.add(stripe1);

      const stripe2 = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 4), sidewalkMat);
      stripe2.rotation.x = -Math.PI / 2;
      stripe2.position.set(x, 0.02, 18);
      group.add(stripe2);
    }

    // --- 2. PERIMETER BOUNDARY WALLS ---
    addBox(0, 0, -50, 110, 12, 2.5, buildingMat1);
    addBox(0, 0, 50, 110, 12, 2.5, buildingMat1);
    addBox(-50, 0, 0, 2.5, 12, 102, buildingMat1);
    addBox(50, 0, 0, 2.5, 12, 102, buildingMat1);

    // --- 3. BUILDING ALPHA (Site Alpha Headquarters - West Complex) ---
    // Main 2-story structure
    addBox(-28, 0, -16, 20, 11, 24, buildingMat2);
    // Sniper Balcony Terrace
    addBox(-17, 5.2, -16, 4.5, 0.5, 20, sidewalkMat);
    // Balcony Railing with tactical firing slits
    addBox(-14.8, 5.7, -16, 0.4, 1.1, 20, metalCrateMat);
    // Access Ramp up to Terrace
    addBox(-17, 0, -2, 4.2, 5.2, 8, sidewalkMat);

    // Illuminated Office Windows Grid on Building Alpha
    for (let wy = 3; wy <= 8; wy += 2.5) {
      for (let wz = -24; wz <= -8; wz += 4) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.4), windowGlowMat);
        win.rotation.y = Math.PI / 2;
        win.position.set(-17.8, wy, wz);
        group.add(win);
      }
    }

    // Bright Neon Sign "SITE ALPHA // HEADQUARTERS"
    const signAlpha = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.6, 10), neonCyanMat);
    signAlpha.position.set(-17.8, 9.5, -16);
    group.add(signAlpha);

    // Site Alpha Ground Zone Decal (Glowing Cyan Perimeter)
    const siteAGlow = new THREE.Mesh(new THREE.RingGeometry(4.5, 4.8, 32), neonCyanMat);
    siteAGlow.rotation.x = -Math.PI / 2;
    siteAGlow.position.set(-18, 0.03, -16);
    group.add(siteAGlow);

    // --- 4. BUILDING BRAVO (Site Bravo Warehouse - East Complex) ---
    addBox(28, 0, 16, 22, 10, 26, buildingMat1);
    // Loading bay ramp
    addBox(16, 0, 16, 4.5, 1.4, 14, sidewalkMat);

    // Warehouse Windows Grid
    for (let wy = 3.5; wy <= 7.5; wy += 2.5) {
      for (let wz = 8; wz <= 24; wz += 4) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.4), neonAmberMat);
        win.rotation.y = -Math.PI / 2;
        win.position.set(16.8, wy, wz);
        group.add(win);
      }
    }

    // Neon Sign "SITE BRAVO // STORAGE"
    const signBravo = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.6, 9), neonMagentaMat);
    signBravo.position.set(16.8, 8.8, 16);
    group.add(signBravo);

    // Site Bravo Ground Zone Decal (Glowing Magenta Perimeter)
    const siteBGlow = new THREE.Mesh(new THREE.RingGeometry(4.5, 4.8, 32), neonMagentaMat);
    siteBGlow.rotation.x = -Math.PI / 2;
    siteBGlow.position.set(18, 0.03, 16);
    group.add(siteBGlow);

    // --- 5. CENTRAL PLAZA TACTICAL COVER ---
    // Shipping Containers with Hazard Stripes
    addBox(-7, 0, -8, 2.8, 3.0, 7.0, containerCyanMat);
    addBox(7, 0, 8, 2.8, 3.0, 7.0, containerOrangeMat);
    addBox(-3, 0, 18, 7.0, 3.0, 2.8, containerCyanMat);
    addBox(3, 0, -22, 7.0, 3.0, 2.8, containerOrangeMat);

    // Concrete Jersey Barriers (waist-high tactical cover)
    addBox(-1, 0, 0, 0.7, 1.25, 5.0, sidewalkMat);
    addBox(6, 0, -5, 4.0, 1.25, 0.7, sidewalkMat);
    addBox(-8, 0, 8, 4.0, 1.25, 0.7, sidewalkMat);
    addBox(12, 0, -14, 0.7, 1.25, 4.5, sidewalkMat);
    addBox(-12, 0, 24, 0.7, 1.25, 4.5, sidewalkMat);

    // Stacked Supply Crates
    addBox(-4, 0, -3, 1.3, 1.3, 1.3, metalCrateMat);
    addBox(-4, 1.3, -3, 1.1, 1.1, 1.1, metalCrateMat);
    addBox(4, 0, 2, 1.4, 1.4, 1.4, metalCrateMat);
    addBox(9, 0, 22, 1.4, 1.4, 1.4, metalCrateMat);
    addBox(-19, 0, 10, 1.4, 1.4, 1.4, metalCrateMat);

    // Red Tactical Oil Barrels (Cylinders)
    const barrelGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.1, 14);
    const barrelPositions = [
      new THREE.Vector3(-6, 0.55, -4),
      new THREE.Vector3(-6.7, 0.55, -3.4),
      new THREE.Vector3(5.5, 0.55, 4),
      new THREE.Vector3(13, 0.55, -11)
    ];
    barrelPositions.forEach(bPos => {
      const barrel = new THREE.Mesh(barrelGeo, barrelMat);
      barrel.position.copy(bPos);
      barrel.castShadow = true;
      group.add(barrel);
      const bBox = new THREE.Box3().setFromObject(barrel);
      colliders.push(bBox);
    });

    // --- 6. HIGH-LUMINANCE STREETLIGHTS & FLOODLIGHT TOWERS ---
    const lampPositions = [
      new THREE.Vector3(-9, 0, -22),
      new THREE.Vector3(9, 0, -22),
      new THREE.Vector3(-9, 0, 10),
      new THREE.Vector3(9, 0, 10),
      new THREE.Vector3(0, 0, -6),
      new THREE.Vector3(0, 0, 26)
    ];

    lampPositions.forEach((pos, idx) => {
      // Lamp pole
      addBox(pos.x, 0, pos.z, 0.3, 6.2, 0.3, metalCrateMat, true);
      // Lamp head bracket
      const side = pos.x < 0 ? 0.8 : -0.8;
      addBox(pos.x + side, 6.0, pos.z, 1.4, 0.25, 0.4, metalCrateMat, false);

      // Glowing Lamp Bulb
      const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.5), lampBulbMat);
      bulb.position.set(pos.x + side * 1.3, 5.85, pos.z);
      group.add(bulb);

      // High-power Point Light (warm sunlight / cyan contrast)
      const lightColor = idx % 2 === 0 ? 0x38bdf8 : 0xfbbf24;
      const pointLight = new THREE.PointLight(lightColor, 3.8, 28, 1.2);
      pointLight.position.set(pos.x + side * 1.3, 5.6, pos.z);
      pointLight.castShadow = true;
      pointLight.shadow.bias = -0.0015;
      group.add(pointLight);
    });

    // --- 7. SKY & ATMOSPHERIC LIGHTING ---
    // Full 3D Moon in sky
    const moonGeo = new THREE.SphereGeometry(6, 24, 24);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(50, 75, 45);
    group.add(moon);

    // Glowing Moon Halo
    const moonHalo = new THREE.Mesh(new THREE.PlaneGeometry(28, 28), new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide
    }));
    moonHalo.position.copy(moon.position);
    moonHalo.lookAt(0, 0, 0);
    group.add(moonHalo);

    // Generous Hemisphere Light (ambient slate daylight + navy floor bounce)
    const hemiLight = new THREE.HemisphereLight(0x94a3b8, 0x334155, 1.4);
    group.add(hemiLight);

    // Strong Moonlight Directional Light casting shadows
    const moonLight = new THREE.DirectionalLight(0xbfdbfe, 1.8);
    moonLight.position.set(45, 65, 35);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 1024;
    moonLight.shadow.mapSize.height = 1024;
    moonLight.shadow.camera.near = 10;
    moonLight.shadow.camera.far = 140;
    moonLight.shadow.camera.left = -45;
    moonLight.shadow.camera.right = 45;
    moonLight.shadow.camera.top = 45;
    moonLight.shadow.camera.bottom = -45;
    moonLight.shadow.bias = -0.001;
    group.add(moonLight);

    // Spawns and Tactical Navigation Waypoints
    const playerSpawn = new THREE.Vector3(0, 0, -36);
    const botSpawns = [
      new THREE.Vector3(0, 0, 36),
      new THREE.Vector3(18, 0, 28),
      new THREE.Vector3(-18, 0, 28),
      new THREE.Vector3(10, 0, 38)
    ];

    const waypoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-10, 0, -10),
      new THREE.Vector3(10, 0, -10),
      new THREE.Vector3(-10, 0, 12),
      new THREE.Vector3(10, 0, 12),
      new THREE.Vector3(-18, 0, 0),
      new THREE.Vector3(18, 0, 0),
      new THREE.Vector3(0, 0, -20),
      new THREE.Vector3(0, 0, 20),
      new THREE.Vector3(-16, 5.2, -16) // sniper terrace
    ];

    const coverPoints = [
      new THREE.Vector3(-1, 0, 2),
      new THREE.Vector3(5, 0, -2),
      new THREE.Vector3(-7, 0, -5),
      new THREE.Vector3(7, 0, 5),
      new THREE.Vector3(-4, 0, -1.5)
    ];

    return {
      group,
      colliders,
      playerSpawn,
      botSpawns,
      waypoints,
      coverPoints
    };
  }
}
