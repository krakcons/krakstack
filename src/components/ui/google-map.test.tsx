// @vitest-environment jsdom

import { describe, expect, it } from "@effect/vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, vi } from "vitest";

import {
  GoogleMap,
  type GoogleMapPoint,
  type GoogleMapsApi,
} from "./google-map";

type MockMapOptions = {
  center: GoogleMapPoint;
  zoom: number;
};
type MockMapReference = {
  getZoom: () => number | undefined;
  setCenter: (center: GoogleMapPoint) => void;
  setOptions: (options: Partial<MockMapOptions>) => void;
  setZoom: (zoom: number) => void;
};
type MockMarkerOptions = {
  map: MockMapReference;
  position: GoogleMapPoint;
  icon?: string;
};
type MockCircleOptions = {
  center: GoogleMapPoint;
  clickable: boolean;
  map: MockMapReference;
  radius: number;
};
type MockAddListener = GoogleMapsApi["maps"]["event"]["addListener"];

const browserWindow: Window & { google?: GoogleMapsApi | undefined } = window;

afterEach(() => {
  cleanup();
  browserWindow.google = undefined;
  document.getElementById("krak-stack-google-maps-script")?.remove();
  vi.clearAllMocks();
});

describe("GoogleMap", () => {
  it("shows a localized error when the API key is missing", () => {
    render(<GoogleMap apiKey="" center={{ lat: 1, lng: 2 }} zoom={8} />);

    expect(screen.getByRole("alert").textContent).toContain("Map unavailable");
    expect(document.querySelector("script")).toBeNull();
  });

  it("initializes Google Maps and updates its centered overlays", async () => {
    const maps: MockMap[] = [];
    const markers: MockMarker[] = [];
    const circles: MockCircle[] = [];
    let onZoomChanged: (() => void) | undefined;

    class MockMap {
      zoom = 8;
      getZoom = vi.fn(() => this.zoom);
      setCenter = vi.fn((_center: GoogleMapPoint) => undefined);
      setOptions = vi.fn((_options: Partial<MockMapOptions>) => undefined);
      setZoom = vi.fn((zoom: number) => {
        this.zoom = zoom;
      });

      constructor(_element: HTMLElement, _options: MockMapOptions) {
        maps.push(this);
      }
    }

    class MockMarker {
      setIcon = vi.fn((_icon?: string) => undefined);
      setMap = vi.fn((_map: MockMapReference | null) => undefined);
      setPosition = vi.fn((_position: GoogleMapPoint) => undefined);

      constructor(_options: MockMarkerOptions) {
        markers.push(this);
      }
    }

    class MockCircle {
      setCenter = vi.fn((_center: GoogleMapPoint) => undefined);
      setMap = vi.fn((_map: MockMapReference | null) => undefined);
      setOptions = vi.fn(
        (
          _options: Omit<
            MockCircleOptions,
            "center" | "clickable" | "map" | "radius"
          >,
        ) => undefined,
      );
      setRadius = vi.fn((_radius: number) => undefined);

      constructor(_options: MockCircleOptions) {
        circles.push(this);
      }
    }

    browserWindow.google = {
      maps: {
        Map: MockMap,
        Marker: MockMarker,
        Circle: MockCircle,
        event: {
          addListener: vi.fn(
            (...[, , handler]: Parameters<MockAddListener>) => {
              onZoomChanged = handler;
              return { remove: vi.fn() };
            },
          ),
          clearInstanceListeners: vi.fn(),
        },
      },
    };

    const { rerender } = render(
      <GoogleMap
        apiKey="test-key"
        center={{ lat: 1, lng: 2 }}
        interactive={false}
        marker={{ icon: "/marker.svg" }}
        radius={{ radiusMeters: 1_000 }}
        zoom={8}
        locale="en"
      />,
    );

    await waitFor(() => {
      expect(maps).toHaveLength(1);
      expect(markers).toHaveLength(1);
      expect(circles).toHaveLength(1);
      expect(screen.getByRole("button", { name: "Zoom in" })).toBeDefined();
    });

    act(() => {
      maps[0]!.zoom = 20;
      onZoomChanged?.();
    });
    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: "Zoom in" })
        .disabled,
    ).toBe(true);

    rerender(
      <GoogleMap
        apiKey="test-key"
        center={{ lat: 3, lng: 4 }}
        interactive={false}
        marker={{ icon: "/updated-marker.svg" }}
        radius={{ radiusMeters: 2_000, fillColor: "#ffffff" }}
        zoom={10}
        locale="en"
      />,
    );

    await waitFor(() => {
      expect(maps[0]?.setCenter).toHaveBeenLastCalledWith({ lat: 3, lng: 4 });
      expect(maps[0]?.setZoom).toHaveBeenLastCalledWith(10);
      expect(markers[0]?.setPosition).toHaveBeenLastCalledWith({
        lat: 3,
        lng: 4,
      });
      expect(markers[0]?.setIcon).toHaveBeenLastCalledWith(
        "/updated-marker.svg",
      );
      expect(circles[0]?.setCenter).toHaveBeenLastCalledWith({
        lat: 3,
        lng: 4,
      });
      expect(circles[0]?.setRadius).toHaveBeenLastCalledWith(2_000);
      expect(circles[0]?.setOptions).toHaveBeenLastCalledWith(
        expect.objectContaining({ fillColor: "#ffffff" }),
      );
    });
  });
});
