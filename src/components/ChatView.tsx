import { Fragment, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { Chat } from '../chat/types'
import { formatDayDivider, formatPhone, formatTime } from '../lib/format'
import { Avatar } from './Avatar'
import { MessageStatusIcon } from './MessageStatusIcon'
import { BackIcon, SendIcon } from './icons'

const MAX_MESSAGE_LENGTH = 4000

interface Props {
  chat: Chat
  onSend: (text: string) => void
  onBack: () => void
}

export function ChatView({ chat, onSend, onBack }: Props) {
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Компонент пересоздаётся при смене чата (key в Messenger), поэтому черновик свой у каждого открытия
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Автопрокрутка к последнему сообщению
  useLayoutEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [chat.id, chat.messages.length])

  // Авто-высота поля ввода
  useLayoutEffect(() => {
    const input = inputRef.current
    if (!input) return
    input.style.height = 'auto'
    input.style.height = `${Math.min(input.scrollHeight, 160)}px`
  }, [draft])

  const text = draft.trim()
  const canSend = text.length > 0 && text.length <= MAX_MESSAGE_LENGTH

  function send() {
    if (!canSend) return
    onSend(text)
    setDraft('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send()
    }
  }

  const subtitle = chat.phone ? formatPhone(chat.phone) : `ID ${chat.id}`

  return (
    <section className="chat">
      <header className="chat-header">
        <button className="icon-button chat-back" type="button" onClick={onBack} aria-label="К списку чатов">
          <BackIcon />
        </button>
        <Avatar name={chat.name} seed={chat.phone ?? chat.id} size={40} />
        <div className="chat-header-text">
          <div className="chat-header-name">{chat.name}</div>
          <div className="chat-header-sub">{subtitle}</div>
        </div>
      </header>

      <div className="messages" ref={listRef}>
        {chat.messages.length === 0 && (
          <div className="messages-empty">
            <div className="system-bubble">Напишите первое сообщение</div>
          </div>
        )}

        {chat.messages.map((message, i) => {
          const prev = chat.messages[i - 1]
          const newDay = !prev || new Date(prev.timestamp).toDateString() !== new Date(message.timestamp).toDateString()
          const grouped = prev && !newDay && prev.direction === message.direction
          return (
            <Fragment key={message.id}>
              {newDay && (
                <div className="day-divider">
                  <span className="system-bubble">{formatDayDivider(message.timestamp)}</span>
                </div>
              )}
              <div className={`message-row ${message.direction}${grouped ? ' grouped' : ''}`}>
                <div className={`bubble${message.unsupported ? ' unsupported' : ''}${message.status === 'failed' ? ' failed' : ''}`}>
                  <span className="bubble-text">{message.text}</span>
                  <span className="bubble-meta">
                    <time>{formatTime(message.timestamp)}</time>
                    {message.direction === 'out' && message.status && (
                      <MessageStatusIcon status={message.status} error={message.error} />
                    )}
                  </span>
                </div>
              </div>
              {message.status === 'failed' && message.error && (
                <div className="message-error">{message.error}</div>
              )}
            </Fragment>
          )
        })}
      </div>

      <footer className="composer">
        <div className="composer-field">
          <textarea
            ref={inputRef}
            className="composer-input"
            rows={1}
            placeholder="Сообщение"
            value={draft}
            maxLength={MAX_MESSAGE_LENGTH}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button
          className="send-button"
          type="button"
          onClick={send}
          disabled={!canSend}
          aria-label="Отправить"
          title="Отправить (Enter)"
        >
          <SendIcon />
        </button>
      </footer>
    </section>
  )
}
