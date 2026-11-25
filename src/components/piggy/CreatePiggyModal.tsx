'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PiggyBank } from '@/types/piggy'
import { Loader2, X } from 'lucide-react'

interface CreatePiggyModalProps {
  open: boolean
  onClose: () => void
  onCreated: (newPiggy: PiggyBank) => void
}

export function CreatePiggyModal({ open, onClose, onCreated }: CreatePiggyModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error: insertError } = await supabase
      .from('piggy_banks')
      .insert({
        user_id: user.id,
        title,
        description: description || null,
        target_amount: parseFloat(targetAmount),
        deadline,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    onCreated(data as PiggyBank)
    setTitle('')
    setDescription('')
    setTargetAmount('')
    setDeadline('')
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0c0c10] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Novo Cofrinho</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Nome da meta</label>
            <input
              required
              placeholder="Ex: Reserva de Emergência, Viagem..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-400">Descrição (opcional)</label>
            <input
              placeholder="Detalhes do objetivo"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Valor alvo (R$)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                placeholder="5000.00"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-zinc-400">Data limite</label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50 [color-scheme:dark]"
              />
            </div>
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 py-3 text-sm font-semibold text-zinc-950 transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar Cofrinho'}
          </button>
        </form>
      </div>
    </div>
  )
}