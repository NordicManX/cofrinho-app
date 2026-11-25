import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/piggy/DashboardClient'
import { PiggyBank } from '@/types/piggy'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: piggies } = await supabase
    .from('piggy_banks')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <DashboardClient
      initialPiggies={(piggies as PiggyBank[]) ?? []}
      userEmail={user.email ?? ''}
    />
  )
}