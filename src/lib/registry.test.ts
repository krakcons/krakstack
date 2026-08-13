import { describe, expect, it } from "@effect/vitest";

import { getRegistryItemMeta, isRegistryItemNew } from "./registry";

describe("isRegistryItemNew", () => {
  const now = new Date("2026-08-13T12:00:00.000Z");

  it("marks items created within 14 days as new", () => {
    expect(isRegistryItemNew({ meta: { createdAt: "2026-08-01" } }, now)).toBe(
      true,
    );
  });

  it("expires the badge after 14 days", () => {
    expect(isRegistryItemNew({ meta: { createdAt: "2026-07-30" } }, now)).toBe(
      false,
    );
  });

  it("rejects missing, invalid, and future dates", () => {
    expect(isRegistryItemNew({}, now)).toBe(false);
    expect(isRegistryItemNew({ meta: { createdAt: "not-a-date" } }, now)).toBe(
      false,
    );
    expect(isRegistryItemNew({ meta: { createdAt: "2026-08-14" } }, now)).toBe(
      false,
    );
  });
});

describe("getRegistryItemMeta", () => {
  it("decodes created and updated dates", () => {
    const meta = getRegistryItemMeta({
      meta: { createdAt: "2026-08-11", updatedAt: "2026-08-13" },
    });

    expect(meta?.createdAt).toEqual(new Date("2026-08-11"));
    expect(meta?.updatedAt).toEqual(new Date("2026-08-13"));
  });

  it("rejects invalid metadata dates", () => {
    expect(
      getRegistryItemMeta({
        meta: { createdAt: "2026-08-11", updatedAt: "not-a-date" },
      }),
    ).toBeUndefined();
  });
});
