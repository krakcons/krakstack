# @krak-stack/registry

## 0.1.48

### Patch Changes

- Fix Effect Form image previews for newly selected and replacement files. Use full-width image attachment rows with consistently sized, bordered previews, truncated filenames, compact file type and size metadata, and replace/delete actions aligned to the right. Replace the refresh icon with upload icons for changing images and files.

## 0.1.47

### Patch Changes

- Display language names in their native language in the UI language switcher so users can recognize their language regardless of the active UI locale. Editing-locale selectors continue to use translated language names.

## 0.1.46

### Patch Changes

- Highlight sidebar sections on nested routes using TanStack Router's built-in link matching. Add an exact option for overview and index links that should only highlight their own page. Ignore search parameters when determining active links.

## 0.1.45

### Patch Changes

- Support initial hidden columns through `DataTable.initialState.columnVisibility`, with saved user preferences taking precedence. Improve list columns with primary item actions, item menus for nonempty lists, responsive dropdowns, and truncated labels. Consolidate the column-type examples into one kitchen-sink preview.

- Preserve decoded pagination defaults in QueryStandard. Use TanStack Router's stripSearchParams({ page: 0, pageSize: 20 }) search middleware on the root route to omit defaults from URLs without making validated search state optional.
