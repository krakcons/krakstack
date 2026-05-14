import { Link, createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";

import { m } from "@/paraglide/messages";
import { AppBrand } from "@/components/app-brand";
import { LocaleToggle } from "@/components/locale-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-20 border-b backdrop-blur">
        <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <AppBrand
            label={m.sidebar_brand()}
            subtitle={m.sidebar_brand_subtitle()}
            icon={Users}
          />
          <div className="flex items-center gap-5 text-sm">
            <Link
              className="text-muted-foreground hover:text-foreground underline-offset-4 transition-colors hover:underline"
              to="/admin"
            >
              {m.home_open_admin()}
            </Link>
            <LocaleToggle />
          </div>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-between gap-10 px-4 py-16">
        <section className="grid gap-8 md:grid-cols-[1.25fr_0.75fr] md:items-center">
          <div className="flex flex-col gap-6">
            <div className="text-muted-foreground inline-flex w-fit rounded-md border px-3 py-1 text-sm">
              {m.home_badge()}
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
                {m.home_heading()}
              </h1>
              <p className="text-muted-foreground max-w-2xl text-lg">
                {m.home_description()}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link className={buttonVariants({ size: "lg" })} to="/admin">
                {m.home_open_sign_in()}
              </Link>
              <a
                className={buttonVariants({ size: "lg", variant: "outline" })}
                href="/api/auth/ok"
              >
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
              <Endpoint
                label={m.home_oidc_discovery()}
                value="/.well-known/openid-configuration"
              />
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

        <footer className="text-muted-foreground text-sm">
          {m.home_footer()}
        </footer>
      </main>
    </div>
  );
}

function Endpoint({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </div>
      <code className="mt-1 block font-mono text-sm break-all">{value}</code>
    </div>
  );
}
