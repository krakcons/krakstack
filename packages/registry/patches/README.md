# Temporary Effect form compatibility patches

These patches backport the stable Effect 4 changes from upstream commit
[`c10a53e041c9b0b338b26b2af66be5eb24f07d47`](https://github.com/lucas-barake/effect-form/commit/c10a53e041c9b0b338b26b2af66be5eb24f07d47).
The fixed npm packages are awaiting [release PR #111](https://github.com/lucas-barake/effect-form/pull/111).

The patches update reactivity imports in shipped JavaScript, TypeScript
declarations, and source, and change Effect peer ranges to `^4.0.0`.
They do not change form behavior or package versions.

## Installation

The workspace-root `package.json` configures `patchedDependencies` and exact
version overrides for both packages. Run `bun install` to apply them; commit
these patch files, `package.json`, and `bun.lock` together. In a monorepo, configure
the patches at the workspace root, not inside individual packages.

Patches do **not** propagate from a published KrakStack package to a consuming
application. Every application using the affected form packages must configure
both patches itself. The interim Auth and Registry packages also ship copies
under `patches/` for consumers to copy into their application roots.

## Removing the workaround

After upstream publishes `@lucas-barake/effect-form@0.25.0-beta.7` and
`@lucas-barake/effect-form-react@0.26.0-beta.6` (or newer compatible releases):

1. Update direct dependencies and KrakStack peer requirements to the fixed versions.
2. Remove the two form overrides and `patchedDependencies` entries.
3. Remove these two patch files and any copies shipped with KrakStack packages.
4. Run `bun install`, then the project's type, test, and release checks.
