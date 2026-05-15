import { trustedOrigins } from "@/lib/trusted-origins";

export type CorsOptions = {
  allowedOrigins?: "*" | readonly string[];
  allowedMethods?: readonly string[];
  credentials?: boolean;
};

const defaultCorsOptions = {
  allowedOrigins: trustedOrigins,
  allowedMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
} satisfies Required<CorsOptions>;

export const publicCorsOptions = {
  allowedOrigins: "*",
  allowedMethods: ["GET", "OPTIONS"],
  credentials: false,
} satisfies Required<CorsOptions>;

const corsHeaders = (request: Request, options: CorsOptions = {}) => {
  const allowedOrigins =
    options.allowedOrigins ?? defaultCorsOptions.allowedOrigins;
  const credentials = options.credentials ?? defaultCorsOptions.credentials;
  const allowOrigin =
    allowedOrigins === "*" ? "*" : (request.headers.get("origin") ?? undefined);
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": (
      options.allowedMethods ?? defaultCorsOptions.allowedMethods
    ).join(", "),
    "Access-Control-Allow-Headers":
      request.headers.get("access-control-request-headers") ??
      "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Access-Control-Request-Headers",
  };

  const isOriginAllowed =
    allowOrigin === "*" ||
    (allowOrigin !== undefined &&
      allowedOrigins !== "*" &&
      allowedOrigins.includes(allowOrigin));

  if (isOriginAllowed) {
    headers["Access-Control-Allow-Origin"] = allowOrigin;
  }

  if (headers["Access-Control-Allow-Origin"] !== "*") {
    headers.Vary = `Origin, ${headers.Vary}`;
  }

  const allowedOrigin = headers["Access-Control-Allow-Origin"];
  if (credentials && allowedOrigin !== undefined && allowedOrigin !== "*") {
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
};

const setHeader = (headers: Headers, key: string, value: string) => {
  if (key.toLowerCase() !== "vary") {
    headers.set(key, value);
    return;
  }

  const existingValues =
    headers
      .get("vary")
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? [];
  const existingKeys = new Set(
    existingValues.map((item) => item.toLowerCase()),
  );
  const nextValues = value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item && !existingKeys.has(item.toLowerCase()));

  headers.set("Vary", [...existingValues, ...nextValues].join(", "));
};

export const applyCorsHeaders = (
  request: Request,
  response: Response,
  options?: CorsOptions,
) => {
  const headers = corsHeaders(request, options);

  try {
    for (const [key, value] of Object.entries(headers)) {
      setHeader(response.headers, key, value);
    }

    return response;
  } catch {
    const nextHeaders = new Headers(response.headers);

    for (const [key, value] of Object.entries(headers)) {
      setHeader(nextHeaders, key, value);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: nextHeaders,
    });
  }
};

export const corsMiddleware =
  (
    handler: (request: Request) => Response | Promise<Response>,
    options?: CorsOptions,
  ) =>
  async (request: Request) => {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request, options),
      });
    }

    const response = await handler(request);
    return applyCorsHeaders(request, response, options);
  };
