// @vitest-environment jsdom

import { describe, expect, it } from "@effect/vitest";
import { FormBuilder, FormReact } from "@lucas-barake/effect-form-react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Effect, Exit, Schema } from "effect";
import { HttpApiError } from "effect/http-api";
import {
  HttpClientError,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/http";
import { AsyncResult } from "effect/reactivity";
import { afterEach, vi } from "vitest";

import { ImageField, SubmitError, effectFormMessages } from "./effect-form";
import { KrakstackProvider } from "./krakstack-provider";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("SubmitError", () => {
  it.each([
    [new HttpApiError.BadRequest({}), "submitBadRequest"],
    [new HttpApiError.Unauthorized({}), "submitUnauthorized"],
    [new HttpApiError.Forbidden({}), "submitForbidden"],
    [new HttpApiError.NotFound({}), "submitNotFound"],
    [new HttpApiError.Conflict({}), "submitConflict"],
    [{ _tag: "TooManyRequests" }, "submitRateLimited"],
    [new HttpApiError.InternalServerError({}), "submitFailed"],
    [new HttpApiError.ServiceUnavailable({}), "submitUnavailable"],
  ] as const)("displays a message for $0._tag", (error, message) => {
    render(<SubmitError result={AsyncResult.fail(error)} />);
    expect(screen.getByRole("alert").textContent).toBe(
      effectFormMessages()[message],
    );
  });

  it("uses the provider locale and supports explicit locale and message overrides", () => {
    const result = AsyncResult.fail(new HttpApiError.Forbidden({}));
    const { rerender } = render(
      <KrakstackProvider locale="fr">
        <SubmitError result={result} />
      </KrakstackProvider>,
    );
    expect(screen.getByRole("alert").textContent).toBe(
      effectFormMessages("fr").submitForbidden,
    );

    rerender(
      <KrakstackProvider locale="fr">
        <SubmitError
          result={result}
          locale="es-MX"
          messages={{
            es: { submitForbidden: "Sin permiso" },
            "es-MX": { submitForbidden: "No tienes permiso" },
          }}
        />
      </KrakstackProvider>,
    );
    expect(screen.getByRole("alert").textContent).toBe("No tienes permiso");
  });

  it.each([new Error(""), new Error("   "), "", undefined, null, {}])(
    "provides a fallback for an uninformative failure (%j)",
    (error) => {
      render(<SubmitError result={AsyncResult.fail(error)} />);
      expect(screen.getByRole("alert").textContent).toBe(
        effectFormMessages().submitFailed,
      );
    },
  );

  it("preserves useful domain error messages", () => {
    render(
      <SubmitError
        result={AsyncResult.fail(new Error("The hostname is already in use."))}
      />,
    );
    expect(screen.getByRole("alert").textContent).toBe(
      "The hostname is already in use.",
    );
  });

  it("preserves an explicit message on a typed HTTP error", () => {
    const error = new HttpApiError.Forbidden({});
    Object.defineProperty(error, "message", {
      value: "Only organization owners can change this setting.",
    });
    render(<SubmitError result={AsyncResult.fail(error)} />);
    expect(screen.getByRole("alert").textContent).toBe(
      "Only organization owners can change this setting.",
    );
  });

  it("recognizes HTTP client response statuses", () => {
    const request = HttpClientRequest.get("https://example.com");
    const response = HttpClientResponse.fromWeb(
      request,
      new Response(null, { status: 403 }),
    );
    const error = new HttpClientError.HttpClientError({
      reason: new HttpClientError.StatusCodeError({ request, response }),
    });
    render(<SubmitError result={AsyncResult.fail(error)} />);
    expect(screen.getByRole("alert").textContent).toBe(
      effectFormMessages().submitForbidden,
    );
  });

  it("leaves schema validation errors to field-level displays", () => {
    const exit = Schema.decodeUnknownExit(Schema.String)(42);
    if (!Exit.isFailure(exit)) throw new Error("Expected a schema error");
    render(<SubmitError result={AsyncResult.failure(exit.cause)} />);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("does not display an error for initial or successful submissions", () => {
    const { rerender } = render(<SubmitError result={AsyncResult.initial()} />);
    expect(screen.queryByRole("alert")).toBeNull();
    rerender(<SubmitError result={AsyncResult.success(undefined)} />);
    expect(screen.queryByRole("alert")).toBeNull();
  });
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
