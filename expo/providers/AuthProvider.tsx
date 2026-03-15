import { useEffect, useState, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import type { Session, User, Provider } from '@supabase/supabase-js';

WebBrowser.maybeCompleteAuthSession();

export interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithProvider: (provider: Provider) => Promise<void>;
  signOut: () => void;
  isSigningIn: boolean;
  isSigningOut: boolean;
  authError: string | null;
  clearError: () => void;
}

const redirectUri = makeRedirectUri({
  scheme: 'rork-app',
  path: 'auth/callback',
});

export const [AuthProvider, useAuth] = createContextHook((): AuthState => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const sessionQuery = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      console.log('[Auth] Fetching session...');
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('[Auth] Session fetch error:', error.message);
        return null;
      }
      console.log('[Auth] Session fetched:', data.session ? 'Active' : 'None');
      return data.session;
    },
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (sessionQuery.data !== undefined) {
      setSession(sessionQuery.data);
      setInitialLoading(false);
    }
  }, [sessionQuery.data]);

  useEffect(() => {
    if (!sessionQuery.isLoading && sessionQuery.data === undefined) {
      setInitialLoading(false);
    }
  }, [sessionQuery.isLoading, sessionQuery.data]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        console.log('[Auth] Auth state changed:', _event);
        setSession(newSession);
        setInitialLoading(false);
        queryClient.setQueryData(['auth-session'], newSession);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const signInMutation = useMutation({
    mutationFn: async (provider: Provider) => {
      console.log(`[Auth] Starting ${provider} sign-in...`);
      console.log('[Auth] Redirect URI:', redirectUri);
      setAuthError(null);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        console.error(`[Auth] OAuth error for ${provider}:`, error.message);
        throw error;
      }

      if (data?.url) {
        console.log(`[Auth] Opening browser for ${provider}...`);

        if (Platform.OS === 'web') {
          window.location.href = data.url;
          return;
        }

        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUri,
          { showInRecents: true }
        );

        console.log('[Auth] Browser result type:', result.type);

        if (result.type === 'success' && result.url) {
          console.log('[Auth] Auth callback received');
          const url = new URL(result.url);

          const params = new URLSearchParams(
            url.hash ? url.hash.substring(1) : url.search.substring(1)
          );
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            console.log('[Auth] Setting session from tokens...');
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              console.error('[Auth] Set session error:', sessionError.message);
              throw sessionError;
            }
            console.log('[Auth] Session set successfully');
          } else {
            console.warn('[Auth] No tokens found in callback URL');
          }
        } else if (result.type === 'cancel' || result.type === 'dismiss') {
          console.log('[Auth] User cancelled sign-in');
          throw new Error('Sign-in was cancelled');
        }
      }
    },
    onError: (error: Error) => {
      const msg = error.message === 'Sign-in was cancelled'
        ? 'Sign-in was cancelled'
        : 'Something went wrong. Please try again.';
      setAuthError(msg);
      console.error('[Auth] Sign-in mutation error:', error.message);
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      console.log('[Auth] Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[Auth] Sign-out error:', error.message);
        throw error;
      }
      console.log('[Auth] Signed out successfully');
    },
    onSuccess: () => {
      setSession(null);
      queryClient.setQueryData(['auth-session'], null);
    },
    onError: (error: Error) => {
      setAuthError('Failed to sign out. Please try again.');
      console.error('[Auth] Sign-out mutation error:', error.message);
    },
  });

  const signInWithProvider = useCallback(async (provider: Provider) => {
    await signInMutation.mutateAsync(provider);
  }, [signInMutation]);

  const signOut = useCallback(() => {
    signOutMutation.mutate();
  }, [signOutMutation]);

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  return useMemo(() => ({
    session,
    user: session?.user ?? null,
    isLoading: initialLoading || sessionQuery.isLoading,
    isAuthenticated: !!session?.user,
    signInWithProvider,
    signOut,
    isSigningIn: signInMutation.isPending,
    isSigningOut: signOutMutation.isPending,
    authError,
    clearError,
  }), [
    session,
    initialLoading,
    sessionQuery.isLoading,
    signInWithProvider,
    signOut,
    signInMutation.isPending,
    signOutMutation.isPending,
    authError,
    clearError,
  ]);
});
