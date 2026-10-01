import type { LanguageCode, TranslationMap } from '../types'
import { mockTranslationService } from './mockTranslationService'

export interface TranslationService {
  /**
   * text를 targets 언어들로 번역한다.
   * 번역할 수 없는 언어는 결과에서 제외한다 (임의 번역 금지).
   */
  translate(text: string, from: LanguageCode, targets: LanguageCode[]): Promise<TranslationMap>
}

/** 실제 번역 API로 교체할 때 이 할당만 바꾼다. */
export const translationService: TranslationService = mockTranslationService

/** 발신 언어와 다른, 수신자들의 언어 목록 (중복 제거). */
export function getTargetLanguages(memberLanguages: LanguageCode[], from: LanguageCode) {
  return [...new Set(memberLanguages)].filter((lang) => lang !== from)
}

