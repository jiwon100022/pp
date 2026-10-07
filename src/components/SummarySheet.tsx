import { useEffect, useState } from 'react'
import { summaryService, type ConversationSummary } from '../services/summaryService'
import type { Message } from '../types'
import BottomSheet from './BottomSheet'
import { useLocale } from '../i18n'

type Props = {
  roomId: string
  messages: Message[]
  onClose: () => void
}

export default function SummarySheet({ roomId, messages, onClose }: Props) {
  const { t, lang } = useLocale()
  const [state, setState] = useState<
    { status: 'loading' } | { status: 'error' } | { status: 'done'; summary: ConversationSummary | null }
  >({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    summaryService
      .summarize(roomId, messages, lang)
      .then((summary) => !cancelled && setState({ status: 'done', summary }))
      .catch(() => !cancelled && setState({ status: 'error' }))
    return () => {
      cancelled = true
    }
    // 시트를 연 시점의 대화 기준으로 한 번만 요약
  }, [roomId, lang])

  return (
    <BottomSheet title={`✨ ${t('summary')}`} onClose={onClose}>
      {state.status === 'loading' && <p className="sheet-muted">{t('loadingSummary')}</p>}
      {state.status === 'error' && <p className="form-error" role="alert">{t('summaryError')}</p>}

      {state.status === 'done' && !state.summary && (
        <p className="sheet-muted">{t('noSummary')}</p>
      )}

      {state.status === 'done' && state.summary && (
        <>
          {state.summary.mode === 'extractive' && <p className="summary-note">{t('extractive')}</p>}
          <ul className="summary-points">
            {state.summary.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>

          {state.summary.decisions.length > 0 && <div className="summary-decisions">
            <h4>{t('decisions')}</h4>
            <dl>
              {state.summary.decisions.map((d) => (
                <div key={d.label} className="summary-decision">
                  <dt>{d.label}</dt>
                  <dd>{d.value}</dd>
                </div>
              ))}
            </dl>
          </div>}
        </>
      )}
    </BottomSheet>
  )
}

