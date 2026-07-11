'use client'

import { createContext, useContext, useRef, useState, type ReactNode, type RefObject } from 'react'

type CareersRoleContextValue = {
  role: string
  setRole: (role: string) => void
  /** select a role and scroll the (now non-adjacent) apply form into view */
  chooseRole: (role: string) => void
  applyRef: RefObject<HTMLDivElement | null>
}

const CareersRoleContext = createContext<CareersRoleContextValue | null>(null)

/**
 * Open Roles and the Apply form used to sit right next to each other, so a
 * plain useState + ref worked. They're no longer adjacent in the page (Roles
 * moved up, Apply stayed put), so the selected role now lives here and both
 * sections consume it via context. Server-rendered siblings (Hero, The Bar,
 * the quiet close) can still be passed through as children untouched.
 */
export function CareersRoleProvider({
  defaultRole,
  children,
}: {
  defaultRole: string
  children: ReactNode
}) {
  const [role, setRole] = useState(defaultRole)
  const applyRef = useRef<HTMLDivElement>(null)

  const chooseRole = (roleKey: string) => {
    setRole(roleKey)
    applyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <CareersRoleContext.Provider value={{ role, setRole, chooseRole, applyRef }}>
      {children}
    </CareersRoleContext.Provider>
  )
}

export function useCareersRole() {
  const ctx = useContext(CareersRoleContext)
  if (!ctx) throw new Error('useCareersRole must be used within CareersRoleProvider')
  return ctx
}
