import { useId, useMemo, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useKrakstackLocale } from "@/components/ui/krakstack-provider";
import {
  VirtualizedCombobox,
  type VirtualizedComboboxOption,
} from "@/components/ui/virtualized-combobox";
import {
  isTimeZoneId,
  isTimeZoneReferenceDate,
  type TimeZoneContinent,
  type TimeZoneContinentFilter,
} from "./timezone-select.schema";
export {
  TimeZoneIdSchema,
  TimeZoneContinentFilterSchema,
  isTimeZoneId,
} from "./timezone-select.schema";
export type {
  TimeZoneContinent,
  TimeZoneContinentFilter,
} from "./timezone-select.schema";

export type TimeZoneDetails = {
  timeZone: string;
  name: string;
  offset: string;
  offsetMinutes: number;
  time: string;
  date: string;
};
export type TimezoneSelectMessages = {
  label: string;
  placeholder: string;
  search: string;
  empty: string;
  clear: string;
  yourTime: string;
  comparisonTime: string;
  selectedTime: string;
  useLocal: string;
  unavailable: string;
  invalid: string;
  invalidReference: string;
  same: string;
  ahead: (duration: string) => string;
  behind: (duration: string) => string;
};
export type TimezoneSelectProps = {
  value: string | null;
  onValueChange: (timeZone: string | null) => void;
  label?: string;
  /** Code-only catalog filter; no continent control is rendered. */
  continent?: TimeZoneContinentFilter;
  /** Omit to detect the browser zone; null disables comparison. */
  comparisonTimeZone?: string | null;
  /** Omit for a live clock; fixed instants make DST comparisons reproducible. */
  referenceTime?: Date;
  name?: string;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  locale?: string;
  messages?: Partial<Record<string, Partial<TimezoneSelectMessages>>>;
};
const labels = {
  en: {
    label: "Time zone",
    placeholder: "Select a time zone",
    search: "Search city, time zone or UTC offset…",
    empty: "No matching time zones.",
    clear: "Clear time zone",
    yourTime: "Your time",
    comparisonTime: "Comparison time",
    selectedTime: "Selected time",
    useLocal: "Use my time zone",
    unavailable: "Time comparison unavailable.",
    invalid: "This time zone is not supported. Choose another time zone.",
    invalidReference:
      "The reference date is invalid. Local times are unavailable.",
    same: "Same time",
    ahead: (duration: string) => `${duration} ahead`,
    behind: (duration: string) => `${duration} behind`,
  },
  fr: {
    label: "Fuseau horaire",
    placeholder: "Choisir un fuseau horaire",
    search: "Rechercher une ville, un fuseau ou un décalage UTC…",
    empty: "Aucun fuseau horaire correspondant.",
    clear: "Effacer le fuseau horaire",
    yourTime: "Votre heure",
    comparisonTime: "Heure de comparaison",
    selectedTime: "Heure sélectionnée",
    useLocal: "Utiliser mon fuseau horaire",
    unavailable: "Comparaison des heures indisponible.",
    invalid: "Ce fuseau n’est pas pris en charge. Choisissez un autre fuseau.",
    invalidReference:
      "La date de référence est invalide. Les heures locales sont indisponibles.",
    same: "Même heure",
    ahead: (duration: string) => `${duration} d’avance`,
    behind: (duration: string) => `${duration} de retard`,
  },
};

// America/* spans two continents. Keep South American locations separate from
// North America (which includes Central America, Greenland and the Caribbean).
const southAmericanLocations = new Set([
  "Araguaina",
  "Asuncion",
  "Bahia",
  "Belem",
  "Boa_Vista",
  "Bogota",
  "Buenos_Aires",
  "Campo_Grande",
  "Caracas",
  "Catamarca",
  "Cayenne",
  "Cordoba",
  "Coyhaique",
  "Cuiaba",
  "Eirunepe",
  "Fortaleza",
  "Guayaquil",
  "Guyana",
  "Jujuy",
  "La_Paz",
  "Lima",
  "Maceio",
  "Manaus",
  "Mendoza",
  "Montevideo",
  "Noronha",
  "Paramaribo",
  "Porto_Acre",
  "Porto_Velho",
  "Punta_Arenas",
  "Recife",
  "Rio_Branco",
  "Rosario",
  "Santarem",
  "Santiago",
  "Sao_Paulo",
]);

