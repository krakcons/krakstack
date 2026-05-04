import * as PgDrizzle from "drizzle-orm/effect-postgres";
import { Context, Effect, Layer, Redacted } from "effect";
import { PgClient } from "@effect/sql-pg";
import { types } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

import { relations } from "@/db/schema";

const PgLive = PgClient.layer({
  url: Redacted.make(process.env.DATABASE_URL!),
  types: {
    getTypeParser: (typeId, format) => {
      if ([1184, 1114, 1082, 1186, 1231, 1115, 1185, 1187, 1182].includes(typeId)) {
        return (val: any) => val;
      }
      return types.getTypeParser(typeId, format);
    },
  },
});

export class DB extends Context.Service<DB>()("DB", {
  make: Effect.gen(function* () {
    const db = yield* PgDrizzle.makeWithDefaults({ relations });
    return db;
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(PgLive));
}

export const db = drizzle(process.env.DATABASE_URL!, {
  relations,
});
