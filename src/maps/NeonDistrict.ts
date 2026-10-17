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

    // --- 1. MASSIVE OPEN WORLD EXPANSION (600m x 600m) ---
    const groundGeo = new THREE.PlaneGeometry(620, 620);
    const ground = new THREE.Mesh(groundGeo, terrainMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    group.add(ground);

    // --- 2. PAVED HIGHWAY NETWORK (560m Long Driving Highway) ---
    // North-South Transcontinental Highway (width 14m, length 560m)
    const highwayNS = new THREE.Mesh(new THREE.PlaneGeometry(14, 560), roadAsphaltMat);
    highwayNS.rotation.x = -Math.PI / 2;
    highwayNS.position.set(0, 0.02, 0);
    highwayNS.receiveShadow = true;
    group.add(highwayNS);

    // East-West Connecting Highway (width 14m, length 560m)
    const highwayEW = new THREE.Mesh(new THREE.PlaneGeometry(560, 14), roadAsphaltMat);
    highwayEW.rotation.x = -Math.PI / 2;
    highwayEW.position.set(0, 0.022, 0);
    highwayEW.receiveShadow = true;
    group.add(highwayEW);

    // Highway Dashed Yellow Center Lines
    for (let z = -270; z <= 270; z += 9) {
      if (Math.abs(z) > 10) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 5.0), yellowStripeMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(0, 0.03, z);
        group.add(stripe);
      }
    }

    for (let x = -270; x <= 270; x += 9) {
      if (Math.abs(x) > 10) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 0.4), yellowStripeMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(x, 0.03, 0);
        group.add(stripe);
      }
    }

    // --- 3. HELPER: WATCHTOWERS ---
    const createWatchtower = (x: number, z: number) => {
      addBox(x - 2, 0, z - 2, 0.4, 9, 0.4, metalBarricadeMat);
      addBox(x + 2, 0, z - 2, 0.4, 9, 0.4, metalBarricadeMat);
      addBox(x - 2, 0, z + 2, 0.4, 9, 0.4, metalBarricadeMat);
      addBox(x + 2, 0, z + 2, 0.4, 9, 0.4, metalBarricadeMat);
      addBox(x, 9, z, 5.2, 0.4, 5.2, concreteMat);
      addBox(x, 9.4, z - 2.5, 5.2, 1.1, 0.3, metalBarricadeMat);
      addBox(x, 9.4, z + 2.5, 5.2, 1.1, 0.3, metalBarricadeMat);
      addBox(x - 2.5, 9.4, z, 0.3, 1.1, 5.2, metalBarricadeMat);
      addBox(x + 2.5, 9.4, z, 0.3, 1.1, 5.2, metalBarricadeMat);
    };

    // --- 4. SOUTH FORWARD OPERATING BASE (Player Spawn & Motor Pool at z = -170) ---
    // Motor Pool Garage
    addBox(16, 0, -170, 22, 6, 18, buildingMatNavy);
    addBox(16, 0, -158, 16, 0.2, 6, concreteMat, false); // Ramp
    // South Armory & Barracks
    addBox(-18, 0, -170, 20, 7, 24, buildingMatWhite);
    // Helipad Landing Circle
    const helipadSouth = new THREE.Mesh(new THREE.RingGeometry(6.5, 7.2, 32), whiteStripeMat);
    helipadSouth.rotation.x = -Math.PI / 2;
    helipadSouth.position.set(0, 0.04, -180);
    group.add(helipadSouth);
    createWatchtower(-28, -155);
    createWatchtower(28, -155);

    // --- 5. CENTRAL CROSSROADS CHECKPOINT (x = 0, z = 0) ---
    // Bunkers & Sandbag Fortifications
    addBox(-14, 0, -12, 12, 4.5, 12, buildingMatWhite);
    addBox(14, 0, 12, 12, 4.5, 12, buildingMatWhite);
    // Road Blocks & Concrete Jersey Barriers
    addBox(-8, 0, 0, 0.8, 1.3, 8.0, concreteMat);
    addBox(8, 0, 0, 0.8, 1.3, 8.0, concreteMat);
    addBox(0, 0, -8, 8.0, 1.3, 0.8, concreteMat);
    addBox(0, 0, 8, 8.0, 1.3, 0.8, concreteMat);
    // Shipping Containers in intersection
    addBox(-18, 0, 18, 3.2, 3.2, 8.0, containerCyanMat);
    addBox(18, 0, -18, 3.2, 3.2, 8.0, containerOrangeMat);
    createWatchtower(-20, -20);

    // --- 6. NORTH OMEGA MILITARY FORTRESS (x = 0, z = +180) ---
    // Massive Central Fortress
    addBox(0, 0, 195, 36, 12, 28, buildingMatWhite);
    // Upper Roof Perimeter Barrier
    addBox(0, 12, 181.5, 36, 1.2, 0.5, metalBarricadeMat);
    // Heavy Silos
    const siloMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 });
    const createSilo = (sx: number, sz: number) => {
      const silo = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 4.0, 14, 16), siloMat);
      silo.position.set(sx, 7, sz);
      silo.castShadow = true;
      group.add(silo);
      colliders.push(new THREE.Box3().setFromObject(silo));
    };
    createSilo(-26, 180);
    createSilo(-26, 195);
    createSilo(26, 180);
    createSilo(26, 195);
    // North Container Stacks
    addBox(-12, 0, 165, 3.2, 3.2, 7.5, containerOrangeMat);
    addBox(12, 0, 165, 3.2, 3.2, 7.5, containerCyanMat);
    createWatchtower(-32, 165);
    createWatchtower(32, 165);

    // --- 7. EAST SATELLITE COMMUNICATIONS OUTPOST (x = +170, z = 0) ---
    addBox(170, 0, 0, 24, 7, 24, buildingMatNavy);
    // Radar Tower Mast
    const radarMast = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 22, 8), metalBarricadeMat);
    radarMast.position.set(170, 11, 0);
    group.add(radarMast);
    colliders.push(new THREE.Box3().setFromObject(radarMast));
    // Dish
    const radarDish = new THREE.Mesh(new THREE.SphereGeometry(3.5, 16, 16, 0, Math.PI), siloMat);
    radarDish.position.set(170, 20, 0);
    radarDish.rotation.x = Math.PI / 4;
    group.add(radarDish);
    // East perimeter containers
    addBox(152, 0, -14, 7.5, 3.2, 3.2, containerOrangeMat);
    addBox(152, 0, 14, 7.5, 3.2, 3.2, containerCyanMat);
    createWatchtower(185, -25);
    createWatchtower(185, 25);

    // --- 8. WEST INDUSTRIAL REFINERY (x = -170, z = 0) ---
    addBox(-170, 0, 0, 28, 8, 32, buildingMatWhite);
    // Storage Tanks
    createSilo(-195, -12);
    createSilo(-195, 12);
    // Loading bay & pipes
    addBox(-152, 0, 0, 6, 1.2, 16, concreteMat);
    addBox(-152, 0, -16, 3.2, 3.2, 7.5, containerCyanMat);
    addBox(-152, 0, 16, 3.2, 3.2, 7.5, containerOrangeMat);
    createWatchtower(-185, -25);
    createWatchtower(-185, 25);

    // --- 9. NATURAL DESERT ROCK FORMATIONS ALONG OPEN COUNTRY ---
    const rockGeo = new THREE.DodecahedronGeometry(3.5);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.95 });
    const rockPositions = [
      new THREE.Vector3(-65, 1.8, -90),
      new THREE.Vector3(70, 1.8, -90),
      new THREE.Vector3(-80, 1.8, 90),
      new THREE.Vector3(85, 1.8, 90),
      new THREE.Vector3(-110, 1.8, -40),
      new THREE.Vector3(110, 1.8, -40),
      new THREE.Vector3(-110, 1.8, 40),
      new THREE.Vector3(110, 1.8, 40),
      new THREE.Vector3(-70, 1.8, -170),
      new THREE.Vector3(70, 1.8, -170),
      new THREE.Vector3(-70, 1.8, 170),
      new THREE.Vector3(70, 1.8, 170)
    ];

    rockPositions.forEach(rPos => {
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.copy(rPos);
      rock.scale.set(1.5, 1.0, 1.7);
      rock.castShadow = true;
      group.add(rock);
      colliders.push(new THREE.Box3().setFromObject(rock));
    });

    // --- 10. MAP PERIMETER DEFENSIVE BOUNDARIES (at ±290m) ---
    addBox(0, 0, -290, 580, 8, 3, concreteMat);
    addBox(0, 0, 290, 580, 8, 3, concreteMat);
    addBox(-290, 0, 0, 3, 8, 580, concreteMat);
    addBox(290, 0, 0, 3, 8, 580, concreteMat);

    // --- 11. DAYLIGHT LIGHTING (EXPANDED SHADOW VOLUMES FOR OPEN WORLD) ---
    const hemiLight = new THREE.HemisphereLight(0xfffbeb, 0x94a3b8, 1.7);
    group.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffae6, 2.5);
    sunLight.position.set(120, 220, 100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 700;
    sunLight.shadow.camera.left = -300;
    sunLight.shadow.camera.right = 300;
    sunLight.shadow.camera.top = 300;
    sunLight.shadow.camera.bottom = -300;
    sunLight.shadow.bias = -0.0008;
    group.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.75);
    group.add(ambientLight);

    // --- 12. SPAWNS & OUTPOST WAYPOINTS (ALL WITH y = 0, NO FLOATING!) ---
    const playerSpawn = new THREE.Vector3(0, 0, -180); // South Forward Operating Base
    const vehicleSpawn = new THREE.Vector3(0, 0.5, -165); // Buggy parked right in front of player!

    // 4 Distinct Outposts across the 600m Open World:
    const botSpawns = [
      new THREE.Vector3(0, 0, 185),    // North Fortress Guard
      new THREE.Vector3(165, 0, 0),    // East SatCom Guard
      new THREE.Vector3(-165, 0, 0),   // West Refinery Guard
      new THREE.Vector3(0, 0, 18)      // Central Checkpoint Guard
    ];

    // Localized base waypoints (ALL GROUND LEVEL y = 0)
    const waypoints = [
      // Central Checkpoint (z: -20 to 20)
      new THREE.Vector3(12, 0, 12),
      new THREE.Vector3(-12, 0, 12),
      new THREE.Vector3(12, 0, -12),
      new THREE.Vector3(-12, 0, -12),

      // North Omega Fortress (z: 165 to 210)
      new THREE.Vector3(18, 0, 180),
      new THREE.Vector3(-18, 0, 180),
      new THREE.Vector3(18, 0, 205),
      new THREE.Vector3(-18, 0, 205),

      // East SatCom Station (x: 150 to 190)
      new THREE.Vector3(165, 0, 16),
      new THREE.Vector3(165, 0, -16),
      new THREE.Vector3(185, 0, 12),
      new THREE.Vector3(150, 0, -12),

      // West Refinery (x: -190 to -150)
      new THREE.Vector3(-165, 0, 16),
      new THREE.Vector3(-165, 0, -16),
      new THREE.Vector3(-185, 0, 12),
      new THREE.Vector3(-150, 0, -12)
    ];

    const coverPoints = [
      new THREE.Vector3(-10, 0, 10),
      new THREE.Vector3(10, 0, 10),
      new THREE.Vector3(-10, 0, -10),
      new THREE.Vector3(10, 0, -10)
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
