import type { LanguageCode, Message, Room, User } from '../types'
import { lookupTranslations } from '../services/mockTranslationService'
import { getTargetLanguages } from '../services/translationService'

export const DEFAULT_USER_ID = 'jiwon'

/** 개발용 시점 전환 대상 */
export const DEMO_USER_IDS = ['jiwon', 'haruto']

export const users: Record<string, User> = {
  jiwon: { id: 'jiwon', name: '지원', flag: '🇰🇷', lang: 'ko', color: '#5b7fa6' },
  haruto: { id: 'haruto', name: 'Haruto', flag: '🇯🇵', lang: 'ja', color: '#c27a45' },
  emma: { id: 'emma', name: 'Emma', flag: '🇺🇸', lang: 'en', color: '#8a67b5' },
  mei: { id: 'mei', name: 'Mei', flag: '🇹🇼', lang: 'zh-TW', color: '#3a9688' },
}

export const rooms: Room[] = [
  {
    id: 'global',
    name: 'Global Project Team',
    memberIds: ['jiwon', 'haruto', 'emma', 'mei'],
    unread: 0,
  },
  { id: 'dm-haruto', memberIds: ['jiwon', 'haruto'], unread: 1 },
  { id: 'dm-emma', memberIds: ['jiwon', 'emma'], unread: 0 },
  { id: 'dm-mei', memberIds: ['jiwon', 'mei'], unread: 2 },
]

export function isGroupRoom(room: Room) {
  return Boolean(room.name) || room.memberIds.length > 2
}

export function getPartner(room: Room, currentUserId: string) {
  return users[room.memberIds.find((id) => id !== currentUserId) ?? currentUserId]
}

export function getRoomTitle(room: Room, currentUserId: string) {
  return isGroupRoom(room) ? (room.name ?? '') : getPartner(room, currentUserId).name
}

export function getRoomLanguages(room: Room): LanguageCode[] {
  return room.memberIds.map((id) => users[id].lang)
}

function todayAt(hours: number, minutes: number) {
  const d = new Date()
  d.setHours(hours, minutes, 0, 0)
  return d.toISOString()
}

function seed(
  id: string,
  roomId: string,
  senderId: string,
  text: string,
  hours: number,
  minutes: number,
): Message {
  const room = rooms.find((r) => r.id === roomId)!
  const from = users[senderId].lang
  return {
    id,
    roomId,
    senderId,
    originalText: text,
    originalLanguage: from,
    translations: lookupTranslations(text, from, getTargetLanguages(getRoomLanguages(room), from)),
    translationStatus: 'done',
    culturalAnalysis: null,
    createdAt: todayAt(hours, minutes),
  }
}

export const initialMessages: Message[] = [
  seed('g1', 'global', 'haruto', '今日の資料、もう確認した？', 14, 2),
  seed('g2', 'global', 'jiwon', '응 거의 다 봤어', 14, 3),
  seed('g3', 'global', 'emma', 'I think we should finish the slides today.', 14, 5),
  seed('g4', 'global', 'mei', '我下午可以幫忙確認。', 14, 6),
  seed('g5', 'global', 'jiwon', '고마워!', 14, 6),
  seed('g6', 'global', 'haruto', '今日の発表どうだった？', 15, 12),
  seed('g7', 'global', 'jiwon', '진짜 힘들었어ㅋㅋ', 15, 13),
  seed('g8', 'global', 'haruto', '何かあった？', 15, 13),

  seed('h1', 'dm-haruto', 'haruto', '資料、共有フォルダに入れておいたよ', 13, 40),

  seed('e1', 'dm-emma', 'jiwon', '회의록 정리해서 올려둘게!', 11, 5),
  seed('e2', 'dm-emma', 'emma', 'Thanks! See you at the meeting tomorrow.', 11, 8),

  seed('m1', 'dm-mei', 'mei', '謝謝你的幫忙！', 9, 52),
  seed('m2', 'dm-mei', 'mei', '明天見～', 9, 52),
]

