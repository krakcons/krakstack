import { createFileRoute } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LocaleToggle } from "@/components/locale-toggle";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-12 px-6 py-6 md:px-8">
        <header className="flex items-center justify-between">
          <div className="font-semibold tracking-tight">{m.home_brand()}</div>
          <div className="flex items-center gap-2">
            <LocaleToggle />
            <Button render={<a href="/admin" />}>{m.home_open_admin()}</Button>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-muted-foreground">{m.home_eyebrow()}</p>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
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
      </div>
    </main>
  );
}
