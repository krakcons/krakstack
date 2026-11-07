import * as m from "@/paraglide/messages";
import type { NotificationDeliveryMessages } from "@/services/send/client/operations";
import { sendOperationsMessages } from "./operations.messages";
export const notificationDeliveryMessages = (
  locale: "en" | "fr",
): NotificationDeliveryMessages => {
  const o = { locale };
  return {
    common: sendOperationsMessages(locale),
    title: m.notifications_staff_title({}, o),
    description: m.notifications_staff_description({}, o),
    source: m.notifications_staff_source({}, o),
    sources: {
      all: m.notifications_staff_all({}, o),
      contacts: m.notifications_staff_contacts({}, o),
      engine: m.notifications_staff_engine({}, o),
    },
    recipientUserId: m.notifications_staff_account({}, o),
    organizationId: m.notifications_staff_organization({}, o),
    workspaceId: m.notifications_staff_workspace({}, o),
    template: m.notifications_staff_template({}, o),
    purposes: {
      transactional: m.notifications_staff_transactional({}, o),
      notification: m.notifications_staff_notification({}, o),
      marketing: m.notifications_staff_marketing({}, o),
    },
    eventKey: m.notifications_staff_event({}, o),
    references: m.notifications_staff_references({}, o),
    feedbackNotice: m.notifications_staff_feedback_notice({}, o),
    feedbackCovered: m.notifications_staff_feedback_covered({}, o),
    feedbackUnavailable: m.notifications_staff_feedback_unavailable({}, o),
  };
};
