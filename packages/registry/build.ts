import {
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, relative, resolve } from "node:path";
import { Schema } from "effect";

const packageRoot = import.meta.dir;
const sourceRoot = resolve(packageRoot, "../../src");
const outputRoot = resolve(packageRoot, "dist");

rmSync(outputRoot, { force: true, recursive: true });

const compile = Bun.spawnSync({
  cmd: ["bunx", "tsc", "-p", resolve(packageRoot, "tsconfig.json")],
  cwd: packageRoot,
  stderr: "inherit",
  stdout: "inherit",
});

if (!compile.success) process.exit(compile.exitCode);

const RegistryPackageExport = Schema.Struct({
  import: Schema.String,
  types: Schema.optional(Schema.String),
}).annotate({ identifier: "RegistryPackageExport" });
const RegistryPackage = Schema.Struct({
  exports: Schema.Record(
    Schema.String,
    Schema.Union([RegistryPackageExport, Schema.String]),
  ),
}).annotate({ identifier: "RegistryPackage" });
const packageJson = Schema.decodeUnknownSync(RegistryPackage)(
  await Bun.file(resolve(packageRoot, "package.json")).json(),
);
const sourcePath = (path: string) =>
  [
    path,
    `${path}.ts`,
    `${path}.tsx`,
    `${path}.js`,
    resolve(path, "index.ts"),
    resolve(path, "index.tsx"),
    resolve(path, "index.js"),
  ].find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
const sourceAliasPlugin: Bun.BunPlugin = {
  name: "source-alias",
  setup(build) {
    build.onResolve({ filter: /^@\// }, ({ path }) => {
      const resolved = sourcePath(resolve(sourceRoot, path.slice(2)));
      return resolved ? { path: resolved } : undefined;
    });
  },
};
const entries = Object.values(packageJson.exports)
  .filter(Schema.is(RegistryPackageExport))
  .map(({ import: output }) => {
    const relativeOutput = output.replace(/^\.\/dist\//, "");
    const sourceWithoutExtension =
      relativeOutput === "oxlint/anti-slop/index.js"
        ? resolve(packageRoot, "../../tools/oxlint/anti-slop/index")
        : resolve(sourceRoot, relativeOutput.replace(/\.js$/, ""));
    const source = [
      `${sourceWithoutExtension}.tsx`,
      `${sourceWithoutExtension}.ts`,
    ].find(existsSync);

    if (!source) throw new Error(`Source not found for ${output}`);
    return { output: resolve(packageRoot, output), source };
  });

for (const entry of entries) {
  const result = await Bun.build({
    entrypoints: [entry.source],
    jsx: { development: false },
    naming: "[name].js",
    outdir: dirname(entry.output),
    packages: "external",
    plugins: [sourceAliasPlugin],
    target: entry.output.includes("/oxlint/") ? "node" : "browser",
  });

  if (!result.success) {
    for (const log of result.logs) console.error(log);
    process.exit(1);
  }
}

const files = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });

const developmentRuntimeFiles = files(outputRoot).filter(
  (file) =>
    extname(file) === ".js" &&
    readFileSync(file, "utf8").includes("react/jsx-dev-runtime"),
);

if (developmentRuntimeFiles.length > 0) {
  throw new Error(
    `Production registry build contains react/jsx-dev-runtime imports:\n${developmentRuntimeFiles.join("\n")}`,
  );
}

const emittedSpecifier = (
  outputFile: string,
  sourceFile: string,
  specifier: string,
) => {
  const unresolved = specifier.startsWith("@/")
    ? resolve(sourceRoot, specifier.slice(2))
    : resolve(dirname(sourceFile), specifier);
  const sourceTarget = [
    `${unresolved}.ts`,
    `${unresolved}.tsx`,
    `${unresolved}.js`,
    resolve(unresolved, "index.ts"),
    resolve(unresolved, "index.tsx"),
    resolve(unresolved, "index.js"),
    unresolved,
  ].find((candidate) => existsSync(candidate) && statSync(candidate).isFile());

  if (!sourceTarget) return specifier;

  const outputTarget = resolve(
    outputRoot,
    relative(sourceRoot, sourceTarget).replace(/\.(?:tsx?|jsx?)$/, ".js"),
  );
  let rewritten = relative(dirname(outputFile), outputTarget).replaceAll(
    "\\",
    "/",
  );
  if (!rewritten.startsWith(".")) rewritten = `./${rewritten}`;
  return rewritten;
};

for (const file of files(outputRoot)) {
  if (extname(file) !== ".ts") continue;

  const sourceFile = resolve(sourceRoot, relative(outputRoot, file));
  const content = readFileSync(file, "utf8").replace(
    /(["'])(@\/[^"']+|\.{1,2}\/[^"']+)\1/g,
    (match, quote: string, specifier: string) => {
      const rewritten = emittedSpecifier(file, sourceFile, specifier);
      return rewritten === specifier ? match : `${quote}${rewritten}${quote}`;
    },
  );
  writeFileSync(file, content);
}
