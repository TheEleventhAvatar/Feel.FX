/* =========================================================
 * FeelFX — YouTube upload (optional integration)
 *
 * Isolated service module. FeelFX core (analysis → DSL →
 * Three.js/GSAP rendering) does NOT depend on this.
 *
 * Uploads the EXISTING generated/loaded video file to
 * YouTube via the YouTube Data API v3 resumable
 * videos.insert endpoint.
 *
 * If Google/YouTube is not configured, `uploadToYouTube`
 * returns `{ ok: false, reason: 'not-configured' }` and
 * the FeelFX app keeps working normally.
 * ========================================================= */

import {
  clearGoogleToken,
  getGoogleAccessToken
} from './googleAuth'

const YT_UPLOAD_URL =
  'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status'

export type YouTubePrivacyStatus =
  | 'private'
  | 'unlisted'
  | 'public'

export interface YouTubeUploadOptions {
  title: string
  description: string
  privacyStatus: YouTubePrivacyStatus
}

export interface YouTubeUploadResult {
  ok: boolean
  videoId?: string
  watchUrl?: string
  /** Why the upload didn't happen / failed. */
  reason?: 'not-configured' | 'error'
  message?: string
}

export interface YouTubeUploadProgress {
  /** 0–100 */
  percent: number
  status:
    | 'auth'
    | 'initiating'
    | 'uploading'
    | 'finalizing'
    | 'done'
    | 'error'
}

/**
 * Upload an existing video file (already produced by the
 * FeelFX pipeline) to YouTube.
 *
 * @param file       The existing video File/Blob — NOT re-processed.
 * @param options    Title / description / privacy status.
 * @param onProgress Progress callback (0–100).
 */
export async function uploadToYouTube(
  file: Blob,
  options: YouTubeUploadOptions,
  onProgress?: (
    progress: YouTubeUploadProgress
  ) => void
): Promise<YouTubeUploadResult> {
  try {
    onProgress?.({
      percent: 0,
      status: 'auth'
    })

    const token = await getGoogleAccessToken()

    if (!token) {
      return {
        ok: false,
        reason: 'not-configured',
        message:
          'YouTube upload is not configured. Add VITE_GOOGLE_CLIENT_ID to your .env.local (see README).'
      }
    }

    onProgress?.({
      percent: 2,
      status: 'initiating'
    })

    const title = options.title.trim() || 'FeelFX Video'
    const description = options.description.trim()

    /*
     * Step 1 — start a resumable session with
     * video metadata (snippet + status).
     */
    const initResponse = await fetch(YT_UPLOAD_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8'
      },
      body: JSON.stringify({
        snippet: {
          title: title.slice(0, 100),
          description: description.slice(0, 5000),
          categoryId: '22'
        },
        status: {
          privacyStatus: options.privacyStatus,
          selfDeclaredMadeForKids: false
        }
      })
    })

    if (initResponse.status === 401) {
      clearGoogleToken()
      throw new Error(
        'Google session expired — please try again.'
      )
    }

    if (!initResponse.ok) {
      const detail = await initResponse.text()
      throw new Error(
        `YouTube upload could not start (${initResponse.status}): ${detail}`
      )
    }

    const uploadUrl =
      initResponse.headers.get('Location') ??
      initResponse.headers.get('location')

    if (!uploadUrl) {
      throw new Error(
        'YouTube did not return a resumable upload URL.'
      )
    }

    /*
     * Step 2 — upload the raw video bytes with progress.
     */
    const videoId = await new Promise<string>(
      (resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.open('PUT', uploadUrl)

        xhr.upload.onprogress = event => {
          if (event.lengthComputable) {
            onProgress?.({
              percent: Math.round(
                (event.loaded / event.total) * 96
              ),
              status: 'uploading'
            })
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(
                xhr.responseText
              ) as { id?: string }

              if (!response.id) {
                reject(
                  new Error(
                    'YouTube upload returned no video id.'
                  )
                )
                return
              }

              resolve(response.id)
            } catch {
              reject(
                new Error(
                  'YouTube upload returned an unreadable response.'
                )
              )
            }
          } else {
            reject(
              new Error(
                `YouTube upload failed (${xhr.status}): ${xhr.responseText}`
              )
            )
          }
        }

        xhr.onerror = () => {
          reject(
            new Error(
              'Network error while uploading to YouTube.'
            )
          )
        }

        xhr.setRequestHeader(
          'Content-Type',
          file.type || 'video/mp4'
        )

        xhr.send(file)
      }
    )

    onProgress?.({
      percent: 100,
      status: 'done'
    })

    return {
      ok: true,
      videoId,
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`
    }
  } catch (error) {
    onProgress?.({
      percent: 100,
      status: 'error'
    })

    return {
      ok: false,
      reason: 'error',
      message:
        error instanceof Error
          ? error.message
          : 'Unknown YouTube upload error.'
    }
  }
}