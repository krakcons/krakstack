import { Link, createFileRoute } from "@tanstack/react-router";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main className="min-h-screen px-6 py-8 md:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col justify-between gap-10">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground">
              KS
            </div>
            <div>
              <p className="text-sm font-semibold">Krakstack Auth</p>
              <p className="text-xs text-muted-foreground">Central identity server</p>
            </div>
          </div>
          <Link className={buttonVariants({ variant: "outline" })} to="/sign-in">
            Sign in
          </Link>
        </header>

        <section className="grid gap-8 md:grid-cols-[1.25fr_0.75fr] md:items-center">
          <div className="flex flex-col gap-6">
            <div className="inline-flex w-fit rounded-md border px-3 py-1 text-sm text-muted-foreground">
              OAuth 2.1 and OIDC for your projects
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-5xl font-bold tracking-tight md:text-7xl">
                One login for every Krakstack app.
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                This service owns user sessions, credentials, OAuth clients, and OIDC metadata.
                Other apps should redirect here instead of implementing their own auth stack.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link className={buttonVariants({ size: "lg" })} to="/sign-in">
                Open sign-in
              </Link>
              <a className={buttonVariants({ size: "lg", variant: "outline" })} href="/api/auth/ok">
                Check API health
              </a>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Integration endpoints</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <Endpoint label="Auth API" value="/api/auth/*" />
              <Endpoint label="OIDC discovery" value="/.well-known/openid-configuration" />
              <Endpoint
                label="Issuer discovery"
                value="/api/auth/.well-known/openid-configuration"
              />
              <Endpoint
                label="OAuth metadata"
                value="/.well-known/oauth-authorization-server/api/auth"
              />
            </CardContent>
          </Card>
        </section>

        <footer className="text-sm text-muted-foreground">
          Configure consumers with this app's public URL as their central auth issuer.
        </footer>
      </div>
    </main>
  );
}

function Endpoint({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <code className="mt-1 block break-all font-mono text-sm">{value}</code>
    </div>
  );
}
