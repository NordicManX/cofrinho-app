'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PiggyBank } from '@/types/piggy'
import { PiggyCard } from './PiggyCard'
import { CreatePiggyModal } from './CreatePiggyModal'
import { TransactionModal } from './TransactionModal'
import { EditPiggyModal } from './EditPiggyModal'
import { LogOut, Plus, Wallet } from 'lucide-react'

interface DashboardClientProps {
  initialPiggies: PiggyBank[]
  userEmail: string
}

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export function DashboardClient({ initialPiggies, userEmail }: DashboardClientProps) {
  const [piggies, setPiggies] = useState<PiggyBank[]>(initialPiggies)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedPiggy, setSelectedPiggy] = useState<PiggyBank | null>(null)
  const [editingPiggy, setEditingPiggy] = useState<PiggyBank | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const totalSaved = piggies.reduce((acc, p) => acc + Number(p.current_amount), 0)
  const totalTarget = piggies.reduce((acc, p) => acc + Number(p.target_amount), 0)

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
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {piggies.map((piggy) => (
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