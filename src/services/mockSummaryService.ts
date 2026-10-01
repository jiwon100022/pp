import type { ConversationSummary, SummaryService } from './summaryService'

/** 시연용 고정 요약 (실제 대화 내용을 분석한 결과가 아님) */
const DEMO_SUMMARIES: Record<string, ConversationSummary> = {
  global: {
    // Global Project Team 시연 대화에 실제로 나온 내용만 요약한다
    points: [
      'Haruto가 오늘 자료를 확인했는지 물어봤어요.',
      'Emma가 오늘 슬라이드를 마무리하자고 제안했어요.',
      'Mei가 오후에 자료 확인을 도와주기로 했어요.',
      '지원은 오늘 발표가 힘들었고 억울한 일이 있었다고 이야기했어요.',
    ],
    decisions: [
      { label: '자료 작업', value: '오늘 슬라이드 마무리 제안' },
      { label: '지원 가능', value: 'Mei가 오후에 자료 검토 지원' },
    ],
  },
}

const LATENCY_MS = 600

export const mockSummaryService: SummaryService = {
  summarize(roomId) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(DEMO_SUMMARIES[roomId] ?? null), LATENCY_MS)
    })
  },
}

