import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { RehabProvider } from "@/providers/RehabProvider";
import { ProgramProvider } from "@/providers/ProgramProvider";
import { ProfileProvider } from "@/providers/ProfileProvider";
import { BackupProvider } from "@/providers/BackupProvider";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import Colors from "@/constants/colors";

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      void SplashScreen.hideAsync();
      if (!isAuthenticated) {
        console.log('[Layout] Not authenticated, redirecting to login');
        router.replace('/login');
      }
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <View style={loadingStyles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false, gestureEnabled: false }} />
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

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});

export default function RootLayout() {
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
