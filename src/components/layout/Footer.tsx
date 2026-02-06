import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-white border-t mt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-gray-600">
        <p>© {new Date().getFullYear()} MagicWRX Template. All rights reserved.</p>
        <div className="mt-2 space-x-4">
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          <Link href="/terms" className="hover:underline">Terms</Link>
        </div>
      </div>
    </footer>
  )
}
