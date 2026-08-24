import './style.css'

import {
  AIVideoAnalyzer,
  type AIAnalysis
} from './aiVideoAnalyzer'

const app =
  document.querySelector<HTMLDivElement>(
    '#app'
  )!

app.innerHTML = `
  <div class="app">

    <header class="header">

      <div class="brand">
        <span>Feel</span><b>FX</b>
      </div>

      <div class="engine-status">
        <span class="status-dot"></span>
        LOCAL AI VIDEO UNDERSTANDING
      </div>

    </header>

    <main class="workspace">

      <section class="video-panel">

        <video
          id="video"
          controls
          playsinline
        ></video>

        <div
          id="placeholder"
          class="video-placeholder"
        >
          <div class="upload-icon">＋</div>

          <div>
            DROP A VIDEO
          </div>

          <small>
            FeelFX will watch it locally
          </small>
        </div>

        <input
          id="file"
          type="file"
          accept="video/*"
          hidden
        />

        <button
          id="load"
          class="upload-button"
        >
          LOAD VIDEO
        </button>

      </section>

      <aside class="analysis-panel">

        <div class="panel-title">
          AI VIDEO INTELLIGENCE
        </div>

        <div class="feel-result">

          <div class="small-label">
            DETECTED FEEL
          </div>

          <div
            id="feel"
            class="feel"
          >
            —
          </div>

          <div
            id="confidence"
            class="confidence"
          >
            Waiting for video
          </div>

        </div>

        <div class="ai-stage">

          <div
            id="stage"
            class="stage-text"
          >
            LOAD A VIDEO
          </div>

          <div
            id="stage-progress"
            class="progress"
          >
            <div
              id="progress-bar"
            ></div>
          </div>

        </div>

        <div class="metrics">

          <div class="metric">
            <span>SPEECH</span>
            <strong id="speech">—</strong>
          </div>

          <div class="metric">
            <span>PEOPLE</span>
            <strong id="people">—</strong>
          </div>

          <div class="metric">
            <span>OUTDOOR</span>
            <strong id="outdoor">—</strong>
          </div>

          <div class="metric">
            <span>PRODUCT</span>
            <strong id="product">—</strong>
          </div>

        </div>

        <div class="reasoning">

          <div class="small-label">
            WHY FEELFX THINKS THIS
          </div>

          <div id="reasoning-text">
            —
          </div>

        </div>

        <div class="transcript">

          <div class="small-label">
            LOCAL TRANSCRIPT
          </div>

          <textarea
            id="transcript"
            readonly
            placeholder="Whisper transcript will appear here..."
          ></textarea>

        </div>

        <button
          id="feel-button"
          class="analyze-button"
          disabled
        >
          <span>✦</span>
          FEEL THE VIDEO
        </button>

      </aside>

    </main>

    <section class="output-panel">

      <div class="output-header">

        <div>

          <div class="small-label">
            AI MOTION DECISION
          </div>

          <div
            id="summary"
            class="summary"
          >
            Waiting for AI analysis
          </div>

        </div>

        <div
          id="status"
          class="motion-status"
        >
          IDLE
        </div>

      </div>

      <div class="output-grid">

        <div>

          <div class="small-label">
            VISUAL UNDERSTANDING
          </div>

          <div
            id="visual"
            class="visual"
          >
            —
          </div>

        </div>

        <pre id="dsl">{
  "status": "waiting"
}</pre>

      </div>

    </section>

  </div>
`

const video =
  document.querySelector<HTMLVideoElement>(
    '#video'
  )!

const fileInput =
  document.querySelector<HTMLInputElement>(
    '#file'
  )!

const loadButton =
  document.querySelector<HTMLButtonElement>(
    '#load'
  )!

const placeholder =
  document.querySelector<HTMLDivElement>(
    '#placeholder'
  )!

const feelButton =
  document.querySelector<HTMLButtonElement>(
    '#feel-button'
  )!

const feel =
  document.querySelector<HTMLDivElement>(
    '#feel'
  )!

const confidence =
  document.querySelector<HTMLDivElement>(
    '#confidence'
  )!

const stage =
  document.querySelector<HTMLDivElement>(
    '#stage'
  )!

