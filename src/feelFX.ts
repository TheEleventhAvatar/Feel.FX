import * as THREE from 'three'
import { gsap } from 'gsap'

export type FeelType =
  | 'corporate'
  | 'educational'
  | 'casual'
  | 'travel'
  | 'music'
  | 'cinematic'
  | 'energetic'
  | 'fury'

export type VFXType =
  | 'splash'
  | 'water'
  | 'speedLines'
  | 'energyBurst'
  | 'impact'
  | 'fire'
  | 'smoke'
  | 'lightRays'
  | 'particles'
  | 'sparkles'
  | 'wind'
  | 'rain'
  | 'snow'
  | 'wave'
  | 'trail'
  | 'screenShake'
  | 'radialBurst'
  | 'colorBurst'
  | 'tricolor'
  | 'chakra'
  | 'confetti'

export type MotionPosition =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'

export type SemanticMotionInstruction = {
  type: VFXType
  start?: number
  duration?: number
  position?: MotionPosition
  intensity?: number
  scale?: number
  color?: string
  colors?: string[]
  direction?: number
}

export type MotionInstruction =
  | SemanticMotionInstruction
  | {
      type: 'cameraZoom'
      start?: number
      duration?: number
      amount?: number
      animation?: 'in' | 'out'
    }

export type FeelProfile = {
  type: FeelType
  intensity: number
  motionSpeed: number
  particleCount: number
}

type ParticleSystem = {
  points: THREE.Points
  geometry: THREE.BufferGeometry
  material: THREE.PointsMaterial
  velocities: Float32Array
  life: Float32Array
  maxLife: Float32Array
}

export class FeelFX {
  private scene: THREE.Scene
  private camera: THREE.OrthographicCamera
  private renderer: THREE.WebGLRenderer
  private container: HTMLElement

  private profile: FeelProfile = {
    type: 'cinematic',
    intensity: 0.8,
    motionSpeed: 1,
    particleCount: 120
  }

  private activeParticles: ParticleSystem[] = []
  private timelines: gsap.core.Timeline[] = []

  private ready = true

  private viewWidth = 1
  private viewHeight = 1

  constructor(container: HTMLElement) {
    this.container = container

    this.scene = new THREE.Scene()

    const width = Math.max(container.clientWidth, 1)
    const height = Math.max(container.clientHeight, 1)

    this.viewWidth = width
    this.viewHeight = height

    this.camera = new THREE.OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      0.1,
      1000
    )

