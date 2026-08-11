import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { VoiceBar } from '../../components/VoiceBar';
import { useStore } from '../../lib/store';
import { FEATURES } from '../../lib/features';
import { useTheme } from '../../theme/ThemeProvider';
import { useContentStyle } from '../../theme/layout';
import { ageString, clockTime, durationLabel, relativeTime } from '../../lib/time';
import { FeedEvent, DiaperEvent } from '../../types/models';
import { nightColors } from '../../theme/tokens';
import { BabyAvatar } from '../../components/BabyAvatar';

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export function NightHomeView() {
  const theme = useTheme();
  const contentStyle = useContentStyle();
  const baby = useStore((s) => s.activeBaby());
  const runningSleepSession = useStore((s) => s.runningSleepSession);
  const toggleSleep = useStore((s) => s.toggleSleep);
  const events = useStore((s) => s.events).filter((e) => e.babyId === baby.id);
  const logQuickEvent = useStore((s) => s.logQuickEvent);
  const setForceNightPreview = useStore((s) => s.setForceNightPreview);
  const voiceSetting = useStore((s) => s.settings.voiceLoggingEnabled);
  const voiceEnabled = FEATURES.voiceLogging && voiceSetting;
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const lastBottle = [...events].filter((e) => e.type === 'bottle').sort((a, b) => new Date((b as FeedEvent).time).getTime() - new Date((a as FeedEvent).time).getTime())[0] as FeedEvent | undefined;
  const lastDiaper = [...events].filter((e) => e.type === 'diaper').sort((a, b) => new Date((b as DiaperEvent).time).getTime() - new Date((a as DiaperEvent).time).getTime())[0] as DiaperEvent | undefined;

  const elapsedMs = runningSleepSession ? now.getTime() - new Date(runningSleepSession.startTime).getTime() : 0;
  const h = Math.floor(elapsedMs / 3600000);
  const m = Math.floor((elapsedMs % 3600000) / 60000);
  const s = Math.floor((elapsedMs % 60000) / 1000);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={[{ padding: 20, paddingBottom: 140 }, contentStyle]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <BabyAvatar baby={baby} size={46} fontSize={20} bg={nightColors.avatarBg} color={nightColors.lavenderAccent} />
            <View style={{ flex: 1 }}>
              <AppText weight={900} size={21} color={theme.ink}>
                Night mode 🌙
              </AppText>
              <AppText weight={700} size={13} color={theme.textSecondary}>
                {baby.name} · {runningSleepSession ? `asleep ${durationLabel(elapsedMs)}` : ageString(baby.dob, now)}
              </AppText>
            </View>
            {/* Always an obvious way back — this view hides the timeline,
                trends and everything else. */}
            <Pressable
              onPress={() => setForceNightPreview(false)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Leave night mode"
              style={{ borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: nightColors.timerPillBg }}
            >
              <AppText weight={800} size={12.5} color={nightColors.timerPillText}>
                Exit
              </AppText>
            </Pressable>
          </View>

          <View style={{ backgroundColor: theme.surface, borderRadius: 24, padding: 20, marginBottom: 16, alignItems: 'center' }}>
            {runningSleepSession ? (
              <>
                <AppText weight={800} size={12} color={theme.textSecondary} letterSpacing={2} uppercase style={{ marginBottom: 8 }}>
                  Sleeping since {clockTime(runningSleepSession.startTime)}
                </AppText>
                <AppText weight={900} size={44} color={theme.ink}>
                  {h}:{pad(m)}:{pad(s)}
                </AppText>
                <Pressable onPress={toggleSleep} style={{ marginTop: 16, backgroundColor: nightColors.timerPillBg, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 28 }}>
                  <AppText weight={800} size={14} color={nightColors.timerPillText}>
                    End sleep
                  </AppText>
                </Pressable>
              </>
            ) : (
              <>
                <AppText weight={800} size={12} color={theme.textSecondary} letterSpacing={2} uppercase style={{ marginBottom: 8 }}>
                  Not sleeping
                </AppText>
                <Pressable onPress={toggleSleep} style={{ marginTop: 8, backgroundColor: nightColors.timerPillBg, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 28 }}>
                  <AppText weight={800} size={14} color={nightColors.timerPillText}>
                    Start sleep
                  </AppText>
                </Pressable>
              </>
            )}
          </View>

          {voiceEnabled && (
            <View style={{ marginBottom: 16 }}>
              <VoiceBar dim label="Whisper to log — dim & silent" />
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={() => logQuickEvent('bottle')}
              style={{ flex: 1, backgroundColor: theme.surface, borderRadius: 22, padding: 18, gap: 6, borderWidth: 1, borderColor: theme.border }}
            >
              <AppText size={22}>🍼</AppText>
              <AppText weight={800} size={15} color={theme.ink}>
                Night feed
              </AppText>
              <AppText weight={700} size={11.5} color={theme.textSecondary}>
                {lastBottle ? `Last ${clockTime(lastBottle.time)}` : 'No feeds yet'}
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => logQuickEvent('diaper')}
              style={{ flex: 1, backgroundColor: theme.surface, borderRadius: 22, padding: 18, gap: 6, borderWidth: 1, borderColor: theme.border }}
            >
              <AppText size={22}>💧</AppText>
              <AppText weight={800} size={15} color={theme.ink}>
                Diaper
              </AppText>
              <AppText weight={700} size={11.5} color={theme.textSecondary}>
                {lastDiaper ? `Last ${clockTime(lastDiaper.time)}` : 'No diapers yet'}
              </AppText>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
