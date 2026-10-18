# @krak-stack/registry

Tree-shakable runtime components and Effect services from the KrakStack shadcn registry.

```bash
bun add @krak-stack/registry
```

## Effect forms

Applications using Effect forms need `@lucas-barake/effect-form@1.1.0` and
`@lucas-barake/effect-form-react@1.1.0`, which support stable Effect 4 without
compatibility patches:

```sh
bun add @lucas-barake/effect-form@1.1.0 @lucas-barake/effect-form-react@1.1.0
```

When upgrading from the patched betas, remove their `patchedDependencies`
entries and patch files, update any form version overrides to `1.1.0`, and run
`bun install`. Preserve unrelated dependency patches.

## Usage

Import only the subpaths used by the application:

```tsx
import { DataTable } from "@krak-stack/registry/data-table";
import { Pagination } from "@krak-stack/registry/pagination";
import { AgentService } from "@krak-stack/registry/agent";
import { AgentWidget, makeAgentAtoms } from "@krak-stack/registry/agent/client";
import { makeAgentApiGroup } from "@krak-stack/registry/agent/schema";
import { makeHttpApiToolkit } from "@krak-stack/registry/httpapi/toolkit";
import { makeHttpApiCli } from "@krak-stack/registry/httpapi/cli";
import { HttpApiAdapter } from "@krak-stack/registry/httpapi/adapter";
import { HttpApiOtlp } from "@krak-stack/registry/opentelemetry/api";
import { BrowserOtlp } from "@krak-stack/registry/opentelemetry/browser";
import { createDocsSource, makeDocs } from "@krak-stack/registry/docs";
import { loadMdxDocsDirectory } from "@krak-stack/registry/docs/server";
import {
  DocumentationToolkit,
  DocumentationToolkitLayer,
} from "@krak-stack/registry/documentation-toolkit";
import {
  WebFetchToolkit,
  WebFetchToolkitLayer,
} from "@krak-stack/registry/webfetch-toolkit";
import { Query } from "@krak-stack/registry/query";
import { createSeo } from "@krak-stack/registry/seo";
import { FileExtractionService } from "@krak-stack/registry/service-file-extraction";
import { FileExtractedTextSchema } from "@krak-stack/registry/service-file-extraction/schema";
import {
  HealthApiGroup,
  healthHandler,
  HealthService,
} from "@krak-stack/registry/service-health";
import { NotificationService } from "@krak-stack/registry/service-notification";
```

## OpenTelemetry

| Export                                                    | Purpose                                                                                 |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `HttpApiOtlp.layer` from `opentelemetry/api`              | Server exporters and same-origin browser ingestion routes. Includes `ServerOtlp.layer`. |
| `ServerOtlp.layer` from `opentelemetry/server`            | Exporters for workers, workflows, and CLIs without an HTTP server.                      |
| `BrowserOtlp.layer(options)` from `opentelemetry/browser` | Browser errors, traces, metrics, logs, and named events.                                |

### Setup

Provide the HTTP layer once at the application composition root:

```ts
import { Layer } from "effect";
import { HttpApiOtlp } from "@krak-stack/registry/opentelemetry/api";

const appLayer = appRoutes.pipe(Layer.provideMerge(HttpApiOtlp.layer));
```

Configure an OTLP/HTTP collector on the server:

```dotenv
OTEL_SERVICE_NAME=my-app-api
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_TRACES_EXPORTER=otlp
OTEL_METRICS_EXPORTER=otlp
OTEL_LOGS_EXPORTER=otlp
```

Analytics events require the logs signal. The proxy forwards enabled signals from
`/api/otel/v1/{traces,metrics,logs}` to the collector. Keep collector credentials
server-side. Server log endpoint/header overrides use
`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_HEADERS`, falling
back to the shared endpoint/headers; these overrides do not change proxy routing.
`OTEL_SDK_DISABLED=true` disables server export, not browser collection.

Install one browser layer on the Atom context passed to `AtomHttpApi.Service`:

```ts
import { Atom } from "effect/reactivity";
import { BrowserOtlp } from "@krak-stack/registry/opentelemetry/browser";

const apiRuntime = Atom.context();
if (!import.meta.env.SSR) {
  apiRuntime.addGlobalLayer(BrowserOtlp.layer({ serviceName: "my-app-web" }));
}
```

Mount/read `ApiClient.runtime` in the root layout to start it. Dispose long-lived
server and browser runtimes on shutdown to flush pending data.

### Browser telemetry

