import { afterAll, expect, it } from "vitest";

import { dispose, handler } from "@/lib/api-handler";

afterAll(dispose);

it("serves the site health endpoints", async () => {
  for (const path of [
    "/api/health",
    "/api/health/live",
    "/api/health/ready",
    "/api/health/started",
  ]) {
    const response = await handler(new Request(`http://localhost${path}`));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "UP", checks: [] });
  }
});

it("serves OpenAPI documentation", async () => {
  const specification = await handler(
    new Request("http://localhost/api/openapi.json"),
  );
  const documentation = await handler(new Request("http://localhost/api/docs"));

  expect(specification.status).toBe(200);
  expect(await specification.json()).toMatchObject({
    info: { title: "KrakStack Site API", version: "1.0.0" },
  });
  expect(documentation.status).toBe(200);
  expect(documentation.headers.get("content-type")).toContain("text/html");
});
