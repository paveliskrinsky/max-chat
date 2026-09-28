import { useEffect, useState, type FormEvent } from 'react'
import { checkAccount } from '../api/greenApi'
import type { Credentials } from '../api/types'
import { isValidPhone, normalizePhone } from '../lib/format'
import { CloseIcon } from './icons'

interface Props {
  creds: Credentials
  onCreate: (chat: { id: string; phone: string }) => void
  onClose: () => void
}

export function NewChatDialog({ creds, onCreate, onClose }: Props) {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const digits = normalizePhone(phone)
    if (!isValidPhone(digits)) {
      setError('Введите номер в международном формате, например +7 999 123-45-67')
      return
    }

    setLoading(true)
    setError(null)
    try {
      // Входящие сообщения приходят с числовым chatId MAX, поэтому узнаём его заранее
      const { exist, chatId } = await checkAccount(creds, digits)
      if (!exist) {
        setError('На этом номере нет аккаунта MAX')
        return
      }
      onCreate({ id: chatId || `${digits}@c.us`, phone: digits })
    } catch {
      // Проверка недоступна (например, лимит запросов) — отправляем по номеру телефона
      onCreate({ id: `${digits}@c.us`, phone: digits })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" role="dialog" aria-labelledby="new-chat-title" onSubmit={handleSubmit}>
        <header className="modal-header">
          <h2 id="new-chat-title">Новый чат</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Закрыть">
            <CloseIcon />
          </button>
        </header>

        <label className="field">
          <span className="field-label">Номер телефона получателя</span>
          <input
            className="input"
            type="tel"
            inputMode="tel"
            placeholder="+7 999 123-45-67"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoFocus
            required
          />
        </label>

        {error && (
          <div className="login-error" role="alert">
            {error}
          </div>
        )}

        <button className="button-primary" type="submit" disabled={loading}>
          {loading ? 'Проверяем номер…' : 'Создать чат'}
        </button>
      </form>
    </div>
  )
}
