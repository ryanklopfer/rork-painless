import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Activity,
  Bell,
  Trash2,
  ChevronRight,
  Save,
  Shield,
  Calendar,
  Cloud,
  CloudOff,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  LogOut,
  Mail,
} from 'lucide-react-native';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { useProfile, UserProfile } from '@/providers/ProfileProvider';
import { useRehab } from '@/providers/RehabProvider';
import { useBackup } from '@/providers/BackupProvider';
import { useAuth } from '@/providers/AuthProvider';

const EXPERIENCE_OPTIONS: { value: UserProfile['trainingExperience']; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export default function ProfileScreen() {
  const { profile, updateProfile, clearAllData, isClearingData } = useProfile();
  const { streak, checkIns, painEntries } = useRehab();
  const { user, signOut, isSigningOut } = useAuth();
  const {
    lastBackupAt,
    autoBackupEnabled,
    hasCloudBackup,
    isBackingUp,
    isRestoring,
    backupNow,
    restoreFromCloud,
    toggleAutoBackup,
    deviceId,
  } = useBackup();

  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const saveAnim = useRef(new Animated.Value(1)).current;

  const handleFieldPress = useCallback((field: string, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue);
  }, []);

  const handleSave = useCallback((field: keyof UserProfile) => {
    updateProfile({ [field]: tempValue });
    setEditingField(null);

    Animated.sequence([
      Animated.timing(saveAnim, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.timing(saveAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  }, [tempValue, updateProfile, saveAnim]);

  const handleExperienceSelect = useCallback((value: UserProfile['trainingExperience']) => {
    updateProfile({ trainingExperience: value });
  }, [updateProfile]);

  const handleToggleNotifications = useCallback(() => {
    updateProfile({ notificationsEnabled: !profile.notificationsEnabled });
  }, [profile.notificationsEnabled, updateProfile]);

  const handleBackupNow = useCallback(() => {
    backupNow();
  }, [backupNow]);

  const handleRestore = useCallback(() => {
    Alert.alert(
      'Restore from Cloud',
      'This will replace all your current data with the cloud backup. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: () => restoreFromCloud(),
        },
      ]
    );
  }, [restoreFromCloud]);

  const handleToggleAutoBackup = useCallback(() => {
    void toggleAutoBackup(!autoBackupEnabled);
  }, [autoBackupEnabled, toggleAutoBackup]);

  const formatBackupTime = useCallback((isoString: string | null): string => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }, []);

  const handleClearData = useCallback(() => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your check-ins, pain logs, programs, and profile data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => clearAllData(),
        },
      ]
    );
  }, [clearAllData]);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            signOut();
            router.replace('/login');
          },
        },
      ]
    );
  }, [signOut]);

  const userEmail = user?.email ?? user?.user_metadata?.email as string | undefined;
  const userProvider = user?.app_metadata?.provider as string | undefined;

  const totalCheckIns = checkIns.length;
  const totalPainLogs = painEntries.length;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <User color={Colors.textInverse} size={32} />
              </View>
              <View style={styles.avatarRing} />
            </View>
            <Text style={styles.headerName}>
              {profile.name || 'Set Your Name'}
            </Text>
            {userEmail ? (
              <View style={styles.emailRow}>
                <Mail color={Colors.textTertiary} size={13} />
                <Text style={styles.headerEmail}>{userEmail}</Text>
              </View>
            ) : (
              <Text style={styles.headerSub}>
                {profile.trainingExperience
                  ? `${profile.trainingExperience.charAt(0).toUpperCase() + profile.trainingExperience.slice(1)} Level`
                  : 'Tap to set up your profile'}
              </Text>
            )}
            {userProvider && (
              <View style={styles.providerBadge}>
                <Text style={styles.providerText}>
                  {userProvider.charAt(0).toUpperCase() + userProvider.slice(1)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Activity color={Colors.teal} size={18} />
              <Text style={styles.statValue}>{streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Calendar color={Colors.primary} size={18} />
              <Text style={styles.statValue}>{totalCheckIns}</Text>
              <Text style={styles.statLabel}>Check-ins</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Shield color={Colors.coral} size={18} />
              <Text style={styles.statValue}>{totalPainLogs}</Text>
              <Text style={styles.statLabel}>Pain Logs</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Info</Text>
            <View style={styles.card}>
              <ProfileField
                label="Name"
                value={profile.name}
                placeholder="Enter your name"
                isEditing={editingField === 'name'}
                tempValue={tempValue}
                onPress={() => handleFieldPress('name', profile.name)}
                onChangeText={setTempValue}
                onSave={() => handleSave('name')}
                onCancel={() => setEditingField(null)}
              />
              <View style={styles.fieldDivider} />
              <ProfileField
                label="Age"
                value={profile.age}
                placeholder="Enter your age"
                isEditing={editingField === 'age'}
                tempValue={tempValue}
                keyboardType="number-pad"
                onPress={() => handleFieldPress('age', profile.age)}
                onChangeText={setTempValue}
                onSave={() => handleSave('age')}
                onCancel={() => setEditingField(null)}
              />
              <View style={styles.fieldDivider} />
              <ProfileField
                label="Rehab Goal"
                value={profile.goalDescription}
                placeholder="What are you working toward?"
                isEditing={editingField === 'goalDescription'}
                tempValue={tempValue}
                multiline
                onPress={() => handleFieldPress('goalDescription', profile.goalDescription)}
                onChangeText={setTempValue}
                onSave={() => handleSave('goalDescription')}
                onCancel={() => setEditingField(null)}
              />
              <View style={styles.fieldDivider} />
              <ProfileField
                label="Injury History"
                value={profile.injuryHistory}
                placeholder="Any past injuries or conditions?"
                isEditing={editingField === 'injuryHistory'}
                tempValue={tempValue}
                multiline
                onPress={() => handleFieldPress('injuryHistory', profile.injuryHistory)}
                onChangeText={setTempValue}
                onSave={() => handleSave('injuryHistory')}
                onCancel={() => setEditingField(null)}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Training Experience</Text>
            <View style={styles.card}>
              <View style={styles.experienceRow}>
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.experienceChip,
                      profile.trainingExperience === opt.value && styles.experienceChipActive,
                    ]}
                    onPress={() => handleExperienceSelect(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.experienceChipText,
                        profile.trainingExperience === opt.value && styles.experienceChipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.settingRow}
                onPress={handleToggleNotifications}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIcon, { backgroundColor: Colors.primaryLight + '20' }]}>
                    <Bell color={Colors.primary} size={18} />
                  </View>
                  <Text style={styles.settingLabel}>Reminders</Text>
                </View>
                <View
                  style={[
                    styles.toggle,
                    profile.notificationsEnabled && styles.toggleActive,
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.toggleThumb,
                      profile.notificationsEnabled && styles.toggleThumbActive,
                    ]}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cloud Backup</Text>
            <View style={styles.card}>
              <View style={styles.backupStatusRow}>
                <View style={styles.backupStatusLeft}>
                  <View style={[styles.settingIcon, { backgroundColor: hasCloudBackup ? Colors.teal + '15' : Colors.textTertiary + '15' }]}>
                    {hasCloudBackup ? (
                      <Cloud color={Colors.teal} size={18} />
                    ) : (
                      <CloudOff color={Colors.textTertiary} size={18} />
                    )}
                  </View>
                  <View style={styles.backupStatusText}>
                    <Text style={styles.settingLabel}>
                      {hasCloudBackup ? 'Backed Up' : 'No Backup'}
                    </Text>
                    <Text style={styles.backupTimestamp}>
                      {hasCloudBackup
                        ? `Last: ${formatBackupTime(lastBackupAt)}`
                        : 'Your data is only stored locally'}
                    </Text>
                  </View>
                </View>
                {hasCloudBackup && (
                  <CheckCircle color={Colors.teal} size={16} />
                )}
              </View>

              <View style={styles.fieldDivider} />

              <TouchableOpacity
                style={styles.settingRow}
                onPress={handleBackupNow}
                activeOpacity={0.6}
                disabled={isBackingUp}
              >
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIcon, { backgroundColor: Colors.primary + '15' }]}>
                    {isBackingUp ? (
                      <RefreshCw color={Colors.primary} size={18} />
                    ) : (
                      <Upload color={Colors.primary} size={18} />
                    )}
                  </View>
                  <Text style={styles.settingLabel}>
                    {isBackingUp ? 'Backing up...' : 'Back Up Now'}
                  </Text>
                </View>
                <ChevronRight color={Colors.textTertiary} size={18} />
              </TouchableOpacity>

              <View style={styles.fieldDivider} />

              <TouchableOpacity
                style={styles.settingRow}
                onPress={handleRestore}
                activeOpacity={0.6}
                disabled={isRestoring || !hasCloudBackup}
              >
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIcon, { backgroundColor: hasCloudBackup ? Colors.amber + '15' : Colors.textTertiary + '10' }]}>
                    <Download color={hasCloudBackup ? Colors.amber : Colors.textTertiary} size={18} />
                  </View>
                  <Text style={[styles.settingLabel, !hasCloudBackup && { color: Colors.textTertiary }]}>
                    {isRestoring ? 'Restoring...' : 'Restore from Cloud'}
                  </Text>
                </View>
                <ChevronRight color={Colors.textTertiary} size={18} />
              </TouchableOpacity>

              <View style={styles.fieldDivider} />

              <TouchableOpacity
                style={styles.settingRow}
                onPress={handleToggleAutoBackup}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIcon, { backgroundColor: Colors.green + '15' }]}>
                    <RefreshCw color={Colors.green} size={18} />
                  </View>
                  <View style={styles.backupStatusText}>
                    <Text style={styles.settingLabel}>Auto-Backup</Text>
                    <Text style={styles.backupTimestamp}>Syncs every 5 minutes</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.toggle,
                    autoBackupEnabled && styles.toggleActive,
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.toggleThumb,
                      autoBackupEnabled && styles.toggleThumbActive,
                    ]}
                  />
                </View>
              </TouchableOpacity>
            </View>

            {deviceId && (
              <Text style={styles.deviceIdText}>Device: {deviceId.substring(0, 16)}...</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.dangerRow}
                onPress={handleClearData}
                activeOpacity={0.6}
                disabled={isClearingData}
              >
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIcon, { backgroundColor: Colors.coral + '15' }]}>
                    <Trash2 color={Colors.coral} size={18} />
                  </View>
                  <Text style={styles.dangerLabel}>
                    {isClearingData ? 'Clearing...' : 'Clear All Data'}
                  </Text>
                </View>
                <ChevronRight color={Colors.coral} size={18} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.dangerRow}
                onPress={handleSignOut}
                activeOpacity={0.6}
                disabled={isSigningOut}
              >
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIcon, { backgroundColor: Colors.coral + '15' }]}>
                    <LogOut color={Colors.coral} size={18} />
                  </View>
                  <Text style={styles.dangerLabel}>
                    {isSigningOut ? 'Signing out...' : 'Sign Out'}
                  </Text>
                </View>
                <ChevronRight color={Colors.coral} size={18} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.versionText}>RehabFlow v1.0</Text>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

