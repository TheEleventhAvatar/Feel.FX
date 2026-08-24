// src/motionrenderer.ts

import * as THREE from 'three'
import { gsap } from 'gsap'

type MotionKeyword = {
  word: string
  start: number
  duration?: number
  style?:
    | 'tricolor'
    | 'orbital'
    | 'fire'
    | 'water'
    | 'electric'
    | 'neon'
    | 'nature'
    | 'luxury'
    | 'glitch'
    | 'cinematic'
    | 'explosive'
    | 'minimal'
  animation?:
    | 'flagReveal'
    | 'orbitReveal'
    | 'slamUp'
    | 'waterReveal'
    | 'electricReveal'
    | 'glitchReveal'
    | 'cinematicReveal'
    | 'explodeReveal'
    | 'fade'
}

type MotionEvent = {
  time: number
  endTime: number
  type: string
  event: string
  motion?: {
    type?: string
    animation?: string
  }
  keywords?: MotionKeyword[]
}

export class MotionRenderer {
  private container: HTMLElement

  private scene: THREE.Scene
  private camera: THREE.OrthographicCamera
  private renderer: THREE.WebGLRenderer

  private events: MotionEvent[] = []

  private triggered = new Set<string>()

  private currentTime = 0

  private width = 1
  private height = 1

