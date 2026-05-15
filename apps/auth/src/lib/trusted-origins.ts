export const parseCsv = (value: string | undefined) =>
  value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const trustedOrigins =
  parseCsv(process.env.BETTER_AUTH_TRUSTED_ORIGINS) ?? [];
