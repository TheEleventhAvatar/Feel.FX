import './style.css'

import {
  AIVideoAnalyzer,
  type AIAnalysis
} from './aiVideoAnalyzer'

import {
  generateEvents
} from './eventEngine'

import { MotionRenderer } from './motionrenderer'

const app =
  document.querySelector<HTMLDivElement>('#app')!

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
          <div>DROP A VIDEO</div>
          <small>
            FeelFX will watch it locally
          </small>
        </div>

        <!--
          Motion graphics are rendered here.
          This layer sits above the video.
        -->
        <div
          id="motion-layer"
          class="motion-layer"
        ></div>

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

          <div class="progress">
            <div id="progress-bar"></div>
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
            LIVE MOTION GRAPHICS
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

      <div class="events-layout">

        <div
          id="events"
          class="events"
        >
          <div class="event-empty">
            No events yet
          </div>
        </div>

        <pre id="dsl">{
  "status": "waiting"
}</pre>

      </div>

    </section>

  </div>
`

/* --------------------------------------------------
 * DOM
 * -------------------------------------------------- */

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

const events =
  document.querySelector<HTMLDivElement>(
    '#events'
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

const motionLayer =
  document.querySelector<HTMLDivElement>(
    '#motion-layer'
  )!

/* --------------------------------------------------
 * STATE
 * -------------------------------------------------- */

let videoURL: string | null = null

let currentEvents:
  ReturnType<typeof generateEvents> = []

const ai =
  new AIVideoAnalyzer()

const motionRenderer =
  new MotionRenderer(
    motionLayer
  )

/* --------------------------------------------------
 * LOAD VIDEO
 * -------------------------------------------------- */

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
      URL.createObjectURL(
        file
      )

    video.pause()

    video.src =
      videoURL

    video.load()

    placeholder.style.display =
      'none'

    feelButton.disabled =
      false

    stage.textContent =
      'VIDEO READY'

    progress.style.width =
      '0%'

    status.textContent =
      'READY'

    summary.textContent =
      `${file.name} · Ready for local AI`

    events.innerHTML = `
      <div class="event-empty">
        Ready for timestamped analysis
      </div>
    `

    dsl.textContent = `{
  "status": "video-loaded"
}`

    currentEvents = []

    motionRenderer.setEvents(
      []
    )
  }
)

/* --------------------------------------------------
 * VIDEO TIME → MOTION ENGINE
 * -------------------------------------------------- */

video.addEventListener(
  'timeupdate',
  () => {
    const time =
      video.currentTime

    motionRenderer.updateVideoTime(
      time
    )

    updateActiveEvent(
      time
    )
  }
)

video.addEventListener(
  'seeked',
  () => {
    motionRenderer.updateVideoTime(
      video.currentTime
    )

    updateActiveEvent(
      video.currentTime
    )
  }
)

/* --------------------------------------------------
 * ACTIVE EVENT UI
 * -------------------------------------------------- */

function updateActiveEvent(
  time: number
) {
  if (
    currentEvents.length === 0
  ) {
    return
  }

  const active =
    currentEvents.find(
      event =>
        time >= event.time &&
        time <= event.endTime
    )

  document
    .querySelectorAll(
      '.event'
    )
    .forEach(
      element => {
        element.classList.remove(
          'event-active'
        )
      }
    )

  if (!active) {
    return
  }

  const index =
    currentEvents.indexOf(
      active
    )

  const elements =
    document.querySelectorAll(
      '.event'
    )

  elements[
    Math.min(
      index,
      elements.length - 1
    )
  ]?.classList.add(
    'event-active'
  )
}

/* --------------------------------------------------
 * UI HELPERS
 * -------------------------------------------------- */

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
      Math.min(
        100,
        value
      )
    )}%`
}

/* --------------------------------------------------
 * RENDER AI EVENTS
 * -------------------------------------------------- */

