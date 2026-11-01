---
"@krak-stack/registry": minor
---

Sign the stable webhook-id header with the timestamp and raw body, and use it automatically for transactional receiver deduplication. Remove the receiver eventId extraction callback. This changes the signature protocol; senders and receivers must upgrade together. Legacy timestamp/body signatures are rejected.
