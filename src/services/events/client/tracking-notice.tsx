import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Effect, Schema } from "effect";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useKrakstackLocale } from "@/components/ui/krakstack-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  analyticsConsentSnapshot,
  saveAnalyticsPreference,
  subscribeAnalyticsConsent,
} from "../../opentelemetry/consent";

export interface TrackingNoticeMessages {
  readonly preferences: string;
  readonly title: string;
  readonly description: string;
  readonly learnMore: string;
  readonly details: string;
  readonly essential: string;
  readonly privacy: string;
  readonly accept: string;
  readonly decline: string;
  readonly close: string;
  readonly blocked: string;
  readonly accepted: string;
  readonly declined: string;
  readonly pending: string;
  readonly error: string;
}

const translations = {
  en: {
    preferences: "Analytics preferences",
    title: "Help us improve this site",
    description:
      "With your permission, we use visits and activity on this site to learn what’s helpful and make it better. It’s your choice.",
    learnMore: "Learn more",
    details:
      "If you accept, we’ll learn which pages are helpful and how people use the site so we can improve it. We’ll remember your choice for six months. You can change your mind at any time in Analytics preferences.",
    essential:
      "If you decline, we won’t collect this usage data. Anonymous error reports and records needed to keep the site safe and working stay on either way.",
    privacy: "Privacy policy",
    accept: "Accept analytics",
    decline: "Decline analytics",
    close: "Close",
    blocked:
      "Your browser asks us not to track, so usage analytics is off. Your saved choice hasn’t changed.",
    accepted: "You’ve allowed usage analytics. You can turn it off below.",
    declined:
      "You’ve declined usage analytics. You can change your choice below.",
    pending: "Usage analytics is off unless you choose to accept.",
    error:
      "We could not save your preference. Check that cookies are allowed and try again.",
  },
  fr: {
    preferences: "Préférences de mesure d’audience",
    title: "Aidez-nous à améliorer ce site",
    description:
      "Avec votre permission, nous utilisons les visites et l’activité sur ce site pour comprendre ce qui vous est utile et l’améliorer. C’est vous qui décidez.",
    learnMore: "En savoir plus",
    details:
      "Si vous acceptez, nous pourrons comprendre quelles pages sont utiles et comment le site est utilisé pour l’améliorer. Nous mémoriserons votre choix pendant six mois. Vous pouvez changer d’avis à tout moment dans les préférences de mesure d’audience.",
    essential:
      "Si vous refusez, nous ne recueillerons pas ces données d’utilisation. Les rapports d’erreur anonymes et les données nécessaires à la sécurité et au bon fonctionnement du site restent actifs dans tous les cas.",
    privacy: "Politique de confidentialité",
    accept: "Accepter la mesure d’audience",
    decline: "Refuser la mesure d’audience",
    close: "Fermer",
    blocked:
      "Votre navigateur nous demande de ne pas vous suivre : la mesure d’audience est donc désactivée. Votre choix enregistré n’a pas changé.",
    accepted:
      "Vous avez accepté la mesure d’audience. Vous pouvez la désactiver ci-dessous.",
    declined:
      "Vous avez refusé la mesure d’audience. Vous pouvez changer votre choix ci-dessous.",
    pending:
      "La mesure d’audience reste désactivée tant que vous ne l’acceptez pas.",
    error:
      "Impossible d’enregistrer votre préférence. Vérifiez que les témoins sont autorisés et réessayez.",
  },
} satisfies Record<string, TrackingNoticeMessages>;

class ConsentStorageError extends Schema.TaggedError<ConsentStorageError>()(
  "ConsentStorageError",
  {},
) {}

/** Mount once in a persistent footer. English/French defaults follow KrakstackProvider. */
export const TrackingNotice = ({
  messages,
  locale: localeOverride,
  privacyHref,
}: {
  readonly messages?: Partial<TrackingNoticeMessages>;
  readonly locale?: string;
  /** Open an application-owned page instead of the details dialog. */
  readonly privacyHref?: string;
} = {}) => {
  const locale = useKrakstackLocale(localeOverride);
  const labels = {
    ...(locale.split("-")[0] === "fr" ? translations.fr : translations.en),
    ...messages,
  };
  const snapshot = useSyncExternalStore(
    subscribeAnalyticsConsent,
    analyticsConsentSnapshot,
    () => "server",
  );
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [failed, setFailed] = useState(false);
  const save = (choice: "accepted" | "declined") => {
    const result = Effect.runSync(
      Effect.try({
        try: () => saveAnalyticsPreference(choice),
        catch: () => new ConsentStorageError(),
      }).pipe(Effect.catch(() => Effect.succeed(false))),
    );
    setFailed(!result);
    if (result) setOpen(false);
  };
  const actions = (
    <>
      <Button type="button" variant="outline" onClick={() => save("declined")}>
        {labels.decline}
      </Button>
      <Button
        type="button"
        disabled={snapshot === "blocked"}
        onClick={() => save("accepted")}
      >
        {labels.accept}
      </Button>
    </>
  );
  const description = (
    <>
      <p>{labels.description}</p>
      <p className="mt-2">{labels.details}</p>
      <p className="mt-2">{labels.essential}</p>
      {privacyHref ? (
        <a className="mt-2 inline-block underline" href={privacyHref}>
          {labels.privacy}
        </a>
      ) : null}
    </>
  );
  const status =
    snapshot === "blocked"
      ? labels.blocked
      : snapshot.startsWith("accepted:")
        ? labels.accepted
        : snapshot.startsWith("declined:")
          ? labels.declined
          : labels.pending;
  return (
    <>
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground text-sm underline"
        onClick={() => {
          setFailed(false);
          setOpen(true);
        }}
      >
        {labels.preferences}
      </button>
      {snapshot === "pending" && !dismissed && !open
        ? createPortal(
            <section
              aria-label={labels.title}
              className="bg-card fixed inset-x-3 bottom-3 z-40 mx-auto max-w-3xl rounded-xl border p-5 shadow-xl sm:inset-x-6 sm:flex sm:items-center sm:gap-6"
            >
              <button
                type="button"
                aria-label={labels.close}
                className="text-muted-foreground hover:text-foreground absolute top-2 right-2 rounded-sm p-1"
                onClick={() => setDismissed(true)}
              >
                <XIcon className="size-3.5" />
              </button>
              <div className="min-w-0 flex-1">
                <h2 className="font-medium">{labels.title}</h2>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  {labels.description}{" "}
                  {privacyHref ? (
                    <a className="underline" href={privacyHref}>
                      {labels.learnMore}
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="underline"
                      onClick={() => {
                        setFailed(false);
                        setOpen(true);
                      }}
                    >
                      {labels.learnMore}
                    </button>
                  )}
                </p>
              </div>
              <div className="mt-4 flex shrink-0 gap-2 sm:mt-0">{actions}</div>
              {failed ? (
                <p
                  role="alert"
                  className="text-destructive mt-3 text-sm sm:mt-0"
                >
                  {labels.error}
                </p>
              ) : null}
            </section>,
            document.body,
          )
        : null}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{labels.title}</DialogTitle>
            <DialogDescription>{status}</DialogDescription>
          </DialogHeader>
          <div className="text-muted-foreground text-sm leading-6">
            {description}
          </div>
          {failed ? (
            <p role="alert" className="text-destructive text-sm">
              {labels.error}
            </p>
          ) : null}
          <DialogFooter>{actions}</DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
