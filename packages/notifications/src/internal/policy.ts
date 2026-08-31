import type {
  DeliveryQueueJob,
  NotificationDeliveryStatus,
  NotificationPreference,
  NotificationReminderStatus,
  RecipientNotificationScope,
  ReminderQueueJob,
} from "../schema.js";

export const preferenceSpecificity = (
  preference: NotificationPreference,
  input: {
    readonly scope: RecipientNotificationScope;
    readonly eventKey: string;
  },
): number | undefined => {
  if (preference.scope.recipientUserId !== input.scope.recipientUserId) {
    return undefined;
  }
  if (
    preference.scope.organizationId !== null &&
    preference.scope.organizationId !== input.scope.organizationId
  ) {
    return undefined;
  }
  if (
    preference.scope.workspaceId !== null &&
    preference.scope.workspaceId !== input.scope.workspaceId
  ) {
    return undefined;
  }
  if (preference.eventKey !== null && preference.eventKey !== input.eventKey) {
    return undefined;
  }

  return (
    (preference.eventKey === input.eventKey ? 4 : 0) +
    (preference.scope.workspaceId === input.scope.workspaceId &&
    preference.scope.workspaceId !== null
      ? 2
      : 0) +
    (preference.scope.organizationId === input.scope.organizationId &&
    preference.scope.organizationId !== null
      ? 1
      : 0)
  );
};

export const selectPreference = (
  preferences: ReadonlyArray<NotificationPreference>,
  input: {
    readonly scope: RecipientNotificationScope;
    readonly eventKey: string;
  },
): NotificationPreference | undefined => {
  let selected: NotificationPreference | undefined;
  let selectedRank = -1;

  for (const preference of preferences) {
    const rank = preferenceSpecificity(preference, input);
    if (rank === undefined || rank <= selectedRank) continue;
    selected = preference;
    selectedRank = rank;
  }

  return selected;
};

export type QueueWorkDecision =
  | { readonly _tag: "Process" }
  | {
      readonly _tag: "Acknowledge";
      readonly reason: "cancelled" | "expired" | "stale" | "terminal";
    };

const terminalDeliveryStatuses: ReadonlySet<NotificationDeliveryStatus> =
  new Set(["sent", "failed", "suppressed", "cancelled"]);

export const deliveryWorkDecision = (input: {
  readonly now: Date;
  readonly jobId: string;
  readonly job: DeliveryQueueJob;
  readonly state: {
    readonly status: NotificationDeliveryStatus;
    readonly currentJobId: string | null;
    readonly jobGeneration: number;
    readonly attempts: number;
    readonly expiresAt: Date | null;
  };
}): QueueWorkDecision => {
  if (input.state.status === "cancelled") {
    return { _tag: "Acknowledge", reason: "cancelled" };
  }
  if (terminalDeliveryStatuses.has(input.state.status)) {
    return { _tag: "Acknowledge", reason: "terminal" };
  }
  if (
    input.state.expiresAt !== null &&
    input.state.expiresAt.getTime() <= input.now.getTime()
  ) {
    return { _tag: "Acknowledge", reason: "expired" };
  }
  if (
    input.state.currentJobId !== input.jobId ||
    input.state.jobGeneration !== input.job.generation ||
    input.state.attempts !== input.job.attempt
  ) {
    return { _tag: "Acknowledge", reason: "stale" };
  }
  return { _tag: "Process" };
};

const terminalReminderStatuses: ReadonlySet<NotificationReminderStatus> =
  new Set(["completed", "failed", "cancelled"]);

export const reminderWorkDecision = (input: {
  readonly now: Date;
  readonly jobId: string;
  readonly job: ReminderQueueJob;
  readonly state: {
    readonly status: NotificationReminderStatus;
    readonly currentJobId: string | null;
    readonly jobGeneration: number;
    readonly attempts: number;
    readonly expiresAt: Date | null;
  };
}): QueueWorkDecision => {
  if (input.state.status === "cancelled") {
    return { _tag: "Acknowledge", reason: "cancelled" };
  }
  if (terminalReminderStatuses.has(input.state.status)) {
    return { _tag: "Acknowledge", reason: "terminal" };
  }
  if (
    input.state.expiresAt !== null &&
    input.state.expiresAt.getTime() <= input.now.getTime()
  ) {
    return { _tag: "Acknowledge", reason: "expired" };
  }
  if (
    input.state.currentJobId !== input.jobId ||
    input.state.jobGeneration !== input.job.generation ||
    input.state.attempts !== input.job.attempt
  ) {
    return { _tag: "Acknowledge", reason: "stale" };
  }
  return { _tag: "Process" };
};

export type QueueReconciliationDecision = "keep" | "retry" | "fail";

export const queueReconciliationDecision = (input: {
  readonly now: Date;
  readonly lockExpirationMillis: number;
  readonly queueMaxAttempts: number;
  readonly applicationAttempts: number;
  readonly applicationMaxAttempts: number;
  readonly queue: {
    readonly completed: boolean;
    readonly attempts: number;
    readonly acquiredAt: Date | null;
  } | null;
}): QueueReconciliationDecision => {
  if (
    input.queue !== null &&
    !input.queue.completed &&
    input.queue.attempts < input.queueMaxAttempts
  ) {
    return "keep";
  }

  const lockCutoff = input.now.getTime() - input.lockExpirationMillis;
  if (
    input.queue?.acquiredAt !== null &&
    input.queue?.acquiredAt !== undefined &&
    input.queue.acquiredAt.getTime() >= lockCutoff
  ) {
    return "keep";
  }

  return input.applicationAttempts >= input.applicationMaxAttempts
    ? "fail"
    : "retry";
};
