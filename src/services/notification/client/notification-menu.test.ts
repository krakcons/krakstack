import { describe, expect, it } from "@effect/vitest";

import { notificationMenuMessages } from "./notification-menu";

describe("notificationMenuMessages", () => {
  it("uses bilingual defaults and custom base-language packs", () => {
    expect(notificationMenuMessages("fr-CA").archiveAll).toBe("Tout archiver");
    expect(
      notificationMenuMessages("es-MX", {
        es: { archiveAll: "Archivar todo" },
      }).archiveAll,
    ).toBe("Archivar todo");
  });
});
