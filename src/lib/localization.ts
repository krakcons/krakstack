import {
  extractLocaleFromHeader,
  locales as paraglideLocales,
} from "@/paraglide/runtime";
import { Context, Effect, Layer, Option, Schema } from "effect";
import { Cookies, HttpServerRequest } from "effect/unstable/http";
import { HttpApiMiddleware } from "effect/unstable/httpapi";

export type Locale = (typeof paraglideLocales)[number];

export const LocaleSchema = Schema.Literals(paraglideLocales).annotate({
  identifier: "Locale",
  title: "Locale",
  description: "A supported application locale.",
  examples: ["en", "fr"],
});

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

const parseAcceptLanguage = (input?: string | null): Locale | undefined => {
  if (!input) return undefined;
  const request = new Request("https://dummy.com", {
    headers: { "accept-language": input },
  });
  return extractLocaleFromHeader(request);
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

export const localize = <
  TBase extends { name?: unknown; translations: Array<{ locale: string }> },
  TTranslation = TBase["translations"][number],
  TResult = Omit<TBase, "translations"> & TTranslation,
  TVariables extends LocalizedInputType = LocalizedInputType,
>(
  context: TVariables,
  obj: TBase,
  customLocale?: Locale,
): TResult => {
  const locale = customLocale ?? context.locale;
  const fallbackLocale = context.fallbackLocale;

  let translation = undefined;
  if (fallbackLocale === "none") {
    translation = obj.translations.find((item) => item.locale === locale);
  } else {
    translation = obj.translations.find((item) => item.locale === locale);
    if (!translation) {
      translation = fallbackLocale
        ? obj.translations.find((item) => item.locale === fallbackLocale)
        : obj.translations[0];
      translation ??= obj.translations[0];
    }
  }

  const { translations: _translations, name: _name, ...rest } = obj;

  return {
    ...rest,
    ...(translation ?? { locale }),
  } as TResult;
};
