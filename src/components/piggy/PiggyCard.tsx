'use client'

import { PiggyBank } from '@/types/piggy'
import { calculatePlanningMetrics, generateMeshGradient } from '@/utils/piggy-helpers'
import { Calendar, Pencil, Plus, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

interface PiggyCardProps {
  piggy: PiggyBank
  onQuickDeposit: (piggy: PiggyBank) => void
  onEdit: (piggy: PiggyBank) => void
}

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export function PiggyCard({ piggy, onQuickDeposit, onEdit }: PiggyCardProps) {
  const { daysLeft, progress, monthlyNeeded, dailyNeeded, paceStatus } = calculatePlanningMetrics(
    Number(piggy.current_amount),
    Number(piggy.target_amount),
    piggy.deadline,
    piggy.created_at
  )
  const gradient = generateMeshGradient(piggy.id + piggy.title)

  const paceBadge = {
    completed: { label: 'Concluídos', style: 'border-emerald-400/30 bg-emerald-400/15 text-emerald-300' },
    ahead: { label: 'Adiantado', style: 'border-cyan-400/30 bg-cyan-400/15 text-cyan-300' },
    on_track: { label: 'Em dia', style: 'border-white/10 bg-white/5 text-zinc-300' },
    behind: { label: 'Atrasado', style: 'border-amber-400/30 bg-amber-400/15 text-amber-300' },
  }[paceStatus]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition hover:border-white/20"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60 transition duration-500 group-hover:opacity-90"
        style={{ background: gradient.background }}
      />

      <div className="relative z-10 flex flex-col justify-between gap-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold tracking-tight text-white">{piggy.title}</h3>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${paceBadge.style}`}>
                {paceBadge.label}
              </span>
            </div>
            {piggy.description && (
              <p className="mt-0.5 line-clamp-1 text-xs text-zinc-400">{piggy.description}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-xs font-medium text-zinc-300 tabular-nums">
              <Calendar className="h-3 w-3" style={{ color: gradient.accent }} />
              {daysLeft}d
            </span>
            <button
              onClick={() => onEdit(piggy)}
              title="Editar meta"
              className="rounded-full border border-white/10 bg-black/30 p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
            >
              <Pencil className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-white tabular-nums">
              {formatBRL(Number(piggy.current_amount))}
            </span>
            <span className="text-xs text-zinc-400 tabular-nums">
              de {formatBRL(Number(piggy.target_amount))}
            </span>
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: gradient.accent }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-zinc-400 tabular-nums">
            <span>{progress.toFixed(1)}% concluído</span>
            <span className="flex items-center gap-1 text-zinc-300">
              <TrendingUp className="h-3 w-3" style={{ color: gradient.accent }} />
              {daysLeft > 30
                ? `${formatBRL(monthlyNeeded)}/mês`
                : `${formatBRL(dailyNeeded)}/dia`}
            </span>
          </div>
        </div>

        <button
          onClick={() => onQuickDeposit(piggy)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] py-2.5 text-xs font-semibold text-white transition hover:bg-white/[0.12]"
        >
          <Plus className="h-3.5 w-3.5" />
          Registrar movimentação
        </button>
      </div>
    </motion.div>
  )
}