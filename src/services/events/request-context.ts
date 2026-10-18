import Bowser from "bowser";
import { Option, Schema } from "effect";

import type { EventAttributes } from "../opentelemetry/schema";
import {
  EventIpAddress,
  EventCountry,
  EventRegion,
  EventCity,
  type EventGeolocation,
} from "./schema";

/** Enable only behind a verified Cloudflare ingress that prevents origin bypass. */
export const cloudflareGeolocation = (
  headers: Readonly<Record<string, string | undefined>>,
): EventGeolocation => ({
  ip: Option.getOrUndefined(
    Schema.decodeUnknownOption(EventIpAddress)(headers["cf-connecting-ip"]),
  ),
  country: Option.getOrUndefined(
    Schema.decodeUnknownOption(EventCountry)(headers["cf-ipcountry"]),
  ),
  region: Option.getOrUndefined(
    Schema.decodeUnknownOption(EventRegion)(headers["cf-region-code"]),
  ),
  city: Option.getOrUndefined(
    Schema.decodeUnknownOption(EventCity)(headers["cf-ipcity"]),
  ),
});

export const geolocationAttributes = (location: EventGeolocation | null) => {
  const attributes: Record<string, EventAttributes[string]> = {};
  if (location?.country) {
    attributes["geo.country.iso_code"] = location.country;
    if (location.region)
      attributes["geo.region.iso_code"] =
        `${location.country}-${location.region}`;
  }
  if (location?.city) attributes["geo.locality.name"] = location.city;
  return attributes;
};

export const deviceContext = (userAgent: string): EventAttributes => {
  const parsed = userAgent ? Bowser.parse(userAgent) : undefined;
  return {
    "browser.name": parsed?.browser.name ?? "unknown",
    "os.name": parsed?.os.name ?? "unknown",
    "device.type": parsed?.platform.type ?? "unknown",
  };
};
