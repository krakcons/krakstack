import { BookOpen, ExternalLink, Package } from "lucide-react";

import { Markdown } from "@/components/markdown";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarPageHeader } from "@/components/ui/sidebar-layout";
import { krakstackPackages } from "@/lib/krakstack-packages";
import { cn } from "@/lib/utils";
import { m } from "@/paraglide/messages";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/packages/auth")({
  component: AuthPackageDocs,
});

const pkg = krakstackPackages[0];

function AuthPackageDocs() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl min-w-0 flex-col gap-8">
      <SidebarPageHeader
        title={pkg.name}
        description={pkg.description()}
        badge={{ label: pkg.badge() }}
        actions={
          <>
            <a
              className={buttonVariants({ variant: "default" })}
              href={pkg.npmHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Package />
              {m.krakstack_package_npm_link()}
            </a>
            <a
              className={cn(buttonVariants({ variant: "outline" }))}
              href={pkg.readmeHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink />
              {m.krakstack_package_readme_link()}
            </a>
          </>
        }
      />

      <Card>
        <CardHeader>
          <Badge className="w-fit font-mono" variant="secondary">
            {pkg.name}
          </Badge>
          <CardTitle>{m.krakstack_package_install_heading()}</CardTitle>
          <CardDescription>
            {m.krakstack_package_auth_install_description()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted overflow-x-auto rounded-lg border p-4 text-sm">
            <code>{pkg.installCommand}</code>
          </pre>
        </CardContent>
      </Card>

      <section className="grid gap-4">
        <div className="flex items-center gap-2">
          <BookOpen className="text-primary size-5" />
          <h2 className="text-2xl font-semibold tracking-tight">
            {m.krakstack_package_readme_heading()}
          </h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Markdown content={pkg.readme()} />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
