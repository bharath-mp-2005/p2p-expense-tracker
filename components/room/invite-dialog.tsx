"use client"

import { useState } from "react"
import { Share2, Copy, Check } from "lucide-react"
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
import { createClient } from "@/lib/supabase/client"

interface InviteDialogProps {
  roomId: string
  roomCode: string
}

export function InviteDialog({ roomId, roomCode }: InviteDialogProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [password, setPassword] = useState("")
  const [autoPassword, setAutoPassword] = useState(false)
  const [generating, setGenerating] = useState(false)

  const generatePassword = () => {
    // Generate a simple 6-character password
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let pwd = ""
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setPassword(pwd)
  }

  const handleGenerateInvite = async () => {
    setGenerating(true)
    const supabase = createClient()

    try {
      const inviteCode = Math.random().toString(36).substring(2, 10)
      const invitePassword = autoPassword && password ? password : null

      await supabase.from("room_invites").insert({
        room_id: roomId,
        invite_code: inviteCode,
        invite_password: invitePassword,
      })

      const inviteUrl = `${window.location.origin}/invite/${inviteCode}`
      
      // Copy to clipboard
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } finally {
      setGenerating(false)
    }
  }

  const inviteUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${roomCode}`

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 size={16} />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite to Room</DialogTitle>
          <DialogDescription>
            Share this room with others
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm">Share Link</Label>
            <div className="flex gap-2 mt-2">
              <Input
                readOnly
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/join?code=${roomCode}`}
                className="font-mono text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${typeof window !== "undefined" ? window.location.origin : ""}/join?code=${roomCode}`
                  )
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
          </div>

          <div className="border-t pt-4">
            <Label className="text-sm">Protect with Password</Label>
            <p className="text-xs text-muted-foreground mb-3">
              Optional: Require a password to join this room
            </p>

            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter password (optional)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={generatePassword}
                >
                  Generate
                </Button>
              </div>

              <Button
                className="w-full"
                onClick={handleGenerateInvite}
                disabled={generating}
              >
                {generating ? "Generating..." : "Create Invite Link"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
