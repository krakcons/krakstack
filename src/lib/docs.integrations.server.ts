import { Schema } from "effect";

import type { DocsPage } from "./docs";
import { compileDocsMarkdown } from "./docs.server";
import { formatWebhookReference } from "./docs.webhook-reference.server";

export type IntegrationDocsText = Readonly<{ en: string; fr: string }>;

export type WebhookEventReference = {
  name: string;
  description: IntegrationDocsText;
  /** Reuse the sender's schema for the complete delivered JSON body. */
  payload: Schema.Top;
};

export type WebhookDocsConfig = {
  events: ReadonlyArray<WebhookEventReference>;
  /** Public Markdown instructions only. Never pass signing secrets. */
  verification?: IntegrationDocsText;
  /** Public Markdown describing the sender's actual retry and delivery policy. */
  delivery?: IntegrationDocsText;
};

/** Public protocol documentation for the KrakStack Webhooks sender (0.8.3).
 * Opt in explicitly; other webhook senders may use a different protocol.
 */
export const krakStackWebhookDocs = {
  verification: {
    en: `The KrakStack Webhooks sender includes \`Content-Type: application/json\`, \`webhook-id\`, \`webhook-timestamp\` (ISO 8601), and \`webhook-signature\` (hex-encoded HMAC-SHA256). These headers are reserved and cannot be overridden by custom headers.

Using the endpoint's signing secret, compute the HMAC-SHA256 digest of the exact UTF-8 bytes of:

\`\`\`text
webhook-id + "." + webhook-timestamp + "." + raw_request_body
\`\`\`

Compare it with the decoded signature using a constant-time comparison. Reject invalid or stale timestamps to limit replay attacks. The \`webhook-id\` is the delivery identifier and remains stable across retries; scope your idempotency key to the endpoint. Do not use the timestamp or signature as an idempotency key, since they change for each attempt.

The delivered JSON body is \`{ "event": string, "data": object }\`. Ignore additional fields your handler does not use.`,
    fr: `L’émetteur KrakStack Webhooks inclut \`Content-Type: application/json\`, \`webhook-id\`, \`webhook-timestamp\` (ISO 8601) et \`webhook-signature\` (HMAC-SHA256 encodé en hexadécimal). Ces en-têtes sont réservés et ne peuvent pas être remplacés par des en-têtes personnalisés.

Avec le secret de signature du point de terminaison, calculez le condensat HMAC-SHA256 des octets UTF-8 exacts de :

\`\`\`text
webhook-id + "." + webhook-timestamp + "." + raw_request_body
\`\`\`

Comparez-le à la signature décodée avec une comparaison en temps constant. Refusez les horodatages invalides ou trop anciens pour limiter les attaques par rejeu. \`webhook-id\` est l’identifiant de livraison et reste stable lors des nouvelles tentatives ; limitez la clé d’idempotence au point de terminaison. N’utilisez pas l’horodatage ni la signature comme clé d’idempotence, car ils changent à chaque tentative.

Le corps JSON livré est \`{ "event": string, "data": object }\`. Ignorez les champs supplémentaires inutilisés.`,
  },
  delivery: {
    en: `The KrakStack Webhooks sender treats a \`2xx\` response as success. Each HTTP attempt has a 30-second timeout. Other responses and network errors are retried, up to eight total attempts, with increasing delays. Use \`webhook-id\` to deduplicate retries. Delivery order is not guaranteed. Check the delivery log for errors and pending retries.

Disabling an endpoint prevents delivery; pending deliveries processed while it is disabled are marked failed. Completed delivery records become eligible for cleanup after seven days.`,
    fr: `L’émetteur KrakStack Webhooks considère une réponse \`2xx\` comme un succès. Chaque tentative HTTP a un délai maximal de 30 secondes. Les autres réponses et les erreurs réseau sont réessayées, jusqu’à huit tentatives au total, avec des délais croissants. Utilisez \`webhook-id\` pour dédupliquer les nouvelles tentatives. L’ordre de livraison n’est pas garanti. Consultez le journal de livraison pour les erreurs et les nouvelles tentatives en attente.

La désactivation d’un point de terminaison empêche la livraison ; les livraisons en attente traitées pendant sa désactivation sont marquées en échec. Les livraisons terminées deviennent admissibles au nettoyage après sept jours.`,
  },
} satisfies Pick<WebhookDocsConfig, "verification" | "delivery">;

