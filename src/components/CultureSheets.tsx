import type { ReactNode } from 'react'
import type { CulturalAnalysis } from '../types'
import BottomSheet from './BottomSheet'
import { useLocale } from '../i18n'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="culture-row">
      <div className="culture-row__label">{label}</div>
      <div className="culture-row__value">{children}</div>
    </div>
  )
}

type SenderProps = {
  analysis: CulturalAnalysis
  /** warn 수준에서만 사용 (대체 표현 적용). 자동 전송하지 않는다. */
  onApply?: () => void
  onClose: () => void
}

/**
 * 발신자용: 작성 중인 문장의 문화 표현 설명.
 * inform은 설명만 제공하고 문장은 그대로 둔다. 대체 표현은 warn에서만 제공한다.
 */
export function SenderCultureSheet({ analysis, onApply, onClose }: SenderProps) {
  const { t } = useLocale()
  const isWarn = analysis.interventionLevel === 'warn'
  const alternative = isWarn ? analysis.senderAlternativeText : undefined

  return (
    <BottomSheet
      title={isWarn ? `⚠ ${t('expression')}` : `✨ ${analysis.hintLabel}`}
      onClose={onClose}
      footer={
        alternative && onApply ? (
          <>
            <button type="button" className="sheet-btn sheet-btn--primary" onClick={onApply}>
              {t('alternative')}
            </button>
            <button type="button" className="sheet-btn" onClick={onClose}>
              {t('close')}
            </button>
          </>
        ) : (
          <p className="culture-delivery">🌐 {analysis.senderGuide.deliveryNote}</p>
        )
      }
    >
      <div className="culture-head">
        <span className="culture-head__expr">“{analysis.expression}”</span>
        <span className="culture-head__tag">{analysis.category}</span>
      </div>
      <p className="culture-lead">{analysis.senderGuide.description}</p>

      {analysis.region && <Row label={t('region')}>{analysis.region}</Row>}
      <Row label={t('meaning')}>{analysis.meaning}</Row>
      <Row label={t('context')}>{analysis.contextMeaning}</Row>
      <Row label={t('tone')}>{analysis.tone}</Row>

      {alternative && (
        <div className="culture-suggest">
          <div className="culture-suggest__label">{t('alternative')}</div>
          <p>{alternative}</p>
        </div>
      )}
    </BottomSheet>
  )
}

type ReceiverProps = {
  originalText: string
  analysis: CulturalAnalysis
  onClose: () => void
}

/** 수신자용: 받은 메시지의 표현 설명 (발신자 기능 없음) */
export function ReceiverCultureSheet({ originalText, analysis, onClose }: ReceiverProps) {
  const { t } = useLocale()
  return (
    <BottomSheet title={`✨ ${t('explain')}`} onClose={onClose}>
      <Row label={t('original')}>
        <span className="culture-original">
          {originalText}
        </span>
      </Row>
      <Row label={t('expression')}>
        <span className="culture-head__expr culture-head__expr--sm">“{analysis.expression}”</span>
      </Row>
      <Row label={t('description')}>{analysis.receiverGuide.description}</Row>
      <Row label={t('context')}>{analysis.receiverGuide.context}</Row>
      <Row label={t('tone')}>{analysis.receiverGuide.tone}</Row>
    </BottomSheet>
  )
}

