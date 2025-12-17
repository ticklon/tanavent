import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/schema/*",
    out: "./drizzle",
    dialect: "sqlite",
    driver: "d1-http",
    dbCredentials: {
        accountId: "placeholder-id",
        databaseId: "placeholder-id",
        token: "placeholder-token",
    },
});
