'use client'

import { useMemo, useState } from 'react'
import { Transaction } from '@/types/piggy'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'

interface EvolutionChartProps {
  transactions: Transaction[]
  targetAmount: number
}

interface DataPoint {
  date: string
  balance: number
  label: string
}

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export function EvolutionChart({ transactions, targetAmount }: EvolutionChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const { points, totalDeposits, totalWithdraws } = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    let runningBalance = 0
    let deposits = 0
    let withdraws = 0

    const pts: DataPoint[] = sorted.map((tx) => {
      const amount = Number(tx.amount)
      if (tx.type === 'deposit') {
        runningBalance += amount
        deposits += amount
      } else {
        runningBalance = Math.max(0, runningBalance - amount)
        withdraws += amount
      }

      return {
        date: tx.created_at,
        balance: runningBalance,
        label: format(parseISO(tx.created_at), "dd 'de' MMM", { locale: ptBR }),
      }
    })

    return { points: pts, totalDeposits: deposits, totalWithdraws: withdraws }
  }, [transactions])

  if (points.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] py-12 text-center">
        <TrendingUp className="mb-2 h-6 w-6 text-zinc-500" />
        <p className="text-sm font-medium text-zinc-300">Dados insuficientes</p>
        <p className="mt-1 max-w-[240px] text-xs text-zinc-500">
          Faça pelo menos 2 movimentações neste cofrinho para visualizar o gráfico de evolução.
        </p>
      </div>
    )
  }

  const width = 360
  const height = 160
  const padX = 12
  const padY = 16

  const maxVal = Math.max(...points.map((p) => p.balance), 1)
  const minVal = Math.min(...points.map((p) => p.balance), 0)
  const range = Math.max(maxVal - minVal, 1)

  const coords = points.map((p, i) => {
    const x = padX + (i / (points.length - 1)) * (width - padX * 2)
    const y = height - padY - ((p.balance - minVal) / range) * (height - padY * 2)
    return { x, y, ...p }
  })

  const linePath = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ')

  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${height} L ${coords[0].x.toFixed(1)} ${height} Z`

  const activePoint = hoveredIndex !== null ? coords[hoveredIndex] : coords[coords.length - 1]
  const progressPct = Math.min((activePoint.balance / Math.max(targetAmount, 1)) * 100, 100)

  return (
    <div className="space-y-4">
      {/* Cabeçalho do ponto ativo */}
      <div className="flex items-end justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <div>
          <p className="text-[11px] text-zinc-400">
            {hoveredIndex !== null ? `Saldo em ${activePoint.label}` : 'Saldo mais recente'}
          </p>
          <p className="text-xl font-bold text-white tabular-nums">
            {formatBRL(activePoint.balance)}
          </p>
        </div>
        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300 tabular-nums">
          {progressPct.toFixed(1)}% da meta
        </span>
      </div>

      {/* Gráfico SVG */}
      <div className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-40 w-full overflow-visible"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="piggyAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="piggyLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>

          {/* Linhas de grade sutis */}
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={ratio}
              x1={padX}
              x2={width - padX}
              y1={padY + ratio * (height - padY * 2)}
              y2={padY + ratio * (height - padY * 2)}
              stroke="rgba(255,255,255,0.05)"
              strokeDasharray="3 3"
            />
          ))}

          {/* Área preenchida */}
          <motion.path
            d={areaPath}
            fill="url(#piggyAreaGrad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          />

          {/* Linha principal */}
          <motion.path
            d={linePath}
            fill="none"
            stroke="url(#piggyLineGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />

          {/* Pontos interativos */}
          {coords.map((c, i) => {
            const isActive = hoveredIndex === i || (hoveredIndex === null && i === coords.length - 1)
            return (
              <g key={c.date + i}>
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={12}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                />
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={isActive ? 4.5 : 2.5}
                  fill={isActive ? '#22d3ee' : '#34d399'}
                  stroke="#0c0c10"
                  strokeWidth="2"
                  className="pointer-events-none transition-all"
                />
              </g>
            )
          })}
        </svg>

        <div className="mt-1 flex justify-between px-2 text-[10px] text-zinc-500">
          <span>{coords[0].label}</span>
          <span>{coords[coords.length - 1].label}</span>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5">
          <p className="text-[11px] text-zinc-500">Total aportado</p>
          <p className="text-sm font-semibold text-emerald-400 tabular-nums">
            +{formatBRL(totalDeposits)}
          </p>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5">
          <p className="text-[11px] text-zinc-500">Total resgatado</p>
          <p className="text-sm font-semibold text-rose-400 tabular-nums">
            -{formatBRL(totalWithdraws)}
          </p>
        </div>
      </div>
    </div>
  )
}