`BrowserOtlp.event(name, properties?, options?)` formats a generic named OTLP log
event, just like `ServerOtlp.event`. Run it in the runtime providing
`BrowserOtlp.layer({ serviceName: "my-app-web", events: {} })` to enable export.
It adds no page context, analytics identity, or sessions. `page` and SPA navigation
tracking are documented in the registry's `service-events` item. There is no
browser identify API or identity state.

| Layer option                              | Default                                                         |
| ----------------------------------------- | --------------------------------------------------------------- |
| `serviceName`                             | Required                                                        |
| `traces`                                  | `{}`; includes global exception capture. `false` disables both. |
| `events`, `logs`, `metrics`               | `false`; enable each independently with `{}`.                   |
| `baseUrl`                                 | `/api/otel`                                                     |
| `serviceVersion`, `attributes`, `headers` | Optional resource/transport metadata.                           |

### Server events and shared options

Define server events as Effects and run them inside the runtime with
`ServerOtlp.layer` (or the HTTP layer):

```ts
import { Effect } from "effect";
import { ServerOtlp } from "@krak-stack/registry/opentelemetry/server";

const orderCompleted = Effect.gen(function* () {
  yield* ServerOtlp.event("app.order.completed", { "order.total": 49 });
});
```

Server events inherit fiber-scoped log annotations, including identity supplied
by `ActorRequired` or application middleware. `AuthMiddleware` alone does not
annotate identity. Background jobs can supply identity per event.

Both generic `event` methods accept `options`:

| Option                                            | OTLP attribute / meaning                                            |
| ------------------------------------------------- | ------------------------------------------------------------------- |
| `userId`, `anonymousId`, `sessionId`, `messageId` | `user.id`, `analytics.anonymous_id`, `session.id`, `log.record.uid` |
| `context`                                         | Additional flat attributes                                          |
| `timestamp`                                       | Effect `DateTime.Utc` occurrence time; otherwise recorded now       |

Attribute precedence, lowest to highest: context, properties, explicit identity
options, scoped log annotations. Values support
strings, finite numbers, booleans, and homogeneous arrays, not nested objects.
Use stable event names and put dynamic values in attributes. Message IDs support
correlation, not guaranteed deduplication.

Events are OTLP log records with `eventName`, INFO severity, and active trace/span
IDs when available; they do not create spans. `browser.page_view`, `url.path`,
`analytics.page.name`, and `analytics.page.category` describe page events; the
analytics names are project conventions, not standardized OTel semantics.

Configure collector/storage separately. Generic telemetry generates no
visitor/session IDs or cookies. Browser flushing on hidden/pagehide is best-effort. Apply payload
and rate limits at ingestion, and keep sensitive data out of events and
high-cardinality fields out of Loki labels.

## Other services

`@krak-stack/registry/service-notification` is the source-compatible direct
dispatcher. Use the separate `@krak-stack/notifications` package for a durable
inbox, package-owned migrations, persisted delivery jobs, retries, workers, and
one-shot reminders.

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

HTTP API adapter, AI tool, and CLI utilities are available under
the `@krak-stack/registry/httpapi/*` subpaths. Keep application-specific API
layers, handlers, authentication, and client bindings in the application.

Use `@krak-stack/registry/httpapi/toolkit` for HTTP API tools.

### HTTP API tools and MCP

Static toolkits keep definitions and implementations separate:
`DocumentationToolkit` / `DocumentationToolkitLayer({ docs, locale })` and
`WebFetchToolkit` / `WebFetchToolkitLayer(options?)`. Merge the definitions with
`Toolkit.merge`, then provide their handler layers. Web-fetch options are
validated during layer acquisition through the Effect error channel.

HTTP API tools are generated dynamically, so `makeHttpApiToolkit()` returns
matching definitions and handlers together.

CLI, toolkit, and MCP registration share `HttpApiAdapter.operations`. Each operation
contains its tool name, typed `inputSchema`, derived `inputJsonSchema`, and method
annotations. Inputs use `{ params, query, headers, body }`; only the CLI turns
terminal arguments into that shape. The generated HTTP client handles wire
encoding, and payload codecs retain their transformations.

Use `makeHttpApiToolkit(config)` to construct matching tools and handlers once:

```ts
import { makeHttpApiToolkit } from "@krak-stack/registry/httpapi/toolkit";

const { toolkit, handlers } = yield * makeHttpApiToolkit();
const tools = yield * toolkit.pipe(Effect.provide(handlers));
```

Provide one `HttpApiAdapter` layer through the surrounding Effect layers:

```ts
const adapterLayer = HttpApiAdapter.layer({
  api: AppApi,
  baseUrl: "https://example.com",
  methods: ["get"],
}).pipe(Layer.provide(FetchHttpClient.layer));
```

