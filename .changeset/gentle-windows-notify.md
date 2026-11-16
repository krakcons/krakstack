---
"@krak-stack/notifications": patch
---

Add opt-in per-delivery local-time sending windows through versioned publication
policies and existing durable deferrals. Snapshot and fingerprint validated IANA
timezone/window intent; support overnight windows and deterministic DST behavior.
Recheck windows and expiry after other dispatch checks, and preserve later
eligibility dates on manual retry. Existing unrestricted deliveries need no
configuration or migration.
