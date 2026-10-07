import { useEffect, useState } from 'react'
import ChatList from './components/ChatList'
import ChatRoom from './components/ChatRoom'
import ProfileForm, { type ProfileInput } from './components/ProfileForm'
import NewChatSheet from './components/NewChatSheet'
import BottomSheet from './components/BottomSheet'
import { initialMessages, users } from './data/mockData'
import { countries, publicRooms, languages } from '../shared/engine.mjs'
import { cultureService } from './services/cultureService'
import { translationService } from './services/translationService'
import { apiBase, detectServer, isServer, request, type Snapshot } from './services/api'
import { LocaleContext, translate } from './i18n'
import type { CultureHelpMode, Message, Room, TranslationMode } from './types'

const STORAGE_KEY = 'synapse-v2'
function readLocal(): Snapshot | null {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as Snapshot | null
    if (!stored?.currentUser || !Array.isArray(stored.rooms) || !Array.isArray(stored.messages)) return null
    stored.messages = stored.messages.map(m => m.translationStatus === 'pending' ? { ...m, translationStatus: 'done', processingError: 'interrupted' } : m)
    return stored
  } catch { return null }
}
function registerUsers(snapshot: Snapshot) { Object.assign(users, snapshot.users); return snapshot }
function localStart(input: ProfileInput): Snapshot {
  const currentUser = { id: crypto.randomUUID(), ...input, flag: countries[input.country][0], color: '#1a9e57' }
  const allUsers = { ...users, [currentUser.id]: currentUser }
  const rooms = publicRooms().filter(r => r.kind === 'global' || r.language === input.lang).map(r => ({ ...r, memberIds: Object.values(allUsers).filter(u => r.kind === 'global' || u.lang === r.language).map(u => u.id) }))
  return registerUsers({ currentUser, users: allUsers, rooms, messages: initialMessages.filter(m => m.roomId === 'global'), aiEnabled: false })
}
export default function App() {
  const [state, setState] = useState<Snapshot | null>(null), [loading, setLoading] = useState(true), [startupError, setStartupError] = useState(false)
  const [activeRoomId, setActiveRoomId] = useState('global'), [mobileView, setMobileView] = useState<'list' | 'room'>('list')
  const [sheet, setSheet] = useState<'profile' | 'new' | null>(null), [notice, setNotice] = useState('')
  const [connection, setConnection] = useState('connecting'), [unread, setUnread] = useState<Record<string, number>>({})
  const [translationMode, setTranslationMode] = useState<TranslationMode>('foreign'), [cultureMode, setCultureMode] = useState<CultureHelpMode>('important')
  const receive = (snapshot: Snapshot) => setState(registerUsers(snapshot))
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const online = await detectServer()
        let snapshot: Snapshot | null = null
        if (online) {
          try { snapshot = await request<Snapshot>('/state') }
          catch (error) { if ((error as { status?: number }).status !== 401) throw error }
        } else snapshot = readLocal()
        if (!cancelled && snapshot) { receive(snapshot); setActiveRoomId(`language-${snapshot.currentUser.lang}`) }
      } catch { if (!cancelled) setStartupError(true) }
      finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [])
  const userId = state?.currentUser.id
  useEffect(() => {
    if (!userId || !isServer()) return
    const stream = new EventSource(`${apiBase}/events`, { withCredentials: true })
    stream.onopen = () => setConnection('server')
    stream.onerror = () => setConnection('disconnected')
    stream.onmessage = event => { try { receive(JSON.parse(event.data) as Snapshot) } catch { setConnection('disconnected') } }
    return () => stream.close()
  }, [userId])
  useEffect(() => {
    if (!state || isServer()) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { setNotice(translate(state.currentUser.lang, 'storageError')) }
  }, [state])
  useEffect(() => {
    if (!state) return
    document.documentElement.lang = state.currentUser.lang
    const next: Record<string, number> = {}
    try {
      for (const room of state.rooms) {
        const seen = Number(sessionStorage.getItem(`synapse-seen:${userId}:${room.id}`) || 0)
        next[room.id] = state.messages.filter(m => m.roomId === room.id && m.senderId !== userId && new Date(m.createdAt).getTime() > seen).length
      }
      if (mobileView === 'room' || window.innerWidth > 768) {
        sessionStorage.setItem(`synapse-seen:${userId}:${activeRoomId}`, String(Date.now())); next[activeRoomId] = 0
      }
    } catch { /* browser session storage may be unavailable */ }
    setUnread(next)
  }, [state, activeRoomId, mobileView, userId])
  const signup = async (input: ProfileInput) => { receive(isServer() ? await request<Snapshot>('/signup', input) : localStart(input)); setActiveRoomId(`language-${input.lang}`); setMobileView('room') }
  const profile = async (input: ProfileInput) => {
    if (!state) return
    if (isServer()) receive(await request<Snapshot>('/profile', input, 'PATCH'))
    else {
      const currentUser = { ...state.currentUser, ...input, flag: countries[input.country][0] }, allUsers = { ...state.users, [currentUser.id]: currentUser }
      const rooms = [...state.rooms.filter(r => r.kind !== 'language'), ...publicRooms().filter(r => r.language === input.lang).map(r => ({ ...r, memberIds: Object.values(allUsers).filter(u => u.lang === input.lang).map(u => u.id) }))]
      receive({ ...state, currentUser, users: allUsers, rooms })
    }
    setActiveRoomId(`language-${input.lang}`); setSheet(null)
  }
  const send = async (text: string) => {
    if (!state) return
    const room = state.rooms.find(r => r.id === activeRoomId) || state.rooms[0]
    if (isServer()) {
      const message = await request<Message>('/messages', { roomId: room.id, text })
      setState(previous => previous && previous.messages.some(m => m.id === message.id) ? previous : previous && { ...previous, messages: [...previous.messages, message] })
    } else {
      const from = state.currentUser.lang
      const message: Message = { id: crypto.randomUUID(), roomId: room.id, senderId: state.currentUser.id, originalText: text, originalLanguage: from, translations: {}, translationStatus: 'pending', culturalAnalysis: null, createdAt: new Date().toISOString() }
      setState(previous => previous && { ...previous, messages: [...previous.messages, message] })
      const [translations, culture] = await Promise.all([translationService.translate(text, from, languages.filter(l => l !== from)), cultureService.analyze(text, from)])
      setState(previous => previous && { ...previous, messages: previous.messages.map(m => m.id === message.id ? { ...m, translations, translationStatus: 'done', culturalAnalysis: culture.cultureDetected ? culture.analysis : null, processingError: Object.keys(translations).length ? undefined : 'offline' } : m) })
    }
  }
  const createRoom = async (name: string, memberIds: string[]) => {
    if (!state) return
    const room = isServer() ? await request<Room>('/rooms', { name, memberIds }) : { id: crypto.randomUUID(), name, memberIds: [...new Set([state.currentUser.id, ...memberIds])], unread: 0, kind: 'private' as const }
    setState(previous => previous && previous.rooms.some(r => r.id === room.id) ? previous : previous && { ...previous, rooms: [...previous.rooms, room] }); setActiveRoomId(room.id); setMobileView('room')
  }
  const logout = async () => {
    try { if (isServer()) await request('/logout', {}); else localStorage.removeItem(STORAGE_KEY); setState(null); setSheet(null); setNotice('') } catch { setNotice(translate(state?.currentUser.lang || 'ko', 'signupError')) }
  }
  if (loading) return <div className="startup">Synapse · 연결 중…</div>
  if (startupError) return <div className="startup"><p>서버에 연결하지 못했습니다.</p><button className="primary-button" onClick={() => location.reload()}>다시 연결</button></div>
  if (!state) return <main className="onboarding"><div className="onboarding__card"><ProfileForm onSubmit={signup} /><p className="onboarding__mode">{isServer() ? '실시간 서버 연결됨' : '브라우저 모드 · 서버 없이 체험하기'}</p></div></main>
  const currentUser = state.currentUser, t = (key: Parameters<typeof translate>[1]) => translate(currentUser.lang, key)
  const activeRoom = state.rooms.find(r => r.id === activeRoomId) || state.rooms[0]
  return <LocaleContext.Provider value={currentUser.lang}><div className={`app app--${mobileView}`}>
    <ChatList rooms={state.rooms} messages={state.messages} unread={unread} activeRoomId={activeRoom.id} currentUserId={currentUser.id} onSelect={id => { setActiveRoomId(id); setMobileView('room') }} onNew={() => setSheet('new')} onProfile={() => setSheet('profile')} onLogout={() => void logout()} status={isServer() ? `${t(connection === 'server' ? 'server' : connection === 'disconnected' ? 'disconnected' : 'connecting')} · ${t(state.aiEnabled ? 'ai' : 'noAi')}` : t('local')} />
    <div className="conversation-column">{!isServer() && <div className="mode-banner">{t('localNote')}</div>}{notice && <div className="notice" role="alert">{notice}<button onClick={() => setNotice('')}>×</button></div>}
    <ChatRoom key={`${currentUser.id}:${activeRoom.id}`} room={activeRoom} messages={state.messages.filter(m => m.roomId === activeRoom.id)} currentUser={currentUser} translationMode={translationMode} cultureMode={cultureMode} onTranslationModeChange={setTranslationMode} onCultureModeChange={setCultureMode} onSend={send} onBack={() => setMobileView('list')} /></div>
    {sheet === 'profile' && <BottomSheet title={t('profile')} onClose={() => setSheet(null)}><ProfileForm initial={currentUser} onSubmit={profile} onCancel={() => setSheet(null)} /></BottomSheet>}
    {sheet === 'new' && <NewChatSheet people={Object.values(state.users).filter(u => u.id !== currentUser.id)} onCreate={createRoom} onClose={() => setSheet(null)} />}
  </div></LocaleContext.Provider>
}
