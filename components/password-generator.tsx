"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Copy, RefreshCw, Check, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PasswordGeneratorProps {
  onPasswordGenerated: (password: string) => void
}

export function PasswordGenerator({ onPasswordGenerated }: PasswordGeneratorProps) {
  const [length, setLength] = useState(16)
  const [includeUppercase, setIncludeUppercase] = useState(true)
  const [includeLowercase, setIncludeLowercase] = useState(true)
  const [includeNumbers, setIncludeNumbers] = useState(true)
  const [includeSymbols, setIncludeSymbols] = useState(true)
  const [excludeSimilar, setExcludeSimilar] = useState(false)
  const [password, setPassword] = useState("")
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const generatePassword = () => {
    let charset = ""
    const uppercaseChars = "ABCDEFGHJKLMNPQRSTUVWXYZ"
    const lowercaseChars = "abcdefghijkmnopqrstuvwxyz"
    const numberChars = "23456789"
    const symbolChars = "!@#$%^&*()_+~`|}{[]:;?><,./-="

    // Caracteres similares excluidos: O, 0, I, l, 1
    const similarUppercase = "O"
    const similarLowercase = "il"
    const similarNumbers = "01"

    if (includeLowercase) {
      charset += excludeSimilar ? lowercaseChars : lowercaseChars + similarLowercase
    }

    if (includeUppercase) {
      charset += excludeSimilar ? uppercaseChars : uppercaseChars + similarUppercase
    }

    if (includeNumbers) {
      charset += excludeSimilar ? numberChars : numberChars + similarNumbers
    }

    if (includeSymbols) {
      charset += symbolChars
    }

    if (charset === "") {
      charset = lowercaseChars
    }

    let result = ""
    const charactersLength = charset.length

    // Asegurar que al menos un carácter de cada tipo seleccionado esté presente
    if (includeUppercase && uppercaseChars.length > 0) {
      result += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length))
    }

    if (includeLowercase && lowercaseChars.length > 0) {
      result += lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length))
    }

    if (includeNumbers && numberChars.length > 0) {
      result += numberChars.charAt(Math.floor(Math.random() * numberChars.length))
    }

    if (includeSymbols && symbolChars.length > 0) {
      result += symbolChars.charAt(Math.floor(Math.random() * symbolChars.length))
    }

    // Completar el resto de la contraseña
    for (let i = result.length; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charactersLength))
    }

    // Mezclar los caracteres para que no siempre sigan el mismo patrón
    result = result
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("")

    setPassword(result)
    return result
  }

  const handleGenerateClick = () => {
    const newPassword = generatePassword()
    setCopied(false)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password)
    setCopied(true)
    toast({
      title: "Copiado al portapapeles",
      description: "La contraseña ha sido copiada",
    })

    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  const usePassword = () => {
    onPasswordGenerated(password)
  }

  return (
    <div className="space-y-6">
      {/* Password Output */}
      <div className="space-y-2">
        <Label htmlFor="generated-password">Contraseña Generada</Label>
        <div className="relative">
          <Input
            id="generated-password"
            value={password}
            readOnly
            className="pr-24 font-mono text-base bg-blue-50/50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
            placeholder="Haz clic en Generar"
          />
          <div className="absolute right-0 top-0 h-full flex">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-full px-2 hover:bg-transparent text-gray-500"
              onClick={copyToClipboard}
              disabled={!password}
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Length Slider */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Longitud: {length} caracteres</Label>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {length < 8 ? "Débil" : length < 12 ? "Buena" : length < 16 ? "Fuerte" : "Muy fuerte"}
          </span>
        </div>
        <Slider
          value={[length]}
          min={6}
          max={32}
          step={1}
          onValueChange={(value) => setLength(value[0])}
          className="py-4"
        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>6</span>
          <span>12</span>
          <span>20</span>
          <span>32</span>
        </div>
      </div>

      {/* Character Options */}
      <div className="space-y-4 bg-blue-50/50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-100 dark:border-blue-900">
        <h3 className="font-medium text-sm text-blue-700 dark:text-blue-300">Incluir caracteres:</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="uppercase" className="cursor-pointer flex items-center gap-2">
              <span>Mayúsculas (A-Z)</span>
            </Label>
            <Switch id="uppercase" checked={includeUppercase} onCheckedChange={setIncludeUppercase} />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="lowercase" className="cursor-pointer flex items-center gap-2">
              <span>Minúsculas (a-z)</span>
            </Label>
            <Switch id="lowercase" checked={includeLowercase} onCheckedChange={setIncludeLowercase} />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="numbers" className="cursor-pointer flex items-center gap-2">
              <span>Números (0-9)</span>
            </Label>
            <Switch id="numbers" checked={includeNumbers} onCheckedChange={setIncludeNumbers} />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="symbols" className="cursor-pointer flex items-center gap-2">
              <span>Símbolos (!@#$%)</span>
            </Label>
            <Switch id="symbols" checked={includeSymbols} onCheckedChange={setIncludeSymbols} />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="exclude-similar" className="cursor-pointer flex items-center gap-2">
              <span>Excluir caracteres similares (O, 0, I, l, 1)</span>
            </Label>
            <Switch id="exclude-similar" checked={excludeSimilar} onCheckedChange={setExcludeSimilar} />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleGenerateClick} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
          <RefreshCw className="h-4 w-4 mr-2" />
          Generar Contraseña
        </Button>

        <Button
          onClick={usePassword}
          disabled={!password}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          <Zap className="h-4 w-4 mr-2" />
          Usar Esta Contraseña
        </Button>
      </div>
    </div>
  )
}
