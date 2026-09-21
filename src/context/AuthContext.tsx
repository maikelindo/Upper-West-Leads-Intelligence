import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserAccessProfile, AccessRequestItem, UserRole, AccessHistoryItem } from '../types';

interface AuthContextType {
  currentUser: UserAccessProfile | null;
  isLoading: boolean;
  isOwner: boolean;
  isApproved: boolean;
  pendingRequestsCount: number;
  login: (email: string, name?: string) => Promise<UserAccessProfile>;
  visitorLogin: (params: { email: string; name: string; password: string }) => Promise<{ success: boolean; status?: 'APPROVED' | 'PENDING'; error?: string }>;
  ownerLogin: (password: string, email?: string) => Promise<{ success: boolean; error?: string }>;
  requestOwnerCode: (email?: string) => Promise<{ success: boolean; message: string; simulatedCode?: string }>;
  logout: () => void;
  submitAccessRequest: (params: {
    email: string;
    name: string;
    department?: string;
    requestReason?: string;
    role?: UserRole;
  }) => Promise<boolean>;
  checkStatus: () => Promise<UserAccessProfile | null>;
  // Owner actions
  pendingRequests: AccessRequestItem[];
  approvedUsers: UserAccessProfile[];
  accessHistory: AccessHistoryItem[];
  refreshManageData: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  clearAccessHistory: () => Promise<boolean>;
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
  const [accessHistory, setAccessHistory] = useState<AccessHistoryItem[]>([]);

