// @vitest-environment jsdom

import { describe, expect, it } from "@effect/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, vi } from "vitest";
import {
  MapMenu as GoogleMapPicker,
  MapMenuMode,
  type MapMenuLocation as GoogleMapPickerLocation,
} from "./map-menu";

afterEach(cleanup);

const toronto: GoogleMapPickerLocation = {
  id: "toronto",
  label: "Toronto, Ontario, Canada",
  title: "Toronto",
  details: "Ontario, Canada",
  center: { lat: 43.6532, lng: -79.3832 },
};
const calgary: GoogleMapPickerLocation = {
  id: "calgary",
  label: "Calgary, Alberta, Canada",
  title: "Calgary",
  details: "Alberta, Canada",
  center: { lat: 51.0447, lng: -114.0719 },
};

const Harness = ({
  confirm = () => undefined,
}: {
  confirm?: (selection: {
    location: GoogleMapPickerLocation;
    radiusKm: number;
  }) => void | Promise<void>;
}) => {
  const [open, setOpen] = useState(true);
  const [input, setInput] = useState(toronto.label);
  const [selected, setSelected] = useState(toronto);
  const [radius, setRadius] = useState(100);
  const [provenance, setProvenance] = useState<"ip" | "browser" | undefined>("ip");
  return (
    <GoogleMapPicker
      apiKey=""
      open={open}
      onOpenChange={setOpen}
      input={input}
      onInputChange={setInput}
      selectedLocation={selected}
      suggestions={[calgary]}
      onSelectLocation={(place) => {
        setSelected(place);
        setProvenance(undefined);
      }}
      radiusKm={radius}
      onRadiusChange={setRadius}
      onConfirm={confirm}
      provenance={provenance}
      onUseCurrentLocation={() => setProvenance("browser")}
    />
  );
};

