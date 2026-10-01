import { useEffect, type ReactNode } from 'react'
import { IconClose } from './Icons'

type Props = {
  title: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

export default function BottomSheet({ title, onClose, children, footer }: Props) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__handle" aria-hidden="true" />
        <header className="sheet__header">
          <h3>{title}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="닫기">
            <IconClose size={18} />
          </button>
        </header>
        <div className="sheet__body">{children}</div>
        {footer && <footer className="sheet__footer">{footer}</footer>}
      </div>
    </div>
  )
}

