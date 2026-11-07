import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { SESv2Client } from "@aws-sdk/client-sesv2";
import { SendCampaignSafety } from "@krak-stack/notifications/admin/campaign.safety";
import { makeSesCampaignSafety } from "./ses-safety";

describe("host SES sender verification adapter", () => {
  it.effect(
    "requires an approved exact sender even for a verified domain",
    () =>
      Effect.gen(function* () {
        const client = new SESv2Client({ region: "eu-west-1" });
        let requested: unknown;
        client.send = (command) => {
          requested = command.input;
          return Promise.resolve({ VerifiedForSendingStatus: true });
        };
        const layer = makeSesCampaignSafety(
          { environment: "test", sendingEnabled: true, allowedRecipients: [] },
          [{ address: "sender@example.com", identity: "example.com" }],
          client,
        );
        yield* SendCampaignSafety.use((safety) =>
          safety.checkSender("sender@example.com"),
        ).pipe(Effect.provide(layer));
        expect(requested).toEqual({ EmailIdentity: "example.com" });
        expect(
          (yield* SendCampaignSafety.use((safety) =>
            safety.checkSender("other@example.com"),
          ).pipe(Effect.provide(layer), Effect.flip))._tag,
        ).toBe("CampaignSafetyError");
      }),
  );
  it.effect(
    "fails closed on revoked verification, malformed responses, and provider outages",
    () =>
      Effect.gen(function* () {
        for (const response of [
          { VerifiedForSendingStatus: false },
          {},
          new Error("secret credential detail"),
        ]) {
          const client = new SESv2Client({ region: "eu-west-1" });
          client.send = () =>
            response instanceof Error
              ? Promise.reject(response)
              : Promise.resolve(response);
          const error = yield* SendCampaignSafety.use((safety) =>
            safety.checkSender("sender@example.com"),
          ).pipe(
            Effect.provide(
              makeSesCampaignSafety(
                {
                  environment: "production",
                  sendingEnabled: true,
                  allowedRecipients: [],
                },
                [{ address: "sender@example.com", identity: "example.com" }],
                client,
              ),
            ),
            Effect.flip,
          );
          expect(error._tag).toBe("CampaignSafetyError");
          expect(error.message).not.toContain("secret");
        }
      }),
  );
});
