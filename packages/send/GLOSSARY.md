# KrakSend terminology

- **Installation**: one host application/environment's isolated database or schema,
  secrets, provider account and authorization policy; not a centrally managed project.
- **Contact**: a message recipient with a profile and immutable email endpoint, not
  a login account. Creating or updating a profile never subscribes it.
- **Consent**: an explicit, audited permission for optional email. Unknown is not
  subscribed; withdrawal is separate from provider suppression.
- **Suppression**: an endpoint-level delivery block, including transactional mail,
  after an authenticated permanent bounce/complaint or an operational decision.
- **Campaign**: immutable English/French rendered content and an audience definition.
- **Audience snapshot**: subscribed contacts selected once when scheduling. Later
  subscribers are excluded; consent and safety are checked again before sending.
- **Publication / fan-out**: creating one idempotent notification delivery per
  eligible snapshot contact, in bounded durable workflow batches.
- **Completed campaign**: publication finished, not all messages delivered. Queued
  work can still be paused or cancelled; accepted/in-flight mail cannot be recalled.
- **Provider acceptance**: the provider accepted a transport attempt (`sent` in the
  notification engine), not proof of inbox delivery or reading.
- **Delivery confirmation**: a correlated, authenticated provider feedback fact.
  Distinct from acceptance and consent; duplicate facts do not inflate reports.
- **Pause**: defer queued campaign deliveries without spending provider attempts.
- **Cancellation**: skip unpublished recipients and suppress queued campaign mail
  at dispatch; not deletion of history or recall of accepted mail.
- **Sender verification**: current host/provider approval of an explicitly allowed
  sender, separate from sending enablement and non-production recipient allowlisting.
