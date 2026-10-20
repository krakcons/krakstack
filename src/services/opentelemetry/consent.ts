import { Effect, Option, Schema } from "effect";
import { BrowserAnalyticsPreference, BrowserPrivacySignals } from "./schema";

export const ANALYTICS_CONSENT_COOKIE = "krakstack_analytics_consent";
export const ANALYTICS_NOTICE_VERSION = "1";
const changedEvent = "krakstack:analytics-consent";
const lifetime = 180 * 24 * 60 * 60 * 1000;

const codec = Schema.StringFromUriComponent.pipe(
  Schema.decodeTo(Schema.fromJsonString(BrowserAnalyticsPreference)),
);

const readCookie = (cookie: string) =>
  cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ANALYTICS_CONSENT_COOKIE}=`))
    ?.slice(ANALYTICS_CONSENT_COOKIE.length + 1);

export const analyticsPreference = (cookie: string, now = Date.now()) => {
  const value = readCookie(cookie);
  if (!value) return undefined;
  // Cookie values are URI encoded at the browser boundary. Invalid values fail closed.
  const decoded = Schema.decodeUnknownOption(codec)(value);
  if (Option.isNone(decoded)) return undefined;
  const preference = decoded.value;
  return preference.version === ANALYTICS_NOTICE_VERSION &&
    preference.issuedAt <= now &&
    preference.expiresAt > now &&
    preference.expiresAt - preference.issuedAt <= lifetime
    ? preference
    : undefined;
};

/** Server-side check; request headers are opt-out signals, never proof of consent. */
export const hasAnalyticsConsent = (
  cookie: string,
  headers: Readonly<Record<string, string | undefined>> = {},
) =>
  analyticsPreference(cookie)?.choice === "accepted" &&
  headers.dnt !== "1" &&
  headers.dnt !== "yes" &&
  headers["sec-gpc"] !== "1";

export const browserPrivacyEnabled = () => {
  if (globalThis.navigator === undefined) return false;
  const value = Schema.decodeUnknownOption(BrowserPrivacySignals)(navigator);
  return (
    navigator.doNotTrack === "1" ||
    navigator.doNotTrack === "yes" ||
    (Option.isSome(value) && value.value.globalPrivacyControl === true)
  );
};

const browserPreference = () => {
  if (globalThis.document === undefined) return undefined;
  const cookie = Effect.runSync(
    Effect.try({
      try: () => document.cookie,
      catch: () => new Error("Analytics preference storage unavailable"),
    }).pipe(Effect.catch(() => Effect.succeed(""))),
  );
  return analyticsPreference(cookie);
};

let consentGeneration = 0;
let previousSnapshot: string | undefined;

export const analyticsConsentSnapshot = () => {
  const preference = browserPreference();
  const snapshot = browserPrivacyEnabled()
    ? "blocked"
    : preference
      ? `${preference.choice}:${preference.revision}`
      : "pending";
  if (snapshot !== previousSnapshot) {
    consentGeneration++;
    previousSnapshot = snapshot;
  }
  return snapshot;
};

export const analyticsAllowed = () =>
  analyticsConsentSnapshot().startsWith("accepted:");

/** Document-wide measurements require acceptance before navigation began. */
export const analyticsAcceptedBefore = (timestamp: number) =>
  analyticsAllowed() &&
  (browserPreference()?.issuedAt ?? Infinity) <= timestamp;

/** A queued event is invalid forever if consent changes before export. */
export const analyticsExportGuard = () => {
  const snapshot = analyticsConsentSnapshot();
  const generation = consentGeneration;
  return () =>
    snapshot.startsWith("accepted:") &&
    analyticsConsentSnapshot() === snapshot &&
    consentGeneration === generation;
};

export const saveAnalyticsPreference = (choice: "accepted" | "declined") => {
  const issuedAt = Date.now();
  const value = Schema.encodeSync(codec)({
    choice,
    revision: crypto.randomUUID(),
    version: ANALYTICS_NOTICE_VERSION,
    issuedAt,
    expiresAt: issuedAt + lifetime,
  });
  document.cookie = `${ANALYTICS_CONSENT_COOKIE}=${value}; Path=/; Max-Age=${lifetime / 1000}; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  globalThis.dispatchEvent(new Event(changedEvent));
  return analyticsPreference(document.cookie)?.choice === choice;
};

/** Polling covers cross-tab cookie changes, expiry and browser signal changes. */
export const subscribeAnalyticsConsent = (listener: () => void) => {
  let previous = analyticsConsentSnapshot();
  const notify = () => {
    const next = analyticsConsentSnapshot();
    if (next === previous) return;
    previous = next;
    listener();
  };
  const timer = globalThis.setInterval(notify, 1000);
  globalThis.addEventListener(changedEvent, notify);
  globalThis.addEventListener("focus", notify);
  document.addEventListener("visibilitychange", notify);
  return () => {
    globalThis.clearInterval(timer);
    globalThis.removeEventListener(changedEvent, notify);
    globalThis.removeEventListener("focus", notify);
    document.removeEventListener("visibilitychange", notify);
  };
};
