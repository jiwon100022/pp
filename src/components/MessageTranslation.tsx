import { useState } from 'react'
import { LANGUAGES } from '../data/languages'
import type { LanguageCode, Message } from '../types'
import { useLocale } from '../i18n'

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
  const { t } = useLocale()
  const [tab, setTab] = useState<'standard' | 'cultural'>('cultural')
  const [revealed, setRevealed] = useState(!tapToReveal)
  const translation = message.translations[lang]

  if (!revealed) {
    return (
      <button type="button" className="tr-reveal" onClick={() => setRevealed(true)}>
        🌐 {t('reveal')}
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
              {t('standard')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'cultural'}
              className={`tr-tab${tab === 'cultural' ? ' is-active' : ''}`}
              onClick={() => setTab('cultural')}
            >
              ✨ {t('cultural')}
            </button>
          </div>
          <div className="tr-card__text" lang={lang}>
            {tab === 'cultural' ? translation.cultural : translation.standard}
          </div>
        </div>
        <button type="button" className="culture-link" onClick={onExplain}>
          ✨ {t('explain')}
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
    return <div className="tr-card tr-card--muted">{t('translating')}</div>
  }

  return <div className="tr-card tr-card--muted">{t(message.processingError === 'offline' ? 'offlineTranslation' : 'unavailable')}</div>
}

type DeliveryNoteProps = {
  message: Message
  targets: LanguageCode[]
  onOpen: () => void
}

/** 내가 보낸 메시지 아래의 전달 상태 표시 */
export function DeliveryNote({ message, targets, onOpen }: DeliveryNoteProps) {
  const { t } = useLocale()
  if (message.translationStatus === 'pending') {
    return <div className="delivery-note">🌐 {t('translating')}</div>
  }

  const translated = targets.filter((lang) => message.translations[lang])
  let label: string
  if (translated.length === 0) {
    label = t(message.processingError === 'offline' ? 'offlineTranslation' : 'unavailable')
  } else {
    label =
      translated.length === 1
        ? `${LANGUAGES[translated[0]].native} ✓`
        : `${translated.length} ${t('languages')} ✓`
  }

  return (
    <div className="delivery-note">
      🌐 {label} ·{' '}
      <button type="button" className="delivery-note__open" onClick={onOpen}>
        {t('view')}
      </button>
    </div>
  )
}

