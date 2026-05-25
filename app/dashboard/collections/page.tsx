import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HubCard from '@/components/HubCard'

export default async function CollectionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch collections and hubs
  const { data: collections } = await supabase
    .from('collections')
    .select('*, hubs(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Collections</h1>
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8">
        {collections && collections.length > 0 ? (
          <div className="space-y-8">
            {collections.map((collection: any) => (
              <div key={collection.id} className="bg-white rounded-xl border border-gray-200 shadow p-5">
                <div className="flex items-center gap-4 mb-2">
                  {collection.cover_image && (
                    <img src={collection.cover_image} alt="cover" className="w-12 h-12 rounded object-cover" />
                  )}
                  <div>
                    <h2 className="font-semibold text-lg text-gray-900">{collection.title}</h2>
                    {collection.description && <p className="text-gray-500 text-sm">{collection.description}</p>}
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {collection.hubs && collection.hubs.length > 0 ? (
                    collection.hubs.map((hub: any) => <HubCard key={hub.id} hub={hub} />)
                  ) : (
                    <div className="text-gray-400 text-sm">No hubs in this collection.</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 px-4">
            <div className="text-5xl mb-4">📁</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No collections yet</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
              Organize your hubs into collections for easier management.
            </p>
            <Link
              href="/dashboard"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
