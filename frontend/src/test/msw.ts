import { setupServer } from "msw/node";
import { getDefaultMock } from "@/api/generated/default/default.msw";

export const server = setupServer(...getDefaultMock());