  // Check status with server
  const fetchUserStatus = useCallback(async (email: string, token?: string): Promise<UserAccessProfile | null> => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/auth/status?email=${encodeURIComponent(email)}${token ? `&token=${encodeURIComponent(token)}` : ''}`, {
        headers
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        return data;
      }
    } catch (err) {
      console.warn('Network error fetching status:', err);
    }
    return null;
  }, []);

  // Fetch management data for Owner (including real-time access history)
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
        if (data && Array.isArray(data.accessHistory)) {
          setAccessHistory(data.accessHistory);
        }
      }
    } catch {
      // Quiet fallback when offline or during transient server restart
    }
  }, []);

  // Fetch history specifically
  const refreshHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/history');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.accessHistory)) {
          setAccessHistory(data.accessHistory);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Clear history
  const clearAccessHistory = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/history/clear', { method: 'POST' });
      if (res.ok) {
        setAccessHistory([]);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };


  // Initial load from localStorage
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.email) {
            const fresh = await fetchUserStatus(parsed.email, parsed.token);
            if (fresh && fresh.status === 'APPROVED') {
              const updatedProfile = { ...fresh, token: parsed.token };
              setCurrentUser(updatedProfile);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
            } else if (fresh && fresh.status === 'PENDING') {
              setCurrentUser(fresh);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
            } else {
              // If owner session without valid token or status NONE/REJECTED
              if (parsed.email.toLowerCase() === OWNER_EMAIL.toLowerCase() && (!parsed.token || fresh?.status === 'REQUIRES_PASSWORD')) {
                setCurrentUser(null);
                localStorage.removeItem(STORAGE_KEY);
              } else {
                setCurrentUser(fresh || parsed);
              }
            }
          }
        } else {
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

    if (currentUser.isOwner && currentUser.status === 'APPROVED') {
      refreshManageData();
      const interval = setInterval(refreshManageData, 15000);
      return () => clearInterval(interval);
    }

    if (currentUser.status === 'PENDING') {
      const interval = setInterval(async () => {
        const fresh = await fetchUserStatus(currentUser.email, currentUser.token);
        if (fresh && fresh.status !== currentUser.status) {
          setCurrentUser(fresh);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
        }
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [currentUser, refreshManageData, fetchUserStatus]);

  // Visitor / Tim Login (Email, Nama, Password: 0123456)
  const visitorLogin = async (params: {
    email: string;
    name: string;
    password: string;
  }): Promise<{ success: boolean; status?: 'APPROVED' | 'PENDING'; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/visitor-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: params.email.trim(),
          name: params.name.trim(),
          password: params.password.trim()
        })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.profile) {
        const profileWithToken = {
          ...data.profile,
          token: data.token
        };
        setCurrentUser(profileWithToken);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profileWithToken));
        return { success: true, status: (data.profile.status || data.status) as 'APPROVED' | 'PENDING' };
      }

      return {
        success: false,
        error: data.error || 'Password akses salah. Silakan periksa kembali password yang Anda masukkan.'
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Terjadi kesalahan jaringan' };
    } finally {
      setIsLoading(false);
    }
  };

  // Visitor / Staff regular login check
  const login = async (email: string, name?: string): Promise<UserAccessProfile> => {
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const fresh = await fetchUserStatus(cleanEmail);

      let profile: UserAccessProfile;
      if (fresh && fresh.status !== 'NONE') {
        profile = fresh;
      } else {
        profile = {
          email: cleanEmail,
          name: name || cleanEmail.split('@')[0],
          role: 'SALES',
          status: cleanEmail === OWNER_EMAIL.toLowerCase() ? 'REQUIRES_PASSWORD' : 'NONE',
          isOwner: cleanEmail === OWNER_EMAIL.toLowerCase(),
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
        };
      }

      setCurrentUser(profile);
      if (profile.status === 'APPROVED') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      }

      return profile;
    } finally {
      setIsLoading(false);
    }
  };

  // Secure Owner Login with Password or OTP
  const ownerLogin = async (password: string, email?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const targetEmail = (email || OWNER_EMAIL).trim().toLowerCase();
      const res = await fetch('/api/auth/owner-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          password: password.trim()
        })
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success && data.profile) {
          const profileWithToken = {
            ...data.profile,
            token: data.token
          };
          setCurrentUser(profileWithToken);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(profileWithToken));
          await refreshManageData();
          return { success: true };
        }
      }

      const errData = await res.json().catch(() => ({ error: 'Password salah' }));
      return { success: false, error: errData.error || 'Password Owner salah' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Terjadi kesalahan jaringan' };
    } finally {
      setIsLoading(false);
    }
  };

  // Request Code / Password to Owner's Gmail
  const requestOwnerCode = async (email?: string): Promise<{ success: boolean; message: string; simulatedCode?: string }> => {
    try {
      const targetEmail = (email || OWNER_EMAIL).trim().toLowerCase();
      const res = await fetch('/api/auth/request-owner-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal mengirim kode ke Gmail' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Visitor Submits Access Request (Name + Email)
  const submitAccessRequest = async (params: {
    email: string;
    name: string;
    department?: string;
    requestReason?: string;
    role?: UserRole;
  }): Promise<boolean> => {
    setIsLoading(true);
    try {
      const cleanEmail = params.email.trim().toLowerCase();
      const cleanName = params.name.trim();

      const res = await fetch('/api/auth/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          name: cleanName,
          department: params.department || 'Sales & Marketing',
          requestReason: params.requestReason || 'Permintaan izin akses dashboard Upper West CRM',
          role: params.role || 'SALES'
        })
      });

      if (res.ok) {
        const data = await res.json();
        const updated: UserAccessProfile = {
          email: cleanEmail,
          name: cleanName,
          department: params.department || 'Sales & Marketing',
          requestReason: params.requestReason || 'Permintaan izin akses dashboard Upper West CRM',
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
      // Local fallback
      const updated: UserAccessProfile = {
        email: params.email,
        name: params.name,
        department: params.department || 'Sales & Marketing',
        status: 'PENDING',
        role: 'SALES',
        requestedAt: new Date().toISOString()
      };
      setCurrentUser(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const checkStatus = async (): Promise<UserAccessProfile | null> => {
    if (!currentUser) return null;
    const fresh = await fetchUserStatus(currentUser.email, currentUser.token);
    if (fresh) {
      const updated = { ...fresh, token: currentUser.token };
      setCurrentUser(updated);
      if (updated.status === 'APPROVED' || updated.status === 'PENDING') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      return updated;
    }
    return null;
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
    currentUser && currentUser.isOwner && currentUser.status === 'APPROVED' && currentUser.email.toLowerCase() === OWNER_EMAIL.toLowerCase()
  );
  const isApproved = Boolean(currentUser && currentUser.status === 'APPROVED');

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        isOwner,
        isApproved,
        pendingRequestsCount,
        login,
        visitorLogin,
        ownerLogin,
        requestOwnerCode,
        logout,
        submitAccessRequest,
        checkStatus,
        pendingRequests,
        approvedUsers,
        accessHistory,
        refreshManageData,
        refreshHistory,
        clearAccessHistory,
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
