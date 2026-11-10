import {
  cpSync,
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { resolve } from "node:path";

const root = import.meta.dir;
const output = resolve(root, "dist");
rmSync(output, { recursive: true, force: true });

const compile = Bun.spawnSync({
  cmd: ["bunx", "tsc", "-p", resolve(root, "tsconfig.build.json")],
  cwd: root,
  stdout: "inherit",
  stderr: "inherit",
});
if (!compile.success) process.exit(compile.exitCode);

// Keep only this package's declarations. Shared primitives stay owned by registry.
const declarations = resolve(
  output,
  ".declarations/packages/notifications-admin/src",
);
for (const entry of readdirSync(declarations)) {
  if (!entry.endsWith(".d.ts")) continue;
  const source = resolve(declarations, entry);
  if (readFileSync(source, "utf8").includes('"@/'))
    throw new Error(`Private source alias leaked into ${entry}`);
  cpSync(source, resolve(output, entry));
}
rmSync(resolve(output, ".declarations"), { recursive: true, force: true });

const sourceRoot = resolve(root, "../../src");
const sourceAlias: Bun.BunPlugin = {
  name: "krakstack-primitives",
  setup(build) {
    build.onResolve({ filter: /^@\// }, ({ path }) => {
      const base = resolve(sourceRoot, path.slice(2));
      const source = [base, `${base}.ts`, `${base}.tsx`].find(
        (candidate) => existsSync(candidate) && statSync(candidate).isFile(),
      );
      return source ? { path: source } : undefined;
    });
  },
};
const result = await Bun.build({
  entrypoints: [
    "index.ts",
    "contacts.tsx",
    "campaigns.tsx",
    "operations.tsx",
    "deliveries.tsx",
    "atoms.ts",
    "presentation.tsx",
  ].map((entry) => resolve(root, "src", entry)),
  outdir: output,
  naming: "[name].js",
  splitting: true,
  packages: "external",
  target: "browser",
  jsx: { development: false },
  plugins: [sourceAlias],
});
if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

// Declaration bootstrap aliases must never bundle registry components or their
// provider context into this package. Both packages must share one locale context.
const javascript = readdirSync(output)
  .filter((entry) => entry.endsWith(".js"))
  .map((entry) => readFileSync(resolve(output, entry), "utf8"))
  .join("\n");
for (const dependency of ["data-table", "form"]) {
  if (!javascript.includes(`"@krak-stack/registry/${dependency}"`))
    throw new Error(`Shared registry ${dependency} import was bundled or lost`);
}
if (javascript.includes("KrakstackContext"))
  throw new Error("Admin package contains a duplicate registry locale context");
