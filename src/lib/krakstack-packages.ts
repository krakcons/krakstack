import { Package } from "lucide-react";

import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";

const authReadme = {
  en: `# @krak-stack/auth

Effect schemas and typed HttpApi clients for KrakStack Auth.

## Install

\`\`\`sh
bun add @krak-stack/auth effect
\`\`\`

## Environment

- \`VITE_KRAKSTACK_AUTH_URL\` - KrakStack Auth origin
- \`KRAKSTACK_AUTH_SERVICE_API_KEY\` - service API key for server clients

## Backend API

\`\`\`ts
import { Effect } from "effect";
import { AuthClient } from "@krak-stack/auth/backend";

const users = await Effect.runPromise(
  Effect.gen(function* () {
    const client = yield* AuthClient;
    return yield* client.listUsersByIds({
      query: { ids: "user_1,user_2" },
    });
  }).pipe(Effect.provide(AuthClient.layer)),
);
\`\`\`

## Frontend API

\`\`\`ts
import { Effect } from "effect";
import { AuthClient } from "@krak-stack/auth/frontend";

const organizations = await Effect.runPromise(
  Effect.gen(function* () {
    const client = yield* AuthClient;
    return yield* client.listUserOrganizations({
      params: { userId: "user_1" },
    });
  }).pipe(Effect.provide(AuthClient.layer)),
);
\`\`\`

The frontend subpath also exports \`FrontendApiClient\` for Atom-based browser state.
`,
  fr: `# @krak-stack/auth

Schémas Effect et clients HttpApi typés pour KrakStack Auth.

## Installation

\`\`\`sh
bun add @krak-stack/auth effect
\`\`\`

## Environnement

- \`VITE_KRAKSTACK_AUTH_URL\` - origine KrakStack Auth
- \`KRAKSTACK_AUTH_SERVICE_API_KEY\` - clé API de service pour les clients serveur

## API backend

\`\`\`ts
import { Effect } from "effect";
import { AuthClient } from "@krak-stack/auth/backend";

const users = await Effect.runPromise(
  Effect.gen(function* () {
    const client = yield* AuthClient;
    return yield* client.listUsersByIds({
      query: { ids: "user_1,user_2" },
    });
  }).pipe(Effect.provide(AuthClient.layer)),
);
\`\`\`

## API frontend

\`\`\`ts
import { Effect } from "effect";
import { AuthClient } from "@krak-stack/auth/frontend";

const organizations = await Effect.runPromise(
  Effect.gen(function* () {
    const client = yield* AuthClient;
    return yield* client.listUserOrganizations({
      params: { userId: "user_1" },
    });
  }).pipe(Effect.provide(AuthClient.layer)),
);
\`\`\`

Le sous-chemin frontend exporte aussi \`FrontendApiClient\` pour l'état navigateur basé sur Atom.
`,
} as const;

export const krakstackPackages = [
  {
    id: "auth",
    name: "@krak-stack/auth",
    title: () => m.krakstack_package_auth_title(),
    description: () => m.krakstack_package_auth_description(),
    badge: () => m.krakstack_package_auth_badge(),
    installCommand: "bun add @krak-stack/auth effect",
    npmHref: "https://www.npmjs.com/package/@krak-stack/auth",
    readmeHref:
      "https://github.com/krakcons/krakstack-auth/blob/main/packages/sdk/README.md",
    docsHref: "/docs/packages/auth",
    readme: () => authReadme[getLocale()],
    icon: Package,
  },
] as const;

export function getKrakstackPackage(
  id: (typeof krakstackPackages)[number]["id"],
) {
  return krakstackPackages.find((pkg) => pkg.id === id);
}
