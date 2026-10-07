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
import { useLocale } from '../i18n'
import BottomSheet from './BottomSheet'
import { Avatar } from './Avatar'
import { ReceiverCultureSheet, SenderCultureSheet } from './CultureSheets'
import DeliveryPanel from './DeliveryPanel'
import { DeliveryNote, TranslationCard } from './MessageTranslation'
import { CultureSettingsSheet, TranslationSettingsSheet } from './SettingsSheets'
import SummarySheet from './SummarySheet'
import { IconBack, IconMore, IconSearch, IconSend } from './Icons'

type Props = {
  room: Room
  messages: Message[]
  currentUser: User
  translationMode: TranslationMode
  cultureMode: CultureHelpMode
  onTranslationModeChange: (mode: TranslationMode) => void
  onCultureModeChange: (mode: CultureHelpMode) => void
  onSend: (text: string) => Promise<void>
  onBack: () => void
}

type MenuSheet = 'summary' | 'translation' | 'culture' | 'members'

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
  const { t, lang } = useLocale()
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false), [sendError, setSendError] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false), [query, setQuery] = useState('')
  const visibleMessages = messages.filter(m => !query.trim() || [m.originalText, m.translations[lang]?.standard, m.translations[lang]?.cultural].some(text => text?.toLowerCase().includes(query.trim().toLowerCase())))
  const exportChat = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ room: getRoomTitle(room, currentUser.id), messages }, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = `synapse-${room.id}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
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

  const submit = async () => {
    const text = draft.trim()
    if (!text || sending) return
    setSending(true); setSendError(false)
    try {
      await onSend(text)
      setDraft(previous => previous.trim() === text ? '' : previous)
      setDraftCulture(null)
    } catch { setSendError(true) }
    finally { setSending(false); inputRef.current?.focus() }
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
        <button type="button" className="icon-btn room__back" onClick={onBack} aria-label={t('back')}>
          <IconBack size={20} />
        </button>
        <div className="room__heading">
          <div className="room__title">
            <h2>{getRoomTitle(room, currentUser.id)}</h2>
            {!isGroup && <span className="room__flag">{partner.flag}</span>}
          </div>
          <p className="room__meta">
            {members.length} {t('onlinePeople')} · {languageCount} {t('languages')}
          </p>
        </div>
        <div className="room__actions" ref={menuRef}>
          <button type="button" className="icon-btn" aria-label={t('searchMessages')} onClick={() => { setSearchOpen(previous => !previous); setQuery('') }}>
            <IconSearch size={19} />
          </button>
          <button
            type="button"
            className={`icon-btn${menuOpen ? ' is-active' : ''}`}
            aria-label={t('menu')}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <IconMore size={19} />
          </button>

          {menuOpen && (
            <nav className="room-menu" aria-label={t('menu')}>
              {([['members'], ['summary', 'translation', 'culture'], ['export']] as const).map((group, gi) => (
                <ul key={gi} className="room-menu__group">
                  {group.map((label) => (
                    <li key={label}>
                      <button
                        type="button"
                        className="room-menu__item"
                        onClick={() => {
                          setMenuOpen(false)
                          if (label === 'export') exportChat()
                          else setOpenSheet(label)
                        }}
                      >
                        <span>{label === 'summary' ? `✨ ${t(label)}` : t(label)}</span>
                        {label === 'members' && (
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

      {searchOpen && <label className="message-search"><input autoFocus type="search" placeholder={t('searchMessages')} value={query} onChange={e => setQuery(e.target.value)} /><small>{visibleMessages.length} / {messages.length}</small></label>}

      <div className="room__messages" ref={listRef}>
        {!visibleMessages.length && <p className="empty-room">{t(query ? 'noResults' : 'empty')}</p>}

        {visibleMessages.map((m, i) => {
          const prev = visibleMessages[i - 1]
          const next = visibleMessages[i + 1]
          const sender = users[m.senderId]
          const isMine = m.senderId === currentUser.id
          const time = formatTime(m.createdAt, lang)
          const startsGroup = !prev || prev.senderId !== m.senderId
          const showTime =
            !next || next.senderId !== m.senderId || formatTime(next.createdAt, lang) !== time
          const needsTranslation = !isMine && (m.originalLanguage !== currentUser.lang || translationMode === 'always')
          const targets = isMine ? getTargetLanguages(roomLanguages, m.originalLanguage) : []

          return (
            <div className="message-entry" key={m.id}>
            {(!prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString()) && <div className="date-divider"><span>{new Intl.DateTimeFormat(lang, { dateStyle: 'full' }).format(new Date(m.createdAt))}</span></div>}
            <div
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
                    message={m.originalLanguage === currentUser.lang ? { ...m, translations: { ...m.translations, [currentUser.lang]: { standard: m.originalText } } } : m}
                    lang={currentUser.lang}
                    showCulture={shouldShowReceiverCulture(cultureMode, m.culturalAnalysis)}
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
            </div></div>
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
          analysis={explainMessage.culturalAnalysis.localized?.[lang] || explainMessage.culturalAnalysis}
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
      {openSheet === 'members' && <BottomSheet title={t('members')} onClose={closeSheet}><ul className="member-list">{members.map(member => <li key={member.id}><Avatar user={member} /> {member.flag} {member.name} <small>{member.lang}</small></li>)}</ul></BottomSheet>}
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
              ⚠ {t('risk')}
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

      {sendError && <p className="send-error" role="alert">{t('sendError')}</p>}
      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <div className="composer__field">
          <textarea
            ref={inputRef}
            rows={1}
            value={draft}
            placeholder={t('message')}
            aria-label={t('message')}
            maxLength={4000}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button type="submit" className="composer__send" disabled={!draft.trim() || sending} aria-label={t('send')}>
          <IconSend size={16} />
        </button>
      </form>
    </section>
  )
}

