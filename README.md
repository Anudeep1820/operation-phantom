# OPERATION PHANTOM : MOBILE
> High-Performance 3D Browser Tactical First-Person Shooter

[![Play Live on Vercel](https://img.shields.io/badge/PLAY%20LIVE-ON%20VERCEL-00f0ff?style=for-the-badge&logo=vercel&logoColor=black)](https://operation-phantom-ten.vercel.app)
[![GitHub Repository](https://img.shields.io/badge/GITHUB-REPO-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Anudeep1820/operation-phantom)
[![Built with Three.js](https://img.shields.io/badge/Three.js-WebGL-black?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![Built with TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

### 🌐 Live Production URL
### 👉 **[https://operation-phantom-ten.vercel.app](https://operation-phantom-ten.vercel.app)** 👈
*(Click to play instantly in your browser — zero downloads, zero APK required!)*

---

**OPERATION PHANTOM : MOBILE** is an original, polished, browser-playable 3D first-person tactical shooter engineered for modern mobile browsers (Android / iOS) and desktop browsers. Built with **TypeScript**, **Three.js**, and **Vite**, and deployed globally on **Vercel**, it delivers responsive tactical gunplay, open-world vehicle driving, autonomous AI bots, dynamic weapon recoil, and a mobile-first touch HUD.

---

## 🎮 Key Features

- **Responsive First-Person Controller:**
  - True 60 FPS first-person camera with mouse-look and touch-swipe aiming.
  - Movement mechanics: walk, sprint, crouch, jump, gravity, and stable AABB map collision detection.
  - Camera bobbing, weapon sway, and recoil spring recovery.
  - Smooth Aim-Down-Sights (ADS) FOV zoom with procedural weapon sight alignment.
- **Weapon Arsenal with Full Tactical Scopes:**
  - **Viper-9 (Tactical Pistol):** Semi-automatic, 15 rounds, 34 DMG, green tritium dot reflex sight.
  - **AR-7 Striker (Assault Rifle):** Full-automatic (620 RPM), 30 rounds, 26 DMG, holographic illuminated red dot reflex sight.
  - **Longshot (Sniper):** Bolt-action, 5 rounds, 115 DMG, 16° zoom mil-dot precision sniper scope.
- **🚗 Drivable Tactical Military Buggy:**
  - Fully drivable open-world vehicle with throttle, steering, physical spinning wheels, dual spotlights, and Box3 building collision detection.
  - Mount/dismount via `[E]` key or touch `🚗 DRIVE` button.
  - 3rd-person chase camera and vehicle bot-crushing impact damage.
- **⚚ Totem of Undying Shield:**
  - Automatically intercepts fatal damage with radiant golden revival flash, restoring 100 HP + 50 AP and granting 3.5s immunity.
- **🌍 600m × 600m Open-World Compound:**
  - Expansive daylight map featuring 560m asphalt highway network and 4 distinct tactical bases:
    - South Forward Operating Base & Motor Pool
    - Central Crossroads Checkpoint
    - North Omega Fortress & Silo Depot
    - East Satellite Communications Outpost
    - West Industrial Fuel Refinery
- **Autonomous Outpost Guards:**
  - Humanoid tactical soldiers with Kevlar helmets, armor plates, and articulated walking legs.
  - Vision cone detection (~80° forward cone, 28m awareness radius).
  - Outpost guards patrol local waypoints and only open fire when you are detected.
- **Procedural Tactical Audio System:**
  - Custom Web Audio API synthesizer for zero-asset-latency, 100% reliable sound effects: distinct gunshots, mechanical reloads, footsteps, bullet impacts, hitmarker dings, hurt audio, and victory/defeat stingers.
- **Mobile-First Responsive Touch HUD:**
  - Left virtual 360° analog joystick with auto-centering.
  - Right camera aim drag pad with independent pointer ID tracking.
  - Dedicated buttons for Fire, ADS, Reload, Jump, Crouch, Sprint toggle, and Weapon Quick-Swap pills.
  - Dynamic crosshair with recoil bloom and sniper optic vignette.
  - Real-time Kill Feed, team scores, match timer, and health/armor vitals.
- **Performance & Graphics Presets:**
  - Low (no shadows, optimized mobile scaling for 3GB/4GB Android devices).
  - Medium (native resolution, basic shadows, balanced performance).
  - High (soft PCF shadows, full resolution scaling, rich atmospheric fog).
  - Built-in FPS, frame-time (ms), and draw call monitor.

---

## 🕹️ Controls Guide

### Desktop Controls
| Input | Action |
| :--- | :--- |
| **W, A, S, D** | Move Operative |
| **Mouse Move** | Aim / Look (Click canvas to lock pointer) |
| **Left Click** | Fire Weapon (Automatic or Semi-Auto) |
| **Right Click** | Aim Down Sights (ADS) / Sniper Scope |
| **Shift** | Tactical Sprint |
| **Space** | Jump |
| **C** | Crouch |
| **R** | Reload Magazine |
| **1, 2, 3** | Switch to AR-7 / Viper-9 / Longshot |
| **ESC** | Pause Menu / Release Pointer |

### Mobile Touch Controls
| Control | Function |
| :--- | :--- |
| **Left Joystick** | Smooth 360° analog movement |
| **Right Screen Area** | Swipe to rotate camera and aim |
| **FIRE Button** | Trigger weapon (tap or hold for auto-fire) |
| **ADS Button** | Toggle aim-down-sights or sniper zoom |
| **JUMP / CROUCH / RUN** | Dedicated tactical action buttons |
| **Top-Right Pills** | Instant 1-tap weapon switching |
| **Pause Button (⏸)** | Open combat suspension menu |

---

## 📁 Project Architecture

```
operation-phantom/
├── public/                 # Static assets
├── src/
│   ├── app/
│   │   └── Game.ts         # Central game coordinator & render loop
│   ├── core/
│   │   ├── AudioManager.ts # Web Audio API procedural sound engine
│   │   ├── InputManager.ts # Keyboard, mouse & touch input bridge
│   │   └── PerformanceManager.ts # Real-time FPS & draw call monitor
│   ├── controls/
│   │   └── TouchControls.ts # Multitouch virtual joystick & action pad
│   ├── player/
│   │   └── PlayerController.ts # FPS camera, physics & AABB collision
│   ├── weapons/
│   │   ├── WeaponConfig.ts # Stats for Viper-9, AR-7, Longshot
│   │   ├── WeaponModelGenerator.ts # Procedural 3D weapon meshes & ADS offsets
│   │   ├── Weapon.ts       # Firing logic, recoil spring & ammo states
│   │   └── WeaponManager.ts# Inventory & weapon switching
│   ├── combat/
│   │   ├── HitDetection.ts # Center raycasting, headshot detection & tracers
│   │   └── DamageSystem.ts # Armor mitigation, scoring & kill feed
│   ├── effects/
│   │   └── ParticleManager.ts # Pooled tracers, muzzle flashes & impact sparks
│   ├── ai/
│   │   ├── BotController.ts# Tactical bot state machine & humanoid mesh
│   │   └── BotManager.ts   # Bot squad lifecycle & target registry
│   ├── maps/
│   │   └── NeonDistrict.ts # 3D night urban combat map & colliders
│   ├── game-modes/
│   │   └── PracticeMode.ts # Skirmish rules, score limits & respawns
│   ├── ui/
│   │   ├── HUD.ts          # Vitals, crosshair, scope overlay & killfeed
│   │   ├── MainMenu.ts     # Title screen & briefing manual
│   │   ├── SettingsMenu.ts # Graphics presets & sensitivity controls
│   │   └── MatchResults.ts # Victory/defeat modal & pause overlay
│   ├── types/
│   │   └── index.ts        # Shared TypeScript interfaces & types
│   ├── styles/
│   │   └── main.css        # Tactical glassmorphism styling
│   ├── vite-env.d.ts
│   └── main.ts             # WebGL check & bootstrap entry point
├── index.html              # Responsive HTML viewport setup
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vercel.json             # Vercel deployment configuration
```

---

## 🛠️ Local Development

### Prerequisites
- Node.js (v18+ or v22+)
- npm

### Installation & Run
```bash
# Clone the repository
git clone <your-repo-url>
cd operation-phantom

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open the displayed localhost URL (e.g. `http://localhost:3000`) in Chrome, Safari, or an Android mobile browser via local Wi-Fi.

### Production Build & Preview
```bash
# Type check and bundle for production
npm run build

# Preview production build locally
npm run preview
```

---

## 🚀 Live Vercel Deployment & Web Access

This game is fully deployed and hosted globally on **Vercel** with automatic continuous deployment (CI/CD) on every Git push:

- **Official Live Playable Game:** [https://operation-phantom-ten.vercel.app](https://operation-phantom-ten.vercel.app)
- **GitHub Repository:** [https://github.com/Anudeep1820/operation-phantom](https://github.com/Anudeep1820/operation-phantom)

### How to Play:
1. Open [https://operation-phantom-ten.vercel.app](https://operation-phantom-ten.vercel.app) on any mobile or desktop web browser.
2. Tap or click **DEPLOY COMBAT**.
3. No local setup, no emulator, and no APK downloads needed — it runs 100% on the cloud.

### Linking the Vercel URL on GitHub:
To show the direct clickable link on your GitHub repository page's right sidebar:
1. Go to [https://github.com/Anudeep1820/operation-phantom](https://github.com/Anudeep1820/operation-phantom).
2. Click the ⚙️ gear icon next to **About** on the right side of the repository header.
3. In the **Website** field, paste:
   ```
   https://operation-phantom-ten.vercel.app
   ```
4. Click **Save changes**. The live link will be pinned directly on your GitHub repo page!

---

## 📊 Measured Build Metrics

- **Total Gzipped JS Bundle:** ~152 kB (Three.js + complete game engine)
- **Total Gzipped CSS:** ~3.28 kB
- **Total Initial Download:** < 160 kB (loads in < 0.4s on 3G/4G mobile networks)
- **Zero External Texture/Audio HTTP Failures:** High-performance procedural assets guaranteed to work offline without 404s.

---

## 📜 License
Original work. Built with modern web standards and MIT-licensed dependencies.
