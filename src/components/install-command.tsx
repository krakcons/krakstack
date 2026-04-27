import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const siteUrl = (import.meta.env.VITE_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

export function InstallCommand({ slug }: { slug: string }) {
  const installCommand = `bunx --bun shadcn@latest add ${siteUrl}/r/${slug}.json`

  return (
    <Card className="min-w-0 bg-[var(--surface-strong)]">
      <CardHeader>
        <CardTitle>Install</CardTitle>
        <CardDescription>Add this registry item to your app with shadcn.</CardDescription>
      </CardHeader>
      <CardContent className="min-w-0">
        <pre className="max-w-full overflow-x-auto rounded-lg border bg-muted p-4 text-sm text-muted-foreground">
          <code>{installCommand}</code>
        </pre>
      </CardContent>
    </Card>
  )
}
