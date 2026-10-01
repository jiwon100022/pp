import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { users, getPartner, getRoomLanguages, getRoomTitle, isGroupRoom } from '../data/mockData'
import {
  cultureService,
  shouldShowComposerHint,
  shouldShowReceiverCulture,
} from '../services/cultureService'
import { getTargetLanguages } from '../services/translationService'
import type {
  CulturalAnalysis,
  CultureHelpMode,
  Message,
  Room,
  TranslationMode,
  User,
} from '../types'
import { formatTime } from '../utils/time'
import { Avatar } from './Avatar'
import { ReceiverCultureSheet, SenderCultureSheet } from './CultureSheets'
import DeliveryPanel from './DeliveryPanel'
import { DeliveryNote, TranslationCard } from './MessageTranslation'
import { CultureSettingsSheet, TranslationSettingsSheet } from './SettingsSheets'
import SummarySheet from './SummarySheet'
import { IconBack, IconMore, IconPlus, IconSearch, IconSend } from './Icons'

type Props = {
  room: Room
  messages: Message[]
  currentUser: User
  translationMode: TranslationMode
  cultureMode: CultureHelpMode
  onTranslationModeChange: (mode: TranslationMode) => void
  onCultureModeChange: (mode: CultureHelpMode) => void
  onSend: (text: string) => void
  onBack: () => void
}

const todayLabel = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
}).format(new Date())

const MENU_GROUPS = [
  ['멤버', '사진 / 파일', '링크'],
  ['대화 요약', '번역 설정', '문화 표현 설정'],
  ['알림', '채팅방 설정'],
]

type MenuSheet = 'summary' | 'translation' | 'culture'

const MENU_SHEETS: Record<string, MenuSheet | undefined> = {
  '대화 요약': 'summary',
  '번역 설정': 'translation',
  '문화 표현 설정': 'culture',
}

