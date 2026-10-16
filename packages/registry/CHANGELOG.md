# @krak-stack/registry

## 0.1.46

### Patch Changes

- Highlight sidebar sections on nested routes using TanStack Router's built-in link matching. Add an exact option for overview and index links that should only highlight their own page. Ignore search parameters when determining active links.

## 0.1.45

### Patch Changes

- Support initial hidden columns through `DataTable.initialState.columnVisibility`, with saved user preferences taking precedence. Improve list columns with primary item actions, item menus for nonempty lists, responsive dropdowns, and truncated labels. Consolidate the column-type examples into one kitchen-sink preview.

- Preserve decoded pagination defaults in QueryStandard. Use TanStack Router's stripSearchParams({ page: 0, pageSize: 20 }) search middleware on the root route to omit defaults from URLs without making validated search state optional.
