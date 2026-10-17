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
      color: 0x1a1c20,
      roughness: 0.85,
      metalness: 0.1
    });

    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0x3a3f47,
      roughness: 0.9,
      metalness: 0.05
    });

    const buildingMat1 = new THREE.MeshStandardMaterial({
      color: 0x1f242d,
      roughness: 0.7,
      metalness: 0.2
    });

    const buildingMat2 = new THREE.MeshStandardMaterial({
      color: 0x272c36,
      roughness: 0.6,
      metalness: 0.3
    });

    const containerCyanMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      roughness: 0.4,
      metalness: 0.6
    });

    const containerOrangeMat = new THREE.MeshStandardMaterial({
      color: 0xea580c,
      roughness: 0.4,
      metalness: 0.6
    });

    const metalCrateMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.5,
      metalness: 0.7
    });

    const neonCyanMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const neonMagentaMat = new THREE.MeshBasicMaterial({ color: 0xff007f });
    const neonAmberMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

    // --- HELPER: Add Block with Collider ---
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

    // --- 1. GROUND / STREETS ---
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), asphaltMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    group.add(ground);

    // Street Road Markings (yellow center stripes & white crosswalks)
    for (let z = -45; z <= 45; z += 6) {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 3), neonAmberMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(0, 0.01, z);
      group.add(line);
    }

    // Sidewalk Curbs
    addBox(-12, 0, 0, 4, 0.25, 90, concreteMat, false);
    addBox(12, 0, 0, 4, 0.25, 90, concreteMat, false);

    // --- 2. PERIMETER BOUNDARY WALLS ---
    // North, South, East, West high perimeter walls
    addBox(0, 0, -48, 100, 10, 2, buildingMat1);
    addBox(0, 0, 48, 100, 10, 2, buildingMat1);
    addBox(-48, 0, 0, 2, 10, 96, buildingMat1);
    addBox(48, 0, 0, 2, 10, 96, buildingMat1);

    // --- 3. BUILDING ALPHA (West Complex - HQ / Site Alpha) ---
    // Main 2-story structure with interior lobby and sniper terrace
    addBox(-26, 0, -15, 18, 9, 22, buildingMat2);
    // Upper Balcony Terrace
    addBox(-16, 4.5, -15, 4, 0.4, 18, concreteMat);
    // Balcony Railing
    addBox(-14.2, 4.9, -15, 0.4, 1.0, 18, metalCrateMat);
    // Stair ramp up to balcony
    addBox(-16, 0, -3, 3.5, 4.5, 6, concreteMat);

    // Neon Sign "PHANTOM ALPHA"
    const signAlpha = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.4, 9), neonCyanMat);
    signAlpha.position.set(-16.8, 8, -15);
    group.add(signAlpha);

    // --- 4. BUILDING BRAVO (East Warehouse - Site Bravo) ---
    addBox(26, 0, 15, 20, 8, 24, buildingMat1);
    // Loading bay ramp
    addBox(15, 0, 15, 4, 1.2, 12, concreteMat);

    // Neon Sign "CYBER ARMS"
    const signBravo = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.4, 8), neonMagentaMat);
    signBravo.position.set(15.8, 7.2, 15);
    group.add(signBravo);

    // --- 5. CENTRAL PLAZA TACTICAL COVER ---
    // Shipping Containers
    addBox(-6, 0, -8, 2.6, 2.8, 6.5, containerCyanMat);
    addBox(6, 0, 8, 2.6, 2.8, 6.5, containerOrangeMat);
    addBox(-3, 0, 16, 6.5, 2.8, 2.6, containerCyanMat);
    addBox(4, 0, -22, 6.5, 2.8, 2.6, containerOrangeMat);

    // Concrete Jersey Barriers (waist-high tactical cover)
    addBox(-1, 0, 0, 0.6, 1.15, 4.5, concreteMat);
    addBox(5, 0, -4, 3.5, 1.15, 0.6, concreteMat);
    addBox(-7, 0, 8, 3.5, 1.15, 0.6, concreteMat);
    addBox(11, 0, -14, 0.6, 1.15, 4.0, concreteMat);
    addBox(-11, 0, 24, 0.6, 1.15, 4.0, concreteMat);

    // Wooden / Metal Supply Crates (stacked)
    addBox(-4, 0, -3, 1.2, 1.2, 1.2, metalCrateMat);
    addBox(-4, 1.2, -3, 1.1, 1.1, 1.1, metalCrateMat);
    addBox(3, 0, 2, 1.3, 1.3, 1.3, metalCrateMat);
    addBox(8, 0, 22, 1.4, 1.4, 1.4, metalCrateMat);
    addBox(-18, 0, 10, 1.4, 1.4, 1.4, metalCrateMat);

    // --- 6. STREET LAMPS WITH LIGHTS ---
    const lampPositions = [
      new THREE.Vector3(-8, 0, -20),
      new THREE.Vector3(8, 0, -20),
      new THREE.Vector3(-8, 0, 10),
      new THREE.Vector3(8, 0, 10),
      new THREE.Vector3(0, 0, -5),
      new THREE.Vector3(0, 0, 25)
    ];

    lampPositions.forEach((pos, idx) => {
      // Lamp pole
      addBox(pos.x, 0, pos.z, 0.25, 5.5, 0.25, metalCrateMat, true);
      // Lamp arm
      addBox(pos.x + (pos.x < 0 ? 0.6 : -0.6), 5.3, pos.z, 1.2, 0.2, 0.2, metalCrateMat, false);

      // Point Light (cyan / amber tactical contrast)
      const lightColor = idx % 2 === 0 ? 0x00f0ff : 0xffaa33;
      const light = new THREE.PointLight(lightColor, 2.2, 18, 1.5);
      light.position.set(pos.x + (pos.x < 0 ? 1.0 : -1.0), 5.1, pos.z);
      light.castShadow = true;
      light.shadow.bias = -0.002;
      group.add(light);
    });

    // Ambient night sky light
    const hemiLight = new THREE.HemisphereLight(0x1e293b, 0x090d16, 0.6);
    group.add(hemiLight);

    // Tactical moonlight directional light
    const dirLight = new THREE.DirectionalLight(0x60a5fa, 0.75);
    dirLight.position.set(30, 45, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 120;
    dirLight.shadow.camera.left = -40;
    dirLight.shadow.camera.right = 40;
    dirLight.shadow.camera.top = 40;
    dirLight.shadow.camera.bottom = -40;
    group.add(dirLight);

    // Spawns and Tactical Navigation Waypoints
    const playerSpawn = new THREE.Vector3(0, 0, -36);
    const botSpawns = [
      new THREE.Vector3(0, 0, 36),
      new THREE.Vector3(18, 0, 28),
      new THREE.Vector3(-18, 0, 28),
      new THREE.Vector3(12, 0, 38)
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
      new THREE.Vector3(-15, 4.5, -15) // sniper balcony
    ];

    const coverPoints = [
      new THREE.Vector3(-1, 0, 2),
      new THREE.Vector3(5, 0, -2),
      new THREE.Vector3(-6, 0, -5),
      new THREE.Vector3(6, 0, 5),
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
