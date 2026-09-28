import { Context, Effect, Layer, Option, Schema } from "effect";
import { Cookies, HttpServerRequest } from "effect/unstable/http";
import { HttpApiMiddleware } from "effect/unstable/httpapi";

export const LocaleSchema = Schema.String.check(
  Schema.isPattern(/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i),
).annotate({
  identifier: "Locale",
  title: "Locale",
  description: "A BCP 47 language tag.",
  examples: ["en", "fr"],
});

export type Locale = typeof LocaleSchema.Type;

const LocaleOrNone = Schema.Union([LocaleSchema, Schema.Literal("none")]);

export const LocalizedInputSchema = Schema.Struct({
  locale: LocaleSchema.pipe(
    Schema.withDecodingDefaultKey(Effect.succeed("en")),
  ),
  fallbackLocale: Schema.optional(Schema.NullOr(LocaleOrNone)),
}).annotate({
  identifier: "LocalizedInput",
  title: "Localized input",
  description: "Locale selection options for resolving localized content.",
});

export type LocalizedInputType = typeof LocalizedInputSchema.Type;

const decodeLocale = Schema.decodeUnknownOption(LocaleSchema);
const AcceptLanguageQuality = Schema.NumberFromString.check(
  Schema.makeFilter((quality) => quality >= 0 && quality <= 1),
).annotate({ identifier: "AcceptLanguageQuality" });
const decodeAcceptLanguageQuality = Schema.decodeUnknownOption(
  AcceptLanguageQuality,
);

const parseAcceptLanguage = (input?: string | null): Locale | undefined => {
  if (!input) return undefined;
  return input
    .split(",")
    .flatMap((entry, index) => {
      const [languageRange = "", ...parameters] = entry.split(";");
      const locale = Option.getOrUndefined(decodeLocale(languageRange.trim()));
      if (!locale) return [];
      const qualityInput = parameters
        .map((parameter) => parameter.trim().match(/^q=(.+)$/i)?.[1])
        .find((value) => value !== undefined);
      const quality = qualityInput
        ? Option.getOrElse(decodeAcceptLanguageQuality(qualityInput), () => 0)
        : 1;
      return [{ index, locale, quality }];
    })
    .sort(
      (left, right) => right.quality - left.quality || left.index - right.index,
    )
    .find(({ quality }) => quality > 0)?.locale;
};

const localeContextFromHeaders = (
  headers: Headers,
  queryLocale?: string | null,
): LocalizedInputType => {
  const cookies = Cookies.parseHeader(headers.get("cookie") ?? "");
  const fallbackLocaleHeader = headers.get("fallbackLocale");

  return {
    locale: decodeLocale(queryLocale).pipe(
      Option.orElse(() => decodeLocale(headers.get("locale"))),
      Option.orElse(() => decodeLocale(cookies.locale)),
      Option.getOrElse(
        () => parseAcceptLanguage(headers.get("accept-language")) ?? "en",
      ),
    ),
    fallbackLocale: Option.getOrElse(
      decodeLocale(fallbackLocaleHeader),
      () => "en",
    ),
  };
};

export class LocaleContext extends Context.Service<
  LocaleContext,
  LocalizedInputType
>()("site/LocaleContext") {
  static fromHeaders = localeContextFromHeaders;
  static fromRequest = (request: { headers: HeadersInit; url: string }) =>
    localeContextFromHeaders(
      new Headers(request.headers),
      new URL(request.url, "http://localhost").searchParams.get("locale"),
    );
}

export class LocaleMiddleware extends HttpApiMiddleware.Service<
  LocaleMiddleware,
  {
    provides: LocaleContext;
  }
>()("site/LocaleMiddleware") {}

export const LocaleMiddlewareLive = Layer.effect(
  LocaleMiddleware,
  Effect.gen(function* () {
    return (httpEffect) =>
      Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest;
        return yield* httpEffect.pipe(
          Effect.provideService(
            LocaleContext,
            LocaleContext.fromRequest(request),
          ),
        );
      });
  }),
);

export function localize<
  TBase extends { name?: unknown; translations: Array<{ locale: string }> },
  TVariables extends LocalizedInputType = LocalizedInputType,
>(
  context: TVariables,
  obj: TBase,
  customLocale?: Locale,
): Omit<TBase, "translations"> & TBase["translations"][number];
export function localize<
  TBase extends { name?: unknown; translations: Array<{ locale: string }> },
  TVariables extends LocalizedInputType = LocalizedInputType,
>(context: TVariables, obj: TBase, customLocale?: Locale) {
  const locale = customLocale ?? context.locale;
  const fallbackLocale = context.fallbackLocale;
  const findTranslation = (candidate: Locale) => {
    const normalized = candidate.toLowerCase();
    const exact = obj.translations.find(
      (item) => item.locale.toLowerCase() === normalized,
    );
    if (exact) return exact;
    const base = normalized.split("-")[0];
    return base
      ? obj.translations.find(
          (item) => item.locale.toLowerCase().split("-")[0] === base,
        )
      : undefined;
  };

  let translation: TBase["translations"][number] | undefined;
  if (fallbackLocale === "none") {
    translation = findTranslation(locale);
  } else {
    translation = findTranslation(locale);
    if (!translation) {
      translation = fallbackLocale
        ? findTranslation(fallbackLocale)
        : obj.translations[0];
      translation ??= obj.translations[0];
    }
  }

  const { translations: _translations, name: _name, ...rest } = obj;

  return {
    ...rest,
    ...(translation ?? { locale }),
  };
}
