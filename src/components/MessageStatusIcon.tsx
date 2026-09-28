import type { MessageStatus } from '../chat/types'
import { CheckIcon, ClockIcon, DoubleCheckIcon, ErrorIcon } from './icons'

const LABELS: Record<MessageStatus, string> = {
  sending: 'Отправляется',
  sent: 'Отправлено',
  delivered: 'Доставлено',
  read: 'Прочитано',
  failed: 'Не отправлено',
}

export function MessageStatusIcon({ status, error }: { status: MessageStatus; error?: string }) {
  const title = error ?? LABELS[status]
  return (
    <span className={`status status-${status}`} title={title} aria-label={title}>
      {status === 'sending' && <ClockIcon />}
      {/* Как в MAX: одна галочка — отправлено/доставлено, две — прочитано */}
      {(status === 'sent' || status === 'delivered') && <CheckIcon />}
      {status === 'read' && <DoubleCheckIcon />}
      {status === 'failed' && <ErrorIcon />}
    </span>
  )
}
