import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { MicIcon, CheckIcon } from '../../components/icons';
import { useStore } from '../../lib/store';
import { useTheme } from '../../theme/ThemeProvider';
import { parseVoiceTranscript } from '../../lib/voiceParser';
import { useVoiceRecognition } from '../../lib/useVoiceRecognition';
import { VoicePermissions } from '../../types/models';
import { navigate } from '../../navigation/navigationRef';

const BAR_HEIGHTS = [14, 30, 48, 36, 50, 22, 40, 16];

function isAutoLoggable(eventType: string, perms: VoicePermissions): boolean {
  if (eventType === 'bottle' || eventType === 'solids') return perms.bottle;
  if (eventType === 'sleep') return perms.sleep;
  if (eventType === 'diaper') return perms.diaper;
  if (eventType === 'pump') return perms.pump;
  return false;
}

const FORM_ROUTES: Record<string, string> = {
  vaccine: 'VaccineForm',
  'medicine-form': 'MedicineForm',
  'sickness-form': 'SicknessForm',
};

export function VoiceListeningSheet() {
  const theme = useTheme();
  const visible = useStore((s) => s.voiceSheetVisible);
  const holdActive = useStore((s) => s.voiceHoldActive);
  const liveTranscript = useStore((s) => s.liveTranscript);
  const setLiveTranscript = useStore((s) => s.setLiveTranscript);
  const voiceDraft = useStore((s) => s.voiceDraft);
  const setVoiceDraft = useStore((s) => s.setVoiceDraft);
  const applyVoiceDraft = useStore((s) => s.applyVoiceDraft);
  const closeVoiceSheet = useStore((s) => s.closeVoiceSheet);
  const voicePermissions = useStore((s) => s.settings.voicePermissions);

  const [secondsLeft, setSecondsLeft] = useState(3);
  const [countdownActive, setCountdownActive] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { start, stop } = useVoiceRecognition((text) => setLiveTranscript(text));

  // start/stop native recognition in lockstep with the press-and-hold gesture
  useEffect(() => {
    if (visible && holdActive) {
      start();
    } else if (visible && !holdActive && !voiceDraft) {
      stop().then((finalText) => {
        const text = finalText || liveTranscript;
        const draft = parseVoiceTranscript(text);
        setVoiceDraft(draft);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, holdActive]);

  // form-only results: hand off to the relevant screen almost immediately
  useEffect(() => {
    if (!voiceDraft || !voiceDraft.recognized) return;
    const route = FORM_ROUTES[voiceDraft.eventType as string];
    if (route) {
      const t = setTimeout(() => {
        navigate(route);
        closeVoiceSheet();
      }, 900);
      return () => clearTimeout(t);
    }
  }, [voiceDraft]);

  // auto-loggable results: 3s undo countdown
  useEffect(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (!voiceDraft || !voiceDraft.recognized || FORM_ROUTES[voiceDraft.eventType as string]) return;
    const allowed = isAutoLoggable(voiceDraft.eventType as string, voicePermissions);
    if (!allowed) return;
    setSecondsLeft(3);
    setCountdownActive(true);
    countdownRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          applyVoiceDraft();
          closeVoiceSheet();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [voiceDraft]);

  if (!visible) return null;

  const listening = holdActive;
  const notRecognized = voiceDraft && !voiceDraft.recognized;
  const isForm = voiceDraft?.recognized && FORM_ROUTES[voiceDraft.eventType as string];
  const allowedAutoLog = voiceDraft?.recognized && !isForm ? isAutoLoggable(voiceDraft.eventType as string, voicePermissions) : false;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={closeVoiceSheet}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(32,25,20,0.45)', justifyContent: 'flex-end' }} onPress={notRecognized ? closeVoiceSheet : undefined}>
        <View
          style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 36,
            borderTopRightRadius: 36,
            paddingHorizontal: 24,
            paddingTop: 28,
            paddingBottom: 40,
            alignItems: 'center',
            shadowColor: '#43382F',
            shadowOpacity: 0.2,
            shadowOffset: { width: 0, height: -12 },
            shadowRadius: 40,
            elevation: 12,
          }}
        >
          <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: '#EBDCC9', marginBottom: 26 }} />

          {listening && (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 52, marginBottom: 8 }}>
                {BAR_HEIGHTS.map((h, i) => (
                  <View key={i} style={{ width: 5, height: h, borderRadius: 3, backgroundColor: i % 3 === 0 ? '#F0C4A8' : '#E98862' }} />
                ))}
              </View>
              <AppText weight={800} size={12} color="#C96F4A" letterSpacing={2} uppercase style={{ marginBottom: 18 }}>
                Listening…
              </AppText>
              <AppText weight={800} size={22} color="#43382F" center style={{ lineHeight: 30, marginBottom: 24 }}>
                {liveTranscript ? `"${liveTranscript}"` : 'Say what happened…'}
              </AppText>
              <AppText weight={700} size={12} color="#B39F8D" style={{ marginTop: 4 }}>
                Release to finish
              </AppText>
            </>
          )}

          {!listening && voiceDraft?.recognized && (
            <>
              <View style={{ width: '100%', backgroundColor: '#FBF4EC', borderRadius: 22, padding: 16, marginBottom: 18 }}>
                <AppText weight={800} size={11} color="#B39F8D" letterSpacing={1} uppercase style={{ marginBottom: 10 }}>
                  {isForm ? 'Got it — opening form' : 'Got it — logging'}
                </AppText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFDCC2', alignItems: 'center', justifyContent: 'center' }}>
                    <AppText size={20}>{voiceDraft.icon}</AppText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText weight={900} size={16} color="#43382F">
                      {voiceDraft.title}
                    </AppText>
                    <AppText weight={700} size={12.5} color="#9B8B7D">
                      {voiceDraft.detail}
                    </AppText>
                  </View>
                  {!isForm && (
                    <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#DCE8CE', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckIcon color="#43602A" />
                    </View>
                  )}
                </View>
              </View>

              {!isForm && (
                <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                  <Pressable
                    onPress={() => {
                      setCountdownActive(false);
                      if (countdownRef.current) clearInterval(countdownRef.current);
                    }}
                    style={{ flex: 1, backgroundColor: '#F0E4D2', borderRadius: 999, paddingVertical: 14, alignItems: 'center' }}
                  >
                    <AppText weight={800} size={14.5} color="#7C6E5F">
                      Edit
                    </AppText>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      applyVoiceDraft();
                      closeVoiceSheet();
                    }}
                    style={{ flex: 2, backgroundColor: '#E98862', borderRadius: 999, paddingVertical: 14, alignItems: 'center' }}
                  >
                    <AppText weight={800} size={14.5} color="#fff">
                      {countdownActive && allowedAutoLog ? `Saving in ${secondsLeft}… tap to keep` : 'Tap to save'}
                    </AppText>
                  </Pressable>
                </View>
              )}
              <AppText weight={700} size={12} color="#B39F8D" style={{ marginTop: 14 }}>
                Also try: "pee diaper now" · "slept 2 to 4" · "gave vitamin D"
              </AppText>
            </>
          )}

          {notRecognized && (
            <>
              <AppText weight={900} size={20} color="#43382F" center style={{ marginBottom: 8 }}>
                Didn't catch that
              </AppText>
              <AppText weight={600} size={13.5} color="#9B8B7D" center style={{ marginBottom: 18 }}>
                Try again, or log it manually:
              </AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 14 }}>
                {(['bottle', 'sleep', 'diaper', 'solids', 'pump', 'medicine'] as const).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => {
                      if (t === 'sleep') useStore.getState().toggleSleep();
                      else useStore.getState().logQuickEvent(t);
                      closeVoiceSheet();
                    }}
                    style={{ backgroundColor: '#F0E4D2', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 }}
                  >
                    <AppText weight={700} size={13} color="#7C6E5F">
                      {t}
                    </AppText>
                  </Pressable>
                ))}
              </View>
              <Pressable onPress={closeVoiceSheet} style={{ paddingVertical: 8 }}>
                <AppText weight={800} size={13} color="#C96F4A">
                  Close
                </AppText>
              </Pressable>
            </>
          )}

          {!listening && !voiceDraft && (
            <View style={{ height: 52, alignItems: 'center', justifyContent: 'center' }}>
              <MicIcon size={20} color="#E98862" />
            </View>
          )}
        </View>
      </Pressable>
    </Modal>
  );
}
