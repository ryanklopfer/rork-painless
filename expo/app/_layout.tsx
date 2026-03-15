import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { RehabProvider } from "@/providers/RehabProvider";
import { ProgramProvider } from "@/providers/ProgramProvider";
import { ProfileProvider } from "@/providers/ProfileProvider";
import { BackupProvider } from "@/providers/BackupProvider";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function useProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inLoginScreen = segments[0] === 'login';

    if (!isAuthenticated && !inLoginScreen) {
      console.log('[Auth] Not authenticated, redirecting to login');
      router.replace('/login');
    } else if (isAuthenticated && inLoginScreen) {
      console.log('[Auth] Authenticated, redirecting to home');
      router.replace('/(tabs)/(home)');
    }
  }, [isAuthenticated, isLoading, segments, router]);
}

function RootLayoutNav() {
  useProtectedRoute();

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="login" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="check-in" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="log-pain" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="log-sets" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="learn-detail" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ presentation: "fullScreenModal", headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="log-activity" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="pain-science-quiz" options={{ presentation: "modal", headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <RehabProvider>
            <ProgramProvider>
              <ProfileProvider>
                <BackupProvider>
                  <RootLayoutNav />
                </BackupProvider>
              </ProfileProvider>
            </ProgramProvider>
          </RehabProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
