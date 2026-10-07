export type LanguageCode = 'ko' | 'ja' | 'en' | 'zh-TW'

export type User = {
  id: string
  name: string
  flag: string
  lang: LanguageCode
  color: string
  country?: string
}

export type Room = {
  id: string
  /** 그룹방 이름. 1:1 방은 상대 이름으로 표시한다. */
  name?: string
  memberIds: string[]
  unread: number
  language?: LanguageCode
  kind?: 'global' | 'language' | 'private'
}

/** 언어별 번역 결과. cultural은 이후 문화 맥락 번역용으로 예약. */
export type Translation = {
  standard: string
  cultural?: string
  /** 한국어 발신자의 전달 확인용: 각 번역이 한국어로 어떤 의미인지 */
  meaningKo?: { standard: string; cultural?: string }
  /** 문화 맥락 번역에 반영된 뉘앙스 */
  nuance?: string
}

export type TranslationMap = Partial<Record<LanguageCode, Translation>>

export type MisunderstandingLevel = '낮음' | '중간' | '높음'

/**
 * 문화 표현 개입 수준. 탐지되었다고 해서 수정을 권고하지 않는다.
 * - silent: 문화 맥락 번역만으로 충분. 발신자에게 표시하지 않음
 * - inform: 뉘앙스 손실 가능. 작은 안내 + 설명만 (수정 권고 없음)
 * - warn: 실제 오해 가능성이 높음. 강한 안내, 대체 표현 제안 가능
 */
export type InterventionLevel = 'silent' | 'inform' | 'warn'

/** 메시지 안의 문화 표현 분석 결과 */
export type CulturalAnalysis = {
  localized?: Partial<Record<LanguageCode, Omit<CulturalAnalysis, 'localized'>>>
  expression: string
  category: string
  /** 시트에 표시할 짧은 분류명 */
  categoryLabel: string
  /** 발신 중 안내에 표시할 짧은 이름 (예: 문화 표현, 지역 표현) */
  hintLabel: string
  region?: string
  interventionLevel: InterventionLevel
  meaning: string
  contextMeaning: string
  tone: string
  misunderstandingLevel?: MisunderstandingLevel
  /** warn에서만 사용하는 대체 표현 */
  senderAlternativeText?: string
  /** 발신자 시트 문구 */
  senderGuide: { description: string; context: string; tone: string; deliveryNote: string }
  /** 수신자 시트 문구 */
  receiverGuide: { description: string; context: string; tone: string }
}

/** 받은 메시지 번역 표시 방식 */
export type TranslationMode = 'always' | 'foreign' | 'tap' | 'off'

/** 문화 표현 도움 수준 */
export type CultureHelpMode = 'important' | 'all' | 'minimal' | 'off'

export type Message = {
  id: string
  roomId: string
  senderId: string
  originalText: string
  originalLanguage: LanguageCode
  /** 수신 언어별 번역. 요청이 끝났는데 키가 없으면 번역 미지원. */
  translations: TranslationMap
  translationStatus: 'pending' | 'done'
  culturalAnalysis: CulturalAnalysis | null
  createdAt: string
  processingError?: string
}

