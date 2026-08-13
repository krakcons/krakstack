# @krak-stack/registry

Tree-shakable runtime components and Effect services from the KrakStack shadcn registry.

```bash
bun add @krak-stack/registry
```

Import only the subpaths used by the application:

```tsx
import { DataTable } from "@krak-stack/registry/data-table";
import { Pagination } from "@krak-stack/registry/pagination";
import { AgentService } from "@krak-stack/registry/agent";
import { AgentWidget, makeAgentAtoms } from "@krak-stack/registry/agent/client";
import { makeAgentApiGroup } from "@krak-stack/registry/agent/schema";
import { makeHttpApiAiToolkit } from "@krak-stack/registry/httpapi/ai";
import { ApiClient } from "@krak-stack/registry/httpapi/client";
import { HttpApiSpec } from "@krak-stack/registry/httpapi/helpers";
import { createMdxDocsSource, makeDocs } from "@krak-stack/registry/docs";
import { makeChatDocumentation } from "@krak-stack/registry/docs-ai";
import { Query } from "@krak-stack/registry/query";
import { createSeo } from "@krak-stack/registry/seo";
import { FileExtractionService } from "@krak-stack/registry/service-file-extraction";
import { FileExtractedTextSchema } from "@krak-stack/registry/service-file-extraction/schema";
import { NotificationService } from "@krak-stack/registry/service-notification";
```

Create a configured SEO helper once with site-wide defaults, then use it for each page:

```tsx
const siteSeo = createSeo({
  origin: "https://krakstack.net",
  locales: ["en", "fr"],
  siteName: "KrakStack",
  sameAs: ["https://github.com/krakcons/krakstack"],
});

<Route
  head={() =>
    siteSeo({
      title: "KrakStack",
      description: "Production-ready building blocks for TanStack apps.",
      locale: "en",
    })
  }
/>;
```

The returned object contains `meta`, `links`, and derived JSON-LD `scripts`. Website pages receive `WebSite` and `Organization` data; documentation pages can pass `type: "article"` for `Article` data. Use the lower-level `seo` function directly when a configured factory is not useful.

HTTP API client, schema, AI tool, CLI, and MCP utilities are available under
the `@krak-stack/registry/httpapi/*` subpaths. Keep application-specific API
layers, handlers, authentication, and client bindings in the application.

Documentation consumers create their content source in the application so Vite
can resolve the local `import.meta.glob`, then pass it to `makeDocs`.

Add the package's Tailwind source to the application stylesheet:

```css
@import "@krak-stack/registry/tailwind.css";
```

The same canonical sources remain available through shadcn:

```bash
bunx shadcn@latest add @krak-stack/data-table
```

Project-specific configuration and scaffolding remain available through shadcn.
