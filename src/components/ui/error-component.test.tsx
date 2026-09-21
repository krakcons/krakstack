// @vitest-environment jsdom

import { describe, expect, it } from "@effect/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { Data, Effect } from "effect";
import { HttpClientError, HttpClientRequest } from "effect/unstable/http";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { afterEach, beforeEach } from "vitest";

import { ErrorComponent, type ErrorComponentProps } from "./error-component";
import { getLocale, overwriteGetLocale } from "@/paraglide/runtime";

const originalGetLocale = getLocale;
const renderError = async (props: ErrorComponentProps, initialEntry = "/") => {
  const routeTree = createRootRoute({
    component: () => <ErrorComponent {...props} />,
  });
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  });
  await router.load();
  return render(<RouterProvider router={router} />);
};

const messages = {
  title: "Unable to load this page",
  description: "Please try again.",
  retry: "Try again",
  home: "Go to homepage",
};

const originalClipboard = Object.getOwnPropertyDescriptor(
  navigator,
  "clipboard",
);
const setClipboard = (clipboard: Pick<Clipboard, "writeText">) => {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: clipboard,
  });
};

beforeEach(() => overwriteGetLocale(() => "en"));
afterEach(() => {
  cleanup();
  overwriteGetLocale(originalGetLocale);
  if (originalClipboard)
    Object.defineProperty(navigator, "clipboard", originalClipboard);
  else Reflect.deleteProperty(navigator, "clipboard");
});

