import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";

interface User {
  id: number;
  email: string;
  name: string | null;
  avatar?: string | null;
  provider?: string | null;
  isAdmin?: boolean;
  canEditKanban?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  loginWithGoogle: (token: string) => Promise<void>;
  loginWithGithub: (code: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "cniep_auth_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      fetchUser(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async (token: string) => {
    try {
      const response = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
    } catch (error) {
      // Token invalid or expired
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    const { token } = response.data;
    localStorage.setItem(TOKEN_KEY, token);
    await fetchUser(token);
  };

  const register = async (email: string, password: string, name?: string) => {
    const response = await api.post("/auth/register", { email, password, name });
    const { token } = response.data;
    localStorage.setItem(TOKEN_KEY, token);
    await fetchUser(token);
  };

  const loginWithGoogle = async (googleToken: string) => {
    const response = await api.post("/auth/oauth/google", { token: googleToken });
    const { token } = response.data;
    localStorage.setItem(TOKEN_KEY, token);
    await fetchUser(token);
  };

  const loginWithGithub = async (code: string) => {
    const response = await api.post("/auth/oauth/github", { code });
    const { token } = response.data;
    localStorage.setItem(TOKEN_KEY, token);
    await fetchUser(token);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  const deleteAccount = async () => {
    await api.delete("/auth/me");
    logout();
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const refreshUser = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      await fetchUser(token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        loginWithGoogle,
        loginWithGithub,
        logout,
        updateUser,
        refreshUser,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Helper to get token for API calls
export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
