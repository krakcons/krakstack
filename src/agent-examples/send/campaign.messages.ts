import * as m from "@/paraglide/messages";
import type { SendCampaignMessages } from "@krak-stack/notifications-admin/campaigns";

export const sendCampaignMessages = (
  locale: "en" | "fr",
): SendCampaignMessages => {
  const o = { locale };
  return {
    title: m.kraksend_campaign_title({}, o),
    description: m.kraksend_campaign_description({}, o),
    create: m.kraksend_campaign_create({}, o),
    name: m.kraksend_contacts_name({}, o),
    from: m.kraksend_campaign_from({}, o),
    subject: m.kraksend_campaign_subject({}, o),
    text: m.kraksend_campaign_text({}, o),
    save: m.kraksend_contacts_save({}, o),
    manage: m.kraksend_campaign_manage({}, o),
    status: m.kraksend_campaign_status({}, o),
    schedule: m.kraksend_campaign_schedule({}, o),
    scheduledFor: m.kraksend_campaign_scheduled_for({}, o),
    pause: m.kraksend_campaign_pause({}, o),
    resume: m.kraksend_campaign_resume({}, o),
    cancel: m.kraksend_campaign_cancel({}, o),
    confirmCancel: m.kraksend_campaign_confirm_cancel({}, o),
    cancelDescription: m.kraksend_campaign_cancel_description({}, o),
    failed: m.kraksend_contacts_failed({}, o),
    empty: m.kraksend_campaign_empty({}, o),
    next: m.kraksend_contacts_next({}, o),
    previous: m.kraksend_contacts_previous({}, o),
    close: m.kraksend_campaign_close({}, o),
    reporting: m.kraksend_campaign_reporting({}, o),
    english: m.kraksend_campaign_english({}, o),
    french: m.kraksend_campaign_french({}, o),
    enUnsubscribe: m.kraksend_contacts_withdraw({}, { locale: "en" }),
    frUnsubscribe: m.kraksend_contacts_withdraw({}, { locale: "fr" }),
    statuses: {
      draft: m.kraksend_campaign_draft({}, o),
      scheduled: m.kraksend_campaign_scheduled({}, o),
      running: m.kraksend_campaign_running({}, o),
      paused: m.kraksend_campaign_paused({}, o),
      cancelled: m.kraksend_campaign_cancelled({}, o),
      completed: m.kraksend_campaign_completed({}, o),
    },
    metrics: {
      audience: m.kraksend_campaign_audience({}, o),
      pending: m.kraksend_campaign_pending({}, o),
      published: m.kraksend_campaign_published({}, o),
      skipped: m.kraksend_campaign_skipped({}, o),
      accepted: m.kraksend_campaign_accepted({}, o),
      failed: m.kraksend_campaign_failed({}, o),
      suppressed: m.kraksend_campaign_suppressed({}, o),
      confirmed: m.kraksend_campaign_confirmed({}, o),
      hardBounced: m.kraksend_campaign_hard_bounced({}, o),
      complained: m.kraksend_campaign_complained({}, o),
    },
  };
};
