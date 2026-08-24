import type { AIAnalysis } from './aiVideoAnalyzer'

export type FeelEvent = {
  time: number
  endTime: number
  type:
    | 'speech'
    | 'visual'
    | 'location'
    | 'emphasis'
    | 'people'
    | 'nature'
    | 'product'
    | 'scene'
  event: string
  confidence: number
  motion: {
    type: string
    animation: string
    intensity: 'low' | 'medium' | 'high'
  }
}

export type MotionDSL = {
  generatedBy: 'FeelFX AI'
  feel: AIAnalysis['feel']
  events: FeelEvent[]
}

const LOCATION_WORDS = [
  'india',
  'goa',
  'delhi',
  'mumbai',
  'london',
  'paris',
  'tokyo',
  'new york',
  'dubai',
  'beach',
  'mountain',
  'hotel',
  'airport',
  'city',
  'travel',
  'destination'
]

const EMPHASIS_WORDS = [
  'important',
  'remember',
  'key',
  'because',
  'but',
  'however',
  'first',
  'second',
  'finally',
  'percent',
  '%',
  'million',
  'billion',
  'best',
  'most',
  'never',
  'always'
]

function wordsIn(
  text: string,
  words: string[]
) {
  return words.filter(word =>
    text.includes(word)
  )
}

function cleanText(text: string) {
  return text
    .replace(/\s+/g, ' ')
    .trim()
}

export function generateEvents(
  analysis: AIAnalysis
): FeelEvent[] {
  const events: FeelEvent[] = []

  for (
    const segment of analysis.transcriptSegments
  ) {
    const text =
      cleanText(segment.text)

    if (!text) continue

    const lower =
      text.toLowerCase()

    const locations =
      wordsIn(
        lower,
        LOCATION_WORDS
      )

    const emphasis =
      wordsIn(
        lower,
        EMPHASIS_WORDS
      )

    events.push({
      time: segment.start,
      endTime: segment.end,
      type: 'speech',
      event: text,
      confidence: 0.9,
      motion:
        getSpeechMotion(
          analysis.feel
        )
    })

    if (locations.length > 0) {
      events.push({
        time: segment.start,
        endTime: segment.end,
        type: 'location',
        event:
          `Location mentioned: ${locations.join(', ')}`,
        confidence: 0.92,
        motion:
          getLocationMotion(
            analysis.feel
          )
      })
    }

    if (emphasis.length > 0) {
      events.push({
        time: segment.start,
        endTime: segment.end,
        type: 'emphasis',
        event:
          `Emphasis detected: ${emphasis.join(', ')}`,
        confidence: 0.86,
        motion:
          getEmphasisMotion(
            analysis.feel
          )
      })
    }
  }

  for (
    const frame of analysis.visualFrames
  ) {
    const description =
      cleanText(
        frame.description
      )

    if (!description) continue

    const lower =
      description.toLowerCase()

    if (
      /\b(beach|ocean|sea|mountain|landscape|forest|nature|lake)\b/.test(
        lower
      )
    ) {
      events.push({
        time: frame.time,
        endTime:
          frame.time + 1.5,
        type: 'nature',
        event:
          `Nature/landscape detected: ${description}`,
        confidence: 0.82,
        motion:
          getNatureMotion(
            analysis.feel
          )
      })
    }

    if (
      /\b(person|people|man|woman|crowd|group)\b/.test(
        lower
      )
    ) {
      events.push({
        time: frame.time,
        endTime:
          frame.time + 1.5,
        type: 'people',
        event:
          `People detected: ${description}`,
        confidence: 0.8,
        motion:
          getPeopleMotion(
            analysis.feel
          )
      })
    }

    if (
      /\b(phone|laptop|computer|screen|product|device|software|interface)\b/.test(
        lower
      )
    ) {
      events.push({
        time: frame.time,
        endTime:
          frame.time + 1.5,
        type: 'product',
        event:
          `Product/interface detected: ${description}`,
        confidence: 0.82,
        motion:
          getProductMotion(
            analysis.feel
          )
      })
    }

    events.push({
      time: frame.time,
      endTime:
        frame.time + 1.5,
      type: 'visual',
      event:
        `Visual scene: ${description}`,
      confidence: 0.75,
      motion:
        getVisualMotion(
          analysis.feel
        )
    })
  }

  return deduplicateEvents(
    events.sort(
      (a, b) =>
        a.time - b.time
    )
  )
}

