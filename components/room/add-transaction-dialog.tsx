"use client"

import { useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"

interface Profile {
  id: string
  display_name: string | null
  is_contact?: boolean
}

interface AddTransactionDialogProps {
  roomId: string
  userId: string
  members: Profile[]
  onTransactionAdded?: () => void
}

export function AddTransactionDialog({
  roomId,
  userId,
  members,
  onTransactionAdded,
}: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<"loan" | "repayment" | "expense">("loan")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [fromPersonId, setFromPersonId] = useState(userId)
  const [toPersonId, setToPersonId] = useState("")
  const [interestRate, setInterestRate] = useState("")
  const [splitMembers, setSplitMembers] = useState<string[]>(members.map((m) => m.id))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setType("loan")
    setAmount("")
    setDescription("")
    setFromPersonId(userId)
    setToPersonId("")
    setInterestRate("")
    setSplitMembers(members.map((m) => m.id))
    setError(null)
  }

  // Helper to check if an ID belongs to a contact (not a member)
  const isContact = (personId: string) => {
    return members.find(m => m.id === personId)?.is_contact === true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const amountNum = parseFloat(amount)

    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount")
      setLoading(false)
      return
    }

    // Create the transaction
    const transactionData: {
      room_id: string
      type: string
      description: string | null
      amount: number
      interest_rate: number
      from_user_id: string | null
      to_user_id: string | null
      from_contact_id: string | null
      to_contact_id: string | null
      created_by: string
    } = {
      room_id: roomId,
      type,
      description: description || null,
      amount: amountNum,
      interest_rate: type === "loan" ? parseFloat(interestRate) || 0 : 0,
      from_user_id: null,
      to_user_id: null,
      from_contact_id: null,
      to_contact_id: null,
      created_by: userId,
    }

    if (type === "loan" || type === "repayment") {
      if (!toPersonId) {
        setError("Please select who this is with")
        setLoading(false)
        return
      }
      // Set from person (user or contact)
      if (isContact(fromPersonId)) {
        transactionData.from_contact_id = fromPersonId
      } else {
        transactionData.from_user_id = fromPersonId
      }
      // Set to person (user or contact)
      if (isContact(toPersonId)) {
        transactionData.to_contact_id = toPersonId
      } else {
        transactionData.to_user_id = toPersonId
      }
    } else if (type === "expense") {
      if (splitMembers.length === 0) {
        setError("Please select at least one person to split with")
        setLoading(false)
        return
      }
      // Set from person (user or contact)
      if (isContact(fromPersonId)) {
        transactionData.from_contact_id = fromPersonId
      } else {
        transactionData.from_user_id = fromPersonId
      }
    }

    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert(transactionData)
      .select()
      .single()

    if (txError) {
      setError(txError.message)
      setLoading(false)
      return
    }

    // Create expense splits if this is an expense
    if (type === "expense" && transaction) {
      const splitAmount = amountNum / splitMembers.length
      const splits = splitMembers.map((personId) => {
        const personIsContact = isContact(personId)
        return {
          transaction_id: transaction.id,
          user_id: personIsContact ? null : personId,
          contact_id: personIsContact ? personId : null,
          amount: splitAmount,
        }
      })

      const { error: splitError } = await supabase
        .from("expense_splits")
        .insert(splits)

      if (splitError) {
        setError(splitError.message)
        setLoading(false)
        return
      }
    }

    // Log activity
    await supabase.from("activity_log").insert({
      room_id: roomId,
      user_id: userId,
      action: "transaction_created",
      details: { type, amount: amountNum },
    })

    setOpen(false)
    resetForm()
    onTransactionAdded?.()
  }

  const toggleSplitMember = (personId: string) => {
    setSplitMembers((prev) =>
      prev.includes(personId)
        ? prev.filter((id) => id !== personId)
        : [...prev, personId]
    )
  }

  const getPersonLabel = (person: Profile) => {
    const name = person.display_name || "Unknown"
    const suffix = person.is_contact ? " (contact)" : person.id === userId ? " (you)" : ""
    return `${name}${suffix}`
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (!newOpen) resetForm()
    }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add transaction
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add transaction</DialogTitle>
          <DialogDescription>
            Record a loan, expense, or repayment.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="loan">Loan</SelectItem>
                <SelectItem value="repayment">Repayment</SelectItem>
                <SelectItem value="expense">Shared Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="pl-7"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              placeholder="e.g., Dinner, Uber ride"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {(type === "loan" || type === "repayment") && (
            <>
              <div className="space-y-2">
                <Label>
                  {type === "loan" ? "Lender" : "Who paid"}
                </Label>
                <Select value={fromPersonId} onValueChange={setFromPersonId}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {getPersonLabel(person)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  {type === "loan" ? "Borrower" : "Who received"}
                </Label>
                <Select value={toPersonId} onValueChange={setToPersonId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a person" />
                  </SelectTrigger>
                  <SelectContent>
                    {members
                      .filter((p) => p.id !== fromPersonId)
                      .map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {getPersonLabel(person)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {type === "loan" && (
                <div className="space-y-2">
                  <Label htmlFor="interest">Interest Rate (% per year) - Optional</Label>
                  <div className="relative">
                    <Input
                      id="interest"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="0"
                      className="pr-7"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {type === "expense" && (
            <>
              <div className="space-y-2">
                <Label>Who paid</Label>
                <Select value={fromPersonId} onValueChange={setFromPersonId}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {getPersonLabel(person)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Split between</Label>
                <div className="border border-border rounded p-3 space-y-2 max-h-48 overflow-y-auto">
                  {members.map((person) => (
                    <div key={person.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`split-${person.id}`}
                        checked={splitMembers.includes(person.id)}
                        onCheckedChange={() => toggleSplitMember(person.id)}
                      />
                      <label
                        htmlFor={`split-${person.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {getPersonLabel(person)}
                      </label>
                    </div>
                  ))}
                </div>
                {amount && splitMembers.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    ${(parseFloat(amount) / splitMembers.length).toFixed(2)} per person
                  </p>
                )}
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
