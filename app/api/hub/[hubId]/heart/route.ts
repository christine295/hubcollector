import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, context: { params: Promise<{ hubId: string }> }) {
  const { hubId } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: hub } = await supabase
    .from('hubs')
    .select('user_id, privacy_mode')
    .eq('id', hubId)
    .single()

  if (!hub) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (hub.privacy_mode === 'private') return NextResponse.json({ error: 'Cannot heart private hub' }, { status: 403 })
  if (hub.user_id === user.id) return NextResponse.json({ error: 'Cannot heart your own hub' }, { status: 400 })

  await supabase
    .from('hub_hearts')
    .upsert({ user_id: user.id, hub_id: hubId }, { onConflict: 'user_id,hub_id' })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ hubId: string }> }) {
  const { hubId } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase
    .from('hub_hearts')
    .delete()
    .eq('user_id', user.id)
    .eq('hub_id', hubId)

  return NextResponse.json({ ok: true })
}
