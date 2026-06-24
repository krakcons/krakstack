import bash from "@shikijs/langs/bash";
import css from "@shikijs/langs/css";
import javascript from "@shikijs/langs/javascript";
import json from "@shikijs/langs/json";
import jsx from "@shikijs/langs/jsx";
import tsx from "@shikijs/langs/tsx";
import typescript from "@shikijs/langs/typescript";
import vitesseDark from "@shikijs/themes/vitesse-dark";
import vitesseLight from "@shikijs/themes/vitesse-light";
import { createHighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";

const langAlias = {
  cjs: "javascript",
  console: "bash",
  js: "javascript",
  mjs: "javascript",
  node: "javascript",
  shell: "bash",
  sh: "bash",
  ts: "typescript",
  zsh: "bash",
};

export const shikiHighlighter = createHighlighterCore({
  themes: [vitesseLight, vitesseDark],
  langs: [bash, css, javascript, json, jsx, tsx, typescript],
  langAlias,
  engine: createOnigurumaEngine(import("shiki/wasm")),
});
