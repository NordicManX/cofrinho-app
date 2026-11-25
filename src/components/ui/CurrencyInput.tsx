'use client'

interface CurrencyInputProps {
  value: number
  onChange: (value: number) => void
  placeholder?: string
  required?: boolean
  className?: string
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = 'R$ 0,00',
  required = false,
  className = '',
}: CurrencyInputProps) {
  const formattedValue =
    value > 0
      ? new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(value)
      : ''

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '')
    const numericValue = digits ? parseInt(digits, 10) / 100 : 0
    onChange(numericValue)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      required={required}
      placeholder={placeholder}
      value={formattedValue}
      onChange={handleChange}
      className={`w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-400/50 tabular-nums ${className}`}
    />
  )
}