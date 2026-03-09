"use strict";
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
exports.removeAdminRole = exports.setSuperAdminRole = exports.setAdminRole = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
exports.setAdminRole = (0, https_1.onCall)({ region: "europe-west1" }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be signed in");
    }
    const callerToken = request.auth.token;
    if (callerToken.admin !== true) {
        throw new https_1.HttpsError("permission-denied", "Only admins can grant admin");
    }
    const { targetUid } = request.data;
    if (!targetUid || typeof targetUid !== "string") {
        throw new https_1.HttpsError("invalid-argument", "targetUid is required");
    }
    await admin.auth().setCustomUserClaims(targetUid, { admin: true });
    await admin.firestore().doc(`users/${targetUid}`).update({ role: "admin" });
    return { success: true };
});
exports.setSuperAdminRole = (0, https_1.onCall)({ region: "europe-west1" }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be signed in");
    }
    // Only existing admins or superadmins can grant superadmin
    const callerToken = request.auth.token;
    if (callerToken.admin !== true && callerToken.superadmin !== true) {
        throw new https_1.HttpsError("permission-denied", "Only admins can grant superadmin");
    }
    const { targetUid } = request.data;
    if (!targetUid || typeof targetUid !== "string") {
        throw new https_1.HttpsError("invalid-argument", "targetUid is required");
    }
    await admin.auth().setCustomUserClaims(targetUid, { admin: true, superadmin: true });
    await admin.firestore().doc(`users/${targetUid}`).update({
        role: "superadmin",
        displayName: "Noor@NoorSpace",
    });
    return { success: true };
});
exports.removeAdminRole = (0, https_1.onCall)({ region: "europe-west1" }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Must be signed in");
    }
    if (request.auth.token.admin !== true) {
        throw new https_1.HttpsError("permission-denied", "Only admins can remove admin");
    }
    const { targetUid } = request.data;
    if (!targetUid || typeof targetUid !== "string") {
        throw new https_1.HttpsError("invalid-argument", "targetUid is required");
    }
    if (targetUid === request.auth.uid) {
        throw new https_1.HttpsError("invalid-argument", "Cannot remove your own admin role");
    }
    await admin.auth().setCustomUserClaims(targetUid, { admin: false });
    await admin.firestore().doc(`users/${targetUid}`).update({ role: "user" });
    return { success: true };
});
//# sourceMappingURL=admin.js.map