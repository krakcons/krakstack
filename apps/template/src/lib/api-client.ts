import { FetchHttpClient } from "effect/unstable/http";
import { AtomHttpApi } from "effect/unstable/reactivity";
import { Api } from "../api";

export class ApiClient extends AtomHttpApi.Service<ApiClient>()("ApiClient", {
  api: Api,
  httpClient: FetchHttpClient.layer,
  baseUrl:
    typeof window !== "undefined"
      ? `${window.location.origin}`
      : "http://localhost:3000",
}) {}
