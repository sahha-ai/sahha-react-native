import { useState } from 'react';
import type * as React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useAppTheme } from '../theme';
import type { AppTheme } from '../theme';

export interface DateRangeSelectorProps {
  start: Date;
  end: Date;
  onChange: (start: Date, end: Date) => void;
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

type PresetId = 'today' | 'yesterday' | 'last24h' | 'last7days' | 'last30days';

const PRESETS: readonly { id: PresetId; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'last24h', label: 'Last 24h' },
  { id: 'last7days', label: 'Last 7 days' },
  { id: 'last30days', label: 'Last 30 days' },
];

/** Mirrors `DateRangePreset.resolve` from the Flutter example app. */
function resolvePreset(id: PresetId, now: Date): [Date, Date] {
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  switch (id) {
    case 'today':
      return [startOfToday, now];
    case 'yesterday':
      return [new Date(startOfToday.getTime() - DAY_MS), startOfToday];
    case 'last24h':
      return [new Date(now.getTime() - 24 * HOUR_MS), now];
    case 'last7days':
      return [new Date(now.getTime() - 7 * DAY_MS), now];
    case 'last30days':
      return [new Date(now.getTime() - 30 * DAY_MS), now];
  }
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** `3 Aug, 14:05` */
function formatDateTime(date: Date): string {
  const month = MONTHS[date.getMonth()] ?? '';
  return `${date.getDate()} ${month}, ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

/**
 * Start/end date-time controls shared by the query screens: preset chips plus
 * two tappable tiles that open the platform pickers. Android chains the date
 * dialog into the time dialog; iOS reveals an inline spinner.
 */
export function DateRangeSelector({
  start,
  end,
  onChange,
}: DateRangeSelectorProps): React.JSX.Element {
  const theme = useAppTheme();
  const [iosTarget, setIosTarget] = useState<'start' | 'end' | null>(null);

  // Clamps like the Flutter selector: moving start past end drags end with
  // it, and moving end before start drags start back.
  const commit = (isStart: boolean, picked: Date) => {
    if (isStart) {
      onChange(picked, picked.getTime() > end.getTime() ? picked : end);
    } else {
      onChange(picked.getTime() < start.getTime() ? picked : start, picked);
    }
  };

  const openPicker = (isStart: boolean) => {
    const current = isStart ? start : end;
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        is24Hour: true,
        onChange: (dateEvent: DateTimePickerEvent, pickedDate?: Date) => {
          if (dateEvent.type !== 'set' || !pickedDate) {
            return;
          }
          DateTimePickerAndroid.open({
            value: pickedDate,
            mode: 'time',
            is24Hour: true,
            onChange: (timeEvent: DateTimePickerEvent, pickedTime?: Date) => {
              if (timeEvent.type !== 'set' || !pickedTime) {
                return;
              }
              commit(isStart, pickedTime);
            },
          });
        },
      });
      return;
    }
    setIosTarget((previous) => {
      const next = isStart ? 'start' : 'end';
      return previous === next ? null : next;
    });
  };

  return (
    <View>
      <View style={[styles.presetRow, { gap: theme.spacing.sm }]}>
        {PRESETS.map((preset) => (
          <Pressable
            key={preset.id}
            accessibilityRole="button"
            onPress={() => {
              const [newStart, newEnd] = resolvePreset(preset.id, new Date());
              setIosTarget(null);
              onChange(newStart, newEnd);
            }}
            style={({ pressed }) => [
              styles.chip,
              {
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm - 2,
                borderRadius: theme.radius.pill,
                borderColor: theme.colors.outlineVariant,
                backgroundColor: pressed
                  ? theme.colors.surfaceVariant
                  : 'transparent',
              },
            ]}
          >
            <Text style={[styles.chipLabel, { color: theme.colors.onSurface }]}>
              {preset.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.tileRow, { marginTop: theme.spacing.md }]}>
        <DateTile
          theme={theme}
          label="Start"
          value={formatDateTime(start)}
          active={iosTarget === 'start'}
          onPress={() => openPicker(true)}
        />
        <View style={{ width: theme.spacing.sm }} />
        <DateTile
          theme={theme}
          label="End"
          value={formatDateTime(end)}
          active={iosTarget === 'end'}
          onPress={() => openPicker(false)}
        />
      </View>

      {Platform.OS === 'ios' && iosTarget !== null ? (
        <View
          style={[
            styles.pickerBox,
            {
              marginTop: theme.spacing.sm,
              borderColor: theme.colors.outlineVariant,
              borderRadius: theme.radius.control,
              paddingHorizontal: theme.spacing.sm,
            },
          ]}
        >
          <DateTimePicker
            value={iosTarget === 'start' ? start : end}
            mode="datetime"
            display="spinner"
            themeVariant={theme.isDark ? 'dark' : 'light'}
            onChange={(_event: DateTimePickerEvent, picked?: Date) => {
              if (picked) {
                commit(iosTarget === 'start', picked);
              }
            }}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => setIosTarget(null)}
            style={[
              styles.done,
              {
                paddingVertical: theme.spacing.sm,
                paddingHorizontal: theme.spacing.sm,
              },
            ]}
          >
            <Text style={[styles.doneLabel, { color: theme.colors.primary }]}>
              Done
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function DateTile({
  theme,
  label,
  value,
  active,
  onPress,
}: {
  theme: AppTheme;
  label: string;
  value: string;
  active: boolean;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        active ? styles.tileActive : styles.tileIdle,
        {
          borderColor: active
            ? theme.colors.primary
            : theme.colors.outlineVariant,
          borderRadius: theme.radius.control,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          backgroundColor: pressed
            ? theme.colors.surfaceVariant
            : 'transparent',
        },
      ]}
    >
      <Text
        style={[styles.tileLabel, { color: theme.colors.onSurfaceVariant }]}
      >
        {label}
      </Text>
      <Text
        numberOfLines={1}
        style={[styles.tileValue, { color: theme.colors.onSurface }]}
      >
        {value}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    borderWidth: 1,
  },
  chipLabel: {
    fontSize: 13,
  },
  tileRow: {
    flexDirection: 'row',
  },
  tile: {
    flex: 1,
  },
  tileIdle: {
    borderWidth: 1,
  },
  tileActive: {
    borderWidth: 2,
  },
  tileLabel: {
    fontSize: 11,
  },
  tileValue: {
    fontSize: 15,
    marginTop: 2,
  },
  pickerBox: {
    borderWidth: 1,
  },
  done: {
    alignSelf: 'flex-end',
  },
  doneLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
