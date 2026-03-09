"use strict";
/**
 * NoorSpace Documents — Mock Signature Provider
 *
 * In-memory mock for local development and testing.
 * Simulates the full signing lifecycle without external API calls.
 *
 * Usage:
 *   Set SIGNATURE_PROVIDER=mock in your environment or .env file.
 *
 * Features:
 *   - Tracks requests and signatures in memory
 *   - Generates fake signing URLs
 *   - Supports embedded signing sessions
 *   - Simulates webhook parsing
 *   - Useful for unit tests and local dev
 *
 * Limitations:
 *   - State is lost on restart (in-memory only)
 *   - Not suitable for production or multi-instance deployments
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
exports.MockSignatureProvider = void 0;
const crypto = __importStar(require("crypto"));
// ── Provider ─────────────────────────────────────────
class MockSignatureProvider {
    name = "mock";
    /** In-memory request store — cleared on restart */
    requests = new Map();
    async createSignatureRequest(document, participants) {
        const requestId = `mock_${crypto.randomUUID().slice(0, 8)}`;
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const signingUrls = {};
        const mockParticipants = [];
        for (const p of participants) {
            const url = `http://localhost:5173/mock-sign/${requestId}/${p.id}`;
            signingUrls[p.id] = url;
            mockParticipants.push({
                participantId: p.id,
                name: p.name,
                email: p.email,
                status: "pending",
            });
        }
        this.requests.set(requestId, {
            requestId,
            documentId: document.id,
            participants: mockParticipants,
            status: "in_progress",
            createdAt: new Date().toISOString(),
            expiresAt,
        });
        console.log(`[MockProvider] Created request ${requestId} for document ${document.id} with ${participants.length} participants`);
        return { requestId, signingUrls, expiresAt };
    }
    async createEmbeddedSigningSession(requestId, participantId) {
        const req = this.requests.get(requestId);
        if (!req)
            throw new Error(`Mock request ${requestId} not found`);
        const sessionToken = `mock_session_${crypto.randomUUID().slice(0, 8)}`;
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min
        console.log(`[MockProvider] Created embedded session for ${participantId} on request ${requestId}`);
        return {
            signingUrl: `http://localhost:5173/mock-sign/${requestId}/${participantId}?embedded=true&token=${sessionToken}`,
            sessionToken,
            expiresAt,
        };
    }
    async getSigningUrl(requestId, participantId) {
        return `http://localhost:5173/mock-sign/${requestId}/${participantId}`;
    }
    async recordSignature(requestId, participantId, signatureData) {
        const req = this.requests.get(requestId);
        if (!req) {
            console.warn(`[MockProvider] Request ${requestId} not found for recordSignature`);
            return;
        }
        const participant = req.participants.find((p) => p.participantId === participantId);
        if (participant) {
            participant.status = "signed";
            participant.signedAt = new Date().toISOString();
            participant.signatureData = signatureData;
        }
        // Check if all signed
        const allSigned = req.participants.every((p) => p.status === "signed");
        if (allSigned) {
            req.status = "completed";
        }
        console.log(`[MockProvider] Recorded signature for ${participantId} on request ${requestId}. All signed: ${allSigned}`);
    }
    async handleWebhook(_headers, body) {
        // Mock webhook format:
        // { type: "SIGNED", requestId: "mock_xxx", participantId: "abc123" }
        const payload = body;
        if (!payload?.type || !payload?.requestId)
            return null;
        const event = {
            type: payload.type,
            providerRequestId: payload.requestId,
            participantId: payload.participantId,
            participantEmail: payload.participantEmail,
            signatureData: payload.signatureData,
            timestamp: new Date().toISOString(),
            rawPayload: body,
        };
        console.log(`[MockProvider] Parsed webhook event: ${event.type} for request ${event.providerRequestId}`);
        return event;
    }
    async getSignatureStatus(providerRequestId) {
        const req = this.requests.get(providerRequestId);
        if (!req) {
            return { status: "pending", participants: [] };
        }
        return {
            status: req.status,
            participants: req.participants.map((p) => ({
                participantId: p.participantId,
                status: p.status,
                signedAt: p.signedAt,
            })),
        };
    }
    async finalizeCompletedDocument(requestId, _document) {
        console.log(`[MockProvider] Finalized document for request ${requestId}`);
        return {
            success: true,
            documentUrl: `http://localhost:5173/mock-documents/${requestId}/signed.pdf`,
        };
    }
    async cancelRequest(requestId) {
        const req = this.requests.get(requestId);
        if (req) {
            req.status = "cancelled";
            console.log(`[MockProvider] Cancelled request ${requestId}`);
        }
    }
    // ── Test helpers (not part of the interface) ─────────
    /** Simulate a participant signing — useful in tests */
    simulateSign(requestId, participantId) {
        const req = this.requests.get(requestId);
        if (!req)
            return null;
        const p = req.participants.find((pp) => pp.participantId === participantId);
        if (!p || p.status === "signed")
            return null;
        p.status = "signed";
        p.signedAt = new Date().toISOString();
        p.signatureData = "data:image/png;base64,iVBORw0KGgoAAAANS...mock...";
        const allSigned = req.participants.every((pp) => pp.status === "signed");
        if (allSigned)
            req.status = "completed";
        return {
            type: allSigned ? "COMPLETED" : "SIGNED",
            providerRequestId: requestId,
            participantId,
            signatureData: p.signatureData,
            timestamp: p.signedAt,
        };
    }
    /** Get all tracked requests — useful for assertions */
    getRequests() {
        return this.requests;
    }
    /** Clear all state — call between tests */
    reset() {
        this.requests.clear();
    }
}
exports.MockSignatureProvider = MockSignatureProvider;
//# sourceMappingURL=mock-provider.js.map