const continentForLocation = (zone: string): TimeZoneContinent | null => {
  const [region, location = ""] = zone.split("/");
  switch (region) {
    // Recent Intl runtimes may preserve legacy aliases in resolvedOptions().
    case "US":
      return location === "Hawaii" || location === "Samoa"
        ? "oceania"
        : "north-america";
    case "Canada":
    case "Mexico":
    case "Cuba":
    case "Jamaica":
    case "Navajo":
      return "north-america";
    case "Brazil":
    case "Chile":
      return "south-america";
    case "GB":
    case "GB-Eire":
    case "Eire":
    case "Iceland":
    case "Poland":
    case "Portugal":
    case "W-SU":
      return "europe";
    case "Egypt":
    case "Libya":
      return "africa";
    case "Hongkong":
    case "Iran":
    case "Israel":
    case "Japan":
    case "PRC":
    case "ROC":
    case "ROK":
    case "Singapore":
    case "Turkey":
      return "asia";
    case "NZ":
    case "NZ-CHAT":
    case "W-Samoa":
      return "oceania";
    case "America":
      return location === "Argentina" || southAmericanLocations.has(location)
        ? "south-america"
        : "north-america";
    case "Europe":
    case "Arctic":
      return "europe";
    case "Africa":
      return "africa";
    case "Asia":
      return "asia";
    case "Australia":
      return "oceania";
    case "Antarctica":
      return "antarctica";
    case "Pacific":
      return location === "Easter" || location === "Galapagos"
        ? "south-america"
        : "oceania";
    case "Atlantic":
      if (location === "Bermuda") return "north-america";
      if (["Canary", "Cape_Verde", "St_Helena"].includes(location))
        return "africa";
      if (["South_Georgia", "Stanley"].includes(location))
        return "south-america";
      if (
        ["Azores", "Faeroe", "Faroe", "Madeira", "Reykjavik"].includes(location)
      )
        return "europe";
      return null;
    case "Indian":
      if (["Chagos", "Maldives"].includes(location)) return "asia";
      if (["Christmas", "Cocos"].includes(location)) return "oceania";
      if (location === "Kerguelen") return "antarctica";
      if (
        [
          "Antananarivo",
          "Comoro",
          "Mahe",
          "Mauritius",
          "Mayotte",
          "Reunion",
        ].includes(location)
      )
        return "africa";
      return null;
    default:
      return null;
  }
};

/** Location-based continent groups. UTC and fixed-offset zones belong to All. */
export const getTimeZoneContinent = (
  timeZone: string,
): TimeZoneContinent | null => {
  if (!isTimeZoneId(timeZone)) return null;
  return (
    continentForLocation(timeZone) ??
    continentForLocation(
      new Intl.DateTimeFormat("en", { timeZone }).resolvedOptions().timeZone,
    )
  );
};

/** Primary runtime IANA zones, UTC and supported fixed-offset Etc zones; no duplicate alias catalog. */
export const getTimeZones = (additional: readonly string[] = []) =>
  [
    ...new Set([
      "UTC",
      ...Intl.supportedValuesOf("timeZone"),
      ...Array.from(
        { length: 27 },
        (_, index) => `Etc/GMT${index - 14 >= 0 ? "+" : ""}${index - 14}`,
      ).filter(isTimeZoneId),
      ...additional.filter(isTimeZoneId),
    ]),
  ].sort();

