/* =========================================================
 * FeelFX — Export & Publish panel (optional integrations)
 *
 * Isolated UI module. It is mounted ADDITIVELY after the
 * existing output panel and does NOT touch the FeelFX
 * core pipeline (analysis → DSL → Three.js/GSAP).
 *
 * It consumes the EXISTING loaded video file/blob only.
 *
 * Behavior with no Google credentials configured:
 *   - Panel appears after a video is analyzed.
 *   - Clicking either button shows a friendly
 *     "not configured" message (see README).
 *   - Everything else in FeelFX works normally.
 * ========================================================= */

import {
  isGoogleConfigured
} from './googleAuth'

import {
  uploadToDrive,
  type DriveUploadProgress
} from './googleDrive'

import {
  uploadToYouTube,
  type YouTubePrivacyStatus
} from './youtube'

export interface ExportPanelHandle {
  /** Root element of the export section. */
  root: HTMLElement
  /** Enable the panel once a video has been analyzed. */
  enable: (fileName: string) => void
  /** Reset the panel (e.g. when a new video is loaded). */
  reset: () => void
}

/*
 * Escapes user-provided strings before they are injected
 * via innerHTML (file names, error messages).
 *
 * Entities are built via unicode escapes so this source
 * file itself can never be auto-decoded into raw chars.
 */
const ENTITY_MAP: Record<string, string> = {
  '&': '\u0026amp;',
  '<': '\u0026lt;',
  '>': '\u0026gt;',
  '"': '\u0026quot;',
  "'": '\u0026#039;'
}

