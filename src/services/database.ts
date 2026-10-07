import * as PgDrizzle from "drizzle-orm/effect-postgres";
import { Config, Context, Effect, Layer, Redacted } from "effect";
import { PgClient } from "@effect/sql-pg";

// @ts-ignore - TODO: Setup your own schema and remove this comment
import { relations } from "@/db/schema";

const pgLayer = (url: Redacted.Redacted) =>
  PgClient.layer({
    url,
  });

const pgLayerFromConfig = (name: string) =>
  Layer.unwrap(
    Effect.gen(function* () {
      const url = yield* Config.Redacted(name);
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
