export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  location?: string;
  bio?: string;
  joinedCommunityIds?: string[];
  role?: 'user' | 'admin' | 'superadmin';
  verified?: boolean;
  createdAt: any;
}
