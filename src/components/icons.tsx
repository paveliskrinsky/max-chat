import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = (props: IconProps) => ({
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  'aria-hidden': true,
  ...props,
})

export const ChatsIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path
      fill="currentColor"
      d="M12 3c5 0 9 3.4 9 7.7s-4 7.7-9 7.7c-.9 0-1.8-.1-2.6-.3L5 20.5c-.5.3-1.1-.1-1-.7l.6-3.2C3.6 15.2 3 13 3 10.7 3 6.4 7 3 12 3Zm-4 6.3a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Zm4 0a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Zm4 0a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Z"
    />
  </svg>
)

export const LogoutIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h9"
    />
  </svg>
)

export const PlusIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" d="M12 5v14M5 12h14" />
  </svg>
)

export const SearchIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="m16 16 4 4" />
  </svg>
)

export const SendIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path
      fill="currentColor"
      d="M4.4 3.7c-.8-.4-1.7.4-1.4 1.2L5.6 12l-2.6 7.1c-.3.8.6 1.6 1.4 1.2l16-7.4c.8-.4.8-1.5 0-1.8l-16-7.4ZM7.3 13h6.2a1 1 0 1 0 0-2H7.3L5.6 6.4 18 12 5.6 17.6 7.3 13Z"
    />
  </svg>
)

export const BackIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 5l-7 7 7 7"
    />
  </svg>
)

export const CloseIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
  </svg>
)

export const CheckIcon = (p: IconProps) => (
  <svg {...base({ viewBox: '0 0 16 16', width: 16, height: 16, ...p })}>
    <path
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m2.5 8.5 3.2 3L13 4.5"
    />
  </svg>
)

export const DoubleCheckIcon = (p: IconProps) => (
  <svg {...base({ viewBox: '0 0 20 16', width: 20, height: 16, ...p })}>
    <path
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m1.5 8.5 3.2 3L12 4.5M9 11.3l.3.2L16.6 4.5"
    />
  </svg>
)

export const ClockIcon = (p: IconProps) => (
  <svg {...base({ viewBox: '0 0 16 16', width: 14, height: 14, ...p })}>
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
    <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" d="M8 5v3.2l2 1.3" />
  </svg>
)

export const ErrorIcon = (p: IconProps) => (
  <svg {...base({ viewBox: '0 0 16 16', width: 16, height: 16, ...p })}>
    <circle cx="8" cy="8" r="7" fill="currentColor" />
    <path stroke="#fff" strokeWidth="1.6" strokeLinecap="round" d="M8 4.5v4M8 11.2v.1" />
  </svg>
)

export const AppLogo = (p: IconProps) => (
  <svg {...base({ viewBox: '0 0 48 48', width: 48, height: 48, ...p })}>
    <defs>
      <linearGradient id="app-logo-g" x1="6" y1="42" x2="42" y2="6" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00b8ff" />
        <stop offset=".55" stopColor="#4f5dff" />
        <stop offset="1" stopColor="#b210db" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="14" fill="url(#app-logo-g)" />
    <path
      fill="#fff"
      d="M24.2 11c7.3 0 12.8 5.6 12.8 12.9 0 7.2-5.6 12.9-12.9 12.9-2.3 0-4-.5-5.3-1.2l-3.6 2c-.9.5-1.9-.3-1.7-1.3l.8-4.3c-2-2.3-3.1-5.2-3.1-8.2C11.2 16.6 16.9 11 24.2 11Zm0 5.2a7.6 7.6 0 0 0-7.7 7.6c0 4.3 3.4 7.7 7.7 7.7 4.2 0 7.6-3.4 7.6-7.7 0-4.2-3.4-7.6-7.6-7.6Z"
    />
  </svg>
)
