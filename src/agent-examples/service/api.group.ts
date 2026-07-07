import { Schema } from "effect";
import {
  HttpApiEndpoint,
  HttpApiError,
  HttpApiGroup,
} from "effect/unstable/httpapi";

import { AuthMiddleware } from "@/services/auth/middleware";

import {
  CreateExample,
  ExampleIdParams,
  ExampleSchema,
  UpdateExample,
} from "./schema";

export const ExamplesApiGroup = HttpApiGroup.make("examples")
  .add(
    HttpApiEndpoint.get("listExamples", "/examples", {
      success: Schema.Array(ExampleSchema),
      error: [HttpApiError.Unauthorized, HttpApiError.InternalServerError],
    }),
  )
  .add(
    HttpApiEndpoint.post("createExample", "/examples", {
      payload: CreateExample,
      success: ExampleSchema,
      error: [HttpApiError.Unauthorized, HttpApiError.InternalServerError],
    }),
  )
  .add(
    HttpApiEndpoint.get("getExample", "/examples/:id", {
      params: ExampleIdParams,
      success: ExampleSchema,
      error: [
        HttpApiError.Unauthorized,
        HttpApiError.NotFound,
        HttpApiError.InternalServerError,
      ],
    }),
  )
  .add(
    HttpApiEndpoint.patch("updateExample", "/examples/:id", {
      params: ExampleIdParams,
      payload: UpdateExample,
      success: ExampleSchema,
      error: [
        HttpApiError.Unauthorized,
        HttpApiError.NotFound,
        HttpApiError.InternalServerError,
      ],
    }),
  )
  .add(
    HttpApiEndpoint.delete("deleteExample", "/examples/:id", {
      params: ExampleIdParams,
      success: ExampleSchema,
      error: [
        HttpApiError.Unauthorized,
        HttpApiError.NotFound,
        HttpApiError.InternalServerError,
      ],
    }),
  )
  .middleware(AuthMiddleware);
