import { Context, Effect, Layer, Schema } from "effect";
import { NotificationService } from "./index.js";
import {
  PublicationInput,
  NotificationScope,
  DeliveryMutationInput,
} from "./schema.js";

export const PublicationOperation = Schema.Literals([
  "publish",
  "inspect",
  "cancel",
  "retry",
]).annotate({ identifier: "NotificationPublicationOperation" });
export const PublicationScopeGrant = Schema.Union([
  Schema.TaggedStruct("Exact", { scope: NotificationScope }),
  Schema.TaggedStruct("Organization", {
    organizationId: Schema.NonEmptyString,
  }),
  Schema.TaggedStruct("Installation", {}),
]).annotate({ identifier: "NotificationPublicationScopeGrant" });
export const PublicationAccess = Schema.Struct({
  operations: Schema.Array(PublicationOperation),
  scopes: Schema.Array(PublicationScopeGrant),
  channels: Schema.Array(Schema.NonEmptyString),
  purposes: Schema.Array(
    Schema.Literals(["transactional", "notification", "marketing"]),
  ),
  referenceNamespaces: Schema.Array(Schema.NonEmptyString),
}).annotate({ identifier: "NotificationPublicationAccess" });

export class PublicationAccessDenied extends Schema.TaggedError<
  PublicationAccessDenied,
  { readonly brand: unique symbol }
>()(
  "PublicationAccessDenied",
  {
    message: Schema.String,
  },
  { httpApiStatus: 403 },
) {}

// Provided only AFTER host authentication. Never decode this context from an HTTP body.
export class CurrentNotificationIntegration extends Context.Service<
  CurrentNotificationIntegration,
  {
    readonly reference: string;
    readonly access: typeof PublicationAccess.Type;
  }
>()("@krak-stack/notifications/CurrentIntegration") {}

export type PublicationAuthorizationRequest = {
  readonly actor: string;
  readonly operation: typeof PublicationOperation.Type;
  readonly scope: NotificationScope;
  readonly publication?: PublicationInput;
  readonly deliveryId?: string;
};

// Mandatory host seam: verify recipient ownership, scope relationships, event/purpose,
// templates, sender and extension permissions. Generic scope grants cannot prove these facts.
export class NotificationIntegrationAuthorization extends Context.Service<
  NotificationIntegrationAuthorization,
  {
    readonly authorize: (
      request: PublicationAuthorizationRequest,
    ) => Effect.Effect<void, PublicationAccessDenied>;
  }
>()("@krak-stack/notifications/IntegrationAuthorization") {}

export const publicationScopeAllowed = (
  grants: ReadonlyArray<typeof PublicationScopeGrant.Type>,
  scope: NotificationScope,
) =>
  grants.some((grant) => {
    switch (grant._tag) {
      case "Installation":
        return true;
      case "Organization":
        return grant.organizationId === scope.organizationId;
      case "Exact":
        return (
          grant.scope.recipientUserId === scope.recipientUserId &&
          grant.scope.organizationId === scope.organizationId &&
          grant.scope.workspaceId === scope.workspaceId
        );
    }
  });

/**
 * Per-request identity must be read at call time, never captured across requests.
 * @effect-expect-leaking CurrentNotificationIntegration
 */
export class NotificationPublicationIntegration extends Context.Service<NotificationPublicationIntegration>()(
  "@krak-stack/notifications/PublicationIntegration",
  {
    make: Effect.gen(function* () {
      const notifications = yield* NotificationService;
      const authorization = yield* NotificationIntegrationAuthorization;
      const deny = () =>
        new PublicationAccessDenied({
          message: "Notification operation is not permitted",
        });
      const authorize = Effect.fn(
        "NotificationPublicationIntegration.authorize",
      )(function* (request: Omit<PublicationAuthorizationRequest, "actor">) {
        const principal = yield* CurrentNotificationIntegration;
        const access = yield* Schema.decodeEffect(PublicationAccess)(
          principal.access,
        ).pipe(Effect.mapError(deny));
        if (
          !access.operations.includes(request.operation) ||
          !publicationScopeAllowed(access.scopes, request.scope)
        )
          return yield* deny();
        yield* authorization.authorize({
          ...request,
          actor: principal.reference,
        });
        return access;
      });
      const publish = Effect.fn("NotificationPublicationIntegration.publish")(
        function* (raw: PublicationInput) {
          const input = yield* Schema.decodeEffect(PublicationInput)(raw).pipe(
            Effect.mapError(deny),
          );
          const access = yield* authorize({
            operation: "publish",
            scope: input.scope,
            publication: input,
          });
          if (
            input.deliveries.some(
              (delivery) =>
                !access.channels.includes(delivery.channel) ||
                !access.purposes.includes(delivery.policy.kind),
            )
          )
            return yield* deny();
          return yield* notifications.publish(input);
        },
      );
      const read = Effect.fn("NotificationPublicationIntegration.read")(
        function* (
          operation: "inspect" | "cancel" | "retry",
          raw: DeliveryMutationInput,
        ) {
          const input = yield* Schema.decodeEffect(DeliveryMutationInput)(
            raw,
          ).pipe(Effect.mapError(deny));
          const access = yield* authorize({
            operation,
            scope: input.scope,
            deliveryId: input.deliveryId,
          });
          const detail = yield* notifications.getDelivery(input);
          if (
            !access.channels.includes(detail.delivery.channel) ||
            !access.purposes.includes(detail.delivery.purpose)
          )
            return yield* deny();
          return { input, detail, access };
        },
      );
      return {
        publish,
        inspect: Effect.fn("NotificationPublicationIntegration.inspect")(
          function* (input: DeliveryMutationInput) {
            const { detail, access } = yield* read("inspect", input);
            const {
              id,
              scope,
              channel,
              purpose,
              status,
              template,
              recipientAddress,
              recipientName,
              scheduledFor,
              createdAt,
              updatedAt,
            } = detail.delivery;
            return {
              delivery: {
                id,
                scope,
                channel,
                purpose,
                status,
                template,
                recipientAddress,
                recipientName,
                scheduledFor,
                createdAt,
                updatedAt,
              },
              attempts: detail.attempts,
              references: detail.references.filter((reference) =>
                access.referenceNamespaces.includes(reference.namespace),
              ),
            };
          },
        ),
        cancel: Effect.fn("NotificationPublicationIntegration.cancel")(
          function* (raw: DeliveryMutationInput) {
            const { input } = yield* read("cancel", raw);
            const delivery = yield* notifications.cancelDelivery(input);
            return { id: delivery.id, status: delivery.status };
          },
        ),
        retry: Effect.fn("NotificationPublicationIntegration.retry")(function* (
          raw: DeliveryMutationInput,
        ) {
          const { input } = yield* read("retry", raw);
          const delivery = yield* notifications.retryDelivery(input);
          return { id: delivery.id, status: delivery.status };
        }),
      };
    }),
  },
) {
  static readonly layer = Layer.effect(this, this.make);
}
