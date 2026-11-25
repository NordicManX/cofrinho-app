'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PiggyBank, Transaction } from '@/types/piggy'
import { ArrowDownLeft, ArrowUpRight, LineChart, Loader2, SlidersHorizontal, Trash2, X } from 'lucide-react'
import { WhatIfSimulator } from './WhatIfSimulator'
import { EvolutionChart } from './EvolutionChart'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CurrencyInput } from '@/components/ui/CurrencyInput'

interface TransactionModalProps {
  piggy: PiggyBank | null
  onClose: () => void
  onBalanceUpdated: (piggyId: string, newAmount: number) => void
}

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export function TransactionModal({ piggy, onClose, onBalanceUpdated }: TransactionModalProps) {
  const [activeTab, setActiveTab] = useState<'transactions' | 'evolution' | 'simulator'>('transactions')
  const [type, setType] = useState<'deposit' | 'withdraw'>('deposit')
  const [amount, setAmount] = useState<number>(0)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<Transaction[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!piggy) return
    setActiveTab('transactions')
    setAmount(0)
    setNote('')
    setError(null)
    fetchHistory(piggy.id)
  }, [piggy])

  async function fetchHistory(piggyId: string) {
    setLoadingHistory(true)
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('piggy_bank_id', piggyId)
      .order('created_at', { ascending: false })
      .limit(50)

    setHistory((data as Transaction[]) ?? [])
    setLoadingHistory(false)
  }

  async function syncPiggyBalance(piggyId: string) {
    const { data } = await supabase
      .from('piggy_banks')
      .select('current_amount')
      .eq('id', piggyId)
      .single()

    if (data) {
      onBalanceUpdated(piggyId, Number(data.current_amount))
    }
  }

  if (!piggy) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!piggy) return

    if (amount <= 0) {
      setError('Informe um valor maior que zero.')
      return
    }

    if (type === 'withdraw' && amount > Number(piggy.current_amount)) {
      setError('Saldo insuficiente para este resgate.')
      return
    }

    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: insertError } = await supabase.from('transactions').insert({
      piggy_bank_id: piggy.id,
      user_id: user.id,
      amount,
      type,
      note: note.trim() || null,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setAmount(0)
    setNote('')
    setLoading(false)
    await Promise.all([fetchHistory(piggy.id), syncPiggyBalance(piggy.id)])
  }

  async function handleDelete(txId: string) {
    if (!piggy) return
    const { error: deleteError } = await supabase.from('transactions').delete().eq('id', txId)
    if (!deleteError) {
      await Promise.all([fetchHistory(piggy.id), syncPiggyBalance(piggy.id)])
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0c0c10] p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">{piggy.title}</h2>
            <p className="text-xs text-zinc-400 tabular-nums">
              Saldo atual: <span className="font-medium text-zinc-200">{formatBRL(Number(piggy.current_amount))}</span>
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Abas */}
        <div className="mb-5 flex gap-4 border-b border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`pb-2.5 text-xs font-semibold transition ${
              activeTab === 'transactions'
                ? 'border-b-2 border-emerald-400 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Movimentações
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('evolution')}
            className={`flex items-center gap-1.5 pb-2.5 text-xs font-semibold transition ${
              activeTab === 'evolution'
                ? 'border-b-2 border-emerald-400 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <LineChart className="h-3.5 w-3.5" />
            Evolução
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-1.5 pb-2.5 text-xs font-semibold transition ${
              activeTab === 'simulator'
                ? 'border-b-2 border-emerald-400 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Simulador "E se?"
          </button>
        </div>

        {activeTab === 'simulator' ? (
          <WhatIfSimulator piggy={piggy} />
        ) : activeTab === 'evolution' ? (
          <EvolutionChart transactions={history} targetAmount={Number(piggy.target_amount)} />
        ) : (
          <>
            {/* Toggle Aporte / Resgate */}
            <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
              <button
                type="button"
                onClick={() => { setType('deposit'); setError(null) }}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition ${
                  type === 'deposit'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ArrowDownLeft className="h-3.5 w-3.5" />
                Aportar
              </button>
              <button
                type="button"
                onClick={() => { setType('withdraw'); setError(null) }}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition ${
                  type === 'withdraw'
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                Resgatar
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <CurrencyInput
                  required
                  placeholder="R$ 0,00"
                  value={amount}
                  onChange={setAmount}
                />
              </div>
              <div>
                <input
                  placeholder="Observação (ex: Salário, Freelance...)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50"
                />
              </div>

              {error && <p className="text-xs text-rose-400">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className={`flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
                  type === 'deposit'
                    ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-zinc-950 hover:opacity-90'
                    : 'bg-rose-500 text-white hover:bg-rose-600'
                }`}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : type === 'deposit' ? (
                  'Confirmar Aporte'
                ) : (
                  'Confirmar Resgate'
                )}
              </button>
            </form>

            {/* Extrato Recente */}
            <div className="mt-6 border-t border-white/10 pt-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Últimas movimentações
              </p>

              {loadingHistory ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                </div>
              ) : history.length === 0 ? (
                <p className="py-4 text-center text-xs text-zinc-500">Nenhuma movimentação ainda.</p>
              ) : (
                <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                  {history.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2"
                    >
                      <div>
                        <p className="text-xs font-medium text-zinc-200">
                          {tx.note || (tx.type === 'deposit' ? 'Aporte' : 'Resgate')}
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          {format(parseISO(tx.created_at), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold tabular-nums ${
                            tx.type === 'deposit' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {tx.type === 'deposit' ? '+' : '-'} {formatBRL(Number(tx.amount))}
                        </span>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          title="Estornar"
                          className="rounded-lg p-1 text-zinc-500 transition hover:bg-rose-500/10 hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}