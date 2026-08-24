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

export type MotionPosition =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'

export type MotionAnimation =
  | 'slam'
  | 'fade'
  | 'rise'
  | 'scale'
  | 'draw'
  | 'pop'
  | 'pulse'

export type MotionInstruction =
  | {
      type: 'text'
      content: string
      start?: number
      duration?: number
      position?: MotionPosition
      animation?: MotionAnimation
      scale?: number
      rotation?: number
    }

  | {
      type: 'arrow'
      start?: number
      duration?: number
      from: MotionPosition
      to: MotionPosition
      animation?: MotionAnimation
      label?: string
    }

  | {
      type: 'circle'
      start?: number
      duration?: number
      position?: MotionPosition
      size?: number
      animation?: MotionAnimation
    }

  | {
      type: 'highlight'
      start?: number
      duration?: number
      position?: MotionPosition
      width?: number
      height?: number
      animation?: MotionAnimation
    }

  | {
      type: 'image'
      start?: number
      duration?: number
      position?: MotionPosition
      url: string
      scale?: number
      animation?: MotionAnimation
    }

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

  textScale: number

  motionSpeed: number

  animation:
    | 'minimal'
    | 'clean'
    | 'playful'
    | 'dynamic'
    | 'dramatic'

  useParticles: boolean
}

export class FeelFX {
  private scene: THREE.Scene
  private camera: THREE.OrthographicCamera
  private renderer: THREE.WebGLRenderer
  private container: HTMLElement

  private baseCameraZoom = 1

  private profile: FeelProfile = {
    type: 'cinematic',
    intensity: 0.8,
    textScale: 1,
    motionSpeed: 1,
    animation: 'dramatic',
    useParticles: true
  }

