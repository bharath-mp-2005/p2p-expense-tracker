"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Users, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient, getGuestUser, type GuestUser } from "@/lib/supabase/client"
import { RoomTabs } from "@/components/room/room-tabs"
import { CopyCodeButton } from "@/components/room/copy-code-button"
import { AddContactDialog } from "@/components/room/add-contact-dialog"
import { InviteDialog } from "@/components/room/invite-dialog"

interface RoomPageProps {
  params: Promise<{ code: string }>
}

interface Profile {
  id: string
  display_name: string | null
  is_contact?: boolean
}

interface Contact {
  id: string
  name: string
  room_id: string
}

interface Transaction {
  id: string
  type: string
  amount: number
  from_user_id: string | null
  to_user_id: string | null
  from_contact_id: string | null
  to_contact_id: string | null
  expense_splits?: { user_id: string | null; contact_id: string | null; amount: number }[]
}

interface Balance {
  [personId: string]: {
    [otherPersonId: string]: number
  }
}

export default function RoomPage({ params }: RoomPageProps) {
  const router = useRouter()
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [user, setUser] = useState<GuestUser | null>(null)
  const [room, setRoom] = useState<any>(null)
  const [members, setMembers] = useState<Profile[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [balances, setBalances] = useState<Balance>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    params.then(({ code }) => setRoomCode(code))
  }, [params])

  useEffect(() => {
    if (!roomCode) return

    const guestUser = getGuestUser()
    if (!guestUser) {
      router.push("/")
      return
    }
    setUser(guestUser)

    loadRoomData(roomCode, guestUser.id)
  }, [roomCode, router])

  const loadRoomData = async (code: string, userId: string) => {
    const supabase = createClient()

    // Get room by code
    const { data: roomData } = await supabase
      .from("rooms")
      .select("*")
      .eq("code", code)
      .single()

    if (!roomData) {
      setError("Room not found")
      setLoading(false)
      return
    }
    setRoom(roomData)

    // Check membership
    const { data: membership } = await supabase
      .from("room_members")
      .select("id")
      .eq("room_id", roomData.id)
      .eq("user_id", userId)
      .single()

    if (!membership) {
      setError("You are not a member of this room")
      setLoading(false)
      return
    }

    // Get all members with profiles
    const { data: membersData } = await supabase
      .from("room_members")
      .select("user_id")
      .eq("room_id", roomData.id)

    if (membersData) {
      const userIds = membersData.map(m => m.user_id)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds)
      
      setMembers(profiles || [])
    }

    // Get contacts (people added for tracking who aren't members)
    const { data: contactsData } = await supabase
      .from("contacts")
      .select("*")
      .eq("room_id", roomData.id)
    
    setContacts(contactsData || [])

    // Get transactions
    const { data: txData } = await supabase
      .from("transactions")
      .select("*")
      .eq("room_id", roomData.id)
      .order("created_at", { ascending: false })

    if (txData) {
      // Fetch related data for transactions
      const fromUserIds = [...new Set(txData.map(t => t.from_user_id).filter(Boolean))]
      const toUserIds = [...new Set(txData.map(t => t.to_user_id).filter(Boolean))]
      const allUserIds = [...new Set([...fromUserIds, ...toUserIds])]
      
      const { data: userProfiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", allUserIds.length > 0 ? allUserIds : ['00000000-0000-0000-0000-000000000000'])
      
      const profileMap = new Map(userProfiles?.map(p => [p.id, p]) || [])
      
      // Get expense splits
      const txIds = txData.map(t => t.id)
      const { data: splits } = await supabase
        .from("expense_splits")
        .select("*")
        .in("transaction_id", txIds.length > 0 ? txIds : ['00000000-0000-0000-0000-000000000000'])
      
      const splitsMap = new Map<string, any[]>()
      splits?.forEach(s => {
        if (!splitsMap.has(s.transaction_id)) {
          splitsMap.set(s.transaction_id, [])
        }
        splitsMap.get(s.transaction_id)!.push({
          ...s,
          profiles: s.user_id ? profileMap.get(s.user_id) : null,
          contact: s.contact_id ? contactsData?.find(c => c.id === s.contact_id) : null
        })
      })
      
      const enrichedTx = txData.map(tx => ({
        ...tx,
        from_user: tx.from_user_id ? profileMap.get(tx.from_user_id) : null,
        to_user: tx.to_user_id ? profileMap.get(tx.to_user_id) : null,
        from_contact: tx.from_contact_id ? contactsData?.find(c => c.id === tx.from_contact_id) : null,
        to_contact: tx.to_contact_id ? contactsData?.find(c => c.id === tx.to_contact_id) : null,
        creator: profileMap.get(tx.created_by),
        expense_splits: splitsMap.get(tx.id) || []
      }))
      
      setTransactions(enrichedTx)
    }

    // Get activity log
    const { data: activityData } = await supabase
      .from("activity_log")
      .select("*")
      .eq("room_id", roomData.id)
      .order("created_at", { ascending: false })
      .limit(50)

    if (activityData) {
      const userIds = [...new Set(activityData.map(a => a.user_id).filter(Boolean))]
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000'])
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
      
      setActivities(activityData.map(a => ({
        ...a,
        profiles: profileMap.get(a.user_id)
      })))
    }

    // Get messages
    const { data: msgData } = await supabase
      .from("messages")
      .select("*")
      .eq("room_id", roomData.id)
      .order("created_at", { ascending: true })
      .limit(100)

    if (msgData) {
      const userIds = [...new Set(msgData.map(m => m.user_id).filter(Boolean))]
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000'])
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
      
      setMessages(msgData.map(m => ({
        ...m,
        profiles: profileMap.get(m.user_id)
      })))
    }

    setLoading(false)
  }

  const handleContactAdded = () => {
    if (roomCode && user) {
      loadRoomData(roomCode, user.id)
    }
  }

  // Combine members and contacts for the "people" list
  const allPeople: Profile[] = [
    ...members,
    ...contacts.map(c => ({ id: c.id, display_name: c.name, is_contact: true }))
  ]

  // Calculate balances when members/contacts or transactions change
  useEffect(() => {
    if (allPeople.length > 0) {
      setBalances(calculateBalances(transactions, allPeople))
    }
  }, [members, contacts, transactions])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="text-destructive">{error}</div>
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    )
  }

  if (!room || !user) return null

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="font-semibold text-foreground">{room.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-mono">/{room.code}</span>
                <CopyCodeButton code={room.code} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <InviteDialog roomId={room.id} roomCode={room.code} />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push("/auth/signup")}
            >
              Sign Up
            </Button>
            <AddContactDialog 
              roomId={room.id} 
              userId={user.id}
              onContactAdded={handleContactAdded}
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{allPeople.length} people</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <RoomTabs
            roomId={room.id}
            userId={user.id}
            members={allPeople}
            contacts={contacts}
            transactions={transactions}
            activities={activities}
            messages={messages}
            balances={balances}
            onDataChange={handleContactAdded}
          />
        </div>
      </main>
    </div>
  )
}

