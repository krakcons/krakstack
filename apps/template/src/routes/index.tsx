import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";

import { AppBrand } from "@/components/app-brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LocaleToggle } from "@/components/locale-toggle";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <AppBrand label={m.home_brand()} subtitle={m.app_name()} icon={LayoutDashboard} />
          <div className="flex items-center gap-5 text-sm">
            <a
              className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              href="/admin"
            >
              {m.home_open_admin()}
            </a>
            <LocaleToggle />
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-16">
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-muted-foreground">{m.home_eyebrow()}</p>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
                {m.home_title()}
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground">{m.home_description()}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" render={<a href="/admin" />}>
                {m.home_get_started()}
              </Button>
              <Button size="lg" variant="outline" render={<a href="/api/docs" />}>
                {m.home_view_api_docs()}
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{m.home_card_title()}</CardTitle>
              <CardDescription>{m.home_card_description()}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
              <p>{m.home_card_auth()}</p>
              <p>{m.home_card_tasks()}</p>
              <p>{m.home_card_i18n()}</p>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
