// ============================================================
// BhoomiSetu - Authentication & RBAC Session Provider
// Secure Credential Verification & Session Lifecycle Management
// ============================================================
import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, UserRole, Permission } from '../types';
import { ROLE_PERMISSIONS } from '../types';
import { dataStore } from '../store/dataStore';
import { DEMO_ACCOUNTS, type DemoAccount } from '../data/demoAccounts';

export interface SessionData {
  user: User;
  token: string;
  loginTime: string;
  expiresAt: number;
}

interface AuthResult {
  success: boolean;
  message?: string;
  user?: User;
}

interface AuthContextType {
  user: User | null;
  session: SessionData | null;
  isAuthenticated: boolean;
  permissions: Permission | null;
  login: (identifier: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  sessionRemainingMs: number | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_STORAGE_KEY = 'bhoomisetu_session_v1';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8-hour session placeholder

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [sessionRemainingMs, setSessionRemainingMs] = useState<number | null>(null);

  // Initialize session from storage on load
  useEffect(() => {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SessionData;
        const now = Date.now();
        if (parsed.expiresAt && parsed.expiresAt > now) {
          setSession(parsed);
          setSessionRemainingMs(parsed.expiresAt - now);
        } else {
          // Session expired
          localStorage.removeItem(SESSION_STORAGE_KEY);
          setSession(null);
          setSessionRemainingMs(null);
        }
      } catch {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
  }, []);

  // Periodic session heartbeat & expiry timer
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      const remaining = session.expiresAt - Date.now();
      if (remaining <= 0) {
        logout();
      } else {
        setSessionRemainingMs(remaining);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [session]);

  const login = useCallback(async (identifier: string, password: string): Promise<AuthResult> => {
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanId || !cleanPass) {
      return {
        success: false,
        message: 'Please enter both username/email and password.',
      };
    }

    // Verify credentials against authoritative demo accounts
    const account = DEMO_ACCOUNTS.find(
      acc => (acc.username.toLowerCase() === cleanId || acc.email.toLowerCase() === cleanId) &&
             acc.password === cleanPass
    );

    if (!account) {
      return {
        success: false,
        message: 'Invalid credentials. Please verify demonstration username and password.',
      };
    }

    // Construct authenticated User
    const authenticatedUser: User = {
      id: `USR-${account.username.toUpperCase()}`,
      name: account.name,
      email: account.email,
      role: account.role,
      department: account.department,
      state: account.state,
      district: account.district,
      lastLogin: new Date().toISOString(),
      isActive: true,
    };

    const now = Date.now();
    const newSession: SessionData = {
      user: authenticatedUser,
      token: `BHOOMI-JWT-${account.username}-${Date.now().toString(36)}`,
      loginTime: new Date().toISOString(),
      expiresAt: now + SESSION_DURATION_MS,
    };

    setSession(newSession);
    setSessionRemainingMs(SESSION_DURATION_MS);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));

    // Audit Event
    dataStore.addAuditEvent({
      timestamp: new Date().toISOString(),
      userId: authenticatedUser.id,
      userName: authenticatedUser.name,
      userRole: authenticatedUser.role,
      action: 'User Login',
      entityType: 'Security',
      entityId: authenticatedUser.id,
      entityName: authenticatedUser.name,
      details: `${authenticatedUser.name} authenticated successfully as ${authenticatedUser.role} (${authenticatedUser.department})`,
    });

    return { success: true, user: authenticatedUser };
  }, []);

  const logout = useCallback(() => {
    if (session?.user) {
      dataStore.addAuditEvent({
        timestamp: new Date().toISOString(),
        userId: session.user.id,
        userName: session.user.name,
        userRole: session.user.role,
        action: 'User Logout',
        entityType: 'Security',
        entityId: session.user.id,
        entityName: session.user.name,
        details: `${session.user.name} logged out and terminated active session.`,
      });
    }
    setSession(null);
    setSessionRemainingMs(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }, [session]);

  const user = session?.user || null;
  const permissions = user ? ROLE_PERMISSIONS[user.role] : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!session?.user,
        permissions,
        login,
        logout,
        sessionRemainingMs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
