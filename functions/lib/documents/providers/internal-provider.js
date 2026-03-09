"use strict";
/**
 * NoorSpace Documents — Internal Signature Provider
 *
 * Phase 1 signing provider. Uses canvas-drawn signatures stored
 * as base64 PNGs directly in Firestore. No external API calls.
 *
 * Signing URLs point to the NoorSpace app:
 *   /documents/{docId}?sign={participantId}
 *
 * This provider:
 *   - Has no webhooks (signing happens in-app)
 *   - Has no embedded sessions (signing is native)
 *   - Does not generate PDFs (Firestore data is canonical)
 *   - Can be swapped to an external provider without changing business logic
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalSignatureProvider = void 0;
const crypto = __importStar(require("crypto"));
const APP_URL = process.env.APP_URL || "https://noorspace-33e29.web.app";
class InternalSignatureProvider {
    name = "internal";
    async createSignatureRequest(document, participants) {
        const requestId = `int_${crypto.randomUUID()}`;
        const signingUrls = {};
        for (const p of participants) {
            signingUrls[p.id] = `${APP_URL}/documents/${document.id}?sign=${p.id}`;
        }
        return {
            requestId,
            signingUrls,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        };
    }
    async createEmbeddedSigningSession(_requestId, _participantId) {
        // Internal provider uses native in-app signing, not embedded iframes.
        throw new Error("Embedded signing sessions are not supported by the internal provider");
    }
    async getSigningUrl(_requestId, participantId) {
        return `${APP_URL}/documents/?sign=${participantId}`;
    }
    async recordSignature(_requestId, _participantId, _signatureData) {
        // Signature data is stored directly in the participant record
        // by the service layer. No external API call needed.
    }
    async handleWebhook(_headers, _body) {
        // Internal provider has no external webhooks.
        return null;
    }
    async getSignatureStatus(_providerRequestId) {
        // Internal provider has no external state to query.
        // The service layer reads actual status from Firestore participants.
        return { status: "in_progress", participants: [] };
    }
    async finalizeCompletedDocument(_requestId, _document) {
        // Phase 1: no PDF generation. Firestore data is the canonical record.
        // Future: generate a signed PDF and upload to Firebase Storage.
        return { success: true };
    }
    async cancelRequest(_requestId) {
        // Internal provider has no external state to cancel.
    }
}
exports.InternalSignatureProvider = InternalSignatureProvider;
//# sourceMappingURL=internal-provider.js.map