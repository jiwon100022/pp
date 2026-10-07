import type { CultureHelpMode, TranslationMode } from '../types'
import BottomSheet from './BottomSheet'
import { useLocale } from '../i18n'

type Option<T extends string> = { value: T; label: string; description: string }

function RadioList<T extends string>({
  name,
  options,
  value,
  onChange,
}: {
  name: string
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="radio-list" role="radiogroup">
      {options.map((opt) => (
        <label key={opt.value} className={`radio-item${opt.value === value ? ' is-checked' : ''}`}>
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={opt.value === value}
            onChange={() => onChange(opt.value)}
          />
          <span className="radio-item__dot" aria-hidden="true" />
          <span className="radio-item__text">
            <span className="radio-item__label">{opt.label}</span>
            <span className="radio-item__desc">{opt.description}</span>
          </span>
        </label>
      ))}
    </div>
  )
}

const TRANSLATION_OPTIONS: Option<TranslationMode>[] = [
  { value: 'always', label: '항상 자동 번역', description: '번역 가능한 모든 메시지에 번역을 표시해요' },
  { value: 'foreign', label: '다른 언어만 자동 번역', description: '내 언어와 다른 메시지만 번역해요 (기본)' },
  { value: 'tap', label: '탭할 때 번역', description: "'번역 보기'를 누른 메시지만 번역해요" },
  { value: 'off', label: '사용 안 함', description: '번역 카드를 표시하지 않아요' },
]

export function TranslationSettingsSheet({
  value,
  onChange,
  onClose,
}: {
  value: TranslationMode
  onChange: (value: TranslationMode) => void
  onClose: () => void
}) {
  const { t } = useLocale()
  return (
    <BottomSheet title={t('translation')} onClose={onClose}>
      <RadioList name="translation-mode" options={TRANSLATION_OPTIONS.map(option => ({ ...option, label: t(option.value === 'always' ? 'all' : option.value), description: '' }))} value={value} onChange={onChange} />
    </BottomSheet>
  )
}

const CULTURE_OPTIONS: Option<CultureHelpMode>[] = [
  {
    value: 'important',
    label: '중요한 경우만 표시',
    description: '의미나 말투가 달라질 수 있는 표현을 작성 중에 알려줘요 (기본)',
  },
  { value: 'all', label: '모든 문화 표현 표시', description: '작성 중 감지된 문화 표현을 모두 알려줘요' },
  {
    value: 'minimal',
    label: '최소한으로 표시',
    description: '작성 중 안내 없이, 받은 메시지의 문화 맥락 번역과 설명만 제공해요',
  },
  { value: 'off', label: '사용 안 함', description: '문화 관련 표시를 숨기고 기본 번역만 보여줘요' },
]

export function CultureSettingsSheet({
  value,
  onChange,
  onClose,
}: {
  value: CultureHelpMode
  onChange: (value: CultureHelpMode) => void
  onClose: () => void
}) {
  const { t } = useLocale()
  return (
    <BottomSheet title={t('culture')} onClose={onClose}>
      <RadioList name="culture-mode" options={CULTURE_OPTIONS.map(option => ({ ...option, label: t(option.value === 'all' ? 'everyCulture' : option.value), description: '' }))} value={value} onChange={onChange} />
    </BottomSheet>
  )
}

