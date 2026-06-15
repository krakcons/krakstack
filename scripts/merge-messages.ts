// scripts/merge-messages.ts
import { locales, type Locale } from "@/paraglide/runtime";
const glob = new Bun.Glob("src/messages/**/*.json");

const messagesByLang: Record<string, Record<string, string>> = {};

for await (const file of glob.scan(".")) {
  if (/^src\/messages\/[a-z-]+\.json$/.test(file)) continue;

  console.log(`[merge-messages] ${file}`);
  const lang = file.split("/").pop()?.replace(".json", "");
  if (!isLocale(lang)) continue;

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

function isLocale(value: string | undefined): value is Locale {
  return Boolean(value && locales.includes(value as Locale));
}

export {};
