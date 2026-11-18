import { describe, expect, it } from "@effect/vitest";
import {
  cloudflareGeolocation,
  geolocationAttributes,
} from "./request-context";

describe("Cloudflare city headers", () => {
  it.each(["Montréal", "Trois-Rivières", "北京"])(
    "recovers %s from raw UTF-8 header bytes",
    (city) => {
      const header = String.fromCharCode(...new TextEncoder().encode(city));
      const location = cloudflareGeolocation({ "cf-ipcity": header });
      expect(geolocationAttributes(location)["geo.locality.name"]).toBe(city);
    },
  );

  it.each(["Ottawa", "Montréal", "北京", undefined])(
    "leaves %s unchanged",
    (city) => {
      expect(cloudflareGeolocation({ "cf-ipcity": city }).city).toBe(city);
    },
  );
});
