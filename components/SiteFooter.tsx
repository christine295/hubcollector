import Link from 'next/link'

export default function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={`border-t border-stone-100 ${className ?? ''}`}>
      <div className="max-w-2xl mx-auto px-5 py-8 flex flex-col items-center gap-3 text-[0.6875rem] text-stone-400 leading-[1.7] text-center">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          <Link href="/privacy" className="hover:text-stone-600 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-stone-600 transition-colors">Terms of Service</Link>
          <Link href="/acceptable-use" className="hover:text-stone-600 transition-colors">Acceptable Use</Link>
          <Link href="/content-licensing" className="hover:text-stone-600 transition-colors">Content &amp; Licensing FAQ</Link>
        </div>
        <div className="space-y-0.5">
          <p>
            © 2026{' '}
            <a
              href="https://websketching.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-stone-600 transition-colors underline underline-offset-2"
            >
              cTaylor Consulting LLC dba Websketching
            </a>
            . All Rights Reserved.
          </p>
          <p>HubCollector™ is a trademark of cTaylor Consulting LLC.</p>
        </div>
      </div>
    </footer>
  )
}
