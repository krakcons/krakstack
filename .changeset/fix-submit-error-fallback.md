---
"@krak-stack/registry": patch
---

Fix silent form submission failures in `SubmitError`, including typed HTTP errors such as `Forbidden` whose messages are empty.

- Display a non-empty server or domain error message first, when available.
- Otherwise, display an English or French message for recognized HTTP errors, then a generic failure message if no useful message or recognized status is available.
- Use localized HTTP status messages instead of raw HTTP-client diagnostics for recognized statuses.
- Support the provider locale and explicit `locale` and `messages` overrides.
- Continue displaying schema validation errors beside their fields rather than in the submission error display.
