import { createClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'

export const metadata = { title: 'Settings — NAV' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-sm text-[#6b7280]">Manage your NAV preferences</p>
      </div>
      <SettingsClient profile={profile} />
    </div>
  )
}
