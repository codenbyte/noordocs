import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { NoorDocument, AuditEntry } from "@/types";

export function useMyDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<NoorDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "documents"),
      where("createdBy", "==", user.uid),
      orderBy("createdAt", "desc"),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setDocuments(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as NoorDocument)),
        );
        setLoading(false);
      },
      (err) => {
        console.error("useMyDocuments error:", err);
        setLoading(false);
      },
    );

    return unsub;
  }, [user]);

  return { documents, loading };
}

export function useDocument(documentId: string | undefined) {
  const [document, setDocument] = useState<NoorDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!documentId) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      doc(db, "documents", documentId),
      (snap) => {
        if (snap.exists()) {
          setDocument({ id: snap.id, ...snap.data() } as NoorDocument);
        } else {
          setDocument(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("useDocument error:", err);
        setLoading(false);
      },
    );

    return unsub;
  }, [documentId]);

  return { document, loading };
}

export function useAuditTrail(documentId: string | undefined) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!documentId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "documents", documentId, "audit"),
      orderBy("createdAt", "asc"),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setEntries(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditEntry)),
        );
        setLoading(false);
      },
      (err) => {
        console.error("useAuditTrail error:", err);
        setLoading(false);
      },
    );

    return unsub;
  }, [documentId]);

  return { entries, loading };
}

export function useDocumentsPendingReview() {
  const { isAdmin } = useAuth();
  const [documents, setDocuments] = useState<NoorDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "documents"),
      where("status", "==", "pending_review"),
      orderBy("createdAt", "desc"),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setDocuments(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as NoorDocument)),
        );
        setLoading(false);
      },
      (err) => {
        console.error("useDocumentsPendingReview error:", err);
        setLoading(false);
      },
    );

    return unsub;
  }, [isAdmin]);

  return { documents, loading };
}
