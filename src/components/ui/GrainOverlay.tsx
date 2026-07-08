'use client'

import { useEffect, useState } from 'react'

/**
 * Film grain — part of the cinematic grade (CSS-able per the asset manifest;
 * generated once on the client, tiled, screen-blended, never animated).
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
      const v = 118 + Math.random() * 20
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v
      img.data[i + 3] = 255
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
        mixBlendMode: 'overlay',
        opacity: 0.05,
      }}
    />
  )
}