export type IntegrationDocsConfig = {
  appName: string;
  /** Canonical public origin, including https://. */
  origin: `http://${string}` | `https://${string}`;
  basePath?: string;
  section?: string;
  /** Reserve three consecutive, positive navigation orders. Defaults to 1000. */
  order?: number;
  locales?: ReadonlyArray<"en" | "fr">;
  /** Disabled unless explicitly enabled. Authentication remains app-owned. */
  api?: boolean | { referenceUrl?: string };
  /** Enable only for remote Streamable HTTP servers supporting OAuth. */
  mcp?: boolean | { url?: string };
  /** Reuse event definitions from the sender, or true for the generic guide. */
  webhooks?: boolean | WebhookDocsConfig;
  /** Local pages replace defaults with the same locale and slug. */
  pages?: ReadonlyArray<DocsPage>;
};

const apiContent = (locale: "en" | "fr", appName: string, reference: string) =>
  locale === "fr"
    ? {
        title: "API REST",
        description: `Intégrez ${appName} à vos applications avec l’API REST.`,
        body: `Utilisez l’API REST de ${appName} pour créer des intégrations avec vos applications.

## Consulter la référence

Ouvrez la [référence de l’API](${reference}) pour consulter les opérations disponibles, les paramètres, les schémas et les réponses.

## Authentification

Suivez les exigences de sécurité indiquées pour chaque opération dans la référence. Les méthodes d’authentification et les identifiants disponibles dépendent de l’application. Ne supposez pas qu’une session de navigateur ou une clé d’API est acceptée par toutes les opérations.

Conservez les identifiants côté serveur ou dans un gestionnaire de secrets, jamais dans du code public, une URL ou une conversation avec un assistant.

## Envoyer une première requête

1. Choisissez une opération de lecture dans la référence.
2. Configurez l’authentification requise avec votre propre compte.
3. Utilisez l’URL, la méthode et les paramètres indiqués pour cette opération.
4. Vérifiez la réponse avant d’autoriser des opérations qui modifient des données.

## Autorisations et erreurs

Une intégration n’accorde pas de droits supplémentaires. L’accès dépend du compte, de l’organisation et de l’opération.

- **401 :** vérifiez les identifiants et leur expiration.
- **403 :** vérifiez les autorisations du compte et l’organisation sélectionnée.
- **429 :** respectez les instructions de nouvelle tentative et l’en-tête Retry-After, s’il est présent.

Consultez la référence pour les erreurs propres à chaque opération.`,
      }
    : {
        title: "REST API",
        description: `Integrate ${appName} with your applications using the REST API.`,
        body: `Use the ${appName} REST API to build integrations with your applications.

## Open the reference

Open the [API reference](${reference}) for available operations, parameters, schemas, and responses.

## Authentication

Follow the security requirements documented for each operation in the reference. Available authentication methods and credentials depend on the application. Do not assume a browser session or API key is accepted by every operation.

Keep credentials on your server or in a secrets manager, never in public code, a URL, or an assistant conversation.

## Send a first request

1. Choose a read operation in the reference.
2. Configure its required authentication using your own account.
3. Use the URL, method, and parameters documented for that operation.
4. Check the response before allowing operations that change data.

## Permissions and errors

An integration does not grant additional permissions. Access depends on the account, organization, and operation.

- **401:** check your credentials and their expiry.
- **403:** check the account permissions and selected organization.
- **429:** follow retry guidance and the Retry-After header, if present.

See the reference for errors specific to each operation.`,
      };

