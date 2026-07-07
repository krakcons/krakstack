import { Effect } from "effect";
import { AsyncResult, Atom } from "effect/unstable/reactivity";

import type { CreateExamplePayload, Example, UpdateExamplePayload } from "./schema";

const seed: ReadonlyArray<Example> = [];

const current = (result: AsyncResult.AsyncResult<ReadonlyArray<Example>, unknown>) =>
  AsyncResult.match(result, {
    onInitial: () => [],
    onFailure: () => [],
    onSuccess: ({ value }: { value: ReadonlyArray<Example> }) =>
      Array.from(value),
  });

const optimisticExample = (payload: CreateExamplePayload): Example => {
  const now = new Date();
  return {
    id: `optimistic-${crypto.randomUUID()}`,
    userId: "current-user",
    name: payload.name,
    description: payload.description ?? null,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
};

export const serverExamplesAtom = Atom.make(Effect.succeed(seed));

export const allExamplesAtom = Atom.optimistic(serverExamplesAtom);

export const createExampleAtom = Atom.optimisticFn(allExamplesAtom, {
  reducer: (state, payload: CreateExamplePayload) =>
    AsyncResult.success([optimisticExample(payload), ...current(state)]),
  fn: Atom.fn((payload: CreateExamplePayload) =>
    Effect.succeed(optimisticExample(payload)),
  ),
});

export const updateExampleAtom = Atom.optimisticFn(allExamplesAtom, {
  reducer: (
    state,
    input: { id: string; payload: UpdateExamplePayload },
  ) =>
    AsyncResult.success(
      current(state).map((example: Example) =>
        example.id === input.id
          ? { ...example, ...input.payload, updatedAt: new Date() }
          : example,
      ),
    ),
  fn: Atom.fn((input: { id: string; payload: UpdateExamplePayload }) =>
    Effect.succeed(input),
  ),
});

export const deleteExampleAtom = Atom.optimisticFn(allExamplesAtom, {
  reducer: (state, id: string) =>
    AsyncResult.success(
      current(state).filter((example: Example) => example.id !== id),
    ),
  fn: Atom.fn((id: string) => Effect.succeed(id)),
});