const progress =
  document.querySelector<HTMLDivElement>(
    '#progress-bar'
  )!

const speech =
  document.querySelector<HTMLElement>(
    '#speech'
  )!

const people =
  document.querySelector<HTMLElement>(
    '#people'
  )!

const outdoor =
  document.querySelector<HTMLElement>(
    '#outdoor'
  )!

const product =
  document.querySelector<HTMLElement>(
    '#product'
  )!

const reasoning =
  document.querySelector<HTMLDivElement>(
    '#reasoning-text'
  )!

const transcript =
  document.querySelector<HTMLTextAreaElement>(
    '#transcript'
  )!

const visual =
  document.querySelector<HTMLDivElement>(
    '#visual'
  )!

const dsl =
  document.querySelector<HTMLPreElement>(
    '#dsl'
  )!

const summary =
  document.querySelector<HTMLDivElement>(
    '#summary'
  )!

const status =
  document.querySelector<HTMLDivElement>(
    '#status'
  )!

let videoURL: string | null = null

const ai =
  new AIVideoAnalyzer()

loadButton.addEventListener(
  'click',
  () => {
    fileInput.click()
  }
)

fileInput.addEventListener(
  'change',
  () => {
    const file =
      fileInput.files?.[0]

    if (!file) {
      return
    }

    if (videoURL) {
      URL.revokeObjectURL(
        videoURL
      )
    }

    videoURL =
      URL.createObjectURL(file)

    video.pause()

    video.src =
      videoURL

    video.load()

    placeholder.style.display =
      'none'

    feelButton.disabled = false

    stage.textContent =
      'VIDEO READY'

    progress.style.width =
      '0%'

    status.textContent =
      'READY'

    summary.textContent =
      `${file.name} · Ready for local AI`
  }
)

function setStage(
  message: string
) {
  stage.textContent =
    message
}

function updateProgress(
  value: number
) {
  progress.style.width =
    `${Math.max(
      0,
      Math.min(100, value)
    )}%`
}

function yesNo(
  value: boolean
) {
  return value
    ? 'YES'
    : 'NO'
}

function createMotionDSL(
  analysis: AIAnalysis
) {
  const base = {
    generatedBy:
      'FeelFX AI',
    feel: analysis.feel,
    confidence:
      analysis.confidence
  }

  switch (
    analysis.feel
  ) {
    case 'corporate':
      return {
        ...base,
        style: {
          typography:
            'clean',
          movement:
            'precise',
          pacing:
            'measured'
        },
        elements: [
          {
            type: 'text',
            action: 'reveal',
            text:
              'KEY INSIGHT',
            animation:
              'masked-slide-up'
          },
          {
            type: 'highlight',
            action:
              'emphasize',
            animation:
              'draw'
          },
          {
            type: 'arrow',
            action:
              'connect',
            animation:
              'smooth'
          }
        ]
      }

    case 'educational':
      return {
        ...base,
        style: {
          typography:
            'clear',
          movement:
            'explanatory',
          pacing:
            'structured'
        },
        elements: [
          {
            type: 'text',
            action: 'label',
            animation:
              'fade-up'
          },
          {
            type: 'circle',
            action:
              'focus',
            animation:
              'draw'
          },
          {
            type: 'arrow',
            action:
              'explain',
            animation:
              'spring'
          }
        ]
      }

    case 'travel':
      return {
        ...base,
        style: {
          typography:
            'editorial',
          movement:
            'fluid',
          pacing:
            'relaxed'
        },
        elements: [
          {
            type: 'text',
            action: 'location',
            animation:
              'drift-up'
          },
          {
            type: 'line',
            action:
              'trace-route',
            animation:
              'draw'
          },
          {
            type: 'circle',
            action:
              'location-pin',
            animation:
              'pop'
          }
        ]
      }

    case 'music':
      return {
        ...base,
        style: {
          typography:
            'bold',
          movement:
            'rhythmic',
          pacing:
            'beat-synced'
        },
        elements: [
          {
            type: 'text',
            action:
              'beat-hit',
            animation:
              'slam'
          },
          {
            type: 'circle',
            action:
              'pulse',
            animation:
              'rhythmic'
          },
          {
            type: 'camera',
            action:
              'punch-in',
            animation:
              'beat'
          }
        ]
      }

    case 'casual':
      return {
        ...base,
        style: {
          typography:
            'playful',
          movement:
            'organic',
          pacing:
            'fast'
        },
        elements: [
          {
            type: 'text',
            action:
              'reaction',
            animation:
              'pop'
          },
          {
            type: 'sticker',
            action:
              'appear',
            animation:
              'bounce'
          }
        ]
      }

    case 'energetic':
      return {
        ...base,
        style: {
          typography:
            'impact',
          movement:
            'aggressive',
          pacing:
            'fast'
        },
        elements: [
          {
            type: 'text',
            action:
              'impact',
            animation:
              'slam'
          },
          {
            type: 'camera',
            action:
              'punch',
            animation:
              'rapid'
          },
          {
            type: 'shape',
            action:
              'burst',
            animation:
              'explode'
          }
        ]
      }

    default:
      return {
        ...base,
        style: {
          typography:
            'cinematic',
          movement:
            'fluid',
          pacing:
            'dramatic'
        },
        elements: [
          {
            type: 'text',
            action:
              'title',
            animation:
              'cinematic-fade'
          },
          {
            type: 'camera',
            action:
              'slow-push',
            animation:
              'smooth'
          }
        ]
      }
  }
}

