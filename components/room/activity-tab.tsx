"use client"

import { formatDistanceToNow } from "date-fns"

interface Activity {
  id: string
  action: string
  details: Record<string, unknown> | null
  created_at: string
  profiles: { id: string; display_name: string | null } | null
}

interface ActivityTabProps {
  activities: Activity[]
}

export function ActivityTab({ activities }: ActivityTabProps) {
  if (activities.length === 0) {
    return (
      <div className="border border-dashed border-border rounded py-16 text-center">
        <p className="text-muted-foreground">No activity yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Activity</h2>
      <div className="border border-border rounded divide-y divide-border">
        {activities.map((activity) => (
          <div key={activity.id} className="px-4 py-3 flex items-center justify-between">
            <span className="text-sm">
              {formatActivity(activity)}
            </span>
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatActivity(activity: Activity): string {
  const name = activity.profiles?.display_name || "Someone"
  const details = activity.details || {}

  switch (activity.action) {
    case "room_created":
      return `${name} created this room`
    case "member_joined":
      return `${name} joined the room`
    case "member_left":
      return `${name} left the room`
    case "transaction_created":
      const type = details.type as string
      const amount = details.amount as number
      if (type === "loan") {
        return `${name} recorded a loan of $${Number(amount).toFixed(2)}`
      }
      if (type === "repayment") {
        return `${name} recorded a repayment of $${Number(amount).toFixed(2)}`
      }
      return `${name} recorded an expense of $${Number(amount).toFixed(2)}`
    default:
      return `${name} performed an action`
  }
}
