import { createServerSupabaseClient } from '@/src/db/supabase'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings — MortgageAI',
}

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch officer profile
  const { data: officer } = await supabase
    .from('officers')
    .select('id, full_name, email')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Full Name
              </label>
              <p className="text-slate-900 font-medium mt-1">
                {officer?.full_name ?? 'Not set'}
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Email
              </label>
              <p className="text-slate-900 font-medium mt-1">
                {officer?.email ?? user.email ?? 'Not set'}
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                User ID
              </label>
              <p className="text-slate-500 text-sm mt-1 font-mono">{user.id}</p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">Email Notifications</p>
                <p className="text-xs text-slate-500">Receive email alerts for escalations and loan updates</p>
              </div>
              <div className="bg-emerald-100 text-emerald-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Enabled
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">Borrower Reminders</p>
                <p className="text-xs text-slate-500">Auto-send reminders after 3 days of inactivity</p>
              </div>
              <div className="bg-emerald-100 text-emerald-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                Enabled
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Info</CardTitle>
          </CardHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Version</span>
              <span className="text-slate-900 font-mono">0.1.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">AI Model</span>
              <span className="text-slate-900 font-mono">claude-sonnet-4-6</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Environment</span>
              <span className="text-slate-900 font-mono">
                {process.env.NODE_ENV}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
