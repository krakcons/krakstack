# @krak-stack/registry

Tree-shakable components and Effect services from the KrakStack registry.

## Install

```bash
bun add @krak-stack/registry
```

Install the peer dependencies required by the items you use. Each item's registry documentation lists its dependencies and setup.

## Use

Import from the specific package subpaths you need:

```tsx
import { DataTable } from "@krak-stack/registry/data-table";
import { Otlp } from "@krak-stack/registry/opentelemetry";
import { BrowserOtlp } from "@krak-stack/registry/opentelemetry/browser";
```

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
