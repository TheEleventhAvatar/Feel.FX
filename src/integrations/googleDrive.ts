/* =========================================================
 * FeelFX — Google Drive export (optional integration)
 *
 * Isolated service module. FeelFX core (analysis → DSL →
 * Three.js/GSAP rendering) does NOT depend on this.
 *
 * Uploads the EXISTING generated/loaded video file to
 * the user's Google Drive via the Drive v3 API
 * (resumable upload, drive.file scope → the app only
 * sees files it created itself).
 *
 * If Google is not configured, `uploadToDrive` returns
 * a `{ ok: false, reason: 'not-configured' }` result and
 * the FeelFX app keeps working normally.
 * ========================================================= */

import {
  clearGoogleToken,
  DRIVE_SCOPE,
  getGoogleAccessToken
} from './googleAuth'

const DRIVE_UPLOAD_URL =
  'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true'

const DRIVE_FILES_URL =
  'https://www.googleapis.com/drive/v3/files'

export interface DriveUploadResult {
  ok: boolean
  /** Web link to the uploaded Drive file, when successful. */
  link?: string
  fileId?: string
  fileName?: string
  /** Why the upload didn't happen / failed. */
  reason?: 'not-configured' | 'error'
  message?: string
}

export interface DriveUploadProgress {
  /** 0–100 */
  percent: number
  status: 'auth' | 'initiating' | 'uploading' | 'finalizing' | 'done' | 'error'
}

/**
 * Upload an existing video file (already produced by the
 * FeelFX pipeline) to the user's Google Drive.
 *
 * @param file    The existing video File/Blob — NOT re-processed.
 * @param onProgress  Progress callback (0–100).
 */
export async function uploadToDrive(
  file: Blob,
  fileName: string,
  onProgress?: (progress: DriveUploadProgress) => void
): Promise<DriveUploadResult> {
  try {
    onProgress?.({
      percent: 0,
      status: 'auth'
    })

    const token = await getGoogleAccessToken([
      DRIVE_SCOPE
    ])

    if (!token) {
      return {
        ok: false,
        reason: 'not-configured',
        message:
          'Google Drive export is not configured. Add VITE_GOOGLE_CLIENT_ID to your .env.local (see README).'
      }
    }

    onProgress?.({
      percent: 2,
      status: 'initiating'
    })

    /*
     * Step 1 — start a resumable session.
     */
    const initResponse = await fetch(DRIVE_UPLOAD_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8'
      },
      body: JSON.stringify({
        name: fileName,
        mimeType: file.type || 'video/mp4'
      })
    })

    if (initResponse.status === 401) {
      clearGoogleToken()
      throw new Error('Google session expired — please try again.')
    }

    if (!initResponse.ok) {
      const detail = await initResponse.text()
      throw new Error(
        `Drive upload could not start (${initResponse.status}): ${detail}`
      )
    }

    const uploadUrl =
      initResponse.headers.get('Location') ??
      initResponse.headers.get('location')

    if (!uploadUrl) {
      throw new Error(
        'Drive did not return a resumable upload URL.'
      )
    }

    /*
     * Step 2 — upload the bytes with progress.
     */
    const uploadedFileId = await new Promise<string>(
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
                  new Error('Drive upload returned no file id.')
                )
                return
              }

              resolve(response.id)
            } catch {
              reject(
                new Error(
                  'Drive upload returned an unreadable response.'
                )
              )
            }
          } else {
            reject(
              new Error(
                `Drive upload failed (${xhr.status}): ${xhr.responseText}`
              )
            )
          }
        }

        xhr.onerror = () => {
          reject(
            new Error(
              'Network error while uploading to Drive.'
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
      percent: 98,
      status: 'finalizing'
    })

    /*
     * Step 3 — fetch the webViewLink so the user
     * can open the uploaded file.
     */
    let link: string | undefined

    try {
      const metaResponse = await fetch(
        `${DRIVE_FILES_URL}/${uploadedFileId}?fields=id,name,webViewLink`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (metaResponse.ok) {
        const meta =
          (await metaResponse.json()) as {
            webViewLink?: string
          }

        link = meta.webViewLink
      }
    } catch {
      // Link fetch is best-effort; the upload itself succeeded.
    }

    onProgress?.({
      percent: 100,
      status: 'done'
    })

    return {
      ok: true,
      fileId: uploadedFileId,
      link:
        link ??
        `https://drive.google.com/file/d/${uploadedFileId}/view`,
      fileName
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
          : 'Unknown Drive upload error.'
    }
  }
}