import { AppBrand } from "@/components/ui/app-brand";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { ThemeSwitcher, useTheme } from "@/components/ui/theme-switcher";
import { RegistryCommandMenu } from "@/components/registry-command-menu";
import { krakstackSites } from "@/lib/krakstack-sites";
import { getRegistryGroup, registryItems } from "@/lib/registry";
import { createSeo } from "@/lib/seo";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Blocks,
  Bot,
  Check,
  Code2,
  Database,
  Layers3,
  Menu,
  PackagePlus,
  Terminal,
} from "lucide-react";

const siteOrigin = "https://krakstack.net";
const siteSeo = createSeo({
  origin: siteOrigin,
  locales: ["en", "fr"],
  siteName: "KrakStack",
  sameAs: ["https://github.com/krakcons/krakstack"],
});

export const Route = createFileRoute("/")({
  head: () => {
    const locale = getLocale() === "fr" ? "fr" : "en";
    const title = `${m.home_title()} | KrakStack`;
    const description = m.home_description();
    return siteSeo({
      title,
      description,
      locale,
    });
  },
  component: Home,
});

const componentCount = registryItems.filter(
  (item) => getRegistryGroup(item) === "Components",
).length;

const serviceCount = registryItems.filter(
  (item) => getRegistryGroup(item) === "Services",
).length;

const groupedItems = registryItems.reduce(
  (sections, item) => {
    const group = getRegistryGroup(item);
    let section = sections.find((candidate) => candidate.title === group);
    if (!section) {
      section = { title: group, items: [] };
      sections.push(section);
    }
    section.items.push(item);
    return sections;
  },
  [] as Array<{
    title: string;
    items: Array<(typeof registryItems)[number]>;
  }>,
);

const installCommand = "bunx --bun shadcn@latest add @krak-stack/app-brand";

const GitHubIcon = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    className={className}
    viewBox="0 0 16 16"
    fill="currentColor"
  >
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.19 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

