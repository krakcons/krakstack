import { Schema } from "effect";

import {
  DocsFrontmatter,
  DocsPageSchema,
  type DocsHeading,
  type DocsPage,
} from "./docs";
import {
  compileMarkdown,
  markdownOptions,
  markdownPlainText,
} from "./markdown/server";

export const compileDocsMarkdown = (source: string) => {
  const headings: DocsHeading[] = [];
  const seen = new Set<string>();
  Bun.markdown.render(
    source,
    {
      heading: (children, { id, level }) => {
        if ((level === 2 || level === 3) && id) {
          if (seen.has(id)) throw new Error(`Duplicate heading ${id}`);
          seen.add(id);
          headings.push({ depth: level, id, title: children });
        }
        return "";
      },
    },
    markdownOptions,
  );

  const compiled = compileMarkdown(source);

  return {
    ...compiled,
    headings,
    searchText: markdownPlainText(source),
  };
};

export const compileMdxDocsPage = (
  sourceFile: string,
  source: string,
): DocsPage => {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(source);
  if (!match) throw new Error(`Missing frontmatter in ${sourceFile}`);

  const frontmatter = Schema.decodeUnknownSync(DocsFrontmatter)(
    Bun.YAML.parse(match[1] ?? ""),
  );
  const bodySource = match[2] ?? "";
  const title = /^#\s+(.+?)\s*$/m.exec(bodySource)?.[1];
  if (
    !title ||
    markdownPlainText(title, true) !==
      markdownPlainText(frontmatter.title, true)
  ) {
    throw new Error(`Body title does not match frontmatter in ${sourceFile}`);
  }
  const body = bodySource.replace(/^\s*#\s+.+?\r?\n+/, "");

  return Schema.decodeUnknownSync(DocsPageSchema)({
    ...frontmatter,
    ...compileDocsMarkdown(body),
    sourceFile,
  });
};

export const loadMdxDocsDirectory = async (root: string) => {
  const glob = new Bun.Glob("**/*.mdx");
  const pages: DocsPage[] = [];
  for await (const file of glob.scan({ cwd: root, onlyFiles: true })) {
    pages.push(
      compileMdxDocsPage(
        `${root}/${file}`,
        await Bun.file(`${root}/${file}`).text(),
      ),
    );
  }
  return pages;
};