This replaces the separate `HttpApiSpec` and `ApiClient` services. The catalogue,
input/success codecs, execution client, and result encoder all use the same API.
Import from `@krak-stack/registry/httpapi/adapter`, or install
`@krak-stack/httpapi-adapter` with shadcn. The old client/helper package subpaths
and client registry item have been removed.
Configuration is optional. Construct once and use the returned pair for agents
or MCP; the separate `HttpApiToolkit` and `HttpApiToolkitLayer` factories have
been removed.

For CLI commands, `makeHttpApiCli()` returns `{ command, run }`. Provide the same
`HttpApiAdapter` layer and supply the platform CLI services when
running commands. `run` derives the CLI version from the API metadata:

```ts
const { command, run } = yield * makeHttpApiCli();
yield * run(args);
```

`makeHttpApiCli` is the only public CLI export. `HttpApiCli`, its layer, and the
custom runners have been removed. Process arguments, platform services, error
reporting, and exit handling belong to the application's Effect runtime:

```ts
import { NodeRuntime, NodeServices } from "@effect/platform-node";

Effect.gen(function* () {
  const { run } = yield* makeHttpApiCli();
  yield* run(process.argv.slice(2));
}).pipe(
  Effect.provide(adapterLayer),
  Effect.provide(NodeServices.layer),
  NodeRuntime.runMain,
);
```

Install `@effect/platform-node` matching your Effect version for this example;
`adapterLayer` supplies the application's `HttpApiAdapter`.

For an HTTP MCP server, register the toolkit directly with Effect. Keep the
transport and server identity in the application:

```ts
import { Effect, Layer } from "effect";
import { McpProtocol, McpServer } from "effect/ai";
import { FetchHttpClient } from "effect/http";
import { HttpApiAdapter } from "@krak-stack/registry/httpapi/adapter";
import { makeHttpApiToolkit } from "@krak-stack/registry/httpapi/toolkit";
import { AppApi } from "@/api";

export const mcpLayer = Layer.effectDiscard(
  Effect.gen(function* () {
    const { toolkit, handlers } = yield* makeHttpApiToolkit({});
    yield* McpServer.registerToolkit(toolkit).pipe(Effect.provide(handlers));
  }),
).pipe(
  Layer.provideMerge(
    McpServer.layerHttp({
      name: "app",
      version: "1.0.0",
      path: "/api/mcp",
      protocols: [McpProtocol.v2025_11_25],
    }),
  ),
  Layer.provide(
    HttpApiAdapter.layer({
      api: AppApi,
      baseUrl: "http://localhost:3000",
      methods: ["get"],
    }),
  ),
  Layer.provide(FetchHttpClient.layer),
);
```

This example explicitly selects GET operations; `HttpApiAdapter` otherwise includes
all supported methods. Use `include` to narrow exposure further. Supply an
authenticated `HttpClient` instead of `FetchHttpClient.layer` when the downstream
API requires credentials. Inbound MCP authentication and authorization remain
application-owned; tool annotations are not access controls.

If intentionally exposing writes, enforce authorization or confirmation in the
application before opting out of agent approval with `needsApproval: () => false`.
Approval requirements are no longer silently disabled by an MCP adapter.

The `HttpApiMcp` service, `@krak-stack/registry/httpapi/mcp` export, and
`@krak-stack/httpapi-mcp` registry item have been removed. Replace them with the
composition above. Any Effect toolkit can be registered this way; it does not
need to originate from an HttpApi.

Documentation consumers load and compile their application-owned MDX on the
server, then pass the validated page records to `createDocsSource` and
`makeDocs`:

```ts
const pages = await loadMdxDocsDirectory("src/content/docs");
const source = createDocsSource({ pages, locales: ["en", "fr"] });
```

The `@krak-stack/registry/docs/server` export requires the Bun runtime. Keep it
behind a server-only module or server function so it is not included in browser
bundles.

Add the package's Tailwind source to the application stylesheet:

```css
@import "@krak-stack/registry/tailwind.css";
```

The same canonical sources remain available through shadcn:

```bash
bunx shadcn@latest add @krak-stack/data-table
```

Project-specific configuration and scaffolding remain available through shadcn.

## Oxlint Plugin

Projects that prefer centrally versioned rules can load the compiled anti-slop
plugin directly from the package:

```json
{
  "jsPlugins": [
    {
      "name": "anti-slop",
      "specifier": "@krak-stack/registry/oxlint/anti-slop"
    }
  ]
}
```

Use `@krak-stack/lint-format` instead when the project should receive editable,
vendored rule source under `tools/oxlint/anti-slop`.
