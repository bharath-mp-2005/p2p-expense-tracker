"use client"

import { useState, useEffect, useRef } from "react"
import { formatDistanceToNow } from "date-fns"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

interface Message {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: { id: string; display_name: string | null } | null
}

interface ChatTabProps {
  roomId: string
  userId: string
  initialMessages: Message[]
}

export function ChatTab({ roomId, userId, initialMessages }: ChatTabProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    // Subscribe to new messages
    const channel = supabase
      .channel(`room-${roomId}-messages`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          // Fetch the complete message with profile
          const { data: newMsg } = await supabase
            .from("messages")
            .select(`*, profiles (id, display_name)`)
            .eq("id", payload.new.id)
            .single()

          if (newMsg) {
            setMessages((prev) => [...prev, newMsg])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, supabase])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    const { error } = await supabase.from("messages").insert({
      room_id: roomId,
      user_id: userId,
      content: newMessage.trim(),
    })

    if (!error) {
      setNewMessage("")
    }
    setSending(false)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Chat</h2>
      
      <div className="border border-border rounded flex flex-col h-[400px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground text-sm">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${
                  message.user_id === userId ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded px-3 py-2 ${
                    message.user_id === userId
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>
                    {message.user_id === userId
                      ? "You"
                      : message.profiles?.display_name || "Unknown"}
                  </span>
                  <span>
                    {formatDistanceToNow(new Date(message.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleSend}
          className="border-t border-border p-3 flex gap-2"
        >
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sending}
          />
          <Button type="submit" size="sm" disabled={sending || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