describe("MapMenu", () => {
  it("confirms a pinpoint without radius props or radius UI", async () => {
    const confirm = vi.fn();
    const changeOpen = vi.fn();
    render(
      <GoogleMapPicker
        mode={MapMenuMode.Point}
        apiKey=""
        open
        onOpenChange={changeOpen}
        input={toronto.label}
        onInputChange={vi.fn()}
        selectedLocation={toronto}
        suggestions={[]}
        onSelectLocation={vi.fn()}
        onConfirm={confirm}
      />,
    );
    expect(screen.queryByRole("combobox", { name: "Search within" })).toBeNull();
    expect(screen.queryByText("The circle shows your search area.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Use this location" }));
    await waitFor(() => expect(changeOpen).toHaveBeenCalledWith(false));
    expect(confirm).toHaveBeenCalledExactlyOnceWith({ location: toronto });
  });

  it("keeps an unselected pinpoint from being confirmed", () => {
    const confirm = vi.fn();
    render(
      <GoogleMapPicker
        mode={MapMenuMode.Point}
        apiKey=""
        open
        onOpenChange={vi.fn()}
        input="Toronto"
        onInputChange={vi.fn()}
        selectedLocation={null}
        suggestions={[]}
        onSelectLocation={vi.fn()}
        onConfirm={confirm}
      />,
    );
    const action = screen.getByRole<HTMLButtonElement>("button", {
      name: "Use this location",
    });
    expect(action.disabled).toBe(true);
    fireEvent.click(action);
    expect(confirm).not.toHaveBeenCalled();
  });
  it("shows at most three host-provided suggestions", () => {
    render(
      <GoogleMapPicker
        apiKey=""
        open
        onOpenChange={vi.fn()}
        input="Place"
        onInputChange={vi.fn()}
        selectedLocation={null}
        suggestions={Array.from({ length: 4 }, (_, index) => ({
          ...calgary,
          id: `place-${index}`,
          label: `Place ${index}`,
        }))}
        onSelectLocation={vi.fn()}
        radiusKm={100}
        onRadiusChange={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    fireEvent.focus(screen.getByRole("combobox", { name: "City or address" }));
    expect(within(screen.getByRole("listbox")).getAllByRole("option")).toHaveLength(3);
  });
  it("keeps radius and suggestion drafts separate from explicit confirmation", async () => {
    const confirm = vi.fn();
    render(<Harness confirm={confirm} />);
    const dialog = screen.getByRole("dialog");
    const radius = within(dialog).getByRole("combobox", {
      name: "Search within",
    });
    expect(
      within(radius)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual([
      "1 km",
      "2 km",
      "5 km",
      "10 km",
      "20 km",
      "40 km",
      "60 km",
      "80 km",
      "100 km",
      "250 km",
      "500 km",
    ]);
    fireEvent.change(radius, { target: { value: "2" } });
    const input = screen.getByRole("combobox", { name: "City or address" });
    fireEvent.change(input, { target: { value: "Cal" } });
    expect(screen.getByRole("status").textContent).toContain("IP address");
    const action = screen.getByRole<HTMLButtonElement>("button", {
      name: "Use this location",
    });
    expect(action.disabled).toBe(true);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    const suggestion = screen.getByRole("option", { name: calgary.label });
    expect(input.getAttribute("aria-activedescendant")).toBe(suggestion.id);
    expect(suggestion.firstElementChild?.tagName.toLowerCase()).toBe("svg");
    expect(within(suggestion).getByText("Alberta, Canada").className).toContain(
      "text-muted-foreground",
    );
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
    expect(confirm).not.toHaveBeenCalled();
    expect(action.className).toContain("bg-[oklch(0.9247_0.0524_66.1732)]");
    fireEvent.click(action);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(confirm).toHaveBeenCalledWith({ location: calgary, radiusKm: 2 });
  });

  it("cancels without confirmation and distinguishes browser feedback", () => {
    const confirm = vi.fn();
    render(<Harness confirm={confirm} />);
    fireEvent.click(screen.getByRole("button", { name: "Use my location" }));
    expect(screen.getByRole("status").textContent).toBe("Using your browser location.");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(confirm).not.toHaveBeenCalled();
  });

  it("blocks duplicate/pending confirmation and retains failed drafts for retry", async () => {
    const pending = Promise.withResolvers<void>();
    const confirm = vi.fn(() => pending.promise);
    render(<Harness confirm={confirm} />);
    const action = screen.getByRole<HTMLButtonElement>("button", {
      name: "Use this location",
    });
    fireEvent.click(action);
    fireEvent.click(action);
    expect(action.disabled).toBe(true);
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Cancel" }).disabled).toBe(true);
    expect(confirm).toHaveBeenCalledTimes(1);
    await act(async () => pending.reject(new Error("save failed")));
    expect(
      screen.getByText("Your location could not be saved. Try again.").getAttribute("role"),
    ).toBe("alert");
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(action.disabled).toBe(false);
  });

  it("supports French/base-locale messages and host-owned button styling", () => {
    render(
      <GoogleMapPicker
        apiKey=""
        open
        onOpenChange={vi.fn()}
        input={toronto.label}
        onInputChange={vi.fn()}
        selectedLocation={toronto}
        suggestions={[]}
        onSelectLocation={vi.fn()}
        radiusKm={20}
        onRadiusChange={vi.fn()}
        onConfirm={vi.fn()}
        locale="fr-CA"
        messages={{ "fr-CA": { confirm: "Choisir ce lieu" } }}
        confirmClassName="bg-primary text-primary-foreground"
      />,
    );
    expect(screen.getByRole("dialog", { name: "Choisir votre lieu" })).toBeDefined();
    expect(screen.getByRole("combobox", { name: "Ville ou adresse" })).toBeDefined();
    expect([...screen.getByRole("button", { name: "Choisir ce lieu" }).classList]).not.toContain(
      "bg-[oklch(0.9247_0.0524_66.1732)]",
    );
  });
});
