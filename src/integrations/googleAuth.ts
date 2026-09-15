/* =========================================================
 * FeelFX — Google OAuth (optional integration)
 *
 * Isolated module. FeelFX core (analysis → DSL →
 * Three.js/GSAP rendering) does NOT depend on this.
 *
 * Uses Google Identity Services (GIS) implicit-flow
 * token client. Only a public OAuth Client ID is needed
 * in the browser (no secret — SPAs must not have one).
 *
 * If VITE_GOOGLE_CLIENT_ID is not configured, callers
 * get `null` and the FeelFX app keeps working normally.
 * ========================================================= */

/*
 * Minimal shape of the GIS token client we use.
 * Declared locally so we don't need @types/google.accounts.
 */
interface GisTokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void
}

interface GisTokenResponse {
  access_token?: string
  expires_in?: number
  error?: string
}

interface GisGlobal {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string
        scope: string
        callback: (response: GisTokenResponse) => void
      }) => GisTokenClient
    }
  }
}

const GIS_SCRIPT_URL =
  'https://accounts.google.com/gsi/client'

/*
 * Scopes for the two optional integrations:
 *  - drive.file  → create/manage ONLY files this app created
 *  - youtube.upload → upload videos to the user's channel
 */
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/youtube.upload'
].join(' ')

/** OAuth Client ID from Vite env (VITE_GOOGLE_CLIENT_ID). */
export function getGoogleClientId(): string | null {
  const clientId = import.meta.env
    .VITE_GOOGLE_CLIENT_ID as string | undefined

  return clientId ? clientId.trim() : null
}

/** True when Google credentials are configured. */
export function isGoogleConfigured(): boolean {
  return getGoogleClientId() !== null
}

let gisScriptPromise: Promise<GisGlobal> | null = null
let cachedAccessToken: string | null = null
let tokenExpiry = 0

/**
 * Dynamically loads the GIS script once.
 * Rejects if the script can't be loaded (offline, blocked, etc.).
 */
function loadGis(): Promise<GisGlobal> {
  if (gisScriptPromise) {
    return gisScriptPromise
  }

  gisScriptPromise = new Promise(
    (resolve, reject) => {
      const existing =
        document.querySelector<HTMLScriptElement>(
          `script[src="${GIS_SCRIPT_URL}"]`
        )

      if (existing) {
        if ((window as unknown as GisGlobal).accounts) {
          resolve(window as unknown as GisGlobal)
        } else {
          existing.addEventListener('load', () =>
            resolve(window as unknown as GisGlobal)
          )
          existing.addEventListener('error', () =>
            reject(new Error('Failed to load Google Identity Services'))
          )
        }
        return
      }

      const script =
        document.createElement('script')

      script.src = GIS_SCRIPT_URL
      script.async = true
      script.defer = true

      script.onload = () =>
        resolve(window as unknown as GisGlobal)

      script.onerror = () =>
        reject(
          new Error(
            'Failed to load Google Identity Services'
          )
        )

      document.head.appendChild(script)
    }
  )

  return gisScriptPromise
}

/**
 * Returns a valid Google OAuth access token,
 * prompting the user via the GIS popup when needed.
 *
 * Returns `null` (never throws for config issues)
 * when Google is not configured.
 */
export async function getGoogleAccessToken(): Promise<
  string | null
> {
  const clientId = getGoogleClientId()

  if (!clientId) {
    return null
  }

  // Reuse a still-valid token.
  const now = Date.now()

  if (
    cachedAccessToken &&
    now < tokenExpiry - 60_000
  ) {
    return cachedAccessToken
  }

  const gis = await loadGis()

  const token =
    await new Promise<string>(
      (resolve, reject) => {
        const tokenClient =
          gis.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: GOOGLE_SCOPES,
            callback: response => {
              if (response.error) {
                reject(
                  new Error(
                    `Google auth failed: ${response.error}`
                  )
                )
                return
              }

              if (!response.access_token) {
                reject(
                  new Error(
                    'Google auth returned no access token'
                  )
                )
                return
              }

              cachedAccessToken =
                response.access_token

              tokenExpiry =
                Date.now() +
                (response.expires_in ?? 3600) * 1000

              resolve(response.access_token)
            }
          })

        tokenClient.requestAccessToken({
          prompt: cachedAccessToken ? '' : 'consent'
        })
      }
    )

  return token
}

/** Clears the cached token (used after an auth error). */
export function clearGoogleToken(): void {
  cachedAccessToken = null
  tokenExpiry = 0
}