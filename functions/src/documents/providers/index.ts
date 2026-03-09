/**
 * NoorSpace Documents — Signature Provider Registry & Factory
 *
 * ┌────────────────────────────────────────────────────────┐
 * │               HOW TO SWAP PROVIDERS                    │
 * │                                                        │
 * │  Option A: Environment variable                        │
 * │    Set SIGNATURE_PROVIDER=documenso (or mock, etc.)    │
 * │    The factory reads this at startup.                  │
 * │                                                        │
 * │  Option B: Direct code change                          │
 * │    Change the DEFAULT_PROVIDER constant below.         │
 * │                                                        │
 * │  The service layer calls getSignatureProvider() and    │
 * │  never knows which vendor is behind the interface.     │
 * └────────────────────────────────────────────────────────┘
 *
 * Available providers:
 *   "internal"     — Canvas-based, Firestore-only (Phase 1 default)
 *   "mock"         — In-memory mock for local dev & testing
 *   "documenso"    — Open-source DocuSign alternative (stub)
 *   "docuseal"     — Open-source signing platform (stub)
 *   "dropbox_sign" — Dropbox Sign / HelloSign (stub)
 */

import type { SignatureProvider } from "./signature-provider";
import { InternalSignatureProvider } from "./internal-provider";
import { MockSignatureProvider } from "./mock-provider";

// ── Re-exports ───────────────────────────────────────

export type { SignatureProvider } from "./signature-provider";
export type {
  SignatureRequestResult,
  EmbeddedSigningSession,
  WebhookEvent,
  WebhookEventType,
  SignatureStatusResult,
  FinalizeResult,
} from "./signature-provider";

// ── Provider Registry ────────────────────────────────

/**
 * Registry of available providers. Each entry is a factory function
 * that creates a new provider instance. Vendor stubs are lazy-loaded
 * to avoid importing their (future) SDKs unless actually used.
 */
const PROVIDER_REGISTRY: Record<string, () => SignatureProvider> = {
  internal: () => new InternalSignatureProvider(),
  mock: () => new MockSignatureProvider(),

  // Vendor stubs — uncomment and configure when ready:
  //
  // documenso: () => {
  //   const { DocumensoProvider } = require("./documenso-provider");
  //   return new DocumensoProvider(
  //     process.env.DOCUMENSO_API_KEY!,
  //     process.env.DOCUMENSO_URL,
  //   );
  // },
  //
  // docuseal: () => {
  //   const { DocuSealProvider } = require("./docuseal-provider");
  //   return new DocuSealProvider(
  //     process.env.DOCUSEAL_API_KEY!,
  //     process.env.DOCUSEAL_URL,
  //   );
  // },
  //
  // dropbox_sign: () => {
  //   const { DropboxSignProvider } = require("./dropbox-sign-provider");
  //   return new DropboxSignProvider(
  //     process.env.DROPBOX_SIGN_API_KEY!,
  //   );
  // },
};

// ── Factory ──────────────────────────────────────────

const DEFAULT_PROVIDER = "internal";

/** Resolved provider — singleton per process */
let resolvedProvider: SignatureProvider | null = null;

/**
 * Get the active signature provider.
 *
 * Resolution order:
 *   1. SIGNATURE_PROVIDER environment variable
 *   2. DEFAULT_PROVIDER constant ("internal")
 *
 * The provider is instantiated once and cached for the process lifetime.
 */
export function getSignatureProvider(): SignatureProvider {
  if (resolvedProvider) return resolvedProvider;

  const providerKey = (process.env.SIGNATURE_PROVIDER || DEFAULT_PROVIDER).toLowerCase();
  const factory = PROVIDER_REGISTRY[providerKey];

  if (!factory) {
    const available = Object.keys(PROVIDER_REGISTRY).join(", ");
    throw new Error(
      `Unknown signature provider "${providerKey}". Available: ${available}`,
    );
  }

  resolvedProvider = factory();
  console.log(`[SignatureProvider] Initialized: ${resolvedProvider.name}`);
  return resolvedProvider;
}

/**
 * Override the active provider. Useful for tests.
 * Call with null to reset to the default.
 */
export function setSignatureProvider(provider: SignatureProvider | null): void {
  resolvedProvider = provider;
}
