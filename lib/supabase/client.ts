import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (client) return client

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  return client
}

// Guest user management using localStorage
const GUEST_USER_KEY = "xo_guest_user"

export interface GuestUser {
  id: string
  display_name: string
  created_at: string
}

export function getGuestUser(): GuestUser | null {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem(GUEST_USER_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export function setGuestUser(user: GuestUser): void {
  if (typeof window === "undefined") return
  localStorage.setItem(GUEST_USER_KEY, JSON.stringify(user))
}

export function createGuestUser(displayName: string): GuestUser {
  const user: GuestUser = {
    id: crypto.randomUUID(),
    display_name: displayName,
    created_at: new Date().toISOString(),
  }
  setGuestUser(user)
  return user
}

export function getOrCreateGuestUser(displayName: string): GuestUser {
  let user = getGuestUser()
  if (!user) {
    user = createGuestUser(displayName)
  } else if (displayName && user.display_name !== displayName) {
    user.display_name = displayName
    setGuestUser(user)
  }
  return user
}
