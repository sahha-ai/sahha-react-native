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
 * Test harness for the deprecated `getSamples` API, ported from the Sahha
 * Flutter example app (`Views/SamplesView.dart`).
 *
 * The screen is kept so the raw on-device samples can be regression tested
 * against the server-processed values returned by `getBiomarkers`.
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

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Samples beyond this are only available through the raw payload: rendering
 * every row of a busy day (heart rate, steps) would stall the scroll view.
 */
const MAX_RENDERED_SAMPLES = 300;

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/** Every sensor name, used to validate the persisted selection. */
const SENSOR_NAMES: readonly string[] = Object.values(SahhaSensor);

/** Keys the bridge might nest the samples array under. */
const WRAPPER_KEYS = ['samples', 'data', 'items'] as const;

const VALUE_KEYS = ['value', 'count'] as const;
const UNIT_KEYS = ['unit', 'unitName'] as const;
const START_KEYS = ['startDateTime', 'startDate', 'start'] as const;
const END_KEYS = ['endDateTime', 'endDate', 'end'] as const;
const SOURCE_KEYS = ['source', 'sourceName', 'device'] as const;
const RECORDING_METHOD_KEYS = ['recordingMethod', 'recordingType'] as const;
const DEVICE_TYPE_KEYS = ['deviceType', 'deviceModel'] as const;

/**
 * A single `getSamples` entry, parsed defensively: field names and value types
 * differ slightly between the iOS and Android bridges.
 */
interface Sample {
  key: string;
  value: number | null;
  valueText: string | null;
  unit: string | null;
  start: Date | null;
  end: Date | null;
  rawStart: string | null;
  source: string | null;
  recordingMethod: string | null;
  deviceType: string | null;
  statCount: number;
}

interface DayGroup {
  day: string;
  samples: Sample[];
}

interface SamplesResult {
  raw: string;
  samples: Sample[];
  sensor: SahhaSensor;
  start: Date;
  end: Date;
}

