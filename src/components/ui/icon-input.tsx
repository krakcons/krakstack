import { useAtomValue } from "@effect/atom-react";
import { Effect, Schema } from "effect";
import {
  FetchHttpClient,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/unstable/http";
import { AsyncResult, Atom } from "effect/unstable/reactivity";
import { useDeferredValue, useId, useState } from "react";
import { Icon } from "@iconify/react";
import { ExternalLink, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const searchInputId = useId();
  const deferredQuery = useDeferredValue(query);
  const iconSearchResult = useIconSearchAtom(collection, deferredQuery);
  const icons = AsyncResult.isSuccess(iconSearchResult)
    ? iconSearchResult.value
    : [];
  const copy = iconInputLabels();
  const isWaiting =
    deferredQuery.trim() !== "" && AsyncResult.isWaiting(iconSearchResult);

  const selectIcon = (icon: string) => {
    onValueChange(icon);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <Popover
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) {
          setQuery("");
          window.requestAnimationFrame(() =>
            document
              .getElementById(searchInputId)
              ?.focus({ preventScroll: true }),
          );
        }
      }}
      open={isOpen}
    >
      <PopoverTrigger
        render={
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
      />
      <PopoverContent align="start" className="w-80 p-0">
        <Command shouldFilter={false} value={query}>
          <CommandInput
            id={searchInputId}
            onValueChange={setQuery}
            placeholder={copy.searchPlaceholder}
            value={query}
          />
          <CommandList className="h-72">
            {isWaiting ? null : icons.length > 0 ? (
              <CommandGroup>
                {icons.map((icon) => (
                  <CommandItem
                    key={icon}
                    onSelect={() => selectIcon(icon)}
                    value={icon}
                  >
                    <Icon
                      className="size-5 shrink-0"
                      icon={`${collection}:${icon}`}
                    />
                    <span className="truncate">{icon}</span>
                    <span className="sr-only">{copy.select}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              <CommandEmpty className="flex h-72 items-center justify-center">
                <div className="text-muted-foreground flex flex-col items-center gap-2">
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
              </CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
