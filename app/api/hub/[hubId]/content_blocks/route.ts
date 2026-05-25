import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET all content blocks for a hub
export async function GET(req: NextRequest, { params }: { params: { hubId: string } }) {
  const { hubId } = params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('content_blocks')
    .select('*')
    .eq('hub_id', hubId)
    .order('sort_order', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ content_blocks: data })
}

// POST create a new content block for a hub
export async function POST(req: NextRequest, { params }: { params: { hubId: string } }) {
  const { hubId } = params
  const supabase = await createClient()
  const body = await req.json()
  const { type, data, sort_order } = body

  const { data: block, error } = await supabase
    .from('content_blocks')
    .insert([{ hub_id: hubId, type, data, sort_order }])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ content_block: block })
}
