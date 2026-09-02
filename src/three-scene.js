/**
 * ══════════════════════════════════════════════════════════════════
 * RESUMIND — 3D INTERACTIVE SCENE ("THE RESUME ENGINE")
 * File: /src/three-scene.js
 * ══════════════════════════════════════════════════════════════════
 * Architected with Three.js (r160+ via ESM importmap).
 * Generates a procedural multi-layered holographic document core:
 *  - Top Shell: Header card, contact badge, cyan wireframe geometry
 *  - Core Layer: Array of skill chips + central mint Score Engine torus
 *  - Base Layer: ATS validation grid with InstancedMesh connection nodes
 * Includes OrbitControls toggle, scroll-scrubbed exploded view,
 * 3D-to-2D screen coordinate projection for floating hotspots,
 * and IntersectionObserver render-loop throttling.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class ThreeScene {
  /**
   * Initializes the WebGL canvas, Three.js camera, lights, and procedural geometry.
   * @param {HTMLCanvasElement} canvas - Target DOM canvas element
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.container = canvas.parentElement;

    // Viewport dimensions
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Mode state: 'scroll' | 'orbit'
    this.isOrbitMode = false;
    this.isIntersecting = true;
    this.explosionProgress = 0; // 0 (assembled) -> 1 (fully exploded)

    // Animation loop handles
    this.animationFrameId = null;
    this.clock = new THREE.Clock();

    // 3D Anchor points for screen-space hotspots
    this.hotspotAnchors = {
      ats: new THREE.Vector3(0, 0, 0),        // Centered on Score Engine
      skills: new THREE.Vector3(1.6, 0.4, 0),  // Anchored on skill chips
      verbs: new THREE.Vector3(-1.4, 1.8, 0.4),// Anchored on top header card
      matrix: new THREE.Vector3(0, -1.8, -0.6) // Anchored on validation grid
    };

    // Initialize subsystem
    this.initRenderer();
    this.initScene();
    this.initCamera();
    this.initLighting();
    this.initMaterials();
    this.buildDocumentCore();
    this.initOrbitControls();
    this.initResizeListener();
    this.initVisibilityObserver();

    // Start render loop
    this.startRenderLoop();
  }

  /**
   * Configures WebGLRenderer with high-performance settings and ACES tone mapping.
   */
  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
  }

  /**
   * Initializes the Three.js Scene and subtle depth fog.
   */
  initScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x08080a, 0.035);
  }

  /**
   * Sets up PerspectiveCamera positioned for cinematic presentation.
   */
  initCamera() {
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100);
    this.defaultCameraPos = new THREE.Vector3(4.5, 3.2, 6.5);
    this.camera.position.copy(this.defaultCameraPos);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Sets up studio 3-point lighting with cyber cyan and mint color accents.
   */
  initLighting() {
    // Soft ambient fill
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);

    // Key Light (Cyan)
    const keyLight = new THREE.DirectionalLight(0x00e5ff, 2.4);
    keyLight.position.set(8, 12, 8);
    this.scene.add(keyLight);

    // Rim Light (Mint)
    const rimLight = new THREE.DirectionalLight(0x3cffc4, 1.8);
    rimLight.position.set(-8, 6, -6);
    this.scene.add(rimLight);

    // Core Internal Glow Point Light
    this.corePointLight = new THREE.PointLight(0x3cffc4, 3.5, 12);
    this.corePointLight.position.set(0, 0, 0);
    this.scene.add(this.corePointLight);
  }

  /**
   * Shared PBR & glowing wireframe materials for performance and visual consistency.
   */
  initMaterials() {
    this.materials = {
      // Top Shell translucent card
      headerGlass: new THREE.MeshPhysicalMaterial({
        color: 0x141419,
        metalness: 0.2,
        roughness: 0.1,
        transmission: 0.85,
        transparent: true,
        opacity: 0.8,
        ior: 1.5,
      }),
      // Cyan Wireframe edge highlight
      cyanWire: new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        wireframe: true,
        transparent: true,
        opacity: 0.45
      }),
      // Mint Emissive Score Engine
      mintEmissive: new THREE.MeshStandardMaterial({
        color: 0x3cffc4,
        emissive: 0x3cffc4,
        emissiveIntensity: 0.8,
        roughness: 0.2,
        metalness: 0.6
      }),
      // Core skill chips
      chipMat: new THREE.MeshStandardMaterial({
        color: 0x1e202b,
        roughness: 0.35,
        metalness: 0.7
      }),
      chipAccentMat: new THREE.MeshBasicMaterial({
        color: 0x00e5ff
      }),
      // Substrate Node Instanced Material
      nodeMat: new THREE.MeshStandardMaterial({
        color: 0x00e5ff,
        emissive: 0x00e5ff,
        emissiveIntensity: 0.6,
        roughness: 0.3
      })
    };
  }

  /**
   * Generates the multi-layered procedural "Resume Engine" document assembly:
   * Layer 1: Top Shell (Header card, avatar badge, text lines)
   * Layer 2: Core Matrix (Skill chips grid + central rotating Score Engine torus)
   * Layer 3: Base Layer (ATS validation grid + instanced node sphere matrix)
   */
  buildDocumentCore() {
    this.masterAssembly = new THREE.Group();
    this.scene.add(this.masterAssembly);

    // ── 1. LAYER 1: TOP SHELL GROUP ──
    this.topShellGroup = new THREE.Group();
    this.masterAssembly.add(this.topShellGroup);

    // Main header card slab
    const cardGeo = new THREE.BoxGeometry(3.6, 0.08, 4.8);
    const cardMesh = new THREE.Mesh(cardGeo, this.materials.headerGlass);
    this.topShellGroup.add(cardMesh);

    // Wireframe perimeter overlay
    const wireMesh = new THREE.Mesh(cardGeo, this.materials.cyanWire);
    wireMesh.scale.set(1.002, 1.002, 1.002);
    this.topShellGroup.add(wireMesh);

    // Header contact badge
    const badgeGeo = new THREE.BoxGeometry(1.2, 0.04, 0.8);
    const badgeMesh = new THREE.Mesh(badgeGeo, this.materials.chipMat);
    badgeMesh.position.set(-1.0, 0.08, -1.8);
    this.topShellGroup.add(badgeMesh);

    // Simulated resume typography lines
    for (let i = 0; i < 6; i++) {
      const lineGeo = new THREE.BoxGeometry(2.0, 0.02, 0.12);
      const lineMesh = new THREE.Mesh(lineGeo, i % 2 === 0 ? this.materials.chipAccentMat : this.materials.cyanWire);
      lineMesh.position.set(0.4, 0.06, -1.8 + i * 0.3);
      this.topShellGroup.add(lineMesh);
    }

    // ── 2. LAYER 2: CORE LAYER (SKILL CHIPS & SCORE ENGINE) ──
    this.coreLayerGroup = new THREE.Group();
    this.masterAssembly.add(this.coreLayerGroup);

    // Central "Score Engine": Floating Torus around an Icosahedron
    const torusGeo = new THREE.TorusGeometry(0.85, 0.12, 16, 64);
    this.scoreTorus = new THREE.Mesh(torusGeo, this.materials.mintEmissive);
    this.scoreTorus.rotation.x = Math.PI / 2;
    this.coreLayerGroup.add(this.scoreTorus);

    const icoGeo = new THREE.IcosahedronGeometry(0.45, 1);
    this.scoreIco = new THREE.Mesh(icoGeo, this.materials.cyanWire);
    this.coreLayerGroup.add(this.scoreIco);

    // Grid of extruded skill chips surrounding the core
    const chipGeo = new THREE.BoxGeometry(0.7, 0.1, 0.35);
    const chipCoords = [
      { x: -1.4, z: -1.2 }, { x: 1.4, z: -1.2 },
      { x: -1.6, z: 0.0 },  { x: 1.6, z: 0.0 },
      { x: -1.4, z: 1.2 },  { x: 1.4, z: 1.2 },
    ];
    this.skillChips = [];
    chipCoords.forEach((coord) => {
      const chip = new THREE.Mesh(chipGeo, this.materials.chipMat);
      chip.position.set(coord.x, 0, coord.z);
      this.coreLayerGroup.add(chip);
      this.skillChips.push(chip);
    });

    // ── 3. LAYER 3: BASE LAYER (ATS VALIDATION GRID & INSTANCED NODES) ──
    this.baseLayerGroup = new THREE.Group();
    this.masterAssembly.add(this.baseLayerGroup);

    // Technical grid helper plane
    const gridHelper = new THREE.GridHelper(5.5, 16, 0x00e5ff, 0x24242e);
    gridHelper.position.y = -0.05;
    this.baseLayerGroup.add(gridHelper);

    // InstancedMesh: 25 connection node spheres at grid intersections
    const nodeCount = 25;
    const nodeGeo = new THREE.SphereGeometry(0.08, 12, 12);
    this.instancedNodes = new THREE.InstancedMesh(nodeGeo, this.materials.nodeMat, nodeCount);
    
    const dummy = new THREE.Object3D();
    let idx = 0;
    for (let x = -2; x <= 2; x++) {
      for (let z = -2; z <= 2; z++) {
        dummy.position.set(x * 1.0, 0, z * 1.0);
        dummy.updateMatrix();
        this.instancedNodes.setMatrixAt(idx++, dummy.matrix);
      }
    }
    this.instancedNodes.instanceMatrix.needsUpdate = true;
    this.baseLayerGroup.add(this.instancedNodes);

    // Set initial layer rest positions on Y
    this.topShellGroup.position.y = 0.5;
    this.coreLayerGroup.position.y = 0;
    this.baseLayerGroup.position.y = -0.5;
  }

  /**
   * Initializes OrbitControls for 360° exploration.
   */
  initOrbitControls() {
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 3.5;
    this.controls.maxDistance = 18;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.1;
    this.controls.enabled = false; // Disabled by default until Orbit Mode is toggled
  }

  /**
   * Toggles between Scroll-driven storytelling and 360° free Orbit mode.
   * @param {boolean} enable - True enables orbit controls; false restores scroll camera
   */
  setOrbitMode(enable) {
    this.isOrbitMode = enable;
    this.controls.enabled = enable;

    if (enable) {
      this.canvas.style.pointerEvents = 'auto';
    } else {
      this.canvas.style.pointerEvents = 'none';
      // Smoothly re-anchor camera to default presentation perspective
      this.camera.position.copy(this.defaultCameraPos);
      this.camera.lookAt(0, 0, 0);
      this.controls.reset();
    }
  }

  /**
   * Adapts 3D scene lighting, fog, and materials for Dark vs Light/White theme.
   * @param {string} theme - 'dark' | 'light'
   */
  setTheme(theme) {
    const isLight = theme === 'light';
    if (this.scene && this.scene.fog) {
      this.scene.fog.color.setHex(isLight ? 0xf8fafc : 0x08080a);
    }
    if (this.ambientLight) {
      this.ambientLight.intensity = isLight ? 1.0 : 0.6;
    }
    if (this.materials) {
      if (this.materials.cyanWire) {
        this.materials.cyanWire.color.setHex(isLight ? 0x0284c7 : 0x00e5ff);
      }
      if (this.materials.headerGlass) {
        this.materials.headerGlass.color.setHex(isLight ? 0xffffff : 0x141419);
        this.materials.headerGlass.opacity = isLight ? 0.95 : 0.8;
      }
      if (this.materials.nodeMat) {
        this.materials.nodeMat.color.setHex(isLight ? 0x0284c7 : 0x00e5ff);
        this.materials.nodeMat.emissive.setHex(isLight ? 0x0284c7 : 0x00e5ff);
      }
      if (this.materials.chipMat) {
        this.materials.chipMat.color.setHex(isLight ? 0xe2e8f0 : 0x1e202b);
      }
    }
  }

  /**
   * Core Exploded View mapper: updates translation and rotation of layers based on scroll progress (0 to 1).
   * @param {number} progress - Scroll normalized progress from 0.0 to 1.0
   */
  setExplosionProgress(progress) {
    this.explosionProgress = Math.max(0, Math.min(1, progress));

    // Layer 1: Top Shell explodes upward and forward
    this.topShellGroup.position.y = 0.5 + this.explosionProgress * 3.4;
    this.topShellGroup.position.z = this.explosionProgress * 1.2;
    this.topShellGroup.rotation.x = this.explosionProgress * 0.15;
    this.topShellGroup.rotation.y = this.explosionProgress * 0.25;

    // Layer 2: Core expands and stays centered
    this.coreLayerGroup.position.y = this.explosionProgress * 0.2;
    this.coreLayerGroup.rotation.y = this.explosionProgress * Math.PI * 0.5;

    // Radiate skill chips outward
    this.skillChips.forEach((chip, i) => {
      const dir = i % 2 === 0 ? -1 : 1;
      chip.position.x = (1.4 + this.explosionProgress * 0.9) * dir;
    });

    // Layer 3: Base Grid explodes downward and backward
    this.baseLayerGroup.position.y = -0.5 - this.explosionProgress * 3.0;
    this.baseLayerGroup.position.z = -this.explosionProgress * 1.0;
    this.baseLayerGroup.rotation.x = -this.explosionProgress * 0.1;

    // Boost emissive intensity during exploded view
    this.materials.mintEmissive.emissiveIntensity = 0.8 + this.explosionProgress * 1.6;
    this.corePointLight.intensity = 3.5 + this.explosionProgress * 4.0;
  }

  /**
   * Computes 2D viewport coordinates for screen-space floating hotspots.
   * @returns {Object} Hotspot positions in pixel coordinates { x, y, visible }
   */
  getProjectedHotspots() {
    const projected = {};
    const tempVec = new THREE.Vector3();

    // Map each anchor vector through the camera projection matrix
    for (const [key, localPos] of Object.entries(this.hotspotAnchors)) {
      tempVec.copy(localPos);

      // Apply exploded transformation offsets to anchors
      if (key === 'verbs') {
        tempVec.y += this.topShellGroup.position.y;
        tempVec.z += this.topShellGroup.position.z;
      } else if (key === 'skills' || key === 'ats') {
        tempVec.y += this.coreLayerGroup.position.y;
      } else if (key === 'matrix') {
        tempVec.y += this.baseLayerGroup.position.y;
        tempVec.z += this.baseLayerGroup.position.z;
      }

      tempVec.project(this.camera);

      // Convert Normalized Device Coordinates (-1 to +1) to CSS pixels
      const x = (tempVec.x * 0.5 + 0.5) * this.width;
      const y = (-(tempVec.y * 0.5) + 0.5) * this.height;
      const visible = tempVec.z < 1.0; // In front of near/far plane

      projected[key] = { x, y, visible };
    }

    return projected;
  }

  /**
   * Main requestAnimationFrame render loop.
   */
  startRenderLoop() {
    const render = () => {
      this.animationFrameId = requestAnimationFrame(render);

      // Throttle rendering if canvas is not in viewport
      if (!this.isIntersecting) return;

      const delta = this.clock.getDelta();
      const elapsed = this.clock.getElapsedTime();

      // Controls update when in Orbit Mode
      if (this.isOrbitMode) {
        this.controls.update();
      } else {
        // Idle gentle bobbing and breathing rotation
        this.masterAssembly.rotation.y = Math.sin(elapsed * 0.5) * 0.15;
        this.masterAssembly.position.y = Math.sin(elapsed * 1.2) * 0.08;
      }

      // Continuous rotation of central Score Engine components
      if (this.scoreTorus) {
        this.scoreTorus.rotation.z += delta * 1.2;
      }
      if (this.scoreIco) {
        this.scoreIco.rotation.x += delta * 0.8;
        this.scoreIco.rotation.y += delta * 1.0;
      }

      this.renderer.render(this.scene, this.camera);
    };

    render();
  }

  /**
   * Throttles render loop when container scrolls out of view.
   */
  initVisibilityObserver() {
    const observer = new IntersectionObserver(([entry]) => {
      this.isIntersecting = entry.isIntersecting;
    }, { threshold: 0.05 });

    observer.observe(this.canvas);
  }

  /**
   * Debounced resize listener preventing aspect ratio stretching.
   */
  initResizeListener() {
    let timeout;
    window.addEventListener('resize', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      }, 150);
    });
  }

  /**
   * Complete memory cleanup and resource disposal on teardown.
   */
  destroy() {
    cancelAnimationFrame(this.animationFrameId);
    this.renderer.dispose();
    Object.values(this.materials).forEach(mat => mat.dispose());
  }
}
