import { renderToString } from "react-dom/server";
import { makeCounterDemo } from "./demo.tsx";

const CounterDemo = makeCounterDemo();

const client = await Bun.build({
  entrypoints: [`${import.meta.dir}/client.tsx`],
  target: "browser",
  minify: true,
  define: { "process.env.NODE_ENV": '"production"' },
});

const basecoatCss = Bun.file(
  new URL("./basecoat.cdn.min.css", import.meta.resolve("basecoat-css")),
);

const counterPage = (request: Request) => {
  const inspectReact =
    new URL(request.url).searchParams.get("inspect") === "react";
  return new Response(
    `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Counter / Compteur</title>
<link rel="stylesheet" href="/basecoat.css">
<style>
  .counter-demo { max-width: 48rem; margin-inline: auto; padding: 2rem 1rem; }
  .counter-demo h1 { font-size: 1.5rem; font-weight: 600; }
  .counter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr)); gap: 1rem; margin-block-start: 1.5rem; }
  #react-counter { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; }
</style>
<main class="counter-demo">
  <h1>Counter / Compteur</h1>
  <p>+1 every 5 seconds / +1 toutes les 5 secondes</p>
  <nav aria-label="DevTools / Outils de développement">
    <a class="btn" href="/counter?inspect=native"${inspectReact ? ' data-variant="outline"' : ' aria-current="page"'}>Inspect native / Inspecter la version native</a>
    <a class="btn" href="/counter?inspect=react"${inspectReact ? ' aria-current="page"' : ' data-variant="outline"'}>Inspect React / Inspecter React</a>
  </nav>
  <div class="counter-grid">
    <article class="card">
      <header><h2>React TSX</h2></header>
      <section id="react-counter"${inspectReact ? " data-inspected" : ""}>${renderToString(<CounterDemo />)}</section>
    </article>
    <article class="card">
      <header><h2>Effect UI</h2></header>
      <section id="native-counter"></section>
    </article>
  </div>
</main>
<script type="module" src="/client.js"></script>
</html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
};

const server = Bun.serve({
  hostname: "127.0.0.1",
  port: process.env.PORT ?? 4175,
  routes: {
    "/": counterPage,
    "/counter": counterPage,
    "/basecoat.css": () => new Response(basecoatCss),
    "/client.js": () => new Response(client.outputs[0]),
  },
});

console.log(new URL("/counter", server.url).href);
