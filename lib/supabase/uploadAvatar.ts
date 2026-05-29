import { createClient } from './client'

// Uploads avatar to hub-photos bucket under avatars/ prefix, returns public URL
export async function uploadAvatar(file: File, userId: string): Promise<string | null> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const path = `avatars/${userId}/profile.${ext}`
  const { error } = await supabase.storage.from('hub-photos').upload(path, file, { upsert: true })
  if (error) {
    console.error('Avatar upload error:', error)
    return null
  }
  const { data: { publicUrl } } = supabase.storage.from('hub-photos').getPublicUrl(path)
  return publicUrl
}
