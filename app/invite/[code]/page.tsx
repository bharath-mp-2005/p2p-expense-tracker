"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient, getOrCreateGuestUser, getGuestUser } from "@/lib/supabase/client"

export default function InvitePage() {
  const router = useRouter()
  const params = useParams()
  const [code, setCode] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [passwordRequired, setPasswordRequired] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [room, setRoom] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    const inviteCode = Array.isArray(params.code) ? params.code[0] : params.code
    if (inviteCode) {
      setCode(inviteCode)
      checkInvite(inviteCode)
    }
  }, [params])

  const checkInvite = async (inviteCode: string) => {
    try {
      const { data: invite } = await supabase
        .from("room_invites")
        .select("*, rooms(*)")
        .eq("invite_code", inviteCode)
        .single()

      if (!invite) {
        setError("Invalid invite code")
        setLoading(false)
        return
      }

      setRoom(invite.rooms)
      setPasswordRequired(!!invite.invite_password)
      setLoading(false)
    } catch (err) {
      setError("Failed to load invite")
      setLoading(false)
    }
  }

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Verify password if required
      const { data: invite } = await supabase
        .from("room_invites")
        .select("invite_password")
        .eq("invite_code", code)
        .single()

      if (passwordRequired && invite?.invite_password !== password) {
        setError("Incorrect password")
        setLoading(false)
        return
      }

      // Get or create guest user
      const guestUser = getOrCreateGuestUser(displayName)
      
      // Ensure profile exists
      await supabase.from("profiles").upsert({
        id: guestUser.id,
        display_name: guestUser.display_name,
        created_at: new Date().toISOString(),
      }, { onConflict: "id" })

      // Add user to room
      await supabase.from("room_members").insert({
        room_id: room.id,
        user_id: guestUser.id,
      }).select().single()

      // Log activity
      await supabase.from("activity_log").insert({
        room_id: room.id,
        user_id: guestUser.id,
        action: "user_joined",
        details: { invite_code: code },
      })

      // Redirect to room
      router.push(`/${room.code}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
    }
  }

  if (loading && !room) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-gray-400">Loading invite...</div>
      </div>
    )
  }

  if (error && !room) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2">Invalid Invite</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button asChild>
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!room) return null

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Join {room.name}</h1>
          <p className="text-gray-400">You&apos;re invited to join this room</p>
        </div>

        <form onSubmit={handleJoinRoom} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-900 border border-red-700 rounded text-sm text-red-200">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="displayName" className="text-gray-300">Display Name</Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="mt-2 bg-gray-900 border-gray-700"
              required
            />
          </div>

          {passwordRequired && (
            <div>
              <Label htmlFor="password" className="text-gray-300">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="mt-2 bg-gray-900 border-gray-700"
                required
              />
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-white text-black hover:bg-gray-200"
            disabled={loading}
          >
            {loading ? "Joining..." : "Join Room"}
          </Button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-white hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}
