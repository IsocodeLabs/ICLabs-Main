'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'

/**
 * The layered painterly hero, alive in-engine (per the asset prompt pack):
 *  - l1 sky/meadow base (plane + trail inpainted out) + the paper plane
 *    sprite gliding across the sky
 *  - l2 figures, static, with a breathing copper screen-glow on the laptop
 *  - l3 foreground flora with a wind-sway shader
 *  - parallax on scroll + pointer (flowers most, sky least)
 * Figures stay static — flowers + plane + glow + parallax carry the life.
 */

export type HeroMotionState = {
  progress: number // 0..1 through the pinned hero
  px: number // pointer -1..1
  py: number
}

const IMG_ASPECT = 1536 / 1024

/** Normalised image coords (from top-left of the 1536×1024 frame). */
const LAPTOP_SCREEN = { x: 1088 / 1536, y: 682 / 1024 }
const PLANE_HOME = { x: 1096 / 1536, y: 339 / 1024 }

function coverScale(vw: number, vh: number): [number, number] {
  // scale the 3:2 image plane so it covers the viewport, with headroom for parallax
  const scale = Math.max(vw / IMG_ASPECT, vh) * 1.08
  return [scale * IMG_ASPECT, scale]
}

const WIND_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uTime;
  uniform float uWind;
  varying vec2 vUv;
  void main() {
    vec2 uv = vUv;
    // sway strongest at the flower tops, zero at the rooted bottom edge
    float band = smoothstep(0.02, 0.32, uv.y) * smoothstep(0.78, 0.38, uv.y);
    float sway = sin(uv.x * 6.0 + uTime * 0.85) * 0.55
               + sin(uv.x * 13.0 - uTime * 1.6) * 0.3
               + sin(uTime * 0.5) * 0.15;
    uv.x += sway * uWind * band;
    uv.y += cos(uv.x * 9.0 + uTime * 1.1) * uWind * 0.45 * band;
    vec4 c = texture2D(uMap, uv);
    if (c.a < 0.003) discard;
    gl_FragColor = c;
  }
`

const PLAIN_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

function glowTexture(): THREE.Texture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255, 196, 138, 0.85)')
  g.addColorStop(0.35, 'rgba(222, 148, 90, 0.35)')
  g.addColorStop(1, 'rgba(206, 148, 99, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Adaptive floor: if early frames can't hold ~30fps, drop to the still. */
function PerfGate({ onPoor }: { onPoor?: () => void }) {
  const samples = useRef<number[]>([])
  const done = useRef(false)
  useFrame((_, delta) => {
    if (done.current || !onPoor) return
    // skip the first frames (compile + upload spikes)
    if (samples.current.length < 70) {
      samples.current.push(delta)
      return
    }
    done.current = true
    const recent = samples.current.slice(20)
    const median = recent.sort((a, b) => a - b)[Math.floor(recent.length / 2)]
    if (median > 0.034) onPoor() // ~30fps floor — ux.md law 1
  })
  return null
}

function Scene({ motion }: { motion: HeroMotionState }) {
  const { viewport } = useThree()
  const [base, figures, flora, plane] = useLoader(THREE.TextureLoader, [
    '/hero/l1-base.webp',
    '/hero/l2-figures.webp',
    '/hero/l3-flora.webp',
    '/hero/plane.png',
  ])
  for (const t of [base, figures, flora, plane]) t.colorSpace = THREE.SRGBColorSpace

  const [w, h] = coverScale(viewport.width, viewport.height)

  const g1 = useRef<THREE.Group>(null)
  const g2 = useRef<THREE.Group>(null)
  const g3 = useRef<THREE.Group>(null)
  const planeRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const root = useRef<THREE.Group>(null)

  const windMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: PLAIN_VERT,
        fragmentShader: WIND_FRAG,
        uniforms: {
          uMap: { value: flora },
          uTime: { value: 0 },
          uWind: { value: 0.0065 },
        },
        transparent: true,
        depthWrite: false,
      }),
    [flora],
  )

  const glowTex = useMemo(() => glowTexture(), [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    windMat.uniforms.uTime.value = t

    const p = motion.progress
    const px = motion.px
    const py = motion.py

    // parallax: flowers most, figures a little, sky least
    if (g1.current) {
      g1.current.position.x = px * w * 0.006
      g1.current.position.y = -py * h * 0.004 + p * h * 0.015
    }
    if (g2.current) {
      g2.current.position.x = px * w * 0.016
      g2.current.position.y = -py * h * 0.010 - p * h * 0.03
    }
    if (g3.current) {
      g3.current.position.x = px * w * 0.034
      g3.current.position.y = -py * h * 0.022 - p * h * 0.075
    }
    // gentle settle-zoom as the journey progresses
    if (root.current) {
      const z = 1 + p * 0.05
      root.current.scale.set(z, z, 1)
    }

    // paper plane: a slow, seamless glide across the upper sky
    if (planeRef.current) {
      const speed = 0.014
      const homeX = PLANE_HOME.x
      const cycle = (homeX + t * speed) % 1.3 // wraps off-screen right → re-enters left
      const nx = cycle - 0.15
      const ny = 1 - PLANE_HOME.y + Math.sin(nx * Math.PI * 1.6 + 0.4) * 0.045
      planeRef.current.position.set((nx - 0.5) * w, (ny - 0.5) * h, 0.01)
      const slope = Math.cos(nx * Math.PI * 1.6 + 0.4) * 0.045 * Math.PI * 1.6
      planeRef.current.rotation.z = Math.atan(slope * (h / w)) * 0.6
    }

    // laptop screen-glow breathes
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.34 + Math.sin(t * 0.9) * 0.13 + Math.sin(t * 2.3) * 0.04
    }
  })

  const planeW = w * (97 / 1536) // sprite sized to its source footprint
  const planeH = planeW * (78 / 97)

  return (
    <group ref={root}>
      <group ref={g1}>
        <mesh position={[0, 0, -0.02]}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial map={base} toneMapped={false} />
        </mesh>
        <mesh ref={planeRef}>
          <planeGeometry args={[planeW, planeH]} />
          <meshBasicMaterial map={plane} transparent toneMapped={false} depthWrite={false} />
        </mesh>
      </group>

      <group ref={g2} position={[0, 0, 0.02]}>
        <mesh>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial map={figures} transparent toneMapped={false} depthWrite={false} />
        </mesh>
        <mesh
          ref={glowRef}
          position={[(LAPTOP_SCREEN.x - 0.5) * w, (0.5 - LAPTOP_SCREEN.y) * h, 0.01]}
        >
          <planeGeometry args={[w * 0.16, w * 0.12]} />
          <meshBasicMaterial
            map={glowTex}
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>

      <group ref={g3} position={[0, 0, 0.04]}>
        <mesh material={windMat}>
          <planeGeometry args={[w, h]} />
        </mesh>
      </group>
    </group>
  )
}

export default function HeroScene({
  motion,
  onFallback,
}: {
  motion: HeroMotionState
  /** called when the GPU can't carry the scene — context loss or poor fps */
  onFallback?: () => void
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 5], fov: 42 }}
      style={{ position: 'absolute', inset: 0 }}
      onCreated={({ gl }) => {
        // if the GPU bails (driver reset, tab pressure), hand over to the
        // static frame instead of showing a dead canvas
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          onFallback?.()
        })
      }}
    >
      <PerfGate onPoor={onFallback} />
      <Scene motion={motion} />
    </Canvas>
  )
}
