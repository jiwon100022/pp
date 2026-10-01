import { useEffect, useState } from 'react'
import { LANGUAGES } from '../data/languages'
import type { LanguageCode, Message, Translation, User } from '../types'
import { IconClose } from './Icons'

type Props = {
  message: Message
  targets: LanguageCode[]
  members: User[]
  onClose: () => void
}

function Field({
  label,
  text,
  lang,
  accent,
}: {
  label: string
  text: string
  lang?: string
  accent?: boolean
}) {
  return (
    <div className="dp-field">
      <div className={`dp-field__label${accent ? ' dp-field__label--accent' : ''}`}>{label}</div>
      <p className="dp-field__text" lang={lang}>
        {text}
      </p>
    </div>
  )
}

function Meaning({ text }: { text?: string }) {
  if (!text) return null
  return (
    <div className="dp-meaning">
      <span className="dp-meaning__label">한국어 의미 확인</span>
      <p lang="ko">{text}</p>
    </div>
  )
}

function Detail({ message, lang, translation }: { message: Message; lang: LanguageCode; translation?: Translation }) {
  if (!translation) {
    return (
      <p className="dp-empty">
        {message.translationStatus === 'pending' ? '번역 중…' : '번역 미지원 — 상대에게 원문 그대로 표시됩니다'}
      </p>
    )
  }

  if (translation.cultural && message.culturalAnalysis) {
    return (
      <>
        <div className="dp-block">
          <Field label="기본 번역" text={translation.standard} lang={lang} />
          <Meaning text={translation.meaningKo?.standard} />
        </div>
        <div className="dp-block dp-block--culture">
          <Field label="✨ 문화 맥락" text={translation.cultural} lang={lang} accent />
          <Meaning text={translation.meaningKo?.cultural} />
        </div>
        {translation.nuance && (
          <div className="dp-row">
            <span className="dp-row__label">반영된 뉘앙스</span>
            <span>{translation.nuance}</span>
          </div>
        )}
        <div className="dp-row">
          <span className="dp-row__label">상대 기본 표시</span>
          <span className="dp-check">✓ 문화 맥락</span>
        </div>
      </>
    )
  }

  return (
    <div className="dp-block">
      <Field label="상대에게 표시되는 번역" text={translation.standard} lang={lang} />
      <Meaning text={translation.meaningKo?.standard} />
    </div>
  )
}

/** 발신자가 수신 언어별 번역 결과를 확인하는 패널 */
export default function DeliveryPanel({ message, targets, members, onClose }: Props) {
  const [openLang, setOpenLang] = useState<LanguageCode | null>(targets[0] ?? null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const isCultural = Boolean(message.culturalAnalysis)

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="delivery-panel"
        role="dialog"
        aria-modal="true"
        aria-label="번역 확인"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="delivery-panel__header">
          <h3>번역 확인</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="닫기">
            <IconClose size={18} />
          </button>
        </header>

        <div className="delivery-panel__body">
          <section className="delivery-panel__section">
            <div className="delivery-panel__label">
              보낸 원문 · {LANGUAGES[message.originalLanguage].native}
            </div>
            <p className="delivery-panel__original" lang={message.originalLanguage}>
              {message.originalText}
            </p>
          </section>

          <section className="delivery-panel__section">
            <div className="delivery-panel__label">수신 언어</div>
            <ul className="delivery-panel__list">
              {targets.map((lang) => {
                const translation = message.translations[lang]
                const recipients = members
                  .filter((u) => u.lang === lang && u.id !== message.senderId)
                  .map((u) => u.name)
                  .join(', ')
                const open = openLang === lang
                const status = !translation
                  ? message.translationStatus === 'pending'
                    ? '번역 중…'
                    : '원문으로 전달 (번역 미지원)'
                  : isCultural && translation.cultural
                    ? '✓ 문화 맥락으로 전달'
                    : '번역되어 전달'

                return (
                  <li key={lang} className={`dp-item${open ? ' is-open' : ''}`}>
                    <button
                      type="button"
                      className="dp-item__head"
                      aria-expanded={open}
                      onClick={() => setOpenLang(open ? null : lang)}
                    >
                      <span className="dp-item__chevron" aria-hidden="true">
                        ›
                      </span>
                      <span className="dp-item__title">
                        <span className="dp-item__lang">
                          {LANGUAGES[lang].native}
                          <span className="dp-item__who"> · {recipients}</span>
                        </span>
                        <span
                          className={`dp-item__status${translation?.cultural && isCultural ? ' is-culture' : ''}`}
                        >
                          {status}
                        </span>
                      </span>
                    </button>
                    {open && (
                      <div className="dp-item__body">
                        <Detail message={message} lang={lang} translation={translation} />
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

