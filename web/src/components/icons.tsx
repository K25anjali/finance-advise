import type { ReactNode, SVGProps } from 'react'

/** Inline stroke icons on a 24×24 grid, decorative by default (the control around them carries the label). */
type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & { size?: number }

function Stroke({ size = 18, strokeWidth = 1.8, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const CheckIcon = (p: IconProps) => (
  <Stroke strokeWidth={2.2} {...p}>
    <path d="M5 12l4 4L19 6" />
  </Stroke>
)
export const ArrowRightIcon = (p: IconProps) => (
  <Stroke strokeWidth={2.6} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Stroke>
)
export const ArrowUpIcon = (p: IconProps) => (
  <Stroke strokeWidth={2.6} {...p}>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </Stroke>
)
export const PlusIcon = (p: IconProps) => (
  <Stroke strokeWidth={2.2} {...p}>
    <path d="M12 5v14M5 12h14" />
  </Stroke>
)
export const SearchIcon = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </Stroke>
)
export const AccountsIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </Stroke>
)
export const SignOutIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3" />
    <path d="M10 16l-4-4 4-4M6 12h10" />
  </Stroke>
)
export const PanelIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <path d="M9 4v16" />
  </Stroke>
)
export const MenuIcon = (p: IconProps) => (
  <Stroke strokeWidth={2} {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Stroke>
)
export const CloseIcon = (p: IconProps) => (
  <Stroke strokeWidth={2} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Stroke>
)
export const ChevronDownIcon = (p: IconProps) => (
  <Stroke strokeWidth={2.2} {...p}>
    <path d="M6 9l6 6 6-6" />
  </Stroke>
)
export const CopyIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V6a2 2 0 012-2h9" />
  </Stroke>
)
export const ThumbIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M7 10v10H4V10zM7 10l4-7a2 2 0 012 2v4h5a2 2 0 012 2.3l-1.2 7A2 2 0 0116.8 20H7" />
  </Stroke>
)
export const DownloadIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
  </Stroke>
)
export const StopIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" />
  </Stroke>
)
export const MoonIcon = (p: IconProps) => (
  <Stroke strokeWidth={2} {...p}>
    <path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />
  </Stroke>
)
export const SunIcon = (p: IconProps) => (
  <Stroke strokeWidth={2} {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Stroke>
)
export const LockIcon = (p: IconProps) => (
  <Stroke strokeWidth={2.2} {...p}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 018 0v3" />
  </Stroke>
)
export const TrashIcon = (p: IconProps) => (
  <Stroke strokeWidth={2.2} {...p}>
    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
  </Stroke>
)
export const PencilIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />
  </Stroke>
)
export const ShareIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12 15V4M7 9l5-5 5 5M5 14v5a1 1 0 001 1h12a1 1 0 001-1v-5" />
  </Stroke>
)

/** The only literal colours allowed outside tokens.css: Google's own. */
export function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h5.9a5 5 0 01-2.2 3.3v2.7h3.6c2.1-1.9 3.2-4.8 3.2-8.1z" fill="#4285F4" />
      <path d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0012 23z" fill="#34A853" />
      <path d="M5.8 14.2a6.6 6.6 0 010-4.3V7.1H2.1a11 11 0 000 9.9z" fill="#FBBC05" />
      <path d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 002.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z" fill="#EA4335" />
    </svg>
  )
}

export function GitHubIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12 1.5a10.5 10.5 0 00-3.3 20.5c.5.1.7-.2.7-.5v-1.9c-2.9.6-3.5-1.3-3.5-1.3-.5-1.2-1.2-1.5-1.2-1.5-1-.7.1-.6.1-.6 1 .1 1.6 1.1 1.6 1.1.9 1.6 2.5 1.1 3.1.9.1-.7.4-1.1.7-1.4-2.3-.3-4.8-1.2-4.8-5.2 0-1.1.4-2.1 1.1-2.8-.1-.3-.5-1.4.1-2.8 0 0 .9-.3 2.9 1.1a10 10 0 015.2 0c2-1.4 2.9-1.1 2.9-1.1.6 1.4.2 2.5.1 2.8.7.7 1.1 1.7 1.1 2.8 0 4-2.5 4.9-4.8 5.2.4.3.7 1 .7 2v2.9c0 .3.2.6.7.5A10.5 10.5 0 0012 1.5z" />
    </svg>
  )
}
