/** Endpoint Better Auth (staf). Semua rute /api/auth/* ditangani di sini. */
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth.handler);
