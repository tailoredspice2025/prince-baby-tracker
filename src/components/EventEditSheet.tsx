import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppText } from './AppText';
import { useStore } from '../lib/store';
import { useTheme } from '../theme/ThemeProvider';
import { SleepEvent, TimelineEvent } from '../types/models';

/** Applies a picked time's hours/minutes onto the event's original date, so
 * editing the time never silently moves the entry to another day. */
function withTimeOfDay(iso: string, picked: Date): string {
  const d = new Date(iso);
  d.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
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

  const [timeDate, setTimeDate] = useState<Date>(new Date());
  const [quantity, setQuantity] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!event) return;
    const iso = 'time' in event ? event.time : event.startTime;
    setTimeDate(new Date(iso));
    setQuantity('quantityMl' in event && event.quantityMl != null ? String(event.quantityMl) : '');
    setPickerOpen(false);
    setDirty(false);
  }, [editingEventId]);

  if (!event) return null;

  const isFeed = event.type === 'bottle' || event.type === 'pump';
  const timeField: 'time' | 'startTime' = 'time' in event ? 'time' : 'startTime';
  const currentIso = 'time' in event ? event.time : (event as SleepEvent).startTime;
  const fieldBg = theme.mode === 'night' ? theme.bg : '#FBF4EC';

  const close = () => {
    setPickerOpen(false);
    setEditingEvent(null);
  };

  const save = () => {
    const patch: Record<string, unknown> = { [timeField]: withTimeOfDay(currentIso, timeDate) };
    if (isFeed && quantity) patch.quantityMl = parseInt(quantity, 10) || undefined;
    updateEvent(event.id, patch as Partial<TimelineEvent>);
    close();
  };

  const bumpQuantity = (delta: number) => {
    const next = Math.max(0, (parseInt(quantity, 10) || 0) + delta);
    setQuantity(String(next));
    setDirty(true);
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(32,25,20,0.35)' }}
      >
        {/* Backdrop only dismisses while nothing has been changed — tapping
            away used to silently discard an in-progress edit. */}
        <Pressable style={{ flex: 1 }} onPress={() => !dirty && close()} />
        <View
          style={{
            backgroundColor: theme.mode === 'night' ? theme.surface : '#fff',
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: Platform.OS === 'ios' ? 34 : 24,
            maxHeight: '85%',
          }}
        >
          <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: theme.border, alignSelf: 'center', marginBottom: 14 }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <AppText weight={900} size={20} color={theme.ink} style={{ flex: 1 }}>
              {TITLES[event.type]}
            </AppText>
            <Pressable onPress={close} hitSlop={12} style={{ paddingHorizontal: 6, paddingVertical: 2 }}>
              <AppText weight={800} size={14} color={theme.textSecondary}>
                Cancel
              </AppText>
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" style={{ flexGrow: 0 }}>
            {/* Time — tap to pick, no typing */}
            <Pressable
              onPress={() => setPickerOpen((o) => !o)}
              style={{ backgroundColor: fieldBg, borderRadius: 18, padding: 14, paddingHorizontal: 18, marginBottom: 12 }}
            >
              <AppText weight={800} size={11} color={theme.textTertiary} letterSpacing={1} uppercase>
                Time
              </AppText>
              <AppText weight={800} size={18} color={theme.ink} style={{ marginTop: 2 }}>
                {timeDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} ▾
              </AppText>
            </Pressable>

            {Platform.OS === 'ios' && pickerOpen && (
              <View style={{ backgroundColor: fieldBg, borderRadius: 18, marginBottom: 12 }}>
                <DateTimePicker
                  value={timeDate}
                  mode="time"
                  display="spinner"
                  onChange={(_e, d) => {
                    if (d) {
                      setTimeDate(d);
                      setDirty(true);
                    }
                  }}
                />
              </View>
            )}
            {Platform.OS === 'android' && pickerOpen && (
              <DateTimePicker
                value={timeDate}
                mode="time"
                display="default"
                onChange={(e, d) => {
                  setPickerOpen(false);
                  if (e.type === 'set' && d) {
                    setTimeDate(d);
                    setDirty(true);
                  }
                }}
              />
            )}

            {isFeed && (
              <View style={{ backgroundColor: fieldBg, borderRadius: 18, padding: 14, paddingHorizontal: 18, marginBottom: 12 }}>
                <AppText weight={800} size={11} color={theme.textTertiary} letterSpacing={1} uppercase>
                  Amount (ml)
                </AppText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
                  <Pressable
                    onPress={() => bumpQuantity(-10)}
                    hitSlop={8}
                    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <AppText weight={900} size={20} color={theme.ink}>
                      −
                    </AppText>
                  </Pressable>
                  <TextInput
                    value={quantity}
                    onChangeText={(t) => {
                      setQuantity(t.replace(/[^0-9]/g, ''));
                      setDirty(true);
                    }}
                    placeholder="120"
                    placeholderTextColor={theme.textTertiary}
                    keyboardType="numeric"
                    returnKeyType="done"
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      fontFamily: 'Nunito_800ExtraBold',
                      fontSize: 22,
                      color: theme.ink,
                      padding: 0,
                    }}
                  />
                  <Pressable
                    onPress={() => bumpQuantity(10)}
                    hitSlop={8}
                    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <AppText weight={900} size={20} color={theme.ink}>
                      +
                    </AppText>
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Actions stay pinned below the fields and above the keyboard */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
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
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
