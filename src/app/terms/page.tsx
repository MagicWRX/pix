export const metadata = {
  title: 'Terms of Service',
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Terms of Service</h1>
      <p className="mt-4 text-gray-700">
        This site template may be provided through MagicWRX. Site owners are responsible for ensuring their
        content, marketing, and advertising practices comply with applicable laws and platform policies.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-gray-900">Advertising</h2>
      <p className="mt-2 text-gray-700">
        If enabled, ads may be served through Google AdSense. Ads can be removed for paid plans (ad-free)
        as configured by the site owner / MagicWRX provisioning.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-gray-900">Acceptable Use</h2>
      <p className="mt-2 text-gray-700">
        You agree not to attempt to interfere with ad delivery, inflate impressions/clicks, or modify ad
        code in a way that violates Google policies.
      </p>

      <p className="mt-8 text-sm text-gray-500">Last updated: 2026-01-01</p>
    </div>
  )
}
