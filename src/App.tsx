import { useState } from 'react'
import ChatList from './components/ChatList'
import ChatRoom from './components/ChatRoom'
import DevUserSwitch from './components/DevUserSwitch'
import { rooms, initialMessages, users, DEFAULT_USER_ID, getRoomLanguages } from './data/mockData'
import { cultureService } from './services/cultureService'
import { getTargetLanguages, translationService } from './services/translationService'
import { getScriptedReplies } from './data/scriptedDemoReplies'
import type {
  CultureHelpMode,
  Message,
  Room,
  TranslationMap,
  TranslationMode,
} from './types'

let localMessageSeq = 0

function App() {
  const [currentUserId, setCurrentUserId] = useState(DEFAULT_USER_ID)
  const [activeRoomId, setActiveRoomId] = useState(rooms[0].id)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [unread, setUnread] = useState(() =>
    Object.fromEntries(rooms.map((r) => [r.id, r.unread])),
  )
  const [mobileView, setMobileView] = useState<'list' | 'room'>('room')

  // 표시 설정 (프로토타입: React state로만 유지)
  const [translationMode, setTranslationMode] = useState<TranslationMode>('foreign')
  const [cultureMode, setCultureMode] = useState<CultureHelpMode>('important')

  const currentUser = users[currentUserId]
  const myRooms = rooms.filter((r) => r.memberIds.includes(currentUserId))
  const activeRoom = myRooms.find((r) => r.id === activeRoomId) ?? myRooms[0]

  const selectRoom = (roomId: string) => {
    setActiveRoomId(roomId)
    setUnread((prev) => ({ ...prev, [roomId]: 0 }))
    setMobileView('room')
  }

  const updateMessage = (messageId: string, patch: Partial<Message>) => {
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, ...patch } : m)))
  }

  const finishTranslation = (messageId: string, translations: TranslationMap) => {
    updateMessage(messageId, { translations, translationStatus: 'done' })
  }

  const postMessage = (room: Room, senderId: string, text: string) => {
    const from = users[senderId].lang
    const targets = getTargetLanguages(getRoomLanguages(room), from)
    const message: Message = {
      id: `local-${Date.now()}-${++localMessageSeq}`,
      roomId: room.id,
      senderId,
      originalText: text,
      originalLanguage: from,
      translations: {},
      translationStatus: targets.length > 0 ? 'pending' : 'done',
      culturalAnalysis: null,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, message])

    cultureService
      .analyze(text, from)
      .then((result) => {
        if (result.cultureDetected) updateMessage(message.id, { culturalAnalysis: result.analysis })
      })
      .catch(() => {})

    if (targets.length === 0) return
    translationService
      .translate(text, from, targets)
      .then((translations) => finishTranslation(message.id, translations))
      .catch(() => finishTranslation(message.id, {}))
  }

  const sendMessage = (text: string) => {
    const room = activeRoom
    postMessage(room, currentUserId, text)

    // 시연용 자동 답장 (scriptedDemoReplies)
    let delay = 0
    for (const reply of getScriptedReplies(room.id, currentUserId, text)) {
      delay += reply.delayMs
      setTimeout(() => postMessage(room, reply.senderId, reply.text), delay)
    }
  }

  return (
    <div className={`app app--${mobileView}`}>
      <ChatList
        rooms={myRooms}
        messages={messages}
        unread={unread}
        activeRoomId={activeRoom.id}
        currentUserId={currentUserId}
        onSelect={selectRoom}
      />
      <ChatRoom
        key={`${currentUserId}:${activeRoom.id}`}
        room={activeRoom}
        messages={messages.filter((m) => m.roomId === activeRoom.id)}
        currentUser={currentUser}
        translationMode={translationMode}
        cultureMode={cultureMode}
        onTranslationModeChange={setTranslationMode}
        onCultureModeChange={setCultureMode}
        onSend={sendMessage}
        onBack={() => setMobileView('list')}
      />
      <DevUserSwitch currentUserId={currentUserId} onChange={setCurrentUserId} />
    </div>
  )
}

export default App

