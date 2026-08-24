export type DetectedFeel =
  | 'corporate'
  | 'educational'
  | 'casual'
  | 'travel'
  | 'music'
  | 'cinematic'
  | 'energetic'

export type VideoAnalysis = {
  feel: DetectedFeel
  confidence: number

  transcript: string

  audio: {
    energy: number
    tempo: number
    speech: boolean
    music: boolean
  }

  visual: {
    brightness: number
    contrast: number
    motion: number
    sceneChanges: number
  }

  reasoning: string[]
}

export class FeelAnalyzer {
  private video: HTMLVideoElement

  private audioContext:
    | AudioContext
    | null = null

  private analyser:
    | AnalyserNode
    | null = null

  private audioData:
    | Uint8Array<ArrayBuffer>
    | null = null

  private previousFrame:
    | Uint8ClampedArray
    | null = null

  private frameCanvas =
    document.createElement('canvas')

  private frameContext =
    this.frameCanvas.getContext('2d', {
      willReadFrequently: true
    })

  constructor(video: HTMLVideoElement) {
    this.video = video
  }

  async analyze(
    transcript = ''
  ): Promise<VideoAnalysis> {
    await this.setupAudio()

    const audio =
      await this.analyzeAudio()

    const visual =
      await this.analyzeVisuals()

    const feel =
      this.detectFeel(
        transcript,
        audio,
        visual
      )

    return {
      feel: feel.type,
      confidence: feel.confidence,
      transcript,
      audio,
      visual,
      reasoning: feel.reasoning
    }
  }

  private async setupAudio() {
    if (this.audioContext) {
      return
    }

    try {
      this.audioContext =
        new AudioContext()

      const source =
        this.audioContext.createMediaElementSource(
          this.video
        )

      this.analyser =
        this.audioContext.createAnalyser()

      this.analyser.fftSize = 1024

      this.analyser.smoothingTimeConstant =
        0.8

      source.connect(this.analyser)

      this.analyser.connect(
        this.audioContext.destination
      )

      this.audioData =
        new Uint8Array(
          this.analyser.frequencyBinCount
        )
    } catch {
      this.audioContext = null
      this.analyser = null
      this.audioData = null
    }
  }

  private async analyzeAudio() {
    if (
      !this.analyser ||
      !this.audioData
    ) {
      return {
        energy: 0,
        tempo: 0,
        speech: false,
        music: false
      }
    }

    if (
      this.audioContext?.state ===
      'suspended'
    ) {
      await this.audioContext.resume()
    }

    const samples: number[] = []

    const sampleCount = 20

    for (
      let i = 0;
      i < sampleCount;
      i++
    ) {
      await new Promise(resolve =>
        setTimeout(resolve, 80)
      )

      this.analyser.getByteFrequencyData(
        this.audioData
      )

      let sum = 0

      for (
        let j = 0;
        j < this.audioData.length;
        j++
      ) {
        sum += this.audioData[j]
      }

      const energy =
        sum /
        this.audioData.length /
        255

      samples.push(energy)
    }

    const energy =
      samples.reduce(
        (a, b) => a + b,
        0
      ) / samples.length

    let changes = 0

    for (
      let i = 1;
      i < samples.length;
      i++
    ) {
      if (
        Math.abs(
          samples[i] -
            samples[i - 1]
        ) > 0.08
      ) {
        changes++
      }
    }

    const tempo =
      Math.min(
        180,
        changes * 9
      )

    const music =
      energy > 0.12 &&
      changes > 3

    const speech =
      energy > 0.015 &&
      changes < 14

    return {
      energy,
      tempo,
      speech,
      music
    }
  }

  private async analyzeVisuals() {
    const width = 320
    const height = 180

    this.frameCanvas.width =
      width

    this.frameCanvas.height =
      height

    if (!this.frameContext) {
      return {
        brightness: 0,
        contrast: 0,
        motion: 0,
        sceneChanges: 0
      }
    }

    const duration =
      this.video.duration

    if (
      !Number.isFinite(duration) ||
      duration <= 0
    ) {
      return {
        brightness: 0,
        contrast: 0,
        motion: 0,
        sceneChanges: 0
      }
    }

    const sampleCount =
      Math.min(
        24,
        Math.max(
          8,
          Math.floor(
            duration * 2
          )
        )
      )

    const brightnessSamples: number[] = []
    const motionSamples: number[] = []

    let sceneChanges = 0

    for (
      let i = 0;
      i < sampleCount;
      i++
    ) {
      const time =
        (duration *
          i) /
        (sampleCount - 1)

      await this.seek(time)

      this.frameContext.drawImage(
        this.video,
        0,
        0,
        width,
        height
      )

      const image =
        this.frameContext.getImageData(
          0,
          0,
          width,
          height
        )

      const pixels =
        image.data

      let brightness = 0

      for (
        let p = 0;
        p < pixels.length;
        p += 4
      ) {
        const r = pixels[p]
        const g = pixels[p + 1]
        const b = pixels[p + 2]

        brightness +=
          0.299 * r +
          0.587 * g +
          0.114 * b
      }

      brightness /=
        pixels.length / 4

      brightnessSamples.push(
        brightness / 255
      )

      if (this.previousFrame) {
        let difference = 0

        const previous =
          this.previousFrame

        for (
          let p = 0;
          p < pixels.length;
          p += 16
        ) {
          difference +=
            Math.abs(
              pixels[p] -
                previous[p]
            )
        }

        const motion =
          difference /
          (pixels.length / 16) /
          255

        motionSamples.push(
          motion
        )

        if (motion > 0.28) {
          sceneChanges++
        }
      }

      this.previousFrame =
        new Uint8ClampedArray(
          pixels
        )
    }

    const brightness =
      brightnessSamples.reduce(
        (a, b) => a + b,
        0
      ) /
      brightnessSamples.length

    const motion =
      motionSamples.length
        ? motionSamples.reduce(
            (a, b) => a + b,
            0
          ) /
          motionSamples.length
        : 0

    const average =
      brightnessSamples.reduce(
        (a, b) => a + b,
        0
      ) /
      brightnessSamples.length

    const contrast =
      Math.sqrt(
        brightnessSamples.reduce(
          (sum, value) =>
            sum +
            Math.pow(
              value - average,
              2
            ),
          0
        ) /
          brightnessSamples.length
      )

    return {
      brightness,
      contrast,
      motion,
      sceneChanges
    }
  }

