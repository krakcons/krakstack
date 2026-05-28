import { Code2, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SidebarPageHeader } from "@/components/sidebar-layout";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { krakstackSites } from "@/lib/krakstack-sites";
import { cn } from "@/lib/utils";
import { m } from "@/paraglide/messages";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/sites/template")({
  component: TemplateSiteDocs,
});

const site = krakstackSites[0];

function TemplateSiteDocs() {
  const Icon = site.icon;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl min-w-0 flex-col gap-8">
      <SidebarPageHeader
        title={site.title()}
        description={site.description()}
        badge={{ label: site.badge() }}
        actions={
          <SiteActions siteHref={site.siteHref} githubHref={site.githubHref} />
        }
      />

      <Card className="overflow-hidden">
        <CardHeader className="gap-4">
          <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-lg">
            <Icon className="size-6" />
          </div>
          <div className="grid gap-2">
            <CardTitle>{site.url}</CardTitle>
            <CardDescription>{site.overview()}</CardDescription>
          </div>
        </CardHeader>
      </Card>

      <section className="grid gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          {m.krakstack_site_features_heading()}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {site.features.map((feature, index) => (
            <Card key={feature.title()} className="h-full">
              <CardHeader>
                <Badge className="mb-1 w-fit font-mono" variant="secondary">
                  {String(index + 1).padStart(2, "0")}
                </Badge>
                <CardTitle className="text-base">{feature.title()}</CardTitle>
                <CardDescription className="text-foreground text-sm leading-6">
                  {feature.description()}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}

function SiteActions({
  siteHref,
  githubHref,
}: {
  siteHref: string;
  githubHref: string;
}) {
  return (
    <>
      <a
        className={buttonVariants({ variant: "default" })}
        href={siteHref}
        target="_blank"
        rel="noopener noreferrer"
      >
        <ExternalLink />
        {m.krakstack_site_visit_link()}
      </a>
      <a
        className={cn(buttonVariants({ variant: "outline" }))}
        href={githubHref}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Code2 />
        {m.krakstack_site_github_link()}
      </a>
    </>
  );
}
