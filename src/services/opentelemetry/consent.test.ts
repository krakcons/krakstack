// @vitest-environment jsdom
import { describe, expect, it } from "@effect/vitest";
import { afterEach, vi } from "vitest";
import {
  ANALYTICS_CONSENT_COOKIE,
  analyticsAllowed,
  analyticsConsentSnapshot,
  analyticsExportGuard,
  analyticsPreference,
  hasAnalyticsConsent,
  saveAnalyticsPreference,
  subscribeAnalyticsConsent,
} from "./consent";
import { sanitizeBrowserException } from "./browser";

afterEach(() => {
  document.cookie = `${ANALYTICS_CONSENT_COOKIE}=; Max-Age=0; Path=/`;
  Reflect.deleteProperty(navigator, "doNotTrack");
  Reflect.deleteProperty(navigator, "globalPrivacyControl");
  vi.useRealTimers();
});

describe("analytics consent", () => {
  it("fails closed without a valid current choice", () => {
    expect(analyticsAllowed()).toBe(false);
    expect(analyticsConsentSnapshot()).toBe("pending");
    expect(
      analyticsPreference(`${ANALYTICS_CONSENT_COOKIE}=%not-json`),
    ).toBeUndefined();
    expect(hasAnalyticsConsent("")).toBe(false);
  });
  it("remembers either choice for 180 days and rejects outdated versions", () => {
    expect(saveAnalyticsPreference("accepted")).toBe(true);
    const cookie = document.cookie;
    expect(hasAnalyticsConsent(cookie)).toBe(true);
    expect(
      analyticsPreference(cookie, Date.now() + 181 * 86400000),
    ).toBeUndefined();
    expect(
      analyticsPreference(
        cookie.replace("version%22%3A%221", "version%22%3A%220"),
      ),
    ).toBeUndefined();
    expect(saveAnalyticsPreference("declined")).toBe(true);
    expect(analyticsAllowed()).toBe(false);
  });
  for (const flag of ["doNotTrack", "globalPrivacyControl"]) {
    it(`${flag} overrides but does not overwrite acceptance`, () => {
      saveAnalyticsPreference("accepted");
      const cookie = document.cookie;
      Object.defineProperty(navigator, flag, {
        configurable: true,
        value: flag === "doNotTrack" ? "1" : true,
      });
      expect(analyticsConsentSnapshot()).toBe("blocked");
      expect(analyticsAllowed()).toBe(false);
      expect(document.cookie).toBe(cookie);
      Reflect.deleteProperty(navigator, flag);
      expect(analyticsAllowed()).toBe(true);
      expect(hasAnalyticsConsent(cookie, { dnt: "1" })).toBe(false);
      expect(hasAnalyticsConsent(cookie, { "sec-gpc": "1" })).toBe(false);
    });
    it(`${flag} permanently invalidates queued analytics without replacing the saved choice`, () => {
      saveAnalyticsPreference("accepted");
      const guard = analyticsExportGuard();
      const cookie = document.cookie;
      Object.defineProperty(navigator, flag, {
        configurable: true,
        value: flag === "doNotTrack" ? "1" : true,
      });
      // Any consent reader (including polling) observes the opt-out, not just this guard.
      expect(analyticsAllowed()).toBe(false);
      Reflect.deleteProperty(navigator, flag);
      expect(analyticsAllowed()).toBe(true);
      expect(document.cookie).toBe(cookie);
      expect(guard()).toBe(false);
      expect(analyticsExportGuard()()).toBe(true);
    });
  }
  it("never revives queued events after withdrawal and reacceptance", () => {
    saveAnalyticsPreference("accepted");
    const guard = analyticsExportGuard();
    expect(guard()).toBe(true);
    saveAnalyticsPreference("declined");
    expect(guard()).toBe(false);
    saveAnalyticsPreference("accepted");
    expect(guard()).toBe(false);
    expect(analyticsExportGuard()()).toBe(true);
  });
  it("notifies on same-tab and cross-tab cookie changes and releases polling", () => {
    vi.useFakeTimers();
    const listener = vi.fn();
    const stop = subscribeAnalyticsConsent(listener);
    saveAnalyticsPreference("accepted");
    expect(listener).toHaveBeenCalledTimes(1);
    document.cookie = `${ANALYTICS_CONSENT_COOKIE}=; Max-Age=0; Path=/`;
    vi.advanceTimersByTime(1000);
    expect(listener).toHaveBeenCalledTimes(2);
    stop();
    expect(vi.getTimerCount()).toBe(0);
  });
});

it("essential diagnostics remove arbitrary messages and sensitive stack context", () => {
  expect(
    sanitizeBrowserException({
      type: "window.error",
      stack:
        "Error: user@example.com token=secret\n at privateUser (https://site.test/users/123/app.js?token=secret:10:2)\n at secretFunction (https://site.test/private/chunk.js:20:3)",
    }),
  ).toEqual({ message: "Browser error", stack: "chunk.js:20:3" });
});
