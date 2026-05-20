"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BalancesTab } from "./balances-tab"
import { TransactionsTab } from "./transactions-tab"
import { ActivityTab } from "./activity-tab"
import { MembersTab } from "./members-tab"
import { ChatTab } from "./chat-tab"

interface Profile {
  id: string
  display_name: string | null
  email?: string | null
  is_contact?: boolean
}

interface Contact {
  id: string
  name: string
  room_id: string
}

interface ExpenseSplit {
  id: string
  user_id: string | null
  contact_id: string | null
  amount: number
  profiles: { id: string; display_name: string | null } | null
  contact: { id: string; name: string } | null
}

interface Transaction {
  id: string
  type: string
  description: string | null
  amount: number
  currency: string
  from_user_id: string | null
  to_user_id: string | null
  from_contact_id: string | null
  to_contact_id: string | null
  created_by: string | null
  created_at: string
  from_user: { id: string; display_name: string | null } | null
  to_user: { id: string; display_name: string | null } | null
  from_contact: { id: string; name: string } | null
  to_contact: { id: string; name: string } | null
  creator: { id: string; display_name: string | null } | null
  expense_splits: ExpenseSplit[]
}

interface Activity {
  id: string
  action: string
  details: Record<string, unknown> | null
  created_at: string
  profiles: { id: string; display_name: string | null } | null
}

interface Message {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: { id: string; display_name: string | null } | null
}

interface Balance {
  [personId: string]: {
    [otherPersonId: string]: number
  }
}

interface RoomTabsProps {
  roomId: string
  userId: string
  members: Profile[]
  contacts?: Contact[]
  transactions: Transaction[]
  activities: Activity[]
  messages: Message[]
  balances: Balance
  onDataChange?: () => void
}

export function RoomTabs({
  roomId,
  userId,
  members,
  contacts = [],
  transactions,
  activities,
  messages,
  balances,
  onDataChange,
}: RoomTabsProps) {
  return (
    <Tabs defaultValue="balances" className="space-y-6">
      <TabsList>
        <TabsTrigger value="balances">Balances</TabsTrigger>
        <TabsTrigger value="transactions">Transactions</TabsTrigger>
        <TabsTrigger value="chat">Chat</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="people">People</TabsTrigger>
      </TabsList>

      <TabsContent value="balances">
        <BalancesTab
          roomId={roomId}
          userId={userId}
          members={members}
          balances={balances}
          onDataChange={onDataChange}
        />
      </TabsContent>

      <TabsContent value="transactions">
        <TransactionsTab
          roomId={roomId}
          userId={userId}
          members={members}
          transactions={transactions}
          onDataChange={onDataChange}
        />
      </TabsContent>

      <TabsContent value="chat">
        <ChatTab roomId={roomId} userId={userId} initialMessages={messages} />
      </TabsContent>

      <TabsContent value="activity">
        <ActivityTab activities={activities} />
      </TabsContent>

      <TabsContent value="people">
        <MembersTab members={members} roomId={roomId} userId={userId} />
      </TabsContent>
    </Tabs>
  )
}
