import { CodeBlock } from "@/components/ui/code-block";
import { SidebarPageHeader } from "@/components/ui/sidebar-layout";
import { shikiHighlighter } from "@/lib/shiki";
import { getLocale } from "@/paraglide/runtime";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  ClipboardCheck,
  PackagePlus,
  Settings2,
} from "lucide-react";
import { use, type ReactNode } from "react";

export const Route = createFileRoute("/docs/developer-setup")({
  component: DeveloperSetupDocs,
});

const registryConfig = `{
  "registries": {
    "@krak-stack": "https://krakstack.net/r/{name}.json"
  }
}`;

const installCommands = `bunx shadcn@latest add @krak-stack/data-table
bunx shadcn@latest add @krak-stack/user-button`;

const verificationCommands = `bun type:check
bun lint
bun fmt:check`;

const opencodeConfig = `{
  "$schema": "https://opencode.ai/config.json",
  "instructions": ["AGENTS.md"],
  "mcp": {
    "shadcn": {
      "type": "local",
      "command": ["bunx", "--bun", "shadcn@latest", "mcp"],
      "enabled": true
    }
  }
}`;

const content = {
  en: {
    title: "Developer setup",
    description:
      "Configure your app to install KrakStack registry items through shadcn, then add components and services by their @krak-stack registry names.",
    badge: "shadcn registry",
    installTitle: "Install checklist",
    installDescription: "Run shadcn from the project root.",
    installItems: [
      "Open the app that owns components.json.",
      "Confirm the @krak-stack registry alias is configured.",
      "Use @krak-stack/<item-name>; do not copy files from this site by hand.",
      "Install one registry item at a time.",
    ],
    reviewTitle: "Review checklist",
    reviewDescription:
      "Finish the install by checking the generated source like any other code change.",
    reviewItems: [
      "Inspect the generated diff before editing further.",
      "Keep public-facing strings localized in the host application.",
      "Run the project checks below when practical.",
      "Commit the generated source files with the feature that uses them.",
    ],
    opencodeTitle: "opencode checklist",
    opencodeDescription:
      "Set up opencode so agents can find shadcn components before writing custom UI.",
    opencodeItems: [
      "Add the shadcn MCP server to opencode.json.",
      "Keep AGENTS.md in instructions so agents read the registry workflow.",
      "Restart opencode after changing opencode.json.",
      "Before asking for custom UI, ask the agent to check shadcn MCP first.",
    ],
    configNote:
      "The registry alias belongs in components.json. Keep the URL pointed at the hosted registry for normal development.",
    registryConfigTitle: "components.json registry alias",
    registryConfigDescription:
      "Use the hosted registry for normal application development.",
    installCommandTitle: "Adding registry items",
    installCommandDescription:
      "Install items by their @krak-stack registry name instead of copying files by hand.",
  },
  fr: {
    title: "Configuration développeur",
    description:
      "Configurez votre application pour installer les éléments du registre KrakStack avec shadcn, puis ajoutez les composants et services avec leurs noms de registre @krak-stack.",
    badge: "Registre shadcn",
    installTitle: "Checklist d'installation",
    installDescription: "Lancez shadcn depuis la racine du projet.",
    installItems: [
      "Ouvrez l'application qui contient components.json.",
      "Vérifiez que l'alias de registre @krak-stack est configuré.",
      "Utilisez @krak-stack/<nom-element>; ne copiez pas les fichiers de ce site à la main.",
      "Installez un élément de registre à la fois.",
    ],
    reviewTitle: "Checklist de revue",
    reviewDescription:
      "Terminez l'installation en vérifiant le code généré comme tout autre changement.",
    reviewItems: [
      "Inspectez le diff généré avant d'autres modifications.",
      "Gardez les chaînes publiques localisées dans l'application hôte.",
      "Lancez les vérifications ci-dessous quand c'est pratique.",
      "Commitez les fichiers source générés avec la fonctionnalité qui les utilise.",
    ],
    opencodeTitle: "Checklist opencode",
    opencodeDescription:
      "Configurez opencode pour que les agents trouvent les composants shadcn avant d'écrire une UI personnalisée.",
    opencodeItems: [
      "Ajoutez le serveur MCP shadcn dans opencode.json.",
      "Gardez AGENTS.md dans instructions pour que les agents lisent le workflow du registre.",
      "Redémarrez opencode après avoir modifié opencode.json.",
      "Avant de demander une UI personnalisée, demandez à l'agent de consulter le MCP shadcn.",
    ],
    configNote:
      "L'alias du registre se configure dans components.json. Gardez l'URL sur le registre hébergé pour le développement normal.",
    registryConfigTitle: "Alias de registre components.json",
    registryConfigDescription:
      "Utilisez le registre hébergé pour le développement normal d'applications.",
    installCommandTitle: "Ajouter des éléments du registre",
    installCommandDescription:
      "Installez les éléments avec leur nom de registre @krak-stack au lieu de copier les fichiers à la main.",
  },
};

