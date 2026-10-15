export const limitTextBytes = (content: string, maxBytes: number) => {
  const encoded = new TextEncoder().encode(content);
  if (encoded.byteLength <= maxBytes) {
    return { content, byteSize: encoded.byteLength };
  }
  let end = Math.max(0, Math.floor(maxBytes));
  while (end > 0 && (encoded[end] & 0xc0) === 0x80) end -= 1;
  return {
    content: new TextDecoder().decode(encoded.slice(0, end)),
    byteSize: end,
  };
};

export const extractedText = (content: string, maxBytes: number) => {
  const normalized = content.replace(/\r\n?/g, "\n").trim();
  const bounded = limitTextBytes(normalized, maxBytes);
  return {
    content: bounded.content,
    contentByteSize: bounded.byteSize,
    truncated:
      bounded.byteSize !== new TextEncoder().encode(normalized).byteLength,
  };
};
