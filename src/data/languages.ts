import type { LanguageCode } from '../types'

export const LANGUAGES: Record<LanguageCode, { native: string; ko: string }> = {
  ko: { native: '한국어', ko: '한국어' },
  ja: { native: '日本語', ko: '일본어' },
  en: { native: 'English', ko: '영어' },
  'zh-TW': { native: '中文(繁體)', ko: '중국어(번체)' },
}

