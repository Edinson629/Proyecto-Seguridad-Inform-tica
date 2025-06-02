"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock } from "lucide-react"
import { motion } from "framer-motion"

interface HistoryEntry {
  id: string
  date: Date
  strength: string
  wasBreached: boolean
  score: number
}

interface PasswordHistoryProps {
  history: HistoryEntry[]
}

export function PasswordHistory({ history }: PasswordHistoryProps) {
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>No hay historial de verificaciones</p>
        <p className="text-sm mt-2">Las verificaciones aparecerán aquí</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {history.map((entry, index) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <Card className="p-4 flex items-center justify-between border-blue-100 dark:border-blue-900 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              {entry.wasBreached ? (
                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                  <XCircle className="h-5 w-5" />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                  <CheckCircle className="h-5 w-5" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${getStrengthColor(entry.strength)} text-white`}>
                    {getStrengthText(entry.strength)}
                  </Badge>
                  {entry.wasBreached && (
                    <Badge variant="outline" className="bg-red-500 text-white">
                      Filtrada
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(entry.date)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-4 w-1 rounded-full ${i < entry.score ? getStrengthColor(entry.strength) : "bg-gray-200 dark:bg-gray-700"}`}
                ></div>
              ))}
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
