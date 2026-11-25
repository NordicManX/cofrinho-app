'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PiggyBank } from '@/types/piggy'
import { Loader2, Trash2, X } from 'lucide-react'

interface EditPiggyModalProps {
  piggy: PiggyBank | null
  onClose: () => void
  onUpdated: (updated: PiggyBank) => void
  onDeleted: (piggyId: string) => void
}

export function EditPiggyModal({ piggy, onClose, onUpdated, onDeleted }: EditPiggyModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!piggy) return
    setTitle(piggy.title)
    setDescription(piggy.description ?? '')
    setTargetAmount(String(piggy.target_amount))
    setDeadline(piggy.deadline)
    setConfirmDelete(false)
    setError(null)
  }, [piggy])

  if (!piggy) return null

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!piggy) return
    setLoading(true)
    setError(null)

    const { data, error: updateError } = await supabase
      .from('piggy_banks')
      .update({
        title: title.trim(),
        description: description.trim() || null,
        target_amount: parseFloat(targetAmount),
        deadline,
      })
      .eq('id', piggy.id)
      .select()
      .single()

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    onUpdated(data as PiggyBank)
    setLoading(false)
    onClose()
  }

  async function handleDelete() {
    if (!piggy) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    setDeleting(true)
    setError(null)

    const { data, error: deleteError } = await supabase
      .from('piggy_banks')
      .delete()
      .eq('id', piggy.id)
      .select()

    if (deleteError) {
      setError(deleteError.message)
      setDeleting(false)
      return
    }

    if (!data || data.length === 0) {
      setError('Exclusão bloqueada pelo banco (verifique a política RLS de DELETE).')
      setDeleting(false)
      return
    }

    onDeleted(piggy.id)
    setDeleting(false)
    onClose()
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0c0c10] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Editar Meta</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Nome da meta</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-zinc-400">Descrição (opcional)</label>
            <input
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
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-400/50 tabular-nums"
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
            disabled={loading || deleting}
            className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 py-3 text-sm font-semibold text-zinc-950 transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar alterações'}
          </button>
        </form>

        {/* Zona de Exclusão */}
        <div className="mt-5 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading || deleting}
            className={`flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition disabled:opacity-50 ${
              confirmDelete
                ? 'border-rose-500 bg-rose-500 text-white hover:bg-rose-600'
                : 'border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
            }`}
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                {confirmDelete ? 'Confirmar exclusão definitiva?' : 'Excluir meta'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}