import { Context, Effect, Layer } from "effect";

import type {
  CreateExamplePayload,
  Example,
  UpdateExamplePayload,
} from "./schema";

export interface ExamplesShape {
  readonly list: (input: {
    userId: string;
  }) => Effect.Effect<ReadonlyArray<Example>>;
  readonly get: (input: {
    userId: string;
    id: string;
  }) => Effect.Effect<Example | undefined>;
  readonly create: (input: {
    userId: string;
    payload: CreateExamplePayload;
  }) => Effect.Effect<Example>;
  readonly update: (input: {
    userId: string;
    id: string;
    payload: UpdateExamplePayload;
  }) => Effect.Effect<Example | undefined>;
  readonly delete: (input: {
    userId: string;
    id: string;
  }) => Effect.Effect<Example | undefined>;
}

export class Examples extends Context.Service<Examples, ExamplesShape>()(
  "agent-examples/Examples",
  {
    make: Effect.gen(function* () {
      const records = new Map<string, Example>();

      const list = Effect.fn("Examples.list")(function* ({
        userId,
      }: {
        userId: string;
      }) {
        return Array.from(records.values()).filter(
          (example) => example.userId === userId,
        );
      });

      const get = Effect.fn("Examples.get")(function* ({
        userId,
        id,
      }: {
        userId: string;
        id: string;
      }) {
        const example = records.get(id);
        return example?.userId === userId ? example : undefined;
      });

      const create = Effect.fn("Examples.create")(function* ({
        userId,
        payload,
      }: {
        userId: string;
        payload: CreateExamplePayload;
      }) {
        const now = new Date();
        const example: Example = {
          id: crypto.randomUUID(),
          userId,
          name: payload.name,
          description: payload.description ?? null,
          active: true,
          createdAt: now,
          updatedAt: now,
        };

        records.set(example.id, example);
        return example;
      });

      const update = Effect.fn("Examples.update")(function* ({
        userId,
        id,
        payload,
      }: {
        userId: string;
        id: string;
        payload: UpdateExamplePayload;
      }) {
        const example = records.get(id);
        if (!example || example.userId !== userId) return undefined;

        const updated: Example = {
          ...example,
          ...payload,
          description: payload.description ?? example.description,
          updatedAt: new Date(),
        };
        records.set(id, updated);
        return updated;
      });

      const deleteExample = Effect.fn("Examples.delete")(function* ({
        userId,
        id,
      }: {
        userId: string;
        id: string;
      }) {
        const example = records.get(id);
        if (!example || example.userId !== userId) return undefined;

        records.delete(id);
        return example;
      });

      return { list, get, create, update, delete: deleteExample };
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
}
