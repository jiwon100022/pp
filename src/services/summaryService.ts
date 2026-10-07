import type { LanguageCode, Message } from '../types'
import { extractSummary } from '../../shared/engine.mjs'
import { users } from '../data/mockData'
import { isServer, request } from './api'

export type ConversationSummary = {
  mode?: 'ai' | 'extractive'
  points: string[]
  decisions: { label: string; value: string }[]
}

export interface SummaryService {
  /** 채팅방의 최근 대화를 요약한다. 요약할 내용이 없으면 null. */
  summarize(roomId: string, messages: Message[], lang?: LanguageCode): Promise<ConversationSummary | null>
}

/** 실제 AI 요약 서비스로 교체할 때 이 할당만 바꾼다. */
export const summaryService: SummaryService = {
  async summarize(roomId, messages, lang = 'ko') {
    return isServer() ? request<ConversationSummary | null>('/summary', { roomId }) : extractSummary(messages.filter(m => m.roomId === roomId), lang, users)
  },
}

