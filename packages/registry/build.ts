import { cpSync, rmSync } from "node:fs";

const source = new URL("../../public/r/", import.meta.url);
const output = new URL("./dist/", import.meta.url);

rmSync(output, { force: true, recursive: true });
cpSync(source, output, { recursive: true });