  private seek(
    time: number
  ): Promise<void> {
    return new Promise(resolve => {
      const handler = () => {
        this.video.removeEventListener(
          'seeked',
          handler
        )

        resolve()
      }

      this.video.addEventListener(
        'seeked',
        handler
      )

      this.video.currentTime =
        Math.min(
          time,
          Math.max(
            0,
            this.video.duration -
              0.05
          )
        )
    })
  }

  private detectFeel(
    transcript: string,
    audio: {
      energy: number
      tempo: number
      speech: boolean
      music: boolean
    },
    visual: {
      brightness: number
      contrast: number
      motion: number
      sceneChanges: number
    }
  ) {
    const text =
      transcript.toLowerCase()

    const scores: Record<
      DetectedFeel,
      number
    > = {
      corporate: 0,
      educational: 0,
      casual: 0,
      travel: 0,
      music: 0,
      cinematic: 0,
      energetic: 0
    }

    const reasoning: string[] = []

    this.addKeywordScore(
      scores,
      text,
      'corporate',
      [
        'business',
        'company',
        'enterprise',
        'startup',
        'revenue',
        'strategy',
        'product',
        'customer',
        'market',
        'growth',
        'professional',
        'team',
        'investment'
      ],
      5
    )

    this.addKeywordScore(
      scores,
      text,
      'educational',
      [
        'learn',
        'lesson',
        'tutorial',
        'explain',
        'education',
        'course',
        'how to',
        'because',
        'concept',
        'example',
        'science',
        'math',
        'understand'
      ],
      5
    )

    this.addKeywordScore(
      scores,
      text,
      'casual',
      [
        'guys',
        'literally',
        'honestly',
        'today',
        'story',
        'fun',
        'crazy',
        'vlog',
        'day',
        'life'
      ],
      4
    )

    this.addKeywordScore(
      scores,
      text,
      'travel',
      [
        'travel',
        'trip',
        'beach',
        'mountain',
        'hotel',
        'flight',
        'vacation',
        'destination',
        'explore',
        'adventure',
        'city',
        'ocean'
      ],
      6
    )

    this.addKeywordScore(
      scores,
      text,
      'music',
      [
        'music',
        'song',
        'beat',
        'bass',
        'dj',
        'concert',
        'dance',
        'melody',
        'rhythm',
        'track'
      ],
      7
    )

    if (audio.music) {
      scores.music += 12

      reasoning.push(
        'Detected strong rhythmic audio'
      )
    }

    if (audio.tempo > 90) {
      scores.energetic +=
        6

      reasoning.push(
        'Audio has high rhythmic activity'
      )
    }

    if (audio.energy > 0.35) {
      scores.energetic +=
        5

      reasoning.push(
        'Audio energy is high'
      )
    }

    if (
      visual.motion > 0.18
    ) {
      scores.energetic +=
        5

      scores.music += 2

      reasoning.push(
        'Video contains substantial visual motion'
      )
    }

    if (
      visual.sceneChanges >= 5
    ) {
      scores.energetic +=
        4

      scores.cinematic +=
        3

      reasoning.push(
        'Frequent scene changes detected'
      )
    }

    if (
      visual.contrast > 0.18
    ) {
      scores.cinematic +=
        4

      reasoning.push(
        'High visual contrast detected'
      )
    }

    if (
      visual.brightness > 0.65 &&
      visual.motion > 0.12
    ) {
      scores.travel += 3

      reasoning.push(
        'Bright dynamic visuals suggest travel/lifestyle footage'
      )
    }

    if (audio.speech) {
      scores.educational += 2
      scores.corporate += 2
      scores.casual += 2

      reasoning.push(
        'Speech detected'
      )
    }

    if (
      audio.music &&
      audio.speech
    ) {
      scores.casual += 2
      scores.travel += 2
    }

    let bestType:
      DetectedFeel =
      'cinematic'

    let bestScore = -Infinity

    for (
      const type of Object.keys(
        scores
      ) as DetectedFeel[]
    ) {
      if (
        scores[type] >
        bestScore
      ) {
        bestScore =
          scores[type]

        bestType = type
      }
    }

    const total =
      Object.values(scores).reduce(
        (a, b) => a + b,
        0
      )

    const confidence =
      total > 0
        ? Math.min(
            0.98,
            Math.max(
              0.35,
              bestScore / total
            )
          )
        : 0.35

    if (
      reasoning.length === 0
    ) {
      reasoning.push(
        'No dominant semantic or audiovisual signal detected'
      )
    }

    return {
      type: bestType,
      confidence,
      reasoning
    }
  }

  private addKeywordScore(
    scores: Record<
      DetectedFeel,
      number
    >,
    text: string,
    type: DetectedFeel,
    keywords: string[],
    points: number
  ) {
    for (
      const keyword of keywords
    ) {
      if (
        text.includes(keyword)
      ) {
        scores[type] += points
      }
    }
  }

  destroy() {
    this.audioContext?.close()

    this.audioContext = null
    this.analyser = null
    this.audioData = null
  }
}