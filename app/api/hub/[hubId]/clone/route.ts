import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'hub'
}

async function findUniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  base: string,
): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const slug = i === 0 ? base : `${base}-${i + 1}`
    const { data } = await supabase
      .from('hubs')
      .select('id')
      .eq('user_id', userId)
      .eq('slug', slug)
      .maybeSingle()
    if (!data) return slug
  }
  return `${base}-${Date.now()}`
}

export async function POST(req: NextRequest, context: { params: Promise<{ hubId: string }> }) {
  const { hubId } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: source } = await supabase
    .from('hubs')
    .select('*')
    .eq('id', hubId)
    .eq('user_id', user.id)
    .single()
  if (!source) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { title, selectedBlockIds } = body as { title: string; selectedBlockIds: string[] }

  if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  if (!Array.isArray(selectedBlockIds) || selectedBlockIds.length === 0) {
    return NextResponse.json({ error: 'Select at least one block' }, { status: 400 })
  }

  const slug = await findUniqueSlug(supabase, user.id, slugify(title.trim()))

  const { data: newHub, error: hubError } = await supabase
    .from('hubs')
    .insert({
      user_id: user.id,
      title: title.trim(),
      slug,
      mode: source.mode,
      redirect_url: source.redirect_url,
      description: source.description,
      theme_color: source.theme_color,
      template_id: source.template_id,
      collection_id: source.collection_id,
      privacy_mode: 'private',
      tags: source.tags ?? [],
    })
    .select('id, slug')
    .single()

  if (hubError || !newHub) {
    return NextResponse.json({ error: hubError?.message ?? 'Failed to create hub' }, { status: 500 })
  }

  const { data: sourceBlocks } = await supabase
    .from('content_blocks')
    .select('*')
    .eq('hub_id', hubId)
    .in('id', selectedBlockIds)
    .order('sort_order', { ascending: true })

  if (sourceBlocks && sourceBlocks.length > 0) {
    await supabase.from('content_blocks').insert(
      sourceBlocks.map((b: any, i: number) => ({
        hub_id: newHub.id,
        type: b.type,
        data: b.data,
        sort_order: i,
      }))
    )
  }

  return NextResponse.json({ hub: newHub })
}
