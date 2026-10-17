# Project-Specific Agent Instructions

## Language Lists

- In the UI language switcher, always display language names in their own language (autonyms), regardless of the active UI locale: use `English` and `Français`, never `Anglais` or `French`. This includes message overrides and helps users find a familiar language. Surrounding labels should still follow the UI locale. Editing-locale selectors may display language names translated into the user's UI language.

## Registry Metadata

- When changing a registry item, set its `meta.updatedAt` value in `registry.json` to the current date in `YYYY-MM-DD` format.
- When adding a registry item, set both `meta.createdAt` and `meta.updatedAt` to the current date in `YYYY-MM-DD` format.
- Run `bun run registry:build` after changing registry source or metadata so generated registry artifacts stay current.
