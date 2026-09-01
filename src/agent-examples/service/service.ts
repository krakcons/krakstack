import { Context, Effect, Layer } from "effect";
import { SqlClient, SqlSchema } from "effect/unstable/sql";

import {
  CreateExampleRequest,
  ExampleSchema,
  FindExampleRequest,
  FindExamplesRequest,
  UpdateExampleRequest,
} from "./schema";

export class Examples extends Context.Service<Examples>()(
  "agent-examples/Examples",
  {
    make: Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient;

      const find = SqlSchema.findAll({
        Request: FindExamplesRequest,
        Result: ExampleSchema,
        execute: ({ userId }) => sql`
          SELECT id, user_id, name, description, active, created_at, updated_at
          FROM examples
          WHERE user_id = ${userId}
          ORDER BY created_at
        `,
      });

      const findOne = SqlSchema.findOneOption({
        Request: FindExampleRequest,
        Result: ExampleSchema,
        execute: ({ userId, id }) => sql`
          SELECT id, user_id, name, description, active, created_at, updated_at
          FROM examples
          WHERE id = ${id} AND user_id = ${userId}
          LIMIT 1
        `,
      });

      const create = SqlSchema.findOne({
        Request: CreateExampleRequest,
        Result: ExampleSchema,
        execute: ({ userId, payload }) => sql`
          INSERT INTO examples (user_id, name, description)
          VALUES (${userId}, ${payload.name}, ${payload.description ?? null})
          RETURNING id, user_id, name, description, active, created_at, updated_at
        `,
      });

      const update = SqlSchema.findOneOption({
        Request: UpdateExampleRequest,
        Result: ExampleSchema,
        execute: ({ userId, id, payload }) => sql`
          UPDATE examples
          SET ${sql.update({ ...payload, updatedAt: new Date() })}
          WHERE id = ${id} AND user_id = ${userId}
          RETURNING id, user_id, name, description, active, created_at, updated_at
        `,
      });

      const remove = SqlSchema.findOneOption({
        Request: FindExampleRequest,
        Result: ExampleSchema,
        execute: ({ userId, id }) => sql`
          DELETE FROM examples
          WHERE id = ${id} AND user_id = ${userId}
          RETURNING id, user_id, name, description, active, created_at, updated_at
        `,
      });

      return { find, findOne, create, update, delete: remove };
    }),
  },
) {
  static readonly baseLayer = Layer.effect(this, this.make);

  static readonly layer = this.baseLayer;
}
