import { useState } from 'react'
import { LANGUAGES } from '../data/languages'
import type { LanguageCode, Message, User } from '../types'
import BottomSheet from './BottomSheet'
import { useLocale } from '../i18n'

type Props = { message: Message; targets: LanguageCode[]; members: User[]; onClose: () => void }
export default function DeliveryPanel({ message, targets, members, onClose }: Props) {
  const { t, lang } = useLocale()
  const [openLang, setOpenLang] = useState<LanguageCode>(targets[0])
  const translation = message.translations[openLang]
  return <BottomSheet title={t('delivery')} onClose={onClose}>
    <p className="sheet-muted">{t('original')} · {LANGUAGES[message.originalLanguage].native}</p><p className="delivery-panel__original">{message.originalText}</p>
    <div className="language-tabs" role="tablist">{targets.map(target => <button key={target} role="tab" aria-selected={target === openLang} className={target === openLang ? 'is-active' : ''} onClick={() => setOpenLang(target)}>{LANGUAGES[target].native}</button>)}</div>
    <p className="sheet-muted">{members.filter(member => member.lang === openLang && member.id !== message.senderId).map(member => member.name).join(', ')}</p>
    {!translation ? <p className="sheet-muted">{t(message.translationStatus === 'pending' ? 'translating' : message.processingError === 'offline' ? 'offlineTranslation' : 'unavailable')}</p> : <>
      <div className="dp-block"><h4>{t('standard')}</h4><p lang={openLang}>{translation.standard}</p>{lang === 'ko' && translation.meaningKo?.standard && <small>{t('meaning')}: {translation.meaningKo.standard}</small>}</div>
      {translation.cultural && message.culturalAnalysis && <div className="dp-block dp-block--culture"><h4>✨ {t('cultural')}</h4><p lang={openLang}>{translation.cultural}</p>{lang === 'ko' && translation.meaningKo?.cultural && <small>{t('meaning')}: {translation.meaningKo.cultural}</small>}</div>}
    </>}
  </BottomSheet>
}
