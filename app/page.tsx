"use client"

import { useState, useEffect } from "react"
import {
  Shield,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Lock,
  RefreshCw,
  Clock,
  Copy,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { PasswordGenerator } from "@/components/password-generator"
import { PasswordHistory } from "@/components/password-history"
import { ThemeToggle } from "@/components/theme-toggle"

interface PasswordAnalysis {
  score: number
  feedback: string[]
  strength: "very-weak" | "weak" | "fair" | "good" | "strong"
  checks: {
    length: boolean
    uppercase: boolean
    lowercase: boolean
    numbers: boolean
    symbols: boolean
    common: boolean
    sequences: boolean
    keyboard: boolean
  }
  crackTime: {
    value: number
    unit: string
    text: string
  }
}

interface BreachResult {
  isBreached: boolean
  count?: number
  loading: boolean
  error?: string
}

interface HistoryEntry {
  id: string
  date: Date
  strength: string
  wasBreached: boolean
  score: number
}

export default function PasswordAnalyzer() {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [analysis, setAnalysis] = useState<PasswordAnalysis | null>(null)
  const [breachResult, setBreachResult] = useState<BreachResult>({ isBreached: false, loading: false })
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [activeTab, setActiveTab] = useState("analyzer")
  const { toast } = useToast()

  useEffect(() => {
    // Cargar historial del localStorage
    const savedHistory = localStorage.getItem("passwordHistory")
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory)
        // Convertir strings de fecha a objetos Date
        const historyWithDates = parsed.map((entry: any) => ({
          ...entry,
          date: new Date(entry.date),
        }))
        setHistory(historyWithDates)
      } catch (e) {
        console.error("Error loading history:", e)
      }
    }
  }, [])

  const saveToHistory = (wasBreached: boolean) => {
    if (!analysis || !password) return

    const newEntry: HistoryEntry = {
      id: crypto.randomUUID(),
      date: new Date(),
      strength: analysis.strength,
      wasBreached,
      score: analysis.score,
    }

    const updatedHistory = [newEntry, ...history].slice(0, 10) // Mantener solo los últimos 10
    setHistory(updatedHistory)

    // Guardar en localStorage (sin contraseñas)
    localStorage.setItem("passwordHistory", JSON.stringify(updatedHistory))
  }

  const analyzePassword = (pwd: string): PasswordAnalysis => {
    const checks = {
      length: pwd.length >= 12,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      numbers: /\d/.test(pwd),
      symbols: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd),
      common: !isCommonPassword(pwd),
      sequences: !hasSequences(pwd),
      keyboard: !hasKeyboardPatterns(pwd),
    }

    const score = Object.values(checks).filter(Boolean).length
    const feedback: string[] = []

    if (!checks.length) feedback.push("Usa al menos 12 caracteres")
    if (!checks.uppercase) feedback.push("Incluye letras mayúsculas")
    if (!checks.lowercase) feedback.push("Incluye letras minúsculas")
    if (!checks.numbers) feedback.push("Incluye números")
    if (!checks.symbols) feedback.push("Incluye símbolos especiales")
    if (!checks.common) feedback.push("Evita contraseñas comunes")
    if (!checks.sequences) feedback.push("Evita secuencias como '123' o 'abc'")
    if (!checks.keyboard) feedback.push("Evita patrones de teclado como 'qwerty'")

    let strength: PasswordAnalysis["strength"]
    if (score <= 3) strength = "very-weak"
    else if (score <= 4) strength = "weak"
    else if (score <= 5) strength = "fair"
    else if (score <= 7) strength = "good"
    else strength = "strong"

    // Calcular tiempo estimado para descifrar
    const crackTime = estimateCrackTime(pwd, score)

    return { score, feedback, strength, checks, crackTime }
  }

  const estimateCrackTime = (pwd: string, score: number) => {
    // Cálculo simplificado del tiempo para descifrar
    const length = pwd.length
    const complexity = score / 8 // Normalizado entre 0 y 1

    // Base: 10^(length * complexity) milisegundos
    const milliseconds = Math.pow(10, length * complexity * 0.6)

    let value: number
    let unit: string
    let text: string

    if (milliseconds < 1000) {
      value = milliseconds
      unit = "ms"
      text = "instantáneo"
    } else if (milliseconds < 60000) {
      value = milliseconds / 1000
      unit = "segundos"
      text = "muy rápido"
    } else if (milliseconds < 3600000) {
      value = milliseconds / 60000
      unit = "minutos"
      text = "rápido"
    } else if (milliseconds < 86400000) {
      value = milliseconds / 3600000
      unit = "horas"
      text = "moderado"
    } else if (milliseconds < 2592000000) {
      value = milliseconds / 86400000
      unit = "días"
      text = "lento"
    } else if (milliseconds < 31536000000) {
      value = milliseconds / 2592000000
      unit = "meses"
      text = "muy lento"
    } else if (milliseconds < 315360000000) {
      value = milliseconds / 31536000000
      unit = "años"
      text = "extremadamente lento"
    } else if (milliseconds < 3153600000000) {
      value = milliseconds / 315360000000
      unit = "décadas"
      text = "prácticamente imposible"
    } else if (milliseconds < 31536000000000) {
      value = milliseconds / 3153600000000
      unit = "siglos"
      text = "imposible"
    } else {
      value = milliseconds / 31536000000000
      unit = "milenios"
      text = "imposible"
    }

    return { value: Number.parseFloat(value.toFixed(1)), unit, text }
  }

  const isCommonPassword = (pwd: string): boolean => {
    const commonPasswords = [
      "password",
      "123456",
      "123456789",
      "qwerty",
      "abc123",
      "password123",
      "admin",
      "letmein",
      "welcome",
      "monkey",
      "1234567890",
      "password1",
      "contraseña",
      "12345678",
      "111111",
      "123123",
      "dragon",
      "baseball",
      "football",
      "master",
      "michael",
      "shadow",
      "666666",
      "superman",
      "7777777",
      "fuckyou",
      "121212",
      "000000",
      "qazwsx",
      "123qwe",
      "killer",
      "trustno1",
      "jordan",
      "jennifer",
      "hunter",
      "buster",
      "soccer",
      "harley",
      "batman",
      "andrew",
      "tigger",
      "sunshine",
      "iloveyou",
      "2000",
      "charlie",
      "robert",
      "thomas",
      "hockey",
      "ranger",
      "daniel",
      "starwars",
      "klaster",
      "112233",
      "george",
      "computer",
      "michelle",
      "jessica",
      "pepper",
      "1111",
      "zxcvbn",
      "555555",
      "11111111",
      "131313",
      "freedom",
      "777777",
      "pass",
      "maggie",
      "159753",
      "aaaaaa",
      "ginger",
      "princess",
      "joshua",
      "cheese",
      "amanda",
      "summer",
      "love",
      "ashley",
      "nicole",
      "chelsea",
      "biteme",
      "matthew",
      "access",
      "yankees",
      "dallas",
      "austin",
      "thunder",
      "taylor",
      "matrix",
      "mobilemail",
      "mom",
      "monitor",
      "monitoring",
      "montana",
      "moon",
      "moscow",
    ]
    return commonPasswords.includes(pwd.toLowerCase())
  }

  const hasSequences = (pwd: string): boolean => {
    const sequences = ["abcdefghijklmnopqrstuvwxyz", "zyxwvutsrqponmlkjihgfedcba", "0123456789", "9876543210"]

    const lowercasePwd = pwd.toLowerCase()

    for (const seq of sequences) {
      for (let i = 0; i < seq.length - 2; i++) {
        const triplet = seq.substring(i, i + 3)
        if (lowercasePwd.includes(triplet)) {
          return true
        }
      }
    }

    return false
  }

  const hasKeyboardPatterns = (pwd: string): boolean => {
    const keyboardRows = ["qwertyuiop", "asdfghjkl", "zxcvbnm", "1234567890"]

    const lowercasePwd = pwd.toLowerCase()

    for (const row of keyboardRows) {
      for (let i = 0; i < row.length - 2; i++) {
        const triplet = row.substring(i, i + 3)
        if (lowercasePwd.includes(triplet)) {
          return true
        }
      }
    }

    return false
  }

  const checkHaveIBeenPwned = async (pwd: string) => {
    if (!pwd) return

    setBreachResult({ isBreached: false, loading: true })

    try {
      // Usar SHA-1 hash y k-anonymity para mayor seguridad
      const encoder = new TextEncoder()
      const data = encoder.encode(pwd)
      const hashBuffer = await crypto.subtle.digest("SHA-1", data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase()

      const prefix = hashHex.substring(0, 5)
      const suffix = hashHex.substring(5)

      const response = await fetch(`/api/check-password?prefix=${prefix}`)
      const data_result = await response.text()

      const lines = data_result.split("\n")
      const found = lines.find((line) => line.startsWith(suffix))

      if (found) {
        const count = Number.parseInt(found.split(":")[1])
        setBreachResult({ isBreached: true, count, loading: false })
        saveToHistory(true)
      } else {
        setBreachResult({ isBreached: false, loading: false })
        saveToHistory(false)
      }
    } catch (error) {
      setBreachResult({
        isBreached: false,
        loading: false,
        error: "Error al consultar la base de datos de filtraciones",
      })
    }
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    if (value) {
      setAnalysis(analyzePassword(value))
    } else {
      setAnalysis(null)
      setBreachResult({ isBreached: false, loading: false })
    }
  }

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copiado al portapapeles",
        description: "La contraseña ha sido copiada",
      })
    })
  }

  const handleSetGeneratedPassword = (generatedPassword: string) => {
    setPassword(generatedPassword)
    setAnalysis(analyzePassword(generatedPassword))
    setShowPassword(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-950 p-4 transition-colors duration-300">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <motion.div
            className="flex items-center justify-center gap-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Shield className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">SECUREPASS ANALYZER</h1>
            <div className="absolute right-4 top-4">
              <ThemeToggle />
            </div>
          </motion.div>
          <motion.p
            className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Verifica si tu contraseña ha sido filtrada y analiza su fortaleza de forma segura. Todas las verificaciones
            se realizan localmente para garantizar tu privacidad.
          </motion.p>
        </div>

        {/* Main Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Tabs defaultValue="analyzer" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 max-w-md mx-auto mb-4">
              <TabsTrigger value="analyzer" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Analizador</span>
              </TabsTrigger>
              <TabsTrigger value="generator" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                <span>Generador</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Historial</span>
              </TabsTrigger>
            </TabsList>

            {/* Analyzer Tab */}
            <TabsContent value="analyzer">
              <Card className="w-full max-w-3xl mx-auto shadow-lg border-blue-100 dark:border-blue-900">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-t-lg border-b border-blue-100 dark:border-blue-900">
                  <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Lock className="h-5 w-5" />
                    Análisis de Contraseña
                  </CardTitle>
                  <CardDescription className="text-blue-600/80 dark:text-blue-400/80">
                    Ingresa tu contraseña para verificar si ha sido comprometida en filtraciones de datos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {/* Password Input */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4" /> Contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        placeholder="Ingresa tu contraseña..."
                        className="pr-20 border-blue-200 dark:border-blue-800 focus:border-blue-400 focus:ring-blue-400"
                      />
                      <div className="absolute right-0 top-0 h-full flex">
                        {password && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-full px-2 hover:bg-transparent text-gray-500"
                            onClick={() => copyToClipboard(password)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-full px-2 hover:bg-transparent text-gray-500"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Check Button */}
                  {password && (
                    <Button
                      onClick={() => checkHaveIBeenPwned(password)}
                      disabled={breachResult.loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {breachResult.loading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Verificando...
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          Verificar Filtraciones
                        </>
                      )}
                    </Button>
                  )}

                  {/* Breach Results */}
                  {password && !breachResult.loading && (
                    <motion.div
                      className="space-y-4"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.3 }}
                    >
                      {breachResult.error ? (
                        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/20">
                          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          <AlertDescription className="text-amber-800 dark:text-amber-300">
                            {breachResult.error}
                          </AlertDescription>
                        </Alert>
                      ) : breachResult.isBreached ? (
                        <Alert className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20">
                          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          <AlertDescription className="text-red-800 dark:text-red-300">
                            <strong>¡Contraseña comprometida!</strong> Esta contraseña ha aparecido en{" "}
                            <strong>{breachResult.count?.toLocaleString()}</strong> filtraciones de datos. Te
                            recomendamos cambiarla inmediatamente.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20">
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <AlertDescription className="text-green-800 dark:text-green-300">
                            <strong>¡Buenas noticias!</strong> Esta contraseña no ha sido encontrada en filtraciones
                            conocidas.
                          </AlertDescription>
                        </Alert>
                      )}
                    </motion.div>
                  )}

                  {/* Password Strength Analysis */}
                  {analysis && (
                    <motion.div
                      className="space-y-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Fortaleza de la contraseña</Label>
                            <Badge variant="outline" className={`${getStrengthColor(analysis.strength)} text-white`}>
                              {getStrengthText(analysis.strength)}
                            </Badge>
                          </div>
                          <Progress
                            value={(analysis.score / 8) * 100}
                            className={`h-2 ${getStrengthColor(analysis.strength)}`}
                          />
                        </div>

                        {/* Tiempo estimado para descifrar */}
                        <div className="bg-blue-50 dark:bg-blue-950/50 p-3 rounded-lg border border-blue-100 dark:border-blue-900">
                          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 mb-1">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">Tiempo estimado para descifrar:</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                              {analysis.crackTime.value} {analysis.crackTime.unit}
                            </span>
                            <Badge
                              className={
                                analysis.crackTime.text === "instantáneo" || analysis.crackTime.text === "muy rápido"
                                  ? "bg-red-500"
                                  : analysis.crackTime.text === "rápido"
                                    ? "bg-orange-500"
                                    : analysis.crackTime.text === "moderado"
                                      ? "bg-yellow-500"
                                      : analysis.crackTime.text === "lento"
                                        ? "bg-blue-500"
                                        : "bg-green-500"
                              }
                            >
                              {analysis.crackTime.text}
                            </Badge>
                          </div>
                        </div>

                        {/* Security Checks */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={`flex items-center gap-2 p-2 rounded-md ${analysis.checks.length ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300" : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"}`}
                                >
                                  {analysis.checks.length ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <XCircle className="h-4 w-4" />
                                  )}
                                  12+ caracteres
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Las contraseñas largas son más difíciles de descifrar</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={`flex items-center gap-2 p-2 rounded-md ${analysis.checks.uppercase ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300" : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"}`}
                                >
                                  {analysis.checks.uppercase ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <XCircle className="h-4 w-4" />
                                  )}
                                  Mayúsculas
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Incluir letras mayúsculas aumenta la complejidad</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={`flex items-center gap-2 p-2 rounded-md ${analysis.checks.lowercase ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300" : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"}`}
                                >
                                  {analysis.checks.lowercase ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <XCircle className="h-4 w-4" />
                                  )}
                                  Minúsculas
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Incluir letras minúsculas es esencial</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={`flex items-center gap-2 p-2 rounded-md ${analysis.checks.numbers ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300" : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"}`}
                                >
                                  {analysis.checks.numbers ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <XCircle className="h-4 w-4" />
                                  )}
                                  Números
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Los números añaden complejidad a tu contraseña</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={`flex items-center gap-2 p-2 rounded-md ${analysis.checks.symbols ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300" : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"}`}
                                >
                                  {analysis.checks.symbols ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <XCircle className="h-4 w-4" />
                                  )}
                                  Símbolos
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Los símbolos especiales hacen tu contraseña más segura</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={`flex items-center gap-2 p-2 rounded-md ${analysis.checks.common ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300" : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"}`}
                                >
                                  {analysis.checks.common ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <XCircle className="h-4 w-4" />
                                  )}
                                  No común
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Evita contraseñas que aparecen en listas comunes</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={`flex items-center gap-2 p-2 rounded-md ${analysis.checks.sequences ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300" : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"}`}
                                >
                                  {analysis.checks.sequences ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <XCircle className="h-4 w-4" />
                                  )}
                                  Sin secuencias
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Evita secuencias como "123" o "abc"</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={`flex items-center gap-2 p-2 rounded-md ${analysis.checks.keyboard ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300" : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"}`}
                                >
                                  {analysis.checks.keyboard ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <XCircle className="h-4 w-4" />
                                  )}
                                  Sin patrones
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Evita patrones de teclado como "qwerty"</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        {/* Feedback */}
                        {analysis.feedback.length > 0 && (
                          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/20">
                            <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            <AlertDescription className="text-amber-800 dark:text-amber-300">
                              <strong>Sugerencias para mejorar:</strong>
                              <ul className="mt-1 list-disc list-inside space-y-1">
                                {analysis.feedback.map((tip, index) => (
                                  <li key={index}>{tip}</li>
                                ))}
                              </ul>
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </motion.div>
                  )}
                </CardContent>
                <CardFooter className="bg-blue-50/50 dark:bg-blue-950/30 border-t border-blue-100 dark:border-blue-900 flex justify-between items-center">
                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70 flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Todas las verificaciones se realizan localmente en el navegador
                  </p>
                  {password && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab("generator")}
                      className="text-xs border-blue-200 dark:border-blue-800"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Generar nueva
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Generator Tab */}
            <TabsContent value="generator">
              <Card className="w-full max-w-3xl mx-auto shadow-lg border-blue-100 dark:border-blue-900">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-t-lg border-b border-blue-100 dark:border-blue-900">
                  <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <RefreshCw className="h-5 w-5" />
                    Generador de Contraseñas
                  </CardTitle>
                  <CardDescription className="text-blue-600/80 dark:text-blue-400/80">
                    Crea contraseñas seguras y personalizadas
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <PasswordGenerator onPasswordGenerated={handleSetGeneratedPassword} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <Card className="w-full max-w-3xl mx-auto shadow-lg border-blue-100 dark:border-blue-900">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-t-lg border-b border-blue-100 dark:border-blue-900">
                  <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Clock className="h-5 w-5" />
                    Historial de Verificaciones
                  </CardTitle>
                  <CardDescription className="text-blue-600/80 dark:text-blue-400/80">
                    Últimas 10 contraseñas verificadas (no se almacenan las contraseñas)
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <PasswordHistory history={history} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Security Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="max-w-3xl mx-auto shadow-lg border-blue-100 dark:border-blue-900">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-t-lg border-b border-blue-100 dark:border-blue-900">
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Info className="h-5 w-5" />
                Consejos de Seguridad
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Mejores Prácticas
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      Usa contraseñas únicas para cada cuenta importante
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      Considera usar un gestor de contraseñas
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      Activa la autenticación de dos factores cuando sea posible
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      Cambia contraseñas comprometidas inmediatamente
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h3 className="font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Privacidad y Seguridad
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      Tu contraseña no se almacena ni se envía completa a ningún servidor
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      Utilizamos k-anonymity para consultar filtraciones de forma segura
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      El historial solo guarda la fortaleza y si fue filtrada, nunca la contraseña
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      Todo el análisis se realiza localmente en tu navegador
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
