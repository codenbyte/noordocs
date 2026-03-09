import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  getDocs,
  type Unsubscribe,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type NotificationType =
  | "like"
  | "comment"
  | "mention"
  | "community_approved"
  | "community_rejected"
  | "document_review_request"
  | "document_approved"
  | "document_rejected"
  | "document_changes_requested";

export interface AppNotification {
  id: string;
  recipientUid: string;
  senderUid: string;
  senderName: string;
  senderPhotoURL?: string;
  type: NotificationType;
  postId?: string;
  postContent?: string;
  commentText?: string;
  communityName?: string;
  rejectionReason?: string;
  groupName?: string;
  // Document-specific fields
  documentId?: string;
  documentTitle?: string;
  documentType?: string;
  reviewNote?: string;
  read: boolean;
  createdAt: Timestamp | null;
}

export async function createNotification(data: {
  recipientUid: string;
  senderUid: string;
  senderName: string;
  senderPhotoURL?: string;
  type: NotificationType;
  postId?: string;
  postContent?: string;
  commentText?: string;
  communityName?: string;
  rejectionReason?: string;
  groupName?: string;
  documentId?: string;
  documentTitle?: string;
  documentType?: string;
  reviewNote?: string;
}): Promise<void> {
  // Don't notify yourself
  if (data.senderUid === data.recipientUid) return;

  await addDoc(collection(db, "notifications"), {
    recipientUid: data.recipientUid,
    senderUid: data.senderUid,
    senderName: data.senderName,
    ...(data.senderPhotoURL && { senderPhotoURL: data.senderPhotoURL }),
    type: data.type,
    ...(data.postId && { postId: data.postId }),
    ...(data.postContent && { postContent: data.postContent.slice(0, 80) }),
    ...(data.commentText && { commentText: data.commentText.slice(0, 100) }),
    ...(data.communityName && { communityName: data.communityName }),
    ...(data.rejectionReason && { rejectionReason: data.rejectionReason.slice(0, 200) }),
    ...(data.groupName && { groupName: data.groupName }),
    ...(data.documentId && { documentId: data.documentId }),
    ...(data.documentTitle && { documentTitle: data.documentTitle }),
    ...(data.documentType && { documentType: data.documentType }),
    ...(data.reviewNote && { reviewNote: data.reviewNote.slice(0, 200) }),
    read: false,
    createdAt: serverTimestamp(),
  });
}

// ---- Document notification helpers ----

export async function notifyDocumentReviewRequest(
  reviewerUid: string,
  senderUid: string,
  senderName: string,
  documentId: string,
  documentTitle: string,
  documentType: string,
): Promise<void> {
  await createNotification({
    recipientUid: reviewerUid,
    senderUid,
    senderName,
    type: "document_review_request",
    documentId,
    documentTitle,
    documentType,
  });
}

export async function notifyDocumentReviewComplete(
  creatorUid: string,
  reviewerUid: string,
  reviewerName: string,
  documentId: string,
  documentTitle: string,
  documentType: string,
  decision: "approved" | "rejected" | "changes_requested",
  note?: string,
): Promise<void> {
  const typeMap: Record<string, NotificationType> = {
    approved: "document_approved",
    rejected: "document_rejected",
    changes_requested: "document_changes_requested",
  };

  await createNotification({
    recipientUid: creatorUid,
    senderUid: reviewerUid,
    senderName: reviewerName,
    type: typeMap[decision],
    documentId,
    documentTitle,
    documentType,
    reviewNote: note,
  });
}

export function subscribeToNotifications(
  uid: string,
  callback: (notifications: AppNotification[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, "notifications"),
    where("recipientUid", "==", uid),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(
    q,
    (snap) => {
      const notifications = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          recipientUid: data.recipientUid,
          senderUid: data.senderUid,
          senderName: data.senderName,
          senderPhotoURL: data.senderPhotoURL,
          type: data.type,
          postId: data.postId,
          postContent: data.postContent,
          commentText: data.commentText,
          communityName: data.communityName,
          rejectionReason: data.rejectionReason,
          documentId: data.documentId,
          documentTitle: data.documentTitle,
          documentType: data.documentType,
          reviewNote: data.reviewNote,
          read: data.read,
          createdAt: data.createdAt,
        } as AppNotification;
      });
      callback(notifications);
    },
    (error) => {
      console.error("Notifications listener error:", error);
      callback([]);
    },
  );
}

export async function markAsRead(notificationId: string): Promise<void> {
  await updateDoc(doc(db, "notifications", notificationId), { read: true });
}

export async function markAllAsRead(uid: string): Promise<void> {
  const q = query(
    collection(db, "notifications"),
    where("recipientUid", "==", uid),
    where("read", "==", false),
  );
  const snap = await getDocs(q);
  if (snap.empty) return;

  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    batch.update(d.ref, { read: true });
  });
  await batch.commit();
}

export function notificationTimeAgo(ts: Timestamp | null): string {
  if (!ts) return "just now";
  const seconds = Math.floor((Date.now() - ts.toMillis()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
