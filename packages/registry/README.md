# @krak-stack/registry

Tree-shakable components and Effect services from the KrakStack registry.

## Install

```bash
bun add @krak-stack/registry
```

Install the peer dependencies required by the items you use. Each item's registry documentation lists its dependencies and setup.

Animation components require the optional `motion` peer; the phone-number input
requires the optional `libphonenumber-js` peer. Install these only when using the
corresponding components. Notification-menu consumers do not need either package.

Les composants animés nécessitent la dépendance paire facultative `motion` ; le
champ de numéro de téléphone nécessite `libphonenumber-js`. Installez ces paquets
uniquement pour les composants concernés. Le menu de notifications n'en a pas besoin.

## Shared integration documentation

Generate API, OAuth MCP, and webhook guides in a Bun server loader:

```ts
import {
  createIntegrationDocs,
  krakStackWebhookDocs,
} from "@krak-stack/registry/docs/integrations";
import { loadMdxDocsDirectory } from "@krak-stack/registry/docs/server";
import { webhookDefinitions } from "./webhook-definitions";

const pages = createIntegrationDocs({
  appName: "My App",
  origin: "https://app.example.com",
  api: true,
  mcp: true,
  webhooks: { ...krakStackWebhookDocs, events: webhookDefinitions },
  pages: await loadMdxDocsDirectory("src/content/docs"),
});
```

Pass records to `createDocsSource({ pages, locales: ["en", "fr"] })` through your
existing server function. Do not import the generator into browser code.
Each webhook definition has a `name`, `description: { en, fr }`, and an Effect
`payload` schema for the complete delivered JSON body. Reuse the sender's
definitions. The guide links an event summary to grouped field tables, expanding
references and nested objects, arrays, and dictionaries without schema dumps.
Required status applies within the containing object; variant-specific fields
are marked conditional. Source schema annotations retain their authored language.

All guides are opt-in. MCP assumes remote Streamable HTTP with OAuth.
`krakStackWebhookDocs` explicitly selects the KrakStack webhook sender's public
signing and delivery policy. Other senders must supply localized `verification`
and `delivery` Markdown. Never pass secrets. `webhooks: true` keeps the generic
guide without event definitions or sender-specific policies.

Defaults are `/docs/api-access`, `/docs/mcp`, `/docs/webhooks`, English/French,
section `integration`, and orders 1000–1002. Configure `basePath`, `section`,
`order`, `locales`, `api: { referenceUrl }`, or `mcp: { url }` as needed.
Local `pages` replace defaults by locale and slug. Reserve unique orders and
matching routing metadata across translations. This does not install endpoints.
For copied sources, install `@krak-stack/docs-integrations`.

Générez les guides API, MCP OAuth et webhooks sur le serveur Bun. Les définitions
d’événements produisent des tableaux de champs lisibles et regroupés par charge
utile. Réutilisez `krakStackWebhookDocs` pour les instructions de vérification et
de livraison de l’émetteur KrakStack. Les guides sont facultatifs et disponibles
en français et en anglais ; les pages locales remplacent les valeurs par défaut.

## Use

Import from the specific package subpaths you need:

```tsx
import { DataTable } from "@krak-stack/registry/data-table";
import { Otlp } from "@krak-stack/registry/opentelemetry";
import { BrowserOtlp } from "@krak-stack/registry/opentelemetry/browser";
import { Speech } from "@krak-stack/registry/speech";
```

Speech-to-text and text-to-speech use Cloudflare AI Gateway. See the [speech setup and API contract](https://krakstack.net/docs/speech); authentication and quotas stay application-owned. Schemas and the optional HTTP API contract are available from `@krak-stack/registry/speech/schema` and `@krak-stack/registry/speech/api`.

For durable notifications, install `@krak-stack/notifications@0.3.0` for the Effect
backend and optionally `@krak-stack/notifications-admin@0.1.0` for React admin views
and Effect Atom helpers. The admin views reuse registry's generic tables and forms.
Import notification administration exclusively from notifications-admin; registry
does not export these screens or depend on either notification SDK. The admin SDK
can use the published registry 0.2.2 primitives without a new registry release.
Legacy engine exports remain unchanged and are not redirected to a new backend.

For packaged UI components, include the Tailwind source in your application stylesheet:

```css
@import "@krak-stack/registry/tailwind.css";
```

To install editable source instead of importing the package, use the shadcn registry:

```bash
bunx shadcn@latest add https://krakstack.net/r/data-table.json
```

## Find components and documentation

- [KrakStack registry and docs](https://krakstack.net): browse items, dependencies, setup and usage.
- [Package exports](./package.json): available import subpaths.
- [Registry definitions](../../registry.json): item names, source files and documentation.
- [Source code](https://github.com/krakcons/krakstack): implementations and examples.
- [Changelog](./CHANGELOG.md): package releases.
