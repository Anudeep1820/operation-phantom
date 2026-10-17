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
}

export class WeaponModelGenerator {
  private static metalMat = new THREE.MeshStandardMaterial({
    color: 0x181a1d,
    metalness: 0.85,
    roughness: 0.35
  });

  private static steelMat = new THREE.MeshStandardMaterial({
    color: 0x2b2e33,
    metalness: 0.9,
    roughness: 0.25
  });

  private static gripMat = new THREE.MeshStandardMaterial({
    color: 0x111214,
    metalness: 0.2,
    roughness: 0.8
  });

  private static accentMat = new THREE.MeshStandardMaterial({
    color: 0xd97706, // tactical amber
    metalness: 0.5,
    roughness: 0.5
  });

  private static opticDotMat = new THREE.MeshBasicMaterial({
    color: 0x00ff88 // neon tactical green reticle
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

  // --- VIPER-9 PISTOL ---
  private static createViper9(): WeaponModelData {
    const group = new THREE.Group();

    // Frame / Receiver
    const frameGeo = new THREE.BoxGeometry(0.04, 0.08, 0.16);
    const frame = new THREE.Mesh(frameGeo, this.metalMat);
    frame.position.set(0, -0.01, 0);
    group.add(frame);

    // Grip
    const gripGeo = new THREE.BoxGeometry(0.038, 0.12, 0.06);
    const grip = new THREE.Mesh(gripGeo, this.gripMat);
    grip.position.set(0, -0.09, 0.04);
    grip.rotation.x = -0.25;
    group.add(grip);

    // Slide
    const slideGeo = new THREE.BoxGeometry(0.042, 0.045, 0.2);
    const slide = new THREE.Mesh(slideGeo, this.steelMat);
    slide.position.set(0, 0.04, -0.02);
    group.add(slide);

    // Barrel tip
    const barrelGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.05, 12);
    const barrel = new THREE.Mesh(barrelGeo, this.steelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.035, -0.13);
    group.add(barrel);

    // Front / Rear Sights
    const sightGeo = new THREE.BoxGeometry(0.006, 0.012, 0.008);
    const frontSight = new THREE.Mesh(sightGeo, this.opticDotMat);
    frontSight.position.set(0, 0.065, -0.11);
    group.add(frontSight);

    const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.01, 0.006), this.metalMat);
    rearSight.position.set(0, 0.065, 0.07);
    group.add(rearSight);

