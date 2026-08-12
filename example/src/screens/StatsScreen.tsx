import { useEffect, useState } from 'react';
import type * as React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Sahha, { SahhaSensor } from 'sahha-react-native';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { DateRangeSelector } from '../components/DateRangeSelector';
import { DeprecationBanner } from '../components/DeprecationBanner';
import { InlineHint } from '../components/InlineHint';
import { ResponseSheet, tryPrettyJson } from '../components/ResponseSheet';
import { SectionHeader } from '../components/SectionHeader';
import { SensorPickerSheet } from '../components/SensorPickerSheet';
import { prettyLabel, sensorGroupOf } from '../data/groups';
import { StorageKeys, loadString, saveString } from '../data/storage';
import { useAppTheme } from '../theme';
import type { AppTheme } from '../theme';

/**
 * Test harness for the deprecated `getStats` API, ported from the Sahha
 * Flutter example app (`Views/StatsView.dart`).
 *
 * The screen is kept so the aggregated on-device stats can be regression
 * tested against the server-processed values returned by `getBiomarkers`.
 */

interface SheetState {
  visible: boolean;
  title: string;
  subtitle: string;
  body: string;
  isError: boolean;
}

const CLOSED_SHEET: SheetState = {
  visible: false,
  title: '',
  subtitle: '',
  body: '',
  isError: false,
};

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

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

/** Every sensor name, used to validate the persisted selection. */
const SENSOR_NAMES: readonly string[] = Object.values(SahhaSensor);

/** Keys the bridge might nest the stats array under. */
const WRAPPER_KEYS = ['stats', 'data', 'items'] as const;

const TYPE_KEYS = ['type', 'name', 'sensor', 'category'] as const;
const AGGREGATION_KEYS = ['aggregation', 'aggregationType'] as const;
const PERIODICITY_KEYS = ['periodicity', 'period'] as const;
const VALUE_KEYS = ['value', 'count', 'total'] as const;
const UNIT_KEYS = ['unit', 'unitName'] as const;
const START_KEYS = ['startDateTime', 'startDate', 'start'] as const;
const END_KEYS = ['endDateTime', 'endDate', 'end'] as const;
const SOURCE_KEYS = ['sources', 'source'] as const;

/**
 * A single `getStats` entry, parsed defensively: field names and value types
 * differ slightly between the iOS and Android bridges.
 */
interface Stat {
  key: string;
  type: string | null;
  aggregation: string | null;
  periodicity: string | null;
  value: number | null;
  valueText: string | null;
  unit: string | null;
  start: Date | null;
  end: Date | null;
  rawStart: string | null;
  sources: string[];
}

interface StatsResult {
  raw: string;
  stats: Stat[];
  sensor: SahhaSensor;
  start: Date;
  end: Date;
}

