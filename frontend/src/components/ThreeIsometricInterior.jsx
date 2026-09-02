import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

export default function ThreeIsometricInterior() {
  const containerRef = useRef(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [marioIteration, setMarioIteration] = useState('cyber') // 'classic', 'cyber', 'gold'
  const [isExploded, setIsExploded] = useState(false)
  const [activeCameraAngle, setActiveCameraAngle] = useState('isometric') // 'isometric', 'top', 'front'
  const [jumpTrigger, setJumpTrigger] = useState(0)

  // Internal mutable refs for animation loop
  const sceneState = useRef({
    renderer: null,
    scene: null,
    camera: null,
    layers: {
      foundation: null,
      furniture: null,
      network: null,
      ceiling: null,
    },
    mario: null,
    marioLimbs: {},
    marioMaterials: {},
    particles: null,
    clock: new THREE.Clock(),
    targetExplosion: 0,
    currentExplosion: 0,
    targetMarioX: -4,
    currentMarioX: -4,
    marioJumping: false,
    marioJumpTime: 0,
    isHovering: false,
    mouseX: 0,
    mouseY: 0,
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight || 600

    // ── 1. SCENE SETUP ──
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0b0e)
    scene.fog = new THREE.FogExp2(0x0a0b0e, 0.015)
    sceneState.current.scene = scene

    // ── 2. ISOMETRIC CAMERA ──
    const aspect = width / height
    const d = 14
    const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000)
    camera.position.set(24, 26, 24)
    camera.lookAt(0, 2, 0)
    sceneState.current.camera = camera

    // ── 3. GPU-ACCELERATED WEBGL RENDERER ──
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true,
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    container.innerHTML = ''
    container.appendChild(renderer.domElement)
    sceneState.current.renderer = renderer

    // ── 4. LIGHTING ──
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
    scene.add(ambientLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4)
    dirLight.position.set(20, 40, 20)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 1024
    dirLight.shadow.mapSize.height = 1024
    dirLight.shadow.camera.near = 10
    dirLight.shadow.camera.far = 100
    const shadowD = 18
    dirLight.shadow.camera.left = -shadowD
    dirLight.shadow.camera.right = shadowD
    dirLight.shadow.camera.top = shadowD
    dirLight.shadow.camera.bottom = -shadowD
    scene.add(dirLight)

    // Cyber Cyan & Violet Accent Point Lights
    const cyanLight = new THREE.PointLight(0x06b6d4, 2.5, 30)
    cyanLight.position.set(-6, 4, -4)
    scene.add(cyanLight)

    const violetLight = new THREE.PointLight(0x6366f1, 2.8, 30)
    violetLight.position.set(6, 4, 6)
    scene.add(violetLight)

    // ── 5. LAYER GROUPS (FOR EXPLODED VIEW) ──
    const layerFoundation = new THREE.Group()
    const layerFurniture = new THREE.Group()
    const layerNetwork = new THREE.Group()
    const layerCeiling = new THREE.Group()

    scene.add(layerFoundation)
    scene.add(layerFurniture)
    scene.add(layerNetwork)
    scene.add(layerCeiling)

    sceneState.current.layers.foundation = layerFoundation
    sceneState.current.layers.furniture = layerFurniture
    sceneState.current.layers.network = layerNetwork
    sceneState.current.layers.ceiling = layerCeiling

    // ── 5A. FOUNDATION LAYER ──
    // Main Floor Slab
    const floorGeo = new THREE.BoxGeometry(22, 1, 22)
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111318,
      roughness: 0.35,
      metalness: 0.6,
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.position.y = -0.5
    floor.receiveShadow = true
    layerFoundation.add(floor)

    // Floor Grid Line Accents
    const gridHelper = new THREE.GridHelper(20, 20, 0x6366f1, 0x1e222e)
    gridHelper.position.y = 0.02
    layerFoundation.add(gridHelper)

    // Glowing Inset Power Channels
    const channelGeo = new THREE.PlaneGeometry(18, 0.4)
    channelGeo.rotateX(-Math.PI / 2)
    const channelMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.8,
    })
    const channel1 = new THREE.Mesh(channelGeo, channelMat)
    channel1.position.set(0, 0.03, -2)
    layerFoundation.add(channel1)

    const channel2 = new THREE.Mesh(channelGeo, channelMat)
    channel2.rotation.y = Math.PI / 2
    channel2.position.set(-2, 0.03, 0)
    layerFoundation.add(channel2)

    // ── 5B. FURNITURE & WORKSPACE LAYER ──
    // Server Rack Matrix (Left Rear)
    const serverRackGeo = new THREE.BoxGeometry(1.6, 5, 2.5)
    const serverRackMat = new THREE.MeshStandardMaterial({
      color: 0x0c0e14,
      roughness: 0.2,
      metalness: 0.8,
    })

    const ledMatCyan = new THREE.MeshBasicMaterial({ color: 0x06b6d4 })
    const ledMatViolet = new THREE.MeshBasicMaterial({ color: 0x8b5cf6 })
    const ledMatEmerald = new THREE.MeshBasicMaterial({ color: 0x10b981 })

    for (let i = 0; i < 3; i++) {
      const rack = new THREE.Mesh(serverRackGeo, serverRackMat)
      rack.position.set(-8 + i * 2.2, 2.5, -7.5)
      rack.castShadow = true
      rack.receiveShadow = true
      layerFurniture.add(rack)

      // Blinking status LEDs on each rack
      for (let j = 0; j < 8; j++) {
        const led = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 0.08, 0.08),
          j % 3 === 0 ? ledMatCyan : j % 3 === 1 ? ledMatViolet : ledMatEmerald
        )
        led.position.set(-8 + i * 2.2, 0.8 + j * 0.5, -6.2)
        layerFurniture.add(led)
      }
    }

    // Workstation Desks (Center)
    const deskGeo = new THREE.BoxGeometry(4, 1.4, 2)
    const deskMat = new THREE.MeshStandardMaterial({
      color: 0x181b24,
      roughness: 0.4,
      metalness: 0.4,
    })

    const monitorGeo = new THREE.BoxGeometry(1.8, 1.1, 0.1)
    const monitorMat = new THREE.MeshStandardMaterial({ color: 0x07090e })
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 })

    const deskCoords = [
      { x: -3, z: 1 },
      { x: 3, z: 1 },
      { x: -3, z: 5 },
      { x: 3, z: 5 },
    ]

    deskCoords.forEach((pos) => {
      const desk = new THREE.Mesh(deskGeo, deskMat)
      desk.position.set(pos.x, 0.7, pos.z)
      desk.castShadow = true
      desk.receiveShadow = true
      layerFurniture.add(desk)

      // Dual Monitors
      const monLeft = new THREE.Mesh(monitorGeo, monitorMat)
      monLeft.position.set(pos.x - 0.9, 1.9, pos.z - 0.4)
      monLeft.rotation.y = 0.15
      layerFurniture.add(monLeft)

      const screenLeft = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.9), screenMat)
      screenLeft.position.set(pos.x - 0.9, 1.9, pos.z - 0.34)
      screenLeft.rotation.y = 0.15
      layerFurniture.add(screenLeft)

      const monRight = new THREE.Mesh(monitorGeo, monitorMat)
      monRight.position.set(pos.x + 0.9, 1.9, pos.z - 0.4)
      monRight.rotation.y = -0.15
      layerFurniture.add(monRight)

      const screenRight = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.9), screenMat)
      screenRight.position.set(pos.x + 0.9, 1.9, pos.z - 0.34)
      screenRight.rotation.y = -0.15
      layerFurniture.add(screenRight)

      // Chair
      const chairSeat = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, 0.15, 16),
        new THREE.MeshStandardMaterial({ color: 0x4f46e5 })
      )
      chairSeat.position.set(pos.x, 0.7, pos.z + 1.6)
      layerFurniture.add(chairSeat)
    })

    // Glass Partition Walls
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x6366f1,
      transparent: true,
      opacity: 0.25,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.8,
      ior: 1.5,
    })
    const glassWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.5, 14), glassMat)
    glassWall.position.set(7.5, 2.25, 0)
    layerFurniture.add(glassWall)

    // ── 5C. HOLOGRAPHIC DATA NETWORK LAYER ──
    const tubeCurve1 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-7, 2, -6),
      new THREE.Vector3(-3, 3.5, -2),
      new THREE.Vector3(-3, 1.8, 1),
    ])
    const tubeGeo1 = new THREE.TubeGeometry(tubeCurve1, 32, 0.08, 8, false)
    const tubeMat1 = new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: false })
    const dataStream1 = new THREE.Mesh(tubeGeo1, tubeMat1)
    layerNetwork.add(dataStream1)

    const tubeCurve2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-5, 2, -6),
      new THREE.Vector3(0, 4.2, 0),
      new THREE.Vector3(3, 1.8, 1),
    ])
    const tubeGeo2 = new THREE.TubeGeometry(tubeCurve2, 32, 0.08, 8, false)
    const tubeMat2 = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, wireframe: false })
    const dataStream2 = new THREE.Mesh(tubeGeo2, tubeMat2)
    layerNetwork.add(dataStream2)

    // Floating Hologram Disc
    const holoDisc = new THREE.Mesh(
      new THREE.RingGeometry(1.2, 1.5, 32),
      new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide })
    )
    holoDisc.rotation.x = Math.PI / 2
    holoDisc.position.set(0, 3.2, 0)
    layerNetwork.add(holoDisc)

    // Floating Particle Cloud
    const particleCount = 120
    const particleGeo = new THREE.BufferGeometry()
    const particlePositions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 18
      particlePositions[i + 1] = Math.random() * 6 + 1
      particlePositions[i + 2] = (Math.random() - 0.5) * 18
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.18,
      transparent: true,
      opacity: 0.8,
    })
    const particlePoints = new THREE.Points(particleGeo, particleMat)
    layerNetwork.add(particlePoints)
    sceneState.current.particles = particlePoints

    // ── 5D. CEILING & TRUSS LAYER ──
    const trussMat = new THREE.MeshStandardMaterial({
      color: 0x1e2330,
      metalness: 0.8,
      roughness: 0.3,
    })
    for (let z = -9; z <= 9; z += 4.5) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(22, 0.5, 0.5), trussMat)
      beam.position.set(0, 7.5, z)
      layerCeiling.add(beam)
    }
    for (let x = -9; x <= 9; x += 4.5) {
      const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 22), trussMat)
      crossBeam.position.set(x, 7.8, 0)
      layerCeiling.add(crossBeam)
    }

    // Overhead Linear LED Light Strips
    const lightStripMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe })
    for (let z = -6.5; z <= 6.5; z += 6.5) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(16, 0.08, 0.2), lightStripMat)
      strip.position.set(0, 7.2, z)
      layerCeiling.add(strip)
    }

    // ── 6. MARIO 3D CHARACTER (HERO NAVIGATOR) ──
    const marioGroup = new THREE.Group()
    marioGroup.position.set(-4, 0, 3)
    marioGroup.scale.set(0.95, 0.95, 0.95)
    scene.add(marioGroup)
    sceneState.current.mario = marioGroup

    // Materials Dictionary for Iterations
    const materials = {
      classic: {
        hat: new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 }),
        shirt: new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 }),
        overalls: new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.5 }),
        skin: new THREE.MeshStandardMaterial({ color: 0xffcb9a, roughness: 0.6 }),
        mustache: new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.7 }),
        boots: new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.5 }),
        gloves: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 }),
        buttons: new THREE.MeshBasicMaterial({ color: 0xfacc15 }),
        visorEmissive: null,
      },
      cyber: {
        hat: new THREE.MeshStandardMaterial({ color: 0x4f46e5, roughness: 0.2, metalness: 0.4 }),
        shirt: new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.3, metalness: 0.3 }),
        overalls: new THREE.MeshStandardMaterial({ color: 0x0f1219, roughness: 0.2, metalness: 0.8 }),
        skin: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 }),
        mustache: new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 0.4 }),
        boots: new THREE.MeshStandardMaterial({ color: 0x1e2230, metalness: 0.7, roughness: 0.2 }),
        gloves: new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.2, metalness: 0.5 }),
        buttons: new THREE.MeshBasicMaterial({ color: 0x22d3ee }),
        visorEmissive: new THREE.MeshBasicMaterial({ color: 0x06b6d4 }),
      },
      gold: {
        hat: new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.95, roughness: 0.15 }),
        shirt: new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.15 }),
        overalls: new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 }),
        skin: new THREE.MeshStandardMaterial({ color: 0xfde68a, metalness: 0.7, roughness: 0.3 }),
        mustache: new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.9, roughness: 0.2 }),
        boots: new THREE.MeshStandardMaterial({ color: 0x92400e, metalness: 0.95, roughness: 0.2 }),
        gloves: new THREE.MeshStandardMaterial({ color: 0xfef08a, metalness: 0.8, roughness: 0.2 }),
        buttons: new THREE.MeshBasicMaterial({ color: 0xffffff }),
        visorEmissive: new THREE.MeshBasicMaterial({ color: 0xfffbeb }),
      },
    }
    sceneState.current.marioMaterials = materials

    // Active Material Pointer
    let curMat = materials[marioIteration]

    // Mario Pelvis / Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 0.9), curMat.overalls)
    torso.position.y = 1.35
    torso.castShadow = true
    marioGroup.add(torso)
    sceneState.current.marioLimbs.torso = torso

    // Shirt collar / chest
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.8), curMat.shirt)
    chest.position.set(0, 1.8, 0)
    marioGroup.add(chest)
    sceneState.current.marioLimbs.chest = chest

    // Overalls Yellow Buttons
    const btnGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 8)
    btnGeo.rotateX(Math.PI / 2)
    const btnL = new THREE.Mesh(btnGeo, curMat.buttons)
    btnL.position.set(-0.3, 1.5, 0.46)
    const btnR = new THREE.Mesh(btnGeo, curMat.buttons)
    btnR.position.set(0.3, 1.5, 0.46)
    marioGroup.add(btnL)
    marioGroup.add(btnR)
    sceneState.current.marioLimbs.btnL = btnL
    sceneState.current.marioLimbs.btnR = btnR

    // Head
    const headGroup = new THREE.Group()
    headGroup.position.set(0, 2.3, 0)
    marioGroup.add(headGroup)
    sceneState.current.marioLimbs.headGroup = headGroup

    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.9, 0.9), curMat.skin)
    headMesh.castShadow = true
    headGroup.add(headMesh)
    sceneState.current.marioLimbs.head = headMesh

    // Nose
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), curMat.skin)
    nose.position.set(0, 0.05, 0.52)
    headGroup.add(nose)

    // Mustache
    const mustache = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.22, 0.25), curMat.mustache)
    mustache.position.set(0, -0.15, 0.55)
    headGroup.add(mustache)
    sceneState.current.marioLimbs.mustache = mustache

    // Mario Cap
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.55, 1.25), curMat.hat)
    cap.position.set(0, 0.45, -0.05)
    cap.castShadow = true
    headGroup.add(cap)
    sceneState.current.marioLimbs.cap = cap

    // Cap Visor
    const visor = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.45), curMat.hat)
    visor.position.set(0, 0.25, 0.72)
    headGroup.add(visor)
    sceneState.current.marioLimbs.visor = visor

    // Cap Emblem Circle
    const emblem = new THREE.Mesh(
      new THREE.CircleGeometry(0.2, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    )
    emblem.position.set(0, 0.48, 0.58)
    headGroup.add(emblem)

    // Cyber Visor HUD overlay
    const cyberVisor = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.16, 0.15),
      curMat.visorEmissive || new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0 })
    )
    cyberVisor.position.set(0, 0.15, 0.52)
    headGroup.add(cyberVisor)
    sceneState.current.marioLimbs.cyberVisor = cyberVisor

    // Left Arm Hierarchy
    const leftArmPivot = new THREE.Group()
    leftArmPivot.position.set(-0.75, 1.8, 0)
    marioGroup.add(leftArmPivot)
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.8, 0.35), curMat.shirt)
    leftArm.position.set(0, -0.35, 0)
    const leftGlove = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), curMat.gloves)
    leftGlove.position.set(0, -0.75, 0)
    leftArmPivot.add(leftArm)
    leftArmPivot.add(leftGlove)
    sceneState.current.marioLimbs.leftArmPivot = leftArmPivot
    sceneState.current.marioLimbs.leftArm = leftArm
    sceneState.current.marioLimbs.leftGlove = leftGlove

    // Right Arm Hierarchy
    const rightArmPivot = new THREE.Group()
    rightArmPivot.position.set(0.75, 1.8, 0)
    marioGroup.add(rightArmPivot)
    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.8, 0.35), curMat.shirt)
    rightArm.position.set(0, -0.35, 0)
    const rightGlove = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), curMat.gloves)
    rightGlove.position.set(0, -0.75, 0)
    rightArmPivot.add(rightArm)
    rightArmPivot.add(rightGlove)
    sceneState.current.marioLimbs.rightArmPivot = rightArmPivot
    sceneState.current.marioLimbs.rightArm = rightArm
    sceneState.current.marioLimbs.rightGlove = rightGlove

    // Left Leg Hierarchy
    const leftLegPivot = new THREE.Group()
    leftLegPivot.position.set(-0.35, 0.85, 0)
    marioGroup.add(leftLegPivot)
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.75, 0.4), curMat.overalls)
    leftLeg.position.set(0, -0.3, 0)
    const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.3, 0.65), curMat.boots)
    leftBoot.position.set(0, -0.7, 0.12)
    leftBoot.castShadow = true
    leftLegPivot.add(leftLeg)
    leftLegPivot.add(leftBoot)
    sceneState.current.marioLimbs.leftLegPivot = leftLegPivot
    sceneState.current.marioLimbs.leftLeg = leftLeg
    sceneState.current.marioLimbs.leftBoot = leftBoot

    // Right Leg Hierarchy
    const rightLegPivot = new THREE.Group()
    rightLegPivot.position.set(0.35, 0.85, 0)
    marioGroup.add(rightLegPivot)
    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.75, 0.4), curMat.overalls)
    rightLeg.position.set(0, -0.3, 0)
    const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.3, 0.65), curMat.boots)
    rightBoot.position.set(0, -0.7, 0.12)
    rightBoot.castShadow = true
    rightLegPivot.add(rightLeg)
    rightLegPivot.add(rightBoot)
    sceneState.current.marioLimbs.rightLegPivot = rightLegPivot
    sceneState.current.marioLimbs.rightLeg = rightLeg
    sceneState.current.marioLimbs.rightBoot = rightBoot

    // Rotate Mario so he faces the tech hub corridor
    marioGroup.rotation.y = Math.PI / 4

    // ── 7. ANIMATION RENDER LOOP ──
    let animationFrameId
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      const time = sceneState.current.clock.getElapsedTime()

      // Smooth damped lerping for Exploded View
      sceneState.current.currentExplosion +=
        (sceneState.current.targetExplosion - sceneState.current.currentExplosion) * 0.08
      const exp = sceneState.current.currentExplosion

      // Layer 0: Foundation
      layerFoundation.position.y = 0
      // Layer 1: Furniture
      layerFurniture.position.y = exp * 2.8
      // Layer 2: Network
      layerNetwork.position.y = exp * 6.5
      // Layer 3: Ceiling
      layerCeiling.position.y = exp * 11.5

      // Floating data hologram rotation
      holoDisc.rotation.z = time * 0.8
      if (particlePoints) {
        particlePoints.rotation.y = time * 0.05
      }

      // Smooth Mario Movement across Floor
      sceneState.current.currentMarioX +=
        (sceneState.current.targetMarioX - sceneState.current.currentMarioX) * 0.06
      marioGroup.position.x = sceneState.current.currentMarioX

      // Mario Jump Physics
      if (sceneState.current.marioJumping) {
        sceneState.current.marioJumpTime += 0.04
        const jt = sceneState.current.marioJumpTime
        if (jt <= Math.PI) {
          marioGroup.position.y = Math.sin(jt) * 3.2
          leftLegPivot.rotation.x = -0.8
          rightLegPivot.rotation.x = 0.5
          leftArmPivot.rotation.x = -2.2
          rightArmPivot.rotation.x = -2.2
        } else {
          sceneState.current.marioJumping = false
          sceneState.current.marioJumpTime = 0
          marioGroup.position.y = 0
        }
      } else {
        // Dynamic Walk / Run Animation
        const moveSpeed = Math.abs(sceneState.current.targetMarioX - sceneState.current.currentMarioX) * 8
        const runCycle = Math.sin(time * (6 + moveSpeed * 3))
        leftLegPivot.rotation.x = runCycle * 0.8
        rightLegPivot.rotation.x = -runCycle * 0.8
        leftArmPivot.rotation.x = -runCycle * 0.8
        rightArmPivot.rotation.x = runCycle * 0.8
        torso.position.y = 1.35 + Math.abs(Math.sin(time * 8)) * 0.08
      }

      // Subtle mouse tilt for depth
      if (sceneState.current.isHovering) {
        camera.position.x += (24 + sceneState.current.mouseX * 3 - camera.position.x) * 0.05
        camera.position.z += (24 + sceneState.current.mouseY * 3 - camera.position.z) * 0.05
        camera.lookAt(0, 2 + exp * 3, 0)
      }

      renderer.render(scene, camera)
    }

    animate()

    // ── 8. WINDOW RESIZE LISTENER ──
    const handleResize = () => {
      if (!containerRef.current) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight || 600
      const newAspect = w / h
      camera.left = -d * newAspect
      camera.right = d * newAspect
      camera.top = d
      camera.bottom = -d
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
    }
  }, [])

  // ── SCROLL OBSERVER / CONTROLLER ──
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight

      // Progress from 0 to 1 as the section travels through viewport
      const start = rect.top - windowHeight * 0.8
      const total = rect.height + windowHeight * 0.6
      const progress = Math.max(0, Math.min(1, -start / total))
      setScrollProgress(progress)

      // Animate explosion and Mario's horizontal position with scroll
      sceneState.current.targetExplosion = progress
      sceneState.current.targetMarioX = -4 + progress * 8.5

      // Trigger auto jump at milestone
      if (progress > 0.45 && progress < 0.55 && !sceneState.current.marioJumping) {
        triggerJump()
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // ── MARIO ITERATION SWITCHER ──
  useEffect(() => {
    const mats = sceneState.current.marioMaterials[marioIteration]
    const limbs = sceneState.current.marioLimbs
    if (!mats || !limbs.torso) return

    limbs.torso.material = mats.overalls
    limbs.chest.material = mats.shirt
    limbs.btnL.material = mats.buttons
    limbs.btnR.material = mats.buttons
    limbs.head.material = mats.skin
    limbs.mustache.material = mats.mustache
    limbs.cap.material = mats.hat
    limbs.visor.material = mats.hat
    limbs.leftArm.material = mats.shirt
    limbs.rightArm.material = mats.shirt
    limbs.leftGlove.material = mats.gloves
    limbs.rightGlove.material = mats.gloves
    limbs.leftLeg.material = mats.overalls
    limbs.rightLeg.material = mats.overalls
    limbs.leftBoot.material = mats.boots
    limbs.rightBoot.material = mats.boots

    if (limbs.cyberVisor) {
      if (mats.visorEmissive) {
        limbs.cyberVisor.material = mats.visorEmissive
        limbs.cyberVisor.visible = true
      } else {
        limbs.cyberVisor.visible = false
      }
    }
  }, [marioIteration])

  // Trigger Jump Action
  const triggerJump = () => {
    if (sceneState.current.marioJumping) return
    sceneState.current.marioJumping = true
    sceneState.current.marioJumpTime = 0
    setJumpTrigger((prev) => prev + 1)
  }

  // Camera angle switcher
  const setCameraView = (view) => {
    const camera = sceneState.current.camera
    if (!camera) return
    setActiveCameraAngle(view)
    if (view === 'isometric') {
      camera.position.set(24, 26, 24)
      camera.lookAt(0, 2, 0)
    } else if (view === 'top') {
      camera.position.set(0.1, 40, 0.1)
      camera.lookAt(0, 0, 0)
    } else if (view === 'front') {
      camera.position.set(0, 10, 32)
      camera.lookAt(0, 3, 0)
    }
  }

  const handleMouseMove = (e) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    sceneState.current.isHovering = true
    sceneState.current.mouseX = (e.clientX - rect.left) / rect.width - 0.5
    sceneState.current.mouseY = (e.clientY - rect.top) / rect.height - 0.5
  }

  const handleMouseLeave = () => {
    sceneState.current.isHovering = false
    sceneState.current.mouseX = 0
    sceneState.current.mouseY = 0
  }

  return (
    <div className="w-full relative select-none rounded-3xl overflow-hidden border border-white/[0.08] bg-[#0A0B0E] shadow-2xl">
      {/* ── TOP HUD HEADER BAR ── */}
      <div className="absolute top-0 left-0 right-0 z-20 px-6 py-4 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-b from-[#0A0B0E]/90 to-transparent backdrop-blur-sm pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-mono font-bold text-xs">
            3D
          </div>
          <div>
            <h4 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
              ATS NEURAL WORKSPACE ARCHITECTURE
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                GPU VULKAN/WEBGL
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">Scroll to unfold exploded layers · Watch Mario navigate architecture</p>
          </div>
        </div>

        {/* Mario Model Iteration Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-[#111318]/80 p-1.5 rounded-xl border border-white/10 pointer-events-auto shadow-lg">
          <span className="text-[10px] font-mono text-slate-400 px-2 uppercase font-semibold">Mario Mode:</span>
          {[
            { id: 'cyber', label: 'Cyber Tech', color: 'border-cyan-500 text-cyan-300 bg-cyan-500/10' },
            { id: 'classic', label: 'Classic 3D', color: 'border-rose-500 text-rose-300 bg-rose-500/10' },
            { id: 'gold', label: 'Star Gold', color: 'border-amber-400 text-amber-300 bg-amber-400/10' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setMarioIteration(mode.id)}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                marioIteration === mode.id
                  ? mode.color + ' font-bold shadow-sm'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 3D CANVAS VIEWPORT ── */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="w-full h-[540px] md:h-[640px] cursor-grab active:cursor-grabbing"
      />

      {/* ── BOTTOM HUD CONTROLLER ── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-6 py-4 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-t from-[#0A0B0E]/95 to-transparent pointer-events-none">

        {/* Scroll Progress & Layer Dissection Indicator */}
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              Explosion Elevation: {Math.round(scrollProgress * 100)}%
            </span>
            <div className="w-36 h-2 rounded-full bg-white/10 overflow-hidden mt-1">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-200"
                style={{ width: `${scrollProgress * 100}%` }}
              />
            </div>
          </div>

          {/* Quick Manual Slider for Exploded View */}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={scrollProgress}
            onChange={(e) => {
              const val = parseFloat(e.target.value)
              setScrollProgress(val)
              sceneState.current.targetExplosion = val
              sceneState.current.targetMarioX = -4 + val * 8.5
            }}
            className="w-24 sm:w-32 accent-cyan-400 cursor-pointer"
            title="Manual Explode Scrub"
          />
        </div>

        {/* Interactive Mario Actions */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={triggerJump}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <span>🍄</span> Jump Mario!
          </button>

          {/* Camera View Angle Pills */}
          <div className="hidden sm:flex items-center gap-1 bg-white/[0.04] p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setCameraView('isometric')}
              className={`text-[11px] px-2.5 py-1 rounded transition-colors ${
                activeCameraAngle === 'isometric' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Isometric
            </button>
            <button
              onClick={() => setCameraView('top')}
              className={`text-[11px] px-2.5 py-1 rounded transition-colors ${
                activeCameraAngle === 'top' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Top Plan
            </button>
            <button
              onClick={() => setCameraView('front')}
              className={`text-[11px] px-2.5 py-1 rounded transition-colors ${
                activeCameraAngle === 'front' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Front Elevation
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
