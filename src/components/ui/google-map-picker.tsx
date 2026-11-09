import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { ChevronDown, LocateFixed, MapPin, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { GoogleMap, type GoogleMapPoint } from "@/components/ui/google-map";
import { Input } from "@/components/ui/input";
import { useKrakstackLocale } from "@/components/ui/krakstack-provider";
import { cn } from "@/lib/utils";

export const googleMapPickerRadiiKm = [1, 2, 5, 10, 20, 40, 60, 80, 100, 250, 500] as const;

export type GoogleMapPickerLocation = {
  id: string;
  label: string;
  title?: string | undefined;
  details?: string | undefined;
  center: GoogleMapPoint;
};

export type GoogleMapPickerMessages = {
  title: string;
  location: string;
  placeholder: string;
  clear: string;
  close: string;
  currentLocation: string;
  searchWithin: string;
  suggestions: string;
  loading: string;
  noResults: string;
  searchHint: string;
  ipNotice: string;
  browserNotice: string;
  radiusHint: string;
  cancel: string;
  confirm: string;
  confirmError: string;
};

export type GoogleMapPickerProps = {
  apiKey: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  input: string;
  onInputChange: (input: string) => void;
  selectedLocation: GoogleMapPickerLocation | null;
  suggestions: readonly GoogleMapPickerLocation[];
  onSelectLocation: (location: GoogleMapPickerLocation) => void;
  radiusKm: number;
  onRadiusChange: (radiusKm: number) => void;
  radiusOptions?: readonly number[] | undefined;
  onConfirm: (selection: {
    location: GoogleMapPickerLocation;
    radiusKm: number;
  }) => void | Promise<void>;
  onUseCurrentLocation?: (() => void) | undefined;
  locating?: boolean | undefined;
  loadingSuggestions?: boolean | undefined;
  suggestionsError?: string | undefined;
  error?: string | undefined;
  provenance?: "ip" | "browser" | undefined;
  overlayColor?: string | undefined;
  className?: string | undefined;
  confirmClassName?: string | undefined;
  locale?: string | undefined;
  messages?: Partial<Record<string, Partial<GoogleMapPickerMessages>>> | undefined;
};

const defaultMessages = {
  en: {
    title: "Choose your location",
    location: "City or address",
    placeholder: "Search a city or address…",
    clear: "Clear location",
    close: "Close",
    currentLocation: "Use my location",
    searchWithin: "Search within",
    suggestions: "Location suggestions",
    loading: "Finding matching places…",
    noResults: "No matching places. Try a city or address.",
    searchHint: "Search for a place and choose a suggestion to preview it on the map.",
    ipNotice: "Using your approximate location from your IP address.",
    browserNotice: "Using your browser location.",
    radiusHint: "The circle shows your search area.",
    cancel: "Cancel",
    confirm: "Use this location",
    confirmError: "Your location could not be saved. Try again.",
  },
  fr: {
    title: "Choisir votre lieu",
    location: "Ville ou adresse",
    placeholder: "Rechercher une ville ou une adresse…",
    clear: "Effacer le lieu",
    close: "Fermer",
    currentLocation: "Utiliser ma position",
    searchWithin: "Rechercher dans un rayon de",
    suggestions: "Suggestions de lieux",
    loading: "Recherche de lieux…",
    noResults: "Aucun lieu correspondant. Essayez une ville ou une adresse.",
    searchHint: "Recherchez un lieu et choisissez une suggestion pour le voir sur la carte.",
    ipNotice: "Position approximative obtenue à partir de votre adresse IP.",
    browserNotice: "Position fournie par votre navigateur.",
    radiusHint: "Le cercle indique votre zone de recherche.",
    cancel: "Annuler",
    confirm: "Utiliser ce lieu",
    confirmError: "Votre lieu n’a pas pu être enregistré. Réessayez.",
  },
} satisfies Record<"en" | "fr", GoogleMapPickerMessages>;

/** Controlled picker: the host owns lookup, location acquisition and persisted state. */
export const GoogleMapPicker = ({
  apiKey,
  open,
  onOpenChange,
  input,
  onInputChange,
  selectedLocation,
  suggestions: locationSuggestions,
  onSelectLocation,
  radiusKm,
  onRadiusChange,
  radiusOptions = googleMapPickerRadiiKm,
  onConfirm,
  onUseCurrentLocation,
  locating = false,
  loadingSuggestions = false,
  suggestionsError,
  error,
  provenance,
  overlayColor = "#f56476",
  className,
  confirmClassName,
  locale: localeOverride,
  messages,
}: GoogleMapPickerProps) => {
  const locale = useKrakstackLocale(localeOverride);
  const suggestions = locationSuggestions.slice(0, 3);
  const baseLocale = locale.split("-")[0] ?? "en";
  const labels = {
    ...(baseLocale === "fr" ? defaultMessages.fr : defaultMessages.en),
    ...messages?.[baseLocale],
    ...messages?.[locale],
  };
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [applying, setApplying] = useState(false);
  const [confirmFailed, setConfirmFailed] = useState(false);
  const selectedMatchesInput = selectedLocation?.label === input.trim();
  const notice =
    provenance === "ip"
      ? labels.ipNotice
      : provenance === "browser"
        ? labels.browserNotice
        : !selectedMatchesInput
          ? labels.searchHint
          : undefined;
  const markerIcon = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48"><path d="M20 46s15-14.3 15-27A15 15 0 1 0 5 19c0 12.7 15 27 15 27Z" fill="${overlayColor}" stroke="white" stroke-width="3"/><circle cx="20" cy="19" r="6" fill="white"/></svg>`)}`;

  useEffect(() => {
    if (!open || !window.visualViewport) return;
    const viewport = window.visualViewport;
    const sync = () => {
      popupRef.current?.style.setProperty("--map-picker-height", `${viewport.height}px`);
      popupRef.current?.style.setProperty("--map-picker-top", `${viewport.offsetTop}px`);
    };
    sync();
    viewport.addEventListener("resize", sync);
    viewport.addEventListener("scroll", sync);
    return () => {
      viewport.removeEventListener("resize", sync);
      viewport.removeEventListener("scroll", sync);
    };
  }, [open]);

  useEffect(() => {
    if (dropdownOpen && activeIndex >= 0)
      document
        .getElementById(`${id}-option-${activeIndex}`)
        ?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex, dropdownOpen, id]);

  const changeOpen = (next: boolean) => {
    if (applying) return;
    setDropdownOpen(false);
    setActiveIndex(-1);
    setConfirmFailed(false);
    onOpenChange(next);
  };
  const select = (location: GoogleMapPickerLocation) => {
    onInputChange(location.label);
    onSelectLocation(location);
    inputRef.current?.focus();
    setDropdownOpen(false);
    setActiveIndex(-1);
  };
  const confirm = async () => {
    if (applying || !selectedLocation || !selectedMatchesInput) return;
    setApplying(true);
    setConfirmFailed(false);
    setDropdownOpen(false);
    try {
      await onConfirm({ location: selectedLocation, radiusKm });
      onOpenChange(false);
    } catch {
      setConfirmFailed(true);
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Popup
          ref={popupRef}
          initialFocus={inputRef}
          aria-describedby={undefined}
          data-slot="google-map-picker"
          className={cn(
            "bg-muted text-foreground fixed left-1/2 z-50 flex h-[var(--map-picker-height,100dvh)] w-screen max-w-none -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden border p-0 outline-none top-[calc(var(--map-picker-top,0px)_+_var(--map-picker-height,100dvh)/2)] sm:h-[min(46.75rem,calc(var(--map-picker-height,100dvh)_-_5rem))] sm:w-[calc(100vw-4rem)] sm:max-w-[840px] sm:rounded-[10px] [@media(max-height:599px)]:h-[var(--map-picker-height,100dvh)]",
            className,
          )}
        >
          <DialogHeader className="shrink-0 px-5 pt-6 pr-16 pb-5 text-left sm:px-7 sm:pt-[25px] sm:pb-[22px] [@media(max-height:599px)]:py-4">
            <DialogTitle className="text-2xl font-semibold">{labels.title}</DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 size-11"
              disabled={applying}
              aria-label={labels.close}
              onClick={() => changeOpen(false)}
            >
              <X />
            </Button>
          </DialogHeader>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-[18px] overflow-y-auto px-5 pb-6 sm:px-7 [@media(max-height:599px)]:pb-3">
            <fieldset
              disabled={applying}
              data-slot="google-map-picker-toolbar"
              className={cn(
                "grid min-w-0 shrink-0 grid-cols-1 items-end gap-3",
                onUseCurrentLocation && "sm:grid-cols-[minmax(0,1fr)_max-content]",
              )}
            >
              <div
                className="relative flex min-w-0 flex-col gap-2"
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) setDropdownOpen(false);
                }}
              >
                <label htmlFor={`${id}-input`} className="text-sm font-medium">
                  {labels.location}
                </label>
                <div className="relative">
                  <Search
                    aria-hidden="true"
                    className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
                  />
                  <Input
                    ref={inputRef}
                    id={`${id}-input`}
                    value={input}
                    placeholder={labels.placeholder}
                    className="bg-card h-[50px] w-full rounded-md pr-11 pl-11 text-base"
                    autoComplete="off"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-controls={`${id}-suggestions`}
                    aria-expanded={dropdownOpen}
                    aria-activedescendant={
                      dropdownOpen && suggestions[activeIndex]
                        ? `${id}-option-${activeIndex}`
                        : undefined
                    }
                    onFocus={() => {
                      if (input.trim() && !selectedMatchesInput) setDropdownOpen(true);
                    }}
                    onChange={(event) => {
                      onInputChange(event.currentTarget.value);
                      setActiveIndex(-1);
                      setConfirmFailed(false);
                      setDropdownOpen(Boolean(event.currentTarget.value.trim()));
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Escape" && dropdownOpen) {
                        event.preventDefault();
                        event.stopPropagation();
                        setDropdownOpen(false);
                      }
                      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                        event.preventDefault();
                        setDropdownOpen(true);
                        if (suggestions.length)
                          setActiveIndex((index) =>
                            index < 0
                              ? event.key === "ArrowDown"
                                ? 0
                                : suggestions.length - 1
                              : (index +
                                  (event.key === "ArrowDown" ? 1 : -1) +
                                  suggestions.length) %
                                suggestions.length,
                          );
                      }
                      if (event.key === "Enter" && dropdownOpen) {
                        event.preventDefault();
                        const location = suggestions[activeIndex];
                        if (location) select(location);
                      }
                    }}
                  />
                  {input ? (
                    <button
                      type="button"
                      aria-label={labels.clear}
                      className="text-muted-foreground absolute top-[3px] right-1 grid size-11 cursor-pointer place-items-center rounded focus-visible:outline-2 focus-visible:outline-offset-2"
                      onClick={() => {
                        onInputChange("");
                        setDropdownOpen(false);
                        setActiveIndex(-1);
                        inputRef.current?.focus();
                      }}
                    >
                      <X className="size-4" />
                    </button>
                  ) : null}
                </div>
                {dropdownOpen ? (
                  <div
                    id={`${id}-suggestions`}
                    role="listbox"
                    aria-label={labels.suggestions}
                    aria-busy={loadingSuggestions}
                    className="bg-popover text-popover-foreground absolute inset-x-0 top-full z-30 mt-1 max-h-[min(16rem,35dvh)] overflow-y-auto rounded-md border p-1 shadow-lg"
                  >
                    {suggestions.map((location, index) => (
                      <button
                        key={location.id}
                        id={`${id}-option-${index}`}
                        type="button"
                        role="option"
                        tabIndex={-1}
                        aria-label={location.label}
                        aria-selected={index === activeIndex}
                        className={cn(
                          "hover:bg-accent flex min-h-11 w-full items-center gap-3 rounded px-3 py-3 text-left",
                          index === activeIndex && "bg-accent",
                        )}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => select(location)}
                      >
                        <MapPin
                          aria-hidden="true"
                          className="size-4 shrink-0"
                          style={{ color: overlayColor }}
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium wrap-anywhere">
                            {location.title ?? location.label}
                          </span>
                          {location.details ? (
                            <span className="text-muted-foreground mt-1 block text-xs wrap-anywhere">
                              {location.details}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    ))}
                    {loadingSuggestions ? (
                      <p role="status" className="text-muted-foreground p-3 text-sm">
                        {labels.loading}
                      </p>
                    ) : suggestionsError ? (
                      <p role="alert" className="text-destructive p-3 text-sm">
                        {suggestionsError}
                      </p>
                    ) : !suggestions.length ? (
                      <p className="text-muted-foreground p-3 text-sm">{labels.noResults}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
              {onUseCurrentLocation ? (
                <Button
                  type="button"
                  variant="outline"
                  data-slot="google-map-picker-current"
                  disabled={locating}
                  className="bg-card h-[50px] w-max justify-self-start gap-[7px] px-3 shadow-none"
                  onClick={onUseCurrentLocation}
                >
                  <LocateFixed className="text-foreground size-[17px]" />
                  {labels.currentLocation}
                </Button>
              ) : null}
              <div className="col-span-full grid text-xs leading-5">
                {[labels.ipNotice, labels.browserNotice, labels.searchHint].map((text) => (
                  <span
                    key={text}
                    aria-hidden="true"
                    className="invisible col-start-1 row-start-1 pl-6"
                  >
                    {text}
                  </span>
                ))}
                {notice ? (
                  <p
                    role="status"
                    data-slot="google-map-picker-provenance"
                    className="text-muted-foreground col-start-1 row-start-1 flex items-start gap-2"
                  >
                    <MapPin aria-hidden="true" className="text-foreground mt-0.5 size-4 shrink-0" />
                    <span className="wrap-anywhere">{notice}</span>
                  </p>
                ) : null}
              </div>
              <div className="col-span-full flex flex-wrap items-center gap-3 after:h-px after:flex-1 after:bg-border">
                <label htmlFor={`${id}-radius`} className="text-sm font-medium">
                  {labels.searchWithin}
                </label>
                <div className="relative">
                  <select
                    id={`${id}-radius`}
                    value={radiusKm}
                    className="bg-card focus-visible:outline-ring h-11 appearance-none rounded border py-2 pr-9 pl-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                    onChange={(event) => onRadiusChange(Number(event.currentTarget.value))}
                  >
                    {radiusOptions.map((radius) => (
                      <option key={radius} value={radius}>
                        {radius} km
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
                  />
                </div>
              </div>
            </fieldset>
            <div
              data-slot="google-map-picker-map"
              className="relative min-h-56 min-w-0 flex-[1_0_14rem] [@media(max-height:599px)]:min-h-[182px] [@media(max-height:599px)]:basis-[182px]"
            >
              <GoogleMap
                apiKey={apiKey}
                center={selectedLocation?.center ?? { lat: 0, lng: 0 }}
                zoom={4}
                marker={selectedLocation ? { icon: markerIcon } : undefined}
                radius={
                  selectedLocation
                    ? {
                        radiusMeters: radiusKm * 1000,
                        fillColor: overlayColor,
                        fillOpacity: 0.12,
                        strokeColor: overlayColor,
                        strokeOpacity: 0.82,
                        strokeWeight: 2,
                      }
                    : undefined
                }
                fitRadius={Boolean(selectedLocation)}
                fitPadding={40}
                minZoom={3}
                maxZoom={18}
                locale={locale}
                className="h-full min-h-0 w-full rounded-md"
                controlsClassName="bg-card rounded-md shadow-md"
              />
              {selectedLocation ? (
                <p className="bg-card text-muted-foreground pointer-events-none absolute bottom-[25px] left-3 m-0 max-w-[calc(100%-24px)] rounded px-2.5 py-[7px] text-xs shadow-sm">
                  {labels.radiusHint}
                </p>
              ) : null}
            </div>
          </div>
          <DialogFooter className="shrink-0 gap-3 border-0 bg-transparent px-5 pt-[18px] pb-[max(18px,env(safe-area-inset-bottom))] sm:px-7 [@media(max-height:599px)]:pt-3 [@media(max-height:599px)]:pb-[max(12px,env(safe-area-inset-bottom))]">
            {error || confirmFailed ? (
              <p
                role="alert"
                className="text-destructive w-full self-center text-sm sm:mr-auto sm:w-auto"
              >
                {error ?? labels.confirmError}
              </p>
            ) : null}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="bg-card min-h-11 flex-1"
                disabled={applying}
                onClick={() => changeOpen(false)}
              >
                {labels.cancel}
              </Button>
              <Button
                type="button"
                data-slot="google-map-picker-confirm"
                className={cn(
                  "min-h-11 flex-[2] bg-[oklch(0.9247_0.0524_66.1732)] text-zinc-950 hover:bg-[oklch(0.9247_0.0524_66.1732)] hover:brightness-95",
                  confirmClassName,
                )}
                disabled={applying || !selectedMatchesInput || !selectedLocation}
                onClick={() => void confirm()}
              >
                {labels.confirm}
              </Button>
            </div>
          </DialogFooter>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
};