const mcpContent = (locale: "en" | "fr", appName: string, url: string) =>
  locale === "fr"
    ? {
        title: "MCP",
        description: `Connectez un assistant IA à ${appName} avec MCP et OAuth.`,
        body: `Connectez votre assistant IA à ${appName} avec le protocole MCP (Model Context Protocol).

## Connecter votre assistant

Vous avez besoin d’un client compatible avec les serveurs MCP distants, Streamable HTTP et OAuth. La disponibilité dépend de votre abonnement et des règles de votre espace de travail.

Utilisez cette URL de serveur MCP :

\`\`\`text
${url}
\`\`\`

1. Dans les paramètres des connecteurs ou serveurs MCP de votre client, ajoutez un serveur distant.
2. Nommez-le **${appName}** et collez l’URL complète ci-dessus.
3. Sélectionnez **Streamable HTTP** et **OAuth** si le client le demande. Ne collez pas de jeton et ne configurez pas d’en-têtes personnalisés.
4. Connectez-vous avec votre propre compte, vérifiez les autorisations demandées et approuvez uniquement les clients de confiance.
5. Revenez dans votre client et activez la connexion dans une conversation.

Autorisez chaque client séparément. Demandez d’abord à votre assistant de présenter les outils disponibles. Vérifiez les actions proposées avant d’autoriser une modification de données.

## Autorisations et confidentialité

OAuth n’accorde pas de droits supplémentaires à votre compte. Les outils et les autorisations disponibles dépendent de l’application et de votre organisation.

Les résultats des outils sont transmis à votre fournisseur d’IA. Respectez les règles de votre organisation et ne partagez jamais de mots de passe ni de jetons dans une conversation. Pour interrompre l’accès, révoquez l’autorisation dans les paramètres de votre compte, si cette option est disponible, ou contactez votre administrateur. Supprimer le connecteur du client ne révoque pas nécessairement les jetons déjà émis.

## Dépannage

- **Impossible d’ajouter un serveur :** vérifiez la compatibilité MCP distant avec OAuth et les règles de votre espace de travail.
- **Serveur inaccessible :** utilisez l’URL publique complète ci-dessus. Un client hébergé ne peut pas joindre une adresse localhost sur votre ordinateur.
- **Session expirée :** reconnectez le client depuis ses paramètres.
- **Accès refusé :** vérifiez le compte et ses autorisations. Une reconnexion n’accorde pas de droits supplémentaires.`,
      }
    : {
        title: "MCP",
        description: `Connect an AI assistant to ${appName} with MCP and OAuth.`,
        body: `Connect your AI assistant to ${appName} using the Model Context Protocol (MCP).

## Connect your assistant

You need a client supporting remote MCP servers, Streamable HTTP, and OAuth. Availability depends on your plan and workspace policy.

Use this MCP server URL:

\`\`\`text
${url}
\`\`\`

1. In your client’s connector or MCP settings, add a remote server.
2. Name it **${appName}** and paste the full URL above.
3. Select **Streamable HTTP** and **OAuth** if prompted. Do not paste a token or configure custom headers.
4. Sign in using your own account, review the requested permissions, and approve only trusted clients.
5. Return to your client and enable the connection in a conversation.

Authorize each client separately. First ask your assistant to describe the available tools. Review proposed actions before allowing changes to data.

## Permissions and privacy

OAuth does not grant more access than your account already has. Available tools and permissions depend on the application and your organization.

Tool results are shared with your AI provider. Follow your organization’s policies and never share passwords or tokens in a conversation. To stop access, revoke authorization in your account settings, if available, or contact your administrator. Removing the connector from the client does not necessarily revoke tokens already issued.

## Troubleshooting

- **Cannot add a server:** check support for remote MCP with OAuth and your workspace policy.
- **Cannot reach the server:** use the full public URL above. A cloud-hosted client cannot reach localhost on your computer.
- **Session expired:** reconnect from your client’s settings.
- **Access denied:** check the account and its permissions. Reconnecting does not grant additional access.`,
      };

