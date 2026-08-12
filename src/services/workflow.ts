import { Layer } from "effect";
import { ClusterWorkflowEngine, SingleRunner } from "effect/unstable/cluster";

import { DB } from "@/services/database";

export const workflowEngineLayer = ClusterWorkflowEngine.layer.pipe(
  Layer.provide(SingleRunner.layer({ runnerStorage: "memory" })),
  Layer.provide(DB.clientLayer),
);