interface ProfileFieldProps {
  label: string;
  value: string;
  placeholder: string;
  isEditing: boolean;
  tempValue: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad';
  onPress: () => void;
  onChangeText: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

function ProfileField({
  label,
  value,
  placeholder,
  isEditing,
  tempValue,
  multiline,
  keyboardType = 'default',
  onPress,
  onChangeText,
  onSave,
  onCancel,
}: ProfileFieldProps) {
  if (isEditing) {
    return (
      <View style={styles.fieldEditing}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
          style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
          value={tempValue}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          multiline={multiline}
          keyboardType={keyboardType}
          autoFocus
        />
        <View style={styles.fieldActions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
            <Save color={Colors.textInverse} size={14} />
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.fieldRow} onPress={onPress} activeOpacity={0.6}>
      <View style={styles.fieldContent}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text
          style={[styles.fieldValue, !value && styles.fieldPlaceholder]}
          numberOfLines={2}
        >
          {value || placeholder}
        </Text>
      </View>
      <ChevronRight color={Colors.textTertiary} size={16} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 14,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    position: 'absolute',
    top: -3,
    left: -3,
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 2.5,
    borderColor: Colors.primaryLight,
    opacity: 0.4,
  },
  headerName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  headerEmail: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  providerBadge: {
    marginTop: 8,
    backgroundColor: Colors.teal + '15',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  providerText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.teal,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  fieldContent: {
    flex: 1,
    marginRight: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  fieldPlaceholder: {
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  fieldDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 16,
  },
  fieldEditing: {
    padding: 16,
  },
  fieldInput: {
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.primaryLight + '08',
    marginTop: 6,
  },
  fieldInputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  fieldActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.surfaceSecondary,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  experienceRow: {
    flexDirection: 'row',
    padding: 14,
    gap: 10,
  },
  experienceChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
  },
  experienceChipActive: {
    backgroundColor: Colors.primary,
  },
  experienceChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  experienceChipTextActive: {
    color: Colors.textInverse,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleActive: {
    backgroundColor: Colors.teal,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  dangerLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.coral,
  },
  backupStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  backupStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backupStatusText: {
    flex: 1,
  },
  backupTimestamp: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  deviceIdText: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 8,
    marginLeft: 4,
    fontFamily: 'monospace',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 24,
  },
});
