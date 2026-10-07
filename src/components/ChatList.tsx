import { useState } from 'react'
import { getPartner, getRoomTitle, isGroupRoom, users } from '../data/mockData'
import { useLocale } from '../i18n'
import type { Message, Room } from '../types'
import { formatTime } from '../utils/time'
import { RoomAvatar } from './Avatar'
import { IconCompose, IconSearch } from './Icons'

type Props = {
  rooms: Room[]
  messages: Message[]
  unread: Record<string, number>
  activeRoomId: string
  currentUserId: string
  onSelect: (roomId: string) => void
  onNew: () => void
  onProfile: () => void
  onLogout: () => void
  status: string
}

export default function ChatList({
  rooms,
  messages,
  unread,
  activeRoomId,
  currentUserId,
  onSelect,
  onNew, onProfile, onLogout, status,
}: Props) {
  const { t, lang } = useLocale()
  const [query, setQuery] = useState('')
  const keyword = query.trim().toLowerCase()
  const visibleRooms = rooms.filter((room) =>
    getRoomTitle(room, currentUserId).toLowerCase().includes(keyword),
  )

  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <h1 className="sidebar__title">{t('chats')}</h1>
        <button type="button" className="icon-btn" aria-label={t('newChat')} onClick={onNew}>
          <IconCompose />
        </button>
      </header>

      <label className="search">
        <IconSearch size={16} />
        <input
          type="search"
          placeholder={t('searchRooms')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      <ul className="room-list">
        {visibleRooms.map((room) => {
          const roomMessages = messages.filter((m) => m.roomId === room.id)
          const last = roomMessages[roomMessages.length - 1]
          const count = unread[room.id] ?? 0
          const isGroup = isGroupRoom(room)
          const flag = isGroup ? null : getPartner(room, currentUserId).flag

          return (
            <li key={room.id}>
              <button
                type="button"
                className={`room-item${room.id === activeRoomId ? ' is-active' : ''}`}
                onClick={() => onSelect(room.id)}
              >
                <RoomAvatar room={room} currentUserId={currentUserId} />
                <div className="room-item__body">
                  <div className="room-item__row">
                    <span className="room-item__name">
                      {getRoomTitle(room, currentUserId)}
                      {flag && <span className="room-item__flag">{flag}</span>}
                    </span>
                    {isGroup && <span className="room-item__count">{room.memberIds.length}</span>}
                    <time className="room-item__time">{last && formatTime(last.createdAt, lang)}</time>
                  </div>
                  <div className="room-item__row">
                    <span className="room-item__preview">{last?.translations[lang]?.cultural || last?.translations[lang]?.standard || last?.originalText || t('empty')}</span>
                    {count > 0 && <span className="badge">{count}</span>}
                  </div>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
      {!visibleRooms.length && <p className="list-empty">{t('noResults')}</p>}
      <footer className="sidebar-profile"><button onClick={onProfile} className="profile-link">{users[currentUserId].flag} {users[currentUserId].name}<small>{t('profile')} ↗</small></button><p className="connection-status" role="status">{status}</p><button className="logout-button" onClick={onLogout}>{t('logout')}</button></footer>
    </aside>
  )
}

