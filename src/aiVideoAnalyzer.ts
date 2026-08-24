import {
  pipeline,
  env
} from '@huggingface/transformers'

env.allowLocalModels = false

type AnalyzerPipeline = (
  input: any,
  options?: any
) => Promise<any>

type ASRPipeline = AnalyzerPipeline
type VisionPipeline = AnalyzerPipeline

export type AIAnalysis = {
  transcript: string

  visualDescriptions: string[]

  feel:
    | 'corporate'
    | 'educational'
    | 'casual'
    | 'travel'
    | 'music'
    | 'cinematic'
    | 'energetic'

  confidence: number

  signals: {
    speech: boolean
    music: boolean
    people: boolean
    presentation: boolean
    outdoor: boolean
    nature: boolean
    city: boolean
    product: boolean
    textHeavy: boolean
  }

  reasoning: string[]
}

export class AIVideoAnalyzer {
  private transcriber: ASRPipeline | null = null

  private vision: VisionPipeline | null = null

  private loading = false

  private canvas =
    document.createElement('canvas')

  private context =
    this.canvas.getContext('2d', {
      willReadFrequently: true
    })

  async loadModels(
    onProgress?: (
      message: string
    ) => void
  ) {
    if (this.loading) return

    if (
      this.transcriber &&
      this.vision
    ) {
      return
    }

    this.loading = true

    try {
      onProgress?.(
        'Loading local speech model…'
      )

      this.transcriber =
        await pipeline(
          'automatic-speech-recognition',
          'onnx-community/whisper-tiny.en',
          {
            device:
              'webgpu'
          } as any
        )

      onProgress?.(
        'Loading local vision model…'
      )

      this.vision =
        await pipeline(
          'image-to-text',
          'Xenova/vit-gpt2-image-captioning',
          {
            device:
              'webgpu'
          } as any
        )

      onProgress?.(
        'AI models ready'
      )
    } finally {
      this.loading = false
    }
  }

  async analyze(
    video: HTMLVideoElement,
    onProgress?: (
      message: string
    ) => void
  ): Promise<AIAnalysis> {
    await this.loadModels(
      onProgress
    )

    if (!this.transcriber) {
      throw new Error(
        'Speech model failed to load.'
      )
    }

    if (!this.vision) {
      throw new Error(
        'Vision model failed to load.'
      )
    }

    onProgress?.(
      'Extracting audio…'
    )

    const audio =
      await this.extractAudio(
        video
      )

    onProgress?.(
      'Transcribing speech locally…'
    )

    const transcript =
      await this.transcribe(
        audio,
        onProgress
      )

    onProgress?.(
      'Sampling video frames…'
    )

    const frames =
      await this.extractFrames(
        video
      )

    const visualDescriptions: string[] =
      []

    for (
      let i = 0;
      i < frames.length;
      i++
    ) {
      onProgress?.(
        `Understanding frame ${i + 1}/${frames.length}…`
      )

      const description =
        await this.describeFrame(
          frames[i]
        )

      if (description) {
        visualDescriptions.push(
          description
        )
      }
    }

    onProgress?.(
      'Inferring the feel…'
    )

    return this.inferFeel(
      transcript,
      visualDescriptions
    )
  }

  private async transcribe(
    audio: Float32Array,
    onProgress?: (
      message: string
    ) => void
  ): Promise<string> {
    if (!this.transcriber) {
      return ''
    }

    const result =
      await (this.transcriber as any)(
        audio,
        {
          sampling_rate: 16000,
          return_timestamps: true,
          chunk_length_s: 20,
          stride_length_s: 3
        }
      )

    onProgress?.(
      'Speech transcription complete'
    )

    if (
      typeof result === 'object' &&
      result &&
      'text' in result
    ) {
      return String(
        result.text
      ).trim()
    }

    return ''
  }

  private async describeFrame(
    image: HTMLCanvasElement
  ): Promise<string> {
    if (!this.vision) {
      return ''
    }

    try {
      const result =
        await (this.vision as any)(
          image,
          {
            max_new_tokens: 30
          }
        )

      if (
        Array.isArray(result) &&
        result.length > 0
      ) {
        return String(
          result[0]
            ?.generated_text ?? ''
        ).trim()
      }

      return ''
    } catch (error) {
      console.warn(
        'Vision inference failed:',
        error
      )

      return ''
    }
  }

