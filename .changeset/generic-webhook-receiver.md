---
"@krak-stack/registry": patch
---

Add WebhooksReceiver with HMAC verification, timestamp checks, schema validation, and transactional receipt deduplication. Receiver-only applications migrate only receipt storage and do not start outbound workers.