describe("ErrorComponent", () => {
  const traceId = "70c292c924fb19051793b87d70e565a7";
  const spanId = "185e348d831d215b";
  for (const headers of [
    { traceparent: `00-${traceId}-${spanId}-01` },
    { b3: `${traceId}-${spanId}-1` },
    { "x-b3-traceid": traceId, "x-b3-spanid": spanId },
  ]) {
    it(`copies the existing request trace through wrapped errors (${Object.keys(headers)[0]})`, async () => {
      let copied = "";
      setClipboard({
        writeText: async (value) => {
          copied = value;
        },
      });
      const request = HttpClientRequest.get(
        "https://example.test/api/session",
      ).pipe(
        HttpClientRequest.setHeaders({
          ...headers,
          authorization: "private-auth",
          cookie: "private-cookie",
        }),
      );
      const httpError = new HttpClientError.HttpClientError({
        reason: new HttpClientError.TransportError({ request }),
      });
      class SessionError extends Data.TaggedError("SessionError")<{
        message: string;
        cause: unknown;
      }> {}
      await renderError({
        error: new SessionError({
          message: "Session unavailable",
          cause: new Error("internal wrapper", { cause: httpError }),
        }),
        reset: () => {},
      });
      fireEvent.click(
        screen.getByRole("button", { name: "Copy error details" }),
      );
      await waitFor(() => expect(copied).toContain(`Reference: ${traceId}`));
      expect(copied).not.toMatch(
        /private-auth|private-cookie|internal wrapper/,
      );
      expect(copied).not.toContain(spanId);
    });
  }

  it("omits references for malformed trace headers and cyclic causes", async () => {
    let copied = "";
    setClipboard({
      writeText: async (value) => {
        copied = value;
      },
    });
    const request = HttpClientRequest.get(
      "https://example.test/api/session",
    ).pipe(HttpClientRequest.setHeader("b3", "not-a-trace"));
    const error = new HttpClientError.HttpClientError({
      reason: new HttpClientError.TransportError({ request }),
    });
    error.cause = error;
    await renderError({ error, reset: () => {} });
    fireEvent.click(screen.getByRole("button", { name: "Copy error details" }));
    await waitFor(() => expect(copied).toContain("Language: en"));
    expect(copied).not.toContain("Reference:");
  });

  it("copies shareable details without query strings, fragments, or raw causes", async () => {
    let copied = "";
    setClipboard({
      writeText: async (value) => {
        copied = value;
      },
    });
    await renderError(
      {
        error: new Error("Please contact support.", {
          cause: new Error("private cause"),
        }),
        reset: () => {},
        diagnostics: {
          app: "Kokobi",
          version: "1.2.3",
          reference: "trace-123",
        },
      },
      "/?token=private-query#private-fragment",
    );

    fireEvent.click(screen.getByRole("button", { name: "Copy error details" }));
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe(
        "Error details copied",
      ),
    );
    expect(
      screen.queryByText("Error details copied", { selector: "p" }),
    ).toBeNull();
    expect(copied).toContain("Error: Error\nMessage: Please contact support.");
    expect(copied).toContain("Page: /\n");
    expect(copied).toMatch(/Time: \d{4}-\d{2}-\d{2}T/);
    expect(copied).toContain("Language: en");
    expect(copied).toContain(
      "Application: Kokobi\nVersion: 1.2.3\nReference: trace-123",
    );
    expect(copied).not.toMatch(
      /private-query|private-fragment|private cause|token=/,
    );
  });

  it("offers selectable localized details when clipboard access fails", async () => {
    overwriteGetLocale(() => "fr");
    let attempted = "";
    setClipboard({
      writeText: async (value) => {
        attempted = value;
        throw new Error("Clipboard denied");
      },
    });
    await renderError({
      error: new Error("Contactez le support."),
      reset: () => {},
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Copier les détails de l'erreur" }),
    );
    const details = await screen.findByRole("textbox", {
      name: "Détails de l'erreur",
    });
    expect(details).toHaveProperty("readOnly", true);
    expect(details).toHaveProperty("value", attempted);
    expect(attempted).toContain("Langue: fr");
    fireEvent.focus(details);
    expect(details).toHaveProperty("selectionStart", 0);
    expect(details).toHaveProperty("selectionEnd", attempted.length);
  });

  it("provides English defaults without a wrapper or message props", async () => {
    await renderError({ error: new Error(" "), reset: () => {} });
    expect(screen.getByRole("heading").textContent).toBe(messages.title);
    expect(
      screen.getByText(
        "Something went wrong while loading this page. Please try again.",
      ),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: messages.retry })).toBeDefined();
    expect(
      screen.getByRole("link", { name: messages.home }).getAttribute("href"),
    ).toBe("/");
  });

  it("provides French defaults and permits individual message overrides", async () => {
    overwriteGetLocale(() => "fr");
    await renderError({
      error: new Error(""),
      reset: () => {},
      messages: { title: "Erreur personnalisée" },
    });
    expect(screen.getByRole("heading").textContent).toBe(
      "Erreur personnalisée",
    );
    expect(
      screen.getByText(
        "Une erreur est survenue lors du chargement de cette page. Veuillez réessayer.",
      ),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "Réessayer" })).toBeDefined();
    expect(
      screen.getByRole("link", { name: "Retour à l'accueil" }),
    ).toBeDefined();
  });

  it("displays a standard error message without its cause and respects retry configuration", async () => {
    const error = new Error("Contactez votre administrateur.", {
      cause: new Error("private diagnostic"),
    });
    await renderError({ error, reset: () => {}, messages, retryable: false });
    expect(screen.getByRole("heading").textContent).toBe(messages.title);
    expect(screen.getByText(error.message)).toBeDefined();
    expect(screen.queryByRole("button", { name: messages.retry })).toBeNull();
    expect(screen.queryByText("private diagnostic")).toBeNull();
  });

  it.effect(
    "renders an existing Effect tagged error without a presentation-specific error class",
    () =>
      Effect.gen(function* () {
        class ServiceUnavailable extends Data.TaggedError(
          "ServiceUnavailable",
        )<{ message: string }> {}
        const error = yield* Effect.flip(
          new ServiceUnavailable({ message: "Try later" }),
        );
        yield* Effect.promise(() =>
          renderError({ error, reset: () => {}, messages }),
        );
        expect(screen.getByText("Try later")).toBeDefined();
      }),
  );
});
