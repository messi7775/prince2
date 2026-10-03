import { useCallback, useMemo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { LoginInput } from '@prince-net/validation';
import { AuthContext, type AuthContextValue } from './AuthContext';
import { fetchMe } from './api/me';
import { login as loginApi } from './api/login';
import { logout as logoutApi } from './api/logout';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // ─── /auth/me query ───
  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchMe,
    retry: false,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  // ─── Login mutation ───
  const loginMutation = useMutation({
    mutationFn: (input: LoginInput) => loginApi(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      await meQuery.refetch();
    },
  });

  // ─── Logout mutation ───
  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      queryClient.clear();
      navigate('/login', { replace: true });
    },
  });

  // ─── Handlers ───
  const login = useCallback(
    async (input: LoginInput) => {
      await loginMutation.mutateAsync(input);
    },
    [loginMutation],
  );

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const refetch = useCallback(async () => {
    await meQuery.refetch();
  }, [meQuery]);

  // ─── Context value ───
  const value: AuthContextValue = useMemo(
    () => ({
      user: meQuery.data?.user ?? null,
      isLoading: meQuery.isLoading,
      isAuthenticated: !!meQuery.data?.user,
      login,
      logout,
      refetch,
    }),
    [meQuery.data, meQuery.isLoading, login, logout, refetch],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}