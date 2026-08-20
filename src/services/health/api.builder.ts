import { Effect } from "effect";
import { HttpRouter } from "effect/unstable/http";
import { HttpApiBuilder, HttpApiGroup } from "effect/unstable/httpapi";

import { HealthApiGroup } from "./api.group";
import { HealthService } from "./index";
import type { HealthResponse } from "./schema";

const respond = (check: Effect.Effect<HealthResponse>) =>
  check.pipe(
    Effect.flatMap((response) =>
      response.status === "UP"
        ? Effect.succeed(response)
        : Effect.fail(response),
    ),
  );

export const healthHandler = <const Prefix extends HttpRouter.PathInput>(
  handlers: HttpApiBuilder.Handlers.FromGroup<
    HttpApiGroup.AddPrefix<typeof HealthApiGroup, Prefix>
  >,
) =>
  handlers
    .handle("getHealth", () =>
      Effect.flatMap(HealthService, ({ aggregate }) => respond(aggregate())),
    )
    .handle("getLiveness", () =>
      Effect.flatMap(HealthService, ({ live }) => respond(live())),
    )
    .handle("getReadiness", () =>
      Effect.flatMap(HealthService, ({ ready }) => respond(ready())),
    )
    .handle("getStartup", () =>
      Effect.flatMap(HealthService, ({ started }) => respond(started())),
    );
