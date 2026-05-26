'use client'

import QRCode from 'qrcode'

export default function QRButton({
  slug,
  username,
  className,
  onComplete,
}: {
  slug: string
  username: string
  className?: string
  onComplete?: () => void
}) {
  async function downloadQR() {
    const url = `${process.env.NEXT_PUBLIC_SITE_URL}/h/${username}/${slug}`
    const dataUrl = await QRCode.toDataURL(url, { width: 512, margin: 2 })
    const link = document.createElement('a')
    link.download = `qr-${slug}.png`
    link.href = dataUrl
    link.click()
    onComplete?.()
  }

  return (
    <button
      type="button"
      onClick={downloadQR}
      className={
        className ??
        'text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors'
      }
    >
      Download QR
    </button>
  )
}
