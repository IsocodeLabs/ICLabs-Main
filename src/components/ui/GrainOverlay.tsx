'use client'

import { useEffect, useState } from 'react'

/**
 * Film grain — part of the cinematic grade (generated once on the client,
 * tiled, never animated).
 *
 * Plain alpha noise (black and white specks, a few percent opaque) rather than
 * a `mix-blend-mode` overlay: a full-screen blend layer sits over every glass
 * panel and forces the browser to re-composite the whole page on each scroll
 * frame, which on busy GPUs starves tile raster and leaves bands of text
 * unpainted. This reads the same, and costs nothing.
 */
export function GrainOverlay() {
  const [url, setUrl] = useState('')

  useEffect(() => {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const img = ctx.createImageData(size, size)
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() < 0.5 ? 0 : 255
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v
      img.data[i + 3] = Math.random() * 5
    }
    ctx.putImageData(img, 0, 0)
    setUrl(canvas.toDataURL())
  }, [])

  if (!url) return null
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        pointerEvents: 'none',
        backgroundImage: `url(${url})`,
        backgroundRepeat: 'repeat',
      }}
    />
  )
}
