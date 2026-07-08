import Link from 'next/link'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

type Variant = 'primary' | 'ghost' | 'quiet'
type Size = 'sm' | 'md' | 'lg'

type CommonProps = {
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
}

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined }

type ButtonAsLink = CommonProps & { href: string; target?: string; rel?: string }

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = 'primary', size = 'md', className, children, ...rest } = props
  const cls = [styles.base, styles[variant], size !== 'md' ? styles[size] : '', className]
    .filter(Boolean)
    .join(' ')

  if ('href' in props && typeof props.href === 'string') {
    const { href, target, rel } = props as ButtonAsLink
    const external = /^https?:|^mailto:|^tel:/.test(href)
    if (external) {
      return (
        <a href={href} target={target} rel={rel ?? (target === '_blank' ? 'noreferrer' : undefined)} className={cls}>
          {children}
        </a>
      )
    }
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    )
  }

  return (
    <button {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)} className={cls}>
      {children}
    </button>
  )
}