export function StatsScreen(): React.JSX.Element {
  const theme = useAppTheme();

  const [sensor, setSensor] = useState<SahhaSensor>(SahhaSensor.steps);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [start, setStart] = useState<Date>(
    () => new Date(Date.now() - 7 * DAY_MS)
  );
  const [end, setEnd] = useState<Date>(() => new Date());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StatsResult | null>(null);
  const [sheet, setSheet] = useState<SheetState>(CLOSED_SHEET);

  // Restore the sensor chosen last time, ignoring names that are no longer
  // part of the enum.
  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      const stored = await loadString(StorageKeys.statsSensor);
      if (cancelled || stored === null) {
        return;
      }
      const restored = sensorNamed(stored);
      if (restored !== null) {
        setSensor(restored);
      }
    };
    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const showSheet = (
    title: string,
    subtitle: string,
    body: string,
    isError: boolean
  ) => {
    setSheet({ visible: true, title, subtitle, body, isError });
  };

  const onSelectSensor = (picked: SahhaSensor) => {
    setSensor(picked);
    saveString(StorageKeys.statsSensor, picked);
  };

  const onGetStats = () => {
    const sdk = Sahha;
    if (!sdk) {
      setResult(null);
      showSheet(
        'Unavailable',
        'Sahha.getStats',
        'The Sahha native module is not linked in this build.',
        true
      );
      return;
    }

    const queriedSensor = sensor;
    const queriedStart = start;
    const queriedEnd = end;

    setLoading(true);
    sdk.getStats(
      queriedSensor,
      queriedStart.getTime(),
      queriedEnd.getTime(),
      (error: string, value: string) => {
        setLoading(false);
        console.log(`Get Stats Result: ${error || value}`);
        if (error) {
          setResult(null);
          showSheet(
            'GET STATS failed',
            'Request failed — check sensor permissions and try again',
            error,
            true
          );
          return;
        }
        const raw = typeof value === 'string' ? value : '';
        setResult({
          raw,
          stats: parseStats(raw),
          sensor: queriedSensor,
          start: queriedStart,
          end: queriedEnd,
        });
      }
    );
  };

  const onShowRaw = () => {
    if (result === null) {
      return;
    }
    const count = result.stats.length;
    showSheet(
      'GET STATS',
      `${count} ${count === 1 ? 'entry' : 'entries'}`,
      tryPrettyJson(result.raw),
      false
    );
  };

  const summary = result !== null ? summarise(result.stats) : null;

  return (
    <>
      <ScrollView
        style={[styles.screen, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.xxl * 2,
        }}
      >
        <DeprecationBanner replacement="getBiomarkers" />

        <SectionHeader title="SENSOR" style={{ marginTop: theme.spacing.xl }} />
        <Card onPress={loading ? undefined : () => setPickerVisible(true)}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text
                numberOfLines={1}
                style={[styles.sensorName, { color: theme.colors.onSurface }]}
              >
                {sensor}
              </Text>
              <Text
                style={[
                  styles.sensorGroup,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {sensorGroupOf(sensor)}
              </Text>
            </View>
            <Text
              style={[
                styles.chevron,
                {
                  color: theme.colors.onSurfaceVariant,
                  marginLeft: theme.spacing.sm,
                },
              ]}
            >
              ›
            </Text>
          </View>
        </Card>

        <SectionHeader
          title="DATE RANGE"
          style={{ marginTop: theme.spacing.xl }}
        />
        <Card>
          <DateRangeSelector
            start={start}
            end={end}
            onChange={(nextStart, nextEnd) => {
              setStart(nextStart);
              setEnd(nextEnd);
            }}
          />
        </Card>

        <AppButton
          title="GET STATS"
          loading={loading}
          onPress={onGetStats}
          style={{ marginTop: theme.spacing.lg }}
        />

        {result !== null ? (
          <View style={{ marginTop: theme.spacing.xl }}>
            <View
              style={[
                styles.divider,
                { backgroundColor: theme.colors.outlineVariant },
              ]}
            />

            <View
              style={[styles.resultsHeader, { marginTop: theme.spacing.lg }]}
            >
              <View style={styles.rowText}>
                <Text
                  style={[styles.resultsCount, { color: theme.colors.primary }]}
                >
                  {`${result.stats.length} ${
                    result.stats.length === 1 ? 'stat' : 'stats'
                  }`}
                </Text>
                <Text
                  style={[
                    styles.resultsMeta,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {`${formatStamp(result.start)} – ${formatStamp(result.end)}`}
                </Text>
                {summary !== null ? (
                  <Text
                    style={[
                      styles.resultsMeta,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {summary}
                  </Text>
                ) : null}
              </View>
              <AppButton
                title="RAW JSON"
                variant="outline"
                compact
                onPress={onShowRaw}
                style={{ marginLeft: theme.spacing.md }}
              />
            </View>

            <View style={{ marginTop: theme.spacing.md }}>
              {result.stats.length === 0 ? (
                <InlineHint
                  message={
                    `Nothing was recorded for ${result.sensor} in this date ` +
                    'range. Check the sensor is enabled in Permissions and ' +
                    'that the device has data for the period.'
                  }
                />
              ) : (
                <Card style={styles.resultsCard}>
                  {result.stats.map((stat, index) => (
                    <View key={stat.key}>
                      {index > 0 ? (
                        <View
                          style={[
                            styles.divider,
                            { backgroundColor: theme.colors.outlineVariant },
                          ]}
                        />
                      ) : null}
                      <StatRow theme={theme} stat={stat} />
                    </View>
                  ))}
                </Card>
              )}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <SensorPickerSheet
        visible={pickerVisible}
        selected={sensor}
        onSelect={onSelectSensor}
        onClose={() => setPickerVisible(false)}
      />

      <ResponseSheet
        visible={sheet.visible}
        title={sheet.title}
        subtitle={sheet.subtitle}
        body={sheet.body}
        isError={sheet.isError}
        onClose={() => setSheet(CLOSED_SHEET)}
      />
    </>
  );
}

/** One aggregate row: the period on the left, the value on the right. */
function StatRow({
  theme,
  stat,
}: {
  theme: AppTheme;
  stat: Stat;
}): React.JSX.Element {
  const meta = [stat.type, stat.aggregation, stat.periodicity]
    .filter((entry): entry is string => entry !== null)
    .map(prettyLabel)
    .join(' · ');

  return (
    <View
      style={{
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
      }}
    >
      <View style={styles.rowTop}>
        <View style={styles.rowText}>
          <Text style={[styles.period, { color: theme.colors.onSurface }]}>
            {periodLabel(stat)}
          </Text>
          {meta.length > 0 ? (
            <Text
              style={[styles.meta, { color: theme.colors.onSurfaceVariant }]}
            >
              {meta}
            </Text>
          ) : null}
          {stat.sources.length > 0 ? (
            <Text
              style={[styles.meta, { color: theme.colors.onSurfaceVariant }]}
            >
              {stat.sources.join(', ')}
            </Text>
          ) : null}
        </View>
        <Text
          style={[
            styles.value,
            {
              color: theme.colors.onSurface,
              marginLeft: theme.spacing.md,
            },
          ]}
        >
          {valueLabel(stat)}
        </Text>
      </View>
    </View>
  );
}

/** The enum member with this name, or null when it is no longer a sensor. */
function sensorNamed(name: string): SahhaSensor | null {
  return SENSOR_NAMES.includes(name) ? (name as SahhaSensor) : null;
}

/**
 * Types (when there are only a few) plus the sum and average of every numeric
 * value — the same summary the Flutter screen shows under the count.
 */
function summarise(stats: readonly Stat[]): string | null {
  const details: string[] = [];

  const types = new Set<string>();
  for (const stat of stats) {
    if (stat.type !== null) {
      types.add(stat.type);
    }
  }
  if (types.size > 0 && types.size <= 3) {
    details.push(Array.from(types).join(', '));
  }

  const values = stats
    .map((stat) => stat.value)
    .filter((value): value is number => value !== null);
  if (values.length > 0) {
    const sum = values.reduce((total, value) => total + value, 0);
    details.push(
      `sum ${formatNumber(sum)} · avg ${formatNumber(sum / values.length)}`
    );
  }

  return details.length > 0 ? details.join(' · ') : null;
}

function parseStats(raw: string): Stat[] {
  const stats = decodeEntries(raw, WRAPPER_KEYS).map((entry, index) => {
    const value = pick(entry, VALUE_KEYS);
    const rawStart = pick(entry, START_KEYS);
    const stat: Stat = {
      key: `${index}:${asText(entry.id) ?? ''}`,
      type: asText(pick(entry, TYPE_KEYS)),
      aggregation: asText(pick(entry, AGGREGATION_KEYS)),
      periodicity: asText(pick(entry, PERIODICITY_KEYS)),
      value: asNumber(value),
      valueText: asText(value),
      unit: asText(pick(entry, UNIT_KEYS)),
      start: asDate(rawStart),
      end: asDate(pick(entry, END_KEYS)),
      rawStart: asText(rawStart),
      sources: asTextList(pick(entry, SOURCE_KEYS)),
    };
    return stat;
  });

  // Most recent period first.
  stats.sort((a, b) => {
    if (a.start === null && b.start === null) {
      return 0;
    }
    if (a.start === null) {
      return 1;
    }
    if (b.start === null) {
      return -1;
    }
    return b.start.getTime() - a.start.getTime();
  });
  return stats;
}

/** `Mon 3 Aug`, `Mon 3 Aug · 09:00–17:00` or `3 Aug 09:00 → 4 Aug 07:30`. */
function periodLabel(stat: Stat): string {
  const start = stat.start;
  if (start === null) {
    return stat.rawStart ?? 'Unknown period';
  }
  const end = stat.end;
  if (end === null) {
    return formatDay(start);
  }

  const minutes = Math.round((end.getTime() - start.getTime()) / MINUTE_MS);
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();
  // Daily periodicity (or a zero-length period): the day alone is enough.
  const coversDay = minutes >= 23 * 60 && minutes <= 25 * 60;
  if (coversDay || minutes <= 0) {
    return formatDay(start);
  }
  if (sameDay) {
    return `${formatDay(start)} · ${formatTime(start)}–${formatTime(end)}`;
  }
  return `${formatDayTime(start)} → ${formatDayTime(end)}`;
}

function valueLabel(stat: Stat): string {
  const text =
    stat.value !== null ? formatNumber(stat.value) : (stat.valueText ?? '—');
  const unit = stat.unit;
  return unit === null || unit.length === 0 ? text : `${text} ${unit}`;
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Decodes a bridge payload into a list of string-keyed maps, tolerating a
 * single object, a wrapper object and malformed JSON.
 */
function decodeEntries(
  raw: string,
  wrapperKeys: readonly string[]
): JsonRecord[] {
  let decoded: unknown;
  try {
    decoded = JSON.parse(raw);
  } catch {
    return [];
  }
  if (isRecord(decoded)) {
    for (const key of wrapperKeys) {
      const wrapped = decoded[key];
      if (Array.isArray(wrapped)) {
        decoded = wrapped;
        break;
      }
    }
  }
  if (isRecord(decoded)) {
    return [decoded];
  }
  if (!Array.isArray(decoded)) {
    return [];
  }
  const list: unknown[] = decoded;
  return list.filter(isRecord);
}

/** The first key that is present and non-null. */
function pick(entry: JsonRecord, keys: readonly string[]): unknown {
  for (const key of keys) {
    const value = entry[key];
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return null;
}

function asText(value: unknown): string | null {
  if (value === null || value === undefined || typeof value === 'object') {
    return null;
  }
  const text = String(value).trim();
  return text.length === 0 ? null : text;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const text = value.trim();
  if (text.length === 0) {
    return null;
  }
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function asTextList(value: unknown): string[] {
  if (Array.isArray(value)) {
    const list: unknown[] = value;
    return list.map(asText).filter((entry): entry is string => entry !== null);
  }
  const text = asText(value);
  return text === null ? [] : [text];
}

function asDate(value: unknown): Date | null {
  if (typeof value === 'number') {
    // Seconds or milliseconds since epoch, depending on the platform.
    const millis = value > 100000000000 ? value : value * 1000;
    const date = new Date(millis);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value !== 'string') {
    return null;
  }
  let text = value.trim();
  if (text.length === 0) {
    return null;
  }
  // Android serialises ZonedDateTime with a trailing zone id, which the Date
  // constructor rejects: 2026-05-21T09:00+12:00[Pacific/Auckland]
  const zoneIndex = text.indexOf('[');
  if (zoneIndex > 0) {
    text = text.slice(0, zoneIndex);
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** `1,234.5` — grouped like Dart's `NumberFormat.decimalPattern`. */
function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return String(value);
  }
  const text = String(Math.round(value * 1000) / 1000);
  const negative = text.startsWith('-');
  const digits = negative ? text.slice(1) : text;
  const dot = digits.indexOf('.');
  const whole = dot === -1 ? digits : digits.slice(0, dot);
  const fraction = dot === -1 ? '' : digits.slice(dot);
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${negative ? '-' : ''}${grouped}${fraction}`;
}

/** `Mon 3 Aug` */
function formatDay(date: Date): string {
  const weekday = WEEKDAYS[date.getDay()] ?? '';
  const month = MONTHS[date.getMonth()] ?? '';
  return `${weekday} ${date.getDate()} ${month}`;
}

/** `14:05` */
function formatTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** `3 Aug 14:05` */
function formatDayTime(date: Date): string {
  const month = MONTHS[date.getMonth()] ?? '';
  return `${date.getDate()} ${month} ${formatTime(date)}`;
}

/** `3 Aug, 14:05` — matches the tiles on the date range selector. */
function formatStamp(date: Date): string {
  const month = MONTHS[date.getMonth()] ?? '';
  return `${date.getDate()} ${month}, ${formatTime(date)}`;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rowText: {
    flex: 1,
  },
  sensorName: {
    fontSize: 15,
    fontWeight: '600',
  },
  sensorGroup: {
    fontSize: 12,
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
  },
  divider: {
    height: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  resultsMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  resultsCard: {
    padding: 0,
  },
  period: {
    fontSize: 14,
  },
  meta: {
    fontSize: 12,
    marginTop: 2,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
});
