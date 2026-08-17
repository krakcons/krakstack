import { useEffect, useState } from "react";
import { Schema } from "effect";

type RegistryItemMetadata = {
  name: string;
  title?: string;
  description?: string;
};

const RegistryItemMetadata = Schema.Struct({
  name: Schema.String,
  title: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
}).annotate({ identifier: "RegistryItemMetadata" });

export function useRegistryItem(slug: string, fallback: RegistryItemMetadata) {
  const [item, setItem] = useState(fallback);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/r/${slug}.json`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) return fallback;
        return response
          .json()
          .then(Schema.decodeUnknownSync(RegistryItemMetadata));
      })
      .then((metadata) => setItem(metadata))
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setItem(fallback);
      });

    return () => controller.abort();
  }, [fallback, slug]);

  return item;
}
