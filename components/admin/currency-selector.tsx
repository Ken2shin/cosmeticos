"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Currency {
  code: string
  name: string
  symbol: string
  flag_emoji: string
}

interface CurrencySelectorProps {
  value: string
  onValueChange: (value: string) => void
}

export function CurrencySelector({ value, onValueChange }: CurrencySelectorProps) {
  const [currencies, setCurrencies] = useState<Currency[]>([])

  useEffect(() => {
    fetchCurrencies()
  }, [])

  const fetchCurrencies = async () => {
    try {
      const response = await fetch("/api/currencies")
      const data = await response.json()
      setCurrencies(data)
    } catch (error) {
      console.error("Error fetching currencies:", error)
    }
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-rose-500">
        <SelectValue placeholder="Seleccionar moneda" />
      </SelectTrigger>
      <SelectContent>
        {currencies.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{currency.flag_emoji}</span>
              <span>
                {currency.symbol} - {currency.name}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
