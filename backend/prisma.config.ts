import "dotenv/config";
import {defineConfig} from "prisma/config";

export default defineConfig({
    schema: "prisma/schema.prisma",
     migrations: {
    path: "prisma/migrations",
  },
    datasource: {
        url: process.env.DATABASE_URL ?? "postgresql://studio_user:studio_password@localhost:5432/store_studio",
    },
});