import { ChunkType, type Chunk } from "@xberg-io/xberg";

// Xberg 1.0.14 exposes headingPath / repeat_header, but its shipped binding
// sometimes supplies only headingContext and omits continuation table headers.
// Keep native boundaries/provenance; repair only the missing contextual text.
export const contextualizeChunks = (chunks: ReadonlyArray<Chunk>) => {
  let previousHeading = "";
  let tableHeader = "";
  return chunks.map((chunk, ordinal) => {
    const headingPath = (
      chunk.metadata.headingPath.length
        ? chunk.metadata.headingPath
        : (chunk.metadata.headingContext?.headings.map(({ text }) => text) ??
          [])
    ).join(" > ");
    if (
      headingPath !== previousHeading ||
      chunk.chunkType !== ChunkType.TableLike
    )
      tableHeader = "";
    previousHeading = headingPath;
    let content = chunk.content;
    if (chunk.chunkType === ChunkType.TableLike) {
      const header = content.match(
        /^(\|[^\n]+\|)\r?\n(\|[\s:|-]+\|)\s*$/m,
      )?.[0];
      if (header) tableHeader = header.trim();
      else if (tableHeader) content = `${tableHeader}\n\n${content}`;
    }
    return {
      ordinal,
      content,
      headingPath,
      byteStart: chunk.metadata.byteStart,
      byteEnd: chunk.metadata.byteEnd,
      firstPage: chunk.metadata.firstPage ?? null,
      lastPage: chunk.metadata.lastPage ?? null,
    };
  });
};
