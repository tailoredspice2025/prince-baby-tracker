import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/Button';
import { FormField } from '../../components/FormField';
import { useStore } from '../../lib/store';
import { createInviteCode } from '../../lib/firestoreSync';
import { useTheme } from '../../theme/ThemeProvider';
import { radii } from '../../theme/tokens';

export function InviteCaregiverScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const familyId = useStore((s) => s.familyId);
  const createFamilyAndLink = useStore((s) => s.createFamilyAndLink);
  const pushToast = useStore((s) => s.pushToast);
  const baby = useStore((s) => s.activeBaby());
  // prefill from the name already set in Profile / onboarding
  const savedName = useStore((s) => s.myName());
  const [myName, setMyName] = useState(savedName === 'You' ? '' : savedName);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  const linked = familyId != null;

  const turnOn = async () => {
    setBusy(true);
    try {
      await createFamilyAndLink(myName.trim());
      const c = await createInviteCode(useStore.getState().familyId!);
      setCode(c);
    } catch {
      pushToast({ message: "Couldn't reach the server — check your connection and try again" });
    } finally {
      setBusy(false);
    }
  };

  const makeCode = async () => {
    if (!familyId) return;
    setBusy(true);
    try {
      setCode(await createInviteCode(familyId));
    } catch {
      pushToast({ message: "Couldn't create a code — try again" });
    } finally {
      setBusy(false);
    }
  };

  const shareCode = () => {
    if (!code) return;
    Share.share({
      message: `Join me on DenBaby to track ${baby.name} together! Open the app, choose "Join your family" and enter the code ${code} (valid for 24 hours).`,
    }).catch(() => {});
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <AppText weight={900} size={26} color={theme.ink} style={{ marginBottom: 6 }}>
          Invite a caregiver
        </AppText>
        <AppText weight={600} size={13.5} color={theme.textSecondary} style={{ marginBottom: 20 }}>
          Share one code and both phones log to the same baby — feeds, sleep, and diapers appear on each other's
          timeline within seconds.
        </AppText>

        {!linked && !code && (
          <View style={{ gap: 12 }}>
            <View style={{ backgroundColor: theme.surface, borderRadius: radii.cardLg, padding: 16, ...theme.cardShadow }}>
              <AppText weight={700} size={13} color={theme.textSecondary}>
                Turning this on moves {baby.name}'s data into secure family sync so other caregivers can see it. Your
                history stays exactly as it is — it just becomes shared.
              </AppText>
            </View>
            <FormField label="Your name (shown next to what you log)" value={myName} onChangeText={setMyName} placeholder="e.g. Dad" />
            <PrimaryButton label={busy ? 'Setting up…' : 'Turn on family sync'} onPress={turnOn} disabled={busy || !myName.trim()} />
            {busy && <ActivityIndicator color={theme.coral} />}
          </View>
        )}

        {linked && !code && (
          <PrimaryButton label={busy ? 'Creating code…' : 'Create invite code'} onPress={makeCode} disabled={busy} />
        )}

        {code && (
          <View style={{ gap: 14 }}>
            <View
              style={{
                backgroundColor: theme.surface,
                borderRadius: radii.cardXxl,
                paddingVertical: 28,
                alignItems: 'center',
                ...theme.cardShadow,
              }}
            >
              <AppText weight={800} size={11} color={theme.textTertiary} letterSpacing={1} uppercase>
                Invite code · valid 24 h
              </AppText>
              <AppText weight={900} size={44} color={theme.ink} letterSpacing={6} style={{ marginTop: 6 }}>
                {code}
              </AppText>
            </View>
            <PrimaryButton label="Share code" onPress={shareCode} />
            <Pressable onPress={makeCode} disabled={busy}>
              <AppText weight={700} size={13} color={theme.coralDeep} center>
                Generate a new code
              </AppText>
            </Pressable>
            <AppText weight={600} size={12.5} color={theme.textTertiary} center>
              On the other phone: install DenBaby, choose “Join your family” on the first screen, and enter this code.
            </AppText>
          </View>
        )}

        <View style={{ flex: 1, minHeight: 24 }} />
        <Pressable onPress={() => navigation.goBack()} style={{ paddingVertical: 12 }}>
          <AppText weight={700} size={14} color={theme.textSecondary} center>
            Done
          </AppText>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
