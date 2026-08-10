import { describe, expect, it } from "@effect/vitest";
import { Schema } from "effect";
import { HttpApi, OpenApi } from "effect/unstable/httpapi";

import { makeAgentApiGroup } from "./schema";

describe("agent API", () => {
  it("provides the backend streaming contract", () => {
    const api = HttpApi.make("TestApi").add(
      makeAgentApiGroup(
        Schema.Struct({ resourceId: Schema.String }).annotate({
          identifier: "TestAgentResource",
        }),
      ),
    );
    const spec = OpenApi.fromApi(api);

    expect(spec.paths["/agent"]?.post?.operationId).toBe("agent.stream");
    expect(spec.paths["/agent"]?.post?.requestBody).toBeDefined();
  });
});
