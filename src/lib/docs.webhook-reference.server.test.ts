import { describe, expect, it } from "@effect/vitest";
import { Schema } from "effect";
import {
  formatWebhookReference,
  webhookReferenceFields,
} from "./docs.webhook-reference.server";

describe("webhook field references", () => {
  it("resolves nested refs, nullable objects, arrays, dictionaries, and required fields", () => {
    const fields = webhookReferenceFields(
      { $ref: "#/$defs/Body" },
      {
        Body: {
          additionalProperties: true,
          type: "object",
          required: ["attempt", "tags"],
          properties: {
            attempt: { anyOf: [{ $ref: "#/$defs/Attempt" }, { type: "null" }] },
            tags: { type: "array", items: { $ref: "#/$defs/Tag" } },
            values: {
              type: "object",
              additionalProperties: { type: "number" },
            },
          },
        },
        Attempt: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", description: "Stable ID" },
            score: { type: "number" },
          },
        },
        Tag: {
          type: "object",
          required: ["label"],
          properties: { label: { type: "string" } },
        },
      },
    );
    expect(fields).toEqual(
      expect.arrayContaining([
        {
          path: "attempt",
          type: "object | null",
          required: "yes",
          description: "",
        },
        {
          path: "attempt.id",
          type: "string",
          required: "yes",
          description: "Stable ID",
        },
        {
          path: "attempt.score",
          type: "number",
          required: "no",
          description: "",
        },
        {
          path: "tags[].label",
          type: "string",
          required: "yes",
          description: "",
        },
        { path: "values.*", type: "number", required: "no", description: "" },
      ]),
    );
  });

  it("marks variant-specific fields as conditional", () => {
    const fields = webhookReferenceFields(
      {
        anyOf: [
          {
            type: "object",
            properties: { courseId: { type: "string" } },
            required: ["courseId"],
          },
          {
            type: "object",
            properties: { collectionId: { type: "string" } },
            required: ["collectionId"],
          },
        ],
      },
      {},
    );
    expect(fields.map(({ path, required }) => [path, required])).toEqual([
      ["courseId", "conditional"],
      ["collectionId", "conditional"],
    ]);
  });

  it("stops recursion without hiding the recursive field", () => {
    const fields = webhookReferenceFields(
      { $ref: "#/$defs/Node" },
      {
        Node: {
          type: "object",
          properties: { child: { $ref: "#/$defs/Node" } },
        },
      },
    );
    expect(fields).toEqual([
      { path: "child", type: "object", required: "no", description: "" },
    ]);
  });

  it("groups identical data shapes but keeps different referenced schemas separate", () => {
    const payload = Schema.Struct({ id: Schema.String }).annotate({
      identifier: "Data",
    });
    const other = Schema.Struct({ id: Schema.Number }).annotate({
      identifier: "Data",
    });
    const events = [
      ["created", payload],
      ["updated", payload],
      ["other", other],
    ] as const;
    const result = formatWebhookReference(
      "en",
      events.map(([name, data]) => ({
        name,
        description: { en: name, fr: name },
        payload: Schema.Struct({ event: Schema.Literal(name), data }).annotate({
          identifier: name,
        }),
      })),
    );
    expect(result.match(/^### Payload /gm)).toHaveLength(2);
    expect(result).toContain(
      "| `created` | created | [Payload 1](#payload-1) |",
    );
    expect(result).toContain(
      "| `updated` | updated | [Payload 1](#payload-1) |",
    );
    expect(result).toContain("| `other` | other | [Payload 2](#payload-2) |");
    expect(result).not.toContain("$defs");
  });
});
