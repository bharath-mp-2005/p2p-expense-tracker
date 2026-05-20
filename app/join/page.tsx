"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient, getGuestUser, getOrCreateGuestUser } from "@/lib/supabase/client"

function JoinPageContent() {
  const searchParams = useSearchParams()
  const [displayName, setDisplayName] = useState("")
  const [code, setCode] = useState(searchParams.get("code") || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Check for existing guest user on mount
  useEffect(() => {
    const existingUser = getGuestUser()
    if (existingUser) {
      setDisplayName(existingUser.display_name)
    }
  }, [])

  const ensureProfile = async (user: { id: string; display_name: string }) => {
    const supabase = createClient()
    await supabase.from("profiles").upsert({
      id: user.id,
      display_name: user.display_name,
      created_at: new Date().toISOString(),
    }, { onConflict: "id" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const user = getOrCreateGuestUser(displayName)
      
      // Ensure profile exists
      await ensureProfile(user)

      // Find room by code (case insensitive)
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select("id, name")
        .ilike("code", code.trim())
        .single()

      if (roomError || !room) {
        setError("Room not found. Check the code and try again.")
        setLoading(false)
        return
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from("room_members")
        .select("id")
        .eq("room_id", room.id)
        .eq("user_id", user.id)
        .single()

      if (!existingMember) {
        // Join the room
        await supabase.from("room_members").insert({
          room_id: room.id,
          user_id: user.id,
        })

        // Log activity
        await supabase.from("activity_log").insert({
          room_id: room.id,
          user_id: user.id,
          action: "member_joined",
          details: {},
        })
      }

      router.push(`/${code.trim()}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            XO
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Join a room</h1>
            <p className="text-sm text-muted-foreground">
              Enter your name and the room code
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                placeholder="What should we call you?"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Room code</Label>
              <Input
                id="code"
                placeholder="Enter the room code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="font-mono"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || !displayName.trim()}>
              {loading ? "Joining..." : "Join room"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {"Want to create your own room? "}
            <Link href="/" className="text-foreground underline underline-offset-4">
              Go back
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <JoinPageContent />
    </Suspense>
  )
}
