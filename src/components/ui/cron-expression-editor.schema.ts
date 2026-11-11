import { Effect, Option, Schema } from "effect";
import { CronExpressionParser } from "cron-parser";

const acceptsField = (token: string, index: number) => {
  const fields = ["*", "*", "*", "*", "*"];
  fields[index] = token;
  return Option.isSome(
    Effect.runSync(
      Effect.option(
        Effect.try(() => CronExpressionParser.parse(fields.join(" "))),
      ),
    ),
  );
};

/** The active field may be unfinished, but must still be completable. */
export const CronDraftSchema = Schema.Struct({
  text: Schema.String.check(
    Schema.isPattern(/^[\d*/,\- ]*$/),
    Schema.isMaxLength(150),
  ),
  cursor: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
})
  .check(
    Schema.makeFilter(({ text, cursor }) => {
      if (!text) return true;
      const fields = text.split(" ");
      if (fields.length > 5) return false;
      const active = text.slice(0, cursor).split(" ").length - 1;
      return fields.every((token, index) => {
        if (acceptsField(token, index)) return true;
        if (index !== active || /\/0+$/.test(token)) return false;
        if (!token) return index === fields.length - 1;
        // Ask the cron parser, rather than duplicating its range/list/step grammar.
        // This permits drafts such as */ and 5-1 (which can become 5-15).
        return Array.from({ length: 60 }, (_, number) => String(number))
          .concat("*")
          .some((suffix) => acceptsField(`${token}${suffix}`, index));
      });
    }),
  )
  .annotate({ identifier: "CronDraft" });

export const formatCronDraft = (
  text: string,
  cursor = text.length,
): string | null => {
  const normalized = text.replace(/\s+/g, " ").trimStart();
  const normalizedCursor = text
    .slice(0, cursor)
    .replace(/\s+/g, " ")
    .trimStart().length;
  return Schema.is(CronDraftSchema)({
    text: normalized,
    cursor: normalizedCursor,
  })
    ? normalized
    : null;
};
