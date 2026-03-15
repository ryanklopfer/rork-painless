import { useEffect, useState, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import type { Session, User, AuthError } from '@supabase/supabase-js';

WebBrowser.maybeCompleteAuthSession();

type OAuthProvider = 'google' | 'apple' | 'facebook';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithOAuth: (provider: OAuthProvider) => void;
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

  const sessionQuery = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      console.log('[Auth] Fetching current session...');
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('[Auth] Session fetch error:', error.message);
        throw error;
      }
      console.log('[Auth] Session fetched:', data.session ? 'exists' : 'none');
      return data.session;
    },
    staleTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    if (sessionQuery.data !== undefined) {
      setSession(sessionQuery.data);
    }
  }, [sessionQuery.data]);

  useEffect(() => {
    console.log('[Auth] Setting up auth state listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        console.log('[Auth] Auth state changed:', _event, newSession ? 'has session' : 'no session');
        setSession(newSession);
        queryClient.setQueryData(['auth-session'], newSession);
      }
    );

    return () => {
      console.log('[Auth] Cleaning up auth state listener');
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const oauthMutation = useMutation({
    mutationFn: async (provider: OAuthProvider) => {
      console.log(`[Auth] Starting OAuth with ${provider}, redirect: ${redirectUri}`);
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

      if (!data?.url) {
        throw new Error('No OAuth URL returned');
      }

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
        console.log('[Auth] OAuth callback received, extracting session...');
        const url = new URL(result.url);

        const hashParams = new URLSearchParams(url.hash.substring(1));
        const queryParams = url.searchParams;

        const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');

        if (accessToken && refreshToken) {
          console.log('[Auth] Setting session from tokens...');
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) {
            console.error('[Auth] Session set error:', sessionError.message);
            throw sessionError;
          }
          console.log('[Auth] Session set successfully');
        } else {
          const code = queryParams.get('code');
          if (code) {
            console.log('[Auth] Exchanging code for session...');
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              console.error('[Auth] Code exchange error:', exchangeError.message);
              throw exchangeError;
            }
            console.log('[Auth] Code exchanged successfully');
          } else {
            console.warn('[Auth] No tokens or code found in callback URL');
          }
        }
      } else if (result.type === 'cancel' || result.type === 'dismiss') {
        console.log('[Auth] User cancelled OAuth flow');
      }
    },
    onError: (error: AuthError | Error) => {
      console.error('[Auth] OAuth mutation error:', error.message);
      setAuthError(error.message);
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      console.log('[Auth] Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[Auth] Sign out error:', error.message);
        throw error;
      }
      console.log('[Auth] Signed out successfully');
    },
    onSuccess: () => {
      setSession(null);
      queryClient.setQueryData(['auth-session'], null);
    },
    onError: (error: AuthError | Error) => {
      console.error('[Auth] Sign out mutation error:', error.message);
      setAuthError(error.message);
    },
  });

  const signInWithOAuth = useCallback((provider: OAuthProvider) => {
    oauthMutation.mutate(provider);
  }, [oauthMutation]);

  const signOut = useCallback(() => {
    signOutMutation.mutate();
  }, [signOutMutation]);

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  return useMemo(() => ({
    session,
    user: session?.user ?? null,
    isLoading: sessionQuery.isLoading,
    isAuthenticated: !!session,
    signInWithOAuth,
    signOut,
    isSigningIn: oauthMutation.isPending,
    isSigningOut: signOutMutation.isPending,
    authError,
    clearError,
  }), [
    session,
    sessionQuery.isLoading,
    signInWithOAuth,
    signOut,
    oauthMutation.isPending,
    signOutMutation.isPending,
    authError,
    clearError,
  ]);
});
