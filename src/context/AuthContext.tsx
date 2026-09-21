import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserAccessProfile, AccessRequestItem, UserRole } from '../types';

interface AuthContextType {
  currentUser: UserAccessProfile | null;
  isLoading: boolean;
  isOwner: boolean;
  isApproved: boolean;
  pendingRequestsCount: number;
  login: (email: string, name?: string) => Promise<UserAccessProfile>;
  logout: () => void;
  submitAccessRequest: (params: {
    name: string;
    department: string;
    requestReason: string;
    role?: UserRole;
  }) => Promise<boolean>;
  checkStatus: () => Promise<UserAccessProfile | null>;
  // Owner actions
  pendingRequests: AccessRequestItem[];
  approvedUsers: UserAccessProfile[];
  refreshManageData: () => Promise<void>;
  approveUser: (email: string, role?: UserRole) => Promise<boolean>;
  rejectUser: (email: string) => Promise<boolean>;
  revokeUser: (email: string) => Promise<boolean>;
  inviteUser: (params: { email: string; name: string; role: UserRole; department: string }) => Promise<boolean>;
}

const OWNER_EMAIL = 'maikelindo8@gmail.com';
const STORAGE_KEY = 'upperwest_auth_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccessProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);
  const [pendingRequests, setPendingRequests] = useState<AccessRequestItem[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<UserAccessProfile[]>([]);

  // Check status with server
  const fetchUserStatus = useCallback(async (email: string): Promise<UserAccessProfile | null> => {
    try {
      const res = await fetch(`/api/auth/status?email=${encodeURIComponent(email)}`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        return data;
      }
    } catch (err) {
      console.warn('Network error fetching status, using fallback:', err);
    }

    // Fallback if offline
    if (email.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
      return {
        email: OWNER_EMAIL,
        name: 'Maikel (Owner)',
        role: 'OWNER',
        status: 'APPROVED',
        isOwner: true,
        department: 'Executive Management',
        approvedAt: '2026-01-01T00:00:00.000Z'
      };
    }
    return null;
  }, []);

  // Fetch management data for Owner
  const refreshManageData = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/manage');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && Array.isArray(data.approvedUsers)) {
          setApprovedUsers(data.approvedUsers);
        }
        if (data && Array.isArray(data.accessRequests)) {
          const pending = data.accessRequests.filter((r: AccessRequestItem) => r.status === 'PENDING');
          setPendingRequests(pending);
          setPendingRequestsCount(pending.length);
        }
      }
    } catch {
      // Quiet fallback when offline or during transient server restart
    }
  }, []);

  // Initial load from localStorage
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.email) {
            const fresh = await fetchUserStatus(parsed.email);
            if (fresh && fresh.status !== 'NONE') {
              setCurrentUser(fresh);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
            } else {
              setCurrentUser(parsed);
            }
          }
        } else {
          // If no stored user, default to prompt login
          // (User will see the elegant Gate screen)
          setCurrentUser(null);
        }
      } catch (err) {
        console.warn('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [fetchUserStatus]);

  // Periodic refresh when user is owner or waiting for approval
  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.isOwner) {
      refreshManageData();
      const interval = setInterval(refreshManageData, 15000);
      return () => clearInterval(interval);
    }

    if (currentUser.status === 'PENDING') {
      const interval = setInterval(async () => {
        const fresh = await fetchUserStatus(currentUser.email);
        if (fresh && fresh.status !== currentUser.status) {
          setCurrentUser(fresh);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
        }
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [currentUser, refreshManageData, fetchUserStatus]);

  const login = async (email: string, name?: string): Promise<UserAccessProfile> => {
    setIsLoading(true);
    try {
      const fresh = await fetchUserStatus(email);
      let profile: UserAccessProfile;

      if (fresh && fresh.status !== 'NONE') {
        profile = fresh;
      } else {
        const isOwner = email.toLowerCase() === OWNER_EMAIL.toLowerCase();
        profile = {
          email,
          name: name || (isOwner ? 'Maikel (Owner)' : email.split('@')[0]),
          role: isOwner ? 'OWNER' : 'SALES',
          status: isOwner ? 'APPROVED' : 'NONE',
          isOwner,
          avatar: isOwner 
            ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
        };
      }

      setCurrentUser(profile);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));

      if (profile.isOwner) {
        await refreshManageData();
      }

      return profile;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const submitAccessRequest = async (params: {
    name: string;
    department: string;
    requestReason: string;
    role?: UserRole;
  }): Promise<boolean> => {
    if (!currentUser) return false;

    try {
      const res = await fetch('/api/auth/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          name: params.name || currentUser.name,
          department: params.department,
          requestReason: params.requestReason,
          role: params.role || 'SALES'
        })
      });

      if (res.ok) {
        const data = await res.json();
        const updated: UserAccessProfile = {
          ...currentUser,
          name: params.name || currentUser.name,
          department: params.department,
          requestReason: params.requestReason,
          status: data.status || 'PENDING',
          role: params.role || 'SALES',
          requestedAt: new Date().toISOString()
        };
        setCurrentUser(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error requesting access:', err);
      // Fallback local update
      const updated: UserAccessProfile = {
        ...currentUser,
        name: params.name,
        department: params.department,
        requestReason: params.requestReason,
        status: 'PENDING',
        requestedAt: new Date().toISOString()
      };
      setCurrentUser(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return true;
    }
  };

  const checkStatus = async (): Promise<UserAccessProfile | null> => {
    if (!currentUser) return null;
    const fresh = await fetchUserStatus(currentUser.email);
    if (fresh) {
      setCurrentUser(fresh);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    }
    return fresh;
  };

  const approveUser = async (email: string, role?: UserRole): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: role || 'SALES' })
      });
      if (res.ok) {
        await refreshManageData();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error approving user:', err);
      return false;
    }
  };

  const rejectUser = async (email: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        await refreshManageData();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error rejecting user:', err);
      return false;
    }
  };

  const revokeUser = async (email: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        await refreshManageData();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error revoking user:', err);
      return false;
    }
  };

  const inviteUser = async (params: {
    email: string;
    name: string;
    role: UserRole;
    department: string;
  }): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) {
        await refreshManageData();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error inviting user:', err);
      return false;
    }
  };

  const isOwner = Boolean(
    currentUser && (currentUser.isOwner || currentUser.email.toLowerCase() === OWNER_EMAIL.toLowerCase())
  );
  const isApproved = Boolean(currentUser && (isOwner || currentUser.status === 'APPROVED'));

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        isOwner,
        isApproved,
        pendingRequestsCount,
        login,
        logout,
        submitAccessRequest,
        checkStatus,
        pendingRequests,
        approvedUsers,
        refreshManageData,
        approveUser,
        rejectUser,
        revokeUser,
        inviteUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
