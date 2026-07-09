'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'

/**
 * The layered painterly hero, alive in-engine (Build 2, new 3-layer art):
 *  - l1 sky/meadow base (paper plane + trail baked in) — slowest parallax
 *  - l2 figures (painter + developer) with a per-figure breathing shader so
 *    they're never frozen (Build 1 fault), + a breathing warm laptop glow
 *  - l3 foreground flora with a wind-sway shader — most parallax
 * Imagery stays full-colour warm; only the site chrome is monochrome.
 */

export type HeroMotionState = {
  progress: number // 0..1 through the pinned hero
  px: number // pointer -1..1
  py: number
}

const IMG_ASPECT = 1536 / 1024

/** Developer's laptop screen, normalised from top-left of the 1536×1024 frame. */
const LAPTOP = { x: 0.72, y: 0.67 }

function coverScale(vw: number, vh: number): [number, number] {
  const scale = Math.max(vw / IMG_ASPECT, vh) * 1.1
  return [scale * IMG_ASPECT, scale]
}

const PLAIN_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/* Figures: a gentle breathing whose phase varies across x, so the painter and
   the developer never move in lockstep. Strongest at the upper body, zero at
   the seated base — reads as life, not drift. */
const FIGURE_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uTime;
  uniform float uAmp;
  varying vec2 vUv;
  void main() {
    vec2 uv = vUv;
    float bodyTop = smoothstep(0.78, 0.12, uv.y);      // 1 up top, 0 at the base
    float breath = sin(uTime * 0.9 + uv.x * 3.1) * 0.5
                 + sin(uTime * 1.7 + uv.x * 6.7) * 0.2;
    uv.y += breath * uAmp * bodyTop;
    uv.x += breath * uAmp * 0.45 * bodyTop;
    vec4 c = texture2D(uMap, uv);
    if (c.a < 0.003) discard;
    gl_FragColor = c;
  }
`

/* Flora: a slow gust travelling across the field + faster flutter on top. */
const WIND_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uTime;
  uniform float uWind;
  varying vec2 vUv;
  void main() {
    vec2 uv = vUv;
    float band = smoothstep(0.02, 0.34, uv.y) * (1.0 - smoothstep(0.46, 0.82, uv.y));
    float gust = sin(uv.x * 4.0 + uTime * 0.7) * 0.6
               + sin(uv.x * 9.0 - uTime * 1.4) * 0.28
               + sin(uv.x * 21.0 + uTime * 2.3) * 0.16;
    uv.x += gust * uWind * band;
    uv.y += (cos(uv.x * 7.0 + uTime * 0.9) * 0.5
           + sin(uv.x * 15.0 + uTime * 1.7) * 0.2) * uWind * 0.6 * band;
    vec4 c = texture2D(uMap, uv);
    if (c.a < 0.003) discard;
    gl_FragColor = c;
  }
`

function glowTexture(): THREE.Texture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255, 236, 194, 0.8)')
  g.addColorStop(0.4, 'rgba(240, 208, 150, 0.28)')
  g.addColorStop(1, 'rgba(240, 208, 150, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function Scene({ motion }: { motion: HeroMotionState }) {
  const { viewport } = useThree()
  const [base, figures, flora] = useLoader(THREE.TextureLoader, [
    '/assets/hero/hero-l1-sky.png',
    '/assets/hero/hero-l2-figures.png',
    '/assets/hero/hero-l3-flora.png',
  ])
  for (const t of [base, figures, flora]) t.colorSpace = THREE.SRGBColorSpace

  const [w, h] = coverScale(viewport.width, viewport.height)

  const g1 = useRef<THREE.Group>(null)
  const g2 = useRef<THREE.Group>(null)
  const g3 = useRef<THREE.Group>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const root = useRef<THREE.Group>(null)

  const figureMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: PLAIN_VERT,
        fragmentShader: FIGURE_FRAG,
        uniforms: {
          uMap: { value: figures },
          uTime: { value: 0 },
          uAmp: { value: 0.0065 }, // breathing — perceptible but calm
        },
        transparent: true,
        depthWrite: false,
      }),
    [figures],
  )

  const windMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: PLAIN_VERT,
        fragmentShader: WIND_FRAG,
        uniforms: {
          uMap: { value: flora },
          uTime: { value: 0 },
          uWind: { value: 0.022 },
        },
        transparent: true,
        depthWrite: false,
      }),
    [flora],
  )

  const glowTex = useMemo(() => glowTexture(), [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    figureMat.uniforms.uTime.value = t
    windMat.uniforms.uTime.value = t

    const p = motion.progress
    const px = motion.px
    const py = motion.py

    // parallax: flora most, figures a little, sky least
    if (g1.current) {
      g1.current.position.x = px * w * 0.006
      g1.current.position.y = -py * h * 0.004 + p * h * 0.015
    }
    if (g2.current) {
      g2.current.position.x = px * w * 0.017
      g2.current.position.y = -py * h * 0.011 - p * h * 0.03
    }
    if (g3.current) {
      g3.current.position.x = px * w * 0.036
      g3.current.position.y = -py * h * 0.024 - p * h * 0.08
    }
    // gentle settle-zoom as the journey progresses
    if (root.current) {
      const z = 1 + p * 0.05
      root.current.scale.set(z, z, 1)
    }
    // laptop screen-glow breathes
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.3 + Math.sin(t * 0.9) * 0.12 + Math.sin(t * 2.3) * 0.04
    }
  })

  return (
    <group ref={root}>
      <group ref={g1}>
        <mesh position={[0, 0, -0.02]}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial map={base} toneMapped={false} />
        </mesh>
      </group>

      <group ref={g2} position={[0, 0, 0.02]}>
        <mesh material={figureMat}>
          <planeGeometry args={[w, h]} />
        </mesh>
        <mesh ref={glowRef} position={[(LAPTOP.x - 0.5) * w, (0.5 - LAPTOP.y) * h, 0.01]}>
          <planeGeometry args={[w * 0.14, w * 0.1]} />
          <meshBasicMaterial
            map={glowTex}
            transparent
            opacity={0.36}
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
  onContextLost,
}: {
  motion: HeroMotionState
  /** context is gone — parent should drop to the static poster underneath */
  onContextLost?: () => void
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      // 'default' — NOT 'high-performance'. On dual-GPU MacBooks the
      // high-performance hint makes macOS switch to the discrete GPU right
      // after the context is created, which loses the just-made context.
      // alpha:true so a lost canvas reveals the static poster underneath.
      gl={{ antialias: false, alpha: true, powerPreference: 'default' }}
      camera={{ position: [0, 0, 5], fov: 42 }}
      style={{ position: 'absolute', inset: 0 }}
      onCreated={({ gl }) => {
        // On context loss, DON'T let the browser restore it — a restored
        // context has lost every texture and re-renders the meshes white over
        // the poster. Tear the canvas down instead and let the animated static
        // poster underneath stand. No white, no blank.
        gl.domElement.addEventListener('webglcontextlost', () => onContextLost?.())
      }}
    >
      <Scene motion={motion} />
    </Canvas>
  )
}
