import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AppText } from '../../components/AppText';
import { SmallPlusIcon } from '../../components/icons';

// Multi-caregiver (list + invite/share-code flow) is phase 2 — hidden for
// the v1 App Store release so review doesn't hit a dead-end demo flow.
const SHOW_CAREGIVERS = false;
import { Toggle } from '../../components/Toggle';
import { useStore } from '../../lib/store';
import { useTheme } from '../../theme/ThemeProvider';
import { radii, pastels, PastelKey } from '../../theme/tokens';
import { ageString } from '../../lib/time';
import { exportPediatricianPdf } from '../../lib/pdfExport';
import { BabyAvatar } from '../../components/BabyAvatar';

export function ProfileScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const baby = useStore((s) => s.activeBaby());
  const babies = useStore((s) => s.babies);
  const setActiveBaby = useStore((s) => s.setActiveBaby);
  const caregivers = useStore((s) => s.caregivers);
  const measurements = useStore((s) => s.measurements).filter((m) => m.babyId === baby.id);
  const vaccines = useStore((s) => s.vaccines).filter((v) => v.babyId === baby.id);
  const sickness = useStore((s) => s.sickness).filter((sEp) => sEp.babyId === baby.id);
  const medications = useStore((s) => s.medications).filter((m) => m.babyId === baby.id);
  const settings = useStore((s) => s.settings);
  const setUnits = useStore((s) => s.setUnits);
  const setVoiceLoggingEnabled = useStore((s) => s.setVoiceLoggingEnabled);
  const setFeedReminder = useStore((s) => s.setFeedReminder);
  const pushToast = useStore((s) => s.pushToast);
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
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
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

        {SHOW_CAREGIVERS && (
        <>
        <AppText weight={900} size={15} color={theme.ink} style={{ marginBottom: 10 }}>
          Caregivers
        </AppText>
        <View style={{ backgroundColor: theme.surface, borderRadius: radii.cardLg, overflow: 'hidden', ...theme.cardShadow, marginBottom: 12 }}>
          {caregivers.map((c, i) => {
            const p = pastels[c.colorKey as PastelKey];
            return (
              <View
                key={c.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 13,
                  paddingHorizontal: 16,
                  borderBottomWidth: i === caregivers.length - 1 ? 0 : 1,
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
                  </AppText>
                  <AppText weight={600} size={12} color={theme.textSecondary}>
                    {c.role === 'owner' ? 'Owner' : c.role === 'editor' ? 'Editor' : 'Can log'} · logged {c.loggedCount} events
                  </AppText>
                </View>
                {c.online ? (
                  <AppText weight={800} size={11} color={theme.successGreen}>
                    ● ONLINE
                  </AppText>
                ) : (
                  <AppText weight={700} size={11} color={theme.textTertiary}>
                    {c.schedule ?? c.lastActive}
                  </AppText>
                )}
              </View>
            );
          })}
        </View>
        </>
        )}

        <AppText weight={900} size={15} color={theme.ink} style={{ marginBottom: 10 }}>
          Settings
        </AppText>
        <View style={{ backgroundColor: theme.surface, borderRadius: radii.cardLg, overflow: 'hidden', ...theme.cardShadow }}>
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
          <Pressable
            onPress={() => navigation.navigate('VoicePermissions')}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}
          >
            <AppText weight={700} size={14.5} color={theme.ink}>
              Voice logging
            </AppText>
            <Toggle value={settings.voiceLoggingEnabled} onChange={setVoiceLoggingEnabled} />
          </Pressable>
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
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                {[2, 3, 4].map((h) => {
                  const active = (settings.feedReminderHours ?? 3) === h;
                  return (
                    <Pressable
                      key={h}
                      onPress={() => setFeedReminder(true, h)}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        paddingVertical: 7,
                        borderRadius: 999,
                        backgroundColor: active ? theme.ink : '#F0E4D2',
                      }}
                    >
                      <AppText weight={active ? 800 : 700} size={12.5} color={active ? '#F5E9DB' : theme.textSecondary}>
                        every {h} h
                      </AppText>
                    </Pressable>
                  );
                })}
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
    </SafeAreaView>
  );
}
