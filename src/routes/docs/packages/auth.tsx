import {
  BookOpen,
  Building2,
  ExternalLink,
  KeyRound,
  Package,
  ShieldCheck,
  TableProperties,
  UserRound,
} from "lucide-react";
import { use } from "react";

import { OrganizationSwitcherPreview } from "@/components/registry-previews/organization-switcher-preview";
import { UserButtonPreview } from "@/components/registry-previews/user-button-preview";
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
import { CodeBlock } from "@/components/ui/code-block";
import { SidebarPageHeader } from "@/components/ui/sidebar-layout";
import { krakstackPackages } from "@/lib/krakstack-packages";
import { shikiHighlighter } from "@/lib/shiki";
import { cn } from "@/lib/utils";
import { m } from "@/paraglide/messages";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/packages/auth")({
  component: AuthPackageDocs,
});

const pkg = krakstackPackages[0];

const providerCode = `import { KrakstackAuthProvider } from "@krak-stack/auth";
import { authClient } from "@/services/auth/client";
import { getLocale } from "@/paraglide/runtime";

export const RootDocument = ({ children }: { children: React.ReactNode }) => (
  <KrakstackAuthProvider
    authClient={authClient}
    baseUrl={import.meta.env.VITE_KRAKSTACK_AUTH_URL}
    projectId={import.meta.env.VITE_KRAKSTACK_AUTH_PROJECT_ID}
    locale={getLocale()}
  >
    {children}
  </KrakstackAuthProvider>
);`;

const componentCode = `import {
  MemberRequired,
  OrganizationSwitcher,
  Signin,
  UserButton,
} from "@krak-stack/auth";

<Signin />

<OrganizationSwitcher side="right" />
<UserButton signOutRedirect="/" side="bottom" />

<MemberRequired organizationId={organizationId}>
  <AdminApplication />
</MemberRequired>`;

const middlewareCode = `import { AuthMiddleware, AuthService } from "@krak-stack/auth/server";
import { Effect, Layer } from "effect";
import { HttpApiGroup } from "effect/unstable/httpapi";

export const PrivateApi = HttpApiGroup.make("private")
  .add(/* endpoints */)
  .middleware(AuthMiddleware);

export const AuthLive = AuthMiddleware.layer();

const handler = Effect.gen(function* () {
  const auth = yield* AuthService;
  const session = yield* auth.getSession();
  return { userId: session.user.id };
});

export const ApiLive = PrivateApiLive.pipe(Layer.provide(AuthLive));`;

const clientCode = `import { AuthService } from "@krak-stack/auth";
import { Effect } from "effect";

const organizations = Effect.gen(function* () {
  const auth = yield* AuthService;
  return yield* auth.server.listOrganizations({
    query: { userId: "user_1" },
  });
}).pipe(Effect.provide(AuthService.layer()));`;

function AuthPackageDocs() {
  const highlighter = use(shikiHighlighter);
  const components = [
    {
      icon: KeyRound,
      title: m.krakstack_package_auth_forms_title(),
      description: m.krakstack_package_auth_forms_description(),
      exports: ["Signin", "Signup", "ResetPassword", "TwoFactor"],
    },
    {
      icon: UserRound,
      title: m.krakstack_package_auth_user_button_title(),
      description: m.krakstack_package_auth_user_button_description(),
      exports: ["UserButton"],
    },
    {
      icon: Building2,
      title: m.krakstack_package_auth_org_switcher_title(),
      description: m.krakstack_package_auth_org_switcher_description(),
      exports: ["OrganizationSwitcher"],
    },
    {
      icon: ShieldCheck,
      title: m.krakstack_package_auth_member_required_title(),
      description: m.krakstack_package_auth_member_required_description(),
      exports: ["MemberRequired"],
    },
    {
      icon: TableProperties,
      title: m.krakstack_package_auth_admin_title(),
      description: m.krakstack_package_auth_admin_description(),
      exports: [
        "AdminUsersTable",
        "AdminOrganizationsTable",
        "AdminOrganizationForm",
      ],
    },
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl min-w-0 flex-col gap-10">
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

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <Badge className="w-fit font-mono" variant="secondary">
            {pkg.name}
          </Badge>
          <CardTitle>{m.krakstack_package_auth_overview_heading()}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Markdown
            content={m.krakstack_package_auth_overview()}
            highlighter={highlighter}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{m.krakstack_package_install_heading()}</CardTitle>
          <CardDescription>
            {m.krakstack_package_auth_install_description()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CodeBlock
            code={pkg.installCommand}
            highlighter={highlighter}
            language="bash"
          />
        </CardContent>
      </Card>

      <DocSection
        icon={BookOpen}
        title={m.krakstack_package_auth_components_heading()}
        description={m.krakstack_package_auth_components_description()}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {components.map((component) => (
            <Card className="bg-[var(--surface-strong)]" key={component.title}>
              <CardHeader>
                <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                  <component.icon className="size-5" />
                </div>
                <CardTitle className="text-lg">{component.title}</CardTitle>
                <CardDescription>{component.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {component.exports.map((name) => (
                  <Badge className="font-mono" key={name} variant="outline">
                    {name}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </DocSection>

      <DocumentationCard
        code={providerCode}
        content={m.krakstack_package_auth_provider()}
        highlighter={highlighter}
        title={m.krakstack_package_auth_provider_heading()}
      />

      <DocumentationCard
        code={componentCode}
        content={m.krakstack_package_auth_component_usage()}
        highlighter={highlighter}
        title={m.krakstack_package_auth_component_usage_heading()}
      />

      <DocumentationCard
        code={middlewareCode}
        content={m.krakstack_package_auth_middleware()}
        highlighter={highlighter}
        title={m.krakstack_package_auth_middleware_heading()}
      />

      <DocumentationCard
        code={clientCode}
        content={m.krakstack_package_auth_clients()}
        highlighter={highlighter}
        title={m.krakstack_package_auth_clients_heading()}
      />

      <DocSection
        icon={ShieldCheck}
        title={m.krakstack_package_auth_preview_heading()}
        description={m.krakstack_package_auth_preview_description()}
      >
        <div className="grid gap-6">
          <OrganizationSwitcherPreview />
          <UserButtonPreview />
        </div>
      </DocSection>
    </main>
  );
}

function DocSection({
  children,
  description,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  description: string;
  icon: typeof BookOpen;
  title: string;
}) {
  return (
    <section className="grid gap-4">
      <div className="grid gap-1">
        <div className="flex items-center gap-2">
          <Icon className="text-primary size-5" />
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        </div>
        <p className="text-muted-foreground max-w-3xl text-sm">{description}</p>
      </div>
      {children}
    </section>
  );
}

function DocumentationCard({
  code,
  content,
  highlighter,
  title,
}: {
  code: string;
  content: string;
  highlighter: Awaited<typeof shikiHighlighter>;
  title: string;
}) {
  return (
    <section className="grid gap-4">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      <Card>
        <CardContent className="grid gap-6 pt-6">
          <Markdown content={content} highlighter={highlighter} />
          <CodeBlock code={code} highlighter={highlighter} language="tsx" />
        </CardContent>
      </Card>
    </section>
  );
}
