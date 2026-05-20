"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createClient, getGuestUser } from "@/lib/supabase/client"

export function JoinRoomDialog() {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const user = getGuestUser()

    if (!user) {
      setError("Session expired. Please refresh the page.")
      setLoading(false)
      return
    }

    const supabase = createClient()

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

    if (existingMember) {
      setOpen(false)
      setCode("")
      router.push(`/room/${room.id}`)
      return
    }

    // Join the room
    const { error: joinError } = await supabase
      .from("room_members")
      .insert({
        room_id: room.id,
        user_id: user.id,
      })

    if (joinError) {
      setError(joinError.message)
      setLoading(false)
      return
    }

    // Log activity
    await supabase.from("activity_log").insert({
      room_id: room.id,
      user_id: user.id,
      action: "member_joined",
      details: {},
    })

    setOpen(false)
    setCode("")
    router.push(`/room/${room.id}`)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Join room
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a room</DialogTitle>
          <DialogDescription>
            Enter the room code shared with you to join an existing room.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded">
              {error}
            </div>
          )}
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Joining..." : "Join room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
