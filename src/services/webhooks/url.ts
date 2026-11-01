const hostname = (value: string) =>
  value
    .toLowerCase()
    .replace(/^\[|\]$/g, "")
    .replace(/\.$/, "");
export const isPublicIpAddress = (value: string): boolean => {
  const address = hostname(value);
  const octets = address.split(".");
  if (
    octets.length === 4 &&
    octets.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
  ) {
    const [a = 0, b = 0, c = 0] = octets.map(Number);
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 0 || b === 168 || (b === 88 && c === 99))) ||
      (a === 198 && (b === 18 || b === 19 || b === 51)) ||
      (a === 203 && b === 0) ||
      a >= 224
    );
  }
  // Only ordinary global unicast IPv6; exclude transition and documentation ranges.
  const first = Number.parseInt(address.split(":")[0] ?? "", 16);
  return (
    address.includes(":") &&
    first >= 0x2000 &&
    first <= 0x3fff &&
    !address.startsWith("2001:") &&
    !address.startsWith("2002:") &&
    !address.startsWith("3fff:")
  );
};
export const isPublicWebhookUrl = (url: URL) => {
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password
  )
    return false;
  const host = hostname(url.hostname);
  if (
    !host ||
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local")
  )
    return false;
  return (
    !(host.includes(":") || /^\d+(?:\.\d+){3}$/.test(host)) ||
    isPublicIpAddress(host)
  );
};
export const isPublicWebhookUrlString = (value: string) => {
  try {
    return isPublicWebhookUrl(new URL(value));
  } catch {
    return false;
  }
};

export const isAllowedWebhookUrlString = (
  value: string,
  allowLoopback: boolean,
) => {
  try {
    const url = new URL(value);
    return (
      isPublicWebhookUrl(url) || (allowLoopback && isLoopbackWebhookUrl(url))
    );
  } catch {
    return false;
  }
};
import { Context } from "effect";

/** Opt in only in a local development composition root, never from a request. */
export const WebhookAllowLoopback = Context.Reference<boolean>(
  "Webhooks/AllowLoopback",
  {
    defaultValue: () => false,
  },
);

export const isLoopbackWebhookUrl = (url: URL) =>
  ["http:", "https:"].includes(url.protocol) &&
  !url.username &&
  !url.password &&
  ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
