import type { ReactNode } from 'react'
import type { CulturalAnalysis } from '../types'
import BottomSheet from './BottomSheet'

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
  const isWarn = analysis.interventionLevel === 'warn'
  const alternative = isWarn ? analysis.senderAlternativeText : undefined

  return (
    <BottomSheet
      title={isWarn ? '⚠ 표현 확인' : `✨ ${analysis.hintLabel}`}
      onClose={onClose}
      footer={
        alternative && onApply ? (
          <>
            <button type="button" className="sheet-btn sheet-btn--primary" onClick={onApply}>
              더 부드러운 표현 사용
            </button>
            <button type="button" className="sheet-btn" onClick={onClose}>
              닫기
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

      {analysis.region && <Row label="지역">{analysis.region}</Row>}
      <Row label="의미">{analysis.meaning}</Row>
      <Row label="현재 문맥">{analysis.contextMeaning}</Row>
      <Row label="말투 · 분위기">{analysis.tone}</Row>

      {alternative && (
        <div className="culture-suggest">
          <div className="culture-suggest__label">다른 표현</div>
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
  return (
    <BottomSheet title="✨ 이 메시지의 문화 표현" onClose={onClose}>
      <Row label="원문">
        <span className="culture-original" lang="ko">
          {originalText}
        </span>
      </Row>
      <Row label="표현">
        <span className="culture-head__expr culture-head__expr--sm">“{analysis.expression}”</span>
      </Row>
      <Row label="설명">{analysis.receiverGuide.description}</Row>
      <Row label="현재 문맥">{analysis.receiverGuide.context}</Row>
      <Row label="말투">{analysis.receiverGuide.tone}</Row>
    </BottomSheet>
  )
}

