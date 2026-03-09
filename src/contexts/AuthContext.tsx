import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  signOut,
  type User,
} from "firebase/auth";
import { doc, setDoc, getDoc, getDocs, collection, query, where, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { UserProfile } from "@/types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/user-not-found": "No account found with this email.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/invalid-credential": "Invalid email or password.",
  "auth/network-request-failed": "Network error. Please check your connection.",
  "auth/popup-closed-by-user": "Sign-in popup was closed. Please try again.",
  "auth/display-name-taken": "This display name is already taken. Please choose another.",
  "auth/reserved-name": "Usernames containing '@NoorSpace' are reserved for admins.",
};

export async function isDisplayNameTaken(name: string, excludeUid?: string): Promise<boolean> {
  const trimmed = name.trim();
  if (!trimmed) return false;
  const q = query(collection(db, "users"), where("displayName", "==", trimmed));
  const snap = await getDocs(q);
  if (snap.empty) return false;
  if (excludeUid) return snap.docs.some((d) => d.id !== excludeUid);
  return true;
}

export function getFriendlyAuthError(error: any): string {
  const code = error?.code;
  if (code && FIREBASE_ERROR_MESSAGES[code]) {
    return FIREBASE_ERROR_MESSAGES[code];
  }
  return error?.message || "An unexpected error occurred. Please try again.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        setProfile({ uid: snap.id, ...snap.data() } as UserProfile);
      }
    } catch {
      // Profile fetch failed silently
    }
  };

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdTokenResult();
          setIsAdmin(token.claims.admin === true || token.claims.superadmin === true);
          setIsSuperAdmin(token.claims.superadmin === true);
        } catch {
          // Token fetch failed
        }
        await fetchProfile(firebaseUser.uid);
      } else {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string, displayName: string) => {
    // Block @NoorSpace in usernames for regular users
    if (displayName.toLowerCase().includes("@noorspace")) {
      throw { code: "auth/reserved-name", message: "Usernames containing '@NoorSpace' are reserved for admins." };
    }
    // Create auth user first so we're authenticated for Firestore queries
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
    try {
      const taken = await isDisplayNameTaken(displayName, newUser.uid);
      if (taken) {
        await newUser.delete();
        throw { code: "auth/display-name-taken", message: "This display name is already taken. Please choose another." };
      }
      await updateProfile(newUser, { displayName });
      await setDoc(doc(db, "users", newUser.uid), {
        uid: newUser.uid,
        displayName,
        email,
        createdAt: serverTimestamp(),
      });
    } catch (err: any) {
      // If something fails after auth creation, clean up the auth user
      if (err?.code === "auth/display-name-taken") throw err;
      await newUser.delete().catch(() => {});
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const { user: gUser } = await signInWithPopup(auth, provider);
    const userDoc = await getDoc(doc(db, "users", gUser.uid));
    if (userDoc.exists()) {
      await setDoc(
        doc(db, "users", gUser.uid),
        { email: gUser.email },
        { merge: true },
      );
    } else {
      let name = gUser.displayName || "User";
      if (name.toLowerCase().includes("@noorspace")) {
        name = name.replace(/@noorspace/gi, "").trim() || "User";
      }
      let suffix = 1;
      while (await isDisplayNameTaken(name)) {
        suffix++;
        name = `${gUser.displayName || "User"} ${suffix}`;
      }
      await setDoc(doc(db, "users", gUser.uid), {
        uid: gUser.uid,
        displayName: name,
        email: gUser.email,
        photoURL: gUser.photoURL,
        createdAt: serverTimestamp(),
      });
      await updateProfile(gUser, { displayName: name });
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, isSuperAdmin, loading, login, signup, loginWithGoogle, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
