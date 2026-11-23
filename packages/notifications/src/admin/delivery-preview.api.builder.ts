import { CurrentDeliveryAdmin } from "./delivery.api.js";
import { decodeEmailPayloadV1 } from "../transport/email.js";
import { Effect, Layer, Option, Schema } from "effect";
import { HttpEffect, HttpServerResponse } from "effect/http";
import { HttpApiBuilder, HttpApiError } from "effect/http-api";
import { SqlClient, SqlSchema } from "effect/sql";
import sanitizeHtml from "sanitize-html";
import { DeliveryPreviewApi } from "./delivery-preview.api.js";

const safeEmailPreviewHtml = (html: string) =>
  sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.filter((tag) => tag !== "a"),
    allowedAttributes: {
      "*": ["style", "align", "dir"],
      td: ["colspan", "rowspan", "width", "valign"],
      table: ["cellpadding", "cellspacing", "width"],
    },
  });

const PreviewRow = Schema.Struct({
  payloadVersion: Schema.Int,
  payload: Schema.Unknown,
}).annotate({ identifier: "DeliveryEmailPreviewRow" });

export const deliveryPreviewHandlers = HttpApiBuilder.group(
  DeliveryPreviewApi,
  "deliveryPreview",
  Effect.fnUntraced(function* (handlers) {
    const sql = yield* SqlClient.SqlClient;
    const find = SqlSchema.findOneOption({
      Request: Schema.String,
      Result: PreviewRow,
      execute: (id) =>
        sql`
        SELECT payload_version AS "payloadVersion", payload
        FROM notification_deliveries
        WHERE id = ${id} AND channel = 'email'
      `.withoutTransform,
    });
    return handlers.handle("get", ({ params }) =>
      Effect.gen(function* () {
        yield* HttpEffect.appendPreResponseHandler((_request, response) =>
          Effect.succeed(
            HttpServerResponse.setHeader(
              response,
              "cache-control",
              "private, no-store",
            ),
          ),
        );
        const { access } = yield* CurrentDeliveryAdmin;
        if (
          !access.emailPreview ||
          !access.deliveryScopes?.some((scope) => scope._tag === "Installation")
        ) {
          return yield* new HttpApiError.NotFound({});
        }
        const row = yield* find(params.id).pipe(
          Effect.mapError(() => new HttpApiError.InternalServerError({})),
        );
        if (Option.isNone(row)) return yield* new HttpApiError.NotFound({});
        if (row.value.payloadVersion !== 1) return null;
        const payload = yield* decodeEmailPayloadV1(row.value.payload).pipe(
          Effect.option,
        );
        if (Option.isNone(payload)) return null;
        const { from, fromName, subject, text, html } = payload.value;
        const safeHtml =
          html === undefined ? undefined : safeEmailPreviewHtml(html);
        if (!safeHtml?.trim() && !text) return null;
        return {
          from,
          fromName,
          subject,
          text: text ?? null,
          html: safeHtml?.trim() ? safeHtml : null,
        };
      }),
    );
  }),
);

export const deliveryPreviewRoutes = HttpApiBuilder.layer(
  DeliveryPreviewApi,
).pipe(Layer.provide(deliveryPreviewHandlers));
