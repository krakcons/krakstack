import { useEffect, useState } from "react";

type RegistryItemMetadata = {
  name: string;
  title?: string;
  description?: string;
};

export function useRegistryItem(slug: string, fallback: RegistryItemMetadata) {
  const [item, setItem] = useState(fallback);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/r/${slug}.json`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) return fallback;
        return response.json() as Promise<RegistryItemMetadata>;
      })
      .then((metadata) => setItem(metadata))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setItem(fallback);
      });

    return () => controller.abort();
  }, [fallback, slug]);

  return item;
}
