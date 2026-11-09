import { useState } from "react";
import { useHydrated } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MapMenu,
  MapMenuMode,
  MapMenuPresentation,
  type MapMenuLocation,
} from "@/components/ui/map-menu";
import { m } from "@/paraglide/messages";
import { getLocale } from "@/paraglide/runtime";

const initialPlace: MapMenuLocation = {
  id: "toronto",
  label: "Toronto, Ontario, Canada",
  title: "Toronto",
  details: "Ontario, Canada",
  center: { lat: 43.6532, lng: -79.3832 },
};
const places: readonly MapMenuLocation[] = [
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

export const MapMenuPreview = () => {
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(MapMenuMode.Radius);
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GOOGLE_MAPS_BROWSER_API_KEY ?? "");
  const [confirmed, setConfirmed] = useState<{
    location: MapMenuLocation;
    radiusKm?: number;
  }>({ location: initialPlace, radiusKm: 100 });
  const [selected, setSelected] = useState(initialPlace);
  const [input, setInput] = useState(initialPlace.label);
  const [radiusKm, setRadiusKm] = useState(100);
  const [provenance, setProvenance] = useState<"ip" | "browser" | undefined>("ip");
  const [confirmedProvenance, setConfirmedProvenance] = useState(provenance);

  const changeOpen = (next: boolean) => {
    if (next) {
      setSelected(confirmed.location);
      setInput(confirmed.location.label);
      setRadiusKm(confirmed.radiusKm ?? 100);
      setProvenance(confirmedProvenance);
    }
    setOpen(next);
  };

  return (
    <>
      <div data-example="map-menu" className="bg-card space-y-5 rounded-xl border p-5 sm:p-6">
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
            disabled={!hydrated}
            autoComplete="off"
            value={apiKey}
            onChange={(event) => setApiKey(event.currentTarget.value)}
            placeholder={m.map_picker_preview_key_placeholder()}
          />
        </label>
        <div className="flex flex-wrap items-center gap-4">
          <Button
            disabled={!hydrated}
            onClick={() => {
              setMode(MapMenuMode.Radius);
              changeOpen(true);
            }}
          >
            {m.map_picker_preview_open()}
          </Button>
          <Button
            variant="outline"
            disabled={!hydrated}
            onClick={() => {
              setMode(MapMenuMode.Point);
              changeOpen(true);
            }}
          >
            {m.map_menu_preview_point()}
          </Button>
          <p role="status" className="text-muted-foreground text-sm">
            {confirmed.radiusKm === undefined
              ? m.map_menu_preview_selected_point({
                  place: confirmed.location.label,
                })
              : m.map_picker_preview_selected({
                  place: confirmed.location.label,
                  distance: confirmed.radiusKm,
                })}
          </p>
        </div>
        <MapMenu
          apiKey={apiKey}
          open={open}
          onOpenChange={changeOpen}
          input={input}
          onInputChange={setInput}
          selectedLocation={selected}
          {...(mode === MapMenuMode.Point
            ? {
                mode: MapMenuMode.Point,
                onConfirm: (selection: { location: MapMenuLocation }) => {
                  setConfirmed(selection);
                  setConfirmedProvenance(provenance);
                },
              }
            : {
                mode: MapMenuMode.Radius,
                radiusKm,
                onRadiusChange: setRadiusKm,
                onConfirm: (selection: { location: MapMenuLocation; radiusKm: number }) => {
                  setConfirmed(selection);
                  setConfirmedProvenance(provenance);
                },
              })}
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
        />
      </div>
      <InlineMapMenuPreview apiKey={apiKey} />
    </>
  );
};

const InlineMapMenuPreview = ({ apiKey }: { apiKey: string }) => {
  const [confirmed, setConfirmed] = useState(initialPlace);
  const [selected, setSelected] = useState(initialPlace);
  const [input, setInput] = useState(initialPlace.label);
  const [provenance, setProvenance] = useState<"browser" | undefined>();

  return (
    <div
      data-example="map-menu-inline"
      className="bg-card mt-6 space-y-5 rounded-xl border p-5 sm:p-6"
    >
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{m.map_menu_preview_inline_title()}</h3>
        <p className="text-muted-foreground max-w-prose text-sm leading-6">
          {m.map_menu_preview_inline_description()}
        </p>
      </div>
      <MapMenu
        presentation={MapMenuPresentation.Inline}
        mode={MapMenuMode.Point}
        apiKey={apiKey}
        input={input}
        onInputChange={setInput}
        selectedLocation={selected}
        suggestions={
          input.trim()
            ? places.filter((place) =>
                place.label.toLocaleLowerCase().includes(input.trim().toLocaleLowerCase()),
              )
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
        provenance={provenance}
        onConfirm={({ location }) => setConfirmed(location)}
        onCancel={() => {
          setSelected(confirmed);
          setInput(confirmed.label);
          setProvenance(undefined);
        }}
        locale={getLocale()}
      />
      <p role="status" className="text-muted-foreground text-sm">
        {m.map_menu_preview_selected_point({ place: confirmed.label })}
      </p>
    </div>
  );
};