function calculateBalances(transactions: Transaction[], people: Profile[]): Balance {
  const balances: Balance = {}

  // Initialize balances for all people
  people.forEach((person) => {
    balances[person.id] = {}
    people.forEach((other) => {
      if (other.id !== person.id) {
        balances[person.id][other.id] = 0
      }
    })
  })

  transactions.forEach((tx) => {
    const fromId = tx.from_user_id || tx.from_contact_id
    const toId = tx.to_user_id || tx.to_contact_id

    // Only store one direction: how much the "to" person owes the "from" person
    if ((tx.type === "loan" || tx.type === "expense") && fromId && toId) {
      if (balances[toId] && balances[toId][fromId] !== undefined) {
        balances[toId][fromId] += Number(tx.amount)
      }
    } else if (tx.type === "repayment" && fromId && toId) {
      // Repayment reduces the debt
      if (balances[toId] && balances[toId][fromId] !== undefined) {
        balances[toId][fromId] -= Number(tx.amount)
      }
    } else if (tx.type === "expense" && fromId && tx.expense_splits) {
      // For expense splits, each person who got a split owes the person who paid
      tx.expense_splits.forEach((split: any) => {
        const splitPersonId = split.user_id || split.contact_id
        if (splitPersonId && splitPersonId !== fromId) {
          if (balances[splitPersonId] && balances[splitPersonId][fromId] !== undefined) {
            balances[splitPersonId][fromId] += Number(split.amount)
          }
        }
      })
    }
  })

  return balances
}
