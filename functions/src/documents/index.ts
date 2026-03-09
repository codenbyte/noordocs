/**
 * NoorSpace Documents — Module Barrel Export
 *
 * Import the router and mount it in app.ts:
 *   import { documentsRouter } from "./documents";
 *   app.use("/api/documents", documentsRouter);
 */

export { default as documentsRouter } from "./routes";
export * from "./models";
export * from "./service";
export { getSignatureProvider } from "./providers";
