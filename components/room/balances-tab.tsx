"use client"

import { ArrowRight } from "lucide-react"
import { AddTransactionDialog } from "./add-transaction-dialog"

interface Profile {
  id: string
  display_name: string | null
  is_contact?: boolean
}

interface Balance {
  [personId: string]: {
    [otherPersonId: string]: number
  }
}

interface BalancesTabProps {
  roomId: string
  userId: string
  members: Profile[]
  balances: Balance
  onDataChange?: () => void
}

export function BalancesTab({ roomId, userId, members, balances, onDataChange }: BalancesTabProps) {
  // Calculate net balances for each person
  const netBalances = members.map((person) => {
    let net = 0
    // positive values = they owe money, negative values would mean they're owed
    Object.entries(balances[person.id] || {}).forEach(([_, amount]) => {
      net += amount
    })
    return {
      person,
      net,
    }
  })

  // Get simplified debts (who owes whom)
  // balances[person][otherPerson] = amount that person owes otherPerson
  const debts: { from: Profile; to: Profile; amount: number }[] = []
  const processed = new Set<string>()

  members.forEach((person) => {
    Object.entries(balances[person.id] || {}).forEach(([otherId, amount]) => {
      const otherPerson = members.find(m => m.id === otherId)
      if (!otherPerson) return
      
      const key = [person.id, otherId].sort().join("-")
      if (processed.has(key)) return
      processed.add(key)

      if (amount > 0.01) {
        debts.push({ from: person, to: otherPerson, amount })
      }
    })
  })

  const getLabel = (person: Profile) => {
    const name = person.display_name || "Unknown"
    if (person.is_contact) return `${name} (contact)`
    if (person.id === userId) return `${name} (you)`
    return name
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-foreground">Balances</h2>
        <AddTransactionDialog 
          roomId={roomId} 
          userId={userId} 
          members={members} 
          onTransactionAdded={onDataChange}
        />
      </div>

      {/* Net balances summary */}
      <div className="border border-border rounded divide-y divide-border">
        {netBalances.map(({ person, net }) => (
          <div
            key={person.id}
            className="flex items-center justify-between px-4 py-3"
          >
            <span className={person.id === userId ? "font-medium text-foreground" : "text-foreground"}>
              {getLabel(person)}
            </span>
            <span
              className={
                net > 0
                  ? "text-destructive"
                  : net < 0
                  ? "text-green-500"
                  : "text-muted-foreground"
              }
            >
              {net > 0 ? "owes" : net < 0 ? "is owed" : ""}{" "}
              {net !== 0 && `$${Math.abs(net).toFixed(2)}`}
              {net === 0 && "settled up"}
            </span>
          </div>
        ))}
      </div>

      {/* Outstanding debts */}
      {debts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Outstanding payments
          </h3>
          <div className="border border-border rounded divide-y divide-border">
            {debts.map((debt, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <span>{debt.from.display_name}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span>{debt.to.display_name}</span>
                </div>
                <span className="font-mono text-foreground">${debt.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {debts.length === 0 && (
        <div className="border border-dashed border-border rounded py-8 text-center">
          <p className="text-muted-foreground">Everyone is settled up</p>
        </div>
      )}
    </div>
  )
}