function escapeHTML(
  value: string
) {
  return value.replace(
    /[&<>"']/g,
    char => ENTITY_MAP[char]
  )
}

/**
 * Creates the "Export & Publish" section.
 *
 * @param getVideoFile  Returns the existing video file/blob
 *                      that FeelFX loaded (never re-processed).
 * @param getFileName   Name of that existing file.
 */
export function createExportPanel(
  getVideoFile: () => File | Blob | null,
  getFileName: () => string
): ExportPanelHandle {
  const root =
    document.createElement('section')

  root.className = 'export-panel'
  root.hidden = true

  root.innerHTML = `
    <div class="export-header">
      <div class="small-label">EXPORT \u0026 PUBLISH</div>
      <div class="export-note">Optional \u00b7 uploads your existing video file</div>
    </div>

    <div class="export-actions">
      <button
        id="export-drive"
        class="export-button"
        type="button"
      >
        Save to Google Drive
      </button>

      <button
        id="export-youtube"
        class="export-button"
        type="button"
      >
        Upload to YouTube
      </button>
    </div>

    <div
      id="export-youtube-form"
      class="youtube-form"
      hidden
    >
      <input
        id="yt-title"
        class="export-input"
        type="text"
        maxlength="100"
        placeholder="Video title"
      />

      <textarea
        id="yt-description"
        class="export-input export-textarea"
        maxlength="5000"
        placeholder="Description (optional)"
      ></textarea>

      <select
        id="yt-privacy"
        class="export-input"
      >
        <option value="private">Private</option>
        <option value="unlisted">Unlisted</option>
        <option value="public">Public</option>
      </select>

      <button
        id="yt-upload-button"
        class="export-button export-button-primary"
        type="button"
      >
        Start YouTube Upload
      </button>
    </div>

    <div class="export-progress-wrap" hidden>
      <div class="export-status" id="export-status"></div>
      <div class="export-progress">
        <div id="export-progress-bar"></div>
      </div>
    </div>

    <div
      id="export-result"
      class="export-result"
    ></div>
  `

  /* --------------------------------------------------
   * Internal element references
   * -------------------------------------------------- */

  const driveButton =
    root.querySelector<HTMLButtonElement>(
      '#export-drive'
    )!

  const youtubeButton =
    root.querySelector<HTMLButtonElement>(
      '#export-youtube'
    )!

  const youtubeForm =
    root.querySelector<HTMLDivElement>(
      '#export-youtube-form'
    )!

  const ytTitle =
    root.querySelector<HTMLInputElement>(
      '#yt-title'
    )!

  const ytDescription =
    root.querySelector<HTMLTextAreaElement>(
      '#yt-description'
    )!

  const ytPrivacy =
    root.querySelector<HTMLSelectElement>(
      '#yt-privacy'
    )!

  const ytUploadButton =
    root.querySelector<HTMLButtonElement>(
      '#yt-upload-button'
    )!

  const progressWrap =
    root.querySelector<HTMLDivElement>(
      '.export-progress-wrap'
    )!

  const exportStatus =
    root.querySelector<HTMLDivElement>(
      '#export-status'
    )!

  const progressBar =
    root.querySelector<HTMLDivElement>(
      '#export-progress-bar'
    )!

  const resultBox =
    root.querySelector<HTMLDivElement>(
      '#export-result'
    )!

  /* --------------------------------------------------
   * State
   * -------------------------------------------------- */

  let busy = false

  function setProgress(
    percent: number,
    status: string
  ) {
    progressWrap.hidden = false

    exportStatus.textContent =
      status

    progressBar.style.width =
      `${Math.max(0, Math.min(100, percent))}%`
  }

  function showResult(
    html: string
  ) {
    resultBox.innerHTML = html
  }

  function setBusy(
    value: boolean
  ) {
    busy = value

    driveButton.disabled = value
    youtubeButton.disabled = value
    ytUploadButton.disabled = value
  }

  function guardFile():
    | File
    | Blob
    | null {
    if (busy) {
      return null
    }

    const file =
      getVideoFile()

    if (!file) {
      showResult(
        '<span class="export-error">No video available. Load and analyze a video first.</span>'
      )
      return null
    }

    return file
  }

  function showNotConfigured() {
    showResult(
      '<span class="export-error">Google integrations are not configured. Add <code>VITE_GOOGLE_CLIENT_ID</code> to <code>.env.local</code> (see README). FeelFX works fine without it.</span>'
    )
  }

  function describeDriveProgress(
    progress: DriveUploadProgress
  ): string {
    switch (progress.status) {
      case 'auth':
        return 'Signing in to Google\u2026'
      case 'initiating':
        return 'Starting Drive upload\u2026'
      case 'uploading':
        return `Uploading to Drive\u2026 ${progress.percent}%`
      case 'finalizing':
        return 'Finalizing Drive file\u2026'
      case 'done':
        return 'Saved to Google Drive \u2713'
      case 'error':
        return 'Drive upload failed'
    }
  }

  function describeYouTubeProgress(
    percent: number,
    status: string
  ): string {
    switch (status) {
      case 'auth':
        return 'Signing in to Google\u2026'
      case 'initiating':
        return 'Starting YouTube upload\u2026'
      case 'uploading':
        return `Uploading to YouTube\u2026 ${percent}%`
      case 'finalizing':
        return 'Finalizing YouTube video\u2026'
      case 'done':
        return 'Uploaded to YouTube \u2713'
      case 'error':
        return 'YouTube upload failed'
      default:
        return ''
    }
  }

  /* --------------------------------------------------
   * Drive action
   * -------------------------------------------------- */

  driveButton.addEventListener(
    'click',
    async () => {
      const file =
        guardFile()

      if (!file) {
        return
      }

      if (!isGoogleConfigured()) {
        showNotConfigured()
        return
      }

      setBusy(true)
      youtubeForm.hidden = true
      showResult('')

      const result =
        await uploadToDrive(
          file,
          getFileName(),
          progress => {
            setProgress(
              progress.percent,
              describeDriveProgress(
                progress
              )
            )
          }
        )

      setBusy(false)

      if (result.ok) {
        setProgress(
          100,
          'Saved to Google Drive \u2713'
        )

        showResult(
          `<span class="export-success">Saved to Drive:</span> <a href="${result.link}" target="_blank" rel="noopener noreferrer">${escapeHTML(result.fileName ?? 'video')}</a>`
        )
      } else {
        if (
          result.reason ===
          'not-configured'
        ) {
          progressWrap.hidden = true
          showNotConfigured()
        } else {
          showResult(
            `<span class="export-error">${escapeHTML(result.message ?? 'Drive upload failed.')}</span>`
          )
        }
      }
    }
  )

  /* --------------------------------------------------
   * YouTube actions
   * -------------------------------------------------- */

  youtubeButton.addEventListener(
    'click',
    () => {
      if (!guardFile()) {
        return
      }

      if (!isGoogleConfigured()) {
        showNotConfigured()
        return
      }

      youtubeForm.hidden =
        !youtubeForm.hidden
    }
  )

  ytUploadButton.addEventListener(
    'click',
    async () => {
      const file =
        guardFile()

      if (!file) {
        return
      }

      if (!isGoogleConfigured()) {
        showNotConfigured()
        return
      }

      setBusy(true)
      showResult('')

      const result =
        await uploadToYouTube(
          file,
          {
            title:
              ytTitle.value ||
              getFileName(),
            description:
              ytDescription.value,
            privacyStatus:
              ytPrivacy.value as YouTubePrivacyStatus
          },
          progress => {
            setProgress(
              progress.percent,
              describeYouTubeProgress(
                progress.percent,
                progress.status
              )
            )
          }
        )

      setBusy(false)

      if (result.ok) {
        setProgress(
          100,
          'Uploaded to YouTube \u2713'
        )

        showResult(
          `<span class="export-success">Uploaded:</span> <a href="${result.watchUrl}" target="_blank" rel="noopener noreferrer">Watch on YouTube</a> <span class="export-muted">(processing may take a few minutes)</span>`
        )
      } else {
        if (
          result.reason ===
          'not-configured'
        ) {
          progressWrap.hidden = true
          showNotConfigured()
        } else {
          showResult(
            `<span class="export-error">${escapeHTML(result.message ?? 'YouTube upload failed.')}</span>`
          )
        }
      }
    }
  )

  /* --------------------------------------------------
   * Public handle
   * -------------------------------------------------- */

  return {
    root,

    enable(fileName) {
      root.hidden = false

      /*
       * Let the page grow/scroll while the export
       * panel is visible so existing content is
       * never squeezed and the user can always
       * scroll back up.
       */
      document.body.classList.add(
        'export-open'
      )

      // Pre-fill the YouTube title
      // placeholder with the existing
      // file name.
      if (!ytTitle.value) {
        ytTitle.placeholder =
          fileName
      }
    },

    reset() {
      root.hidden = true

      document.body.classList.remove(
        'export-open'
      )
      youtubeForm.hidden = true
      progressWrap.hidden = true
      resultBox.innerHTML = ''
      progressBar.style.width = '0%'
      busy = false
    }
  }
}