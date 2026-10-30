# Data-table column filters

The Filters menu is enabled by default. Filters combine with **AND**, alongside global search. Multiple selected values within one filter combine with **OR**. Applying or clearing a filter resets pagination to page zero. Both built-in export formats use the filtered, sorted result across all loaded pages unless `scope: "currentPage"` is specified.

## Column configuration

Column headers also expose **Filters**, using the same editor and query state as the toolbar. Combined columns offer their logical fields in a submenu. Filtered headers show an indicator and a clear action that removes only that column's filters, leaving other columns unchanged.

Filter controls follow the column type:

| Column                          | Control                                                           |
| ------------------------------- | ----------------------------------------------------------------- |
| Text / reference                | Contains, equals, starts with, or ends with; case-insensitive     |
| Number                          | Inclusive minimum/maximum; either bound may be omitted            |
| Date / date-time                | Inclusive calendar-date range; date-times are compared by UTC day |
| Boolean                         | True or false, using configured boolean labels when supplied      |
| List                            | Multi-select by item `value`, falling back to its label           |
| Any column with `filterOptions` | Multi-select by model value, with caller-provided labels          |

```tsx
const columns: DataTableColDef<Person>[] = [
  { field: "score", headerName: labels.score, type: "number" },
  {
    field: "status",
    headerName: labels.status,
    filterOptions: [
      { value: "active", label: labels.active },
      { value: "invited", label: labels.invited },
    ],
  },
  { field: "id", headerName: labels.id, filterable: false },
];
```

Set `filterable: false` to exclude a column from filtering, or `features.filtering: false` to hide both toolbar and header filter controls. Hiding a visual column does not disable its filters. Existing filter state still applies when the controls are hidden, just as existing sort state applies when sorting controls are hidden.

Provide the full valid set of `filterOptions` for categorical columns, not just values found on the current page. Labels are localized by the application; option values should be stable domain identifiers. When the normal `valueGetter` returns a translated display/export value, add `filterValueGetter` to supply its stable scalar filter value without changing presentation. Option lists with more than eight choices include search; searching options does not discard selected values. List columns derive options from loaded items only when no explicit options are supplied. Fetching remote options remains application-owned.

An option may also include `count`, rendered as a badge beside its label. Counts remain application-owned: this supports permission-aware actionable-request counts without teaching the table about requests or authorization. For example, `{ value: "request pending", label: labels.requests, count: actionableRequests }`. Counts do not affect matching. Filter menus use a wider, viewport-constrained default, and longer field labels truncate rather than wrap.

Combined columns use their logical `fields` as separate filter targets. For example, `learner.name` and `learner.email` appear independently without adding visual columns. A parent's `filterable: false` disables filtering for all of its fields; individual fields can also opt out. Supply localized field labels and option labels in the consuming application. Built-in controls include English and French defaults and support the normal `messages` overrides.

## Query state and validation

`Query`, `QueryStandard`, and `QueryType` include optional `filters`:

```ts
const filters: readonly ColumnFilter[] = [
  {
    id: "learner.email",
    kind: "text",
    operator: "endsWith",
    value: "@example.com",
  },
  { id: "score", kind: "number", min: 0, max: 100 },
  { id: "createdAt", kind: "date", from: "2026-01-01", to: "2026-01-31" },
  { id: "active", kind: "boolean", value: false },
  { id: "status", kind: "values", values: ["active", "invited"] },
];
```

Import `ColumnFilter` from the query helpers (`@/lib/query` for registry installations, or `@krak-stack/registry/query` for the package). Reuse `QueryStandard` for route-search validation and pass the decoded search state to the table. Clearing filters removes `filters` from the query. Filters are not stored in column-preference local storage.

Effect schemas reject malformed operators, non-finite numbers, empty/reversed ranges, invalid calendar dates, and empty value selections. The UI keeps incomplete drafts local and leaves the last applied filter intact until a valid replacement is submitted. Missing or invalid typed row values do not match numeric, date, or boolean filters. Unknown or incompatible filter IDs are ignored locally, allowing stale links to survive column configuration changes.

Router/JSON state retains the structured array. For HTTP endpoints using `Query`, `Schema.toCodecStringTree(Query)` encodes `filters` as a schema-validated JSON string and decodes it back into the typed array.

## Server pagination

With `pagination: { mode: "server", rowCount }`, the table emits filters through `onStateChange` but does **not** re-filter the current page or fetch additional pages. The application must implement these operators and recognize permitted column/field IDs in its API. Validate and allowlist server fields; never interpolate filter IDs into SQL.

The default export includes only rows already supplied to the table. Use an app-provided export action for full-result server exports, with the same filters, sorting, and authorization as the list endpoint.
