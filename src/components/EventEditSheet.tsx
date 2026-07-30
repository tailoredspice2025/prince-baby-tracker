import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppText } from './AppText';
import { Segmented } from './Segmented';
import { useStore } from '../lib/store';
import { useTheme } from '../theme/ThemeProvider';
import { durationLabel } from '../lib/time';
import { DiaperEvent, FeedEvent, MedicineEvent, SleepEvent, TimelineEvent } from '../types/models';

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

const DIAPER_KINDS = [
  { key: 'wet' as const, label: 'Wet' },
  { key: 'dirty' as const, label: 'Dirty' },
  { key: 'both' as const, label: 'Both' },
];
const PUMP_SIDES = [
  { key: 'left' as const, label: 'Left' },
  { key: 'right' as const, label: 'Right' },
  { key: 'both' as const, label: 'Both' },
];
const COMMON_FOODS = ['pear', 'apple', 'banana', 'carrot', 'oat cereal', 'sweet potato'];

/**
 * Every event type is editable on every field that distinguishes it.
 *
 * This used to edit the time plus an amount for bottle and pump only, so the
 * food on a solids entry, the kind on a diaper, the name/dose on a medicine
 * and the *end* of a sleep were all written once from a default and could
 * never be corrected. Sleep was the worst case: saving wrote `startTime` and
 * left `endTime` alone, so fixing a mis-tapped start silently rewrote the
 * derived duration that feeds the daily totals and the trend chart.
 */
