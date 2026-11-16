---
"@krak-stack/notifications-admin": patch
---

Expose focused delivery overview, activity, detail and attempt-history modules,
plus standalone feedback, suppression and suppression-audit views. Retain existing
screens with optional host navigation, selectable operations views and typed table
customization with stable table identities.

Add an optional query lifecycle hook for polling, retained pagination totals and
failed-read clearing. Apply configured delivery scope consistently, isolate
operations caches by host/session, support host HttpClient layers, and accept
notifications 0.3.x/0.4.x and registry 0.2.x/0.10.x to avoid unnecessary nested peer
copies. Existing screen exports and legacy operations factory
calls remain supported.
