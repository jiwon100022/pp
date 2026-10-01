import { useEffect, useState } from 'react'
import { summaryService, type ConversationSummary } from '../services/summaryService'
import type { Message } from '../types'
import BottomSheet from './BottomSheet'

type Props = {
  roomId: string
  messages: Message[]
  onClose: () => void
}

export default function SummarySheet({ roomId, messages, onClose }: Props) {
  const [state, setState] = useState<
    { status: 'loading' } | { status: 'done'; summary: ConversationSummary | null }
  >({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    summaryService
      .summarize(roomId, messages)
      .then((summary) => !cancelled && setState({ status: 'done', summary }))
      .catch(() => !cancelled && setState({ status: 'done', summary: null }))
    return () => {
      cancelled = true
    }
    // 시트를 연 시점의 대화 기준으로 한 번만 요약
  }, [roomId])

  return (
    <BottomSheet title="✨ 최근 대화 요약" onClose={onClose}>
      {state.status === 'loading' && <p className="sheet-muted">대화를 요약하는 중…</p>}

      {state.status === 'done' && !state.summary && (
        <p className="sheet-muted">아직 요약할 대화가 충분하지 않아요.</p>
      )}

      {state.status === 'done' && state.summary && (
        <>
          <ul className="summary-points">
            {state.summary.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>

          <div className="summary-decisions">
            <h4>주요 내용</h4>
            <dl>
              {state.summary.decisions.map((d) => (
                <div key={d.label} className="summary-decision">
                  <dt>{d.label}</dt>
                  <dd>{d.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </>
      )}
    </BottomSheet>
  )
}