const webhooksContent = (
  locale: "en" | "fr",
  appName: string,
  reference: WebhookDocsConfig,
) =>
  locale === "fr"
    ? {
        title: "Webhooks",
        description: `Recevez les événements de ${appName} dans votre application.`,
        body: `Utilisez les webhooks de ${appName} pour recevoir des événements sur un point de terminaison HTTPS que vous contrôlez.

## Configurer un abonnement

Demandez à votre administrateur comment gérer les abonnements aux webhooks de cette application.

1. Créez un point de terminaison HTTPS public capable de recevoir les requêtes documentées.
2. Enregistrez son URL et sélectionnez uniquement les événements nécessaires.
3. Si un secret de signature est fourni, conservez-le dans un gestionnaire de secrets, jamais dans du code public ou une URL.
4. Utilisez un événement de test, si cette fonction est disponible, et vérifiez sa réception avant de traiter des événements réels.

## Événements et référence

${reference.events.length > 0 ? formatWebhookReference(locale, reference.events) : "Aucune définition d’événement n’a été fournie pour ce guide. Contactez votre administrateur pour obtenir les types d’événements et leurs schémas."}

Ne supposez pas que toutes les applications utilisent les mêmes noms d’événements, champs, versions ou identifiants de livraison. Validez les données reçues avec le schéma de l’événement avant de les utiliser.

## Vérifier les requêtes

${reference.verification?.[locale] ?? "Les paramètres de vérification propres à cette application n’ont pas été fournis pour ce guide. Obtenez-les auprès de votre administrateur avant de traiter des événements."}

Vérifiez l’authenticité avant de traiter un événement. Utilisez la méthode de vérification documentée par l’application ; HTTPS seul ne prouve pas l’identité de l’émetteur.

Pour les signatures calculées sur le corps brut, conservez les octets reçus avant toute analyse JSON. Utilisez les en-têtes, l’algorithme et le secret documentés, une comparaison en temps constant et les règles de validité temporelle prévues par le protocole. Rejetez les signatures absentes, invalides ou expirées lorsque la signature est requise. N’inventez pas de noms d’en-têtes ni d’algorithme.

Ne journalisez pas les secrets ni les charges utiles sensibles. Suivez la procédure de rotation des secrets propre à l’application.

## Nouvelles tentatives et doublons

${reference.delivery?.[locale] ?? "Les paramètres de livraison propres à cette application n’ont pas été fournis pour ce guide. Contactez votre administrateur pour connaître la politique de livraison."}

Concevez le traitement pour tolérer les doublons. Utilisez l’identifiant d’événement ou de livraison documenté comme clé d’idempotence, dans le périmètre de l’abonnement ou de l’organisation concernée. Enregistrez durablement l’état du traitement et empêchez les traitements concurrents de répéter les effets de bord.

Lorsque le protocole le permet, validez la requête puis enregistrez-la durablement ou placez-la dans une file avant de répondre avec le statut de succès attendu. Exécutez les traitements longs en arrière-plan. N’accusez pas réception avant de pouvoir reprendre le traitement après une interruption.

Les statuts de succès, délais, calendriers de nouvelle tentative, durées de conservation et possibilités de relivraison dépendent de l’application. Ne supposez ni une livraison exactement une fois ni un ordre de livraison garanti sans engagement explicite dans la référence.

## Dépannage

- **Aucun événement reçu :** vérifiez l’abonnement, les événements sélectionnés et l’accessibilité HTTPS du point de terminaison.
- **Signature invalide :** vérifiez le secret actif, les en-têtes documentés, le corps brut et l’horloge de votre serveur si le protocole utilise un horodatage.
- **Livraison en échec :** consultez les journaux disponibles et vérifiez le statut HTTP et le délai de réponse de votre serveur. Suivez la procédure de relivraison de l’application, si elle existe.
- **Effets répétés :** vérifiez la persistance et le périmètre de votre clé d’idempotence, y compris lors de traitements concurrents.`,
      }
    : {
        title: "Webhooks",
        description: `Receive ${appName} events in your application.`,
        body: `Use ${appName} webhooks to receive events at an HTTPS endpoint you control.

## Configure a subscription

Ask your administrator how to manage webhook subscriptions for this application.

1. Create a public HTTPS endpoint that accepts the documented requests.
2. Register its URL and select only the events you need.
3. If a signing secret is provided, store it in a secrets manager, never in public code or a URL.
4. Use a test event, if available, and verify receipt before processing live events.

## Events and reference

${reference.events.length > 0 ? formatWebhookReference(locale, reference.events) : "No event definitions were supplied for this guide. Contact your administrator for event types and their schemas."}

Do not assume every application uses the same event names, fields, versions, or delivery identifiers. Validate incoming data against the event schema before using it.

## Verify requests

${reference.verification?.[locale] ?? "Application-specific verification settings were not supplied for this guide. Obtain them from your administrator before processing events."}

Verify authenticity before processing an event. Use the application's documented verification method; HTTPS alone does not prove the sender's identity.

For signatures computed over the raw body, preserve the received bytes before parsing JSON. Use the documented headers, algorithm, and secret, a constant-time comparison, and any protocol-defined timestamp validity checks. Reject missing, invalid, or expired signatures when signing is required. Do not invent header names or an algorithm.

Do not log secrets or sensitive payloads. Follow the application's secret rotation procedure.

## Retries and duplicates

${reference.delivery?.[locale] ?? "Application-specific delivery settings were not supplied for this guide. Contact your administrator for the delivery policy."}

Design processing to tolerate duplicates. Use the documented event or delivery identifier as an idempotency key, scoped to the relevant subscription or organization. Persist processing state durably and prevent concurrent handlers from repeating side effects.

Where the protocol allows, validate the request and persist or enqueue it durably before returning the expected success status. Run long tasks in the background. Do not acknowledge receipt before you can resume processing after an interruption.

Success statuses, timeouts, retry schedules, retention periods, and redelivery options depend on the application. Do not assume exactly-once delivery or guaranteed ordering unless the reference explicitly promises them.

## Troubleshooting

- **No events received:** check the subscription, selected events, and endpoint's public HTTPS accessibility.
- **Invalid signature:** check the active secret, documented headers, raw body, and your server clock if the protocol uses a timestamp.
- **Failed delivery:** inspect available delivery logs and check your server's HTTP status and response time. Follow the application's redelivery procedure, if available.
- **Repeated effects:** check your idempotency key's persistence and scope, including concurrent processing.`,
      };

