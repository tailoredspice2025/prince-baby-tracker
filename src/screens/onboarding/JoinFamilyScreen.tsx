import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/Button';
import { FormField } from '../../components/FormField';
import { useStore } from '../../lib/store';
import { useTheme } from '../../theme/ThemeProvider';
import { radii } from '../../theme/tokens';

export function JoinFamilyScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const joinFamilyWithCode = useStore((s) => s.joinFamilyWithCode);
  const onboarded = useStore((s) => s.onboarded);
  const [code, setCode] = useState('');
  const [myName, setMyName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const join = async () => {
    setBusy(true);
    setError(null);
    const result = await joinFamilyWithCode(code, myName.trim());
    setBusy(false);
    if (result === 'ok') {
      // store flips onboarded=true, which unmounts the onboarding stack
      if (navigation.canGoBack()) navigation.goBack();
    } else if (result === 'invalid-code') {
      setError("That code isn't valid — it may have expired (codes last 24 h). Ask for a fresh one.");
    } else {
      setError("Couldn't reach the server. Check your connection and try again.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <AppText weight={900} size={28} color={theme.ink} style={{ marginTop: 12 }}>
          Join your family
        </AppText>
        <AppText weight={600} size={14} color={theme.textSecondary} style={{ marginTop: 6, marginBottom: 24 }}>
          Already tracking on another phone? Enter the invite code shown there and everything — baby profile, feeds,
          sleep, growth — appears here.
        </AppText>

        <View style={{ gap: 12 }}>
          <FormField
            label="Invite code"
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
            placeholder="e.g. K7M3PQ"
          />
          <FormField label="Your name (shown next to what you log)" value={myName} onChangeText={setMyName} placeholder="e.g. Mum" />
        </View>

        {onboarded && (
          <View style={{ backgroundColor: '#FDEBD3', borderRadius: radii.cardLg, padding: 14, marginTop: 14 }}>
            <AppText weight={700} size={12.5} color="#8A5A2B">
              Heads up: joining replaces what's on this phone with the family's shared data. If you've been logging
              separately here, those entries won't carry over.
            </AppText>
          </View>
        )}

        {error && (
          <AppText weight={700} size={13} color={theme.coralDeep} style={{ marginTop: 14 }}>
            {error}
          </AppText>
        )}

        <View style={{ flex: 1, minHeight: 24 }} />
        {busy && <ActivityIndicator color={theme.coral} style={{ marginBottom: 12 }} />}
        <PrimaryButton label={busy ? 'Joining…' : 'Join family'} onPress={join} disabled={busy || code.length !== 6 || !myName.trim()} />
        <Pressable onPress={() => navigation.goBack()} style={{ paddingVertical: 12 }}>
          <AppText weight={700} size={14} color={theme.textSecondary} center>
            Back
          </AppText>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
