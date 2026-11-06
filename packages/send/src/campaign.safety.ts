import { Context, Effect, Layer, Schema } from "effect";
import {
  CampaignSafetyError,
  CampaignSafetyOptions,
  ContactEmail,
} from "./schema.js";

export interface CampaignSafety {
  readonly checkSender: (
    address: string,
  ) => Effect.Effect<void, CampaignSafetyError>;
  readonly checkRecipient: (
    address: string,
  ) => Effect.Effect<void, CampaignSafetyError>;
}
const unavailable = () =>
  Effect.fail(
    new CampaignSafetyError({ message: "Campaign sending is not configured" }),
  );
export const SendCampaignSafety = Context.Reference<CampaignSafety>(
  "@krak-stack/send/SendCampaignSafety",
  {
    defaultValue: () => ({
      checkSender: unavailable,
      checkRecipient: unavailable,
    }),
  },
);

// Verification is host/provider-owned and must fail closed on revoked identities
// or provider failures. Never use a browser-supplied 'verified' boolean.
export const makeCampaignSafetyLayer = (
  options: typeof CampaignSafetyOptions.Type,
  verifySender: (
    address: string,
  ) => Effect.Effect<boolean, CampaignSafetyError>,
) =>
  Layer.effect(
    SendCampaignSafety,
    Effect.gen(function* () {
      const configuration = yield* Schema.decodeEffect(CampaignSafetyOptions)(
        options,
      ).pipe(
        Effect.mapError(
          () =>
            new CampaignSafetyError({
              message: "Invalid campaign environment configuration",
            }),
        ),
      );
      const allowed = new Set(
        configuration.allowedRecipients.map((address) => address.toLowerCase()),
      );
      const enabled = () =>
        configuration.sendingEnabled
          ? Effect.void
          : Effect.fail(
              new CampaignSafetyError({
                message: "Campaign sending is disabled",
              }),
            );
      const checkSender = Effect.fn("SendCampaignSafety.checkSender")(
        function* (raw: string) {
          yield* enabled();
          const address = yield* Schema.decodeEffect(ContactEmail)(raw).pipe(
            Effect.mapError(
              () =>
                new CampaignSafetyError({ message: "Invalid campaign sender" }),
            ),
          );
          if (!(yield* verifySender(address.toLowerCase())))
            return yield* new CampaignSafetyError({
              message: "Campaign sender is not verified",
            });
        },
      );
      const checkRecipient = Effect.fn("SendCampaignSafety.checkRecipient")(
        function* (raw: string) {
          yield* enabled();
          const address = yield* Schema.decodeEffect(ContactEmail)(raw).pipe(
            Effect.mapError(
              () =>
                new CampaignSafetyError({
                  message: "Invalid campaign recipient",
                }),
            ),
          );
          if (
            configuration.environment !== "production" &&
            !allowed.has(address.toLowerCase())
          )
            return yield* new CampaignSafetyError({
              message: "Recipient is not allowlisted in this environment",
            });
        },
      );
      return { checkSender, checkRecipient };
    }),
  );
