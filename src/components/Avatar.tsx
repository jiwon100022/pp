import { users, getPartner, isGroupRoom } from '../data/mockData'
import type { Room, User } from '../types'

type AvatarProps = { user: User; size?: number }

export function Avatar({ user, size = 36 }: AvatarProps) {
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.4, background: user.color }}
      aria-hidden="true"
    >
      {user.name.charAt(0).toUpperCase()}
    </span>
  )
}

type RoomAvatarProps = { room: Room; currentUserId: string; size?: number }

export function RoomAvatar({ room, currentUserId, size = 48 }: RoomAvatarProps) {
  if (!isGroupRoom(room)) {
    return <Avatar user={getPartner(room, currentUserId)} size={size} />
  }

  const members = room.memberIds.slice(0, 4).map((id) => users[id])
  const cell = (size - 2) / 2
  return (
    <span className="avatar-group" style={{ width: size, height: size }} aria-hidden="true">
      {members.map((u) => (
        <Avatar key={u.id} user={u} size={cell} />
      ))}
    </span>
  )
}

