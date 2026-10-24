import clsx from 'clsx'

export type ButtonVariant = 'primary' | 'accent' | 'outline' | 'ghost'
export type ButtonSize = 38 | 44 | 52 | 56 | 60

/** Class list for anything that looks like a button: a <button>, a router <Link> or a plain <a>. */
export const buttonClass = (variant: ButtonVariant = 'primary', size: ButtonSize = 52, className?: string) =>
  clsx('ll-btn', `ll-btn--${variant}`, `ll-btn--h${size}`, className)
