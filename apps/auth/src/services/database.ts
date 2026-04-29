import { drizzle } from "drizzle-orm/node-postgres";

import { relations, schema } from "@/db/schema";

export const db = drizzle({
  connection: process.env.DATABASE_URL ?? "",
  schema,
  relations,
});
