import type { CulturalAnalysis, CultureHelpMode, LanguageCode } from '../types'
import { mockCultureService } from './mockCultureService'
import { analyzeOffline } from '../../shared/engine.mjs'

export type CultureResult =
  | { cultureDetected: false }
  | { cultureDetected: true; analysis: CulturalAnalysis }

export interface CultureService {
  /** 문장에서 오해될 수 있는 문화 표현을 분석한다. */
  analyze(text: string, lang: LanguageCode): Promise<CultureResult>
}

/** 실제 AI 서비스로 교체할 때 이 할당만 바꾼다. */
export const cultureService: CultureService = {
  async analyze(text, lang) {
    const analysis = analyzeOffline(text, lang)
    if (analysis) return { cultureDetected: true, analysis }
    return mockCultureService.analyze(text, lang)
  },
}

/** 작성 중 입력창 위에 문화 표현 안내를 띄울지 */
export function shouldShowComposerHint(analysis: CulturalAnalysis, mode: CultureHelpMode) {
  const level = analysis.interventionLevel
  switch (mode) {
    case 'off':
      return false
    case 'minimal':
      // 발신 중 안내는 거의 표시하지 않는다 (실제 오해 위험이 높은 warn만)
      return level === 'warn'
    case 'all':
      return level !== 'silent'
    case 'important':
      // TODO: 실제 서비스에서는 confidence / risk threshold 적용 예정
      // (warn은 항상, inform은 threshold 이상일 때만). 현재는 시연을 위해 demo inform 사례도 표시한다.
      return level === 'inform' || level === 'warn'
  }
}

/** 받은 메시지에서 문화 맥락 탭 / 표현 설명을 보여줄지 */
export function shouldShowReceiverCulture(mode: CultureHelpMode, analysis?: CulturalAnalysis | null) {
  if (mode === 'off') return false
  if (mode === 'all') return true
  return mode === 'minimal' ? analysis?.interventionLevel === 'warn' : analysis?.interventionLevel !== 'silent'
}

