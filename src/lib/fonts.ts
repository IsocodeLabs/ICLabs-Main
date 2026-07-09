import { Anton, Space_Mono } from 'next/font/google'
import localFont from 'next/font/local'

/**
 * Type per ui-trial.md (Build 2 mono system):
 *   Display: Anton        — one loud condensed voice (headlines only)
 *   Body:    General Sans — clean neutral humanist, readable at length
 *   Accent:  Space Mono   — eyebrows, labels, the "from ISOCODELABS" tag
 * Never set body copy in the display face.
 */

export const anton = Anton({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
  display: 'swap',
})

export const generalSans = localFont({
  src: [
    { path: '../fonts/GeneralSans-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/GeneralSans-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/GeneralSans-Semibold.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-sans',
  display: 'swap',
})

export const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
})

export const fontVariables = `${anton.variable} ${generalSans.variable} ${spaceMono.variable}`
