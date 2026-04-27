// scripts/merge-messages.ts
const langs = ["en", "fr"];
const glob = new Bun.Glob("src/messages/**/*.json");

const messagesByLang: Record<string, Record<string, string>> = {};

for await (const file of glob.scan(".")) {
  console.log(`[merge-messages] ${file}`);
  const lang = file.split("/").pop()?.replace(".json", "");
  if (!lang || !langs.includes(lang)) continue;

  const contents = await Bun.file(file).json();
  messagesByLang[lang] = { ...messagesByLang[lang], ...contents };
}

for (const [lang, messages] of Object.entries(messagesByLang)) {
  await Bun.write(`src/messages/${lang}.json`, JSON.stringify(messages, null, 2));
  console.log(`[merge-messages] ${lang}: wrote messages/${lang}.json`);
}

export {};