    this.camera.position.z = 10

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    })

    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 2)
    )

    this.renderer.setSize(width, height)

    this.renderer.domElement.style.position = 'absolute'
    this.renderer.domElement.style.inset = '0'
    this.renderer.domElement.style.pointerEvents = 'none'
    this.renderer.domElement.style.zIndex = '20'

    container.appendChild(this.renderer.domElement)

    window.addEventListener('resize', this.handleResize)

    this.animate()
  }

  // --------------------------------------------------
  // FEEL
  // --------------------------------------------------

  setFeel(type: FeelType, intensity = 0.8) {
    this.profile = this.createProfile(
      type,
      THREE.MathUtils.clamp(intensity, 0, 1)
    )
  }

  detectFeel(text: string): FeelProfile {
    const value = text.toLowerCase()

    let type: FeelType = 'cinematic'

    if (
      /rocket|launch|explosion|battle|fight|attack|fire|impact|fury|anime|insane/.test(
        value
      )
    ) {
      type = 'fury'
    } else if (
      /business|company|startup|enterprise|strategy|revenue|sales|product/.test(
        value
      )
    ) {
      type = 'corporate'
    } else if (
      /learn|lesson|tutorial|education|course|explain|science|math|teach/.test(
        value
      )
    ) {
      type = 'educational'
    } else if (
      /beach|ocean|sea|travel|trip|mountain|hotel|vacation|destination/.test(
        value
      )
    ) {
      type = 'travel'
    } else if (
      /music|song|beat|bass|concert|dance|dj|melody|rhythm/.test(
        value
      )
    ) {
      type = 'music'
    } else if (
      /fun|vlog|friends|party|casual|life|story|lol/.test(
        value
      )
    ) {
      type = 'casual'
    }

    this.profile = this.createProfile(type, 0.8)

    return this.profile
  }

  private createProfile(
    type: FeelType,
    intensity: number
  ): FeelProfile {
    switch (type) {
      case 'corporate':
        return {
          type,
          intensity,
          motionSpeed: 0.8,
          particleCount: 40
        }

      case 'educational':
        return {
          type,
          intensity,
          motionSpeed: 0.85,
          particleCount: 30
        }

      case 'casual':
        return {
          type,
          intensity,
          motionSpeed: 1.1,
          particleCount: 80
        }

      case 'travel':
        return {
          type,
          intensity,
          motionSpeed: 1,
          particleCount: 160
        }

      case 'music':
        return {
          type,
          intensity,
          motionSpeed: 1.4,
          particleCount: 240
        }

      case 'energetic':
        return {
          type,
          intensity,
          motionSpeed: 1.35,
          particleCount: 220
        }

      case 'fury':
        return {
          type,
          intensity,
          motionSpeed: 1.7,
          particleCount: 350
        }

      default:
        return {
          type: 'cinematic',
          intensity,
          motionSpeed: 1,
          particleCount: 120
        }
    }
  }

  getFeel() {
    return this.profile
  }

  // --------------------------------------------------
  // SEMANTIC VIDEO → VFX
  // --------------------------------------------------

  applySemanticScene(scene: {
    subject?: string
    environment?: string
    event?: string
    colors?: string[]
    intensity?: number
  }) {
    const subject =
      `${scene.subject ?? ''} ${scene.environment ?? ''} ${scene.event ?? ''}`
        .toLowerCase()

    const intensity =
      scene.intensity ?? this.profile.intensity

    // BEACH / OCEAN
    if (
      /beach|ocean|sea|wave|surf|water/.test(subject)
    ) {
      this.play({
        type: 'splash',
        intensity,
        duration: 2.5,
        position: 'bottom'
      })

      this.play({
        type: 'water',
        intensity: intensity * 0.7,
        duration: 3
      })

      this.play({
        type: 'particles',
        intensity: intensity * 0.5,
        duration: 3,
        color: '#9eeeff'
      })

      return
    }

    // ROCKET / LAUNCH / EXPLOSION
    if (
      /rocket|launch|explosion|blast|impact/.test(subject)
    ) {
      this.play({
        type: 'speedLines',
        intensity,
        duration: 1.8
      })

      this.play({
        type: 'energyBurst',
        intensity,
        duration: 1.2
      })

      this.play({
        type: 'fire',
        intensity,
        duration: 2,
        position: 'bottom'
      })

      this.play({
        type: 'screenShake',
        intensity: intensity * 0.8,
        duration: 0.7
      })

      this.play({
        type: 'radialBurst',
        intensity,
        duration: 1
      })

      return
    }

    // INDIAN FLAG
    if (
      /indian flag|india flag|tricolor|tricolour|ashoka|chakra/.test(
        subject
      )
    ) {
      this.play({
        type: 'tricolor',
        intensity,
        duration: 3
      })

      this.play({
        type: 'chakra',
        intensity,
        duration: 2.5,
        position: 'center'
      })

      return
    }

    // FIRE
    if (/fire|flame|burning/.test(subject)) {
      this.play({
        type: 'fire',
        intensity,
        duration: 2.5
      })

      this.play({
        type: 'smoke',
        intensity: intensity * 0.6,
        duration: 3
      })

      return
    }

    // MUSIC / PERFORMANCE
    if (
      /music|concert|dj|dance|performance|beat/.test(subject)
    ) {
      this.play({
        type: 'colorBurst',
        intensity,
        duration: 1.5
      })

      this.play({
        type: 'particles',
        intensity,
        duration: 3
      })

      return
    }

    // DEFAULT CINEMATIC
    this.play({
      type: 'lightRays',
      intensity: intensity * 0.5,
      duration: 2
    })
  }

  // --------------------------------------------------
  // PLAY
  // --------------------------------------------------

  play(instruction: MotionInstruction) {
    switch (instruction.type) {
      case 'splash':
        this.createSplash(instruction)
        break

      case 'water':
        this.createWater(instruction)
        break

      case 'speedLines':
        this.createSpeedLines(instruction)
        break

      case 'energyBurst':
        this.createEnergyBurst(instruction)
        break

      case 'impact':
        this.createImpact(instruction)
        break

      case 'fire':
        this.createFire(instruction)
        break

      case 'smoke':
        this.createSmoke(instruction)
        break

      case 'lightRays':
        this.createLightRays(instruction)
        break

      case 'particles':
        this.createParticles(instruction)
        break

      case 'sparkles':
        this.createSparkles(instruction)
        break

      case 'wind':
        this.createWind(instruction)
        break

      case 'rain':
        this.createRain(instruction)
        break

      case 'snow':
        this.createSnow(instruction)
        break

      case 'wave':
        this.createWave(instruction)
        break

      case 'trail':
        this.createTrail(instruction)
        break

      case 'screenShake':
        this.createScreenShake(instruction)
        break

      case 'radialBurst':
        this.createRadialBurst(instruction)
        break

      case 'colorBurst':
        this.createColorBurst(instruction)
        break

      case 'tricolor':
        this.createTricolor(instruction)
        break

      case 'chakra':
        this.createChakra(instruction)
        break

      case 'confetti':
        this.createConfetti(instruction)
        break

      case 'cameraZoom':
        this.createCameraZoom(instruction)
        break
    }
  }

  playSequence(instructions: MotionInstruction[]) {
    let offset = 0

    instructions.forEach(instruction => {
      gsap.delayedCall(offset, () => this.play(instruction))

      offset += instruction.duration ?? 1
    })
  }

  // --------------------------------------------------
  // DISPOSE
  // --------------------------------------------------

  private disposeObject(object: THREE.Object3D) {
    object.traverse(child => {
      const mesh = child as THREE.Mesh

      if (mesh.geometry) {
        mesh.geometry.dispose()
      }

      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material]

      materials.forEach(material => {
        if (!(material instanceof THREE.Material)) return

        material.dispose()

        const map = (material as THREE.MeshBasicMaterial).map

        if (map) {
          map.dispose()
        }
      })
    })
  }

  // --------------------------------------------------
  // SPLASH
  // --------------------------------------------------

  private createSplash(
    instruction: SemanticMotionInstruction
  ) {
    const intensity = instruction.intensity ?? 1
    const position = this.getPosition(instruction.position ?? 'bottom')

    const count = Math.floor(35 * intensity)

    const group = new THREE.Group()

    for (let i = 0; i < count; i++) {
      const geometry = new THREE.CircleGeometry(
        THREE.MathUtils.randFloat(3, 10),
        8
      )

      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(
          THREE.MathUtils.randFloat(0.5, 0.8),
          THREE.MathUtils.randFloat(0.8, 1),
          1
        ),
        transparent: true,
        opacity: 0
      })

      const drop = new THREE.Mesh(geometry, material)

      drop.position.set(
        position.x + THREE.MathUtils.randFloatSpread(500),
        position.y + THREE.MathUtils.randFloat(-20, 50),
        5
      )

      group.add(drop)

      gsap.to(material, {
        opacity: 0.9,
        duration: 0.08
      })

      gsap.to(drop.position, {
        x: drop.position.x + THREE.MathUtils.randFloatSpread(300),
        y: drop.position.y + THREE.MathUtils.randFloat(100, 300),
        duration: THREE.MathUtils.randFloat(0.7, 1.3),
        ease: 'power2.out'
      })

      gsap.to(drop.scale, {
        x: 0.1,
        y: 0.1,
        duration: 1,
        delay: 0.2
      })

      gsap.to(material, {
        opacity: 0,
        duration: 0.5,
        delay: 0.7
      })
    }

    this.scene.add(group)

    gsap.delayedCall(
      instruction.duration ?? 2,
      () => {
        this.scene.remove(group)
        this.disposeObject(group)
      }
    )
  }

  // --------------------------------------------------
  // WATER
  // --------------------------------------------------

  private createWater(
    instruction: SemanticMotionInstruction
  ) {
    const intensity = instruction.intensity ?? 1
    const group = new THREE.Group()

    for (let i = 0; i < 5; i++) {
      const curve = new THREE.EllipseCurve(
        0,
        0,
        250 + i * 80,
        35 + i * 12,
        0,
        Math.PI,
        false,
        0
      )

      const points = curve.getPoints(60)

      const geometry =
        new THREE.BufferGeometry().setFromPoints(points)

      const material =
        new THREE.LineBasicMaterial({
          color: 0x8eeaff,
          transparent: true,
          opacity: 0
        })

      const line =
        new THREE.Line(geometry, material)

      line.position.y =
        -this.container.clientHeight * 0.25 + i * 35

      group.add(line)

      gsap.to(material, {
        opacity: 0.25 + intensity * 0.45,
        duration: 0.4
      })

      gsap.to(line.position, {
        x: 100,
        duration: 2 + i * 0.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      })
    }

    this.scene.add(group)

    gsap.delayedCall(
      instruction.duration ?? 3,
      () => {
        gsap.to(group.children, {
          opacity: 0,
          duration: 0.5,
          onComplete: () => {
            this.scene.remove(group)
            this.disposeObject(group)
          }
        })
      }
    )
  }

  // --------------------------------------------------
  // SPEED LINES
  // --------------------------------------------------

  private createSpeedLines(
    instruction: SemanticMotionInstruction
  ) {
    const intensity = instruction.intensity ?? 1

    const group = new THREE.Group()

    for (let i = 0; i < 70; i++) {
      const length =
        THREE.MathUtils.randFloat(60, 260) * intensity

      const geometry =
        new THREE.PlaneGeometry(length, 2)

      const material =
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0
        })

      const line = new THREE.Mesh(
        geometry,
        material
      )

      const angle =
        THREE.MathUtils.randFloat(
          -Math.PI * 0.15,
          Math.PI * 0.15
        )

      line.position.set(
        THREE.MathUtils.randFloatSpread(
          this.container.clientWidth
        ),
        THREE.MathUtils.randFloatSpread(
          this.container.clientHeight
        ),
        8
      )

      line.rotation.z = angle

      group.add(line)

      gsap.to(material, {
        opacity: THREE.MathUtils.randFloat(
          0.2,
          0.8
        ),
        duration: 0.05
      })

      gsap.fromTo(
        line.position,
        {
          x: line.position.x - 600
        },
        {
          x: line.position.x + 1000,
          duration: THREE.MathUtils.randFloat(
            0.25,
            0.7
          ),
          repeat: -1,
          ease: 'none'
        }
      )
    }

    this.scene.add(group)

    gsap.delayedCall(
      instruction.duration ?? 2,
      () => {
        this.scene.remove(group)
        this.disposeObject(group)
      }
    )
  }

  // --------------------------------------------------
  // ENERGY BURST
  // --------------------------------------------------

  private createEnergyBurst(
    instruction: SemanticMotionInstruction
  ) {
    const intensity = instruction.intensity ?? 1

    const group = new THREE.Group()

    for (let i = 0; i < 28; i++) {
      const angle =
        (i / 28) * Math.PI * 2

      const geometry =
        new THREE.PlaneGeometry(
          THREE.MathUtils.randFloat(120, 300),
          THREE.MathUtils.randFloat(2, 7)
        )

      const material =
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(
            1,
            THREE.MathUtils.randFloat(0.1, 0.6),
            0.05
          ),
          transparent: true,
          opacity: 0
        })

      const ray =
        new THREE.Mesh(
          geometry,
          material
        )

      ray.rotation.z = angle

      ray.position.z = 9

      ray.scale.x = 0.01

      group.add(ray)

      gsap.to(material, {
        opacity: 0.9,
        duration: 0.05
      })

      gsap.to(ray.scale, {
        x: intensity,
        duration: 0.45,
        ease: 'power4.out'
      })

      gsap.to(material, {
        opacity: 0,
        duration: 0.4,
        delay: 0.4
      })
    }

    this.scene.add(group)

    gsap.delayedCall(
      instruction.duration ?? 1.2,
      () => {
        this.scene.remove(group)
        this.disposeObject(group)
      }
    )
  }

  // --------------------------------------------------
  // IMPACT
  // --------------------------------------------------

  private createImpact(
    instruction: SemanticMotionInstruction
  ) {
    const intensity = instruction.intensity ?? 1

    const geometry =
      new THREE.RingGeometry(
        30,
        42,
        64
      )

    const material =
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0
      })

    const ring =
      new THREE.Mesh(
        geometry,
        material
      )

    ring.position.z = 10

    ring.scale.setScalar(0.1)

    this.scene.add(ring)

    gsap.to(material, {
      opacity: intensity,
      duration: 0.05
    })

    gsap.to(ring.scale, {
      x: 8 * intensity,
      y: 8 * intensity,
      duration: 0.5,
      ease: 'power4.out'
    })

    gsap.to(material, {
      opacity: 0,
      duration: 0.45
    })

    gsap.delayedCall(1, () => {
      this.scene.remove(ring)
      this.disposeObject(ring)
    })

    this.createScreenShake({
      type: 'screenShake',
      intensity: intensity * 0.5,
      duration: 0.4
    })
  }

  // --------------------------------------------------
  // FIRE
  // --------------------------------------------------

  private createFire(
    instruction: SemanticMotionInstruction
  ) {
    const intensity = instruction.intensity ?? 1
    const position =
      this.getPosition(instruction.position ?? 'bottom')

    const group = new THREE.Group()

    for (let i = 0; i < 90; i++) {
      const geometry =
        new THREE.CircleGeometry(
          THREE.MathUtils.randFloat(3, 15),
          8
        )

      const material =
        new THREE.MeshBasicMaterial({
          color:
            Math.random() > 0.45
              ? 0xff7a00
              : 0xffd000,
          transparent: true,
          opacity: 0
        })

      const particle =
        new THREE.Mesh(
          geometry,
          material
        )

      particle.position.set(
        position.x +
          THREE.MathUtils.randFloatSpread(180),
        position.y +
          THREE.MathUtils.randFloatSpread(80),
        7
      )

      group.add(particle)

      gsap.to(material, {
        opacity: THREE.MathUtils.randFloat(
          0.3,
          0.9
        ),
        duration: 0.05
      })

      gsap.to(particle.position, {
        y:
          particle.position.y +
          THREE.MathUtils.randFloat(150, 450) *
            intensity,
        x:
          particle.position.x +
          THREE.MathUtils.randFloatSpread(150),
        duration:
          THREE.MathUtils.randFloat(0.6, 1.4),
        repeat: -1,
        ease: 'none'
      })

      gsap.to(particle.scale, {
        x: 0.1,
        y: 0.1,
        duration: 1,
        repeat: -1,
        ease: 'power2.in'
      })
    }

    this.scene.add(group)

    gsap.delayedCall(
      instruction.duration ?? 2,
      () => {
        gsap.killTweensOf(group.children)

        this.scene.remove(group)
        this.disposeObject(group)
      }
    )
  }

  // --------------------------------------------------
  // SMOKE
  // --------------------------------------------------

  private createSmoke(
    instruction: SemanticMotionInstruction
  ) {
    const position =
      this.getPosition(instruction.position ?? 'bottom')

    const group = new THREE.Group()

    for (let i = 0; i < 25; i++) {
      const geometry =
        new THREE.CircleGeometry(
          THREE.MathUtils.randFloat(20, 60),
          24
        )

      const material =
        new THREE.MeshBasicMaterial({
          color: 0x888888,
          transparent: true,
          opacity: 0
        })

      const smoke =
        new THREE.Mesh(
          geometry,
          material
        )

      smoke.position.set(
        position.x +
          THREE.MathUtils.randFloatSpread(150),
        position.y +
          THREE.MathUtils.randFloatSpread(80),
        6
      )

      group.add(smoke)

      gsap.to(material, {
        opacity: 0.15,
        duration: 0.3
      })

      gsap.to(smoke.position, {
        y:
          smoke.position.y +
          THREE.MathUtils.randFloat(150, 400),
        x:
          smoke.position.x +
          THREE.MathUtils.randFloatSpread(120),
        duration: 2,
        ease: 'power1.out'
      })

      gsap.to(smoke.scale, {
        x: 2,
        y: 2,
        duration: 2
      })

      gsap.to(material, {
        opacity: 0,
        duration: 1,
        delay: 1
      })
    }

    this.scene.add(group)

    gsap.delayedCall(
      instruction.duration ?? 3,
      () => {
        this.scene.remove(group)
        this.disposeObject(group)
      }
    )
  }

  // --------------------------------------------------
  // LIGHT RAYS
  // --------------------------------------------------

  private createLightRays(
    instruction: SemanticMotionInstruction
  ) {
    const group = new THREE.Group()

    for (let i = 0; i < 8; i++) {
      const geometry =
        new THREE.PlaneGeometry(
          80,
          this.container.clientHeight * 1.5
        )

      const material =
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.06
        })

      const ray =
        new THREE.Mesh(
          geometry,
          material
        )

      ray.position.z = 4
      ray.rotation.z =
        THREE.MathUtils.degToRad(
          THREE.MathUtils.randFloat(-25, 25)
        )

      ray.position.x =
        THREE.MathUtils.randFloatSpread(
          this.container.clientWidth
        )

      group.add(ray)
    }

    this.scene.add(group)

    gsap.to(group.rotation, {
      z: 0.2,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    })

    gsap.delayedCall(
      instruction.duration ?? 3,
      () => {
        this.scene.remove(group)
        this.disposeObject(group)
      }
    )
  }

  // --------------------------------------------------
  // PARTICLES
  // --------------------------------------------------

  private createParticles(
    instruction: SemanticMotionInstruction
  ) {
    const intensity = instruction.intensity ?? 1
    const count =
      Math.floor(
        this.profile.particleCount *
        intensity
      )

    const positions =
      new Float32Array(count * 3)

    const velocities =
      new Float32Array(count * 3)

    const life =
      new Float32Array(count)

    const maxLife =
      new Float32Array(count)

    for (let i = 0; i < count; i++) {
      positions[i * 3] =
        THREE.MathUtils.randFloatSpread(
          this.container.clientWidth
        )

      positions[i * 3 + 1] =
        THREE.MathUtils.randFloatSpread(
          this.container.clientHeight
        )

      positions[i * 3 + 2] = 3

      velocities[i * 3] =
        THREE.MathUtils.randFloat(-0.4, 0.4)

      velocities[i * 3 + 1] =
        THREE.MathUtils.randFloat(-0.5, 1)

      life[i] =
        Math.random()

      maxLife[i] =
        THREE.MathUtils.randFloat(1, 3)
    }

    const geometry =
      new THREE.BufferGeometry()

    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(
        positions,
        3
      )
    )

    const material =
      new THREE.PointsMaterial({
        color:
          instruction.color ?? '#ffffff',
        size: 4,
        transparent: true,
        opacity: 0.7,
        depthTest: false
      })

    const points =
      new THREE.Points(
        geometry,
        material
      )

    this.scene.add(points)

    const system: ParticleSystem = {
      points,
      geometry,
      material,
      velocities,
      life,
      maxLife
    }

    this.activeParticles.push(system)

    gsap.delayedCall(
      instruction.duration ?? 3,
      () => {
        this.scene.remove(points)

        geometry.dispose()
        material.dispose()

        const index =
          this.activeParticles.indexOf(system)

        if (index !== -1) {
          this.activeParticles.splice(index, 1)
        }
      }
    )
  }

  // --------------------------------------------------
  // SPARKLES
  // --------------------------------------------------

  private createSparkles(
    instruction: SemanticMotionInstruction
  ) {
    this.createParticles({
      ...instruction,
      type: 'particles',
      color: '#ffffff'
    })
  }

  private createWind(
    instruction: SemanticMotionInstruction
  ) {
    this.createSpeedLines({
      ...instruction,
      type: 'speedLines',
      color: '#ffffff'
    })
  }

  private createRain(
    instruction: SemanticMotionInstruction
  ) {
    this.createSpeedLines({
      ...instruction,
      type: 'speedLines',
      color: '#9ddcff'
    })
  }

  private createSnow(
    instruction: SemanticMotionInstruction
  ) {
    this.createParticles({
      ...instruction,
      type: 'particles',
      color: '#ffffff'
    })
  }

  private createWave(
    instruction: SemanticMotionInstruction
  ) {
    this.createWater(instruction)
  }

  private createTrail(
    instruction: SemanticMotionInstruction
  ) {
    this.createSpeedLines(instruction)
  }

  // --------------------------------------------------
  // SCREEN SHAKE
  // --------------------------------------------------

  private createScreenShake(
    instruction: SemanticMotionInstruction
  ) {
    const intensity =
      instruction.intensity ?? 1

    const amount =
      intensity * 12

    const steps = Math.floor(
      (instruction.duration ?? 0.5) * 25
    )

    const timeline =
      gsap.timeline({
        onComplete: () => {
          this.container.style.transform = ''
        }
      })

    for (let i = 0; i < steps; i++) {
      timeline.to(
        this.container,
        {
          x: () =>
            THREE.MathUtils.randFloatSpread(
              amount * 2
            ),
          y: () =>
            THREE.MathUtils.randFloatSpread(
              amount * 2
            ),
          duration: 0.04,
          ease: 'none'
        }
      )
    }

    timeline.set(this.container, {
      x: 0,
      y: 0
    })

    this.timelines.push(timeline)
  }

  // --------------------------------------------------
  // RADIAL BURST
  // --------------------------------------------------

  private createRadialBurst(
    instruction: SemanticMotionInstruction
  ) {
    this.createEnergyBurst({
      ...instruction,
      type: 'energyBurst'
    })
  }

  // --------------------------------------------------
  // COLOR BURST
  // --------------------------------------------------

  private createColorBurst(
    instruction: SemanticMotionInstruction
  ) {
    const colors =
      instruction.colors ?? [
        '#ff0055',
        '#00ccff',
        '#ffff00',
        '#8a2be2'
      ]

    const group =
      new THREE.Group()

    for (let i = 0; i < 35; i++) {
      const geometry =
        new THREE.PlaneGeometry(
          THREE.MathUtils.randFloat(40, 180),
          THREE.MathUtils.randFloat(2, 8)
        )

      const material =
        new THREE.MeshBasicMaterial({
          color:
            colors[
              i % colors.length
            ],
          transparent: true,
          opacity: 0
        })

      const ray =
        new THREE.Mesh(
          geometry,
          material
        )

      ray.rotation.z =
        Math.random() *
        Math.PI *
        2

      ray.position.z = 8

      group.add(ray)

      gsap.to(material, {
        opacity: 0.8,
        duration: 0.05
      })

      gsap.to(ray.scale, {
        x: 1.5,
        duration: 0.5
      })

      gsap.to(material, {
        opacity: 0,
        duration: 0.5,
        delay: 0.5
      })
    }

    this.scene.add(group)

    gsap.delayedCall(
      instruction.duration ?? 1.5,
      () => {
        this.scene.remove(group)
        this.disposeObject(group)
      }
    )
  }

  // --------------------------------------------------
  // INDIAN TRICOLOR
  // --------------------------------------------------

  private createTricolor(
    instruction: SemanticMotionInstruction
  ) {
    const group =
      new THREE.Group()

    const colors = [
      0xff9933,
      0xffffff,
      0x138808
    ]

    const height =
      this.container.clientHeight

    colors.forEach(
      (color, index) => {
        const geometry =
          new THREE.PlaneGeometry(
            this.container.clientWidth * 1.4,
            height * 0.13
          )

        const material =
          new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0
          })

        const strip =
          new THREE.Mesh(
            geometry,
            material
          )

        strip.position.set(
          -this.container.clientWidth,
          (1 - index) *
            height *
            0.16 -
            height * 0.08,
          6
        )

        group.add(strip)

        gsap.to(material, {
          opacity:
            index === 1
              ? 0.16
              : 0.22,
          duration: 0.5,
          delay: index * 0.1
        })

        gsap.to(
          strip.position,
          {
            x: 0,
            duration:
              0.9 /
              this.profile.motionSpeed,
            ease: 'power3.out',
            delay: index * 0.08
          }
        )
      }
    )

    this.scene.add(group)

    gsap.to(group.position, {
      y: 20,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    })

    gsap.delayedCall(
      instruction.duration ?? 3,
      () => {
        gsap.killTweensOf(group)

        group.children.forEach(
          object => {
            const mesh =
              object as THREE.Mesh

            gsap.to(
              mesh.material,
              {
                opacity: 0,
                duration: 0.5
              }
            )
          }
        )

        gsap.delayedCall(0.55, () => {
          this.scene.remove(group)
          this.disposeObject(group)
        })
      }
    )
  }

  // --------------------------------------------------
  // ASHOKA CHAKRA
  // --------------------------------------------------

  private createChakra(
    instruction: SemanticMotionInstruction
  ) {
    const radius = 90

    const geometry =
      new THREE.RingGeometry(
        radius - 5,
        radius,
        64
      )

    const material =
      new THREE.MeshBasicMaterial({
        color: 0x000080,
        transparent: true,
        opacity: 0
      })

    const chakra =
      new THREE.Mesh(
        geometry,
        material
      )

    const position =
      this.getPosition(
        instruction.position ?? 'center'
      )

    chakra.position.set(
      position.x,
      position.y,
      9
    )

    chakra.scale.setScalar(0.2)

    this.scene.add(chakra)

    gsap.to(material, {
      opacity: 0.7,
      duration: 0.4
    })

    gsap.to(chakra.scale, {
      x: 1,
      y: 1,
      duration: 0.8,
      ease: 'back.out(1.7)'
    })

    gsap.to(chakra.rotation, {
      z: Math.PI * 2,
      duration: 2,
      repeat: -1,
      ease: 'none'
    })

    gsap.delayedCall(
      instruction.duration ?? 2.5,
      () => {
        gsap.to(material, {
          opacity: 0,
          duration: 0.4,
          onComplete: () => {
            this.scene.remove(chakra)
            geometry.dispose()
            material.dispose()
          }
        })
      }
    )
  }

  // --------------------------------------------------
  // CONFETTI
  // --------------------------------------------------

  private createConfetti(
    instruction: SemanticMotionInstruction
  ) {
    this.createParticles({
      ...instruction,
      type: 'particles',
      color: '#ffffff'
    })
  }

  // --------------------------------------------------
  // CAMERA
  // --------------------------------------------------

  private createCameraZoom(
    instruction: Extract<
      MotionInstruction,
      { type: 'cameraZoom' }
    >
  ) {
    const amount =
      instruction.amount ?? 1.2

    const target =
      instruction.animation === 'out'
        ? 1
        : amount

    gsap.to(
      this.camera,
      {
        zoom: target,
        duration:
          instruction.duration ?? 1,
        ease: 'power3.inOut',
        onUpdate: () => {
          this.camera.updateProjectionMatrix()
        }
      }
    )
  }

  // --------------------------------------------------
  // PARTICLE UPDATE
  // --------------------------------------------------

  private updateParticles(delta: number) {
    this.activeParticles.forEach(
      system => {
        const position =
          system.geometry.getAttribute(
            'position'
          ) as THREE.BufferAttribute

        for (
          let i = 0;
          i < system.life.length;
          i++
        ) {
          system.life[i] += delta

          position.array[i * 3] +=
            system.velocities[i * 3]

          position.array[i * 3 + 1] +=
            system.velocities[i * 3 + 1]

          if (
            system.life[i] >
            system.maxLife[i]
          ) {
            position.array[i * 3] =
              THREE.MathUtils.randFloatSpread(
                this.viewWidth
              )

            position.array[i * 3 + 1] =
              THREE.MathUtils.randFloatSpread(
                this.viewHeight
              )

            system.life[i] = 0
          }
        }

        position.needsUpdate = true
      }
    )
  }

  // --------------------------------------------------
  // POSITION
  // --------------------------------------------------

  private getPosition(
    position?: MotionPosition
  ) {
    const width =
      this.container.clientWidth

    const height =
      this.container.clientHeight

    switch (position) {
      case 'top':
        return {
          x: 0,
          y: height * 0.3
        }

      case 'bottom':
        return {
          x: 0,
          y: -height * 0.3
        }

      case 'left':
        return {
          x: -width * 0.3,
          y: 0
        }

      case 'right':
        return {
          x: width * 0.3,
          y: 0
        }

      default:
        return {
          x: 0,
          y: 0
        }
    }
  }

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  private lastTime = performance.now()

  private animate = () => {
    if (!this.ready) return

    requestAnimationFrame(
      this.animate
    )

    const now =
      performance.now()

    const delta =
      Math.min(
        (now - this.lastTime) / 1000,
        0.05
      )

    this.lastTime = now

    this.updateParticles(delta)

    this.renderer.render(
      this.scene,
      this.camera
    )
  }

  // --------------------------------------------------
  // RESET
  // --------------------------------------------------

  reset() {
    gsap.killTweensOf(
      this.container
    )

    this.container.style.transform = ''

    this.timelines.forEach(
      timeline => timeline.kill()
    )

    this.timelines = []

    this.scene.children
      .slice()
      .forEach(object => {
        this.scene.remove(object)
        this.disposeObject(object)
      })

    this.activeParticles = []
  }

  destroy() {
    this.ready = false

    this.reset()

    window.removeEventListener(
      'resize',
      this.handleResize
    )

    this.renderer.dispose()

    this.renderer.domElement.remove()
  }

  // --------------------------------------------------
  // RESIZE
  // --------------------------------------------------

  private handleResize = () => {
    const width =
      Math.max(
        this.container.clientWidth,
        1
      )

    const height =
      Math.max(
        this.container.clientHeight,
        1
      )

    this.viewWidth = width
    this.viewHeight = height

    this.camera.left =
      -width / 2

    this.camera.right =
      width / 2

    this.camera.top =
      height / 2

    this.camera.bottom =
      -height / 2

    this.camera.updateProjectionMatrix()

    this.renderer.setSize(
      width,
      height
    )
  }
}