export default function ChatRoom({
  room,
  messages,
  currentUser,
  translationMode,
  cultureMode,
  onTranslationModeChange,
  onCultureModeChange,
  onSend,
  onBack,
}: Props) {
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const members = room.memberIds.map((id) => users[id])
  const isGroup = isGroupRoom(room)
  const partner = getPartner(room, currentUser.id)
  const roomLanguages = getRoomLanguages(room)
  const languageCount = new Set(roomLanguages).size

  const [deliveryMessageId, setDeliveryMessageId] = useState<string | null>(null)
  const deliveryMessage = messages.find((m) => m.id === deliveryMessageId)
  const closeDelivery = useCallback(() => setDeliveryMessageId(null), [])

  const [explainMessageId, setExplainMessageId] = useState<string | null>(null)
  const explainMessage = messages.find((m) => m.id === explainMessageId)
  const closeExplain = useCallback(() => setExplainMessageId(null), [])

  // 작성 중 문장의 문화 표현 안내 (전송은 막지 않는다)
  // 분석 결과는 분석한 문장(text)과 함께 저장해, 입력이 바뀌면 이전 결과를 쓰지 않는다.
  const [draftCulture, setDraftCulture] = useState<{
    text: string
    analysis: CulturalAnalysis
  } | null>(null)
  // 발신자 시트는 열 때의 composer 분석 결과를 그대로 사용한다.
  const [senderSheetAnalysis, setSenderSheetAnalysis] = useState<CulturalAnalysis | null>(null)
  const closeCultureSheet = useCallback(() => setSenderSheetAnalysis(null), [])
  const hasForeignRecipients = getTargetLanguages(roomLanguages, currentUser.lang).length > 0
  const draftText = draft.trim()

  useEffect(() => {
    // 입력이 바뀌면 이전 문장의 분석 결과를 즉시 버린다
    setDraftCulture(null)
    if (!draftText || !hasForeignRecipients) return

    let cancelled = false
    const timer = setTimeout(() => {
      cultureService
        .analyze(draftText, currentUser.lang)
        .then((result) => {
          if (!cancelled && result.cultureDetected) {
            setDraftCulture({ text: draftText, analysis: result.analysis })
          }
        })
        .catch(() => {})
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [draftText, currentUser.lang, hasForeignRecipients])

  // 현재 입력과 일치하는 분석만 사용. silent이거나 설정상 숨기는 경우 안내하지 않는다
  const currentAnalysis = draftCulture?.text === draftText ? draftCulture.analysis : null
  const composerHint =
    currentAnalysis && shouldShowComposerHint(currentAnalysis, cultureMode) ? currentAnalysis : null

  // 안내 바가 나타나 목록이 줄어들 때 하단에 있었다면 하단 유지
  useEffect(() => {
    const el = listRef.current
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 80) el.scrollTop = el.scrollHeight
  }, [composerHint])

  // warn 전용: 대체 표현을 입력창에만 반영 (자동 전송 금지)
  const applyAlternative = () => {
    if (!senderSheetAnalysis?.senderAlternativeText) return
    setDraft(senderSheetAnalysis.senderAlternativeText)
    setDraftCulture(null)
    setSenderSheetAnalysis(null)
    inputRef.current?.focus()
  }

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const [openSheet, setOpenSheet] = useState<MenuSheet | null>(null)
  const closeSheet = useCallback(() => setOpenSheet(null), [])

  useEffect(() => {
    if (!menuOpen) return
    const handlePointer = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    const handleKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('pointerdown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('pointerdown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [menuOpen])

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length])

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [draft])

  const submit = () => {
    const text = draft.trim()
    if (!text) return
    onSend(text)
    setDraft('')
    setDraftCulture(null)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <section className="room">
      <header className="room__header">
        <button type="button" className="icon-btn room__back" onClick={onBack} aria-label="채팅 목록">
          <IconBack size={20} />
        </button>
        <div className="room__heading">
          <div className="room__title">
            <h2>{getRoomTitle(room, currentUser.id)}</h2>
            {!isGroup && <span className="room__flag">{partner.flag}</span>}
          </div>
          <p className="room__meta">
            {members.length}명 · {languageCount}개 언어
          </p>
        </div>
        <div className="room__actions" ref={menuRef}>
          <button type="button" className="icon-btn" aria-label="대화 검색">
            <IconSearch size={19} />
          </button>
          <button
            type="button"
            className={`icon-btn${menuOpen ? ' is-active' : ''}`}
            aria-label="메뉴"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <IconMore size={19} />
          </button>

          {menuOpen && (
            <nav className="room-menu" aria-label="채팅방 메뉴">
              {MENU_GROUPS.map((group, gi) => (
                <ul key={gi} className="room-menu__group">
                  {group.map((label) => (
                    <li key={label}>
                      <button
                        type="button"
                        className="room-menu__item"
                        onClick={() => {
                          setMenuOpen(false)
                          const sheet = MENU_SHEETS[label]
                          if (sheet) setOpenSheet(sheet)
                        }}
                      >
                        <span>{label === '대화 요약' ? `✨ ${label}` : label}</span>
                        {label === '멤버' && (
                          <span className="room-menu__hint">{members.length}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              ))}
            </nav>
          )}
        </div>
      </header>

      <div className="room__messages" ref={listRef}>
        <div className="date-divider">
          <span>{todayLabel}</span>
        </div>

        {messages.map((m, i) => {
          const prev = messages[i - 1]
          const next = messages[i + 1]
          const sender = users[m.senderId]
          const isMine = m.senderId === currentUser.id
          const time = formatTime(m.createdAt)
          const startsGroup = !prev || prev.senderId !== m.senderId
          const showTime =
            !next || next.senderId !== m.senderId || formatTime(next.createdAt) !== time
          const needsTranslation = !isMine && m.originalLanguage !== currentUser.lang
          const targets = isMine ? getTargetLanguages(roomLanguages, m.originalLanguage) : []

          return (
            <div
              key={m.id}
              className={`msg ${isMine ? 'msg--mine' : 'msg--theirs'}${startsGroup ? ' msg--first' : ''}`}
            >
              {!isMine && (
                <div className="msg__avatar">{startsGroup && <Avatar user={sender} size={32} />}</div>
              )}
              <div className="msg__content">
                {!isMine && startsGroup && (
                  <div className="msg__sender">
                    {sender.name}
                    <span className="msg__flag">{sender.flag}</span>
                  </div>
                )}
                <div className="msg__line">
                  <div className="bubble" lang={m.originalLanguage}>
                    {m.originalText}
                  </div>
                  {showTime && <time className="msg__time">{time}</time>}
                </div>
                {needsTranslation && translationMode !== 'off' && (
                  <TranslationCard
                    key={translationMode}
                    message={m}
                    lang={currentUser.lang}
                    showCulture={shouldShowReceiverCulture(cultureMode)}
                    tapToReveal={translationMode === 'tap'}
                    onExplain={() => setExplainMessageId(m.id)}
                  />
                )}
                {targets.length > 0 && (
                  <DeliveryNote
                    message={m}
                    targets={targets}
                    onOpen={() => setDeliveryMessageId(m.id)}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {deliveryMessage && (
        <DeliveryPanel
          message={deliveryMessage}
          targets={getTargetLanguages(roomLanguages, deliveryMessage.originalLanguage)}
          members={members}
          onClose={closeDelivery}
        />
      )}

      {explainMessage?.culturalAnalysis && (
        <ReceiverCultureSheet
          originalText={explainMessage.originalText}
          analysis={explainMessage.culturalAnalysis}
          onClose={closeExplain}
        />
      )}

      {senderSheetAnalysis && (
        <SenderCultureSheet
          key={senderSheetAnalysis.expression}
          analysis={senderSheetAnalysis}
          onApply={applyAlternative}
          onClose={closeCultureSheet}
        />
      )}

      {openSheet === 'summary' && (
        <SummarySheet roomId={room.id} messages={messages} onClose={closeSheet} />
      )}
      {openSheet === 'translation' && (
        <TranslationSettingsSheet
          value={translationMode}
          onChange={onTranslationModeChange}
          onClose={closeSheet}
        />
      )}
      {openSheet === 'culture' && (
        <CultureSettingsSheet value={cultureMode} onChange={onCultureModeChange} onClose={closeSheet} />
      )}

      {composerHint && (
        <div className="culture-hint-bar">
          {composerHint.interventionLevel === 'warn' ? (
            <button
              type="button"
              className="culture-hint culture-hint--warn"
              onClick={() => setSenderSheetAnalysis(composerHint)}
            >
              ⚠ 상대에게 의도보다 강하게 들릴 수 있어요
            </button>
          ) : (
            <button
              type="button"
              className="culture-hint"
              onClick={() => setSenderSheetAnalysis(composerHint)}
            >
              ✨ {composerHint.hintLabel}
            </button>
          )}
        </div>
      )}

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <button type="button" className="icon-btn composer__attach" aria-label="첨부">
          <IconPlus size={20} />
        </button>
        <div className="composer__field">
          <textarea
            ref={inputRef}
            rows={1}
            value={draft}
            placeholder="메시지 입력"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button type="submit" className="composer__send" disabled={!draft.trim()} aria-label="전송">
          <IconSend size={16} />
        </button>
      </form>
    </section>
  )
}

