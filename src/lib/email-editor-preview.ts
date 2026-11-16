import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { EmailRenderInput } from "@/lib/email-document/schema";

export const previewEmailDocument = createServerFn({ method: "POST" })
  .inputValidator(Schema.toStandardSchemaV1(EmailRenderInput))
  .handler(async ({ data }) => {
    const { renderEmailDocument } = await import("@/lib/email-document/render");
    return Effect.runPromise(renderEmailDocument(data));
  });