function Home() {
  const { theme, setTheme } = useTheme();
  const capabilities = [
    {
      icon: PackagePlus,
      title: m.home_capability_install_title(),
      description: m.home_capability_install_description(),
      marker: "01",
    },
    {
      icon: Layers3,
      title: m.home_capability_stack_title(),
      description: m.home_capability_stack_description(),
      marker: "02",
    },
    {
      icon: Bot,
      title: m.home_capability_agents_title(),
      description: m.home_capability_agents_description(),
      marker: "03",
    },
  ];
  const platformItems = [
    {
      icon: Blocks,
      title: m.home_platform_ui_title(),
      description: m.home_platform_ui_description(),
    },
    {
      icon: Database,
      title: m.home_platform_backend_title(),
      description: m.home_platform_backend_description(),
    },
    {
      icon: Bot,
      title: m.home_platform_agents_title(),
      description: m.home_platform_agents_description(),
    },
    {
      icon: Code2,
      title: m.home_platform_source_title(),
      description: m.home_platform_source_description(),
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      <header className="bg-background/90 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-30 border-b backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <AppBrand
            label="Krakstack"
            subtitle={m.app_name()}
            icon={Blocks}
            className="min-w-0"
          />
          <div className="ml-auto flex shrink-0 items-center gap-2 text-sm">
            <Link
              className="text-muted-foreground hover:text-foreground hidden px-2 transition-colors md:inline-flex"
              to="/docs"
            >
              {m.home_nav_docs()}
            </Link>
            <a
              className="text-muted-foreground hover:text-foreground hidden items-center gap-1.5 px-2 transition-colors md:inline-flex"
              href="https://github.com/krakcons/krakstack"
              target="_blank"
              rel="noreferrer"
            >
              <GitHubIcon className="size-4" />
              {m.home_view_github()}
            </a>
            <RegistryCommandMenu />
            <MobileHeaderMenu />
            <ThemeSwitcher value={theme} onChange={setTheme} />
            <LocaleSwitcher />
          </div>
        </nav>
      </header>

      <main>
        <section className="relative border-b">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_38%,color-mix(in_oklab,var(--secondary)_32%,transparent),transparent_32%)]" />
          <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(var(--foreground)_1px,transparent_1px),linear-gradient(90deg,var(--foreground)_1px,transparent_1px)] [background-size:48px_48px] opacity-[0.035]" />
          <div className="relative mx-auto grid max-w-7xl gap-14 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-32">
            <div>
              <div className="text-primary mb-6 flex items-center gap-3 font-mono text-xs font-semibold tracking-[0.18em] uppercase">
                <span className="bg-primary h-px w-8" />
                {m.home_eyebrow()}
              </div>
              <h1 className="max-w-4xl text-5xl leading-[1.02] font-semibold tracking-[-0.045em] sm:text-6xl lg:text-7xl">
                {m.home_title()}
              </h1>
              <p className="text-muted-foreground mt-7 max-w-2xl text-lg leading-8 sm:text-xl">
                {m.home_description()}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link className={buttonVariants({ size: "lg" })} to="/docs">
                  {m.home_browse_registry()}
                  <ArrowRight className="size-4" />
                </Link>
                <a
                  className={buttonVariants({ size: "lg", variant: "outline" })}
                  href="https://github.com/krakcons/krakstack"
                  target="_blank"
                  rel="noreferrer"
                >
                  {m.home_view_github()}
                </a>
              </div>
              <p className="text-muted-foreground mt-5 flex items-center gap-2 text-sm">
                <Check className="text-primary size-4" />
                {m.home_open_source_note()}
              </p>
            </div>

            <RegistryPreview />
          </div>
        </section>

        <section className="border-b">
          <div className="mx-auto grid max-w-7xl divide-y px-4 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0">
            <Stat
              title={m.home_stats_components_title()}
              detail={m.home_stats_components_description()}
              value={componentCount}
            />
            <Stat
              title={m.home_stats_services_title()}
              detail={m.home_stats_services_description()}
              value={serviceCount}
            />
            <Stat
              title={m.home_stats_total_title()}
              detail={m.home_stats_total_description()}
              value={registryItems.length}
            />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <SectionHeading
            kicker={m.home_capabilities_eyebrow()}
            title={m.home_capabilities_title()}
            description={m.home_capabilities_description()}
          />
          <div className="bg-border mt-12 grid gap-px overflow-hidden rounded-xl border md:grid-cols-3">
            {capabilities.map(({ description, icon: Icon, marker, title }) => (
              <article
                key={marker}
                className="bg-background relative flex min-h-72 flex-col p-7"
              >
                <div className="flex items-start justify-between">
                  <div className="bg-secondary text-secondary-foreground flex size-11 items-center justify-center rounded-lg">
                    <Icon className="size-5" />
                  </div>
                  <span className="text-muted-foreground font-mono text-xs">
                    {marker}
                  </span>
                </div>
                <div className="mt-auto pt-10">
                  <h3 className="text-xl font-semibold">{title}</h3>
                  <p className="text-muted-foreground mt-3 text-sm leading-6">
                    {description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-foreground text-background">
          <div className="mx-auto grid max-w-7xl gap-14 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="text-background/60 font-mono text-xs font-semibold tracking-[0.18em] uppercase">
                {m.home_platform_eyebrow()}
              </p>
              <h2 className="mt-5 max-w-md text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
                {m.home_platform_title()}
              </h2>
            </div>
            <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
              {platformItems.map(({ description, icon: Icon, title }) => (
                <article key={title}>
                  <Icon className="text-secondary mb-5 size-6" />
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-background/65 mt-2 text-sm leading-6">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <SectionHeading
            kicker={m.krakstack_sites_heading()}
            title={m.home_sites_title()}
            description={m.home_sites_description()}
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {krakstackSites.map((site) => (
              <Link
                key={site.id}
                to={site.docsHref}
                className="group bg-background hover:bg-muted/50 relative flex min-h-64 flex-col rounded-xl border p-7 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="bg-secondary text-secondary-foreground flex size-11 items-center justify-center rounded-lg">
                    <site.icon className="size-5" />
                  </div>
                  <span className="text-muted-foreground font-mono text-xs">
                    {site.url}
                  </span>
                </div>
                <div className="mt-auto pt-10">
                  <h3 className="text-xl font-semibold">{site.title()}</h3>
                  <p className="text-muted-foreground mt-3 text-sm leading-6">
                    {site.description()}
                  </p>
                  <span className="text-primary mt-6 inline-flex items-center gap-1 text-sm font-medium">
                    {m.view_docs()}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-28">
          <SectionHeading
            kicker={m.home_catalogue_eyebrow()}
            title={m.home_catalogue_title()}
            description={m.home_catalogue_description()}
          />
          <div className="mt-12">
            {groupedItems.map((section) => (
              <div key={section.title} className="mb-12 last:mb-0">
                <h3 className="mb-5 font-mono text-xs font-semibold tracking-[0.18em] uppercase">
                  {section.title}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {section.items.map((item) => (
                    <Link
                      key={item.name}
                      params={{ slug: item.name }}
                      to="/docs/{-$slug}"
                      className="group bg-background hover:bg-muted/50 flex min-h-44 flex-col rounded-xl border p-5 transition-colors"
                    >
                      <h4 className="font-semibold">
                        {item.title ?? item.name}
                      </h4>
                      <p className="text-muted-foreground mt-2 line-clamp-2 text-sm leading-6">
                        {item.description}
                      </p>
                      <span className="text-primary mt-auto inline-flex items-center gap-1 pt-6 text-xs font-medium">
                        {m.view_docs()}
                        <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 sm:pb-28">
          <div className="bg-secondary text-secondary-foreground relative overflow-hidden rounded-2xl p-8 sm:p-12 lg:flex lg:items-end lg:justify-between">
            <Blocks className="absolute -top-10 -right-8 size-52 opacity-[0.07]" />
            <div className="relative max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {m.home_cta_title()}
              </h2>
              <p className="mt-4 max-w-xl leading-7 opacity-75">
                {m.home_cta_description()}
              </p>
            </div>
            <Link
              className={`${buttonVariants({ size: "lg" })} relative mt-8 lg:mt-0`}
              to="/docs"
            >
              {m.home_get_started()}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>{m.home_footer_note()}</span>
          <div className="flex gap-5">
            <Link className="hover:text-foreground" to="/docs">
              {m.home_nav_docs()}
            </Link>
            <a
              className="hover:text-foreground"
              href="https://github.com/krakcons/krakstack"
              target="_blank"
              rel="noreferrer"
            >
              {m.home_view_github()}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function RegistryPreview() {
  const previewItems = [
    { icon: Blocks, label: m.home_preview_component(), value: componentCount },
    { icon: Database, label: m.home_preview_service(), value: serviceCount },
    { icon: Bot, label: m.home_preview_agent(), value: "MCP" },
    { icon: Layers3, label: m.home_preview_template(), value: "TSX" },
  ];

  return (
    <div className="relative mx-auto w-full max-w-lg lg:ml-auto">
      <div className="bg-card shadow-foreground/10 overflow-hidden rounded-xl border shadow-2xl">
        <div className="bg-muted/60 flex h-11 items-center gap-2 border-b px-4">
          <span className="size-2.5 rounded-full bg-red-400/70" />
          <span className="size-2.5 rounded-full bg-amber-400/70" />
          <span className="size-2.5 rounded-full bg-emerald-400/70" />
          <div className="bg-background text-muted-foreground ml-3 flex h-6 flex-1 items-center rounded border px-3 font-mono text-[10px]">
            krakstack.net/registry
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <div className="bg-primary mb-4 flex size-10 items-center justify-center rounded-lg">
                <Blocks className="text-primary-foreground size-5" />
              </div>
              <h2 className="font-semibold">{m.home_preview_title()}</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                {m.home_preview_description()}
              </p>
            </div>
            <Badge variant="secondary">{m.home_preview_badge()}</Badge>
          </div>
          <div className="bg-foreground text-background flex items-start gap-3 overflow-x-auto rounded-lg p-3 font-mono text-[11px] dark:bg-black dark:text-white">
            <Terminal className="mt-0.5 size-3.5 shrink-0 opacity-70" />
            <code className="whitespace-nowrap">{installCommand}</code>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {previewItems.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="bg-muted/50 flex items-center gap-3 rounded-lg border p-3"
              >
                <div className="bg-background text-primary flex size-8 shrink-0 items-center justify-center rounded-md border">
                  <Icon className="size-4" />
                </div>
                <span className="min-w-0 flex-1 truncate text-xs font-medium">
                  {label}
                </span>
                <span className="text-muted-foreground font-mono text-[10px] font-semibold">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-secondary absolute -right-5 -bottom-5 -z-10 h-40 w-40 rounded-xl opacity-70" />
    </div>
  );
}

function SectionHeading({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description: string;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
      <div>
        <p className="text-primary font-mono text-xs font-semibold tracking-[0.18em] uppercase">
          {kicker}
        </p>
        <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h2>
      </div>
      <p className="text-muted-foreground max-w-xl text-base leading-7 lg:ml-auto">
        {description}
      </p>
    </div>
  );
}

function Stat({
  detail,
  title,
  value,
}: {
  detail: string;
  title: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-4 px-2 py-7 md:px-8">
      <span className="bg-primary size-2 shrink-0 rounded-full" />
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold tabular-nums">{value}</span>
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <div className="text-muted-foreground mt-0.5 text-xs">{detail}</div>
      </div>
    </div>
  );
}

function MobileHeaderMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="size-4" />
            <span className="sr-only">{m.home_menu()}</span>
          </Button>
        }
      />
      <DropdownMenuContent
        className="w-72 max-w-[calc(100vw-1rem)]"
        align="end"
        sideOffset={8}
      >
        <div className="p-1">
          <DropdownMenuItem
            render={<Link to="/docs">{m.home_nav_docs()}</Link>}
          />
          <DropdownMenuItem
            render={
              <a
                href="https://github.com/krakcons/krakstack"
                target="_blank"
                rel="noreferrer"
              >
                {m.home_view_github()}
              </a>
            }
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
