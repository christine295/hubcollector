import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, context: { params: Promise<{ hubId: string }> }) {
  const { hubId } = await context.params
  const supabase = await createClient()

  // Increment share count via SECURITY DEFINER function (bypasses RLS — anyone can share)
  const { error } = await supabase.rpc('increment_share_count', { p_hub_id: hubId })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
