import { useState } from 'react'
import { getPartner, getRoomTitle, isGroupRoom } from '../data/mockData'
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
}

export default function ChatList({
  rooms,
  messages,
  unread,
  activeRoomId,
  currentUserId,
  onSelect,
}: Props) {
  const [query, setQuery] = useState('')
  const keyword = query.trim().toLowerCase()
  const visibleRooms = rooms.filter((room) =>
    getRoomTitle(room, currentUserId).toLowerCase().includes(keyword),
  )

  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <h1 className="sidebar__title">채팅</h1>
        <button type="button" className="icon-btn" aria-label="새 채팅">
          <IconCompose />
        </button>
      </header>

      <label className="search">
        <IconSearch size={16} />
        <input
          type="search"
          placeholder="채팅방 검색"
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
                    <time className="room-item__time">{last && formatTime(last.createdAt)}</time>
                  </div>
                  <div className="room-item__row">
                    <span className="room-item__preview">{last?.originalText}</span>
                    {count > 0 && <span className="badge">{count}</span>}
                  </div>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}