  private async extractFrames(
    video: HTMLVideoElement
  ): Promise<HTMLCanvasElement[]> {
    if (!this.context) {
      throw new Error(
        'Canvas is unavailable.'
      )
    }

    const width = 384
    const height = 216

    this.canvas.width = width
    this.canvas.height = height

    const duration =
      video.duration

    if (
      !Number.isFinite(duration) ||
      duration <= 0
    ) {
      throw new Error(
        'Invalid video duration.'
      )
    }

    const count =
      Math.min(
        8,
        Math.max(
          4,
          Math.ceil(
            duration / 5
          )
        )
      )

    const frames:
      HTMLCanvasElement[] = []

    const originalTime =
      video.currentTime

    const wasPlaying =
      !video.paused

    video.pause()

    for (
      let i = 0;
      i < count;
      i++
    ) {
      const time =
        Math.min(
          duration - 0.05,
          (duration * i) /
            Math.max(
              1,
              count - 1
            )
        )

      await this.seek(
        video,
        time
      )

      this.context.drawImage(
        video,
        0,
        0,
        width,
        height
      )

      const frame =
        document.createElement(
          'canvas'
        )

      frame.width = width
      frame.height = height

      const frameContext =
        frame.getContext('2d')

      if (!frameContext) {
        continue
      }

      frameContext.drawImage(
        this.canvas,
        0,
        0
      )

      frames.push(frame)
    }

    await this.seek(
      video,
      Math.min(
        originalTime,
        duration - 0.05
      )
    )

    if (wasPlaying) {
      await video.play()
    }

    return frames
  }

  private seek(
    video: HTMLVideoElement,
    time: number
  ): Promise<void> {
    return new Promise(
      resolve => {
        const handler = () => {
          video.removeEventListener(
            'seeked',
            handler
          )

          resolve()
        }

        video.addEventListener(
          'seeked',
          handler
        )

        video.currentTime =
          time
      }
    )
  }

  private async extractAudio(
    video: HTMLVideoElement
  ): Promise<Float32Array> {
    /*
     * Browser-safe extraction through
     * AudioContext + OfflineAudioContext.
     *
     * We capture the video's audio
     * into an AudioBuffer.
     */

    const response =
      await fetch(
        video.src
      )

    const buffer =
      await response.arrayBuffer()

    const audioContext =
      new AudioContext()

    try {
      const decoded =
        await audioContext.decodeAudioData(
          buffer.slice(0)
        )

      const targetRate =
        16000

      const duration =
        decoded.duration

      const frameCount =
        Math.floor(
          duration *
            targetRate
        )

      const offline =
        new OfflineAudioContext(
          1,
          frameCount,
          targetRate
        )

      const source =
        offline.createBufferSource()

      source.buffer =
        decoded

      const gain =
        offline.createGain()

      gain.gain.value = 1

      source.connect(gain)
      gain.connect(
        offline.destination
      )

      source.start(0)

      const rendered =
        await offline.startRendering()

      return rendered
        .getChannelData(0)
        .slice()
    } finally {
      await audioContext.close()
    }
  }

