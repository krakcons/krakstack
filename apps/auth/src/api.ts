import { HttpApi, OpenApi } from "effect/unstable/httpapi";

import { AdminApiGroup } from "@/services/admin/api.group";
import { AuthApiGroup } from "@/services/auth/api.group";

export const Api = HttpApi.make("Api")
  .annotateMerge(
    OpenApi.annotations({
      title: "KrakStack Auth API",
      version: "1.0.0",
      description: "API for KrakStack authentication services.",
    }),
  )
  .add(AuthApiGroup)
  .add(AdminApiGroup)
  .prefix("/api");
