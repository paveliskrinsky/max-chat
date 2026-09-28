import { avatarGradient, initials } from '../lib/format'

interface Props {
  name: string
  seed: string
  /** Без size размер задаётся стилями контейнера */
  size?: number
}

export function Avatar({ name, seed, size }: Props) {
  const dimensions = size ? { width: size, height: size, fontSize: size * 0.38 } : undefined
  return (
    <div className="avatar" style={{ ...dimensions, background: avatarGradient(seed) }} aria-hidden>
      {initials(name)}
    </div>
  )
}
