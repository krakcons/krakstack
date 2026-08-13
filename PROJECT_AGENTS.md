# Project-Specific Agent Instructions

## Registry Metadata

- When changing a registry item, set its `meta.updatedAt` value in `registry.json` to the current date in `YYYY-MM-DD` format.
- When adding a registry item, set both `meta.createdAt` and `meta.updatedAt` to the current date in `YYYY-MM-DD` format.
- Run `bun run registry:build` after changing registry source or metadata so generated registry artifacts stay current.
