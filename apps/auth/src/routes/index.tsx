import { Link, createFileRoute } from "@tanstack/react-router";

import { m } from "@/paraglide/messages";
import { LocaleToggle } from "@/components/locale-toggle/locale-toggle";
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
              {m.app_initials()}
            </div>
            <div>
              <p className="text-sm font-semibold">{m.app_name()}</p>
              <p className="text-xs text-muted-foreground">{m.app_tagline()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LocaleToggle />
            <Link className={buttonVariants({ variant: "outline" })} to="/sign-in">
              {m.auth_sign_in()}
            </Link>
          </div>
        </header>

        <section className="grid gap-8 md:grid-cols-[1.25fr_0.75fr] md:items-center">
          <div className="flex flex-col gap-6">
            <div className="inline-flex w-fit rounded-md border px-3 py-1 text-sm text-muted-foreground">
              {m.home_badge()}
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-5xl font-bold tracking-tight md:text-7xl">
                {m.home_heading()}
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground">{m.home_description()}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link className={buttonVariants({ size: "lg" })} to="/sign-in">
                {m.home_open_sign_in()}
              </Link>
              <a className={buttonVariants({ size: "lg", variant: "outline" })} href="/api/auth/ok">
                {m.home_check_api_health()}
              </a>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{m.home_integration_endpoints()}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <Endpoint label={m.home_auth_api()} value="/api/auth/*" />
              <Endpoint label={m.home_oidc_discovery()} value="/.well-known/openid-configuration" />
              <Endpoint
                label={m.home_issuer_discovery()}
                value="/api/auth/.well-known/openid-configuration"
              />
              <Endpoint
                label={m.home_oauth_metadata()}
                value="/.well-known/oauth-authorization-server/api/auth"
              />
            </CardContent>
          </Card>
        </section>

        <footer className="text-sm text-muted-foreground">{m.home_footer()}</footer>
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
