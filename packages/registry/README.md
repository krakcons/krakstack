# @krak-stack/registry

Tree-shakable runtime components and Effect services from the KrakStack shadcn registry.

```bash
bun add @krak-stack/registry
```

Import only the subpaths used by the application:

```tsx
import { DataTable } from "@krak-stack/registry/data-table";
import { Pagination } from "@krak-stack/registry/pagination";
import { NotificationService } from "@krak-stack/registry/service-notification";
```

Add the package's Tailwind source to the application stylesheet:

```css
@import "@krak-stack/registry/tailwind.css";
```

The same canonical sources remain available through shadcn:

```bash
bunx shadcn@latest add @krak-stack/data-table
```

Project-specific services, configuration, and agent scaffolding are available through shadcn only.
