import { useAtomValue } from "@effect/atom-react";
import { Effect, Schema } from "effect";
import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/unstable/http";
import { AsyncResult, Atom } from "effect/unstable/reactivity";
import { useDeferredValue, useState } from "react";
import { Icon } from "@iconify/react";
import { ExternalLink, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { VirtualizedCombobox } from "@/components/ui/virtualized-combobox";
import { getLocale } from "@/paraglide/runtime";

const IconifySearchResponse = Schema.Struct({
  icons: Schema.Array(Schema.String),
}).pipe(Schema.annotate({ identifier: "IconifySearchResponse" }));

const iconifyRuntime = Atom.runtime(FetchHttpClient.layer);

const iconSearchAtoms = Atom.family((key: string) => {
  const separatorIndex = key.indexOf("\u0000");
  const collection = key.slice(0, separatorIndex);
  const query = key.slice(separatorIndex + 1);

  return iconifyRuntime.atom(
    Effect.gen(function* () {
      if (!query.trim()) return [];

      const client = yield* HttpClient.HttpClient;
      const request = HttpClientRequest.get(
        "https://api.iconify.design/search",
      ).pipe(HttpClientRequest.setUrlParams({ prefix: collection, query }));
      const response = yield* client.execute(request);
      const { icons } = yield* HttpClientResponse.schemaBodyJson(
        IconifySearchResponse,
      )(response);

      return icons
        .filter((icon) => icon.startsWith(`${collection}:`))
        .map((icon) => icon.slice(collection.length + 1));
    }).pipe(
      // Iconify does not allow cross-origin tracing headers in browser requests.
      Effect.provideService(HttpClient.TracerPropagationEnabled, false),
    ),
  );
});

const useIconSearchAtom = (collection: string, query: string) =>
  useAtomValue(iconSearchAtoms(`${collection}\u0000${query}`));

const labels = {
  en: {
    browse: "Browse Iconify",
    empty: "No icons found.",
    searchPlaceholder: "Search icons",
    searchPrompt: "Start typing to search icons.",
    select: "Select icon",
  },
  fr: {
    browse: "Parcourir Iconify",
    empty: "Aucune icône trouvée.",
    searchPlaceholder: "Rechercher des icônes",
    searchPrompt: "Commencez à taper pour rechercher des icônes.",
    select: "Sélectionner une icône",
  },
} as const;

const iconInputLabels = () =>
  getLocale().startsWith("fr") ? labels.fr : labels.en;

type IconInputProps = {
  collection?: string;
  disabled?: boolean;
  id?: string;
  onValueChange: (value: string) => void;
  value: string;
};

const iconifyCollectionUrl = (collection: string) =>
  `https://icon-sets.iconify.design/${encodeURIComponent(collection)}/`;

export function IconInput({
  collection = "lucide",
  disabled,
  id,
  onValueChange,
  value,
}: IconInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const iconSearchResult = useIconSearchAtom(collection, deferredQuery);
  const icons = AsyncResult.isSuccess(iconSearchResult)
    ? iconSearchResult.value
    : [];
  const copy = iconInputLabels();
  const isWaiting =
    deferredQuery.trim() !== "" && AsyncResult.isWaiting(iconSearchResult);

  const items = icons.map((icon) => ({ label: icon, value: icon }));
  const selectedItem = value ? { label: value, value } : null;

  return (
    <VirtualizedCombobox
      ariaLabel={copy.select}
      contentClassName="w-80"
      emptyLabel={
        isWaiting ? null : (
          <div className="text-muted-foreground flex flex-col items-center gap-2 px-3">
            <Search className="size-5" />
            <p>{query ? copy.empty : copy.searchPrompt}</p>
            <Button
              render={
                <a
                  href={iconifyCollectionUrl(collection)}
                  rel="noreferrer"
                  target="_blank"
                />
              }
              size="sm"
              variant="link"
            >
              {copy.browse} <ExternalLink className="inline size-3" />
            </Button>
          </div>
        )
      }
      items={items}
      messages={{ search: copy.searchPlaceholder }}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) setQuery("");
      }}
      open={isOpen}
      onSearchValueChange={setQuery}
      onValueChange={(item) => {
        if (!item) return;
        onValueChange(item.value);
        setQuery("");
        setIsOpen(false);
      }}
      placeholder={copy.select}
      renderItem={(item) => (
        <>
          <Icon
            className="size-5 shrink-0"
            icon={`${collection}:${item.value}`}
          />
          <span className="truncate">{item.label}</span>
          <span className="sr-only">{copy.select}</span>
        </>
      )}
      searchValue={query}
      trigger={
        <Button
          aria-label={copy.select}
          disabled={disabled}
          id={id}
          size="icon"
          title={value}
          type="button"
          variant="outline"
        >
          <Icon className="size-5" icon={`${collection}:${value}`} />
        </Button>
      }
      value={selectedItem}
      {...(disabled === undefined ? {} : { disabled })}
    />
  );
}
