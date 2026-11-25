'use client'

import { useMemo, useState } from 'react'
import { PiggyBank } from '@/types/piggy'
import { calculatePlanningMetrics } from '@/utils/piggy-helpers'
import { addDays, differenceInDays, format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarClock, Sparkles, TrendingDown, TrendingUp } from 'lucide-react'

interface WhatIfSimulatorProps {
  piggy: PiggyBank
}

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export function WhatIfSimulator({ piggy }: WhatIfSimulatorProps) {
  const { remainingAmount, monthlyNeeded } = calculatePlanningMetrics(
    Number(piggy.current_amount),
    Number(piggy.target_amount),
    piggy.deadline,
    piggy.created_at
  )

  const defaultMonthly = Math.max(Math.round(monthlyNeeded), 50)
  const maxSlider = Math.max(Math.round(defaultMonthly * 3), Math.round(remainingAmount), 500)
  const minSlider = Math.min(50, Math.max(10, Math.round(remainingAmount / 60)))

  const [simulatedMonthly, setSimulatedMonthly] = useState<number>(defaultMonthly)

  const simulation = useMemo(() => {
    if (remainingAmount <= 0) return null

    const monthsNeeded = remainingAmount / simulatedMonthly
    const daysNeeded = Math.ceil(monthsNeeded * 30.44)
    const estimatedDate = addDays(new Date(), daysNeeded)
    const originalDeadline = parseISO(piggy.deadline)

    // Positivo = termina antes do prazo | Negativo = termina depois do prazo
    const daysDiff = differenceInDays(originalDeadline, estimatedDate)

    return {
      monthsNeeded,
      estimatedDate,
      daysDiff,
    }
  }, [remainingAmount, simulatedMonthly, piggy.deadline])

  if (remainingAmount <= 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/5 py-10 text-center">
        <Sparkles className="mb-2 h-6 w-6 text-emerald-400" />
        <p className="text-sm font-medium text-emerald-300">Meta já concluída!</p>
        <p className="mt-1 text-xs text-zinc-400">Você já atingiu 100% do valor alvo.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Controle do Slider */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-xs text-zinc-400">Se eu guardar por mês:</span>
          <span className="text-xl font-bold text-emerald-400 tabular-nums">
            {formatBRL(simulatedMonthly)}
          </span>
        </div>

        <input
          type="range"
          min={minSlider}
          max={maxSlider}
          step={10}
          value={simulatedMonthly}
          onChange={(e) => setSimulatedMonthly(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-emerald-400"
        />

        <div className="mt-2 flex justify-between text-[11px] text-zinc-500 tabular-nums">
          <span>{formatBRL(minSlider)}</span>
          <button
            type="button"
            onClick={() => setSimulatedMonthly(defaultMonthly)}
            className="text-zinc-400 underline decoration-white/20 underline-offset-2 hover:text-white"
          >
            Resetar ({formatBRL(defaultMonthly)})
          </button>
          <span>{formatBRL(maxSlider)}</span>
        </div>
      </div>

      {/* Resultado em Tempo Real */}
      {simulation && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-zinc-400">
              <CalendarClock className="h-3.5 w-3.5 text-cyan-400" />
              Previsão
            </div>
            <p className="text-sm font-semibold text-white capitalize">
              {format(simulation.estimatedDate, "MMM 'de' yyyy", { locale: ptBR })}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500 tabular-nums">
              ~{simulation.monthsNeeded.toFixed(1)} meses
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-zinc-400">
              {simulation.daysDiff >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-amber-400" />
              )}
              Comparado ao prazo
            </div>
            {simulation.daysDiff === 0 ? (
              <p className="text-sm font-semibold text-zinc-200">Exatamente no prazo</p>
            ) : simulation.daysDiff > 0 ? (
              <>
                <p className="text-sm font-semibold text-emerald-400 tabular-nums">
                  {simulation.daysDiff} dias antes
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-500">Você adianta a meta</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-amber-400 tabular-nums">
                  {Math.abs(simulation.daysDiff)} dias depois
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-500">Passa da data limite</p>
              </>
            )}
          </div>
        </div>
      )}

      <p className="text-center text-[11px] text-zinc-500 tabular-nums">
        Faltam <span className="text-zinc-300">{formatBRL(remainingAmount)}</span> para atingir o objetivo.
      </p>
    </div>
  )
}