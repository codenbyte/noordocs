import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

export const setAdminRole = onCall(
  { region: "europe-west1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in");
    }

    const callerToken = request.auth.token;
    if (callerToken.admin !== true) {
      throw new HttpsError("permission-denied", "Only admins can grant admin");
    }

    const { targetUid } = request.data;
    if (!targetUid || typeof targetUid !== "string") {
      throw new HttpsError("invalid-argument", "targetUid is required");
    }

    await admin.auth().setCustomUserClaims(targetUid, { admin: true });
    await admin.firestore().doc(`users/${targetUid}`).update({ role: "admin" });

    return { success: true };
  },
);

export const setSuperAdminRole = onCall(
  { region: "europe-west1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in");
    }

    // Only existing admins or superadmins can grant superadmin
    const callerToken = request.auth.token;
    if (callerToken.admin !== true && callerToken.superadmin !== true) {
      throw new HttpsError("permission-denied", "Only admins can grant superadmin");
    }

    const { targetUid } = request.data;
    if (!targetUid || typeof targetUid !== "string") {
      throw new HttpsError("invalid-argument", "targetUid is required");
    }

    await admin.auth().setCustomUserClaims(targetUid, { admin: true, superadmin: true });
    await admin.firestore().doc(`users/${targetUid}`).update({
      role: "superadmin",
      displayName: "Noor@NoorSpace",
    });

    return { success: true };
  },
);

export const removeAdminRole = onCall(
  { region: "europe-west1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in");
    }

    if (request.auth.token.admin !== true) {
      throw new HttpsError("permission-denied", "Only admins can remove admin");
    }

    const { targetUid } = request.data;
    if (!targetUid || typeof targetUid !== "string") {
      throw new HttpsError("invalid-argument", "targetUid is required");
    }

    if (targetUid === request.auth.uid) {
      throw new HttpsError("invalid-argument", "Cannot remove your own admin role");
    }

    await admin.auth().setCustomUserClaims(targetUid, { admin: false });
    await admin.firestore().doc(`users/${targetUid}`).update({ role: "user" });

    return { success: true };
  },
);
