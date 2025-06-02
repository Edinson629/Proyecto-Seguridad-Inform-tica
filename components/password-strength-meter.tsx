"use client"

import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface PasswordStrengthMeterProps {
  score: number
  maxScore: number
  strength: string
}

export function PasswordStrengthMeter({ score, maxScore, strength }: PasswordStrengthMeterProps) {
  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case "very-weak":
        return "bg-red-500"
      case "weak":
        return "bg-orange-500"
      case "fair":
        return "bg-yellow-500"
      case "good":
        return "bg-blue-500"
      case "strong":
        return "bg-green-500"
      default:
        return "bg-gray-300"
    }
  }

  const getStrengthText = (strength: string) => {
    switch (strength) {
      case "very-weak":
        return "Muy débil"
      case "weak":
        return "Débil"
      case "fair":
        return "Regular"
      case "good":
        return "Buena"
      case "strong":
        return "Fuerte"
      default:
        return ""
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Fortaleza</span>
        <Badge variant="outline" className={`${getStrengthColor(strength)} text-white`}>
          {getStrengthText(strength)}
        </Badge>
      </div>
      <Progress value={(score / maxScore) * 100} className={`h-2 ${getStrengthColor(strength)}`} />
    </div>
  )
}
