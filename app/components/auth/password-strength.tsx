"use client"

import { useEffect, useState } from "react"
import { Check, X } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface PasswordRequirement {
  text: string
  regex: RegExp
  met: boolean
}

interface PasswordStrengthProps {
  password: string
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const [requirements, setRequirements] = useState<PasswordRequirement[]>([
    { text: "At least 8 characters", regex: /.{8,}/, met: false },
    { text: "At least one uppercase letter", regex: /[A-Z]/, met: false },
    { text: "At least one lowercase letter", regex: /[a-z]/, met: false },
    { text: "At least one number", regex: /[0-9]/, met: false },
    { text: "At least one special character", regex: /[^A-Za-z0-9]/, met: false },
  ])

  const [strength, setStrength] = useState(0)

  useEffect(() => {
    const updatedRequirements = requirements.map((req) => ({
      ...req,
      met: req.regex.test(password),
    }))

    setRequirements(updatedRequirements)

    // Calculate strength percentage
    const metCount = updatedRequirements.filter((req) => req.met).length
    setStrength((metCount / updatedRequirements.length) * 100)
  }, [password])

  // Determine the color based on strength
  const getStrengthColor = () => {
    if (strength <= 20) return "bg-destructive"
    if (strength <= 40) return "bg-destructive/80"
    if (strength <= 60) return "bg-yellow-500"
    if (strength <= 80) return "bg-yellow-400"
    return "bg-green-500"
  }

  return (
    <div className="space-y-2 mt-2">
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">Password strength</div>
        <Progress value={strength} className={`h-1.5 ${getStrengthColor()}`} />
      </div>
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">Requirements</div>
        <ul className="text-xs space-y-1">
          {requirements.map((req, index) => (
            <li key={index} className="flex items-center gap-2">
              {req.met ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className={req.met ? "text-foreground" : "text-muted-foreground"}>{req.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
} 