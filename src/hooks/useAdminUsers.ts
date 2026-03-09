/**
 * useAdminUsers — fetches users with admin or superadmin role
 * for use in reviewer/imam picker dropdowns.
 */

import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/types";

export interface AdminUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: "admin" | "superadmin";
}

export function useAdminUsers() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchAdmins() {
      try {
        // Fetch admins and superadmins in parallel
        const [adminSnap, superSnap] = await Promise.all([
          getDocs(query(collection(db, "users"), where("role", "==", "admin"))),
          getDocs(query(collection(db, "users"), where("role", "==", "superadmin"))),
        ]);

        if (cancelled) return;

        const users: AdminUser[] = [];
        const seen = new Set<string>();

        for (const snap of [adminSnap, superSnap]) {
          snap.docs.forEach((d) => {
            if (seen.has(d.id)) return;
            seen.add(d.id);
            const data = d.data() as UserProfile;
            users.push({
              uid: d.id,
              displayName: data.displayName || data.email || "Admin",
              email: data.email,
              photoURL: data.photoURL,
              role: (data.role as "admin" | "superadmin") || "admin",
            });
          });
        }

        // Sort alphabetically by name
        users.sort((a, b) => a.displayName.localeCompare(b.displayName));
        setAdmins(users);
      } catch (err) {
        console.error("Failed to fetch admin users:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAdmins();
    return () => { cancelled = true; };
  }, []);

  return { admins, loading };
}