function renderAnalysis(
  analysis: AIAnalysis
) {
  feel.textContent =
    analysis.feel.toUpperCase()

  confidence.textContent =
    `${Math.round(
      analysis.confidence * 100
    )}% confidence`

  speech.textContent =
    yesNo(
      analysis.signals.speech
    )

  people.textContent =
    yesNo(
      analysis.signals.people
    )

  outdoor.textContent =
    yesNo(
      analysis.signals.outdoor
    )

  product.textContent =
    yesNo(
      analysis.signals.product
    )

  transcript.value =
    analysis.transcript ||
    'No speech detected.'

  reasoning.innerHTML =
    analysis.reasoning
      .map(
        item =>
          `<div>• ${item}</div>`
      )
      .join('')

  visual.innerHTML =
    analysis.visualDescriptions
      .map(
        description =>
          `<div>• ${description}</div>`
      )
      .join('')

  const motionDSL =
    createMotionDSL(
      analysis
    )

  dsl.textContent =
    JSON.stringify(
      motionDSL,
      null,
      2
    )

  summary.textContent =
    `${analysis.feel} → ${motionDSL.elements.length} motion decisions`

  status.textContent =
    'GENERATED'
}

feelButton.addEventListener(
  'click',
  async () => {
    feelButton.disabled = true

    status.textContent =
      'ANALYZING'

    setStage(
      'Starting local AI…'
    )

    updateProgress(5)

    try {
      const analysis =
        await ai.analyze(
          video,
          message => {
            setStage(message)

            if (
              message.includes(
                'speech model'
              )
            ) {
              updateProgress(15)
            } else if (
              message.includes(
                'vision model'
              )
            ) {
              updateProgress(30)
            } else if (
              message.includes(
                'audio'
              )
            ) {
              updateProgress(45)
            } else if (
              message.includes(
                'Transcribing'
              )
            ) {
              updateProgress(60)
            } else if (
              message.includes(
                'frame'
              )
            ) {
              updateProgress(75)
            } else if (
              message.includes(
                'feel'
              )
            ) {
              updateProgress(90)
            } else if (
              message.includes(
                'complete'
              ) ||
              message.includes(
                'ready'
              )
            ) {
              updateProgress(35)
            }
          }
        )

      updateProgress(100)

      renderAnalysis(
        analysis
      )

      setStage(
        'AI understanding complete'
      )
    } catch (error) {
      console.error(
        'FeelFX AI error:',
        error
      )

      status.textContent =
        'ERROR'

      setStage(
        error instanceof Error
          ? error.message
          : 'AI analysis failed'
      )

      dsl.textContent =
        JSON.stringify(
          {
            status:
              'error',
            message:
              error instanceof Error
                ? error.message
                : String(error)
          },
          null,
          2
        )
    }

    feelButton.disabled = false
  }
)