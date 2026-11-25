'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PiggyBank } from '@/types/piggy'
import { calculatePlanningMetrics, PaceStatus } from '@/utils/piggy-helpers'
import { PiggyCard } from './PiggyCard'
import { CreatePiggyModal } from './CreatePiggyModal'
import { TransactionModal } from './TransactionModal'
import { EditPiggyModal } from './EditPiggyModal'
import { ArrowUpDown, LogOut, Plus, Wallet } from 'lucide-react'

interface DashboardClientProps {
  initialPiggies: PiggyBank[]
  userEmail: string
}

type FilterOption = 'all' | PaceStatus
type SortOption = 'newest' | 'deadline' | 'remaining' | 'progress'

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'ahead', label: 'Adiantado' },
  { value: 'on_track', label: 'Em dia' },
  { value: 'behind', label: 'Atrasado' },
  { value: 'completed', label: 'Concluídos' },
]

export function DashboardClient({ initialPiggies, userEmail }: DashboardClientProps) {
  const [piggies, setPiggies] = useState<PiggyBank[]>(initialPiggies)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedPiggy, setSelectedPiggy] = useState<PiggyBank | null>(null)
  const [editingPiggy, setEditingPiggy] = useState<PiggyBank | null>(null)
  const [statusFilter, setStatusFilter] = useState<FilterOption>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const router = useRouter()
  const supabase = createClient()

  const totalSaved = piggies.reduce((acc, p) => acc + Number(p.current_amount), 0)
  const totalTarget = piggies.reduce((acc, p) => acc + Number(p.target_amount), 0)

  const filteredAndSortedPiggies = useMemo(() => {
    const withMetrics = piggies.map((piggy) => ({
      piggy,
      metrics: calculatePlanningMetrics(
        Number(piggy.current_amount),
        Number(piggy.target_amount),
        piggy.deadline,
        piggy.created_at
      ),
    }))

    const filtered =
      statusFilter === 'all'
        ? withMetrics
        : withMetrics.filter((item) => item.metrics.paceStatus === statusFilter)

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          return a.metrics.daysLeft - b.metrics.daysLeft
        case 'remaining':
          return b.metrics.remainingAmount - a.metrics.remainingAmount
        case 'progress':
          return b.metrics.progress - a.metrics.progress
        case 'newest':
        default:
          return new Date(b.piggy.created_at).getTime() - new Date(a.piggy.created_at).getTime()
      }
    })

    return sorted.map((item) => item.piggy)
  }, [piggies, statusFilter, sortBy])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#050507] text-zinc-100">
      {/* Glow sutil no topo */}
      <div className="pointer-events-none fixed top-0 left-1/2 h-72 w-[600px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />

      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Header */}
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-emerald-400">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white">Cofrinho</h1>
              <p className="text-xs text-zinc-500">{userEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200"
            >
              <Plus className="h-4 w-4" />
              Nova Meta
            </button>
            <button
              onClick={handleLogout}
              title="Sair"
              className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-zinc-400 transition hover:bg-white/[0.08] hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Resumo Geral */}
        <section className="mb-8 rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Total Acumulado</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-3">
            <span className="text-4xl font-bold tracking-tight text-white tabular-nums">
              {formatBRL(totalSaved)}
            </span>
            <span className="text-sm text-zinc-400 tabular-nums">
              de {formatBRL(totalTarget)} em metas
            </span>
          </div>
        </section>

        {/* Barra de Filtros e Ordenação */}
        {piggies.length > 0 && (
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              {FILTER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    statusFilter === option.value
                      ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-300'
                      : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.07] hover:text-zinc-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <ArrowUpDown className="h-3.5 w-3.5 text-zinc-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="rounded-xl border border-white/10 bg-[#0c0c10] px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-emerald-400/50"
              >
                <option value="newest">Mais recentes</option>
                <option value="deadline">Prazo mais próximo</option>
                <option value="remaining">Maior valor faltante</option>
                <option value="progress">Maior progresso</option>
              </select>
            </div>
          </div>
        )}

        {/* Grid de Cofrinhos */}
        {piggies.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 py-16 text-center">
            <p className="text-sm text-zinc-400">Nenhum cofrinho criado ainda.</p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-400/20"
            >
              Criar minha primeira meta
            </button>
          </div>
        ) : filteredAndSortedPiggies.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 py-12 text-center">
            <p className="text-sm text-zinc-400">Nenhuma meta encontrada com esse filtro.</p>
            <button
              onClick={() => setStatusFilter('all')}
              className="mt-3 text-xs font-medium text-emerald-400 hover:underline"
            >
              Mostrar todas as metas
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedPiggies.map((piggy) => (
              <PiggyCard
                key={piggy.id}
                piggy={piggy}
                onQuickDeposit={(selected) => setSelectedPiggy(selected)}
                onEdit={(selected) => setEditingPiggy(selected)}
              />
            ))}
          </div>
        )}
      </div>

      <CreatePiggyModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(newPiggy) => setPiggies([newPiggy, ...piggies])}
      />

      <TransactionModal
        piggy={selectedPiggy}
        onClose={() => setSelectedPiggy(null)}
        onBalanceUpdated={(piggyId, newAmount) => {
          setPiggies((prev) =>
            prev.map((p) => (p.id === piggyId ? { ...p, current_amount: newAmount } : p))
          )
          setSelectedPiggy((prev) =>
            prev && prev.id === piggyId ? { ...prev, current_amount: newAmount } : prev
          )
        }}
      />

      <EditPiggyModal
        piggy={editingPiggy}
        onClose={() => setEditingPiggy(null)}
        onUpdated={(updated) => {
          setPiggies((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
        }}
        onDeleted={(piggyId) => {
          setPiggies((prev) => prev.filter((p) => p.id !== piggyId))
        }}
      />
    </div>
  )
}