import { useState } from 'react'
import { LANGUAGES } from '../data/languages'
import type { LanguageCode, Message } from '../types'

type TranslationCardProps = {
  message: Message
  lang: LanguageCode
  /** 문화 맥락 탭 / 표현 설명 표시 여부 (문화 표현 도움 설정) */
  showCulture: boolean
  /** '탭할 때 번역' 설정: 처음엔 '번역 보기'만 표시 */
  tapToReveal: boolean
  onExplain: () => void
}

/** 수신 메시지 아래에 표시하는 번역 카드 */
export function TranslationCard({
  message,
  lang,
  showCulture,
  tapToReveal,
  onExplain,
}: TranslationCardProps) {
  const [tab, setTab] = useState<'standard' | 'cultural'>('cultural')
  const [revealed, setRevealed] = useState(!tapToReveal)
  const translation = message.translations[lang]

  if (!revealed) {
    return (
      <button type="button" className="tr-reveal" onClick={() => setRevealed(true)}>
        🌐 번역 보기
      </button>
    )
  }

  if (showCulture && translation?.cultural && message.culturalAnalysis) {
    return (
      <>
        <div className="tr-card tr-card--culture">
          <div className="tr-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'standard'}
              className={`tr-tab${tab === 'standard' ? ' is-active' : ''}`}
              onClick={() => setTab('standard')}
            >
              기본 번역
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'cultural'}
              className={`tr-tab${tab === 'cultural' ? ' is-active' : ''}`}
              onClick={() => setTab('cultural')}
            >
              ✨ 문화 맥락
            </button>
          </div>
          <div className="tr-card__text" lang={lang}>
            {tab === 'cultural' ? translation.cultural : translation.standard}
          </div>
        </div>
        <button type="button" className="culture-link" onClick={onExplain}>
          ✨ 표현 설명
        </button>
      </>
    )
  }

  if (translation) {
    return (
      <div className="tr-card" lang={lang}>
        {translation.standard}
      </div>
    )
  }

  if (message.translationStatus === 'pending') {
    return <div className="tr-card tr-card--muted">번역 중…</div>
  }

  return <div className="tr-card tr-card--muted">번역을 지원하지 않는 문장이에요 · 원문만 표시</div>
}

type DeliveryNoteProps = {
  message: Message
  targets: LanguageCode[]
  onOpen: () => void
}

/** 내가 보낸 메시지 아래의 전달 상태 표시 */
export function DeliveryNote({ message, targets, onOpen }: DeliveryNoteProps) {
  if (message.translationStatus === 'pending') {
    return <div className="delivery-note">🌐 번역 중…</div>
  }

  const translated = targets.filter((lang) => message.translations[lang])
  let label: string
  if (translated.length === 0) {
    label = '번역 미지원 · 원문으로 전달됨'
  } else {
    label =
      translated.length === 1
        ? `${LANGUAGES[translated[0]].ko}로 전달됨`
        : `${translated.length}개 언어로 전달됨`
    if (translated.length < targets.length) label += ' (일부 원문)'
  }

  return (
    <div className="delivery-note">
      🌐 {label} ·{' '}
      <button type="button" className="delivery-note__open" onClick={onOpen}>
        보기
      </button>
    </div>
  )
}

