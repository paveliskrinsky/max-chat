import { useState, type FormEvent } from 'react'
import { getStateInstance, guessApiUrl } from '../api/greenApi'
import type { Credentials, InstanceState } from '../api/types'
import { AppLogo } from './icons'

const STATE_ERRORS: Partial<Record<InstanceState, string>> = {
  notAuthorized: 'Инстанс не авторизован. Отсканируйте QR-код в личном кабинете GREEN-API',
  blocked: 'Аккаунт MAX заблокирован',
  starting: 'Инстанс запускается, попробуйте через пару минут',
  pendingPassword: 'Инстанс ждёт пароль двухфакторной аутентификации',
}

interface Props {
  onLogin: (creds: Credentials) => void
}

export function LoginScreen({ onLogin }: Props) {
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [apiUrl, setApiUrl] = useState('')
  const [apiUrlEdited, setApiUrlEdited] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const effectiveApiUrl = apiUrlEdited ? apiUrl : guessApiUrl(idInstance)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const creds: Credentials = {
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
      apiUrl: effectiveApiUrl.trim(),
    }
    if (!/^\d+$/.test(creds.idInstance)) {
      setError('idInstance должен состоять из цифр')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { stateInstance } = await getStateInstance(creds)
      const stateError = STATE_ERRORS[stateInstance]
      if (stateError) {
        setError(stateError)
        return
      }
      onLogin(creds)
    } catch (err) {
      setError(
        err instanceof TypeError
          ? 'Не удалось подключиться к API. Проверьте apiUrl и интернет-соединение'
          : err instanceof Error
            ? err.message
            : String(err),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <form className="login-card" onSubmit={handleSubmit}>
        <AppLogo className="login-logo" />
        <h1 className="login-title">Вход в чат MAX</h1>
        <p className="login-subtitle">
          Введите параметры инстанса из{' '}
          <a href="https://console.green-api.com" target="_blank" rel="noreferrer">
            личного кабинета GREEN-API
          </a>
        </p>

        <label className="field">
          <span className="field-label">idInstance</span>
          <input
            className="input"
            inputMode="numeric"
            autoComplete="username"
            placeholder="3100123456"
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value)}
            required
            autoFocus
          />
        </label>

        <label className="field">
          <span className="field-label">apiTokenInstance</span>
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            placeholder="Токен инстанса"
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
            required
          />
        </label>

        <label className="field">
          <span className="field-label">apiUrl</span>
          <input
            className="input"
            type="url"
            placeholder="https://3100.api.green-api.com"
            value={effectiveApiUrl}
            onChange={(e) => {
              setApiUrl(e.target.value)
              setApiUrlEdited(true)
            }}
            required
          />
          <span className="field-hint">Подставляется автоматически по idInstance</span>
        </label>

        {error && (
          <div className="login-error" role="alert">
            {error}
          </div>
        )}

        <button className="button-primary" type="submit" disabled={loading}>
          {loading ? 'Проверяем…' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
