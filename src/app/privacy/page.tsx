export const metadata = {
  title: 'Privacy Policy',
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Privacy Policy</h1>
      <p className="mt-4 text-gray-700">
        This site may be powered by MagicWRX and may display ads provided via Google AdSense when enabled.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-gray-900">Advertising (Google AdSense)</h2>
      <p className="mt-2 text-gray-700">
        If ads are enabled, Google and its partners may use cookies and similar technologies to serve and
        measure ads, including ad personalization depending on your consent and region.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-gray-900">Data Shared With Third Parties</h2>
      <p className="mt-2 text-gray-700">
        When ads are enabled, limited device and usage data may be processed by Google for ad delivery,
        fraud prevention, and reporting. This site may also send basic, non-sensitive attribution signals
        to MagicWRX (for example: a site identifier and page path) to support revenue-share programs.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-gray-900">Your Choices</h2>
      <p className="mt-2 text-gray-700">
        If this site uses an ads consent banner, you can accept or decline ad personalization. You can also
        manage Google ad settings in your Google account and browser controls.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-gray-900">Security</h2>
      <p className="mt-2 text-gray-700">
        MagicWRX sites should follow least-privilege access, use HTTPS, and limit data collection to what is
        necessary. No payment information is collected by this template.
      </p>

      <p className="mt-8 text-sm text-gray-500">Last updated: 2026-01-01</p>
    </div>
  )
}
