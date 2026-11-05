import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signOut as fbSignOut,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { userService } from '../services/userService';
import { UserProfile, UserRole } from '../types';

export const AUTHORIZED_SUPER_ADMIN_UID = 'yFxa1vrBF5PdjdTfm9DuHgmDiNW2';
export const AUTHORIZED_SUPER_ADMIN_EMAIL = 'rajeebkerketta1986@gmail.com';

export const isSuperAdminUser = (
  fbUser: User | null,
  profile?: UserProfile | null
): boolean => {
  if (!fbUser) return false;
  if (fbUser.uid === AUTHORIZED_SUPER_ADMIN_UID) return true;
  if (fbUser.email && fbUser.email.toLowerCase() === AUTHORIZED_SUPER_ADMIN_EMAIL.toLowerCase()) return true;
  if (profile && profile.role === 'super_admin') return true;
  return false;
};

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  authLoading: boolean;
  role: UserRole;
  isSuperAdmin: boolean;
  unauthorizedNotice: string | null;
  setUnauthorizedNotice: (msg: string | null) => void;
  loginAsAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logoutAdmin: () => Promise<void>;
  sendAdminPasswordReset: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  setUserProfile: (profile: UserProfile | null) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [unauthorizedNotice, setUnauthorizedNotice] = useState<string | null>(null);

  useEffect(() => {
    // Firebase onAuthStateChanged listener is the sole source of truth
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        let profile = await userService.getUserProfile(fbUser.uid);
        const isAdmin = isSuperAdminUser(fbUser, profile);

        if (isAdmin) {
          // Strictly authorized Super Admin
          setUser(fbUser);
          if (!profile) {
            profile = {
              uid: fbUser.uid,
              email: fbUser.email || AUTHORIZED_SUPER_ADMIN_EMAIL,
              displayName: fbUser.displayName || 'Super Administrator',
              role: 'super_admin',
              status: 'active',
            };
            try {
              await userService.createUserProfile(profile);
            } catch (err) {
              console.warn('Could not sync Super Admin profile:', err);
            }
          }
          setUserProfile(profile);
          setUnauthorizedNotice(null);
        } else {
          // Check if current URL path is a protected admin path
          const pathname = window.location.pathname;
          if (pathname.startsWith('/admin')) {
            // Non-authorized user attempting admin access: deny and sign out
            await fbSignOut(auth);
            setUser(null);
            setUserProfile(null);
            setUnauthorizedNotice('You are not authorized to access the Super Admin Panel.');
          } else {
            // Consumer/partner user on public storefront or login page
            setUser(fbUser);
            setUserProfile(profile);
            setUnauthorizedNotice(null);
          }
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Super Admin Login
   * Strictly authenticates with Firebase Email/Password
   * and verifies the authenticated user's credentials against Super Admin policy.
   */
  const loginAsAdmin = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setUnauthorizedNotice(null);
    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, error: 'Email and password are required.' };
    }

    try {
      // 1. Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
      const fbUser = userCredential.user;

      if (!fbUser) {
        return { success: false, error: 'Authentication could not be completed.' };
      }

      // 2. Strict Super Admin Check (UID, Email, or super_admin role)
      let profile = await userService.getUserProfile(fbUser.uid);
      const isAdmin = isSuperAdminUser(fbUser, profile);

      if (!isAdmin) {
        // Immediate sign out and denial
        await fbSignOut(auth);
        setUser(null);
        setUserProfile(null);
        const errMsg = 'You are not authorized to access the Super Admin Panel.';
        setUnauthorizedNotice(errMsg);
        return { success: false, error: errMsg };
      }

      // 3. Authorized Super Admin
      setUser(fbUser);
      if (!profile) {
        profile = {
          uid: fbUser.uid,
          email: fbUser.email || cleanEmail,
          displayName: fbUser.displayName || 'Super Administrator',
          role: 'super_admin',
          status: 'active',
        };
        try {
          await userService.createUserProfile(profile);
        } catch (e) {
          console.warn('Could not sync admin profile:', e);
        }
      }
      setUserProfile(profile);
      setUnauthorizedNotice(null);
      return { success: true };
    } catch (error: any) {
      console.error('Super Admin sign-in error:', error);
      let msg = 'Authentication failed. Please check your credentials.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        msg = 'Invalid email address or password.';
      } else if (error.code === 'auth/user-not-found') {
        msg = 'No administrator account found with this email.';
      } else if (error.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        msg = 'Access temporarily disabled due to multiple failed attempts. Please reset password or try again later.';
      } else if (error.message) {
        msg = error.message;
      }
      return { success: false, error: msg };
    }
  };

  /**
   * Super Admin Password Reset
   * Directly triggers official Firebase Password Reset Email.
   */
  const sendAdminPasswordReset = async (
    email: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your registered Super Admin email address.' };
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return {
        success: true,
        message: `Password reset email sent successfully! Please check your inbox (and spam folder) at ${cleanEmail}.`,
      };
    } catch (error: any) {
      console.error('Password reset email error:', error);
      let msg = 'Failed to send password reset email. Please try again.';
      if (error.code === 'auth/user-not-found') {
        msg = 'No user account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        msg = 'Please provide a valid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        msg = 'Too many requests. Please wait a few moments before trying again.';
      } else if (error.message) {
        msg = error.message;
      }
      return { success: false, error: msg };
    }
  };

  /**
   * Logout Super Admin
   * Calls Firebase signOut(), clears memory state, redirects to /login,
   * and prevents browser back button navigation.
   */
  const logoutAdmin = async () => {
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
    setUser(null);
    setUserProfile(null);
    setUnauthorizedNotice(null);
    window.history.replaceState(null, '', '/login');
    // Dispatch popstate so routing listeners update immediately
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
    setUser(null);
    setUserProfile(null);
    setUnauthorizedNotice(null);
  };

  // Derive super admin authorization
  const isSuperAdmin = isSuperAdminUser(user, userProfile);
  const role: UserRole = isSuperAdmin ? 'super_admin' : (userProfile?.role || 'customer');

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        authLoading,
        role,
        isSuperAdmin,
        unauthorizedNotice,
        setUnauthorizedNotice,
        loginAsAdmin,
        logoutAdmin,
        sendAdminPasswordReset,
        setUserProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
