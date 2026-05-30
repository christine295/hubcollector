import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = 'christine@websketching.com'

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (id === user.id) {
    return NextResponse.json({ error: 'Cannot terminate your own account' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  // Ban permanently + mark terminated + delete all content
  // Keeps the auth record so the email stays taken and they cannot re-register
  const [banResult, statusResult, contentResult] = await Promise.all([
    adminClient.auth.admin.updateUserById(id, { ban_duration: '876000h' }),
    adminClient.from('profiles').update({ account_status: 'terminated' }).eq('id', id),
    adminClient.from('hubs').delete().eq('user_id', id),
  ])

  if (banResult.error)     return NextResponse.json({ error: banResult.error.message }, { status: 500 })
  if (statusResult.error)  return NextResponse.json({ error: statusResult.error.message }, { status: 500 })
  if (contentResult.error) return NextResponse.json({ error: contentResult.error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
