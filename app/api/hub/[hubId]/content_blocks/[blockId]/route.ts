import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function authorizeHubOwner(supabase: Awaited<ReturnType<typeof createClient>>, hubId: string, userId: string) {
  const { data: hub } = await supabase.from('hubs').select('user_id').eq('id', hubId).single()
  return hub?.user_id === userId
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ hubId: string; blockId: string }> }
) {
  const { hubId, blockId } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const authorized = await authorizeHubOwner(supabase, hubId, user.id)
  if (!authorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const updates: Record<string, unknown> = {}
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order
  if (body.data !== undefined) updates.data = body.data

  const { error } = await supabase.from('content_blocks').update(updates).eq('id', blockId).eq('hub_id', hubId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ hubId: string; blockId: string }> }
) {
  const { hubId, blockId } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const authorized = await authorizeHubOwner(supabase, hubId, user.id)
  if (!authorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase.from('content_blocks').delete().eq('id', blockId).eq('hub_id', hubId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
