import { useState } from 'react'
import { useLocale } from '../i18n'
import { LANGUAGES } from '../data/languages'
import type { User } from '../types'
import BottomSheet from './BottomSheet'
export default function NewChatSheet({ people, onCreate, onClose }: { people: User[]; onCreate: (name: string, ids: string[]) => Promise<void>; onClose: () => void }) {
  const { t } = useLocale(), [name, setName] = useState(''), [ids, setIds] = useState<string[]>([]), [busy, setBusy] = useState(false), [error, setError] = useState('')
  return <BottomSheet title={t('newChat')} onClose={onClose}><form className="profile-form" onSubmit={async e => { e.preventDefault(); setBusy(true); try { await onCreate(name.trim(), ids); onClose() } catch { setError(t('signupError')) } finally { setBusy(false) } }}>
    <label>{t('roomName')}<input required maxLength={60} value={name} onChange={e => setName(e.target.value)} /></label><p>{t('selectMembers')}</p>
    {!people.length && <p className="form-note">{t('noPeople')}</p>}
    <div className="people-list">{people.map(person => <label className="person-option" key={person.id}><input type="checkbox" checked={ids.includes(person.id)} onChange={e => setIds(previous => e.target.checked ? [...previous, person.id] : previous.filter(id => id !== person.id))} /><span>{person.flag} {person.name}</span><small>{LANGUAGES[person.lang].native}</small></label>)}</div>
    {error && <p role="alert" className="form-error">{error}</p>}<button className="primary-button" disabled={busy || !name.trim()}>{busy ? t('busy') : t('create')}</button>
  </form></BottomSheet>
}
