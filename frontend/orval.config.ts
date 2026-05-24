import { defineConfig } from "orval";

export default defineConfig({
  api: {
    output: {
      mode: "tags-split",
      target: "src/api/generated",
      schemas: "src/api/generated/schemas",
      client: "react-query",
      mock: true,
      baseUrl: "/api",
    }, input: {
      target: "../backend/generated/openapi.json",
    },
  },
});