  constructor(container: HTMLElement) {
    this.container = container

    this.scene = new THREE.Scene()

    this.width = Math.max(
      container.clientWidth,
      1
    )

    this.height = Math.max(
      container.clientHeight,
      1
    )

    this.camera =
      new THREE.OrthographicCamera(
        -this.width / 2,
        this.width / 2,
        this.height / 2,
        -this.height / 2,
        -1000,
        1000
      )

    this.camera.position.z = 100

    this.renderer =
      new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
      })

    this.renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio,
        2
      )
    )

    this.renderer.setSize(
      this.width,
      this.height
    )

    this.renderer.setClearColor(
      0x000000,
      0
    )

    container.innerHTML = ''

    container.appendChild(
      this.renderer.domElement
    )

    window.addEventListener(
      'resize',
      this.handleResize
    )

    this.animate()
  }

  // --------------------------------------------------
  // PUBLIC API
  // --------------------------------------------------

  setEvents(
    events: MotionEvent[]
  ) {
    this.clear()

    this.events = events || []

    this.triggered.clear()
    this.currentTime = 0
  }

  updateVideoTime(
    time: number
  ) {
    const previousTime =
      this.currentTime

    this.currentTime = time

    // Handle seeking backwards.
    if (time < previousTime - 0.15) {
      this.clearVisuals()
      this.triggered.clear()
    }

    for (
      let i = 0;
      i < this.events.length;
      i++
    ) {
      const event =
        this.events[i]

      if (!event) continue

      const eventKey =
        `${i}-${event.time}-${event.type}`

      const start =
        event.time

      const end =
        event.endTime ??
        start + 2

      if (
        time >= start &&
        time <= end &&
        !this.triggered.has(eventKey)
      ) {
        this.triggered.add(eventKey)

        this.renderEvent(
          event
        )
      }
    }
  }

  destroy() {
    window.removeEventListener(
      'resize',
      this.handleResize
    )

    this.clear()

    this.renderer.dispose()

    this.renderer.domElement.remove()
  }

  // --------------------------------------------------
  // EVENT DISPATCH
  // --------------------------------------------------

  private renderEvent(
    event: MotionEvent
  ) {
    const text =
      event.event?.toLowerCase() ||
      ''

    const type =
      event.type?.toLowerCase() ||
      ''

    /*
     * IMPORTANT:
     *
     * These are visual graphics,
     * NOT subtitle rendering.
     */

    if (
      this.isRocketScene(
        text,
        type
      )
    ) {
      this.createRocketFury()
    }

    if (
      this.isBeachScene(
        text,
        type
      )
    ) {
      this.createWaterSplash()
    }

    if (
      this.isIndiaScene(
        text,
        type
      )
    ) {
      this.createTricolorBurst()
    }

    if (
      this.isExplosionScene(
        text,
        type
      )
    ) {
      this.createExplosion()
    }

    if (
      this.isMusicScene(
        text,
        type
      )
    ) {
      this.createMusicEnergy()
    }

    /*
     * Render selectively important
     * keywords.
     */
    if (
      event.keywords &&
      event.keywords.length
    ) {
      event.keywords.forEach(
        keyword => {
          this.renderKeyword(
            keyword
          )
        }
      )
    }
  }

  // --------------------------------------------------
  // KEYWORD GRAPHICS
  // --------------------------------------------------

  private renderKeyword(
    keyword: MotionKeyword
  ) {
    const word =
      keyword.word
        .trim()
        .toUpperCase()

    if (!word) return

    /*
     * Never render generic filler words.
     */
    if (
      this.isFillerWord(word)
    ) {
      return
    }

    const style =
      keyword.style ||
      this.inferKeywordStyle(
        word
      )

    switch (style) {
      case 'tricolor':
        this.createTricolorText(
          word,
          keyword
        )
        break

      case 'orbital':
        this.createOrbitalText(
          word,
          keyword
        )
        break

      case 'fire':
      case 'explosive':
        this.createFireText(
          word,
          keyword
        )
        break

      case 'water':
        this.createWaterText(
          word,
          keyword
        )
        break

      case 'electric':
        this.createElectricText(
          word,
          keyword
        )
        break

      case 'glitch':
        this.createGlitchText(
          word,
          keyword
        )
        break

      case 'neon':
        this.createNeonText(
          word,
          keyword
        )
        break

      default:
        this.createCinematicText(
          word,
          keyword
        )
    }
  }

  // --------------------------------------------------
  // INDIA / TRICOLOR
  // --------------------------------------------------

  private createTricolorText(
    word: string,
    keyword: MotionKeyword
  ) {
    const group =
      new THREE.Group()

    const width =
      Math.max(
        300,
        word.length * 55
      )

    const height = 90

    const canvas =
      document.createElement(
        'canvas'
      )

    canvas.width = 1600
    canvas.height = 300

    const ctx =
      canvas.getContext('2d')

    if (!ctx) return

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    )

    ctx.font =
      '900 180px Arial'

    ctx.textAlign =
      'center'

    ctx.textBaseline =
      'middle'

    // Saffron
    ctx.save()

    ctx.beginPath()

    ctx.rect(
      0,
      0,
      canvas.width,
      canvas.height / 3
    )

    ctx.clip()

    ctx.fillStyle =
      '#FF9933'

    ctx.fillText(
      word,
      canvas.width / 2,
      canvas.height / 2
    )

    ctx.restore()

    // White
    ctx.save()

    ctx.beginPath()

    ctx.rect(
      0,
      canvas.height / 3,
      canvas.width,
      canvas.height / 3
    )

    ctx.clip()

    ctx.fillStyle =
      '#FFFFFF'

    ctx.fillText(
      word,
      canvas.width / 2,
      canvas.height / 2
    )

    ctx.restore()

    // Green
    ctx.save()

    ctx.beginPath()

    ctx.rect(
      0,
      canvas.height * 2 / 3,
      canvas.width,
      canvas.height / 3
    )

    ctx.clip()

    ctx.fillStyle =
      '#138808'

    ctx.fillText(
      word,
      canvas.width / 2,
      canvas.height / 2
    )

    ctx.restore()

    // Ashoka Chakra
    ctx.strokeStyle =
      '#000080'

    ctx.lineWidth = 7

    ctx.beginPath()

    ctx.arc(
      canvas.width / 2,
      canvas.height / 2,
      42,
      0,
      Math.PI * 2
    )

    ctx.stroke()

    for (
      let i = 0;
      i < 24;
      i++
    ) {
      const angle =
        (i / 24) *
        Math.PI *
        2

      ctx.beginPath()

      ctx.moveTo(
        canvas.width / 2,
        canvas.height / 2
      )

      ctx.lineTo(
        canvas.width / 2 +
          Math.cos(angle) * 42,
        canvas.height / 2 +
          Math.sin(angle) * 42
      )

      ctx.stroke()
    }

    const texture =
      new THREE.CanvasTexture(
        canvas
      )

    texture.colorSpace =
      THREE.SRGBColorSpace

    const material =
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthTest: false
      })

    const geometry =
      new THREE.PlaneGeometry(
        width,
        height
      )

    const mesh =
      new THREE.Mesh(
        geometry,
        material
      )

    mesh.position.set(
      0,
      0,
      50
    )

    group.add(mesh)

    // Tricolor particles
    for (
      let i = 0;
      i < 35;
      i++
    ) {
      const particle =
        new THREE.Mesh(
          new THREE.CircleGeometry(
            2 + Math.random() * 5,
            8
          ),
          new THREE.MeshBasicMaterial({
            color:
              i % 3 === 0
                ? 0xff9933
                : i % 3 === 1
                  ? 0xffffff
                  : 0x138808,
            transparent: true
          })
        )

      particle.position.set(
        (Math.random() - 0.5) *
          900,
        (Math.random() - 0.5) *
          180,
        49
      )

      group.add(
        particle
      )

      gsap.fromTo(
        particle.position,
        {
          y:
            particle.position.y -
            80,
          x:
            particle.position.x -
            30
        },
        {
          y:
            particle.position.y +
            100,
          x:
            particle.position.x +
            30,
          duration:
            1.2 +
            Math.random(),
          ease: 'power2.out'
        }
      )

      gsap.to(
        particle.material,
        {
          opacity: 0,
          duration: 1.5
        }
      )
    }

    group.scale.set(
      0.05,
      0.05,
      0.05
    )

    this.scene.add(
      group
    )

    gsap.to(
      group.scale,
      {
        x: 1,
        y: 1,
        duration: 0.65,
        ease: 'back.out(2)'
      }
    )

    gsap.fromTo(
      group.rotation,
      {
        z:
          -0.08
      },
      {
        z: 0,
        duration: 0.7,
        ease: 'power3.out'
      }
    )

    gsap.to(
      group,
      {
        alpha: 0,
        delay:
          Math.max(
            0.5,
            (keyword.duration ??
              2) -
              0.5
          ),
        duration: 0.5,
        onComplete: () =>
          this.removeObject(
            group
          )
      }
    )
  }

  // --------------------------------------------------
  // ORBITAL
  // --------------------------------------------------

  private createOrbitalText(
    word: string,
    keyword: MotionKeyword
  ) {
    const group =
      this.createTextMesh(
        word,
        0xffffff
      )

    const ring =
      new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(
          new THREE.EllipseCurve(
            0,
            0,
            210,
            65,
            0,
            Math.PI * 2,
            false,
            0
          ).getPoints(80)
        ),
        new THREE.LineBasicMaterial({
          color: 0x66ccff,
          transparent: true,
          opacity: 0.8
        })
      )

    group.add(
      ring
    )

    this.scene.add(
      group
    )

    group.scale.set(
      0,
      0,
      0
    )

    gsap.to(
      group.scale,
      {
        x: 1,
        y: 1,
        duration: 0.8,
        ease: 'back.out(1.7)'
      }
    )

    gsap.to(
      ring.rotation,
      {
        z:
          Math.PI * 2,
        duration: 2,
        repeat: -1,
        ease: 'none'
      }
    )

    this.fadeOut(
      group,
      keyword.duration ??
        2
    )
  }

  // --------------------------------------------------
  // FIRE
  // --------------------------------------------------

  private createFireText(
    word: string,
    keyword: MotionKeyword
  ) {
    const group =
      this.createTextMesh(
        word,
        0xffffff
      )

    this.scene.add(
      group
    )

    group.scale.set(
      2.5,
      0.15,
      1
    )

    group.position.y =
      -80

    gsap.to(
      group.scale,
      {
        x: 1,
        y: 1,
        duration: 0.35,
        ease: 'power4.out'
      }
    )

    gsap.to(
      group.position,
      {
        y: 0,
        duration: 0.45,
        ease: 'power4.out'
      }
    )

    // Fire streaks
    for (
      let i = 0;
      i < 25;
      i++
    ) {
      const streak =
        new THREE.Mesh(
          new THREE.PlaneGeometry(
            5,
            50 +
              Math.random() * 100
          ),
          new THREE.MeshBasicMaterial({
            color:
              Math.random() > 0.5
                ? 0xff4d00
                : 0xffcc00,
            transparent: true
          })
        )

      streak.position.set(
        (Math.random() - 0.5) *
          600,
        -150 -
          Math.random() * 150,
        45
      )

      this.scene.add(
        streak
      )

      gsap.to(
        streak.position,
        {
          y: 300,
          duration:
            0.4 +
            Math.random() * 0.5,
          ease: 'power4.out',
          onComplete: () =>
            this.removeObject(
              streak
            )
        }
      )

      gsap.to(
        streak.material,
        {
          opacity: 0,
          duration: 0.5
        }
      )
    }

    this.fadeOut(
      group,
      keyword.duration ??
        2
    )
  }

  // --------------------------------------------------
  // WATER
  // --------------------------------------------------

  private createWaterText(
    word: string,
    keyword: MotionKeyword
  ) {
    const group =
      this.createTextMesh(
        word,
        0xb9f4ff
      )

    this.scene.add(
      group
    )

    group.position.y =
      -80

    group.scale.set(
      0.6,
      1.4,
      1
    )

    gsap.to(
      group.position,
      {
        y: 0,
        duration: 0.8,
        ease: 'elastic.out(1,0.4)'
      }
    )

    gsap.to(
      group.scale,
      {
        x: 1,
        y: 1,
        duration: 0.8,
        ease: 'power3.out'
      }
    )

    this.fadeOut(
      group,
      keyword.duration ??
        2
    )
  }

  // --------------------------------------------------
  // ELECTRIC
  // --------------------------------------------------

  private createElectricText(
    word: string,
    keyword: MotionKeyword
  ) {
    const group =
      this.createTextMesh(
        word,
        0x8bdcff
      )

    this.scene.add(
      group
    )

    group.scale.set(
      0.01,
      0.01,
      0.01
    )

    gsap.to(
      group.scale,
      {
        x: 1,
        y: 1,
        duration: 0.25,
        ease: 'power4.out'
      }
    )

    const flashes = 5

    for (
      let i = 0;
      i < flashes;
      i++
    ) {
      gsap.to(
        group,
        {
          visible:
            i % 2 === 0,
          delay:
            i * 0.08,
          duration: 0.05
        }
      )
    }

    this.fadeOut(
      group,
      keyword.duration ??
        2
    )
  }

  // --------------------------------------------------
  // GLITCH
  // --------------------------------------------------

  private createGlitchText(
    word: string,
    keyword: MotionKeyword
  ) {
    const group =
      this.createTextMesh(
        word,
        0xffffff
      )

    this.scene.add(
      group
    )

    group.position.x =
      -100

    gsap.to(
      group.position,
      {
        x: 0,
        duration: 0.35,
        ease: 'power4.out'
      }
    )

    for (
      let i = 0;
      i < 8;
      i++
    ) {
      gsap.to(
        group.position,
        {
          x:
            (Math.random() -
              0.5) *
            40,
          delay:
            0.05 +
            i * 0.06,
          duration: 0.03
        }
      )
    }

    this.fadeOut(
      group,
      keyword.duration ??
        2
    )
  }

  // --------------------------------------------------
  // NEON
  // --------------------------------------------------

  private createNeonText(
    word: string,
    keyword: MotionKeyword
  ) {
    const group =
      this.createTextMesh(
        word,
        0x00ffff
      )

    this.scene.add(
      group
    )

    const material =
      group.children[0] instanceof
      THREE.Mesh
        ? group.children[0]
            .material as THREE.MeshBasicMaterial
        : null

    if (material) {
      material.opacity = 0
    }

    if (material) {
      gsap.to(
        material,
        {
          opacity: 1,
          duration: 0.5
        }
      )
    }

    gsap.to(
      group.scale,
      {
        x: 1.08,
        y: 1.08,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      }
    )

    this.fadeOut(
      group,
      keyword.duration ??
        2
    )
  }

  // --------------------------------------------------
  // CINEMATIC
  // --------------------------------------------------

  private createCinematicText(
    word: string,
    keyword: MotionKeyword
  ) {
    const group =
      this.createTextMesh(
        word,
        0xffffff
      )

    this.scene.add(
      group
    )

    group.position.y =
      -70

    group.scale.set(
      0.85,
      0.85,
      0.85
    )

    gsap.to(
      group.position,
      {
        y: 0,
        duration: 0.7,
        ease: 'power3.out'
      }
    )

    gsap.to(
      group.scale,
      {
        x: 1,
        y: 1,
        duration: 0.7,
        ease: 'power3.out'
      }
    )

    this.fadeOut(
      group,
      keyword.duration ??
        2
    )
  }

  // --------------------------------------------------
  // ROCKET
  // --------------------------------------------------

  private createRocketFury() {
    const group =
      new THREE.Group()

    /*
     * Speed lines.
     */
    for (
      let i = 0;
      i < 45;
      i++
    ) {
      const line =
        new THREE.Mesh(
          new THREE.PlaneGeometry(
            3,
            80 +
              Math.random() * 180
          ),
          new THREE.MeshBasicMaterial({
            color:
              i % 3 === 0
                ? 0xff5a00
                : 0xffffff,
            transparent: true,
            opacity: 0
          })
        )

      line.position.set(
        (Math.random() - 0.5) *
          this.width,
        (Math.random() - 0.5) *
          this.height,
        20
      )

      group.add(
        line
      )

      gsap.to(
        line.material,
        {
          opacity: 0.8,
          duration: 0.1,
          delay:
            Math.random() *
            0.4
        }
      )

      gsap.to(
        line.position,
        {
          y:
            line.position.y +
            500,
          duration:
            0.4 +
            Math.random() *
              0.5,
          repeat: 2,
          ease: 'power4.in'
        }
      )
    }

    /*
     * Camera shake.
     */
    const originalX =
      this.camera.position.x

    const originalY =
      this.camera.position.y

    gsap.to(
      this.camera.position,
      {
        x:
          originalX +
          8,
        y:
          originalY +
          5,
        duration: 0.05,
        repeat: 8,
        yoyo: true,
        ease: 'none',
        onComplete: () => {
          this.camera.position.x =
            originalX

          this.camera.position.y =
            originalY
        }
      }
    )

    this.scene.add(
      group
    )

    gsap.delayedCall(
      2.5,
      () =>
        this.removeObject(
          group
        )
    )
  }

  // --------------------------------------------------
  // BEACH
  // --------------------------------------------------

  private createWaterSplash() {
    const group =
      new THREE.Group()

    for (
      let i = 0;
      i < 40;
      i++
    ) {
      const particle =
        new THREE.Mesh(
          new THREE.CircleGeometry(
            2 +
              Math.random() * 5,
            8
          ),
          new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
          })
        )

      particle.position.set(
        (Math.random() - 0.5) *
          400,
        -100,
        25
      )

      group.add(
        particle
      )

      gsap.to(
        particle.position,
        {
          x:
            particle.position.x +
            (Math.random() - 0.5) *
              250,
          y:
            particle.position.y +
            80 +
            Math.random() *
              180,
          duration:
            0.8 +
            Math.random() *
              0.6,
          ease: 'power2.out'
        }
      )

      gsap.to(
        particle.material,
        {
          opacity: 0,
          duration: 1
        }
      )
    }

    this.scene.add(
      group
    )

    gsap.delayedCall(
      1.5,
      () =>
        this.removeObject(
          group
        )
    )
  }

  // --------------------------------------------------
  // INDIA VISUAL
  // --------------------------------------------------

  private createTricolorBurst() {
    const group =
      new THREE.Group()

    const colors = [
      0xff9933,
      0xffffff,
      0x138808
    ]

    for (
      let i = 0;
      i < 60;
      i++
    ) {
      const particle =
        new THREE.Mesh(
          new THREE.CircleGeometry(
            2 +
              Math.random() * 4,
            8
          ),
          new THREE.MeshBasicMaterial({
            color:
              colors[
                i % 3
              ],
            transparent: true
          })
        )

      particle.position.set(
        0,
        0,
        30
      )

      group.add(
        particle
      )

      const angle =
        Math.random() *
        Math.PI *
        2

      const distance =
        200 +
        Math.random() *
          450

      gsap.to(
        particle.position,
        {
          x:
            Math.cos(angle) *
            distance,
          y:
            Math.sin(angle) *
            distance,
          duration:
            0.8 +
            Math.random() *
              0.7,
          ease: 'power3.out'
        }
      )

      gsap.to(
        particle.material,
        {
          opacity: 0,
          duration: 1.2
        }
      )
    }

    this.scene.add(
      group
    )

    gsap.delayedCall(
      1.5,
      () =>
        this.removeObject(
          group
        )
    )
  }

  // --------------------------------------------------
  // EXPLOSION
  // --------------------------------------------------

  private createExplosion() {
    const group =
      new THREE.Group()

    const ring =
      new THREE.Mesh(
        new THREE.RingGeometry(
          20,
          30,
          64
        ),
        new THREE.MeshBasicMaterial({
          color: 0xff6a00,
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide
        })
      )

    group.add(
      ring
    )

    this.scene.add(
      group
    )

    group.scale.set(
      0.1,
      0.1,
      0.1
    )

    gsap.to(
      group.scale,
      {
        x: 12,
        y: 12,
        duration: 0.7,
        ease: 'power4.out'
      }
    )

    gsap.to(
      ring.material,
      {
        opacity: 0,
        duration: 0.7,
        onComplete: () =>
          this.removeObject(
            group
          )
      }
    )
  }

  // --------------------------------------------------
  // MUSIC
  // --------------------------------------------------

  private createMusicEnergy() {
    const group =
      new THREE.Group()

    for (
      let i = 0;
      i < 24;
      i++
    ) {
      const bar =
        new THREE.Mesh(
          new THREE.PlaneGeometry(
            8,
            100
          ),
          new THREE.MeshBasicMaterial({
            color:
              0xffffff,
            transparent: true,
            opacity: 0.7
          })
        )

      bar.position.x =
        (i - 12) * 30

      bar.position.y =
        -100

      group.add(
        bar
      )

      gsap.to(
        bar.scale,
        {
          y:
            0.3 +
            Math.random() * 2,
          duration:
            0.25 +
            Math.random() *
              0.2,
          repeat: 4,
          yoyo: true,
          ease: 'sine.inOut'
        }
      )
    }

    this.scene.add(
      group
    )

    gsap.delayedCall(
      2,
      () =>
        this.removeObject(
          group
        )
    )
  }

  // --------------------------------------------------
  // TEXT CREATION
  // --------------------------------------------------

  private createTextMesh(
    word: string,
    color: number
  ) {
    const canvas =
      document.createElement(
        'canvas'
      )

    canvas.width = 1600
    canvas.height = 300

    const ctx =
      canvas.getContext('2d')!

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    )

    ctx.font =
      '900 180px Arial'

    ctx.textAlign =
      'center'

    ctx.textBaseline =
      'middle'

    ctx.shadowColor =
      'rgba(0,0,0,0.7)'

    ctx.shadowBlur = 30

    ctx.shadowOffsetY = 12

    ctx.fillStyle =
      `#${color
        .toString(16)
        .padStart(6, '0')}`

    ctx.fillText(
      word,
      canvas.width / 2,
      canvas.height / 2
    )

    const texture =
      new THREE.CanvasTexture(
        canvas
      )

    texture.colorSpace =
      THREE.SRGBColorSpace

    const material =
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthTest: false
      })

    const geometry =
      new THREE.PlaneGeometry(
        Math.max(
          300,
          word.length * 55
        ),
        90
      )

    const mesh =
      new THREE.Mesh(
        geometry,
        material
      )

    const group =
      new THREE.Group()

    group.add(
      mesh
    )

    group.position.set(
      0,
      0,
      60
    )

    return group
  }

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------

  private inferKeywordStyle(
    word: string
  ): MotionKeyword['style'] {
    if (
      /INDIA|BHARAT|INDIAN|ISRO/.test(
        word
      )
    ) {
      return 'tricolor'
    }

    if (
      /CHANDRAYAAN|MOON|LUNAR|SPACE|SATELLITE|ORBIT/.test(
        word
      )
    ) {
      return 'orbital'
    }

    if (
      /ROCKET|LAUNCH|BLAST|FIRE|EXPLOSION|FURY/.test(
        word
      )
    ) {
      return 'fire'
    }

    if (
      /BEACH|OCEAN|SEA|WAVE|SURF|WATER/.test(
        word
      )
    ) {
      return 'water'
    }

    if (
      /POWER|ELECTRIC|ENERGY|VOLT/.test(
        word
      )
    ) {
      return 'electric'
    }

    if (
      /AI|TECH|DIGITAL|CODE|SOFTWARE/.test(
        word
      )
    ) {
      return 'glitch'
    }

    if (
      /MUSIC|BEAT|BASS|DANCE/.test(
        word
      )
    ) {
      return 'neon'
    }

    return 'cinematic'
  }

  private isFillerWord(
    word: string
  ) {
    const filler =
      new Set([
        'THE',
        'A',
        'AN',
        'AND',
        'OR',
        'BUT',
        'IS',
        'ARE',
        'WAS',
        'WERE',
        'TO',
        'OF',
        'IN',
        'ON',
        'FOR',
        'WITH',
        'THIS',
        'THAT',
        'IT',
        'HE',
        'SHE',
        'THEY',
        'WE',
        'YOU',
        'I',
        'HAS',
        'HAVE',
        'HAD',
        'BE',
        'BEEN',
        'FROM',
        'AS',
        'AT',
        'BY',
        'NOT'
      ])

    return (
      filler.has(word) ||
      word.length < 3
    )
  }

  private isRocketScene(
    text: string,
    type: string
  ) {
    return /rocket|launch|liftoff|spacecraft|missile|blast/.test(
      `${text} ${type}`
    )
  }

  private isBeachScene(
    text: string,
    type: string
  ) {
    return /beach|ocean|sea|wave|surf|water/.test(
      `${text} ${type}`
    )
  }

  private isIndiaScene(
    text: string,
    type: string
  ) {
    return /india|indian|bharat|flag|isro/.test(
      `${text} ${type}`
    )
  }

  private isExplosionScene(
    text: string,
    type: string
  ) {
    return /explosion|explode|blast|impact|boom/.test(
      `${text} ${type}`
    )
  }

  private isMusicScene(
    text: string,
    type: string
  ) {
    return /music|song|beat|bass|concert|dance/.test(
      `${text} ${type}`
    )
  }

  private fadeOut(
    object: THREE.Object3D,
    duration: number
  ) {
    gsap.to(
      object,
      {
        alpha: 0,
        delay:
          Math.max(
            0.3,
            duration - 0.6
          ),
        duration: 0.6,
        onComplete: () =>
          this.removeObject(
            object
          )
      }
    )
  }

  private removeObject(
    object: THREE.Object3D
  ) {
    object.traverse(
      child => {
        if (
          child instanceof
          THREE.Mesh
        ) {
          const material =
            child.material

          if (
            material instanceof
            THREE.Material
          ) {
            material.dispose()

            const map =
              (
                material as THREE.MeshBasicMaterial
              ).map

            if (map) {
              map.dispose()
            }
          }

          child.geometry.dispose()
        }
      }
    )

    object.removeFromParent()

    gsap.killTweensOf(
      object
    )
  }

  private clearVisuals() {
    for (
      const object of [
        ...this.scene.children
      ]
    ) {
      this.removeObject(
        object
      )
    }
  }

  private clear() {
    this.clearVisuals()

    this.triggered.clear()
  }

  // --------------------------------------------------
  // RESIZE
  // --------------------------------------------------

  private handleResize =
    () => {
      this.width =
        Math.max(
          this.container.clientWidth,
          1
        )

      this.height =
        Math.max(
          this.container.clientHeight,
          1
        )

      this.camera.left =
        -this.width / 2

      this.camera.right =
        this.width / 2

      this.camera.top =
        this.height / 2

      this.camera.bottom =
        -this.height / 2

      this.camera.updateProjectionMatrix()

      this.renderer.setSize(
        this.width,
        this.height
      )
    }

  private animate =
    () => {
      requestAnimationFrame(
        this.animate
      )

      this.renderer.render(
        this.scene,
        this.camera
      )
    }
}