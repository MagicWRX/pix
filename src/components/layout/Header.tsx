import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function Header() {
  const magicWrxUrl = process.env.NEXT_PUBLIC_MAGICWRX_URL ?? 'https://www.magicwrx.com'

  return (
    <header className="bg-white border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold">Template</Link>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost">
            <a href={`${magicWrxUrl}/login`}>Sign In</a>
          </Button>
          <Button>
            Get Started
          </Button>
        </div>
      </div>
    </header>
  )
}