/** The browser supplies these parts; no locale-dependent date-string parsing. */
export const getTimeZoneDetails = ({
  timeZone,
  at,
  locale = "en",
}: {
  timeZone: string;
  at: Date;
  locale?: string;
}): TimeZoneDetails | undefined => {
  if (!isTimeZoneId(timeZone) || !isTimeZoneReferenceDate(at)) return undefined;
  const offsetParts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  }).formatToParts(at);
  const offset = (
    offsetParts.find((part) => part.type === "timeZoneName")?.value ?? "GMT"
  ).replace("GMT", "UTC");
  const civil = new Intl.DateTimeFormat("en-US-u-ca-gregory-nu-latn", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const number = (type: Intl.DateTimeFormatPartTypes) =>
    Number(civil.find((part) => part.type === type)?.value);
  const offsetMinutes =
    (Date.UTC(
      number("year"),
      number("month") - 1,
      number("day"),
      number("hour"),
      number("minute"),
      number("second"),
    ) -
      Math.floor(at.getTime() / 1000) * 1000) /
    60_000;
  const named = new Intl.DateTimeFormat(locale, {
    timeZone,
    timeZoneName: "long",
  }).formatToParts(at);
  return {
    timeZone,
    name: named.find((part) => part.type === "timeZoneName")?.value ?? timeZone,
    offset,
    offsetMinutes,
    time: new Intl.DateTimeFormat(locale, {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
    }).format(at),
    date: new Intl.DateTimeFormat(locale, {
      timeZone,
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(at),
  };
};

const subscribeClock = (notify: () => void) => {
  const interval = setInterval(notify, 15_000);
  return () => clearInterval(interval);
};
const noSubscription = () => () => {};
const currentMinute = () => Math.floor(Date.now() / 60_000) * 60_000;
const noTime = () => null;
const browserTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || null;
const prettyZone = (value: string) => value.replaceAll("_", " ");

/** Adds time-zone semantics to the existing combobox; owns no generic picker behavior. */
export const TimezoneSelect = ({
  value,
  onValueChange,
  label,
  continent = "north-america",
  comparisonTimeZone,
  referenceTime,
  name,
  disabled,
  className,
  contentClassName,
  locale: override,
  messages,
}: TimezoneSelectProps) => {
  const locale = useKrakstackLocale(override);
  const copy = {
    ...(locale.startsWith("fr") ? labels.fr : labels.en),
    ...messages?.[locale.split("-")[0] ?? locale],
    ...messages?.[locale],
  };
  const id = useId();
  const [search, setSearch] = useState("");
  const detected = useSyncExternalStore(
    noSubscription,
    browserTimeZone,
    noTime,
  );
  const clock = useSyncExternalStore(
    referenceTime ? noSubscription : subscribeClock,
    currentMinute,
    noTime,
  );
  const referenceValid =
    !referenceTime || isTimeZoneReferenceDate(referenceTime);
  const timestamp = referenceTime
    ? referenceValid
      ? referenceTime.getTime()
      : null
    : clock;
  const baselineZone =
    comparisonTimeZone === undefined ? detected : comparisonTimeZone;
  const baseline = useMemo(
    () =>
      baselineZone && timestamp !== null
        ? getTimeZoneDetails({
            timeZone: baselineZone,
            at: new Date(timestamp),
            locale,
          })
        : undefined,
    [baselineZone, timestamp, locale],
  );
  const zones = useMemo(
    () =>
      getTimeZones([
        ...(value ? [value] : []),
        ...(baselineZone ? [baselineZone] : []),
      ]),
    [value, baselineZone],
  );
  const items = useMemo<readonly VirtualizedComboboxOption<TimeZoneDetails>[]>(
    () =>
      zones
        .filter(
          (timeZone) =>
            continent === "all" ||
            timeZone === value ||
            getTimeZoneContinent(timeZone) === continent,
        )
        .map((timeZone) => {
          const data =
            timestamp !== null
              ? getTimeZoneDetails({
                  timeZone,
                  at: new Date(timestamp),
                  locale,
                })
              : undefined;
          return {
            value: timeZone,
            label: `${prettyZone(timeZone)}${data ? ` · ${data.offset} · ${data.name}` : ""}`,
            data,
          };
        }),
    [zones, timestamp, locale, continent, value],
  );
  const selected = items.find((item) => item.value === value) ?? null;
  const invalid = value !== null && !isTimeZoneId(value);
  const difference = (info: TimeZoneDetails) => {
    if (!baseline) return null;
    const minutes = info.offsetMinutes - baseline.offsetMinutes;
    if (minutes === 0) return copy.same;
    const duration = new Intl.NumberFormat(locale, {
      style: "unit",
      unit: "hour",
      unitDisplay: "short",
      maximumFractionDigits: 2,
    }).format(Math.abs(minutes) / 60);
    return minutes > 0 ? copy.ahead(duration) : copy.behind(duration);
  };
  return (
    <div data-slot="timezone-select" className={className}>
      <div className="grid min-w-0 grid-cols-1 gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {label ?? copy.label}
        </label>
        <VirtualizedCombobox<TimeZoneDetails>
          ariaLabel={label ?? copy.label}
          ariaInvalid={invalid}
          triggerId={id}
          // Let the existing virtualizer measure wrapped, multiline options
          // instead of fixing their boxes to its single-line height estimate.
          contentClassName={cn("[&_[role=option]]:h-auto!", contentClassName)}
          disabled={disabled}
          locale={locale}
          value={selected}
          onValueChange={(item) => onValueChange(item?.value ?? null)}
          items={items}
          placeholder={copy.placeholder}
          emptyLabel={copy.empty}
          searchValue={search}
          onSearchValueChange={(value) => setSearch(value.replaceAll("_", " "))}
          messages={{ [locale]: { search: copy.search, clear: copy.clear } }}
          renderItem={(item) => (
            <span className="grid min-w-0 flex-1 gap-0.5 py-1 text-left">
              <span className="font-medium wrap-anywhere">
                {prettyZone(item.value)}
              </span>
              {item.data && (
                <>
                  <span className="text-muted-foreground text-xs wrap-anywhere">
                    {item.data.name} · {item.data.offset}
                  </span>
                  <span className="text-xs wrap-anywhere">
                    {item.data.time} · {item.data.date}
                    {baseline ? ` · ${difference(item.data)}` : ""}
                  </span>
                </>
              )}
            </span>
          )}
        />
        {name && (
          <input
            type="hidden"
            name={name}
            value={value ?? ""}
            disabled={disabled}
          />
        )}
        {invalid && (
          <p role="alert" className="text-destructive text-sm">
            {copy.invalid}
          </p>
        )}
        {!referenceValid && (
          <p role="alert" className="text-destructive text-sm">
            {copy.invalidReference}
          </p>
        )}
        {selected?.data && (
          <dl
            data-slot="timezone-details"
            className="grid gap-1 rounded-lg border p-3 text-sm"
          >
            <dt className="text-muted-foreground">{copy.selectedTime}</dt>
            <dd className="wrap-anywhere">
              {selected.data.time} · {selected.data.date} ·{" "}
              {selected.data.offset}
              {baseline ? ` · ${difference(selected.data)}` : ""}
            </dd>
          </dl>
        )}
        {comparisonTimeZone !== null && (
          <div data-slot="timezone-comparison" className="grid gap-2 text-sm">
            {baseline ? (
              <p className="text-muted-foreground wrap-anywhere">
                {comparisonTimeZone === undefined
                  ? copy.yourTime
                  : copy.comparisonTime}
                : {prettyZone(baseline.timeZone)} · {baseline.time} ·{" "}
                {baseline.date} · {baseline.offset}
              </p>
            ) : (
              <p className="text-muted-foreground">{copy.unavailable}</p>
            )}
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          className="justify-self-start"
          disabled={disabled || !detected || !isTimeZoneId(detected)}
          onClick={() => {
            if (detected) onValueChange(detected);
          }}
        >
          {copy.useLocal}
        </Button>
      </div>
    </div>
  );
};
