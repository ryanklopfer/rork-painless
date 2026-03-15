import React, { useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';

const APPLE_BLACK = '#000000';
const GOOGLE_WHITE = '#FFFFFF';
const FACEBOOK_BLUE = '#1877F2';

function AppleIcon({ size }: { size: number }) {
  return (
    <Text style={{ fontSize: size, color: '#FFFFFF', fontWeight: '400' as const, marginTop: -2 }}>
      {'\uF8FF'}
    </Text>
  );
}

function GoogleIcon({ size }: { size: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size - 2, fontWeight: '700' as const, color: '#4285F4' }}>G</Text>
    </View>
  );
}

function FacebookIcon({ size }: { size: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size - 2, fontWeight: '800' as const, color: '#FFFFFF' }}>f</Text>
    </View>
  );
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signInWithOAuth, isSigningIn, authError, clearError } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(buttonFade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeAnim, slideAnim, buttonFade, pulseAnim]);

  const handlePress = useCallback((provider: 'google' | 'apple' | 'facebook') => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    clearError();
    signInWithOAuth(provider);
  }, [signInWithOAuth, clearError]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 24) }]}>
      <View style={styles.backgroundAccent} />
      <View style={styles.backgroundAccent2} />

      <View style={styles.topSection}>
        <Animated.View
          style={[
            styles.heroContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.iconInner}>
              <Sparkles size={36} color={Colors.primary} />
            </View>
          </Animated.View>

          <Text style={styles.appName}>RehabFlow</Text>
          <Text style={styles.tagline}>
            Your personalized path to{'\n'}pain-free movement
          </Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.bottomSection, { opacity: buttonFade }]}>
        {authError ? (
          <TouchableOpacity style={styles.errorBanner} onPress={clearError} activeOpacity={0.8}>
            <Text style={styles.errorText}>{authError}</Text>
            <Text style={styles.errorDismiss}>Tap to dismiss</Text>
          </TouchableOpacity>
        ) : null}

        {isSigningIn ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Connecting...</Text>
          </View>
        ) : (
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.oauthButton, styles.appleButton]}
              onPress={() => handlePress('apple')}
              activeOpacity={0.85}
              testID="login-apple"
            >
              <AppleIcon size={20} />
              <Text style={[styles.oauthButtonText, styles.appleButtonText]}>
                Continue with Apple
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.oauthButton, styles.googleButton]}
              onPress={() => handlePress('google')}
              activeOpacity={0.85}
              testID="login-google"
            >
              <GoogleIcon size={20} />
              <Text style={[styles.oauthButtonText, styles.googleButtonText]}>
                Continue with Google
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.oauthButton, styles.facebookButton]}
              onPress={() => handlePress('facebook')}
              activeOpacity={0.85}
              testID="login-facebook"
            >
              <FacebookIcon size={20} />
              <Text style={[styles.oauthButtonText, styles.facebookButtonText]}>
                Continue with Facebook
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.termsText}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backgroundAccent: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.primary + '08',
  },
  backgroundAccent2: {
    position: 'absolute',
    bottom: 100,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: Colors.teal + '06',
  },
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  heroContent: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 28,
  },
  iconInner: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  appName: {
    fontSize: 34,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -1,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 17,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  bottomSection: {
    paddingHorizontal: 24,
    gap: 20,
  },
  errorBanner: {
    backgroundColor: Colors.coral + '12',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.coral + '30',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: Colors.coral,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
  errorDismiss: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  buttonsContainer: {
    gap: 12,
  },
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 14,
    gap: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  appleButton: {
    backgroundColor: APPLE_BLACK,
    shadowColor: APPLE_BLACK,
  },
  googleButton: {
    backgroundColor: GOOGLE_WHITE,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.08,
  },
  facebookButton: {
    backgroundColor: FACEBOOK_BLUE,
    shadowColor: FACEBOOK_BLUE,
  },
  oauthButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  appleButtonText: {
    color: '#FFFFFF',
  },
  googleButtonText: {
    color: Colors.text,
  },
  facebookButtonText: {
    color: '#FFFFFF',
  },
  termsText: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});