function DeveloperSetupDocs() {
  const highlighter = use(shikiHighlighter);
  const page = content[getLocale()];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl min-w-0 flex-col gap-8">
      <SidebarPageHeader
        title={page.title}
        description={page.description}
        badge={{ label: page.badge }}
      />

      <section className="grid gap-8 border-b pb-8 lg:grid-cols-2">
        <ChecklistColumn
          icon={PackagePlus}
          title={page.installTitle}
          description={page.installDescription}
          items={page.installItems}
        />
        <ChecklistColumn
          icon={ClipboardCheck}
          title={page.reviewTitle}
          description={page.reviewDescription}
          items={page.reviewItems}
        />
      </section>

      <DocSection
        title={page.registryConfigTitle}
        description={`${page.registryConfigDescription} ${page.configNote}`}
      >
        <CodeBlock
          code={registryConfig}
          highlighter={highlighter}
          language="json"
        />
      </DocSection>

      <DocSection
        title={page.installCommandTitle}
        description={page.installCommandDescription}
      >
        <CodeBlock
          code={installCommands}
          highlighter={highlighter}
          language="bash"
        />
      </DocSection>

      <DocSection
        title={page.opencodeTitle}
        description={page.opencodeDescription}
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)] lg:items-start">
          <div className="bg-muted/30 grid gap-3 rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <Settings2 className="text-primary size-4" />
              <h3 className="text-sm font-medium">opencode.json</h3>
            </div>
            <Checklist items={page.opencodeItems} compact />
          </div>
          <CodeBlock
            code={opencodeConfig}
            highlighter={highlighter}
            language="json"
          />
        </div>
      </DocSection>

      <DocSection title={page.reviewTitle} description={page.reviewDescription}>
        <CodeBlock
          code={verificationCommands}
          highlighter={highlighter}
          language="bash"
        />
      </DocSection>
    </main>
  );
}

function DocSection({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="grid gap-4 border-b pb-8 last:border-b-0 last:pb-0">
      <div className="grid gap-2">
        <h2 className="text-foreground text-3xl font-semibold tracking-tight">
          {title}
        </h2>
        <p className="text-muted-foreground max-w-3xl text-sm leading-6">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function ChecklistColumn({
  description,
  icon: Icon,
  items,
  title,
}: {
  description: string;
  icon: typeof PackagePlus;
  items: ReadonlyArray<string>;
  title: string;
}) {
  return (
    <section className="grid content-start gap-4">
      <div className="grid gap-3">
        <Icon className="text-primary size-5" />
        <div className="grid gap-1">
          <h2 className="text-base font-medium">{title}</h2>
          <p className="text-muted-foreground text-sm leading-6">
            {description}
          </p>
        </div>
      </div>
      <div>
        <Checklist items={items} />
      </div>
    </section>
  );
}

function Checklist({
  compact = false,
  items,
}: {
  compact?: boolean;
  items: ReadonlyArray<string>;
}) {
  return (
    <ul className={compact ? "grid gap-2" : "grid gap-3"}>
      {items.map((item) => (
        <li
          key={item}
          className={
            compact
              ? "flex gap-2.5 text-sm leading-5"
              : "flex gap-3 text-sm leading-6"
          }
        >
          <CheckCircle2 className="text-primary mt-0.5 size-4 shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
