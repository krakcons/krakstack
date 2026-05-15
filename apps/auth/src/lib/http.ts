export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const readStringField = async (request: Request, field: string) => {
  const body: unknown = await request.json();

  if (typeof body !== "object" || body === null || !(field in body)) {
    return null;
  }

  const value = (body as Record<string, unknown>)[field];
  return typeof value === "string" ? value : null;
};
