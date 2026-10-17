import * as THREE from 'three';
import { WeaponType } from '../types';

export interface WeaponModelData {
  mesh: THREE.Group;
  muzzlePosition: THREE.Vector3;
  defaultPosition: THREE.Vector3;
  defaultRotation: THREE.Euler;
  adsPosition: THREE.Vector3;
  adsRotation: THREE.Euler;
  slideMesh?: THREE.Mesh;
  handsMesh?: THREE.Group;
}

export class WeaponModelGenerator {
  // Weapon Materials (brightened and contrasted so they pop)
  private static metalMat = new THREE.MeshStandardMaterial({
    color: 0x222730,
    metalness: 0.85,
    roughness: 0.3
  });

  private static steelMat = new THREE.MeshStandardMaterial({
    color: 0x3d4450,
    metalness: 0.9,
    roughness: 0.2
  });

  private static gripMat = new THREE.MeshStandardMaterial({
    color: 0x181c22,
    metalness: 0.1,
    roughness: 0.85
  });

  private static accentMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b, // tactical amber
    metalness: 0.6,
    roughness: 0.4
  });

  private static opticDotMat = new THREE.MeshBasicMaterial({
    color: 0x00ff88 // bright neon optic dot
  });

  // Operative Tactical Hands & Sleeve Materials
  private static sleeveMat = new THREE.MeshStandardMaterial({
    color: 0x2b3240, // Tactical midnight blue / charcoal operative uniform
    roughness: 0.85,
    metalness: 0.1
  });

  private static gloveMat = new THREE.MeshStandardMaterial({
    color: 0x1e222a, // Dark reinforced combat glove
    roughness: 0.65,
    metalness: 0.2
  });

  private static gloveKnuckleMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a, // Polymer knuckle armor guard
    roughness: 0.35,
    metalness: 0.6
  });

  private static gloveAccentMat = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9, // Tactical cyan piping
    roughness: 0.5,
    metalness: 0.4
  });

  private static skinMat = new THREE.MeshStandardMaterial({
    color: 0xd4a373, // Visible wrist/finger skin tone
    roughness: 0.7,
    metalness: 0.05
  });

  public static createWeaponModel(type: WeaponType): WeaponModelData {
    switch (type) {
      case 'VIPER9':
        return this.createViper9();
      case 'AR7':
        return this.createAR7();
      case 'LONGSHOT':
        return this.createLongshot();
    }
  }

  // --- HELPER: Create Tactical Operative Arm & Hand ---
  private static createOperativeArm(isRightHand: boolean): THREE.Group {
    const arm = new THREE.Group();
    const side = isRightHand ? 1 : -1;

    // 1. Forearm Sleeve
    const forearmGeo = new THREE.CylinderGeometry(0.048, 0.042, 0.28, 12);
    const forearm = new THREE.Mesh(forearmGeo, this.sleeveMat);
    forearm.castShadow = true;
    forearm.rotation.z = side * 0.15;
    forearm.position.set(side * 0.02, -0.16, 0.14);
    arm.add(forearm);

    // 2. Sleeve Cuff / Wrist Watch
    const cuffGeo = new THREE.CylinderGeometry(0.046, 0.046, 0.035, 12);
    const cuff = new THREE.Mesh(cuffGeo, this.gloveAccentMat);
    cuff.position.set(side * 0.02, -0.04, 0.07);
    arm.add(cuff);

    // 3. Hand / Glove Palm
    const palmGeo = new THREE.BoxGeometry(0.065, 0.075, 0.045);
    const palm = new THREE.Mesh(palmGeo, this.gloveMat);
    palm.position.set(0, 0, 0);
    arm.add(palm);

    // 4. Armored Knuckle Guard
    const knuckleGeo = new THREE.BoxGeometry(0.062, 0.022, 0.016);
    const knuckle = new THREE.Mesh(knuckleGeo, this.gloveKnuckleMat);
    knuckle.position.set(0, 0.02, 0.024);
    arm.add(knuckle);

    // 5. Thumb
    const thumbGeo = new THREE.BoxGeometry(0.022, 0.045, 0.022);
    const thumb = new THREE.Mesh(thumbGeo, this.gloveMat);
    thumb.position.set(side * -0.035, 0.01, 0.01);
    thumb.rotation.z = side * -0.4;
    arm.add(thumb);

    // 6. Fingers (gripping curve)
    for (let f = 0; f < 4; f++) {
      const fingerGeo = new THREE.BoxGeometry(0.014, 0.042, 0.02);
      const finger = new THREE.Mesh(fingerGeo, this.gloveMat);
      finger.position.set(-0.022 + f * 0.015, -0.038, 0.018);
      finger.rotation.x = 0.5;
      arm.add(finger);
    }

    return arm;
  }

  // --- VIPER-9 PISTOL WITH HANDS ---
  private static createViper9(): WeaponModelData {
    const group = new THREE.Group();

    // Frame / Receiver
    const frameGeo = new THREE.BoxGeometry(0.042, 0.085, 0.17);
    const frame = new THREE.Mesh(frameGeo, this.metalMat);
    frame.position.set(0, -0.01, 0);
    group.add(frame);

    // Grip
    const gripGeo = new THREE.BoxGeometry(0.04, 0.13, 0.065);
    const grip = new THREE.Mesh(gripGeo, this.gripMat);
    grip.position.set(0, -0.09, 0.04);
    grip.rotation.x = -0.25;
    group.add(grip);

    // Slide (two-tone steel)
    const slideGeo = new THREE.BoxGeometry(0.044, 0.048, 0.21);
    const slide = new THREE.Mesh(slideGeo, this.steelMat);
    slide.position.set(0, 0.042, -0.02);
    group.add(slide);

    // Barrel tip
    const barrelGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.05, 12);
    const barrel = new THREE.Mesh(barrelGeo, this.steelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.038, -0.135);
    group.add(barrel);

    // Front / Rear Sights with glowing dots
    const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.012, 0.008), this.opticDotMat);
    frontSight.position.set(0, 0.07, -0.115);
    group.add(frontSight);

    const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.012, 0.006), this.metalMat);
    rearSight.position.set(0, 0.07, 0.075);
    group.add(rearSight);

    // Amber Tactical Accent Line
    const accent = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.006, 0.12), this.accentMat);
    accent.position.set(0, 0.02, 0.01);
    group.add(accent);

    // --- OPERATIVE HANDS GRIPPING PISTOL ---
    const hands = new THREE.Group();

    // Right Hand (primary shooting hand around grip)
    const rightHand = this.createOperativeArm(true);
    rightHand.position.set(0.015, -0.11, 0.06);
    rightHand.rotation.set(-0.25, 0.05, -0.08);
    hands.add(rightHand);

    // Left Hand (support hand cupping base plate)
    const leftHand = this.createOperativeArm(false);
    leftHand.position.set(-0.045, -0.14, 0.05);
    leftHand.rotation.set(-0.2, 0.35, 0.3);
    hands.add(leftHand);

    group.add(hands);

    return {
      mesh: group,
      muzzlePosition: new THREE.Vector3(0, 0.038, -0.165),
      defaultPosition: new THREE.Vector3(0.16, -0.17, -0.34),
      defaultRotation: new THREE.Euler(0, 0, 0),
      adsPosition: new THREE.Vector3(0, -0.07, -0.30),
      adsRotation: new THREE.Euler(0, 0, 0),
      slideMesh: slide,
      handsMesh: hands
    };
  }

  // --- AR-7 STRIKER ASSAULT RIFLE WITH HANDS ---
  private static createAR7(): WeaponModelData {
    const group = new THREE.Group();

    // Upper & Lower Receiver
    const recGeo = new THREE.BoxGeometry(0.054, 0.09, 0.32);
    const receiver = new THREE.Mesh(recGeo, this.metalMat);
    receiver.position.set(0, 0, 0);
    group.add(receiver);

    // Handguard / Shroud
    const handguardGeo = new THREE.BoxGeometry(0.052, 0.07, 0.28);
    const handguard = new THREE.Mesh(handguardGeo, this.steelMat);
    handguard.position.set(0, 0.005, -0.28);
    group.add(handguard);

    // Barrel
    const barrelGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.18, 12);
    const barrel = new THREE.Mesh(barrelGeo, this.steelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.012, -0.48);
    group.add(barrel);

    // Tactical Muzzle Brake / Flash Hider
    const muzzleGeo = new THREE.CylinderGeometry(0.019, 0.017, 0.07, 12);
    const muzzle = new THREE.Mesh(muzzleGeo, this.metalMat);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(0, 0.012, -0.56);
    group.add(muzzle);

    // Curved Magazine
    const magGeo = new THREE.BoxGeometry(0.044, 0.18, 0.085);
    const mag = new THREE.Mesh(magGeo, this.steelMat);
    mag.position.set(0, -0.12, -0.07);
    mag.rotation.x = 0.22;
    group.add(mag);

    // Pistol Grip
    const gripGeo = new THREE.BoxGeometry(0.042, 0.14, 0.065);
    const grip = new THREE.Mesh(gripGeo, this.gripMat);
    grip.position.set(0, -0.09, 0.13);
    grip.rotation.x = -0.32;
    group.add(grip);

    // Tactical Stock
    const stockGeo = new THREE.BoxGeometry(0.048, 0.12, 0.24);
    const stock = new THREE.Mesh(stockGeo, this.gripMat);
    stock.position.set(0, -0.01, 0.26);
    group.add(stock);

    // Holographic Sight Mount & Glass Frame
    const sightBase = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.038, 0.095), this.metalMat);
    sightBase.position.set(0, 0.064, -0.03);
    group.add(sightBase);

    const sightRing = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.052, 0.045), this.steelMat);
    sightRing.position.set(0, 0.095, -0.03);
    group.add(sightRing);

    // Glowing Green Holographic Reticle Dot
    const reticle = new THREE.Mesh(new THREE.SphereGeometry(0.004, 8, 8), this.opticDotMat);
    reticle.position.set(0, 0.095, -0.03);
    group.add(reticle);

    // Amber Styling Accent
    const accent = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.01, 0.16), this.accentMat);
    accent.position.set(0, 0.022, 0.04);
    group.add(accent);

    // --- OPERATIVE HANDS HOLDING RIFLE ---
    const hands = new THREE.Group();

    // Right Hand (on pistol grip & trigger)
    const rightHand = this.createOperativeArm(true);
    rightHand.position.set(0.02, -0.11, 0.14);
    rightHand.rotation.set(-0.32, 0.08, -0.1);
    hands.add(rightHand);

    // Left Hand (forward holding handguard / angled foregrip)
    const leftHand = this.createOperativeArm(false);
    leftHand.position.set(-0.035, -0.04, -0.22);
    leftHand.rotation.set(0.1, 0.25, 0.4);
    hands.add(leftHand);

    group.add(hands);

    return {
      mesh: group,
      muzzlePosition: new THREE.Vector3(0, 0.012, -0.60),
      defaultPosition: new THREE.Vector3(0.18, -0.20, -0.38),
      defaultRotation: new THREE.Euler(0, 0, 0),
      adsPosition: new THREE.Vector3(0, -0.095, -0.32),
      adsRotation: new THREE.Euler(0, 0, 0),
      handsMesh: hands
    };
  }

  // --- LONGSHOT SNIPER RIFLE WITH HANDS ---
  private static createLongshot(): WeaponModelData {
    const group = new THREE.Group();

    // Heavy Receiver
    const recGeo = new THREE.BoxGeometry(0.065, 0.095, 0.45);
    const receiver = new THREE.Mesh(recGeo, this.metalMat);
    receiver.position.set(0, 0, 0);
    group.add(receiver);

    // Long Heavy Fluted Barrel
    const barrelGeo = new THREE.CylinderGeometry(0.02, 0.018, 0.72, 12);
    const barrel = new THREE.Mesh(barrelGeo, this.steelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.012, -0.56);
    group.add(barrel);

    // Heavy Tactical Muzzle Brake
    const muzzleGeo = new THREE.BoxGeometry(0.05, 0.05, 0.12);
    const muzzle = new THREE.Mesh(muzzleGeo, this.steelMat);
    muzzle.position.set(0, 0.012, -0.96);
    group.add(muzzle);

    // Large Sniper Scope Tube & Mounts
    const scopeTubeGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.35, 16);
    const scopeTube = new THREE.Mesh(scopeTubeGeo, this.steelMat);
    scopeTube.rotation.x = Math.PI / 2;
    scopeTube.position.set(0, 0.118, -0.05);
    group.add(scopeTube);

    const scopeLensGeo = new THREE.CylinderGeometry(0.036, 0.03, 0.09, 16);
    const scopeBell = new THREE.Mesh(scopeLensGeo, this.metalMat);
    scopeBell.rotation.x = Math.PI / 2;
    scopeBell.position.set(0, 0.118, -0.24);
    group.add(scopeBell);

    // Box Magazine
    const magGeo = new THREE.BoxGeometry(0.048, 0.15, 0.095);
    const mag = new THREE.Mesh(magGeo, this.metalMat);
    mag.position.set(0, -0.105, -0.02);
    group.add(mag);

    // Thumbhole Sniper Stock
    const stockGeo = new THREE.BoxGeometry(0.052, 0.15, 0.38);
    const stock = new THREE.Mesh(stockGeo, this.gripMat);
    stock.position.set(0, -0.02, 0.37);
    group.add(stock);

    // --- OPERATIVE HANDS HOLDING SNIPER ---
    const hands = new THREE.Group();

    // Right Hand (around sniper stock grip)
    const rightHand = this.createOperativeArm(true);
    rightHand.position.set(0.025, -0.09, 0.18);
    rightHand.rotation.set(-0.28, 0.06, -0.1);
    hands.add(rightHand);

    // Left Hand (supporting under-barrel forestock)
    const leftHand = this.createOperativeArm(false);
    leftHand.position.set(-0.038, -0.07, -0.16);
    leftHand.rotation.set(0.05, 0.3, 0.35);
    hands.add(leftHand);

    group.add(hands);

    return {
      mesh: group,
      muzzlePosition: new THREE.Vector3(0, 0.012, -1.02),
      defaultPosition: new THREE.Vector3(0.20, -0.22, -0.42),
      defaultRotation: new THREE.Euler(0, 0, 0),
      adsPosition: new THREE.Vector3(0, -0.118, -0.26),
      adsRotation: new THREE.Euler(0, 0, 0),
      handsMesh: hands
    };
  }
}
