"use strict";
/**
 * NoorSpace Documents — Signature Provider Interface
 *
 * This abstraction decouples NoorSpace business logic from any specific
 * e-sign vendor. The service layer calls these methods exclusively —
 * route handlers and webhook controllers never touch provider internals.
 *
 * ┌────────────────────────────────────────────────────────┐
 * │                  HOW TO ADD A PROVIDER                 │
 * │                                                        │
 * │  1. Create a new file (e.g. documenso-provider.ts)     │
 * │  2. Implement the SignatureProvider interface           │
 * │  3. Register it in the provider registry (index.ts)    │
 * │  4. Set SIGNATURE_PROVIDER env var to your key         │
 * │  5. All business logic works unchanged                 │
 * └────────────────────────────────────────────────────────┘
 *
 * Current providers:
 *   - "internal"     — canvas-based, stored in Firestore (Phase 1)
 *   - "mock"         — in-memory mock for local development & testing
 *   - "documenso"    — placeholder stub
 *   - "docuseal"     — placeholder stub
 *   - "dropbox_sign" — placeholder stub
 */
Object.defineProperty(exports, "__esModule", { value: true });
//# sourceMappingURL=signature-provider.js.map