function renderEvents(
  analysis: AIAnalysis
) {
  const generated =
    generateEvents(
      analysis
    )

  currentEvents =
    generated

  /*
   * IMPORTANT:
   *
   * The events are passed directly
   * to the visual motion renderer.
   *
   * MotionRenderer decides what actual
   * graphics to render:
   *
   * beach
   *    → water/splash/particles
   *
   * rocket
   *    → fire/exhaust/shockwave
   *
   * flag
   *    → tricolor ribbons/particles
   *
   * celebration
   *    → bursts/confetti
   *
   * product
   *    → tracking/highlight graphics
   *
   * etc.
   */
  motionRenderer.setEvents(
    generated
  )

  /*
   * Event list in the UI.
   */

  events.innerHTML =
    generated.length === 0
      ? `
        <div class="event-empty">
          No visual events detected
        </div>
      `
      : generated
          .slice(0, 30)
          .map(
            event => `
              <div class="event">

                <div class="event-time">
                  ${formatTime(
                    event.time
                  )}
                </div>

                <div class="event-main">

                  <div class="event-type">
                    ${escapeHTML(
                      String(
                        event.type
                      )
                    )}
                  </div>

                  <div class="event-text">
                    ${escapeHTML(
                      event.event
                    )}
                  </div>

                  <div class="event-motion">
                    → ${
                      event.motion.type
                    }
                    · ${
                      event.motion.animation
                    }
                  </div>

                </div>

              </div>
            `
          )
          .join('')

  /*
   * DSL/debug representation.
   */

  dsl.textContent =
    JSON.stringify(
      {
        generatedBy:
          'FeelFX AI',

        feel:
          analysis.feel,

        confidence:
          analysis.confidence,

        events:
          generated
      },
      null,
      2
    )

  summary.textContent =
    `${analysis.feel} → ${generated.length} visual motion decisions`

  status.textContent =
    'GENERATED'
}

/* --------------------------------------------------
 * FORMAT TIME
 * -------------------------------------------------- */

function formatTime(
  seconds: number
) {
  const minutes =
    Math.floor(
      seconds / 60
    )

  const remaining =
    seconds % 60

  return `${String(
    minutes
  ).padStart(
    2,
    '0'
  )}:${remaining
    .toFixed(1)
    .padStart(
      4,
      '0'
    )}`
}

/* --------------------------------------------------
 * HTML ESCAPE
 * -------------------------------------------------- */

function escapeHTML(
  value: string
) {
  return value
    .replace(
      /&/g,
      '&amp;'
    )
    .replace(
      /</g,
      '&lt;'
    )
    .replace(
      />/g,
      '&gt;'
    )
    .replace(
      /"/g,
      '&quot;'
    )
    .replace(
      /'/g,
      '&#039;'
    )
}

/* --------------------------------------------------
 * RENDER ANALYSIS
 * -------------------------------------------------- */

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
    analysis.signals.speech
      ? 'YES'
      : 'NO'

  people.textContent =
    analysis.signals.people
      ? 'YES'
      : 'NO'

  outdoor.textContent =
    analysis.signals.outdoor
      ? 'YES'
      : 'NO'

  product.textContent =
    analysis.signals.product
      ? 'YES'
      : 'NO'

  transcript.value =
    analysis.transcript ||
    'No speech detected.'

  reasoning.innerHTML =
    analysis.reasoning
      .map(
        item =>
          `<div>• ${escapeHTML(
            item
          )}</div>`
      )
      .join('')

  renderEvents(
    analysis
  )
}

/* --------------------------------------------------
 * FEEL THE VIDEO
 * -------------------------------------------------- */

feelButton.addEventListener(
  'click',
  async () => {

    feelButton.disabled =
      true

    status.textContent =
      'ANALYZING'

    setStage(
      'Starting local AI…'
    )

    updateProgress(
      5
    )

    currentEvents = []

    motionRenderer.setEvents(
      []
    )

    try {

      const analysis =
        await ai.analyze(
          video,
          message => {

            setStage(
              message
            )

            const lower =
              message.toLowerCase()

            if (
              lower.includes(
                'speech model'
              )
            ) {
              updateProgress(
                15
              )
            }

            else if (
              lower.includes(
                'vision model'
              )
            ) {
              updateProgress(
                30
              )
            }

            else if (
              lower.includes(
                'audio'
              )
            ) {
              updateProgress(
                45
              )
            }

            else if (
              lower.includes(
                'transcrib'
              )
            ) {
              updateProgress(
                60
              )
            }

            else if (
              lower.includes(
                'frame'
              )
            ) {
              updateProgress(
                75
              )
            }

            else if (
              lower.includes(
                'feel'
              )
            ) {
              updateProgress(
                90
              )
            }
          }
        )

      updateProgress(
        100
      )

      renderAnalysis(
        analysis
      )

      setStage(
        'AI understanding complete · Motion graphics ready'
      )

      video.currentTime =
        0

      /*
       * Render the first frame
       * immediately instead of waiting
       * for the first timeupdate event.
       */
      motionRenderer.updateVideoTime(
        0
      )

      status.textContent =
        'LIVE'

    } catch (
      error
    ) {

      console.error(
        'FeelFX AI error:',
        error
      )

      status.textContent =
        'ERROR'

      setStage(
        error instanceof Error
          ? error.message
          : 'Analysis failed'
      )

    } finally {

      feelButton.disabled =
        false
    }
  }
)

/* --------------------------------------------------
 * CLEANUP
 * -------------------------------------------------- */

window.addEventListener(
  'beforeunload',
  () => {

    ai.destroy()

    motionRenderer.destroy()

    if (videoURL) {
      URL.revokeObjectURL(
        videoURL
      )
    }
  }
)