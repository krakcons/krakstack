import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import {
  makeCampaignSafetyLayer,
  SendCampaignSafety,
} from "../src/campaign.safety.js";
import { CampaignSafetyError } from "../src/schema.js";

describe("campaign sending safeguards", () => {
  it.effect("fails closed without host configuration", () =>
    Effect.gen(function* () {
      const safety = yield* SendCampaignSafety;
      expect(
        (yield* safety.checkSender("sender@example.com").pipe(Effect.flip))
          ._tag,
      ).toBe("CampaignSafetyError");
      expect(
        (yield* safety.checkRecipient("person@example.com").pipe(Effect.flip))
          ._tag,
      ).toBe("CampaignSafetyError");
    }),
  );
  it.effect(
    "requires explicit sending enablement and current sender verification",
    () =>
      Effect.gen(function* () {
        for (const sendingEnabled of [false, true]) {
          const error = yield* SendCampaignSafety.use((safety) =>
            safety.checkSender("sender@example.com"),
          ).pipe(
            Effect.provide(
              makeCampaignSafetyLayer(
                {
                  environment: "production",
                  sendingEnabled,
                  allowedRecipients: [],
                },
                () => Effect.succeed(false),
              ),
            ),
            Effect.flip,
          );
          expect(error._tag).toBe("CampaignSafetyError");
        }
        expect(
          (yield* SendCampaignSafety.use((safety) =>
            safety.checkSender("sender@example.com"),
          ).pipe(
            Effect.provide(
              makeCampaignSafetyLayer(
                {
                  environment: "production",
                  sendingEnabled: true,
                  allowedRecipients: [],
                },
                () =>
                  Effect.fail(
                    new CampaignSafetyError({
                      message: "provider unavailable",
                    }),
                  ),
              ),
            ),
            Effect.flip,
          )).message,
        ).toBe("provider unavailable");
      }),
  );
  it.effect(
    "restricts non-production recipients even when sender verification succeeds",
    () =>
      Effect.gen(function* () {
        const safety = yield* SendCampaignSafety;
        yield* safety.checkSender("sender@example.com");
        yield* safety.checkRecipient(" Allowed@Example.com ");
        expect(
          (yield* safety.checkRecipient("other@example.com").pipe(Effect.flip))
            ._tag,
        ).toBe("CampaignSafetyError");
      }).pipe(
        Effect.provide(
          makeCampaignSafetyLayer(
            {
              environment: "test",
              sendingEnabled: true,
              allowedRecipients: ["allowed@example.com"],
            },
            () => Effect.succeed(true),
          ),
        ),
      ),
  );
});
