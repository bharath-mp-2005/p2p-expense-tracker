"use client"

import { formatDistanceToNow } from "date-fns"
import { ArrowDownRight, ArrowUpRight, Receipt } from "lucide-react"
import { AddTransactionDialog } from "./add-transaction-dialog"

interface Profile {
  id: string
  display_name: string | null
  is_contact?: boolean
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

interface TransactionsTabProps {
  roomId: string
  userId: string
  members: Profile[]
  transactions: Transaction[]
  onDataChange?: () => void
}

export function TransactionsTab({
  roomId,
  userId,
  members,
  transactions,
  onDataChange,
}: TransactionsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-foreground">Transactions</h2>
        <AddTransactionDialog 
          roomId={roomId} 
          userId={userId} 
          members={members}
          onTransactionAdded={onDataChange}
        />
      </div>

      {transactions.length === 0 ? (
        <div className="border border-dashed border-border rounded py-16 text-center">
          <p className="text-muted-foreground mb-4">No transactions yet</p>
          <p className="text-sm text-muted-foreground">
            Add a loan, expense, or repayment to get started
          </p>
        </div>
      ) : (
        <div className="border border-border rounded divide-y divide-border">
          {transactions.map((tx) => (
            <div key={tx.id} className="px-4 py-3 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {tx.type === "loan" && (
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  {tx.type === "repayment" && (
                    <ArrowDownRight className="h-4 w-4 text-green-500" />
                  )}
                  {tx.type === "expense" && (
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium text-foreground">
                    {tx.description || getDefaultDescription(tx)}
                  </span>
                </div>
                <span className="font-mono text-foreground">${Number(tx.amount).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{getTransactionSummary(tx)}</span>
                <span>
                  {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function getDefaultDescription(tx: Transaction): string {
  if (tx.type === "loan") return "Loan"
  if (tx.type === "repayment") return "Repayment"
  return "Expense"
}

function getTransactionSummary(tx: Transaction): string {
  const fromName = tx.from_user?.display_name || tx.from_contact?.name || "Someone"
  const toName = tx.to_user?.display_name || tx.to_contact?.name || "someone"
  
  if (tx.type === "loan") {
    return `${fromName} lent to ${toName}`
  }
  if (tx.type === "repayment") {
    return `${fromName} paid back ${toName}`
  }
  if (tx.type === "expense") {
    const splitCount = tx.expense_splits?.length || 0
    return `${fromName} paid, split ${splitCount} ways`
  }
  return ""
}