export function EventEditSheet() {
  const theme = useTheme();
  const editingEventId = useStore((s) => s.editingEventId);
  const setEditingEvent = useStore((s) => s.setEditingEvent);
  const updateEvent = useStore((s) => s.updateEvent);
  const deleteEvent = useStore((s) => s.deleteEvent);
  const event = useStore((s) => s.events.find((e) => e.id === s.editingEventId));

  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [quantity, setQuantity] = useState('');
  const [food, setFood] = useState('');
  const [kind, setKind] = useState<DiaperEvent['kind']>('wet');
  const [side, setSide] = useState<'left' | 'right' | 'both'>('left');
  const [medName, setMedName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [picking, setPicking] = useState<'start' | 'end' | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!event) return;
    const startIso = 'time' in event ? event.time : event.startTime;
    setStartDate(new Date(startIso));
    setEndDate(new Date(event.type === 'sleep' ? (event as SleepEvent).endTime ?? startIso : startIso));
    setQuantity('quantityMl' in event && event.quantityMl != null ? String(event.quantityMl) : '');
    setFood(event.type === 'solids' ? (event as FeedEvent).food ?? '' : '');
    setKind(event.type === 'diaper' ? (event as DiaperEvent).kind : 'wet');
    setSide(event.type === 'pump' ? (event as FeedEvent).side ?? 'left' : 'left');
    setMedName(event.type === 'medicine' ? (event as MedicineEvent).name : '');
    setMedDose(event.type === 'medicine' ? (event as MedicineEvent).dose ?? '' : '');
    setPicking(null);
    setDirty(false);
  }, [editingEventId]);

  if (!event) return null;

  const isSleep = event.type === 'sleep';
  const hasAmount = event.type === 'bottle' || event.type === 'pump';
  const fieldBg = theme.mode === 'night' ? theme.bg : '#FBF4EC';
  const touch = () => setDirty(true);

  // A sleep that ends "earlier" than it starts crossed midnight — the common
  // case for a night sleep — so roll the end forward rather than showing a
  // negative duration.
  const resolvedEnd = () => {
    const s = new Date(withTimeOfDay((event as SleepEvent).startTime, startDate));
    const endIso = withTimeOfDay((event as SleepEvent).endTime ?? (event as SleepEvent).startTime, endDate);
    let e = new Date(endIso);
    if (e <= s) e = new Date(e.getTime() + 24 * 3600 * 1000);
    return { start: s, end: e };
  };
  const sleepMs = isSleep ? resolvedEnd().end.getTime() - resolvedEnd().start.getTime() : 0;
  const sleepTooLong = isSleep && sleepMs > 18 * 3600 * 1000;

  const close = () => {
    setPicking(null);
    setEditingEvent(null);
  };

  const save = () => {
    const patch: Record<string, unknown> = {};
    if (isSleep) {
      // Both ends move together — the duration is derived from the pair, and
      // the daily sleep total reads that derived value.
      const { start, end } = resolvedEnd();
      patch.startTime = start.toISOString();
      patch.endTime = end.toISOString();
    } else {
      patch.time = withTimeOfDay((event as { time: string }).time, startDate);
    }
    if (hasAmount && quantity) patch.quantityMl = parseInt(quantity, 10) || undefined;
    if (event.type === 'pump') patch.side = side;
    if (event.type === 'solids') patch.food = food.trim() || undefined;
    if (event.type === 'diaper') patch.kind = kind;
    if (event.type === 'medicine') {
      patch.name = medName.trim() || 'Medicine';
      patch.dose = medDose.trim();
    }
    updateEvent(event.id, patch as Partial<TimelineEvent>);
    close();
  };

  const bumpQuantity = (delta: number) => {
    setQuantity(String(Math.max(0, (parseInt(quantity, 10) || 0) + delta)));
    touch();
  };

  const timeButton = (label: string, value: Date, target: 'start' | 'end') => (
    <Pressable
      onPress={() => setPicking((p) => (p === target ? null : target))}
      style={{ flex: 1, backgroundColor: fieldBg, borderRadius: 18, padding: 14, paddingHorizontal: 18 }}
    >
      <AppText weight={800} size={11} color={theme.textTertiary} letterSpacing={1} uppercase>
        {label}
      </AppText>
      <AppText weight={800} size={18} color={theme.ink} style={{ marginTop: 2 }}>
        {value.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} ▾
      </AppText>
    </Pressable>
  );

  const onPicked = (d?: Date) => {
    if (!d) return;
    if (picking === 'end') setEndDate(d);
    else setStartDate(d);
    touch();
  };

  const labelStyle = { marginBottom: 6 } as const;

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
            {/* Times — sleep carries both ends, everything else carries one */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              {isSleep ? (
                <>
                  {timeButton('Fell asleep', startDate, 'start')}
                  {timeButton('Woke up', endDate, 'end')}
                </>
              ) : (
                timeButton('Time', startDate, 'start')
              )}
            </View>

            {isSleep && (
              <View style={{ backgroundColor: fieldBg, borderRadius: 18, padding: 14, paddingHorizontal: 18, marginBottom: 12 }}>
                <AppText weight={800} size={11} color={theme.textTertiary} letterSpacing={1} uppercase>
                  Slept for
                </AppText>
                <AppText weight={900} size={20} color={theme.ink} style={{ marginTop: 2 }}>
                  {durationLabel(sleepMs)}
                </AppText>
                {sleepTooLong && (
                  <AppText weight={700} size={12} color="#A04E63" style={{ marginTop: 4 }}>
                    That's over 18 hours — check the times before saving.
                  </AppText>
                )}
              </View>
            )}

            {Platform.OS === 'ios' && picking && (
              <View style={{ backgroundColor: fieldBg, borderRadius: 18, marginBottom: 12 }}>
                <DateTimePicker
                  value={picking === 'end' ? endDate : startDate}
                  mode="time"
                  display="spinner"
                  onChange={(_e, d) => onPicked(d)}
                />
              </View>
            )}
            {Platform.OS === 'android' && picking && (
              <DateTimePicker
                value={picking === 'end' ? endDate : startDate}
                mode="time"
                display="default"
                onChange={(e, d) => {
                  setPicking(null);
                  if (e.type === 'set') onPicked(d);
                }}
              />
            )}

            {hasAmount && (
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
                      touch();
                    }}
                    placeholder="120"
                    placeholderTextColor={theme.textTertiary}
                    keyboardType="numeric"
                    returnKeyType="done"
                    style={{ flex: 1, textAlign: 'center', fontFamily: 'Nunito_800ExtraBold', fontSize: 22, color: theme.ink, padding: 0 }}
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

            {event.type === 'pump' && (
              <View style={{ marginBottom: 12 }}>
                <AppText weight={800} size={11} color={theme.textTertiary} letterSpacing={1} uppercase style={labelStyle}>
                  Side
                </AppText>
                <Segmented
                  options={PUMP_SIDES}
                  value={side}
                  onChange={(k) => {
                    setSide(k);
                    touch();
                  }}
                  compact
                />
              </View>
            )}

            {event.type === 'diaper' && (
              <View style={{ marginBottom: 12 }}>
                <AppText weight={800} size={11} color={theme.textTertiary} letterSpacing={1} uppercase style={labelStyle}>
                  Kind
                </AppText>
                <Segmented
                  options={DIAPER_KINDS}
                  value={kind}
                  onChange={(k) => {
                    setKind(k);
                    touch();
                  }}
                  compact
                />
              </View>
            )}

            {event.type === 'solids' && (
              <View style={{ marginBottom: 12 }}>
                <View style={{ backgroundColor: fieldBg, borderRadius: 18, padding: 14, paddingHorizontal: 18 }}>
                  <AppText weight={800} size={11} color={theme.textTertiary} letterSpacing={1} uppercase>
                    Food
                  </AppText>
                  <TextInput
                    value={food}
                    onChangeText={(t) => {
                      setFood(t);
                      touch();
                    }}
                    placeholder="pear"
                    placeholderTextColor={theme.textTertiary}
                    returnKeyType="done"
                    style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 18, color: theme.ink, padding: 0, marginTop: 2 }}
                  />
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                  {COMMON_FOODS.map((f) => (
                    <Pressable
                      key={f}
                      onPress={() => {
                        setFood(f);
                        touch();
                      }}
                      style={{ backgroundColor: food === f ? theme.coral : theme.border, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14 }}
                    >
                      <AppText weight={800} size={12.5} color={food === f ? '#fff' : theme.textSecondary}>
                        {f}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {event.type === 'medicine' && (
              <>
                <View style={{ backgroundColor: fieldBg, borderRadius: 18, padding: 14, paddingHorizontal: 18, marginBottom: 12 }}>
                  <AppText weight={800} size={11} color={theme.textTertiary} letterSpacing={1} uppercase>
                    Medicine
                  </AppText>
                  <TextInput
                    value={medName}
                    onChangeText={(t) => {
                      setMedName(t);
                      touch();
                    }}
                    placeholder="Vitamin D drops"
                    placeholderTextColor={theme.textTertiary}
                    returnKeyType="done"
                    style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 18, color: theme.ink, padding: 0, marginTop: 2 }}
                  />
                </View>
                <View style={{ backgroundColor: fieldBg, borderRadius: 18, padding: 14, paddingHorizontal: 18, marginBottom: 12 }}>
                  <AppText weight={800} size={11} color={theme.textTertiary} letterSpacing={1} uppercase>
                    Dose
                  </AppText>
                  <TextInput
                    value={medDose}
                    onChangeText={(t) => {
                      setMedDose(t);
                      touch();
                    }}
                    placeholder="400 IU"
                    placeholderTextColor={theme.textTertiary}
                    returnKeyType="done"
                    style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 18, color: theme.ink, padding: 0, marginTop: 2 }}
                  />
                </View>
              </>
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
