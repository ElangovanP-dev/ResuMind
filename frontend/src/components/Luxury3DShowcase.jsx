import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Available Color Variants for the Body & Trim
const COLOR_VARIANTS = [
  { id: 'stealth', name: 'Obsidian Stealth', hex: '#111215', metalness: 0.9, roughness: 0.25, accent: '#06b6d4' },
  { id: 'violet', name: 'Electric Violet', hex: '#4f46e5', metalness: 0.85, roughness: 0.2, accent: '#818cf8' },
  { id: 'silver', name: 'Liquid Titanium', hex: '#d1d5db', metalness: 0.98, roughness: 0.12, accent: '#38bdf8' },
  { id: 'emerald', name: 'Apex Emerald', hex: '#059669', metalness: 0.88, roughness: 0.22, accent: '#34d399' },
]

export default function Luxury3DShowcase({ modelUrl = null }) {
  const containerRef = useRef(null)
  const canvasWrapperRef = useRef(null)
  const pinSectionRef = useRef(null)

  // Interactive UI State
  const [activeVariant, setActiveVariant] = useState(COLOR_VARIANTS[0])
  const [isOrbitMode, setIsOrbitMode] = useState(false)
  const [activeHotspot, setActiveHotspot] = useState(null)
  const [activeStoryIndex, setActiveStoryIndex] = useState(0)
  const [hotspotPositions2D, setHotspotPositions2D] = useState([])

  // Engine references
  const threeRef = useRef({
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    assembly: null,
    components: {
      bodyShell: null,
      chassis: null,
      batteryPack: null,
      frontMotor: null,
      rearMotor: null,
      wheels: [],
      aerokit: null,
    },
    materials: {
      body: null,
      chassis: null,
      battery: null,
      motor: null,
      glass: null,
      caliper: null,
      glow: null,
    },
    hotspotObjects: [],
    timeline: null,
    animationFrameId: null,
  })

  // ── HOTSPOT DEFINITIONS (Anchored in 3D Space) ──
  const hotspotsData = [
    {
      id: 'body',
      title: 'Aerodynamic Monocoque',
      targetMesh: 'bodyShell',
      localPos: new THREE.Vector3(0, 1.8, 0.4),
      spec: 'Cd 0.21 Drag Coeff · Carbon Fiber Composite Structure',
      details: 'Ultra-lightweight multi-layer carbon fabric with autoclaved epoxy resin for maximum structural stiffness.'
    },
    {
      id: 'battery',
      title: 'Structural Solid-State Battery',
      targetMesh: 'batteryPack',
      localPos: new THREE.Vector3(0, 0.2, 0),
      spec: '105 kWh · 800V DC Architecture · 620 km WLTP',
      details: 'Sub-floor integrated battery block with bidirectional liquid micro-channel cooling and 10-minute ultra-fast charge.'
    },
    {
      id: 'motor',
      title: 'Dual Permanent-Magnet Motors',
      targetMesh: 'rearMotor',
      localPos: new THREE.Vector3(0, 0.8, -1.8),
      spec: '536 HP (400 kW) · 795 Nm · 0–100 in 3.3s',
      details: 'High-torque hairpin-wound stator with silicon carbide inverters capable of 22,000 RPM continuous redline.'
    },
    {
      id: 'chassis',
      title: 'Titanium-Alloy Spaceframe',
      targetMesh: 'chassis',
      localPos: new THREE.Vector3(0, 0.9, 0.8),
      spec: '48,000 Nm/deg Torsional Rigidity · 50:50 Weight Distribution',
      details: 'Extruded aluminum and hot-formed boron steel subframes engineered for surgical cornering precision.'
    }
  ]

  // ── 1. INITIALIZE THREE.JS SCENE ──
  useEffect(() => {
    const wrapper = canvasWrapperRef.current
    if (!wrapper) return

    const width = wrapper.clientWidth
    const height = wrapper.clientHeight

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a0c)
    scene.fog = new THREE.FogExp2(0x0a0a0c, 0.02)
    threeRef.current.scene = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100)
    camera.position.set(6, 4.5, 8.5)
    camera.lookAt(0, 1, 0)
    threeRef.current.camera = camera

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    wrapper.innerHTML = ''
    wrapper.appendChild(renderer.domElement)
    threeRef.current.renderer = renderer

    // OrbitControls for 360° Exploration Mode
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.maxDistance = 22
    controls.minDistance = 3.5
    controls.maxPolarAngle = Math.PI / 2 - 0.02 // Prevent going below floor
    controls.enabled = false
    threeRef.current.controls = controls

    // ── STUDIO AUTOMOTIVE LIGHTING RIG ──
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    // Key Light
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2)
    keyLight.position.set(12, 18, 10)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048
    keyLight.shadow.mapSize.height = 2048
    keyLight.shadow.bias = -0.0001
    scene.add(keyLight)

    // Cyan Fill Light
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.2)
    fillLight.position.set(-14, 8, -10)
    scene.add(fillLight)

    // Electric Violet Rim Light
    const rimLight = new THREE.DirectionalLight(0x818cf8, 1.6)
    rimLight.position.set(0, 15, -16)
    scene.add(rimLight)

    // Subtle Ground Glow
    const floorGlow = new THREE.PointLight(0x06b6d4, 1.5, 25)
    floorGlow.position.set(0, 0.2, 0)
    scene.add(floorGlow)

    // ── GROUND REFLECTIVE STUDIO FLOOR ──
    const floorGeo = new THREE.PlaneGeometry(60, 60)
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x08080a,
      roughness: 0.15,
      metalness: 0.8,
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    scene.add(floor)

    // Circular Technical Grid Floor Ring
    const ringGeo = new THREE.RingGeometry(3.5, 3.6, 64)
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x1f1f28, side: THREE.DoubleSide })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.01
    scene.add(ring)

    const outerRing = new THREE.Mesh(
      new THREE.RingGeometry(6.2, 6.25, 64),
      new THREE.MeshBasicMaterial({ color: 0x181920, side: THREE.DoubleSide })
    )
    outerRing.rotation.x = -Math.PI / 2
    outerRing.position.y = 0.01
    scene.add(outerRing)

    // ── SHARED MATERIALS ──
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(COLOR_VARIANTS[0].hex),
      metalness: COLOR_VARIANTS[0].metalness,
      roughness: COLOR_VARIANTS[0].roughness,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
    })
    threeRef.current.materials.body = bodyMat

    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x1f2430,
      metalness: 0.9,
      roughness: 0.35,
    })
    threeRef.current.materials.chassis = chassisMat

    const batteryMat = new THREE.MeshStandardMaterial({
      color: 0x181b22,
      metalness: 0.8,
      roughness: 0.2,
    })
    threeRef.current.materials.battery = batteryMat

    const motorMat = new THREE.MeshStandardMaterial({
      color: 0x0e1117,
      metalness: 0.95,
      roughness: 0.15,
    })
    threeRef.current.materials.motor = motorMat

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0a0c10,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.9,
      ior: 1.5,
      transparent: true,
      opacity: 0.4,
    })
    threeRef.current.materials.glass = glassMat

    const caliperMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 })
    threeRef.current.materials.caliper = caliperMat

    // ── 2. MODEL ASSEMBLY GENERATOR (PROCEDURAL LUXURY EV CHASSIS) ──
    const assemblyGroup = new THREE.Group()
    scene.add(assemblyGroup)
    threeRef.current.assembly = assemblyGroup

    // Helper: Build High-End Procedural Assembly
    const buildProceduralShowcase = () => {
      // 1. CHASSIS SPACEFRAME (Lower Core)
      const chassisGroup = new THREE.Group()
      const mainFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.3, 5.2), chassisMat)
      mainFrame.position.y = 0.55
      mainFrame.castShadow = true
      mainFrame.receiveShadow = true
      chassisGroup.add(mainFrame)

      // Longitudinal side sills
      const sillLeft = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 5.4), chassisMat)
      sillLeft.position.set(-1.25, 0.6, 0)
      const sillRight = sillLeft.clone()
      sillRight.position.x = 1.25
      chassisGroup.add(sillLeft, sillRight)

      assemblyGroup.add(chassisGroup)
      threeRef.current.components.chassis = chassisGroup

      // 2. STRUCTURAL SOLID-STATE BATTERY PACK (Flat underbody floor block)
      const batteryGroup = new THREE.Group()
      const batteryCasing = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.22, 3.4), batteryMat)
      batteryCasing.position.set(0, 0.35, 0)
      batteryCasing.castShadow = true
      batteryGroup.add(batteryCasing)

      // Cell array cooling ribs
      const ribMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 })
      for (let z = -1.4; z <= 1.4; z += 0.4) {
        const rib = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.04, 0.1), ribMat)
        rib.position.set(0, 0.48, z)
        batteryGroup.add(rib)
      }
      assemblyGroup.add(batteryGroup)
      threeRef.current.components.batteryPack = batteryGroup

      // 3. FRONT MOTOR DRIVE UNIT
      const frontMotorGroup = new THREE.Group()
      const fMotorMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.2, 24), motorMat)
      fMotorMesh.rotation.z = Math.PI / 2
      fMotorMesh.position.set(0, 0.55, 1.8)
      fMotorMesh.castShadow = true
      frontMotorGroup.add(fMotorMesh)
      assemblyGroup.add(frontMotorGroup)
      threeRef.current.components.frontMotor = frontMotorGroup

      // 4. REAR DUAL MOTOR UNIT & INVERTER
      const rearMotorGroup = new THREE.Group()
      const rMotorMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 1.4, 24), motorMat)
      rMotorMesh.rotation.z = Math.PI / 2
      rMotorMesh.position.set(0, 0.6, -1.8)
      rMotorMesh.castShadow = true
      rearMotorGroup.add(rMotorMesh)

      const inverter = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.35, 0.8), chassisMat)
      inverter.position.set(0, 0.95, -1.8)
      rearMotorGroup.add(inverter)
      assemblyGroup.add(rearMotorGroup)
      threeRef.current.components.rearMotor = rearMotorGroup

      // 5. WHEELS & BRAKE ASSEMBLIES (4 Corners)
      const wheelPositions = [
        { x: -1.35, z: 1.8, isFront: true },
        { x: 1.35, z: 1.8, isFront: true },
        { x: -1.35, z: -1.8, isFront: false },
        { x: 1.35, z: -1.8, isFront: false },
      ]

      const wheelGroupList = []
      const tireGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.42, 32)
      tireGeo.rotateZ(Math.PI / 2)
      const tireMat = new THREE.MeshStandardMaterial({ color: 0x13151b, roughness: 0.8 })

      const rimGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.43, 16)
      rimGeo.rotateZ(Math.PI / 2)
      const rimMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 })

      const discGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.06, 24)
      discGeo.rotateZ(Math.PI / 2)
      const discMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.95, roughness: 0.1 })

      const caliperGeo = new THREE.BoxGeometry(0.12, 0.22, 0.16)

      wheelPositions.forEach((pos) => {
        const wGroup = new THREE.Group()
        wGroup.position.set(pos.x, 0.55, pos.z)

        const tire = new THREE.Mesh(tireGeo, tireMat)
        tire.castShadow = true
        wGroup.add(tire)

        const rim = new THREE.Mesh(rimGeo, rimMat)
        wGroup.add(rim)

        const disc = new THREE.Mesh(discGeo, discMat)
        disc.position.x = pos.x > 0 ? -0.1 : 0.1
        wGroup.add(disc)

        const caliper = new THREE.Mesh(caliperGeo, caliperMat)
        caliper.position.set(pos.x > 0 ? -0.1 : 0.1, 0.18, 0.18)
        wGroup.add(caliper)

        assemblyGroup.add(wGroup)
        wheelGroupList.push(wGroup)
      })
      threeRef.current.components.wheels = wheelGroupList

      // 6. SCULPTED BODY SHELL & CABIN (Top Level Outer Shell)
      const bodyGroup = new THREE.Group()

      // Lower Body Silhouette
      const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.7, 5.0), bodyMat)
      lowerBody.position.set(0, 0.95, 0)
      lowerBody.castShadow = true
      bodyGroup.add(lowerBody)

      // Aerodynamic Tapered Cabin Glass Canopy
      const greenhouse = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.65, 2.6), glassMat)
      greenhouse.position.set(0, 1.55, -0.2)
      greenhouse.castShadow = true
      bodyGroup.add(greenhouse)

      // Hood Slope
      const hood = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.2, 1.4), bodyMat)
      hood.position.set(0, 1.15, 1.6)
      hood.rotation.x = 0.12
      hood.castShadow = true
      bodyGroup.add(hood)

      // Fastback Rear Roof
      const roof = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.15, 1.8), bodyMat)
      roof.position.set(0, 1.9, -0.4)
      bodyGroup.add(roof)

      // Front Matrix LED Lightbar
      const lightbarGeo = new THREE.BoxGeometry(2.0, 0.08, 0.1)
      const lightbarMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      const frontLight = new THREE.Mesh(lightbarGeo, lightbarMat)
      frontLight.position.set(0, 0.95, 2.52)
      bodyGroup.add(frontLight)

      // Rear Neon Tail Lightstrip
      const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 })
      const tailLight = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.08, 0.1), tailLightMat)
      tailLight.position.set(0, 1.1, -2.52)
      bodyGroup.add(tailLight)

      assemblyGroup.add(bodyGroup)
      threeRef.current.components.bodyShell = bodyGroup

      // 7. ACTIVE AERO CARBON DIFFUSER & SPOILER
      const aeroGroup = new THREE.Group()
      const spoiler = new THREE.Mesh(
        new THREE.BoxGeometry(2.1, 0.08, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x0f1117, metalness: 0.9, roughness: 0.2 })
      )
      spoiler.position.set(0, 1.65, -2.4)
      aeroGroup.add(spoiler)

      const diffuser = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 0.25, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x0a0c10, metalness: 0.8, roughness: 0.3 })
      )
      diffuser.position.set(0, 0.3, -2.5)
      aeroGroup.add(diffuser)

      assemblyGroup.add(aeroGroup)
      threeRef.current.components.aerokit = aeroGroup
    }

    // Optional GLTF Loader with seamless procedural fallback
    if (modelUrl) {
      const loader = new GLTFLoader()
      loader.load(
        modelUrl,
        (gltf) => {
          assemblyGroup.add(gltf.scene)
        },
        undefined,
        () => {
          // Fallback to procedural showcase
          buildProceduralShowcase()
        }
      )
    } else {
      buildProceduralShowcase()
    }

    // ── 3. GSAP SCROLLTRIGGER EXPLODED VIEW PINNED TIMELINE ──
    const comp = threeRef.current.components
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: pinSectionRef.current,
        start: 'top top',
        end: '+=350%',
        pin: true,
        scrub: 1.2,
        onUpdate: (self) => {
          // Calculate active story card index based on progress
          const p = self.progress
          if (p < 0.25) setActiveStoryIndex(0)
          else if (p < 0.5) setActiveStoryIndex(1)
          else if (p < 0.75) setActiveStoryIndex(2)
          else setActiveStoryIndex(3)
        },
      },
    })
    threeRef.current.timeline = tl

    // Phase 1: Camera Orbit Setup & Initial Reveal (0% -> 25%)
    tl.to(camera.position, { x: 7.5, y: 5.2, z: 7.5, duration: 1, ease: 'power1.inOut' }, 0)
    tl.to(assemblyGroup.rotation, { y: Math.PI * 0.25, duration: 1, ease: 'none' }, 0)

    // Phase 2: Body Shell & Aero Elevation (Explode Upwards) (25% -> 60%)
    tl.to(comp.bodyShell.position, { y: 2.8, duration: 1.2, ease: 'power2.out' }, 0.8)
    tl.to(comp.aerokit.position, { y: 2.5, z: -0.6, duration: 1.2, ease: 'power2.out' }, 0.8)

    // Phase 3: Battery Pack Drops Downward & Forward (Subfloor Extraction) (40% -> 80%)
    tl.to(comp.batteryPack.position, { y: -1.2, z: 0.6, duration: 1.2, ease: 'power2.out' }, 1.2)

    // Phase 4: Motors Dissect Axially (Front / Rear Spread) (60% -> 100%)
    tl.to(comp.frontMotor.position, { z: 2.9, y: 0.7, duration: 1.2, ease: 'power2.out' }, 1.6)
    tl.to(comp.rearMotor.position, { z: -3.0, y: 0.9, duration: 1.2, ease: 'power2.out' }, 1.6)

    // Wheels Spaced Outward (Lateral Suspension Expansion)
    comp.wheels.forEach((w, idx) => {
      const isLeft = idx % 2 === 0
      tl.to(w.position, { x: isLeft ? -2.2 : 2.2, duration: 1.2, ease: 'power2.out' }, 1.6)
    })

    // Cinematic Camera Fly-by to Final Exploded Perspective
    tl.to(camera.position, { x: 8.5, y: 6.8, z: 5.5, duration: 1.5, ease: 'power1.inOut' }, 1.4)
    tl.to(assemblyGroup.rotation, { y: Math.PI * 0.75, duration: 2, ease: 'none' }, 1.0)

    // ── 4. RENDER LOOP WITH 3D -> 2D HOTSPOT PROJECTION ──
    const tempVec = new THREE.Vector3()

    const animate = () => {
      threeRef.current.animationFrameId = requestAnimationFrame(animate)

      if (controls.enabled) {
        controls.update()
      } else {
        // Subtle ambient breathing float in scroll mode
        const t = performance.now() * 0.001
        assemblyGroup.position.y = Math.sin(t * 1.5) * 0.04
      }

      // Project 3D Hotspot Coordinates to 2D Screen Overlay
      const newHotspots = hotspotsData.map((hs) => {
        const meshGroup = threeRef.current.components[hs.targetMesh]
        if (meshGroup) {
          tempVec.copy(hs.localPos)
          meshGroup.localToWorld(tempVec)
          tempVec.project(camera)

          // Convert normalized device coordinates (-1 to 1) to CSS pixels (%)
          const x = (tempVec.x * 0.5 + 0.5) * 100
          const y = (-(tempVec.y * 0.5) + 0.5) * 100
          const isVisible = tempVec.z < 1.0 // in front of camera frustum
          return { ...hs, screenX: x, screenY: y, isVisible }
        }
        return null
      }).filter(Boolean)

      setHotspotPositions2D(newHotspots)
      renderer.render(scene, camera)
    }

    animate()

    // ── 5. RESIZE HANDLER ──
    const handleResize = () => {
      if (!wrapper) return
      const w = wrapper.clientWidth
      const h = wrapper.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      ScrollTrigger.refresh()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(threeRef.current.animationFrameId)
      window.removeEventListener('resize', handleResize)
      if (threeRef.current.timeline) threeRef.current.timeline.kill()
      ScrollTrigger.getAll().forEach((st) => st.kill())
      renderer.dispose()
    }
  }, [modelUrl])

  // ── DYNAMIC COLOR & FINISH VARIANT UPDATER ──
  const handleVariantChange = useCallback((variant) => {
    setActiveVariant(variant)
    const bodyMat = threeRef.current.materials.body
    const caliperMat = threeRef.current.materials.caliper
    if (!bodyMat) return

    gsap.to(bodyMat.color, {
      r: new THREE.Color(variant.hex).r,
      g: new THREE.Color(variant.hex).g,
      b: new THREE.Color(variant.hex).b,
      duration: 0.6,
      ease: 'power2.out',
    })
    bodyMat.metalness = variant.metalness
    bodyMat.roughness = variant.roughness

    if (caliperMat) {
      caliperMat.color.set(variant.accent)
    }
  }, [])

  // ── TOGGLE 360° ORBIT MODE VS SCROLL MODE ──
  const toggleOrbitMode = () => {
    const controls = threeRef.current.controls
    if (!controls) return
    const newState = !isOrbitMode
    setIsOrbitMode(newState)
    controls.enabled = newState

    if (!newState) {
      // Re-anchor camera to standard scroll frame
      gsap.to(threeRef.current.camera.position, {
        x: 6,
        y: 4.5,
        z: 8.5,
        duration: 0.8,
        ease: 'power2.out',
      })
    }
  }

  const storySections = [
    {
      step: '01 / 04',
      title: 'AERODYNAMIC MONOCOQUE',
      subtitle: 'Pure Form Follows Frictionless Function',
      desc: 'Sculpted continuous carbon composite bodywork engineered with fluid-dynamic micro-flaps to achieve an ultra-low drag coefficient of Cd 0.21.',
      kpis: [{ val: 'Cd 0.21', lbl: 'Aero Coeff' }, { val: '-38%', lbl: 'Turbulence' }, { val: '48k Nm', lbl: 'Rigidity' }]
    },
    {
      step: '02 / 04',
      title: 'TITANIUM SPACEFRAME',
      subtitle: 'Torsional Mastery & Chassis Architecture',
      desc: 'Extruded high-tensile boron subframes and central carbon tunnel forming an impenetrable safety cell with a pristine 50:50 axle weight distribution.',
      kpis: [{ val: '50:50', lbl: 'Weight Ratio' }, { val: '1,780 kg', lbl: 'Kerb Weight' }, { val: '100%', lbl: 'Recyclable' }]
    },
    {
      step: '03 / 04',
      title: 'DUAL ELECTRIC MOTORS',
      subtitle: 'Instant Torque Vectoring Across All Axles',
      desc: 'Hairpin-wound permanent magnet synchronous motors deliver 536 horsepower and 795 Nm of instantaneous torque, managed by silicon-carbide pulse inverters.',
      kpis: [{ val: '536 HP', lbl: 'Peak Output' }, { val: '3.3s', lbl: '0–100 km/h' }, { val: '22,000', lbl: 'RPM Ceiling' }]
    },
    {
      step: '04 / 04',
      title: 'STRUCTURAL SOLID-STATE BATTERY',
      subtitle: 'Cell-To-Chassis Energy Density',
      desc: 'Next-generation 105 kWh solid-state structural pack integrated seamlessly into the floorpan with dual bidirectional cooling ribbons and 800V architecture.',
      kpis: [{ val: '105 kWh', lbl: 'Capacity' }, { val: '620 km', lbl: 'WLTP Range' }, { val: '10 min', lbl: '10-80% Charge' }]
    }
  ]

  const curStory = storySections[activeStoryIndex]

  return (
    <div ref={containerRef} className="relative w-full bg-[#0a0a0c] text-slate-100 overflow-hidden">

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          PINNED SCROLL CONTAINER (100VW, 100VH)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div ref={pinSectionRef} className="relative w-full h-screen overflow-hidden flex items-center justify-center">

        {/* ── THREE.JS WEBGL CANVAS VIEWPORT ── */}
        <div ref={canvasWrapperRef} className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing" />

        {/* ── TOP HUD HEADER OVERLAY ── */}
        <div className="absolute top-0 left-0 right-0 z-20 px-6 py-6 flex items-center justify-between pointer-events-none">
          {/* Brand Spec Badge */}
          <div className="pointer-events-auto flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-cyan-400 to-emerald-400 p-[1px] shadow-lg shadow-cyan-500/10">
              <div className="w-full h-full bg-[#0a0a0c] rounded-[11px] flex items-center justify-center font-mono font-black text-sm text-cyan-400">
                GT
              </div>
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase block">
                EXECUTIVE SPECIFICATION · PROTOTYPE 01
              </span>
              <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                AERO EXPLODED 3D ARCHITECTURE
              </h3>
            </div>
          </div>

          {/* 360° Orbit Mode Toggle Button */}
          <div className="pointer-events-auto flex items-center gap-3">
            <button
              onClick={toggleOrbitMode}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all duration-300 border flex items-center gap-2 ${
                isOrbitMode
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-lg shadow-cyan-500/20'
                  : 'bg-[#14151c]/80 text-slate-300 border-white/10 hover:border-white/30 backdrop-blur-md'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOrbitMode ? 'bg-cyan-400 animate-ping' : 'bg-slate-400'}`} />
              {isOrbitMode ? '360° Free Orbit Active' : 'Enable 360° Orbit'}
            </button>
          </div>
        </div>

        {/* ── STORYTELLING OVERLAY PANEL (LEFT SIDE) ── */}
        <div className="absolute left-6 md:left-12 top-1/2 -translate-y-1/2 z-20 max-w-sm pointer-events-none">
          <div className="bg-[#0e1017]/85 border border-white/[0.08] p-6 rounded-2xl backdrop-blur-xl shadow-2xl pointer-events-auto space-y-4">
            <span className="text-[11px] font-mono text-cyan-400 tracking-widest uppercase font-bold block">
              {curStory.step} · EXPLODED ANALYSIS
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
              {curStory.title}
            </h2>
            <p className="text-xs text-cyan-200 font-medium tracking-wide">
              {curStory.subtitle}
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              {curStory.desc}
            </p>

            {/* Micro KPI Matrix */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/[0.08]">
              {curStory.kpis.map((kpi) => (
                <div key={kpi.lbl} className="text-center p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                  <p className="text-xs font-black text-white font-mono">{kpi.val}</p>
                  <p className="text-[9px] text-slate-400 uppercase mt-0.5">{kpi.lbl}</p>
                </div>
              ))}
            </div>

            <div className="text-[10px] text-slate-500 font-mono flex justify-between items-center pt-1">
              <span>Scroll down to separate components</span>
              <span className="text-cyan-400">GSAP Scrub</span>
            </div>
          </div>
        </div>

        {/* ── 3D PROJECTED INTERACTIVE HOTSPOT PINS ── */}
        <div className="absolute inset-0 z-15 pointer-events-none">
          {hotspotPositions2D.map((hs) => {
            if (!hs.isVisible) return null
            const isHovered = activeHotspot?.id === hs.id
            return (
              <div
                key={hs.id}
                style={{
                  position: 'absolute',
                  left: `${hs.screenX}%`,
                  top: `${hs.screenY}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="pointer-events-auto group cursor-pointer"
                onMouseEnter={() => setActiveHotspot(hs)}
                onMouseLeave={() => setActiveHotspot(null)}
                onClick={() => setActiveHotspot(activeHotspot?.id === hs.id ? null : hs)}
              >
                {/* Pulsing Pin Ring */}
                <div className="relative flex items-center justify-center">
                  <span className="absolute w-7 h-7 rounded-full bg-cyan-400/30 animate-ping" />
                  <span className="w-4 h-4 rounded-full bg-cyan-400 border-2 border-[#0a0a0c] shadow-lg shadow-cyan-400/80 flex items-center justify-center text-[8px] font-black text-black">
                    +
                  </span>
                </div>

                {/* Tech Spec Tooltip (Revealed on Hover/Click) */}
                {isHovered && (
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 w-64 bg-[#0d0f16]/95 border border-cyan-500/40 p-4 rounded-xl backdrop-blur-xl shadow-2xl z-30 space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                    <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-wider block">
                      TELEMETRY NODE
                    </span>
                    <h5 className="text-xs font-bold text-white tracking-tight">{hs.title}</h5>
                    <p className="text-[11px] font-mono text-emerald-400 font-semibold">{hs.spec}</p>
                    <p className="text-[10px] text-slate-300 leading-relaxed pt-1 border-t border-white/10">{hs.details}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── BOTTOM HUD FLOATING CONTROLS (COLOR SWITCHER & TIMELINE BAR) ── */}
        <div className="absolute bottom-6 left-6 right-6 z-20 flex flex-wrap items-center justify-between gap-4 pointer-events-none">

          {/* Color & Finish Variant Switcher */}
          <div className="pointer-events-auto bg-[#0d0f16]/85 border border-white/[0.08] px-4 py-2.5 rounded-2xl backdrop-blur-xl shadow-2xl flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Exterior Finish:</span>
            <div className="flex items-center gap-2">
              {COLOR_VARIANTS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleVariantChange(v)}
                  title={v.name}
                  className={`w-7 h-7 rounded-full transition-all duration-300 relative flex items-center justify-center ${
                    activeVariant.id === v.id
                      ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#0a0a0c] scale-110'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: v.hex, border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  {activeVariant.id === v.id && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  )}
                </button>
              ))}
            </div>
            <span className="text-xs font-mono font-medium text-slate-300 pl-1 border-l border-white/10">
              {activeVariant.name}
            </span>
          </div>

          {/* Story Progress Indicators */}
          <div className="pointer-events-auto bg-[#0d0f16]/85 border border-white/[0.08] px-5 py-2.5 rounded-2xl backdrop-blur-xl shadow-2xl flex items-center gap-2">
            {storySections.map((s, idx) => (
              <div
                key={s.step}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  activeStoryIndex === idx
                    ? 'w-8 bg-gradient-to-r from-indigo-500 to-cyan-400'
                    : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
