import {
  GetEmailIdentityCommand,
  type SESv2Client,
} from "@aws-sdk/client-sesv2";
import { Effect, Schema } from "effect";
import { makeCampaignSafetyLayer } from "@krak-stack/notifications/admin/campaign.safety";
import {
  CampaignSafetyError,
  CampaignSafetyOptions,
  ContactEmail,
} from "@krak-stack/notifications/admin/schema";

const SesIdentity = Schema.Struct({
  VerifiedForSendingStatus: Schema.Boolean,
}).annotate({ identifier: "SendSesIdentityVerification" });
const ApprovedSender = Schema.Struct({
  address: ContactEmail,
  identity: Schema.NonEmptyString,
}).annotate({ identifier: "SendApprovedSesSender" });
const ApprovedSenders = Schema.Array(ApprovedSender).annotate({
  identifier: "SendApprovedSesSenders",
});

// Server-only example: the host supplies its regional SES client/credentials and
// an explicit address -> SES identity mapping (email address or verified domain).
// Domain verification must never implicitly authorize arbitrary sender addresses.
export const makeSesCampaignSafety = (
  options: typeof CampaignSafetyOptions.Type,
  approvedSenders: typeof ApprovedSenders.Type,
  client: Pick<SESv2Client, "send">,
) =>
  makeCampaignSafetyLayer(options, (address) =>
    Effect.gen(function* () {
      const approved = yield* Schema.decodeEffect(ApprovedSenders)(
        approvedSenders,
      ).pipe(
        Effect.mapError(
          () =>
            new CampaignSafetyError({
              message: "Invalid approved sender configuration",
            }),
        ),
      );
      const sender = approved.find(
        (entry) => entry.address.toLowerCase() === address,
      );
      if (!sender) return false;
      const response = yield* Effect.tryPromise({
        try: () =>
          client.send(
            new GetEmailIdentityCommand({ EmailIdentity: sender.identity }),
          ),
        catch: () =>
          new CampaignSafetyError({
            message: "Sender verification is unavailable",
          }),
      });
      const identity = yield* Schema.decodeUnknownEffect(SesIdentity)(
        response,
      ).pipe(
        Effect.mapError(
          () =>
            new CampaignSafetyError({
              message: "Invalid sender verification response",
            }),
        ),
      );
      return identity.VerifiedForSendingStatus;
    }),
  );