  constructor(container: HTMLElement) {
    this.container = container

    this.scene = new THREE.Scene()

    this.scene.background =
      new THREE.Color(0x050505)

    const width =
      Math.max(container.clientWidth, 1)

    const height =
      Math.max(container.clientHeight, 1)

    this.camera =
      new THREE.OrthographicCamera(
        -width / 2,
        width / 2,
        height / 2,
        -height / 2,
        0.1,
        1000
      )

    this.camera.position.z = 10

    this.renderer =
      new THREE.WebGLRenderer({
        antialias: true,
        alpha: false
      })

    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 2)
    )

    this.renderer.setSize(
      width,
      height
    )

    container.appendChild(
      this.renderer.domElement
    )

    window.addEventListener(
      'resize',
      this.handleResize
    )

    this.animate()
  }

  /*
   * --------------------------------------------------
   * FEEL DETECTION
   * --------------------------------------------------
   *
   * Later this will receive actual video analysis:
   *
   * transcript
   * visual analysis
   * audio intensity
   * scene changes
   * speaker behavior
   *
   * For now we use semantic text.
   */

  detectFeel(input: string): FeelProfile {
    const text =
      input.toLowerCase()

    let type: FeelType = 'cinematic'

    if (
      /business|company|startup|enterprise|strategy|revenue|sales|product|market|professional/.test(
        text
      )
    ) {
      type = 'corporate'
    }

    else if (
      /learn|lesson|tutorial|explain|education|course|how to|science|math|concept|teach/.test(
        text
      )
    ) {
      type = 'educational'
    }

    else if (
      /guys|fun|lol|day|life|story|crazy|honestly|literally|vlog/.test(
        text
      )
    ) {
      type = 'casual'
    }

    else if (
      /travel|trip|beach|mountain|hotel|flight|vacation|explore|destination|adventure/.test(
        text
      )
    ) {
      type = 'travel'
    }

    else if (
      /music|song|beat|bass|dj|concert|dance|melody|rhythm|track/.test(
        text
      )
    ) {
      type = 'music'
    }

    else if (
      /fast|insane|crazy|breaking|huge|massive|explosive|energy/.test(
        text
      )
    ) {
      type = 'energetic'
    }

    this.profile =
      this.createProfile(type)

    return this.profile
  }

  private createProfile(
    type: FeelType
  ): FeelProfile {
    switch (type) {
      case 'corporate':
        return {
          type,
          intensity: 0.45,
          textScale: 0.85,
          motionSpeed: 0.8,
          animation: 'clean',
          useParticles: false
        }

      case 'educational':
        return {
          type,
          intensity: 0.55,
          textScale: 0.9,
          motionSpeed: 0.85,
          animation: 'minimal',
          useParticles: false
        }

      case 'casual':
        return {
          type,
          intensity: 0.7,
          textScale: 1,
          motionSpeed: 1.1,
          animation: 'playful',
          useParticles: false
        }

      case 'travel':
        return {
          type,
          intensity: 0.75,
          textScale: 1,
          motionSpeed: 1,
          animation: 'dynamic',
          useParticles: true
        }

      case 'music':
        return {
          type,
          intensity: 1,
          textScale: 1.15,
          motionSpeed: 1.4,
          animation: 'dynamic',
          useParticles: true
        }

      case 'energetic':
        return {
          type,
          intensity: 1,
          textScale: 1.15,
          motionSpeed: 1.35,
          animation: 'dynamic',
          useParticles: true
        }

      default:
        return {
          type: 'cinematic',
          intensity: 0.8,
          textScale: 1,
          motionSpeed: 1,
          animation: 'dramatic',
          useParticles: true
        }
    }
  }

  getFeel(): FeelProfile {
    return this.profile
  }

  /*
   * --------------------------------------------------
   * DSL EXECUTION
   * --------------------------------------------------
   */

  play(instruction: MotionInstruction) {
    switch (instruction.type) {
      case 'text':
        this.createText(instruction)
        break

      case 'arrow':
        this.createArrow(instruction)
        break

      case 'circle':
        this.createCircle(instruction)
        break

      case 'highlight':
        this.createHighlight(instruction)
        break

      case 'image':
        this.createImage(instruction)
        break

      case 'cameraZoom':
        this.createCameraZoom(instruction)
        break
    }
  }

  playSequence(
    instructions: MotionInstruction[]
  ) {
    instructions.forEach(
      instruction => {
        this.play(instruction)
      }
    )
  }

  /*
   * --------------------------------------------------
   * TEXT
   * --------------------------------------------------
   */

  private createText(
    instruction: Extract<
      MotionInstruction,
      { type: 'text' }
    >
  ) {
    const canvas =
      document.createElement('canvas')

    canvas.width = 2048
    canvas.height = 512

    const context =
      canvas.getContext('2d')

    if (!context) {
      return
    }

    const fontSize =
      (instruction.scale ?? 1) *
      this.profile.textScale *
      220

    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    )

    context.font =
      `900 ${fontSize}px Arial`

    context.textAlign = 'center'
    context.textBaseline = 'middle'

    context.shadowColor =
      'rgba(0,0,0,0.85)'

    context.shadowBlur = 35
    context.shadowOffsetY = 18

    context.fillStyle = '#ffffff'

    context.fillText(
      instruction.content,
      canvas.width / 2,
      canvas.height / 2
    )

    const texture =
      new THREE.CanvasTexture(canvas)

    texture.colorSpace =
      THREE.SRGBColorSpace

    const material =
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false
      })

    const geometry =
      new THREE.PlaneGeometry(
        820,
        205
      )

    const mesh =
      new THREE.Mesh(
        geometry,
        material
      )

    const position =
      this.getPosition(
        instruction.position
      )

    mesh.position.set(
      position.x,
      position.y,
      0
    )

    mesh.rotation.z =
      THREE.MathUtils.degToRad(
        instruction.rotation ?? 0
      )

    mesh.renderOrder = 100

    this.scene.add(mesh)

    mesh.scale.set(
      0.01,
      0.01,
      0.01
    )

    material.opacity = 0

    const timeline =
      gsap.timeline()

    const start =
      instruction.start ?? 0

    const duration =
      instruction.duration ?? 2

    if (start > 0) {
      timeline.to({}, {
        duration:
          start /
          this.profile.motionSpeed
      })
    }

    const animation =
      instruction.animation ??
      this.getDefaultAnimation()

    switch (animation) {
      case 'slam':
        this.slam(
          timeline,
          mesh,
          material
        )
        break

      case 'fade':
        this.fade(
          timeline,
          mesh,
          material
        )
        break

      case 'rise':
        this.rise(
          timeline,
          mesh,
          material
        )
        break

      case 'scale':
        this.scale(
          timeline,
          mesh,
          material
        )
        break

      case 'pop':
        this.pop(
          timeline,
          mesh,
          material
        )
        break

      case 'pulse':
        this.pulse(
          timeline,
          mesh,
          material
        )
        break
    }

    timeline.to(
      material,
      {
        opacity: 0,
        duration: 0.35
      },
      `+=${Math.max(
        0,
        duration - 1.2
      )}`
    )

    timeline.call(() => {
      this.scene.remove(mesh)

      geometry.dispose()
      material.dispose()
      texture.dispose()
    })
  }

  /*
   * --------------------------------------------------
   * ARROW
   * --------------------------------------------------
   */

  private createArrow(
    instruction: Extract<
      MotionInstruction,
      { type: 'arrow' }
    >
  ) {
    const group =
      new THREE.Group()

    const from =
      this.getPosition(
        instruction.from
      )

    const to =
      this.getPosition(
        instruction.to
      )

    const direction =
      new THREE.Vector3(
        to.x - from.x,
        to.y - from.y,
        0
      )

    const length =
      direction.length()

    const angle =
      Math.atan2(
        direction.y,
        direction.x
      )

    const lineGeometry =
      new THREE.PlaneGeometry(
        length,
        6
      )

    const lineMaterial =
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true
      })

    const line =
      new THREE.Mesh(
        lineGeometry,
        lineMaterial
      )

    line.position.set(
      (from.x + to.x) / 2,
      (from.y + to.y) / 2,
      1
    )

    line.rotation.z =
      angle

    group.add(line)

    const headGeometry =
      new THREE.BufferGeometry()

    const vertices =
      new Float32Array([
        0, 0, 0,
        -28, 14, 0,
        -28, -14, 0
      ])

    headGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(
        vertices,
        3
      )
    )

    const headMaterial =
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true
      })

    const head =
      new THREE.Mesh(
        headGeometry,
        headMaterial
      )

    head.position.set(
      to.x,
      to.y,
      1
    )

    head.rotation.z =
      angle

    group.add(head)

    this.scene.add(group)

    group.scale.set(
      0.01,
      0.01,
      0.01
    )

    group.traverse(object => {
      const mesh =
        object as THREE.Mesh

      if (mesh.material) {
        ;(
          mesh.material as THREE.MeshBasicMaterial
        ).opacity = 0
      }
    })

    const timeline =
      gsap.timeline()

    const start =
      instruction.start ?? 0

    const duration =
      instruction.duration ?? 1.5

    if (start > 0) {
      timeline.to({}, {
        duration:
          start /
          this.profile.motionSpeed
      })
    }

    timeline.to(group.scale, {
      x: 1,
      y: 1,
      duration:
        0.55 /
        this.profile.motionSpeed,
      ease: 'power3.out'
    })

    group.traverse(object => {
      const mesh =
        object as THREE.Mesh

      if (mesh.material) {
        timeline.to(
          mesh.material as THREE.MeshBasicMaterial,
          {
            opacity: 1,
            duration: 0.25
          },
          '<'
        )
      }
    })

    timeline.to(
      group.scale,
      {
        x: 0.01,
        y: 0.01,
        duration: 0.35
      },
      `+=${Math.max(
        0,
        duration - 1
      )}`
    )

    timeline.call(() => {
      this.scene.remove(group)

      lineGeometry.dispose()
      lineMaterial.dispose()
      headGeometry.dispose()
      headMaterial.dispose()
    })
  }

  /*
   * --------------------------------------------------
   * CIRCLE
   * --------------------------------------------------
   */

  private createCircle(
    instruction: Extract<
      MotionInstruction,
      { type: 'circle' }
    >
  ) {
    const position =
      this.getPosition(
        instruction.position
      )

    const radius =
      instruction.size ?? 100

    const curve =
      new THREE.EllipseCurve(
        0,
        0,
        radius,
        radius,
        0,
        Math.PI * 2,
        false,
        0
      )

    const points =
      curve.getPoints(100)

    const geometry =
      new THREE.BufferGeometry().setFromPoints(
        points
      )

    const material =
      new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0
      })

    const circle =
      new THREE.LineLoop(
        geometry,
        material
      )

    circle.position.set(
      position.x,
      position.y,
      2
    )

    this.scene.add(circle)

    const timeline =
      gsap.timeline()

    const start =
      instruction.start ?? 0

    const duration =
      instruction.duration ?? 1.5

    if (start > 0) {
      timeline.to({}, {
        duration:
          start /
          this.profile.motionSpeed
      })
    }

    circle.scale.set(
      0.1,
      0.1,
      0.1
    )

    timeline.to(material, {
      opacity: 1,
      duration: 0.15
    })

    timeline.to(
      circle.scale,
      {
        x: 1,
        y: 1,
        duration:
          0.6 /
          this.profile.motionSpeed,
        ease: 'back.out(2)'
      },
      '<'
    )

    if (
      instruction.animation ===
      'pulse'
    ) {
      timeline.to(
        circle.scale,
        {
          x: 1.15,
          y: 1.15,
          duration: 0.25
        }
      )

      timeline.to(
        circle.scale,
        {
          x: 1,
          y: 1,
          duration: 0.25
        }
      )
    }

    timeline.to(
      material,
      {
        opacity: 0,
        duration: 0.35
      },
      `+=${Math.max(
        0,
        duration - 1
      )}`
    )

    timeline.call(() => {
      this.scene.remove(circle)

      geometry.dispose()
      material.dispose()
    })
  }

  /*
   * --------------------------------------------------
   * HIGHLIGHT
   * --------------------------------------------------
   */

  private createHighlight(
    instruction: Extract<
      MotionInstruction,
      { type: 'highlight' }
    >
  ) {
    const position =
      this.getPosition(
        instruction.position
      )

    const width =
      instruction.width ?? 300

    const height =
      instruction.height ?? 100

    const geometry =
      new THREE.PlaneGeometry(
        width,
        height
      )

    const material =
      new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.25,
        depthTest: false
      })

    const mesh =
      new THREE.Mesh(
        geometry,
        material
      )

    mesh.position.set(
      position.x,
      position.y,
      -1
    )

    mesh.scale.set(
      0.01,
      0.01,
      0.01
    )

    this.scene.add(mesh)

    const timeline =
      gsap.timeline()

    const start =
      instruction.start ?? 0

    const duration =
      instruction.duration ?? 1.5

    if (start > 0) {
      timeline.to({}, {
        duration:
          start /
          this.profile.motionSpeed
      })
    }

    timeline.to(mesh.scale, {
      x: 1,
      y: 1,
      duration:
        0.45 /
        this.profile.motionSpeed,
      ease: 'power3.out'
    })

    timeline.to(
      mesh.scale,
      {
        x: 1.05,
        y: 1.05,
        duration: 0.25,
        repeat: 1,
        yoyo: true
      }
    )

    timeline.to(
      material,
      {
        opacity: 0,
        duration: 0.3
      },
      `+=${Math.max(
        0,
        duration - 1
      )}`
    )

    timeline.call(() => {
      this.scene.remove(mesh)

      geometry.dispose()
      material.dispose()
    })
  }

  /*
   * --------------------------------------------------
   * IMAGE
   * --------------------------------------------------
   */

  private createImage(
    instruction: Extract<
      MotionInstruction,
      { type: 'image' }
    >
  ) {
    const loader =
      new THREE.TextureLoader()

    loader.load(
      instruction.url,
      texture => {
        texture.colorSpace =
          THREE.SRGBColorSpace

        const material =
          new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true
          })

        const geometry =
          new THREE.PlaneGeometry(
            500,
            300
          )

        const mesh =
          new THREE.Mesh(
            geometry,
            material
          )

        const position =
          this.getPosition(
            instruction.position
          )

        mesh.position.set(
          position.x,
          position.y,
          5
        )

        const scale =
          instruction.scale ?? 1

        mesh.scale.set(
          0.01,
          0.01,
          0.01
        )

        this.scene.add(mesh)

        const timeline =
          gsap.timeline()

        const start =
          instruction.start ?? 0

        const duration =
          instruction.duration ?? 2

        if (start > 0) {
          timeline.to({}, {
            duration:
              start /
              this.profile.motionSpeed
          })
        }

        timeline.to(
          mesh.scale,
          {
            x: scale,
            y: scale,
            duration:
              0.7 /
              this.profile.motionSpeed,
            ease: 'back.out(1.7)'
          }
        )

        timeline.to(
          material,
          {
            opacity: 0,
            duration: 0.35
          },
          `+=${Math.max(
            0,
            duration - 1
          )}`
        )

        timeline.call(() => {
          this.scene.remove(mesh)

          geometry.dispose()
          material.dispose()
          texture.dispose()
        })
      }
    )
  }

  /*
   * --------------------------------------------------
   * CAMERA ZOOM
   * --------------------------------------------------
   */

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

    const start =
      instruction.start ?? 0

    const duration =
      instruction.duration ?? 1

    const timeline =
      gsap.timeline()

    if (start > 0) {
      timeline.to({}, {
        duration:
          start /
          this.profile.motionSpeed
      })
    }

    timeline.to(
      this.camera,
      {
        zoom: target,
        duration:
          duration /
          this.profile.motionSpeed,
        ease: 'power3.inOut',
        onUpdate: () => {
          this.camera.updateProjectionMatrix()
        }
      }
    )
  }

  /*
   * --------------------------------------------------
   * ANIMATIONS
   * --------------------------------------------------
   */

  private slam(
    timeline: gsap.core.Timeline,
    mesh: THREE.Mesh,
    material: THREE.MeshBasicMaterial
  ) {
    timeline.to(material, {
      opacity: 1,
      duration: 0.08
    })

    timeline.to(mesh.scale, {
      x: 1.3,
      y: 1.3,
      duration:
        0.22 /
        this.profile.motionSpeed,
      ease: 'power4.out'
    })

    timeline.to(mesh.scale, {
      x: 1,
      y: 1,
      duration:
        0.65 /
        this.profile.motionSpeed,
      ease: 'elastic.out(1, 0.45)'
    })
  }

  private fade(
    timeline: gsap.core.Timeline,
    mesh: THREE.Mesh,
    material: THREE.MeshBasicMaterial
  ) {
    mesh.scale.set(
      0.92,
      0.92,
      0.92
    )

    timeline.to(material, {
      opacity: 1,
      duration:
        0.45 /
        this.profile.motionSpeed,
      ease: 'power2.out'
    })

    timeline.to(
      mesh.scale,
      {
        x: 1,
        y: 1,
        duration:
          0.8 /
          this.profile.motionSpeed,
        ease: 'power3.out'
      },
      '<'
    )
  }

  private rise(
    timeline: gsap.core.Timeline,
    mesh: THREE.Mesh,
    material: THREE.MeshBasicMaterial
  ) {
    const targetY =
      mesh.position.y

    mesh.position.y -= 70

    timeline.to(material, {
      opacity: 1,
      duration: 0.2
    })

    timeline.to(
      mesh.position,
      {
        y: targetY,
        duration:
          0.7 /
          this.profile.motionSpeed,
        ease: 'power4.out'
      },
      '<'
    )
  }

  private scale(
    timeline: gsap.core.Timeline,
    mesh: THREE.Mesh,
    material: THREE.MeshBasicMaterial
  ) {
    mesh.scale.set(
      0.3,
      0.3,
      0.3
    )

    timeline.to(material, {
      opacity: 1,
      duration: 0.15
    })

    timeline.to(
      mesh.scale,
      {
        x: 1,
        y: 1,
        duration:
          0.8 /
          this.profile.motionSpeed,
        ease: 'back.out(1.7)'
      },
      '<'
    )
  }

  private pop(
    timeline: gsap.core.Timeline,
    mesh: THREE.Mesh,
    material: THREE.MeshBasicMaterial
  ) {
    mesh.scale.set(
      0.01,
      0.01,
      0.01
    )

    timeline.to(material, {
      opacity: 1,
      duration: 0.05
    })

    timeline.to(
      mesh.scale,
      {
        x: 1.15,
        y: 1.15,
        duration:
          0.25 /
          this.profile.motionSpeed,
        ease: 'power4.out'
      },
      '<'
    )

    timeline.to(mesh.scale, {
      x: 1,
      y: 1,
      duration:
        0.25 /
        this.profile.motionSpeed,
      ease: 'bounce.out'
    })
  }

  private pulse(
    timeline: gsap.core.Timeline,
    mesh: THREE.Mesh,
    material: THREE.MeshBasicMaterial
  ) {
    timeline.to(material, {
      opacity: 1,
      duration: 0.15
    })

    timeline.to(
      mesh.scale,
      {
        x: 1.12,
        y: 1.12,
        duration: 0.25,
        repeat: 2,
        yoyo: true
      }
    )
  }

  private getDefaultAnimation():
    MotionAnimation {
    switch (
      this.profile.animation
    ) {
      case 'minimal':
        return 'fade'

      case 'clean':
        return 'rise'

      case 'playful':
        return 'pop'

      case 'dynamic':
        return 'slam'

      case 'dramatic':
        return 'slam'
    }
  }

  private getPosition(
    position?: MotionPosition
  ) {
    const width =
      this.container.clientWidth

    const height =
      this.container.clientHeight

    const horizontalMargin =
      width * 0.18

    const verticalMargin =
      height * 0.22

    switch (position) {
      case 'top':
        return {
          x: 0,
          y:
            height / 2 -
            verticalMargin
        }

      case 'bottom':
        return {
          x: 0,
          y:
            -height / 2 +
            verticalMargin
        }

      case 'left':
        return {
          x:
            -width / 2 +
            horizontalMargin,
          y: 0
        }

      case 'right':
        return {
          x:
            width / 2 -
            horizontalMargin,
          y: 0
        }

      default:
        return {
          x: 0,
          y: 0
        }
    }
  }

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

  private animate = () => {
    requestAnimationFrame(
      this.animate
    )

    this.renderer.render(
      this.scene,
      this.camera
    )
  }

  destroy() {
    window.removeEventListener(
      'resize',
      this.handleResize
    )

    this.renderer.dispose()

    this.renderer.domElement.remove()
  }
}