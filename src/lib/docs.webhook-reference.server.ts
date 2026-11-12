import { Option, Schema, type JsonSchema } from "effect";
import type { Json } from "effect/Schema";

const ReferenceNode = Schema.Struct({
  $ref: Schema.optional(Schema.String),
  type: Schema.optional(
    Schema.Union([Schema.String, Schema.Array(Schema.String)]),
  ),
  description: Schema.optional(Schema.String),
  format: Schema.optional(Schema.String),
  enum: Schema.optional(Schema.Array(Schema.Json)),
  const: Schema.optional(Schema.Json),
  properties: Schema.optional(Schema.Record(Schema.String, Schema.Json)),
  required: Schema.optional(Schema.Array(Schema.String)),
  items: Schema.optional(Schema.Json),
  additionalProperties: Schema.optional(Schema.Json),
  anyOf: Schema.optional(Schema.Array(Schema.Json)),
  oneOf: Schema.optional(Schema.Array(Schema.Json)),
  allOf: Schema.optional(Schema.Array(Schema.Json)),
}).annotate({ identifier: "WebhookReferenceNode" });
type ReferenceNode = typeof ReferenceNode.Type;
type Definitions = JsonSchema.Definitions;
type SchemaSource = Json | JsonSchema.JsonSchema | undefined;

export type WebhookReferenceField = {
  path: string;
  type: string;
  required: "yes" | "no" | "conditional";
  description: string;
};

const readNode = (value: SchemaSource): ReferenceNode =>
  Schema.decodeUnknownOption(ReferenceNode)(value).pipe(
    Option.getOrElse(() => ({})),
  );

const referenceKey = (node: ReferenceNode) =>
  node.$ref?.startsWith("#/$defs/")
    ? decodeURIComponent(node.$ref.slice(8))
        .replace(/~1/g, "/")
        .replace(/~0/g, "~")
    : undefined;

const resolve = (
  value: SchemaSource,
  definitions: Definitions,
  seen = new Set<string>(),
): ReferenceNode => {
  const node = readNode(value);
  const key = referenceKey(node);
  if (!key || seen.has(key) || definitions[key] === undefined) return node;
  return {
    ...resolve(definitions[key], definitions, new Set([...seen, key])),
    ...node,
  };
};

const variants = (
  value: SchemaSource,
  definitions: Definitions,
  seen = new Set<string>(),
): ReadonlyArray<ReferenceNode> => {
  const key = referenceKey(readNode(value));
  if (key && seen.has(key)) return [];
  const next = new Set([...seen, ...(key ? [key] : [])]);
  const node = resolve(value, definitions);
  const union = node.anyOf ?? node.oneOf;
  if (union) return union.flatMap((part) => variants(part, definitions, next));
  if (node.allOf) {
    const parts = node.allOf.map((part) => resolve(part, definitions));
    return [
      {
        ...node,
        properties: Object.assign(
          {},
          ...parts.map((part) => part.properties),
          node.properties,
        ),
        required: [
          ...new Set([
            ...parts.flatMap((part) => part.required ?? []),
            ...(node.required ?? []),
          ]),
        ],
      },
    ];
  }
  return [node];
};

const typeLabel = (
  value: SchemaSource,
  definitions: Definitions,
  seen = new Set<string>(),
): string => {
  if (value === false) return "never";
  const node = readNode(value);
  const key = referenceKey(node);
  if (key && seen.has(key)) return "object (recursive)";
  const next = new Set([...seen, ...(key ? [key] : [])]);
  const resolved = resolve(value, definitions);
  const union = resolved.anyOf ?? resolved.oneOf;
  if (union) {
    const types = [
      ...new Set(union.map((part) => typeLabel(part, definitions, next))),
    ];
    return types.includes("unknown") ? "unknown" : types.join(" | ");
  }
  if (resolved.enum)
    return resolved.enum.map((entry) => JSON.stringify(entry)).join(" | ");
  if (resolved.const !== undefined) return JSON.stringify(resolved.const);
  if (resolved.type && Schema.is(Schema.Array(Schema.String))(resolved.type))
    return resolved.type.join(" | ");
  if (resolved.type === "array")
    return `Array<${typeLabel(resolved.items, definitions, next)}>`;
  if (
    resolved.type === "object" &&
    resolved.additionalProperties &&
    !resolved.properties
  ) {
    return `Record<string, ${typeLabel(resolved.additionalProperties, definitions, next)}>`;
  }
  const type = resolved.type ?? (resolved.properties ? "object" : "unknown");
  return `${type}${resolved.format ? ` (${resolved.format})` : ""}`;
};