/** Compile on the server, then pass the records to createDocsSource. Requires Bun. */
export const createIntegrationDocs = (
  config: IntegrationDocsConfig,
): DocsPage[] => {
  const basePath = (config.basePath ?? "/docs").replace(/\/$/, "");
  const pages: DocsPage[] = [];
  for (const locale of config.locales ?? ["en", "fr"]) {
    const add = (
      slug: string,
      order: number,
      icon: string,
      content: { title: string; description: string; body: string },
    ) => {
      pages.push({
        slug,
        path: `${basePath}/${slug}`,
        locale,
        order,
        icon,
        section: config.section ?? "integration",
        type: "how-to",
        title: content.title,
        description: content.description,
        sourceFile: `integrations/${locale}/${slug}.mdx`,
        ...compileDocsMarkdown(content.body),
      });
    };
    if (config.api) {
      const reference = new URL(
        config.api === true
          ? "/api/docs"
          : (config.api.referenceUrl ?? "/api/docs"),
        config.origin,
      ).href;
      add(
        "api-access",
        config.order ?? 1000,
        "lucide:braces",
        apiContent(locale, config.appName, reference),
      );
    }
    if (config.mcp) {
      const url = new URL(
        config.mcp === true ? "/api/mcp" : (config.mcp.url ?? "/api/mcp"),
        config.origin,
      ).href;
      add(
        "mcp",
        (config.order ?? 1000) + 1,
        "lucide:bot",
        mcpContent(locale, config.appName, url),
      );
    }
    if (config.webhooks) {
      const settings =
        config.webhooks === true ? { events: [] } : config.webhooks;
      add(
        "webhooks",
        (config.order ?? 1000) + 2,
        "lucide:webhook",
        webhooksContent(locale, config.appName, settings),
      );
    }
  }
  const local = config.pages ?? [];
  return [
    ...pages.filter(
      (page) =>
        !local.some(
          (override) =>
            override.slug === page.slug && override.locale === page.locale,
        ),
    ),
    ...local,
  ];
};
