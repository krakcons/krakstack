---
"@krak-stack/notifications": patch
---

Add optional `EmailPayloadV1.fromName` to preserve sender display names with the built-in SES and SMTP transports. SES uses UTF-8 MIME encoded words, including safe chunking for long names; SMTP uses a structured sender mailbox. Reject empty names and CR/LF header injection while preserving address-only payload compatibility.
