// scripts/merge-messages.ts
import { locales } from "@/paraglide/runtime";
const glob = new Bun.Glob("src/messages/**/*.json");

const messagesByLang: Record<string, Record<string, string>> = {};

for await (const file of glob.scan(".")) {
  console.log(`[merge-messages] ${file}`);
  const lang = file.split("/").pop()?.replace(".json", "");
  if (!lang || !locales.includes(lang as any)) continue;

  const contents = await Bun.file(file).json();
  messagesByLang[lang] = { ...messagesByLang[lang], ...contents };
}

for (const [lang, messages] of Object.entries(messagesByLang)) {
  await Bun.write(
    `src/messages/${lang}.json`,
    JSON.stringify(messages, null, 2),
  );
  console.log(`[merge-messages] ${lang}: wrote messages/${lang}.json`);
}

export {};
