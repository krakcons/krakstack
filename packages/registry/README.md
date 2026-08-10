# @krak-stack/registry

KrakStack's shadcn registry manifests, published for programmatic use in other projects.

## Install

```bash
bun add @krak-stack/registry
```

The package root exports the complete registry. Every registry item is also available by name, with or without the `.json` extension.

```ts
import registry from "@krak-stack/registry" with { type: "json" };
import dataTable from "@krak-stack/registry/data-table" with {
  type: "json",
};
import auth from "@krak-stack/registry/krakstack-auth.json" with {
  type: "json",
};
```

These are shadcn registry manifests rather than runtime component exports. Use them to compose registries, expose registry endpoints, or inspect item metadata and source files.
