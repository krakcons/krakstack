import { describe, expect, it } from "@effect/vitest";
import { Schema } from "effect";
import { TrackEvent } from "./schema";

describe("server event input", () => {
  const decode = Schema.decodeUnknownOption(TrackEvent);
  it("allows generated IDs and requires a complete audit target", () => {
    expect(decode({ name: "clicked" })._tag).toBe("Some");
    expect(
      decode({
        category: "audit",
        name: "task.created",
        target: { id: "t-1", name: "Task 1", type: "task" },
      })._tag,
    ).toBe("Some");
    for (const target of [
      undefined,
      {},
      { id: "t-1" },
      { id: "t-1", name: "", type: "task" },
      { id: "t-1", name: "Task 1", type: "" },
    ]) {
      expect(
        decode({ category: "audit", name: "task.created", target })._tag,
      ).toBe("None");
    }
    expect(decode({ name: "clicked", eventId: "" })._tag).toBe("None");
  });
});
