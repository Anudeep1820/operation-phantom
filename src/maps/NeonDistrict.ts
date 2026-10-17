import * as THREE from 'three';

export interface MapData {
  group: THREE.Group;
  colliders: THREE.Box3[];
  playerSpawn: THREE.Vector3;
  vehicleSpawn: THREE.Vector3;
  botSpawns: THREE.Vector3[];
  waypoints: THREE.Vector3[];
  coverPoints: THREE.Vector3[];
}

export class NeonDistrict {
  public static create(): MapData {
    const group = new THREE.Group();
    const colliders: THREE.Box3[] = [];

    // --- BRIGHT DAYLIGHT TACTICAL MATERIALS ---
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0xc2a679, // Desert sand / open outpost terrain
      roughness: 0.9,
      metalness: 0.05
    });

    const roadAsphaltMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Clean slate highway asphalt
      roughness: 0.75,
      metalness: 0.2
    });

    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Light concrete walkways & curbs
      roughness: 0.8,
      metalness: 0.1
    });

    const buildingMatWhite = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Modern tactical white/gray composite
      roughness: 0.6,
      metalness: 0.2
    });

    const buildingMatNavy = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Dark navy composite trim
      roughness: 0.5,
      metalness: 0.4
    });

    const containerCyanMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.4,
      metalness: 0.6
    });

    const containerOrangeMat = new THREE.MeshStandardMaterial({
      color: 0xea580c,
      roughness: 0.4,
      metalness: 0.6
    });

    const metalBarricadeMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.5,
      metalness: 0.7
    });

    const yellowStripeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const whiteStripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const cyanSiteMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const magentaSiteMat = new THREE.MeshBasicMaterial({ color: 0xec4899 });

    // Helper: Add box with collider
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

    // --- 1. MASSIVE OPEN WORLD TERRAIN (260m x 260m) ---
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(280, 280), terrainMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    group.add(ground);

    // --- 2. PAVED HIGHWAYS & INTERSECTIONS ---
    // North-South Main Highway (width 12m, length 240m)
    const highwayNS = new THREE.Mesh(new THREE.PlaneGeometry(12, 240), roadAsphaltMat);
    highwayNS.rotation.x = -Math.PI / 2;
    highwayNS.position.set(0, 0.02, 0);
    highwayNS.receiveShadow = true;
    group.add(highwayNS);

    // East-West Connecting Highway (width 10m, length 240m)
    const highwayEW = new THREE.Mesh(new THREE.PlaneGeometry(240, 10), roadAsphaltMat);
    highwayEW.rotation.x = -Math.PI / 2;
    highwayEW.position.set(0, 0.022, 0);
    highwayEW.receiveShadow = true;
    group.add(highwayEW);

    // Highway Yellow Center Lines
    for (let z = -110; z <= 110; z += 8) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 4.5), yellowStripeMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(0, 0.03, z);
      group.add(stripe);
    }

    for (let x = -110; x <= 110; x += 8) {
      if (Math.abs(x) > 8) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 0.35), yellowStripeMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(x, 0.03, 0);
        group.add(stripe);
      }
    }

    // Concrete Sidewalk Curbs along central hub
    addBox(-8, 0, 0, 3.5, 0.25, 90, concreteMat, false);
    addBox(8, 0, 0, 3.5, 0.25, 90, concreteMat, false);

    // --- 3. MILITARY COMMAND HEADQUARTERS (Site Alpha - West Zone) ---
    addBox(-38, 0, -25, 26, 12, 32, buildingMatWhite);
    // Upper Observation Terrace
    addBox(-23, 6.0, -25, 6, 0.5, 24, concreteMat);
    addBox(-19.8, 6.5, -25, 0.4, 1.2, 24, metalBarricadeMat); // Firing railing
    // Access Ramp
    addBox(-23, 0, -7, 5, 6.0, 12, concreteMat);

    // Site Alpha Landing Pad / Objective Zone
    const padA = new THREE.Mesh(new THREE.RingGeometry(5.5, 6.0, 32), cyanSiteMat);
    padA.rotation.x = -Math.PI / 2;
    padA.position.set(-25, 0.04, -25);
    group.add(padA);

    const signAlpha = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.8, 12), cyanSiteMat);
    signAlpha.position.set(-24.5, 10.5, -25);
    group.add(signAlpha);

    // --- 4. INDUSTRIAL LOGISTICS DEPOT (Site Bravo - East Zone) ---
    addBox(38, 0, 25, 28, 10, 34, buildingMatNavy);
    addBox(22, 0, 25, 6, 1.4, 16, concreteMat); // Loading dock

    const padB = new THREE.Mesh(new THREE.RingGeometry(5.5, 6.0, 32), magentaSiteMat);
    padB.rotation.x = -Math.PI / 2;
    padB.position.set(25, 0.04, 25);
    group.add(padB);

    const signBravo = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.8, 12), magentaSiteMat);
    signBravo.position.set(23.5, 9.2, 25);
    group.add(signBravo);

    // --- 5. VEHICLE GARAGE & MOTOR POOL ---
    addBox(18, 0, -45, 20, 6, 16, buildingMatWhite);
    // Garage open entrance ramp
    addBox(18, 0, -36, 14, 0.2, 4, concreteMat, false);

    // --- 6. SNIPER WATCHTOWERS ---
    const createWatchtower = (x: number, z: number) => {
      // 4 metal pillar legs
      addBox(x - 2, 0, z - 2, 0.4, 10, 0.4, metalBarricadeMat);
      addBox(x + 2, 0, z - 2, 0.4, 10, 0.4, metalBarricadeMat);
      addBox(x - 2, 0, z + 2, 0.4, 10, 0.4, metalBarricadeMat);
      addBox(x + 2, 0, z + 2, 0.4, 10, 0.4, metalBarricadeMat);
      // Crow's nest platform
      addBox(x, 10, z, 5.5, 0.4, 5.5, concreteMat);
      // Railing with sniper slits
      addBox(x, 10.4, z - 2.6, 5.5, 1.1, 0.3, metalBarricadeMat);
      addBox(x, 10.4, z + 2.6, 5.5, 1.1, 0.3, metalBarricadeMat);
      addBox(x - 2.6, 10.4, z, 0.3, 1.1, 5.5, metalBarricadeMat);
      addBox(x + 2.6, 10.4, z, 0.3, 1.1, 5.5, metalBarricadeMat);
    };

    createWatchtower(-25, 45);
    createWatchtower(25, -75);

    // --- 7. TACTICAL FIELD COVER (Shipping Containers, Jersey Barriers, Crates) ---
    // Shipping Containers
    addBox(-9, 0, -12, 3.0, 3.2, 7.5, containerCyanMat);
    addBox(9, 0, 12, 3.0, 3.2, 7.5, containerOrangeMat);
    addBox(-5, 0, 24, 7.5, 3.2, 3.0, containerCyanMat);
    addBox(5, 0, -28, 7.5, 3.2, 3.0, containerOrangeMat);
    addBox(-45, 0, 15, 3.0, 3.2, 7.5, containerCyanMat);
    addBox(45, 0, -15, 3.0, 3.2, 7.5, containerOrangeMat);

    // Concrete Jersey Barriers
    addBox(-2, 0, 0, 0.7, 1.25, 6.0, concreteMat);
    addBox(7, 0, -6, 5.0, 1.25, 0.7, concreteMat);
    addBox(-9, 0, 9, 5.0, 1.25, 0.7, concreteMat);
    addBox(14, 0, -18, 0.7, 1.25, 5.0, concreteMat);
    addBox(-14, 0, 32, 0.7, 1.25, 5.0, concreteMat);

    // Supply Crates
    addBox(-4, 0, -4, 1.4, 1.4, 1.4, metalBarricadeMat);
    addBox(-4, 1.4, -4, 1.2, 1.2, 1.2, metalBarricadeMat);
    addBox(5, 0, 3, 1.5, 1.5, 1.5, metalBarricadeMat);
    addBox(12, 0, 28, 1.5, 1.5, 1.5, metalBarricadeMat);
    addBox(-22, 0, 12, 1.5, 1.5, 1.5, metalBarricadeMat);

    // Desert Rocks / Boulders in Open World
    const rockGeo = new THREE.DodecahedronGeometry(2.2);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.95 });
    const rockPositions = [
      new THREE.Vector3(-60, 1.2, -40),
      new THREE.Vector3(65, 1.2, -50),
      new THREE.Vector3(-70, 1.2, 55),
      new THREE.Vector3(75, 1.2, 60),
      new THREE.Vector3(-35, 1.2, -80),
      new THREE.Vector3(40, 1.2, 85)
    ];

    rockPositions.forEach(rPos => {
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.copy(rPos);
      rock.scale.set(1.4, 1.0, 1.6);
      rock.castShadow = true;
      group.add(rock);
      colliders.push(new THREE.Box3().setFromObject(rock));
    });

    // --- 8. OUTPOST PERIMETER FENCE & WALLS ---
    addBox(0, 0, -120, 250, 6, 2, concreteMat);
    addBox(0, 0, 120, 250, 6, 2, concreteMat);
    addBox(-120, 0, 0, 2, 6, 250, concreteMat);
    addBox(120, 0, 0, 2, 6, 250, concreteMat);

    // --- 9. BRILLIANT DAYLIGHT SUN & SKY LIGHTING (ZERO DARKNESS!) ---
    // Warm daylight ambient fill (high intensity 1.6 ensures NO pitch black areas)
    const hemiLight = new THREE.HemisphereLight(0xfffbeb, 0x94a3b8, 1.6);
    group.add(hemiLight);

    // High Tactical Sun casting crisp directional shadows from overhead
    const sunLight = new THREE.DirectionalLight(0xfffae6, 2.4);
    sunLight.position.set(60, 110, 45);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 280;
    sunLight.shadow.camera.left = -120;
    sunLight.shadow.camera.right = 120;
    sunLight.shadow.camera.top = 120;
    sunLight.shadow.camera.bottom = -120;
    sunLight.shadow.bias = -0.0008;
    group.add(sunLight);

    // Soft sky fill
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.7);
    group.add(ambientLight);

    // Spawns & Navigation
    const playerSpawn = new THREE.Vector3(0, 0, -42);
    const vehicleSpawn = new THREE.Vector3(0, 0.5, -30); // Tactical Buggy right near player spawn!
    const botSpawns = [
      new THREE.Vector3(0, 0, 45),
      new THREE.Vector3(26, 0, 32),
      new THREE.Vector3(-26, 0, 32),
      new THREE.Vector3(16, 0, 55)
    ];

    const waypoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-14, 0, -16),
      new THREE.Vector3(14, 0, -16),
      new THREE.Vector3(-14, 0, 18),
      new THREE.Vector3(14, 0, 18),
      new THREE.Vector3(-25, 0, 0),
      new THREE.Vector3(25, 0, 0),
      new THREE.Vector3(0, 0, -32),
      new THREE.Vector3(0, 0, 32),
      new THREE.Vector3(-23, 6.0, -25), // Observation terrace
      new THREE.Vector3(25, 0, 25)      // Depot
    ];

    const coverPoints = [
      new THREE.Vector3(-2, 0, 3),
      new THREE.Vector3(7, 0, -4),
      new THREE.Vector3(-9, 0, -8),
      new THREE.Vector3(9, 0, 8),
      new THREE.Vector3(-4, 0, -2)
    ];

    return {
      group,
      colliders,
      playerSpawn,
      vehicleSpawn,
      botSpawns,
      waypoints,
      coverPoints
    };
  }
}
