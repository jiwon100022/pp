import type { Message } from '../types'
import { mockSummaryService } from './mockSummaryService'

export type ConversationSummary = {
  points: string[]
  decisions: { label: string; value: string }[]
}

export interface SummaryService {
  /** 채팅방의 최근 대화를 요약한다. 요약할 내용이 없으면 null. */
  summarize(roomId: string, messages: Message[]): Promise<ConversationSummary | null>
}

/** 실제 AI 요약 서비스로 교체할 때 이 할당만 바꾼다. */
export const summaryService: SummaryService = mockSummaryService

