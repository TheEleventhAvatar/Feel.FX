import {
  pipeline,
  env
} from '@huggingface/transformers'

env.allowLocalModels = false

type ASRPipeline = Awaited<ReturnType<typeof pipeline>>
type VisionPipeline = Awaited<ReturnType<typeof pipeline>>

export type TranscriptSegment = {
  start: number
  end: number
  text: string
}

export type VisualFrame = {
  time: number
  description: string
}

export type AIAnalysis = {
  transcript: string

  transcriptSegments:
    TranscriptSegment[]

  visualDescriptions: string[]

  visualFrames: VisualFrame[]

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
  private transcriber:
    ASRPipeline | null = null

  private vision:
    VisionPipeline | null = null

  private loading = false

  private canvas =
    document.createElement(
      'canvas'
    )

  private context =
    this.canvas.getContext(
      '2d',
      {
        willReadFrequently: true
      }
    )

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

      try {
        this.transcriber =
          await pipeline(
            'automatic-speech-recognition',
            'onnx-community/whisper-tiny.en',
            {
              device:
                'webgpu'
            } as any
          )
      } catch {
        this.transcriber =
          await pipeline(
            'automatic-speech-recognition',
            'onnx-community/whisper-tiny.en',
            {
              device: 'wasm'
            } as any
          )
      }

      onProgress?.(
        'Loading local vision model…'
      )

      try {
        this.vision =
          await pipeline(
            'image-to-text',
            'Xenova/vit-gpt2-image-captioning',
            {
              device:
                'webgpu'
            } as any
          )
      } catch {
        this.vision =
          await pipeline(
            'image-to-text',
            'Xenova/vit-gpt2-image-captioning',
            {
              device: 'wasm'
            } as any
          )
      }

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

    const originalTime =
      video.currentTime

    const wasPlaying =
      !video.paused

    video.pause()

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

    const transcriptResult =
      await this.transcribe(
        audio
      )

    onProgress?.(
      'Sampling video frames…'
    )

    const visualFrames =
      await this.extractFrames(
        video,
        onProgress
      )

    onProgress?.(
      'Inferring the feel…'
    )

    const analysis =
      this.inferFeel(
        transcriptResult.text,
        visualFrames
      )

    analysis.transcriptSegments =
      transcriptResult.segments

    analysis.visualFrames =
      visualFrames

    analysis.visualDescriptions =
      visualFrames.map(
        frame =>
          frame.description
      )

    video.currentTime =
      Math.min(
        originalTime,
        Math.max(
          0,
          video.duration - 0.05
        )
      )

    if (wasPlaying) {
      await video.play()
    }

    return analysis
  }

  private async transcribe(
    audio: Float32Array
  ): Promise<{
    text: string
    segments: TranscriptSegment[]
  }> {
    if (!this.transcriber) {
      return {
        text: '',
        segments: []
      }
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

    const text =
      typeof result ===
      'object'
        ? String(
            result?.text ?? ''
          ).trim()
        : ''

    const chunks =
      Array.isArray(
        result?.chunks
      )
        ? result.chunks
        : []

    const segments:
      TranscriptSegment[] =
      chunks
        .map(
          (chunk: any) => {
            const timestamp =
              chunk.timestamp

            if (
              !Array.isArray(
                timestamp
              )
            ) {
              return null
            }

            const start =
              Number(
                timestamp[0]
              )

            const end =
              Number(
                timestamp[1] ??
                  start + 2
              )

            if (
              !Number.isFinite(
                start
              )
            ) {
              return null
            }

            return {
              start,
              end:
                Number.isFinite(
                  end
                )
                  ? end
                  : start + 2,
              text: String(
                chunk.text ??
                  ''
              ).trim()
            }
          }
        )
        .filter(
          Boolean
        ) as TranscriptSegment[]

    return {
      text,
      segments
    }
  }

  private async extractFrames(
    video: HTMLVideoElement,
    onProgress?: (
      message: string
    ) => void
  ): Promise<VisualFrame[]> {
    if (!this.context) {
      throw new Error(
        'Canvas unavailable.'
      )
    }

    const width = 384
    const height = 216

    this.canvas.width =
      width

    this.canvas.height =
      height

    const duration =
      video.duration

    if (
      !Number.isFinite(
        duration
      ) ||
      duration <= 0
    ) {
      throw new Error(
        'Invalid video duration.'
      )
    }

    const count =
      Math.min(
        10,
        Math.max(
          5,
          Math.ceil(
            duration / 4
          )
        )
      )

    const frames:
      VisualFrame[] = []

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

      frame.width =
        width

      frame.height =
        height

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

      onProgress?.(
        `Understanding frame ${i + 1}/${count} at ${time.toFixed(1)}s…`
      )

      const description =
        await this.describeFrame(
          frame
        )

      frames.push({
        time,
        description
      })
    }

    return frames
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
            ?.generated_text ??
            ''
        ).trim()
      }
    } catch (error) {
      console.warn(
        'Vision inference failed:',
        error
      )
    }

    return ''
  }

  private seek(
    video: HTMLVideoElement,
    time: number
  ) {
    return new Promise<void>(
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
          handler,
          {
            once: true
          }
        )

        video.currentTime =
          time
      }
    )
  }

  private async extractAudio(
    video: HTMLVideoElement
  ) {
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

      const frameCount =
        Math.floor(
          decoded.duration *
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

      source.connect(
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
    frames: VisualFrame[]
  ): AIAnalysis {
    const descriptions =
      frames.map(
        frame =>
          frame.description
      )

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
        transcript.trim()
          .length > 5,

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

    const add =
      (
        category: keyof typeof scores,
        words: string[],
        points: number
      ) => {
        for (const word of words) {
          if (
            text.includes(word)
          ) {
            scores[category] +=
              points
          }
        }
      }

    add(
      'corporate',
      [
        'business',
        'company',
        'enterprise',
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

    add(
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
        'how to'
      ],
      6
    )

    add(
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

    add(
      'casual',
      [
        'vlog',
        'selfie',
        'friends',
        'fun',
        'guys',
        'story',
        'personal',
        'home'
      ],
      5
    )

    add(
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

    add(
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

    if (
      signals.presentation
    ) {
      scores.corporate += 8

      reasoning.push(
        'Presentation/business imagery detected.'
      )
    }

    if (
      signals.product
    ) {
      scores.corporate += 5

      reasoning.push(
        'Product or software interface detected.'
      )
    }

    if (
      signals.outdoor
    ) {
      scores.travel += 5

      reasoning.push(
        'Outdoor footage detected.'
      )
    }

    if (
      signals.nature
    ) {
      scores.travel += 5
      scores.cinematic += 5

      reasoning.push(
        'Nature/landscape imagery detected.'
      )
    }

    if (
      signals.city
    ) {
      scores.travel += 4

      reasoning.push(
        'Urban imagery detected.'
      )
    }

    if (
      signals.people
    ) {
      scores.casual += 3

      reasoning.push(
        'People detected.'
      )
    }

    if (
      signals.speech
    ) {
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
        'Music-related signals detected.'
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
        bestScore =
          scores[key]

        best = key
      }
    }

    const total =
      Object.values(
        scores
      ).reduce(
        (a, b) =>
          a + b,
        0
      )

    const confidence =
      total > 0
        ? Math.min(
            0.98,
            Math.max(
              0.4,
              bestScore /
                total
            )
          )
        : 0.4

    if (
      reasoning.length === 0
    ) {
      reasoning.push(
        'No dominant semantic signal detected.'
      )
    }

    return {
      transcript,

      transcriptSegments: [],

      visualDescriptions:
        descriptions,

      visualFrames: frames,

      feel: best,

      confidence,

      signals,

      reasoning
    }
  }

  destroy() {
    this.transcriber =
      null

    this.vision =
      null
  }
}