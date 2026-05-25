import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HubCard from '@/components/HubCard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: hubs } = await supabase
    .from('hubs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">QRMagNotes</h1>
          <form action={signOut}>
            <button type="submit" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-5xl mb-4">📁</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Manage your hubs in Collections</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-xs text-center">
            All your hubs are now organized in collections for a simpler experience.
          </p>
          <Link
            href="/dashboard/collections"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Go to Collections
          </Link>
        </div>
      </main>
    </div>
  )
}