/** Flatten fields, not definitions: required is relative to the containing object. */
export const webhookReferenceFields = (
  schema: SchemaSource,
  definitions: Definitions,
  prefix = "",
): WebhookReferenceField[] => {
  const fields: WebhookReferenceField[] = [];
  const visit = (
    value: SchemaSource,
    path: string,
    ancestors: ReadonlySet<string>,
  ) => {
    const key = referenceKey(readNode(value));
    if (key && ancestors.has(key)) return;
    const nodes = variants(value, definitions, new Set(ancestors));
    const next = new Set([
      ...ancestors,
      ...(key ? [key] : []),
      ...nodes.flatMap((node) => {
        const ref = referenceKey(node);
        return ref ? [ref] : [];
      }),
    ]);
    const objects = nodes.filter((node) => node.properties !== undefined);
    const names = [
      ...new Set(objects.flatMap((node) => Object.keys(node.properties ?? {}))),
    ];
    for (const name of names) {
      const members = objects.filter(
        (node) => node.properties?.[name] !== undefined,
      );
      const choices = members.map((node) => node.properties?.[name]);
      const fieldPath = path ? `${path}.${name}` : name;
      const required =
        members.length < objects.length
          ? "conditional"
          : members.every((node) => node.required?.includes(name))
            ? "yes"
            : "no";
      const descriptions = [
        ...new Set(
          choices
            .map((choice) => resolve(choice, definitions).description)
            .filter((description) => description !== undefined),
        ),
      ];
      fields.push({
        path: fieldPath,
        type: [
          ...new Set(choices.map((choice) => typeLabel(choice, definitions))),
        ].join(" | "),
        required,
        description: descriptions.join(" "),
      });
      visit({ anyOf: choices }, fieldPath, next);
    }
    for (const node of nodes) {
      if (node.items !== undefined) visit(node.items, `${path}[]`, next);
      if (
        node.additionalProperties !== undefined &&
        node.additionalProperties !== true &&
        node.additionalProperties !== false
      ) {
        fields.push({
          path: path ? `${path}.*` : "*",
          type: typeLabel(node.additionalProperties, definitions),
          required: "no",
          description: "",
        });
        visit(node.additionalProperties, path ? `${path}.*` : "*", next);
      }
    }
  };
  visit(schema, prefix, new Set());
  if (fields.length === 0)
    fields.push({
      path: prefix || "$",
      type: typeLabel(schema, definitions),
      required: "yes",
      description: resolve(schema, definitions).description ?? "",
    });
  return fields;
};

