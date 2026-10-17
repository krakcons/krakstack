// @vitest-environment jsdom

import { describe, expect, it } from "@effect/vitest";
import { FormBuilder, FormReact } from "@lucas-barake/effect-form-react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Effect, Schema } from "effect";
import { afterEach, vi } from "vitest";

import { ImageField } from "./effect-form";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ImageField", () => {
  it("previews selected and replacement files and releases previews when cleared", () => {
    const createObjectURL = vi
      .fn()
      .mockReturnValueOnce("blob:first-logo")
      .mockReturnValueOnce("blob:replacement-logo");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal(
      "URL",
      class extends URL {
        static override createObjectURL = createObjectURL;
        static override revokeObjectURL = revokeObjectURL;
      },
    );

    const builder = FormBuilder.empty.addField(
      "logo",
      Schema.Union([
        Schema.String,
        Schema.instanceOf(File),
        Schema.Null,
        Schema.Undefined,
      ]),
    );
    const form = FormReact.make(builder, {
      fields: { logo: ImageField },
      onSubmit: () => Effect.void,
    });
    render(
      <form.Initialize defaultValues={{ logo: "https://example.com/logo.png" }}>
        <form.logo label="Logo" size={{ width: 175, height: 50 }} />
      </form.Initialize>,
    );

    expect(screen.getByRole("img", { name: "Logo" }).getAttribute("src")).toBe(
      "https://example.com/logo.png",
    );
    fireEvent.change(screen.getByLabelText("Logo"), {
      target: {
        files: [new File(["first"], "first.png", { type: "image/png" })],
      },
    });
    expect(screen.getByRole("img", { name: "Logo" }).getAttribute("src")).toBe(
      "blob:first-logo",
    );

    fireEvent.change(screen.getByLabelText("Logo"), {
      target: {
        files: [
          new File(["replacement"], "replacement.png", { type: "image/png" }),
        ],
      },
    });
    expect(screen.getByRole("img", { name: "Logo" }).getAttribute("src")).toBe(
      "blob:replacement-logo",
    );
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:first-logo");

    fireEvent.click(
      screen.getByRole("button", { name: "Delete replacement.png" }),
    );
    expect(screen.queryByRole("img")).toBeNull();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:replacement-logo");
  });
});
