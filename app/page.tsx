"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, LogIn, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient, getGuestUser, getOrCreateGuestUser } from "@/lib/supabase/client"

export default function LandingPage() {
  const [displayName, setDisplayName] = useState("")
  const [roomCode, setRoomCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<"choose" | "create" | "join" | null>(null)
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

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const user = getOrCreateGuestUser(displayName)
      await ensureProfile(user)

      const code = roomCode.trim() || generateCode()

      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .insert({
          name: `${displayName}'s Room`,
          code,
          created_by: user.id,
        })
        .select()
        .single()

      if (roomError) {
        if (roomError.code === "23505") {
          setError("This room code is already taken. Try another one.")
        } else {
          setError(roomError.message)
        }
        setLoading(false)
        return
      }

      await supabase.from("room_members").insert({
        room_id: room.id,
        user_id: user.id,
      })

      await supabase.from("activity_log").insert({
        room_id: room.id,
        user_id: user.id,
        action: "room_created",
        details: { room_name: room.name },
      })

      router.push(`/${room.code}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
    }
  }

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const user = getOrCreateGuestUser(displayName)
      await ensureProfile(user)

      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select("id, name")
        .ilike("code", roomCode.trim())
        .single()

      if (roomError || !room) {
        setError("Room not found. Check the code and try again.")
        setLoading(false)
        return
      }

      const { data: existingMember } = await supabase
        .from("room_members")
        .select("id")
        .eq("room_id", room.id)
        .eq("user_id", user.id)
        .single()

      if (!existingMember) {
        await supabase.from("room_members").insert({
          room_id: room.id,
          user_id: user.id,
        })

        await supabase.from("activity_log").insert({
          room_id: room.id,
          user_id: user.id,
          action: "member_joined",
          details: {},
        })
      }

      router.push(`/${room.code}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 py-4 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">XO</div>
            <div className="text-sm text-gray-500 hidden sm:block">Split expenses. Track loans.</div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => router.push('/auth/login')}
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Login</span>
            </Button>
            <Button 
              size="sm"
              className="gap-2"
              onClick={() => router.push('/auth/signup')}
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Up</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Hero Section */}
          {!mode && (
            <div className="space-y-8 text-center">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                  Split expenses.<br />Track loans.
                </h1>
                <p className="text-gray-400 text-lg">
                  No signup required. Just enter your name and start tracking.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">Your name</Label>
                  <Input
                    id="name"
                    placeholder="What should we call you?"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="text-center bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => setMode("create")}
                    disabled={!displayName.trim()}
                  >
                    Create a room
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={() => setMode("join")}
                    disabled={!displayName.trim()}
                  >
                    Join a room
                  </Button>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-800">
                <p className="text-sm text-gray-500">
                  Want to keep your rooms? <Link href="/auth/signup" className="text-white hover:underline font-medium">Sign up for free</Link>
                </p>
              </div>
            </div>
          )}

          {/* Create Room Mode */}
          {mode === "create" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Create a room</h2>
                <p className="text-gray-400">Choose a code for your room</p>
              </div>

              <form onSubmit={handleCreateRoom} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="code" className="text-gray-300">Room code (optional)</Label>
                  <Input
                    id="code"
                    placeholder="e.g., trip2024, family, etc"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    className="font-mono bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                  />
                  <p className="text-xs text-gray-500">
                    Leave blank for a random code. Share this with others to join.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setMode(null)
                      setError(null)
                      setRoomCode("")
                    }}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? "Creating..." : "Create room"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Join Room Mode */}
          {mode === "join" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Join a room</h2>
                <p className="text-gray-400">Enter the room code</p>
              </div>

              <form onSubmit={handleJoinRoom} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="joinCode" className="text-gray-300">Room code</Label>
                  <Input
                    id="joinCode"
                    placeholder="Enter the code they shared with you"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    className="font-mono bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setMode(null)
                      setError(null)
                      setRoomCode("")
                    }}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading || !roomCode.trim()}>
                    {loading ? "Joining..." : "Join room"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 px-4">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-500">
          Split expenses, not friendships.
        </div>
      </footer>
    </div>
  )
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