export function SamplesScreen(): React.JSX.Element {
  const theme = useAppTheme();

  const [sensor, setSensor] = useState<SahhaSensor>(SahhaSensor.steps);
  const [pickerVisible, setPickerVisible] = useState(false);
  // Samples are raw readings and get big fast, so default to a single day
  // (heart_rate alone can return thousands of rows over a week).
  const [start, setStart] = useState<Date>(() => new Date(Date.now() - DAY_MS));
  const [end, setEnd] = useState<Date>(() => new Date());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SamplesResult | null>(null);
  const [sheet, setSheet] = useState<SheetState>(CLOSED_SHEET);

  // Restore the sensor chosen last time, ignoring names that are no longer
  // part of the enum.
  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      const stored = await loadString(StorageKeys.samplesSensor);
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
    saveString(StorageKeys.samplesSensor, picked);
  };

  const onGetSamples = () => {
    const sdk = Sahha;
    if (!sdk) {
      setResult(null);
      showSheet(
        'Unavailable',
        'Sahha.getSamples',
        'The Sahha native module is not linked in this build.',
        true
      );
      return;
    }

    const queriedSensor = sensor;
    const queriedStart = start;
    const queriedEnd = end;

    setLoading(true);
    sdk.getSamples(
      queriedSensor,
      queriedStart.getTime(),
      queriedEnd.getTime(),
      (error: string, value: string) => {
        setLoading(false);
        console.log(`Get Samples Result: ${error || value}`);
        if (error) {
          setResult(null);
          showSheet(
            'GET SAMPLES failed',
            'Request failed — check sensor permissions and try again',
            error,
            true
          );
          return;
        }
        const raw = typeof value === 'string' ? value : '';
        setResult({
          raw,
          samples: parseSamples(raw),
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
    const count = result.samples.length;
    showSheet(
      'GET SAMPLES',
      `${count} ${count === 1 ? 'entry' : 'entries'}`,
      tryPrettyJson(result.raw),
      false
    );
  };

  // Only the first page of samples is rendered inline; the raw sheet always
  // holds the complete payload.
  const shown =
    result === null ? [] : result.samples.slice(0, MAX_RENDERED_SAMPLES);
  const groups = groupByDay(shown);

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
          title="GET SAMPLES"
          loading={loading}
          onPress={onGetSamples}
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
                  {`${result.samples.length} ${
                    result.samples.length === 1 ? 'sample' : 'samples'
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
                {groups.length > 0 ? (
                  <Text
                    style={[
                      styles.resultsMeta,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {`${groups.length} ${groups.length === 1 ? 'day' : 'days'}`}
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

            {result.samples.length === 0 ? (
              <View style={{ marginTop: theme.spacing.md }}>
                <InlineHint
                  message={
                    `Nothing was recorded for ${result.sensor} in this date ` +
                    'range. Check the sensor is enabled in Permissions and ' +
                    'that the device has data for the period.'
                  }
                />
              </View>
            ) : (
              <>
                {groups.map((group) => (
                  <View key={group.day} style={{ marginTop: theme.spacing.lg }}>
                    <SectionHeader title={group.day} />
                    <Card style={styles.resultsCard}>
                      {group.samples.map((sample, index) => (
                        <View key={sample.key}>
                          {index > 0 ? (
                            <View
                              style={[
                                styles.divider,
                                {
                                  backgroundColor: theme.colors.outlineVariant,
                                },
                              ]}
                            />
                          ) : null}
                          <SampleRow theme={theme} sample={sample} />
                        </View>
                      ))}
                    </Card>
                  </View>
                ))}
                {shown.length < result.samples.length ? (
                  <View style={{ marginTop: theme.spacing.md }}>
                    <InlineHint
                      message={
                        `Showing ${shown.length} of ${result.samples.length} ` +
                        '— open Raw JSON for the full payload.'
                      }
                    />
                  </View>
                ) : null}
              </>
            )}
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

/** One raw reading: the time and its provenance chips, then the value. */
function SampleRow({
  theme,
  sample,
}: {
  theme: AppTheme;
  sample: Sample;
}): React.JSX.Element {
  const chips: string[] = [];
  if (sample.source !== null) {
    chips.push(sample.source);
  }
  if (sample.recordingMethod !== null) {
    chips.push(prettyLabel(sample.recordingMethod));
  }
  if (sample.deviceType !== null) {
    chips.push(prettyLabel(sample.deviceType));
  }
  if (sample.statCount > 0) {
    chips.push(`${sample.statCount} stats`);
  }

  return (
    <View
      style={{
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
      }}
    >
      <View style={styles.rowTop}>
        <View style={styles.rowText}>
          <Text style={[styles.time, { color: theme.colors.onSurface }]}>
            {timeLabel(sample)}
          </Text>
          {chips.length > 0 ? (
            <View
              style={[
                styles.chipRow,
                { marginTop: theme.spacing.xs, gap: theme.spacing.xs },
              ]}
            >
              {chips.map((chip, index) => (
                <MetaChip key={`${index}:${chip}`} theme={theme} label={chip} />
              ))}
            </View>
          ) : null}
        </View>
        <Text
          style={[
            styles.value,
            { color: theme.colors.onSurface, marginLeft: theme.spacing.md },
          ]}
        >
          {valueLabel(sample)}
        </Text>
      </View>
    </View>
  );
}

function MetaChip({
  theme,
  label,
}: {
  theme: AppTheme;
  label: string;
}): React.JSX.Element {
  return (
    <View
      style={{
        backgroundColor: theme.colors.surfaceVariant,
        borderRadius: theme.radius.control,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs - 2,
      }}
    >
      <Text
        numberOfLines={1}
        style={[styles.chipLabel, { color: theme.colors.onSurfaceVariant }]}
      >
        {label}
      </Text>
    </View>
  );
}

/** The enum member with this name, or null when it is no longer a sensor. */
function sensorNamed(name: string): SahhaSensor | null {
  return SENSOR_NAMES.includes(name) ? (name as SahhaSensor) : null;
}

/** Buckets samples by calendar day, keeping the descending sample order. */
function groupByDay(samples: readonly Sample[]): DayGroup[] {
  const byDay = new Map<string, Sample[]>();
  for (const sample of samples) {
    const day =
      sample.start === null ? 'Unknown date' : formatFullDay(sample.start);
    const bucket = byDay.get(day);
    if (bucket) {
      bucket.push(sample);
    } else {
      byDay.set(day, [sample]);
    }
  }
  return Array.from(byDay, ([day, entries]) => ({ day, samples: entries }));
}

function parseSamples(raw: string): Sample[] {
  const samples = decodeEntries(raw, WRAPPER_KEYS).map((entry, index) => {
    const value = pick(entry, VALUE_KEYS);
    const rawStart = pick(entry, START_KEYS);
    const stats = entry.stats;
    const sample: Sample = {
      key: `${index}:${asText(entry.id) ?? ''}`,
      value: asNumber(value),
      valueText: asText(value),
      unit: asText(pick(entry, UNIT_KEYS)),
      start: asDate(rawStart),
      end: asDate(pick(entry, END_KEYS)),
      rawStart: asText(rawStart),
      source: asText(pick(entry, SOURCE_KEYS)),
      recordingMethod: asText(pick(entry, RECORDING_METHOD_KEYS)),
      deviceType: asText(pick(entry, DEVICE_TYPE_KEYS)),
      statCount: Array.isArray(stats) ? stats.length : 0,
    };
    return sample;
  });

  // Most recent sample first.
  samples.sort((a, b) => {
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
  return samples;
}

/** `14:05` for an instant, `14:05–14:35` for a period. */
function timeLabel(sample: Sample): string {
  const start = sample.start;
  if (start === null) {
    return sample.rawStart ?? 'Unknown time';
  }
  const end = sample.end;
  if (end === null || end.getTime() === start.getTime()) {
    return formatTime(start);
  }
  return `${formatTime(start)}–${formatTime(end)}`;
}

function valueLabel(sample: Sample): string {
  const text =
    sample.value !== null
      ? formatNumber(sample.value)
      : (sample.valueText ?? '—');
  const unit = sample.unit;
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

/** `14:05` */
function formatTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** `Monday 3 August` — the day-group heading. */
function formatFullDay(date: Date): string {
  const weekday = WEEKDAYS[date.getDay()] ?? '';
  const month = MONTHS[date.getMonth()] ?? '';
  return `${weekday} ${date.getDate()} ${month}`;
}

/** `3 Aug, 14:05` — matches the tiles on the date range selector. */
function formatStamp(date: Date): string {
  const month = (MONTHS[date.getMonth()] ?? '').slice(0, 3);
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
  time: {
    fontSize: 14,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chipLabel: {
    fontSize: 11,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
});
