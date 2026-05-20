"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
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

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function CreateRoomDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
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
    const roomCode = code.trim() || generateRoomCode()

    // Create the room
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .insert({
        name,
        code: roomCode,
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

    // Add creator as member
    const { error: memberError } = await supabase
      .from("room_members")
      .insert({
        room_id: room.id,
        user_id: user.id,
      })

    if (memberError) {
      setError(memberError.message)
      setLoading(false)
      return
    }

    // Log activity
    await supabase.from("activity_log").insert({
      room_id: room.id,
      user_id: user.id,
      action: "room_created",
      details: { room_name: name },
    })

    setOpen(false)
    setName("")
    setCode("")
    router.push(`/room/${room.id}`)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create room
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a room</DialogTitle>
          <DialogDescription>
            Create a new room to start tracking expenses with your group.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Room name</Label>
            <Input
              id="name"
              placeholder="e.g., Trip to Paris, Apartment expenses"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Room code (optional)</Label>
            <Input
              id="code"
              placeholder="Leave blank for random code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Any letters or numbers. Share this code with others to join.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
