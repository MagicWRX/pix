import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
        Template
      </h1>
      <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl">
        This is the canonical Next.js starter template for the Amazing Business Platform.
        It includes built-in security headers, dynamic SEO metadata, and is ready for Vercel deployment.
      </p>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>Get your site up and running in minutes.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Use the starter templates and components to compose pages quickly.</p>
          </CardContent>
          <CardFooter>
            <Button>Get Started</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Learn More</CardTitle>
            <CardDescription>Guides, deployment, and customization.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Explore docs, examples, and configuration tips for production readiness.</p>
          </CardContent>
          <CardFooter>
            <Button variant="ghost">Documentation</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
