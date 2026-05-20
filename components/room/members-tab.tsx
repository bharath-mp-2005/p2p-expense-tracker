"use client"

import { User, UserPlus } from "lucide-react"

interface Profile {
  id: string
  display_name: string | null
  email?: string | null
  is_contact?: boolean
}

interface MembersTabProps {
  members: Profile[]
  roomId: string
  userId: string
}

export function MembersTab({ members, roomId, userId }: MembersTabProps) {
  const actualMembers = members.filter(m => !m.is_contact)
  const contacts = members.filter(m => m.is_contact)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-foreground">People</h2>
        <span className="text-sm text-muted-foreground">
          {members.length} {members.length !== 1 ? "people" : "person"}
        </span>
      </div>

      {/* Actual members */}
      {actualMembers.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <User className="h-4 w-4" />
            Members
          </h3>
          <div className="border border-border rounded divide-y divide-border">
            {actualMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-foreground">
                    {(member.display_name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {member.display_name || "Unknown"}
                      {member.id === userId && (
                        <span className="text-muted-foreground font-normal"> (you)</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contacts (people added for tracking) */}
      {contacts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Contacts
          </h3>
          <div className="border border-border rounded divide-y divide-border">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted/50 border border-dashed border-border flex items-center justify-center text-sm font-medium text-muted-foreground">
                    {(contact.display_name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-foreground">
                      {contact.display_name || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">Added for tracking</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
