import { Option, Schema } from "effect";
import type { EventLogRecord } from "./schema";

const TextValue = Schema.Struct({ stringValue: Schema.String }).annotate({
  identifier: "EventTextValue",
});
const TextArrayValue = Schema.Struct({
  arrayValue: Schema.Struct({ values: Schema.Array(TextValue) }),
}).annotate({ identifier: "EventTextArrayValue" });

export const eventTextAttribute = (
  record: EventLogRecord,
  key: string,
): string | null =>
  Schema.decodeUnknownOption(TextValue)(
    record.attributes.find((attribute) => attribute.key === key)?.value,
  ).pipe(
    Option.map((value) => value.stringValue),
    Option.getOrNull,
  );

export const eventStringArrayAttribute = (
  record: EventLogRecord,
  key: string,
): readonly string[] =>
  Schema.decodeUnknownOption(TextArrayValue)(
    record.attributes.find((attribute) => attribute.key === key)?.value,
  ).pipe(
    Option.map((value) =>
      value.arrayValue.values.map((item) => item.stringValue),
    ),
    Option.getOrElse(() => []),
  );
