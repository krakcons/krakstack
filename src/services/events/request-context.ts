import { isIP } from "node:net";
import Bowser from "bowser";
import { Option, Schema } from "effect";

import type { EventAttributes } from "../opentelemetry/schema";

const IpAddress = Schema.String.check(
  Schema.makeFilter((value) => isIP(value) !== 0 || "Invalid IP address"),
);
const Country = Schema.String.check(
  Schema.isPattern(/^[A-Z]{2}$/),
  Schema.makeFilter(
    (value) => !["XX", "T1"].includes(value) || "Unknown country",
  ),
);
const Location = Schema.NonEmptyString.check(Schema.isMaxLength(128));
const Region = Schema.String.check(Schema.isPattern(/^[A-Z0-9]{1,3}$/));

/** Enable only behind a verified Cloudflare ingress that prevents origin bypass. */
export const cloudflareContext = (
  headers: Readonly<Record<string, string | undefined>>,
) => {
  const ip = Schema.decodeUnknownOption(IpAddress)(headers["cf-connecting-ip"]);
  const attributes: Record<string, EventAttributes[string]> = {};
  const country = Schema.decodeUnknownOption(Country)(headers["cf-ipcountry"]);
  const region = Schema.decodeUnknownOption(Region)(headers["cf-region-code"]);
  const city = Schema.decodeUnknownOption(Location)(headers["cf-ipcity"]);
  if (Option.isSome(country)) {
    attributes["geo.country.iso_code"] = country.value;
    if (Option.isSome(region))
      attributes["geo.region.iso_code"] = `${country.value}-${region.value}`;
  }
  if (Option.isSome(city)) attributes["geo.locality.name"] = city.value;
  return { ip: Option.getOrUndefined(ip), attributes };
};

export const deviceContext = (userAgent: string): EventAttributes => {
  const parsed = userAgent ? Bowser.parse(userAgent) : undefined;
  return {
    "browser.name": parsed?.browser.name ?? "unknown",
    "os.name": parsed?.os.name ?? "unknown",
    "device.type": parsed?.platform.type ?? "unknown",
  };
};
