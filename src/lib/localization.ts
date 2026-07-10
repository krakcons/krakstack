import { extractLocaleFromHeader } from "@/paraglide/runtime";
import { Context, Effect, Layer, Option, Schema } from "effect";
import { Cookies, HttpServerRequest } from "effect/unstable/http";
import { HttpApiMiddleware } from "effect/unstable/httpapi";

const LocaleSchema = Schema.Union([Schema.Literal("en"), Schema.Literal("fr")]);

type Locale = typeof LocaleSchema.Type;

export type LocalizedInputType = {
  locale: Locale;
  fallbackLocale?: Locale | "none" | null;
};

const decodeLocale = Schema.decodeUnknownOption(LocaleSchema);

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
        () =>
          extractLocaleFromHeader(
            new Request("https://dummy.com", {
              headers: {
                "accept-language": headers.get("accept-language") ?? "",
              },
            }),
          ) ?? "en",
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
  TBase extends { translations: Array<{ locale: string }> },
  TTranslation = TBase["translations"][number],
  TResult = Omit<TBase, "translations"> & TTranslation,
>(
  context: LocalizedInputType,
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

  const { translations: _translations, ...rest } = obj;

  return {
    ...rest,
    ...(translation ?? { locale }),
  } as TResult;
};
