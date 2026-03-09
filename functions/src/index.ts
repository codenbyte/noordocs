import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import { app } from "./app";

admin.initializeApp();

export { setAdminRole, setSuperAdminRole, removeAdminRole } from "./admin";

// ── Cloud Function ──────────────────────────────────────
export const api = onRequest(
  {
    region: "europe-west1",
    concurrency: 80,
    memory: "256MiB",
    timeoutSeconds: 60,
  },
  app,
);
