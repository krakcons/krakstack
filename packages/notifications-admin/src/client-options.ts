import type { Layer } from "effect";
import type { HttpClient } from "effect/http";

export interface NotificationAdminClientOptions {
  readonly baseUrl: string;
  /** Non-secret cache identity. Recreate factories when the session/grants change. */
  readonly authorizationKey: string;
  /** Host-provided cookie/CSRF transport; provide its dependencies beforehand. */
  readonly httpClient?: Layer.Layer<HttpClient.HttpClient>;
}
