import { createContext, useContext, ReactNode, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

type Developer = {
  id: string;
  email: string;
  name: string;
  isEmailVerified?: boolean;
};

type AuthContextType = {
  developer: Developer | null;
  isLoading: boolean;
  login: (email: string, password: string, captchaToken: string) => Promise<void>;
  register: (name: string, email: string, password: string, captchaToken: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();

  const { data: developer, isLoading } = useQuery<Developer | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: Infinity,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password, captchaToken }: { email: string; password: string; captchaToken: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", { email, password, captchaToken });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/dashboard");
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ name, email, password, captchaToken }: { name: string; email: string; password: string; captchaToken: string }) => {
      const res = await apiRequest("POST", "/api/auth/register", { name, email, password, captchaToken });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Redirect to verify email if verification is required
      if (data.requiresVerification) {
        setLocation("/verify-email");
      } else {
        setLocation("/dashboard");
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.clear();
      setLocation("/");
    },
  });

  const login = async (email: string, password: string, captchaToken: string) => {
    await loginMutation.mutateAsync({ email, password, captchaToken });
  };

  const register = async (name: string, email: string, password: string, captchaToken: string) => {
    await registerMutation.mutateAsync({ name, email, password, captchaToken });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider value={{ developer: developer ?? null, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
