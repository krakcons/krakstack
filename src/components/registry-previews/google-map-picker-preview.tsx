import { useState } from "react";
import { useHydrated } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleMapPicker, type GoogleMapPickerLocation } from "@/components/ui/google-map-picker";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";

const initialPlace: GoogleMapPickerLocation = {
  id: "toronto",
  label: "Toronto, Ontario, Canada",
  title: "Toronto",
  details: "Ontario, Canada",
  center: { lat: 43.6532, lng: -79.3832 },
};
const places: readonly GoogleMapPickerLocation[] = [
  initialPlace,
  {
    id: "calgary",
    label: "Calgary, Alberta, Canada",
    title: "Calgary",
    details: "Alberta, Canada",
    center: { lat: 51.0447, lng: -114.0719 },
  },
  {
    id: "montreal",
    label: "Montréal, Québec, Canada",
    title: "Montréal",
    details: "Québec, Canada",
    center: { lat: 45.5019, lng: -73.5674 },
  },
];

export const GoogleMapPickerPreview = () => {
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GOOGLE_MAPS_BROWSER_API_KEY ?? "");
  const [confirmed, setConfirmed] = useState({ location: initialPlace, radiusKm: 100 });
  const [selected, setSelected] = useState(initialPlace);
  const [input, setInput] = useState(initialPlace.label);
  const [radiusKm, setRadiusKm] = useState(100);
  const [provenance, setProvenance] = useState<"ip" | "browser" | undefined>("ip");
  const [confirmedProvenance, setConfirmedProvenance] = useState(provenance);

  const changeOpen = (next: boolean) => {
    if (next) {
      setSelected(confirmed.location);
      setInput(confirmed.location.label);
      setRadiusKm(confirmed.radiusKm);
      setProvenance(confirmedProvenance);
    }
    setOpen(next);
  };

  return (
    <div
      data-example="google-map-picker"
      className="bg-card space-y-5 rounded-xl border p-5 sm:p-6"
    >
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{m.map_picker_preview_title()}</h3>
        <p className="text-muted-foreground max-w-prose text-sm leading-6">
          {m.map_picker_preview_description()}
        </p>
      </div>
      <label className="block max-w-lg space-y-2 text-sm font-medium">
        <span>{m.map_picker_preview_key()}</span>
        <Input
          type="password"
          autoComplete="off"
          value={apiKey}
          onChange={(event) => setApiKey(event.currentTarget.value)}
          placeholder={m.map_picker_preview_key_placeholder()}
        />
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <Button disabled={!hydrated} onClick={() => changeOpen(true)}>
          {m.map_picker_preview_open()}
        </Button>
        <p role="status" className="text-muted-foreground text-sm">
          {m.map_picker_preview_selected({
            place: confirmed.location.label,
            distance: confirmed.radiusKm,
          })}
        </p>
      </div>
      <GoogleMapPicker
        apiKey={apiKey}
        open={open}
        onOpenChange={changeOpen}
        input={input}
        onInputChange={setInput}
        selectedLocation={selected}
        radiusKm={radiusKm}
        onRadiusChange={setRadiusKm}
        locale={getLocale()}
        provenance={provenance}
        suggestions={
          input.trim()
            ? places
                .filter((place) =>
                  place.label.toLocaleLowerCase().includes(input.trim().toLocaleLowerCase()),
                )
                .slice(0, 3)
            : []
        }
        onSelectLocation={(location) => {
          setSelected(location);
          setProvenance(undefined);
        }}
        onUseCurrentLocation={() => {
          setSelected(initialPlace);
          setInput(initialPlace.label);
          setProvenance("browser");
        }}
        onConfirm={(selection) => {
          setConfirmed(selection);
          setConfirmedProvenance(provenance);
        }}
      />
    </div>
  );
};