    return {
      mesh: group,
      muzzlePosition: new THREE.Vector3(0, 0.035, -0.16),
      defaultPosition: new THREE.Vector3(0.18, -0.18, -0.36),
      defaultRotation: new THREE.Euler(0, 0, 0),
      adsPosition: new THREE.Vector3(0, -0.068, -0.32),
      adsRotation: new THREE.Euler(0, 0, 0),
      slideMesh: slide
    };
  }

  // --- AR-7 STRIKER ASSAULT RIFLE ---
  private static createAR7(): WeaponModelData {
    const group = new THREE.Group();

    // Upper & Lower Receiver
    const recGeo = new THREE.BoxGeometry(0.052, 0.085, 0.3);
    const receiver = new THREE.Mesh(recGeo, this.metalMat);
    receiver.position.set(0, 0, 0);
    group.add(receiver);

    // Handguard / Shroud
    const handguardGeo = new THREE.BoxGeometry(0.05, 0.065, 0.26);
    const handguard = new THREE.Mesh(handguardGeo, this.steelMat);
    handguard.position.set(0, 0.005, -0.27);
    group.add(handguard);

    // Barrel
    const barrelGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.16, 12);
    const barrel = new THREE.Mesh(barrelGeo, this.steelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.01, -0.45);
    group.add(barrel);

    // Flash hider / Muzzle Brake
    const muzzleGeo = new THREE.CylinderGeometry(0.017, 0.016, 0.06, 12);
    const muzzle = new THREE.Mesh(muzzleGeo, this.metalMat);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(0, 0.01, -0.53);
    group.add(muzzle);

    // Curved Magazine
    const magGeo = new THREE.BoxGeometry(0.042, 0.16, 0.08);
    const mag = new THREE.Mesh(magGeo, this.metalMat);
    mag.position.set(0, -0.11, -0.06);
    mag.rotation.x = 0.2;
    group.add(mag);

    // Pistol Grip
    const gripGeo = new THREE.BoxGeometry(0.04, 0.13, 0.06);
    const grip = new THREE.Mesh(gripGeo, this.gripMat);
    grip.position.set(0, -0.09, 0.12);
    grip.rotation.x = -0.3;
    group.add(grip);

    // Tactical Stock
    const stockGeo = new THREE.BoxGeometry(0.045, 0.11, 0.22);
    const stock = new THREE.Mesh(stockGeo, this.gripMat);
    stock.position.set(0, -0.01, 0.25);
    group.add(stock);

    // Holographic Sight Mount & Glass
    const sightBase = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.035, 0.09), this.metalMat);
    sightBase.position.set(0, 0.06, -0.02);
    group.add(sightBase);

    const sightRing = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.04), this.steelMat);
    sightRing.position.set(0, 0.09, -0.02);
    group.add(sightRing);

    // Red/Green Holo Reticle Dot
    const reticle = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 8, 8), this.opticDotMat);
    reticle.position.set(0, 0.09, -0.02);
    group.add(reticle);

    // Amber Accent Line
    const accent = new THREE.Mesh(new THREE.BoxGeometry(0.054, 0.008, 0.14), this.accentMat);
    accent.position.set(0, 0.02, 0.04);
    group.add(accent);

    return {
      mesh: group,
      muzzlePosition: new THREE.Vector3(0, 0.01, -0.56),
      defaultPosition: new THREE.Vector3(0.2, -0.22, -0.42),
      defaultRotation: new THREE.Euler(0, 0, 0),
      adsPosition: new THREE.Vector3(0, -0.09, -0.34),
      adsRotation: new THREE.Euler(0, 0, 0)
    };
  }

  // --- LONGSHOT SNIPER RIFLE ---
  private static createLongshot(): WeaponModelData {
    const group = new THREE.Group();

    // Heavy Receiver
    const recGeo = new THREE.BoxGeometry(0.06, 0.09, 0.42);
    const receiver = new THREE.Mesh(recGeo, this.metalMat);
    receiver.position.set(0, 0, 0);
    group.add(receiver);

    // Long Heavy Barrel
    const barrelGeo = new THREE.CylinderGeometry(0.018, 0.016, 0.65, 12);
    const barrel = new THREE.Mesh(barrelGeo, this.steelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.01, -0.52);
    group.add(barrel);

    // Large Sniper Muzzle Brake
    const muzzleGeo = new THREE.BoxGeometry(0.045, 0.045, 0.1);
    const muzzle = new THREE.Mesh(muzzleGeo, this.steelMat);
    muzzle.position.set(0, 0.01, -0.87);
    group.add(muzzle);

    // Large High-Magnification Scope
    const scopeTubeGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.32, 16);
    const scopeTube = new THREE.Mesh(scopeTubeGeo, this.steelMat);
    scopeTube.rotation.x = Math.PI / 2;
    scopeTube.position.set(0, 0.11, -0.04);
    group.add(scopeTube);

    const scopeLensGeo = new THREE.CylinderGeometry(0.034, 0.028, 0.08, 16);
    const scopeBellFront = new THREE.Mesh(scopeLensGeo, this.metalMat);
    scopeBellFront.rotation.x = Math.PI / 2;
    scopeBellFront.position.set(0, 0.11, -0.22);
    group.add(scopeBellFront);

    // Scope Mount Rings
    const mountGeo = new THREE.BoxGeometry(0.04, 0.05, 0.04);
    const mount1 = new THREE.Mesh(mountGeo, this.metalMat);
    mount1.position.set(0, 0.065, -0.14);
    group.add(mount1);
    const mount2 = new THREE.Mesh(mountGeo, this.metalMat);
    mount2.position.set(0, 0.065, 0.06);
    group.add(mount2);

    // Box Magazine
    const magGeo = new THREE.BoxGeometry(0.045, 0.14, 0.09);
    const mag = new THREE.Mesh(magGeo, this.metalMat);
    mag.position.set(0, -0.1, -0.02);
    group.add(mag);

    // Thumbhole Sniper Stock
    const stockGeo = new THREE.BoxGeometry(0.05, 0.14, 0.35);
    const stock = new THREE.Mesh(stockGeo, this.gripMat);
    stock.position.set(0, -0.02, 0.35);
    group.add(stock);

    return {
      mesh: group,
      muzzlePosition: new THREE.Vector3(0, 0.01, -0.92),
      defaultPosition: new THREE.Vector3(0.22, -0.24, -0.46),
      defaultRotation: new THREE.Euler(0, 0, 0),
      adsPosition: new THREE.Vector3(0, -0.11, -0.28),
      adsRotation: new THREE.Euler(0, 0, 0)
    };
  }
}
