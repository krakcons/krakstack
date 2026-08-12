import * as PgDrizzle from "drizzle-orm/effect-postgres";
import { Config, Context, Effect, Layer, Redacted } from "effect";
import { PgClient } from "@effect/sql-pg";
import { types } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

// @ts-ignore - TODO: Setup your own schema and remove this comment
import { relations } from "@/db/schema";

const pgLayer = (url: Redacted.Redacted) =>
  PgClient.layer({
    url,
    types: {
      getTypeParser: (typeId, format) => {
        if (
          [1184, 1114, 1082, 1186, 1231, 1115, 1185, 1187, 1182].includes(
            typeId,
          )
        ) {
          return (val: any) => val;
        }
        return types.getTypeParser(typeId, format);
      },
    },
  });

const pgLayerFromConfig = (name: string) =>
  Layer.unwrap(
    Effect.gen(function* () {
      const url = yield* Config.redacted(name);
      return pgLayer(url);
    }),
  );

export class DB extends Context.Service<DB>()("DB", {
  make: PgDrizzle.makeWithDefaults({ relations }),
}) {
  static readonly clientLayer = pgLayerFromConfig("DATABASE_URL");
  static readonly testClientLayer = pgLayerFromConfig("TEST_DATABASE_URL");
  static readonly baseLayer = Layer.effect(this, this.make);

  static readonly layer = this.baseLayer.pipe(Layer.provide(this.clientLayer));

  static readonly testLayer = this.baseLayer.pipe(
    Layer.provide(this.testClientLayer),
  );
}

export const db = drizzle(process.env.DATABASE_URL!, {
  relations,
});
