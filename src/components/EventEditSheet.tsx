import React, { useEffect, useState } from 'react';
import { Modal, Pressable, TextInput, View } from 'react-native';
import { AppText } from './AppText';
import { useStore } from '../lib/store';
import { useTheme } from '../theme/ThemeProvider';
import { SleepEvent, TimelineEvent } from '../types/models';

function toTimeInput(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function applyTimeInput(iso: string, hhmm: string): string | null {
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h > 23 || min > 59) return null;
  const d = new Date(iso);
  d.setHours(h, min, 0, 0);
  return d.toISOString();
}

const TITLES: Record<TimelineEvent['type'], string> = {
  bottle: 'Edit bottle feed',
  sleep: 'Edit sleep',
  diaper: 'Edit diaper',
  solids: 'Edit solids',
  pump: 'Edit pumping',
  medicine: 'Edit medicine',
};

export function EventEditSheet() {
  const theme = useTheme();
  const editingEventId = useStore((s) => s.editingEventId);
  const setEditingEvent = useStore((s) => s.setEditingEvent);
  const updateEvent = useStore((s) => s.updateEvent);
  const deleteEvent = useStore((s) => s.deleteEvent);
  const event = useStore((s) => s.events.find((e) => e.id === s.editingEventId));

  const [time, setTime] = useState('');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    if (!event) return;
    const iso = 'time' in event ? event.time : event.startTime;
    setTime(toTimeInput(iso));
    setQuantity('quantityMl' in event && event.quantityMl != null ? String(event.quantityMl) : '');
  }, [editingEventId]);

  if (!event) return null;

  const isFeed = event.type === 'bottle' || event.type === 'pump';
  const timeField: 'time' | 'startTime' = 'time' in event ? 'time' : 'startTime';
  const currentIso = 'time' in event ? event.time : (event as SleepEvent).startTime;

  const save = () => {
    const patch: Record<string, unknown> = {};
    const newIso = applyTimeInput(currentIso, time);
    if (newIso) patch[timeField] = newIso;
    if (isFeed && quantity) patch.quantityMl = parseInt(quantity, 10) || undefined;
    updateEvent(event.id, patch as Partial<TimelineEvent>);
    setEditingEvent(null);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => setEditingEvent(null)}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(32,25,20,0.35)', justifyContent: 'flex-end' }} onPress={() => setEditingEvent(null)}>
        <Pressable
          style={{
            backgroundColor: theme.mode === 'night' ? theme.surface : '#fff',
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            padding: 24,
            paddingBottom: 40,
          }}
        >
          <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: theme.border, alignSelf: 'center', marginBottom: 20 }} />
          <AppText weight={900} size={20} color={theme.ink} style={{ marginBottom: 18 }}>
            {TITLES[event.type]}
          </AppText>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 18 }}>
            <View style={{ flex: 1, backgroundColor: theme.mode === 'night' ? theme.bg : '#FBF4EC', borderRadius: 18, padding: 14, paddingHorizontal: 18 }}>
              <AppText weight={800} size={11} color={theme.textTertiary} letterSpacing={1} uppercase>
                Time
              </AppText>
              <TextInput
                value={time}
                onChangeText={setTime}
                placeholder="HH:MM"
                placeholderTextColor={theme.textTertiary}
                keyboardType="numbers-and-punctuation"
                style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 18, color: theme.ink, padding: 0, marginTop: 2 }}
              />
            </View>
            {isFeed && (
              <View style={{ flex: 1, backgroundColor: theme.mode === 'night' ? theme.bg : '#FBF4EC', borderRadius: 18, padding: 14, paddingHorizontal: 18 }}>
                <AppText weight={800} size={11} color={theme.textTertiary} letterSpacing={1} uppercase>
                  Amount (ml)
                </AppText>
                <TextInput
                  value={quantity}
                  onChangeText={(t) => setQuantity(t.replace(/[^0-9]/g, ''))}
                  placeholder="120"
                  placeholderTextColor={theme.textTertiary}
                  keyboardType="numeric"
                  style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 18, color: theme.ink, padding: 0, marginTop: 2 }}
                />
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={() => deleteEvent(event.id)}
              style={{ flex: 1, backgroundColor: '#F7D6DC', borderRadius: 999, paddingVertical: 14, alignItems: 'center' }}
            >
              <AppText weight={800} size={14.5} color="#A04E63">
                Delete
              </AppText>
            </Pressable>
            <Pressable
              onPress={save}
              style={{ flex: 2, backgroundColor: theme.coral, borderRadius: 999, paddingVertical: 14, alignItems: 'center', ...theme.ctaShadow }}
            >
              <AppText weight={800} size={14.5} color="#fff">
                Save changes
              </AppText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
