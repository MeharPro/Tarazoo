import React from 'react'

type CtaButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  highlight?: boolean
}

export function CtaButton({ className = '', highlight = true, children, ...rest }: CtaButtonProps) {
  return (
    <button
      {...rest}
      className={
        (
          'relative inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium ' +
          'transition-transform focus:outline-none ' +
          (highlight ? 'animate-throb attention-pulse ' : '') +
          className
        ).trim()
      }
    >
      {children}
    </button>
  )
}

export function ClickMe({ className = '' }: { className?: string }) {
  return (
    <span className={(
      'absolute -top-3 -right-3 select-none rounded-full bg-pink-600 text-white text-[10px] px-2 py-1 ' +
      'shadow-md animate-bounce ' +
      className
    ).trim()}>
      Click me
    </span>
  )
}

