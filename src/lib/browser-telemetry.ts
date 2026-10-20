import { BrowserOtlp } from "@krak-stack/registry/opentelemetry/browser";
import { BrowserEvents } from "@krak-stack/registry/events/browser";
import { BrowserWebVitals } from "@krak-stack/registry/opentelemetry/web-vitals";
import { Layer } from "effect";
import { Atom } from "effect/reactivity";

export const telemetryRuntime = Atom.runtime(
  import.meta.env.SSR
    ? Layer.empty
    : Layer.mergeAll(BrowserEvents.layer(), BrowserWebVitals.layer()).pipe(
        Layer.provideMerge(
          BrowserOtlp.layer({ serviceName: "krakstack-site-web" }),
        ),
      ),
);
