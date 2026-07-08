import { Fraunces, Geist_Mono } from 'next/font/google'
import localFont from 'next/font/local'

/**
 * Type per ui.md — Fraunces display (soft/optical character, mixed weights),
 * General Sans body (warm-humanist, not Inter), refined mono for labels/data.
 */

export const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  axes: ['opsz', 'SOFT', 'WONK'],
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

export const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const fontVariables = `${fraunces.variable} ${generalSans.variable} ${geistMono.variable}`
