// @vitest-environment jsdom
import { describe, expect, it } from "@effect/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { useState } from "react";
import {
  ImageCropEditor,
  getImageCropGeometry,
  type ImageCropState,
} from "./image-crop-editor";

const originalContext = Object.getOwnPropertyDescriptor(
  HTMLCanvasElement.prototype,
  "getContext",
);
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  if (originalContext)
    Object.defineProperty(
      HTMLCanvasElement.prototype,
      "getContext",
      originalContext,
    );
});
const initial: ImageCropState = { x: 50, y: 50, zoom: 1, rotation: 0 };
describe("ImageCropEditor", () => {
  it("recognizes an image that loaded before hydration or ref attachment", () => {
    vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(
      true,
    );
    vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(
      800,
    );
    vi.spyOn(
      HTMLImageElement.prototype,
      "naturalHeight",
      "get",
    ).mockReturnValue(600);
    render(
      <ImageCropEditor
        src="cached.png"
        label="Crop"
        value={initial}
        onValueChange={vi.fn()}
        onExport={vi.fn()}
      />,
    );
    expect(screen.getByRole("img", { name: "Crop" })).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "Export image" })
        .hasAttribute("disabled"),
    ).toBe(false);
  });
  it("keeps crops within rotated source pixels and honors aspect ratio and zoom", () => {
    expect(getImageCropGeometry(800, 600, initial)).toEqual({
      x: 100,
      y: 0,
      width: 600,
      height: 600,
      sourceWidth: 800,
      sourceHeight: 600,
    });
    for (const rotation of [0, 90, 180, 270] as const) {
      const crop = getImageCropGeometry(
        800,
        600,
        { x: 100, y: 100, zoom: 2, rotation },
        16 / 9,
      );
      expect(crop.width / crop.height).toBeCloseTo(16 / 9);
      expect(crop.x + crop.width).toBeCloseTo(crop.sourceWidth);
      expect(crop.y + crop.height).toBeCloseTo(crop.sourceHeight);
    }
  });
  it("disables export until loaded and resets source loading state", () => {
    const props = {
      label: "Crop",
      value: initial,
      onValueChange: vi.fn(),
      onExport: vi.fn(),
    };
    const view = render(<ImageCropEditor src="first.png" {...props} />);
    expect(
      screen
        .getByRole("button", { name: "Export image" })
        .hasAttribute("disabled"),
    ).toBe(true);
    const image = view.container.querySelector("img")!;
    Object.defineProperties(image, {
      naturalWidth: { value: 800 },
      naturalHeight: { value: 600 },
    });
    fireEvent.load(image);
    expect(
      screen
        .getByRole("button", { name: "Export image" })
        .hasAttribute("disabled"),
    ).toBe(false);
    view.rerender(<ImageCropEditor src="second.png" {...props} />);
    expect(
      screen
        .getByRole("button", { name: "Export image" })
        .hasAttribute("disabled"),
    ).toBe(true);
    fireEvent.error(view.container.querySelector("img")!);
    expect(screen.getByRole("alert").textContent).toContain(
      "could not be loaded",
    );
  });
  it("rotates, positions and exports a bounded PNG without submitting its parent", async () => {
    const context = {
      scale: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      drawImage: vi.fn(),
    };
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      writable: true,
      value: () => context,
    });
    const blob = new Blob(["png"], { type: "image/png" });
    const encode = vi
      .spyOn(HTMLCanvasElement.prototype, "toBlob")
      .mockImplementation((callback) => callback(blob));
    const exported = vi.fn();
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const Example = () => {
      const [value, setValue] = useState(initial);
      return (
        <form onSubmit={submit}>
          <ImageCropEditor
            src="test.png"
            label="Crop"
            value={value}
            onValueChange={setValue}
            onExport={exported}
            maxOutputSize={200}
          />
        </form>
      );
    };
    const view = render(<Example />);
    const image = view.container.querySelector("img")!;
    Object.defineProperties(image, {
      naturalWidth: { value: 800 },
      naturalHeight: { value: 600 },
    });
    fireEvent.load(image);
    fireEvent.click(screen.getByRole("button", { name: "Rotate 90°" }));
    fireEvent.change(screen.getByRole("slider", { name: "Zoom" }), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Export image" }));
    await waitFor(() => expect(exported).toHaveBeenCalledWith(blob));
    expect(context.scale).toHaveBeenCalledWith(2 / 3, 2 / 3);
    expect(encode).toHaveBeenCalledWith(expect.any(Function), "image/png");
    expect(context.rotate).toHaveBeenCalledWith(Math.PI / 2);
    expect(submit).not.toHaveBeenCalled();
  });
});
