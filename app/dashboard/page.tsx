"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient, getGuestUser, type GuestUser } from "@/lib/supabase/client"
import { CreateRoomDialog } from "@/components/create-room-dialog"
import { JoinRoomDialog } from "@/components/join-room-dialog"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Room {
  id: string
  name: string
  code: string
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<GuestUser | { id: string; email?: string; user_metadata?: any } | null>(null)
  const [isAuth, setIsAuth] = useState(false)
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const sb = createClient()
      setSupabase(sb)
      
      // Check if authenticated
      const { data: { session } } = await sb.auth.getSession()
      
      if (session?.user) {
        setUser(session.user)
        setIsAuth(true)
        loadRooms(session.user.id, true, sb)
      } else {
        // Fall back to guest
        const guestUser = getGuestUser()
        if (guestUser) {
          setUser(guestUser)
          setIsAuth(false)
          loadRooms(guestUser.id, false, sb)
        } else {
          router.push("/")
          return
        }
      }
    }

    checkAuth()
  }, [router])

  const loadRooms = async (userId: string, isAuthenticated: boolean, sb: any) => {
    if (isAuthenticated) {
      // For authenticated users, get all their rooms
      const { data: roomsData } = await sb
        .from("rooms")
        .select("id, name, code, created_at")
        .or(`created_by.eq.${userId},id.in(select room_id from room_members where user_id = ${userId})`)
        .order("created_at", { ascending: false })
      
      setRooms(roomsData || [])
    } else {
      // For guest users, get their room memberships
      const { data: memberships } = await sb
        .from("room_members")
        .select("room_id")
        .eq("user_id", userId)

      if (memberships && memberships.length > 0) {
        const roomIds = memberships.map(m => m.room_id)
        const { data: roomsData } = await sb
          .from("rooms")
          .select("id, name, code, created_at")
          .in("id", roomIds)
          .order("created_at", { ascending: false })

        setRooms(roomsData || [])
      }
    }
    
    setLoading(false)
  }

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            XO
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {isAuth 
                ? (user as any)?.user_metadata?.display_name || (user as any)?.email
                : (user as GuestUser)?.display_name || "Guest"
              }
            </span>
            {isAuth && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut size={16} />
                Logout
              </Button>
            )}
            {!isAuth && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push("/auth/signup")}
              >
                Sign Up
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 py-8 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Your rooms</h1>
            <div className="flex items-center gap-2">
              <JoinRoomDialog />
              <CreateRoomDialog />
            </div>
          </div>

          {rooms.length === 0 ? (
            <div className="border border-dashed border-border rounded py-16 text-center">
              <p className="text-muted-foreground mb-4">No rooms yet</p>
              <p className="text-sm text-muted-foreground mb-6">
                Create a room to start tracking expenses with friends
              </p>
              <CreateRoomDialog />
            </div>
          ) : (
            <div className="border border-border rounded divide-y divide-border">
              {rooms.map((room) => (
                <Link
                  key={room.id}
                  href={`/${room.code}`}
                  className="flex items-center justify-between px-4 py-4 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <h3 className="font-medium">{room.name}</h3>
                    <p className="text-sm text-muted-foreground font-mono">
                      {room.code}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(room.created_at).toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