// Markdown tables need escaping even inside code spans.
const cell = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\|/g, "\\|")
    .replace(/[\r\n]+/g, " ")
    .replace(/`/g, "&#96;");
const code = (value: string) => {
  const text = value.replace(/\|/g, "\\|").replace(/[\r\n]+/g, " ");
  const fence = "`".repeat(
    Math.max(
      1,
      ...Array.from(text.matchAll(/`+/g), (match) => match[0].length + 1),
    ),
  );
  return fence.length === 1
    ? `${fence}${text}${fence}`
    : `${fence} ${text} ${fence}`;
};

const fingerprint = (schema: SchemaSource, definitions: Definitions) => {
  const reachable = new Map<string, JsonSchema.JsonSchema>();
  const visit = (value: SchemaSource) => {
    const node = readNode(value);
    const key = referenceKey(node);
    if (key && !reachable.has(key) && definitions[key] !== undefined) {
      reachable.set(key, definitions[key]);
      visit(definitions[key]);
    }
    for (const child of [
      ...Object.values(node.properties ?? {}),
      ...(node.anyOf ?? []),
      ...(node.oneOf ?? []),
      ...(node.allOf ?? []),
      node.items,
      node.additionalProperties,
    ])
      visitChild(child);
  };
  const visitChild = (value: SchemaSource) => {
    if (value !== undefined) visit(value);
  };
  visit(schema);
  return JSON.stringify([
    schema,
    [...reachable.entries()].sort(([a], [b]) => a.localeCompare(b)),
  ]);
};

export const formatWebhookReference = (
  locale: "en" | "fr",
  events: ReadonlyArray<{
    name: string;
    description: Readonly<{ en: string; fr: string }>;
    payload: Schema.Top;
  }>,
) => {
  const records = events.map((event) => {
    const document = Schema.toJsonSchemaDocument(event.payload);
    const body = resolve(document.schema, document.definitions);
    const eventNode = resolve(body.properties?.event, document.definitions);
    const envelope =
      Object.keys(body.properties ?? {}).length === 2 &&
      body.required?.includes("event") &&
      body.required.includes("data") &&
      (eventNode.const === event.name ||
        (eventNode.enum?.length === 1 && eventNode.enum[0] === event.name));
    return {
      event,
      document,
      schema: envelope
        ? (body.properties?.data ?? document.schema)
        : document.schema,
      envelope,
    };
  });
  const grouped = new Map<string, typeof records>();
  for (const record of records) {
    const key = fingerprint(record.schema, record.document.definitions);
    const group = grouped.get(key);
    if (group) group.push(record);
    else grouped.set(key, [record]);
  }
  const groups = [...grouped.values()];
  const payloadLabel = locale === "fr" ? "Charge utile" : "Payload";
  const summary = records.map((record) => {
    const index = groups.findIndex((group) => group.includes(record)) + 1;
    const anchor =
      locale === "fr" ? `charge-utile-${index}` : `payload-${index}`;
    return `| ${code(record.event.name)} | ${cell(record.event.description[locale])} | [${payloadLabel} ${index}](#${anchor}) |`;
  });
  const tables = groups.map((group, index) => {
    const record = group[0];
    if (!record) return "";
    const fields = webhookReferenceFields(
      record.schema,
      record.document.definitions,
      record.envelope ? "data" : "",
    );
    const hasDescriptions = fields.some(
      (field) => field.description.length > 0,
    );
    const rows = fields.map(
      (field) =>
        `| ${code(field.path)} | ${code(field.type)} | ${locale === "fr" ? { yes: "Oui", no: "Non", conditional: "Selon le cas" }[field.required] : { yes: "Yes", no: "No", conditional: "Conditional" }[field.required]} |${hasDescriptions ? ` ${cell(field.description) || "—"} |` : ""}`,
    );
    const header =
      locale === "fr"
        ? "| Champ | Type | Obligatoire |"
        : "| Field | Type | Required |";
    return `### ${payloadLabel} ${index + 1}\n\n${group.map(({ event }) => code(event.name)).join(", ")}\n\n${header}${hasDescriptions ? " Description |" : ""}\n| --- | --- | --- |${hasDescriptions ? " --- |" : ""}\n${rows.join("\n")}`;
  });
  const envelopeNote = records.every((record) => record.envelope)
    ? locale === "fr"
      ? "Le corps contient `event` (le nom de l’événement ci-dessous) et `data` (la charge utile correspondante)."
      : "The body contains `event` (the event name below) and `data` (the corresponding payload)."
    : "";
  return `${envelopeNote}\n\n${locale === "fr" ? "| Événement | Description | Charge utile |" : "| Event | Description | Payload |"}\n| --- | --- | --- |\n${summary.join("\n")}\n\n${locale === "fr" ? "Les événements partageant la même structure sont regroupés. « Obligatoire » s’applique à l’objet contenant le champ ; les champs imbriqués s’appliquent uniquement si leur parent est présent et non nul. « Selon le cas » indique un champ propre à une variante. `[]` désigne un élément de tableau et `*` une clé libre." : "Events with the same payload share one reference. Required applies within the containing object; nested fields apply only when their parent is present and non-null. Conditional fields belong to a particular variant. `[]` denotes an array item and `*` an arbitrary key."}\n\n${tables.join("\n\n")}`;
};
