import { Minus, Plus } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { getLocale } from "@/paraglide/runtime";

export type GoogleMapPoint = {
  lat: number;
  lng: number;
};

export type GoogleMapMarkerOptions = {
  icon?: string | undefined;
};

export type GoogleMapRadiusOptions = {
  radiusMeters: number;
  fillColor?: string | undefined;
  fillOpacity?: number | undefined;
  strokeColor?: string | undefined;
  strokeOpacity?: number | undefined;
  strokeWeight?: number | undefined;
};

export type GoogleMapMessages = {
  mapLabel: string;
  loading: string;
  missingKeyTitle: string;
  missingKeyBody: string;
  errorTitle: string;
  errorBody: string;
  zoomIn: string;
  zoomOut: string;
};

export type GoogleMapProps = {
  apiKey: string;
  center: GoogleMapPoint;
  zoom: number;
  marker?: boolean | GoogleMapMarkerOptions | undefined;
  radius?: GoogleMapRadiusOptions | undefined;
  interactive?: boolean | undefined;
  zoomControls?: boolean | undefined;
  minZoom?: number | undefined;
  maxZoom?: number | undefined;
  className?: string | undefined;
  messages?: Partial<GoogleMapMessages> | undefined;
};

type GoogleMapOptions = {
  center: GoogleMapPoint;
  zoom: number;
  clickableIcons: boolean;
  disableDefaultUI: boolean;
  draggable: boolean;
  fullscreenControl: boolean;
  gestureHandling: "auto" | "none";
  keyboardShortcuts: boolean;
  mapTypeControl: boolean;
  maxZoom: number;
  minZoom: number;
  scrollwheel: boolean;
  streetViewControl: boolean;
  zoomControl: boolean;
};

type GoogleMapInstance = {
  getZoom: () => number | undefined;
  setCenter: (center: GoogleMapPoint) => void;
  setOptions: (options: Partial<GoogleMapOptions>) => void;
  setZoom: (zoom: number) => void;
};

type GoogleMarkerInstance = {
  setIcon: (icon?: string) => void;
  setMap: (map: GoogleMapInstance | null) => void;
  setPosition: (position: GoogleMapPoint) => void;
};

type GoogleCircleStyleOptions = Omit<GoogleMapRadiusOptions, "radiusMeters">;

type GoogleCircleInstance = {
  setCenter: (center: GoogleMapPoint) => void;
  setMap: (map: GoogleMapInstance | null) => void;
  setOptions: (options: GoogleCircleStyleOptions) => void;
  setRadius: (radiusMeters: number) => void;
};

type GoogleMapsEventListener = {
  remove: () => void;
};

