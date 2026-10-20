// @vitest-environment jsdom
import { describe, expect, it } from "@effect/vitest";
import { afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TrackingNotice, type TrackingNoticeMessages } from "./tracking-notice";
import { KrakstackProvider } from "@/components/ui/krakstack-provider";
import {
  ANALYTICS_CONSENT_COOKIE,
  analyticsAllowed,
} from "../../opentelemetry/consent";

const messages: TrackingNoticeMessages = {
  preferences: "Preferences",
  title: "Analytics",
  description: "Details",
  learnMore: "Learn more",
  details: "How analytics works",
  essential: "Diagnostics",
  privacy: "Policy",
  accept: "Accept",
  decline: "Decline",
  close: "Close",
  blocked: "Blocked",
  accepted: "Accepted",
  declined: "Declined",
  pending: "Pending",
  error: "Cannot save",
};
afterEach(() => {
  cleanup();
  document.cookie = `${ANALYTICS_CONSENT_COOKIE}=; Max-Age=0; Path=/`;
});

describe("tracking notice", () => {
  it("works with default copy and lets applications override individual messages", () => {
    render(<TrackingNotice messages={{ title: "Your choice" }} />);
    expect(screen.getByRole("region", { name: "Your choice" })).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Accept analytics" }),
    ).toBeDefined();
  });
  it("uses the shared locale and supports an explicit locale override", () => {
    const view = render(
      <KrakstackProvider locale="fr-CA">
        <TrackingNotice />
      </KrakstackProvider>,
    );
    expect(
      screen.getByRole("button", { name: "En savoir plus" }),
    ).toBeDefined();
    view.rerender(
      <KrakstackProvider locale="fr-CA">
        <TrackingNotice locale="en" />
      </KrakstackProvider>,
    );
    expect(screen.getByRole("button", { name: "Learn more" })).toBeDefined();
  });
  it("supports a custom learn-more link while keeping preferences available", () => {
    render(
      <TrackingNotice
        messages={messages}
        privacyHref="https://example.com/privacy"
      />,
    );
    expect(
      screen.getByRole("link", { name: "Learn more" }).getAttribute("href"),
    ).toBe("https://example.com/privacy");
    expect(screen.queryByRole("button", { name: "Learn more" })).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Preferences" }));
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(
      screen.getByRole("link", { name: "Policy" }).getAttribute("href"),
    ).toBe("https://example.com/privacy");
    expect(analyticsAllowed()).toBe(false);
  });
  it("opens details without changing consent", () => {
    render(<TrackingNotice messages={messages} />);
    fireEvent.click(screen.getByRole("button", { name: "Learn more" }));
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.queryByRole("link", { name: "Policy" })).toBeNull();
    expect(analyticsAllowed()).toBe(false);
  });
  it("dismisses without granting consent and allows acceptance and withdrawal through preferences", () => {
    render(<TrackingNotice messages={messages} privacyHref="/privacy" />);
    expect(analyticsAllowed()).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(analyticsAllowed()).toBe(false);
    expect(screen.queryByRole("region", { name: "Analytics" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Preferences" }));
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    expect(analyticsAllowed()).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Preferences" }));
    fireEvent.click(screen.getByRole("button", { name: "Decline" }));
    expect(analyticsAllowed()).toBe(false);
  });
  it("remembers refusal instead of repeatedly showing the initial notice", () => {
    const view = render(
      <TrackingNotice messages={messages} privacyHref="/privacy" />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Decline" }));
    view.unmount();
    render(<TrackingNotice messages={messages} privacyHref="/privacy" />);
    expect(screen.queryByRole("region", { name: "Analytics" })).toBeNull();
    expect(analyticsAllowed()).toBe(false);
  });
});
