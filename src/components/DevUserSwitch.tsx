import { DEMO_USER_IDS, users } from '../data/mockData'

type Props = {
  currentUserId: string
  onChange: (userId: string) => void
}

/** 시연용 시점 전환 (개발용) */
export default function DevUserSwitch({ currentUserId, onChange }: Props) {
  return (
    <div className="dev-switch" role="group" aria-label="시연용 시점 전환">
      <span className="dev-switch__label" title="시연용 데이터입니다. 새로고침하면 초기화됩니다.">DEMO</span>
      {DEMO_USER_IDS.map((id) => (
        <button
          key={id}
          type="button"
          className={`dev-switch__btn${id === currentUserId ? ' is-active' : ''}`}
          onClick={() => onChange(id)}
        >
          {users[id].name}
        </button>
      ))}
    </div>
  )
}