  private inferFeel(
    transcript: string,
    descriptions: string[]
  ): AIAnalysis {
    const text = (
      transcript +
      ' ' +
      descriptions.join(' ')
    ).toLowerCase()

    const scores = {
      corporate: 0,
      educational: 0,
      casual: 0,
      travel: 0,
      music: 0,
      cinematic: 0,
      energetic: 0
    }

    const reasoning: string[] =
      []

    const signals = {
      speech:
        transcript.trim().length >
        5,

      music: false,

      people:
        /\b(person|people|man|woman|boy|girl|crowd|speaker)\b/.test(
          text
        ),

      presentation:
        /\b(presentation|presenter|meeting|office|screen|laptop|conference|business)\b/.test(
          text
        ),

      outdoor:
        /\b(outdoor|outside|street|road|sky|landscape|park|beach|mountain)\b/.test(
          text
        ),

      nature:
        /\b(nature|forest|mountain|ocean|sea|lake|tree|flower|animal)\b/.test(
          text
        ),

      city:
        /\b(city|building|street|traffic|car|urban|downtown)\b/.test(
          text
        ),

      product:
        /\b(product|phone|laptop|computer|device|software|app|screen)\b/.test(
          text
        ),

      textHeavy:
        /\b(text|subtitle|caption|presentation|slide|chart|graph)\b/.test(
          text
        )
    }

    this.scoreKeywords(
      scores,
      text,
      'corporate',
      [
        'business',
        'company',
        'enterprise',
        'startup',
        'office',
        'professional',
        'meeting',
        'team',
        'strategy',
        'product',
        'customer',
        'growth',
        'revenue',
        'presentation'
      ],
      5
    )

    this.scoreKeywords(
      scores,
      text,
      'educational',
      [
        'lesson',
        'tutorial',
        'teacher',
        'student',
        'classroom',
        'explain',
        'learning',
        'education',
        'science',
        'diagram',
        'chart',
        'presentation',
        'how to'
      ],
      6
    )

    this.scoreKeywords(
      scores,
      text,
      'travel',
      [
        'travel',
        'vacation',
        'beach',
        'mountain',
        'ocean',
        'hotel',
        'airport',
        'flight',
        'city',
        'landscape',
        'tourist',
        'destination',
        'adventure',
        'exploring'
      ],
      6
    )

    this.scoreKeywords(
      scores,
      text,
      'casual',
      [
        'vlog',
        'selfie',
        'friends',
        'fun',
        'day',
        'life',
        'guys',
        'story',
        'personal',
        'home'
      ],
      5
    )

    this.scoreKeywords(
      scores,
      text,
      'music',
      [
        'concert',
        'stage',
        'microphone',
        'dj',
        'dancing',
        'dance',
        'performer',
        'music',
        'singer',
        'band',
        'crowd'
      ],
      7
    )

    this.scoreKeywords(
      scores,
      text,
      'cinematic',
      [
        'cinematic',
        'dramatic',
        'movie',
        'film',
        'dark',
        'sunset',
        'silhouette',
        'landscape'
      ],
      4
    )

    if (signals.presentation) {
      scores.corporate += 8
      scores.educational += 4

      reasoning.push(
        'Visual analysis detected presentation/business imagery.'
      )
    }

    if (signals.product) {
      scores.corporate += 5
      scores.educational += 2

      reasoning.push(
        'Visual analysis detected a product or software interface.'
      )
    }

    if (signals.outdoor) {
      scores.travel += 5
      scores.cinematic += 2

      reasoning.push(
        'Visual analysis detected outdoor footage.'
      )
    }

    if (signals.nature) {
      scores.travel += 5
      scores.cinematic += 5

      reasoning.push(
        'Visual analysis detected nature/landscape imagery.'
      )
    }

    if (signals.city) {
      scores.travel += 4
      scores.corporate += 2

      reasoning.push(
        'Visual analysis detected urban imagery.'
      )
    }

    if (signals.people) {
      scores.casual += 3

      reasoning.push(
        'Visual analysis detected people.'
      )
    }

    if (signals.speech) {
      scores.educational += 3
      scores.corporate += 2
      scores.casual += 2

      reasoning.push(
        'Speech was transcribed locally with Whisper.'
      )
    }

    const musicWords = [
      'music',
      'song',
      'beat',
      'bass',
      'rhythm',
      'concert',
      'dj',
      'dancing'
    ]

    if (
      musicWords.some(
        word =>
          text.includes(word)
      )
    ) {
      signals.music = true

      scores.music += 10

      reasoning.push(
        'Audio/transcript signals suggest music-driven content.'
      )
    }

    if (
      transcript.length > 200
    ) {
      scores.educational += 3

      reasoning.push(
        'Long-form speech suggests explanation or educational content.'
      )
    }

    let best:
      keyof typeof scores =
      'cinematic'

    let bestScore = -Infinity

    for (
      const key of Object.keys(
        scores
      ) as Array<
        keyof typeof scores
      >
    ) {
      if (
        scores[key] >
        bestScore
      ) {
        best = key
        bestScore =
          scores[key]
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
              0.4,
              bestScore / total
            )
          )
        : 0.4

    if (
      reasoning.length === 0
    ) {
      reasoning.push(
        'AI could not find a dominant semantic signal.'
      )
    }

    return {
      transcript,
      visualDescriptions:
        descriptions,

      feel: best,

      confidence,

      signals,

      reasoning
    }
  }

  private scoreKeywords(
    scores: Record<
      string,
      number
    >,
    text: string,
    category: string,
    keywords: string[],
    points: number
  ) {
    for (
      const keyword of keywords
    ) {
      if (
        text.includes(keyword)
      ) {
        scores[category] +=
          points
      }
    }
  }
}