import React, { useRef, useEffect, useCallback } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Shield, Heart, TrendingUp } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';

function SocialButton({
  label,
  icon,
  bgColor,
  textColor,
  onPress,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }, [scaleAnim]);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => {
        if (Platform.OS !== 'web') {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        onPress();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View
        style={[
          styles.socialButton,
          { backgroundColor: bgColor, opacity: disabled ? 0.5 : 1, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.socialIconWrap}>{icon}</View>
        <Text style={[styles.socialButtonText, { color: textColor }]}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function AppleIcon() {
  return (
    <Text style={{ fontSize: 20, color: '#FFFFFF', fontWeight: '500' as const }}>
      {'\uF8FF'}
    </Text>
  );
}

function GoogleIcon() {
  return (
    <Text style={{ fontSize: 18, fontWeight: '700' as const, color: '#4285F4' }}>G</Text>
  );
}

function FacebookIcon() {
  return (
    <Text style={{ fontSize: 18, fontWeight: '700' as const, color: '#FFFFFF' }}>f</Text>
  );
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signInWithProvider, isSigningIn, authError, clearError } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const buttonsSlide = useRef(new Animated.Value(40)).current;
  const buttonsFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoScale, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(buttonsFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(buttonsSlide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, [fadeAnim, slideAnim, logoScale, buttonsSlide, buttonsFade]);

  const handleSignIn = useCallback(async (provider: 'apple' | 'google' | 'facebook') => {
    clearError();
    try {
      await signInWithProvider(provider);
    } catch {
      console.log('[Login] Sign-in error handled');
    }
  }, [signInWithProvider, clearError]);

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#0F1923', '#162B3D', '#1A3650']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />

      <View style={styles.bgPattern}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.bgCircle,
              {
                top: `${15 + i * 14}%`,
                left: `${i % 2 === 0 ? -15 : 55}%`,
                width: 200 + i * 30,
                height: 200 + i * 30,
                opacity: 0.03 + i * 0.005,
              },
            ]}
          />
        ))}
      </View>

      <View style={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 }]}>
        <Animated.View
          style={[
            styles.heroSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[Colors.teal, Colors.primary]}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Heart size={36} color="#FFFFFF" />
            </LinearGradient>
          </View>

          <Text style={styles.appName}>RehabFlow</Text>
          <Text style={styles.tagline}>Evidence-based rehabilitation{'\n'}tracking, simplified.</Text>

          <View style={styles.featurePills}>
            <View style={styles.pill}>
              <Shield size={13} color={Colors.teal} />
              <Text style={styles.pillText}>Pain Tracking</Text>
            </View>
            <View style={styles.pill}>
              <TrendingUp size={13} color={Colors.primary} />
              <Text style={styles.pillText}>Smart Progression</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.authSection,
            {
              opacity: buttonsFade,
              transform: [{ translateY: buttonsSlide }],
            },
          ]}
        >
          {authError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{authError}</Text>
              <TouchableOpacity onPress={clearError}>
                <Text style={styles.errorDismiss}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          )}

          {isSigningIn && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color={Colors.teal} />
              <Text style={styles.loadingText}>Signing in...</Text>
            </View>
          )}

          <SocialButton
            label="Continue with Apple"
            icon={<AppleIcon />}
            bgColor="#FFFFFF"
            textColor="#000000"
            onPress={() => handleSignIn('apple')}
            disabled={isSigningIn}
          />

          <SocialButton
            label="Continue with Google"
            icon={<GoogleIcon />}
            bgColor="#FFFFFF"
            textColor="#1F1F1F"
            onPress={() => handleSignIn('google')}
            disabled={isSigningIn}
          />

          <SocialButton
            label="Continue with Facebook"
            icon={<FacebookIcon />}
            bgColor="#1877F2"
            textColor="#FFFFFF"
            onPress={() => handleSignIn('facebook')}
            disabled={isSigningIn}
          />

          <Text style={styles.legalText}>
            By continuing, you agree to our Terms of Service{'\n'}and Privacy Policy
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  bgPattern: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: Colors.teal,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
  },
  heroSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 20,
  },
  logoContainer: {
    marginBottom: 24,
    shadowColor: Colors.teal,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  featurePills: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
  },
  authSection: {
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  socialIconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,107,107,0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.25)',
  },
  errorText: {
    fontSize: 13,
    color: Colors.coralLight,
    fontWeight: '500' as const,
    flex: 1,
  },
  errorDismiss: {
    fontSize: 13,
    color: Colors.coralLight,
    fontWeight: '600' as const,
    marginLeft: 12,
  },
  loadingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500' as const,
  },
  legalText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 4,
  },
});
