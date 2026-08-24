import {
  AIVideoAnalyzer,
  type AIAnalysis
} from './aiVideoAnalyzer'

export type VideoAnalysis =
  AIAnalysis

export class FeelAnalyzer {
  private video: HTMLVideoElement

  private ai =
    new AIVideoAnalyzer()

  constructor(
    video: HTMLVideoElement
  ) {
    this.video =
      video
  }

  async analyze(
    transcript = '',
    onProgress?: (
      message: string
    ) => void
  ): Promise<VideoAnalysis> {
    const analysis =
      await this.ai.analyze(
        this.video,
        onProgress
      )

    if (
      transcript.trim().length > 0
    ) {
      analysis.transcript =
        transcript
    }

    return analysis
  }

  destroy() {
    ;(this.ai as {
      destroy?: () => void
    }).destroy?.()
  }
}