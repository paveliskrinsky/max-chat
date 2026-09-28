/** Оставляет только цифры; ведущую 8 российского номера заменяет на 7. */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  return digits.length === 11 && digits.startsWith('8') ? `7${digits.slice(1)}` : digits
}

/** GREEN-API принимает номера из 11–12 цифр в международном формате. */
export function isValidPhone(digits: string): boolean {
  return /^\d{11,12}$/.test(digits)
}

export function formatPhone(digits: string): string {
  const m = digits.match(/^7(\d{3})(\d{3})(\d{2})(\d{2})$/)
  return m ? `+7 ${m[1]} ${m[2]}-${m[3]}-${m[4]}` : `+${digits}`
}

const timeFormat = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })
const dayFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })
const fullDayFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}

export function formatTime(ts: number): string {
  return timeFormat.format(ts)
}

/** Время в списке чатов: сегодня — часы, иначе дата («28 сент.»). */
export function formatChatListTime(ts: number, now = Date.now()): string {
  return isSameDay(new Date(ts), new Date(now)) ? timeFormat.format(ts) : dayFormat.format(ts)
}

/** Разделитель дней в ленте сообщений. */
export function formatDayDivider(ts: number, now = Date.now()): string {
  const date = new Date(ts)
  const today = new Date(now)
  if (isSameDay(date, today)) return 'Сегодня'
  const yesterday = new Date(now)
  yesterday.setDate(today.getDate() - 1)
  if (isSameDay(date, yesterday)) return 'Вчера'
  return fullDayFormat.format(ts)
}

export function initials(name: string): string {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '#'
  if (/^\d/.test(words[0])) return words[0].slice(-2)
  return words
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

const AVATAR_GRADIENTS = [
  ['#ffb347', '#ff7e29'],
  ['#5ac8fa', '#007aff'],
  ['#b474ff', '#7b3cff'],
  ['#ff6f91', '#e8356d'],
  ['#4cd964', '#1abe43'],
  ['#5ee7df', '#2bb3c0'],
]

export function avatarGradient(seed: string): string {
  let hash = 0
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  const [from, to] = AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
  return `linear-gradient(135deg, ${from}, ${to})`
}
