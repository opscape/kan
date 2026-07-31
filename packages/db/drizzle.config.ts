import { type Config } from "drizzle-kit";

export default {
  schema: "./src/schema",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL ?? process.env.POSTGRES_URL ?? "",
    ssl: process.env.NODE_ENV === "production" ? true : false,
  },
  migrations: {
    prefix: "timestamp",
  },
} satisfies Config;
