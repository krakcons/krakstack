import { createRoot } from "react-dom/client";
import { RegistryProvider } from "@effect/atom-react";
import {
  SendAdminPanel,
  makeSendAdminAtoms,
} from "../../src/agent-examples/send/console";
import "../../src/styles.css";
const locale =
  new URL(location.href).searchParams.get("locale") === "fr" ? "fr" : "en";
document.documentElement.lang = locale;
const root = document.getElementById("root");
if (!root) throw new Error("Missing test root");
createRoot(root).render(
  <RegistryProvider>
    <SendAdminPanel
      atoms={makeSendAdminAtoms(location.origin)}
      locale={locale}
    />
  </RegistryProvider>,
);
