import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AppText } from '../../components/AppText';
import { SmallPlusIcon } from '../../components/icons';
import { canUseAppLock } from '../../lib/appLock';
import { isFirebaseConfigured } from '../../lib/firestoreSync';
import { Toggle } from '../../components/Toggle';
import { Segmented } from '../../components/Segmented';
import { useStore } from '../../lib/store';
import { FEATURES } from '../../lib/features';
import { useTheme } from '../../theme/ThemeProvider';
import { useContentStyle } from '../../theme/layout';
import { radii, pastels, PastelKey } from '../../theme/tokens';
import { ageString } from '../../lib/time';
import { exportPediatricianPdf } from '../../lib/pdfExport';
import { BabyAvatar } from '../../components/BabyAvatar';

export function ProfileScreen() {
  const theme = useTheme();
  const contentStyle = useContentStyle();
  const navigation = useNavigation<any>();
  const baby = useStore((s) => s.activeBaby());
  const babies = useStore((s) => s.babies);
  const setActiveBaby = useStore((s) => s.setActiveBaby);
  const caregivers = useStore((s) => s.caregivers);
  const familyId = useStore((s) => s.familyId);
  const myUid = useStore((s) => s.myUid);
  const events = useStore((s) => s.events);
  const leaveFamily = useStore((s) => s.leaveFamily);
  const removeCaregiver = useStore((s) => s.removeCaregiver);
  const measurements = useStore((s) => s.measurements).filter((m) => m.babyId === baby.id);
  const vaccines = useStore((s) => s.vaccines).filter((v) => v.babyId === baby.id);
  const sickness = useStore((s) => s.sickness).filter((sEp) => sEp.babyId === baby.id);
  const medications = useStore((s) => s.medications).filter((m) => m.babyId === baby.id);
  const settings = useStore((s) => s.settings);
  const setUnits = useStore((s) => s.setUnits);
  const setThemePreference = useStore((s) => s.setThemePreference);
  const currentCaregiverId = useStore((s) => s.currentCaregiverId);
  const setMyName = useStore((s) => s.setMyName);
  const savedMyName = caregivers.find((c) => c.id === currentCaregiverId)?.name ?? 'You';
  const [myNameDraft, setMyNameDraft] = useState(savedMyName);
  useEffect(() => {
    setMyNameDraft(savedMyName);
  }, [savedMyName]);
  const setVoiceLoggingEnabled = useStore((s) => s.setVoiceLoggingEnabled);
  const setFeedReminder = useStore((s) => s.setFeedReminder);
  const setAppLockEnabled = useStore((s) => s.setAppLockEnabled);
  const pushToast = useStore((s) => s.pushToast);
  const [lockAvailable, setLockAvailable] = useState(false);
  useEffect(() => {
    canUseAppLock().then(setLockAvailable);
  }, []);
  const latest = measurements[measurements.length - 1];
  const otherBabies = babies.filter((b) => b.id !== baby.id);

  const exportPdf = async () => {
    try {
      await exportPediatricianPdf({ baby, measurements, vaccines, sickness, medications });
    } catch {
      pushToast({ message: "Couldn't create the PDF — try again" });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={[{ padding: 20, paddingBottom: 140 }, contentStyle]} keyboardShouldPersistTaps="handled">
        <AppText weight={900} size={26} color={theme.ink} style={{ marginBottom: 16 }}>
          My babies
        </AppText>

        <View
          style={{
            backgroundColor: '#43382F',
            borderRadius: radii.cardXxl,
            padding: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            marginBottom: 12,
            shadowColor: 'rgba(67,56,47,1)',
            shadowOpacity: 0.25,
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: 24,
            elevation: 8,
          }}
        >
          <BabyAvatar baby={baby} size={64} fontSize={28} />
          <View style={{ flex: 1 }}>
            <AppText weight={900} size={19} color="#F5E9DB">
              {baby.name}
            </AppText>
            <AppText weight={700} size={12.5} color="#C9B8A5">
              Born {new Date(baby.dob).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} · {ageString(baby.dob)}
            </AppText>
            {latest && (
              <AppText weight={700} size={12.5} color="#C9B8A5">
                {latest.weightKg ?? '—'} kg · {latest.heightCm ?? '—'} cm
              </AppText>
            )}
          </View>
          <View style={{ backgroundColor: theme.coral, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12 }}>
            <AppText weight={800} size={11} color="#fff">
              ACTIVE
            </AppText>
          </View>
        </View>

        {otherBabies.map((b) => (
          <Pressable
            key={b.id}
            onPress={() => setActiveBaby(b.id)}
            style={{
              backgroundColor: theme.surface,
              borderRadius: radii.cardXxl,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              marginBottom: 12,
              ...theme.cardShadow,
            }}
          >
            <BabyAvatar baby={b} size={48} fontSize={20} bg="#DCD3F0" color="#4A3D6E" />
            <View style={{ flex: 1 }}>
              <AppText weight={900} size={16} color={theme.ink}>
                {b.name}
              </AppText>
              <AppText weight={700} size={12} color={theme.textSecondary}>
                Born {new Date(b.dob).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} · {ageString(b.dob)}
              </AppText>
            </View>
            <AppText weight={800} size={12} color={theme.coralDeep}>
              Switch ›
            </AppText>
          </Pressable>
        ))}

        <Pressable
          onPress={() => navigation.navigate('AddBaby')}
          style={{
            backgroundColor: theme.surface,
            borderWidth: 2,
            borderColor: '#E0CDB4',
            borderStyle: 'dashed',
            borderRadius: radii.cardLg,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 24,
          }}
        >
          <SmallPlusIcon />
          <AppText weight={800} size={13.5} color="#A98F73">
            Add another baby
          </AppText>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Milestones')} style={{ marginBottom: 24 }}>
          <View
            style={{
              backgroundColor: '#DCD3F0',
              borderRadius: radii.cardXxl,
              padding: 16,
              paddingHorizontal: 18,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <AppText size={20}>✨</AppText>
            <AppText weight={800} size={14} color="#4A3D6E" style={{ flex: 1 }}>
              Milestones &amp; memories
            </AppText>
            <AppText weight={700} size={12} color="#8A7BB8">
              View all ›
            </AppText>
          </View>
        </Pressable>

        {isFirebaseConfigured() && (
        <>
        <AppText weight={900} size={15} color={theme.ink} style={{ marginBottom: 10 }}>
          Caregivers
        </AppText>
        <View style={{ backgroundColor: theme.surface, borderRadius: radii.cardLg, overflow: 'hidden', ...theme.cardShadow, marginBottom: 12 }}>
          {familyId != null &&
            caregivers.map((c, i) => {
              const p = pastels[c.colorKey as PastelKey] ?? pastels.peach;
              const isMe = c.id === myUid;
              const iAmOwner = caregivers.find((cg) => cg.id === myUid)?.role === 'owner';
              const loggedCount = events.filter((e) => e.loggedBy === c.id).length;
              return (
                <View
                  key={c.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 13,
                    paddingHorizontal: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                  }}
                >
                  <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: p.bg, alignItems: 'center', justifyContent: 'center' }}>
                    <AppText weight={900} size={15} color={p.title}>
                      {c.name.charAt(0)}
                    </AppText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText weight={800} size={14.5} color={theme.ink}>
                      {c.name}
                      {isMe ? ' (you)' : ''}
                    </AppText>
                    <AppText weight={600} size={12} color={theme.textSecondary}>
                      {c.role === 'owner' ? 'Owner' : 'Can log'} · logged {loggedCount} events
                    </AppText>
                  </View>
                  {!isMe && iAmOwner && (
                    <Pressable
                      onPress={() =>
                        Alert.alert('Remove caregiver?', `${c.name} will lose access to ${baby.name}'s data.`, [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Remove', style: 'destructive', onPress: () => removeCaregiver(c.id) },
                        ])
                      }
                      hitSlop={10}
                    >
                      <AppText weight={800} size={12} color={theme.coralDeep}>
                        Remove
                      </AppText>
                    </Pressable>
                  )}
                </View>
              );
            })}
          <Pressable
            onPress={() => navigation.navigate('InviteCaregiver')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 16 }}
          >
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFE8D6', alignItems: 'center', justifyContent: 'center' }}>
              <SmallPlusIcon />
            </View>
            <View style={{ flex: 1 }}>
              <AppText weight={800} size={14.5} color={theme.ink}>
                Invite caregiver
              </AppText>
              <AppText weight={600} size={12} color={theme.textSecondary}>
                {familyId ? 'Share a new invite code' : 'Log together across phones'}
              </AppText>
            </View>
            <AppText weight={800} size={12} color={theme.coralDeep}>
              ›
            </AppText>
          </Pressable>
          {familyId != null && (
            <Pressable
              onPress={() => {
                const iAmOwner = caregivers.find((cg) => cg.id === myUid)?.role === 'owner';
                Alert.alert(
                  'Leave family?',
                  iAmOwner
                    ? 'Your data stays on this phone. You can also delete the shared cloud copy for everyone.'
                    : 'Your data stays on this phone, but it will stop syncing with the family.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Leave', style: 'destructive', onPress: () => leaveFamily() },
                    ...(iAmOwner
                      ? [
                          {
                            text: 'Leave & delete cloud data',
                            style: 'destructive' as const,
                            onPress: () => leaveFamily({ deleteCloudData: true }),
                          },
                        ]
                      : []),
                  ]
                );
              }}
              style={{ paddingVertical: 13, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: theme.border }}
            >
              <AppText weight={700} size={13.5} color={theme.coralDeep}>
                Leave family
              </AppText>
            </Pressable>
          )}
        </View>
        </>
        )}

        <AppText weight={900} size={15} color={theme.ink} style={{ marginBottom: 10 }}>
          Settings
        </AppText>
        <View style={{ backgroundColor: theme.surface, borderRadius: radii.cardLg, overflow: 'hidden', ...theme.cardShadow }}>
          <View style={{ padding: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}>
            <AppText weight={700} size={14.5} color={theme.ink}>
              Your name
            </AppText>
            <AppText weight={600} size={11.5} color={theme.textTertiary} style={{ marginTop: 1 }}>
              Shown next to everything you log
            </AppText>
            <TextInput
              value={myNameDraft}
              onChangeText={setMyNameDraft}
              onEndEditing={() => setMyName(myNameDraft)}
              onSubmitEditing={() => setMyName(myNameDraft)}
              placeholder="e.g. Dad"
              placeholderTextColor={theme.textTertiary}
              returnKeyType="done"
              style={{
                marginTop: 8,
                backgroundColor: theme.bg,
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 14,
                fontFamily: 'Nunito_800ExtraBold',
                fontSize: 16,
                color: theme.ink,
              }}
            />
          </View>
          <Pressable
            onPress={() => setUnits(settings.units === 'ml' ? 'oz' : 'ml')}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}
          >
            <AppText weight={700} size={14.5} color={theme.ink}>
              Units
            </AppText>
            <AppText weight={700} size={13} color={theme.textSecondary}>
              {settings.units === 'ml' ? 'ml · kg · cm' : 'oz · lb · in'}
            </AppText>
          </Pressable>
          <View style={{ padding: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}>
            <AppText weight={700} size={14.5} color={theme.ink} style={{ marginBottom: 10 }}>
              Appearance
            </AppText>
            <Segmented
              options={[
                { key: 'light', label: 'Light' },
                { key: 'dark', label: 'Dark' },
                { key: 'system', label: 'Auto' },
              ] as const}
              value={settings.themePreference ?? 'light'}
              onChange={setThemePreference}
              compact
            />
          </View>
          {/* Hidden for v1.0 — no setting for a feature that isn't there. */}
          {FEATURES.voiceLogging && (
            <Pressable
              onPress={() => navigation.navigate('VoicePermissions')}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}
            >
              <AppText weight={700} size={14.5} color={theme.ink}>
                Voice logging
              </AppText>
              <Toggle value={settings.voiceLoggingEnabled} onChange={setVoiceLoggingEnabled} />
            </Pressable>
          )}
          {lockAvailable && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}>
              <View>
                <AppText weight={700} size={14.5} color={theme.ink}>
                  App Lock
                </AppText>
                <AppText weight={600} size={11.5} color={theme.textTertiary} style={{ marginTop: 1 }}>
                  Require Face ID to open DenBaby
                </AppText>
              </View>
              <Toggle value={settings.appLockEnabled ?? false} onChange={setAppLockEnabled} />
            </View>
          )}
          <View style={{ padding: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <AppText weight={700} size={14.5} color={theme.ink}>
                Feed reminder
              </AppText>
              <Toggle
                value={settings.feedReminderEnabled ?? false}
                onChange={(v) => setFeedReminder(v)}
              />
            </View>
            {(settings.feedReminderEnabled ?? false) && (
              <View style={{ marginTop: 10 }}>
                <Segmented
                  options={[
                    { key: '2', label: 'every 2 h' },
                    { key: '3', label: 'every 3 h' },
                    { key: '4', label: 'every 4 h' },
                  ] as const}
                  value={String(settings.feedReminderHours ?? 3) as '2' | '3' | '4'}
                  onChange={(k) => setFeedReminder(true, parseInt(k, 10))}
                  compact
                />
              </View>
            )}
          </View>
          <Pressable
            onPress={exportPdf}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 13, paddingHorizontal: 16 }}
          >
            <AppText weight={700} size={14.5} color={theme.ink}>
              Export for pediatrician
            </AppText>
            <AppText weight={700} size={13} color={theme.coralDeep}>
              PDF ›
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
