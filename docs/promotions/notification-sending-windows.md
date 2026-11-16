# Promotion brief: notification sending windows

**Audience:** teams sending optional notifications across recipient timezones.

**Problem:** optional mail needs local-time delivery restrictions without delaying
transactional mail or maintaining a separate scheduler.

**Message (English):** Give selected deliveries local-time sending windows.
KrakStack durably defers work and rechecks retries while transactional mail stays
immediate unless explicitly restricted.

**Message (French):** Définissez des plages horaires locales pour certains envois.
KrakStack reporte les envois durablement et vérifie chaque nouvelle tentative,
sans retarder les courriels transactionnels non restreints.

**Demo:** configure an optional email for `23:00`–`05:00 America/Edmonton` beside
an unrestricted transactional receipt. Keep the existing worker running.

**Proof:** injected-clock timezone/DST tests plus PostgreSQL coverage for restart
recovery, retries, attempt budgets, expiry and consent withdrawal.

**Boundaries:** opt-in per delivery, snapshotted configuration, existing versioned
policies and queue. Not recurring digest generation, inbox-arrival scheduling or a
delivery-time guarantee. Consumers own timezone selection, consent and content.

**Call to action:** see the sending-window section in
[`packages/notifications/PUBLICATION.md`](../../packages/notifications/PUBLICATION.md#sending-windows).
Announce only after an authorized package release; this brief does not authorize
publishing or consumer upgrades.