type GoogleMapsApi = {
  maps: {
    Map: new (
      element: HTMLElement,
      options: GoogleMapOptions,
    ) => GoogleMapInstance;
    Marker: new (options: {
      icon?: string | undefined;
      map: GoogleMapInstance;
      position: GoogleMapPoint;
    }) => GoogleMarkerInstance;
    Circle: new (
      options: GoogleCircleStyleOptions & {
        center: GoogleMapPoint;
        clickable: boolean;
        map: GoogleMapInstance;
        radius: number;
      },
    ) => GoogleCircleInstance;
    event: {
      addListener: (
        instance: object,
        eventName: string,
        handler: () => void,
      ) => GoogleMapsEventListener;
      clearInstanceListeners: (instance: object) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleMapsApi | undefined;
    __krakStackGoogleMapsInit?: (() => void) | undefined;
  }
}

type LoadState = "loading" | "ready" | "missing-key" | "error";

const googleMapsScriptId = "krak-stack-google-maps-script";
const googleMapsCallbackName = "__krakStackGoogleMapsInit";
let googleMapsPromise: Promise<GoogleMapsApi> | undefined;

const defaultMessages = {
  en: {
    mapLabel: "Google map",
    loading: "Loading map...",
    missingKeyTitle: "Map unavailable",
    missingKeyBody: "Provide a Google Maps API key to display the map.",
    errorTitle: "Map unavailable",
    errorBody: "Google Maps could not be loaded. Try again later.",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
  },
  fr: {
    mapLabel: "Carte Google",
    loading: "Chargement de la carte...",
    missingKeyTitle: "Carte indisponible",
    missingKeyBody:
      "Fournissez une clé d’API Google Maps pour afficher la carte.",
    errorTitle: "Carte indisponible",
    errorBody: "Impossible de charger Google Maps. Réessayez plus tard.",
    zoomIn: "Zoom avant",
    zoomOut: "Zoom arrière",
  },
} as const satisfies Record<"en" | "fr", GoogleMapMessages>;

const googleMapMessages = (overrides?: Partial<GoogleMapMessages>) => ({
  ...(getLocale().startsWith("fr") ? defaultMessages.fr : defaultMessages.en),
  ...overrides,
});

const isGoogleMapsReady = (
  api: GoogleMapsApi | undefined,
): api is GoogleMapsApi =>
  Boolean(
    api?.maps.Map && api.maps.Marker && api.maps.Circle && api.maps.event,
  );

const loadGoogleMaps = (apiKey: string) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("Google Maps requires a browser."));
  }
  if (isGoogleMapsReady(window.google)) return Promise.resolve(window.google);
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise<GoogleMapsApi>((resolve, reject) => {
    const resolveApi = () => {
      if (isGoogleMapsReady(window.google)) resolve(window.google);
      else reject(new Error("Google Maps failed to initialize."));
    };
    const rejectLoad = () => reject(new Error("Google Maps failed to load."));

    window[googleMapsCallbackName] = resolveApi;

    const existingScript = document.getElementById(googleMapsScriptId);
    if (existingScript) {
      existingScript.addEventListener("error", rejectLoad, { once: true });
      existingScript.addEventListener("load", resolveApi, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = googleMapsScriptId;
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async&callback=${googleMapsCallbackName}`;
    script.addEventListener("error", rejectLoad, { once: true });
    document.head.append(script);
  }).catch((error: unknown) => {
    googleMapsPromise = undefined;
    window[googleMapsCallbackName] = undefined;
    document.getElementById(googleMapsScriptId)?.remove();
    throw error;
  });

  return googleMapsPromise;
};

const clampZoom = (zoom: number, minZoom: number, maxZoom: number) =>
  Math.min(maxZoom, Math.max(minZoom, zoom));

const mapOptions = (
  center: GoogleMapPoint,
  zoom: number,
  interactive: boolean,
  minZoom: number,
  maxZoom: number,
): GoogleMapOptions => ({
  center,
  zoom: clampZoom(zoom, minZoom, maxZoom),
  clickableIcons: interactive,
  disableDefaultUI: true,
  draggable: interactive,
  fullscreenControl: false,
  gestureHandling: interactive ? "auto" : "none",
  keyboardShortcuts: interactive,
  mapTypeControl: false,
  maxZoom,
  minZoom,
  scrollwheel: interactive,
  streetViewControl: false,
  zoomControl: false,
});

export function GoogleMap({
  apiKey,
  center,
  zoom,
  marker,
  radius,
  interactive = true,
  zoomControls = true,
  minZoom = 3,
  maxZoom = 20,
  className,
  messages: messageOverrides,
}: GoogleMapProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<GoogleMapsApi | null>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const markerRef = useRef<GoogleMarkerInstance | null>(null);
  const circleRef = useRef<GoogleCircleInstance | null>(null);
  const zoomListenerRef = useRef<GoogleMapsEventListener | null>(null);
  const normalizedApiKey = apiKey.trim();
  const normalizedMinZoom = Math.min(minZoom, maxZoom);
  const normalizedMaxZoom = Math.max(minZoom, maxZoom);
  const initialZoom = clampZoom(zoom, normalizedMinZoom, normalizedMaxZoom);
  const [loadState, setLoadState] = useState<LoadState>(
    normalizedApiKey ? "loading" : "missing-key",
  );
  const [currentZoom, setCurrentZoom] = useState(initialZoom);
  const labels = googleMapMessages(messageOverrides);
  const markerEnabled = marker === true || typeof marker === "object";
  const markerIcon = typeof marker === "object" ? marker.icon : undefined;
  const centerLat = center.lat;
  const centerLng = center.lng;
  const radiusMeters = radius?.radiusMeters;
  const radiusFillColor = radius?.fillColor;
  const radiusFillOpacity = radius?.fillOpacity;
  const radiusStrokeColor = radius?.strokeColor;
  const radiusStrokeOpacity = radius?.strokeOpacity;
  const radiusStrokeWeight = radius?.strokeWeight;

  const initializeMap = useEffectEvent(
    (api: GoogleMapsApi, element: HTMLElement) => {
      const map = new api.maps.Map(
        element,
        mapOptions(
          center,
          zoom,
          interactive,
          normalizedMinZoom,
          normalizedMaxZoom,
        ),
      );
      apiRef.current = api;
      mapRef.current = map;
      zoomListenerRef.current = api.maps.event.addListener(
        map,
        "zoom_changed",
        () => setCurrentZoom(map.getZoom() ?? zoom),
      );
      setCurrentZoom(clampZoom(zoom, normalizedMinZoom, normalizedMaxZoom));
      setLoadState("ready");
    },
  );

  useEffect(() => {
    if (!normalizedApiKey) {
      setLoadState("missing-key");
      return;
    }

    const element = mapElementRef.current;
    if (!element) return;

    let mounted = true;
    setLoadState("loading");

    void loadGoogleMaps(normalizedApiKey)
      .then((api) => {
        if (!mounted) return;

        try {
          initializeMap(api, element);
        } catch {
          setLoadState("error");
        }
      })
      .catch(() => {
        if (mounted) setLoadState("error");
      });

    return () => {
      mounted = false;
      zoomListenerRef.current?.remove();
      markerRef.current?.setMap(null);
      circleRef.current?.setMap(null);
      if (mapRef.current) {
        apiRef.current?.maps.event.clearInstanceListeners(mapRef.current);
      }
      markerRef.current = null;
      circleRef.current = null;
      zoomListenerRef.current = null;
      mapRef.current = null;
      apiRef.current = null;
      element.replaceChildren();
    };
  }, [normalizedApiKey]);

  useEffect(() => {
    const api = apiRef.current;
    const map = mapRef.current;
    if (loadState !== "ready" || !api || !map) return;

    try {
      const nextCenter = { lat: centerLat, lng: centerLng };
      const nextZoom = clampZoom(zoom, normalizedMinZoom, normalizedMaxZoom);
      map.setCenter(nextCenter);
      map.setZoom(nextZoom);
      map.setOptions(
        mapOptions(
          nextCenter,
          nextZoom,
          interactive,
          normalizedMinZoom,
          normalizedMaxZoom,
        ),
      );
      setCurrentZoom(nextZoom);

      if (markerEnabled) {
        if (markerRef.current) {
          markerRef.current.setMap(map);
          markerRef.current.setPosition(nextCenter);
          markerRef.current.setIcon(markerIcon);
        } else {
          markerRef.current = new api.maps.Marker({
            icon: markerIcon,
            map,
            position: nextCenter,
          });
        }
      } else {
        markerRef.current?.setMap(null);
        markerRef.current = null;
      }

      if (radiusMeters !== undefined) {
        const style = {
          fillColor: radiusFillColor ?? "#18181b",
          fillOpacity: radiusFillOpacity ?? 0.12,
          strokeColor: radiusStrokeColor ?? "#18181b",
          strokeOpacity: radiusStrokeOpacity ?? 0.7,
          strokeWeight: radiusStrokeWeight ?? 2,
        };
        if (circleRef.current) {
          circleRef.current.setMap(map);
          circleRef.current.setCenter(nextCenter);
          circleRef.current.setRadius(radiusMeters);
          circleRef.current.setOptions(style);
        } else {
          circleRef.current = new api.maps.Circle({
            ...style,
            center: nextCenter,
            clickable: false,
            map,
            radius: radiusMeters,
          });
        }
      } else {
        circleRef.current?.setMap(null);
        circleRef.current = null;
      }
    } catch {
      setLoadState("error");
    }
  }, [
    centerLat,
    centerLng,
    interactive,
    loadState,
    markerEnabled,
    markerIcon,
    normalizedMaxZoom,
    normalizedMinZoom,
    radiusFillColor,
    radiusFillOpacity,
    radiusMeters,
    radiusStrokeColor,
    radiusStrokeOpacity,
    radiusStrokeWeight,
    zoom,
  ]);

  const changeZoom = (delta: number) => {
    const map = mapRef.current;
    if (!map) return;

    const nextZoom = clampZoom(
      (map.getZoom() ?? currentZoom) + delta,
      normalizedMinZoom,
      normalizedMaxZoom,
    );
    map.setZoom(nextZoom);
    setCurrentZoom(nextZoom);
  };

  return (
    <div
      className={cn(
        "bg-muted relative min-h-64 overflow-hidden rounded-lg border",
        className,
      )}
    >
      <div
        ref={mapElementRef}
        className="h-full min-h-[inherit] w-full"
        role="region"
        aria-label={labels.mapLabel}
      />
      {loadState === "ready" && zoomControls ? (
        <div className="bg-background/95 absolute right-4 bottom-4 z-10 overflow-hidden rounded-md border shadow-sm backdrop-blur">
          <button
            type="button"
            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex size-9 items-center justify-center transition-colors disabled:pointer-events-none disabled:opacity-50"
            disabled={currentZoom >= normalizedMaxZoom}
            onClick={() => changeZoom(1)}
            aria-label={labels.zoomIn}
          >
            <Plus className="size-4" />
          </button>
          <div className="bg-border h-px" />
          <button
            type="button"
            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex size-9 items-center justify-center transition-colors disabled:pointer-events-none disabled:opacity-50"
            disabled={currentZoom <= normalizedMinZoom}
            onClick={() => changeZoom(-1)}
            aria-label={labels.zoomOut}
          >
            <Minus className="size-4" />
          </button>
        </div>
      ) : null}
      {loadState === "loading" ? (
        <div
          className="bg-background/75 text-muted-foreground absolute inset-0 grid place-items-center text-sm font-medium backdrop-blur-sm"
          role="status"
        >
          {labels.loading}
        </div>
      ) : null}
      {loadState === "missing-key" || loadState === "error" ? (
        <div className="bg-background/85 absolute inset-0 grid place-items-center p-6 text-center backdrop-blur-sm">
          <div
            className="bg-card text-card-foreground max-w-sm rounded-lg border p-5 shadow-sm"
            role="alert"
          >
            <p className="text-sm font-semibold">
              {loadState === "missing-key"
                ? labels.missingKeyTitle
                : labels.errorTitle}
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              {loadState === "missing-key"
                ? labels.missingKeyBody
                : labels.errorBody}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
