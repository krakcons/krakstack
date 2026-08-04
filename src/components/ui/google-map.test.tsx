// @vitest-environment jsdom

import { describe, expect, it } from "@effect/vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, vi } from "vitest";

import { GoogleMap } from "./google-map";

vi.mock("@/paraglide/runtime", () => ({ getLocale: () => "en" }));

afterEach(() => {
  cleanup();
  window.google = undefined;
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
      setCenter = vi.fn((_center: unknown) => undefined);
      setOptions = vi.fn((_options: unknown) => undefined);
      setZoom = vi.fn((zoom: number) => {
        this.zoom = zoom;
      });

      constructor(_element: HTMLElement, _options: unknown) {
        maps.push(this);
      }
    }

    class MockMarker {
      setIcon = vi.fn((_icon?: string) => undefined);
      setMap = vi.fn((_map: object | null) => undefined);
      setPosition = vi.fn((_position: unknown) => undefined);

      constructor(_options: unknown) {
        markers.push(this);
      }
    }

    class MockCircle {
      setCenter = vi.fn((_center: unknown) => undefined);
      setMap = vi.fn((_map: object | null) => undefined);
      setOptions = vi.fn((_options: unknown) => undefined);
      setRadius = vi.fn((_radius: number) => undefined);

      constructor(_options: unknown) {
        circles.push(this);
      }
    }

    window.google = {
      maps: {
        Map: MockMap,
        Marker: MockMarker,
        Circle: MockCircle,
        event: {
          addListener: vi.fn(
            (_instance: object, _eventName: string, handler: () => void) => {
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
