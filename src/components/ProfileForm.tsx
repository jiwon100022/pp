import { useState } from 'react'
import { countries } from '../../shared/engine.mjs'
import { LANGUAGES } from '../data/languages'
import { translate } from '../i18n'
import type { LanguageCode, User } from '../types'
export type ProfileInput = { name: string; country: string; lang: LanguageCode }
export default function ProfileForm({ initial, onSubmit, onCancel }: { initial?: User; onSubmit: (value: ProfileInput) => Promise<void>; onCancel?: () => void }) {
  const [name, setName] = useState(initial?.name || ''), [country, setCountry] = useState(initial?.country || 'KR')
  const [lang, setLang] = useState<LanguageCode>(initial?.lang || 'ko'), [busy, setBusy] = useState(false), [error, setError] = useState('')
  const t = (key: Parameters<typeof translate>[1]) => translate(lang, key)
  const regionNames = new Intl.DisplayNames([lang], { type: 'region' })
  return <form className="profile-form" onSubmit={async e => {
    e.preventDefault(); if (busy) return; setBusy(true); setError('')
    try { await onSubmit({ name: name.trim(), country, lang }) } catch { setError(t('signupError')) } finally { setBusy(false) }
  }}>
    {!initial && <><div className="brand-mark">S<span>↗</span></div><p className="eyebrow">SYNAPSE / CONNECT ACROSS CULTURES</p><h1>{t('welcome')}</h1><p className="profile-intro">{t('intro')}</p></>}
    <label>{t('name')}<input autoComplete="nickname" autoFocus required maxLength={30} value={name} onChange={e => setName(e.target.value)} placeholder={t('name')} /></label>
    <div className="profile-form__row"><label>{t('country')}<select value={country} onChange={e => { setCountry(e.target.value); setLang(countries[e.target.value][1]) }}>{Object.entries(countries).map(([code, [flag]]) => <option key={code} value={code}>{flag} {code === 'OTHER' ? 'Other / 기타' : regionNames.of(code)}</option>)}</select></label>
    <label>{t('language')}<select value={lang} onChange={e => setLang(e.target.value as LanguageCode)}>{Object.entries(LANGUAGES).map(([code, value]) => <option key={code} value={code}>{value.native}</option>)}</select></label></div>
    <p className="form-note">{t('countryNote')}</p><p className="form-note">{t('guestNote')}</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="primary-button" disabled={busy || !name.trim()}>{busy ? t('busy') : initial ? t('save') : t('signup')}</button>
    {onCancel && <button type="button" className="secondary-button" onClick={onCancel}>{t('cancel')}</button>}
  </form>
}