function getSpeechMotion(
  feel: AIAnalysis['feel']
) {
  switch (feel) {
    case 'corporate':
      return {
        type: 'text',
        animation: 'masked-slide-up',
        intensity: 'low' as const
      }

    case 'educational':
      return {
        type: 'text',
        animation: 'fade-up',
        intensity: 'medium' as const
      }

    case 'travel':
      return {
        type: 'text',
        animation: 'drift-up',
        intensity: 'low' as const
      }

    case 'music':
      return {
        type: 'text',
        animation: 'beat-hit',
        intensity: 'high' as const
      }

    case 'casual':
      return {
        type: 'text',
        animation: 'pop',
        intensity: 'medium' as const
      }

    case 'energetic':
      return {
        type: 'text',
        animation: 'slam',
        intensity: 'high' as const
      }

    default:
      return {
        type: 'text',
        animation: 'cinematic-fade',
        intensity: 'low' as const
      }
  }
}

function getLocationMotion(
  feel: AIAnalysis['feel']
) {
  if (feel === 'travel') {
    return {
      type: 'location',
      animation: 'map-pin',
      intensity: 'medium' as const
    }
  }

  return {
    type: 'text',
    animation: 'reveal',
    intensity: 'low' as const
  }
}

function getEmphasisMotion(
  feel: AIAnalysis['feel']
) {
  switch (feel) {
    case 'educational':
      return {
        type: 'highlight',
        animation: 'draw-box',
        intensity: 'medium' as const
      }

    case 'music':
    case 'energetic':
      return {
        type: 'camera',
        animation: 'punch-in',
        intensity: 'high' as const
      }

    default:
      return {
        type: 'highlight',
        animation: 'underline',
        intensity: 'medium' as const
      }
  }
}

function getNatureMotion(
  feel: AIAnalysis['feel']
) {
  if (feel === 'travel') {
    return {
      type: 'camera',
      animation: 'slow-push',
      intensity: 'low' as const
    }
  }

  return {
    type: 'image',
    animation: 'parallax',
    intensity: 'medium' as const
  }
}

function getPeopleMotion(
  feel: AIAnalysis['feel']
) {
  if (feel === 'casual') {
    return {
      type: 'text',
      animation: 'pop',
      intensity: 'medium' as const
    }
  }

  return {
    type: 'circle',
    animation: 'draw',
    intensity: 'low' as const
  }
}

function getProductMotion(
  feel: AIAnalysis['feel']
) {
  if (feel === 'educational') {
    return {
      type: 'arrow',
      animation: 'spring',
      intensity: 'medium' as const
    }
  }

  return {
    type: 'highlight',
    animation: 'outline',
    intensity: 'medium' as const
  }
}

function getVisualMotion(
  feel: AIAnalysis['feel']
) {
  switch (feel) {
    case 'travel':
      return {
        type: 'camera',
        animation: 'fluid-pan',
        intensity: 'low' as const
      }

    case 'music':
      return {
        type: 'camera',
        animation: 'beat-punch',
        intensity: 'high' as const
      }

    case 'energetic':
      return {
        type: 'camera',
        animation: 'rapid-punch',
        intensity: 'high' as const
      }

    default:
      return {
        type: 'camera',
        animation: 'subtle-zoom',
        intensity: 'low' as const
      }
  }
}

function deduplicateEvents(
  events: FeelEvent[]
) {
  const result: FeelEvent[] = []

  for (const event of events) {
    const duplicate =
      result.some(
        existing =>
          Math.abs(
            existing.time -
              event.time
          ) < 0.4 &&
          existing.type ===
            event.type
      )

    if (!duplicate) {
      result.push(event)
    }
  }

  return result
}