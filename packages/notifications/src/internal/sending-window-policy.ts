import { DateTime, Effect, Option, Schema } from "effect";
import { sendingWindowState } from "./sending-window.js";
import { DispatchPolicyError, type DispatchDecision } from "../policy.js";
import type {
  PublicationPolicyExtension,
  PublicationPolicyInput,
} from "../publication-policy.js";
import { SendingWindow } from "../schema.js";

const key = "krakstack.sending-window";
const version = 1;
const namespace = "krakstack.sending-window.v1";
const WindowSubject = Schema.Struct({
  namespace: Schema.Literal(namespace),
  value: Schema.fromJsonString(SendingWindow),
}).annotate({ identifier: "NotificationSendingWindowSubjectV1" });

/** Snapshot a window as an immutable, versioned per-delivery check. */
export const sendingWindowRequirement = Effect.fn(
  "Notifications.sendingWindowRequirement",
)(
  function* (input: SendingWindow) {
    const window = yield* Schema.decodeEffect(SendingWindow)(input);
    const subject = yield* Schema.encodeEffect(WindowSubject)({
      namespace,
      value: {
        timeZone: window.timeZone,
        start: window.start,
        end: window.end,
      },
    });
    return { key, version, subject };
  },
  Effect.mapError(
    (cause) =>
      new DispatchPolicyError({
        message: "Invalid sending window configuration",
        cause,
      }),
  ),
);

/** Install through publicationPoliciesLayer on both publisher and runtime. */
export const sendingWindowPolicy: PublicationPolicyExtension = {
  key,
  version,
  check: Effect.fn("Notifications.sendingWindowPolicy.check")(
    function* (input) {
      const { value: window } = yield* Schema.decodeUnknownEffect(
        WindowSubject,
      )(input.subject);
      const state = sendingWindowState(window, yield* DateTime.nowAsDate);
      if (state._tag === "Open")
        return { _tag: "Allow" } satisfies DispatchDecision;
      if (Option.isNone(state.opening))
        return yield* new DispatchPolicyError({
          message: "Could not determine the next sending window opening",
        });
      return {
        _tag: "Defer",
        reason: "outside_sending_window",
        until: state.opening.value,
      } satisfies DispatchDecision;
    },
    Effect.catchTag("SchemaError", (cause) =>
      Effect.fail(
        new DispatchPolicyError({
          message: "Invalid persisted sending window",
          cause,
        }),
      ),
    ),
  ),
};

// Window eligibility is time-sensitive even when the other read-only policies
// take time. Recheck only this built-in check immediately before provider dispatch;
// do not repeat arbitrary host policies or alter their short-circuit semantics.
export const recheckSendingWindows = Effect.fnUntraced(function* (
  input: PublicationPolicyInput,
) {
  const { policy, checks } = input.publication;
  const consent = policy.kind === "transactional" ? undefined : policy.consent;
  const requirements = [
    ...checks,
    ...(consent?.kind === "extension" ? [consent] : []),
  ];
  for (const requirement of requirements) {
    if (requirement.key !== key) continue;
    if (requirement.version !== version)
      return yield* new DispatchPolicyError({
        message: "Unsupported sending window policy version",
      });
    const decision = yield* sendingWindowPolicy.check({
      ...input,
      subject: requirement.subject,
    });
    if (decision._tag !== "Allow") return decision;
  }
  return { _tag: "Allow" } satisfies DispatchDecision;
});
