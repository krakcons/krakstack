import { Schema } from "effect";

import {
  DocsFrontmatter,
  DocsPageSchema,
  type DocsHeading,
  type DocsPage,
} from "./docs";

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const decodeMarkdownCode = (value: string) =>
  value
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");

const safeUrl = (value: string, image = false) => {
  if (
    value.startsWith("/") ||
    value.startsWith("#") ||
    value.startsWith("https://") ||
    value.startsWith("http://") ||
    (!image && value.startsWith("mailto:"))
  ) {
    return value;
  }
  return image ? "" : "#";
};

const markdownOptions = {
  autolinks: true,
  headings: { ids: true },
  noHtmlBlocks: true,
  noHtmlSpans: true,
  tagFilter: true,
} satisfies Bun.markdown.Options;

const plainText = (source: string, includeCode = false) =>
  Bun.markdown
    .render(
      source,
      {
        blockquote: (children) => `${children} `,
        code: (children) => (includeCode ? `${children} ` : " "),
        codespan: (children) => `${children} `,
        heading: (children) => `${children} `,
        html: () => " ",
        image: (children) => `${children} `,
        list: (children) => `${children} `,
        listItem: (children) => `${children} `,
        paragraph: (children) => `${children} `,
        table: (children) => `${children} `,
        td: (children) => `${children} `,
        th: (children) => `${children} `,
        tr: (children) => `${children} `,
      },
      markdownOptions,
    )
    .replace(/\s+/g, " ")
    .trim();

export const compileDocsMarkdown = (source: string) => {
  const codeBlocks: Array<{ code: string; language: string }> = [];
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

  const html = Bun.markdown.render(
    source,
    {
      blockquote: (children) => `<blockquote>${children}</blockquote>`,
      code: (children, meta) => {
        const index = codeBlocks.length;
        const code = decodeMarkdownCode(children.replace(/\n$/, ""));
        const language = meta?.language ?? "text";
        codeBlocks.push({ code, language });
        return `<docs-code-block data-index="${index}"></docs-code-block>`;
      },
      codespan: (children) =>
        `<code data-inline-code>${escapeHtml(children)}</code>`,
      emphasis: (children) => `<em>${children}</em>`,
      heading: (children, { id, level }) => {
        const headingId = escapeHtml(id ?? "");
        const anchor =
          level === 2 || level === 3
            ? `<a href="#${headingId}" aria-hidden="true">#</a>`
            : "";
        return `<h${level} id="${headingId}">${children}${anchor}</h${level}>`;
      },
      hr: () => "<hr>",
      html: (children) => escapeHtml(children),
      image: (children, { src, title }) => {
        const resolvedSrc = safeUrl(src, true);
        if (!resolvedSrc) return children;
        const titleAttribute = title ? ` title="${escapeHtml(title)}"` : "";
        return `<img src="${escapeHtml(resolvedSrc)}" alt="${escapeHtml(children)}"${titleAttribute}>`;
      },
      link: (children, { href, title }) => {
        const resolvedHref = safeUrl(href);
        const external = /^https?:\/\//.test(resolvedHref);
        const titleAttribute = title ? ` title="${escapeHtml(title)}"` : "";
        const externalAttributes = external
          ? ' target="_blank" rel="noreferrer"'
          : "";
        return `<a href="${escapeHtml(resolvedHref)}"${titleAttribute}${externalAttributes}>${children}</a>`;
      },
      list: (children, { ordered, start }) =>
        ordered
          ? `<ol${start && start !== 1 ? ` start="${start}"` : ""}>${children}</ol>`
          : `<ul>${children}</ul>`,
      listItem: (children, { checked }) => {
        const checkbox =
          checked === undefined
            ? ""
            : `<input type="checkbox" disabled${checked ? " checked" : ""}>`;
        return `<li>${checkbox}${children}</li>`;
      },
      paragraph: (children) => `<p>${children}</p>`,
      strikethrough: (children) => `<del>${children}</del>`,
      strong: (children) => `<strong>${children}</strong>`,
      table: (children) =>
        `<div data-docs-table><table>${children}</table></div>`,
      tbody: (children) => `<tbody>${children}</tbody>`,
      td: (children, meta) =>
        `<td${meta?.align ? ` align="${meta.align}"` : ""}>${children}</td>`,
      text: escapeHtml,
      th: (children, meta) =>
        `<th${meta?.align ? ` align="${meta.align}"` : ""}>${children}</th>`,
      thead: (children) => `<thead>${children}</thead>`,
      tr: (children) => `<tr>${children}</tr>`,
    },
    markdownOptions,
  );

  return {
    codeBlocks,
    headings,
    html,
    searchText: plainText(source),
    source,
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
  if (!title || plainText(title, true) !== plainText(frontmatter.title, true)) {
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
