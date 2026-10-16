# Package releases

Changesets manages versions and release notes for these independently versioned
packages:

| Package                     | Directory                |
| --------------------------- | ------------------------ |
| `@krak-stack/registry`      | `packages/registry`      |
| `@krak-stack/assets`        | `packages/assets`        |
| `@krak-stack/notifications` | `packages/notifications` |

The private site application is not versioned or published. Publishing remains
manual; there is no automatic npm publishing or GitHub Release creation.

## Record changes

From the repository root, run:

```sh
bun run changeset
```

Select the affected package or packages, choose patch/minor/major bump levels,
and describe the consumer-facing changes. Commit the generated Markdown file
with the implementation. Do not manually bump package versions.

A changeset can cover several packages. Unrelated packages do not need to be
released together. Changesets only coordinates dependencies declared with the
`workspace:` protocol; existing published-version pins remain unchanged. In
particular, assets currently pins registry to `0.1.42` and is not automatically
upgraded whenever registry is released.

Registry source and metadata changes still require `bun run registry:build` as
described in `PROJECT_AGENTS.md`. Changesets does not replace that build.

## Prepare a release

```sh
bun run changeset status
bun run version:packages
bun install
```

Versioning consumes pending changesets, updates the affected package manifests,
and creates or updates a `CHANGELOG.md` in each affected package. Review and commit
the versions, changelogs, and `bun.lock` together with the release changes.

Until those changes are committed, `changeset status` may report changed packages
without changesets. Do not add another bump or an empty changeset to silence that
warning; review and commit the prepared release instead.

The initial setup does not bump versions or reconstruct historical changelogs.
Package changelogs start with the first release prepared through Changesets.

## Validate and publish manually

From the directory of each package being released:

```sh
bun publish --dry-run --access public
bun publish --access public
```

Run the dry run first and inspect the package contents. Existing `prepack` checks
are preserved: registry builds and checks imports; assets runs type checking,
tests, and its build; notifications requires `TEST_DATABASE_URL` and runs its
release checks. Never substitute `DATABASE_URL` for the test database.

Publish only the packages whose versions changed. If a release introduces a
dependency on another newly versioned workspace package, publish that dependency
first. Bun resolves `workspace:` dependencies into publishable version ranges.

Each generated changelog is tracked in Git and included in the npm package.
npmjs.com does not automatically display it as a release-notes page. Optional Git
tags can use `<package-name>@<version>`; no GitHub Release is created automatically.
