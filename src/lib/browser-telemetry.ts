import { BrowserOtlp } from "@krak-stack/registry/opentelemetry/browser";
import { Layer } from "effect";
import { Atom } from "effect/reactivity";

export const telemetryRuntime = Atom.runtime(
  import.meta.env.SSR
    ? Layer.empty
    : BrowserOtlp.layer({ serviceName: "krakstack-site-web" }),
);
