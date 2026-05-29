import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_BLOCK_TYPES = ['text', 'image', 'audio', 'file', 'link', 'phone', 'checklist', 'timeline', 'note', 'collection_menu'] as const

async function getAuthorizedHub(supabase: Awaited<ReturnType<typeof createClient>>, hubId: string, userId: string) {
  const { data: hub } = await supabase.from('hubs').select('user_id').eq('id', hubId).single()
  if (!hub) return null
  if (hub.user_id !== userId) return null
  return hub
}

export async function GET(_req: NextRequest, context: { params: Promise<{ hubId: string }> }) {
  const { hubId } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const hub = await getAuthorizedHub(supabase, hubId, user.id)
  if (!hub) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('content_blocks')
    .select('*')
    .eq('hub_id', hubId)
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ content_blocks: data })
}

export async function POST(req: NextRequest, context: { params: Promise<{ hubId: string }> }) {
  const { hubId } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const hub = await getAuthorizedHub(supabase, hubId, user.id)
  if (!hub) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { type, data, sort_order } = body

  if (!VALID_BLOCK_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid block type' }, { status: 400 })
  }

  const { data: block, error } = await supabase
    .from('content_blocks')
    .insert([{ hub_id: hubId, type, data, sort_order }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ content_block: block })
}
