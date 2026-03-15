import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { RehabProvider } from "@/providers/RehabProvider";
import { ProgramProvider } from "@/providers/ProgramProvider";
import { ProfileProvider } from "@/providers/ProfileProvider";
import { BackupProvider } from "@/providers/BackupProvider";

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
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
        <RehabProvider>
          <ProgramProvider>
            <ProfileProvider>
              <BackupProvider>
                <RootLayoutNav />
              </BackupProvider>
            </ProfileProvider>
          </ProgramProvider>
        </RehabProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
