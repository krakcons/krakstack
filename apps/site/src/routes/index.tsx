import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppBrand } from "@/components/app-brand";
import { LocaleToggle } from "@/components/locale-toggle";
import { getRegistryGroup, registryItems } from "@/lib/registry";
import { m } from "@/paraglide/messages";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Blocks,
  Bot,
  Database,
  FileCode2,
  Globe,
  KeyRound,
  ListChecks,
  Shield,
  Table2,
  UserRound,
  Wrench,
} from "lucide-react";

export const Route = createFileRoute("/")({ component: Home });

const iconByName = {
  "app-brand": Blocks,
  "data-table": Table2,
  form: ListChecks,
  "locale-toggle": Globe,
  "user-button": UserRound,
  "sign-in": KeyRound,
  "sign-up": KeyRound,
  auth: Shield,
  "service-database": Database,
  "service-opentelemetry": Activity,
  agents: Bot,
  "lint-format": Wrench,
  "krakstack-template": FileCode2,
} as const;

const groupedItems = registryItems.reduce(
  (sections, item) => {
    const group = getRegistryGroup(item);
    let section = sections.find((s) => s.title === group);
    if (!section) {
      section = { title: group, items: [] };
      sections.push(section);
    }
    section.items.push({
      ...item,
      icon: iconByName[item.name as keyof typeof iconByName] ?? Shield,
    });
    return sections;
  },
  [] as Array<{
    title: string;
    items: Array<(typeof registryItems)[number] & { icon: typeof Table2 }>;
  }>,
);

function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <AppBrand label="Krakstack" subtitle={m.app_name()} icon={Blocks} />
          <div className="flex items-center gap-5 text-sm">
            <Link
              to="/docs/registry/$slug"
              params={{ slug: "data-table" }}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Docs
            </Link>
            <a
              href="https://github.com/krakcons/krakstack"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.19 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
              </svg>
            </a>
            <LocaleToggle />
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-16">
        <section className="mb-16 text-center">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-primary">
            Open Source
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Components &amp; services for your stack
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Production-ready blocks and libraries you can add to your app with shadcn. Built with
            TanStack, Effect, and Drizzle.
          </p>
        </section>

        {groupedItems.map((section) => (
          <section key={section.title} className="mb-12">
            <h2 className="mb-6 text-xs font-bold uppercase tracking-[0.16em] text-primary">
              {section.title}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {section.items.map((item) => (
                <Link
                  key={item.name}
                  params={{ slug: item.name }}
                  to="/docs/registry/$slug"
                  className="group"
                >
                  <Card className="cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <CardHeader>
                      <div className="mb-2 flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <item.icon className="size-4" />
                      </div>
                      <CardTitle>{item.title ?? item.name}</CardTitle>
                      <CardDescription className="line-clamp-2">{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <span className="text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        View docs →
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 text-sm text-muted-foreground">
          <span>Built with the sea in mind.</span>
          <Link
            to="/docs/registry/$slug"
            params={{ slug: "data-table" }}
            className="transition-colors hover:text-foreground"
          >
            Documentation
          </Link>
        </div>
      </footer>
    </div>
  );
}
