import { useEffect, useMemo, useState } from 'react';
import type * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Sahha from 'sahha-react-native';
import type { SahhaScoreType } from 'sahha-react-native';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { DateRangeSelector } from '../components/DateRangeSelector';
import { InlineHint } from '../components/InlineHint';
import { ResponseSheet, tryPrettyJson } from '../components/ResponseSheet';
import { SectionHeader } from '../components/SectionHeader';
import { ALL_SCORE_TYPES, prettyLabel } from '../data/groups';
import { StorageKeys, loadEnumList, saveEnumList } from '../data/storage';
import { useAppTheme } from '../theme';
import type { AppTheme } from '../theme';

type SdkModule = NonNullable<typeof Sahha>;

const DAY_MS = 24 * 60 * 60 * 1000;

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

/** One item of a score's `factors` array, already formatted for display. */
interface ScoreFactor {
  name: string | null;
  state: string | null;
  value: string | null;
  goal: string | null;
  unit: string | null;
  /** `score` normalised to 0–1, or null when it is missing/unusable. */
  fraction: number | null;
}

/** One item of the `getScores` response. */
interface ScoreEntry {
  type: string | null;
  state: string | null;
  fraction: number | null;
  /** `3 Aug, 14:05`, or null when the response carries no usable date. */
  dateLabel: string | null;
  factors: ScoreFactor[];
}

/** Foreground/background pair for a score or factor state string. */
interface StateTone {
  accent: string;
  container: string;
  onContainer: string;
}

/**
 * Test harness for `Sahha.getScores`: pick score types and a date range, then
 * inspect the parsed response inline. Ported from the Sahha Flutter example
 * app (`Views/ScoresView.dart`).
 */
export function ScoresScreen(): React.JSX.Element {
  const theme = useAppTheme();

  const [types, setTypes] = useState<ReadonlySet<SahhaScoreType>>(
    () => new Set(ALL_SCORE_TYPES)
  );

  const [start, setStart] = useState(() => new Date(Date.now() - 7 * DAY_MS));
  const [end, setEnd] = useState(() => new Date());

  const [isLoading, setIsLoading] = useState(false);

  // Raw response of the last successful call, null before the first one.
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [entries, setEntries] = useState<readonly ScoreEntry[]>([]);
  const [queried, setQueried] = useState<{ start: Date; end: Date } | null>(
    null
  );

  const [sheet, setSheet] = useState<SheetState>(CLOSED_SHEET);

  // Restore the stored selection on mount; a missing or unusable payload
  // keeps the "everything selected" default.
  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      const stored = await loadEnumList<SahhaScoreType>(
        StorageKeys.scoreTypes,
        ALL_SCORE_TYPES
      );
      if (cancelled || stored === null) {
        return;
      }
      setTypes(new Set(stored));
    };
    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  // Selection in enum order so the request never depends on tap order.
  const selectedTypes = useMemo(
    () => ALL_SCORE_TYPES.filter((type) => types.has(type)),
    [types]
  );

  const hasSelection = selectedTypes.length > 0;

  const showSheet = (
    title: string,
    subtitle: string,
    body: string,
    isError: boolean
  ) => {
    setSheet({ visible: true, title, subtitle, body, isError });
  };

  const withSdk = (
    subtitle: string,
    run: (sdk: SdkModule) => void,
    onUnavailable: () => void
  ) => {
    const sdk = Sahha;
    if (!sdk) {
      onUnavailable();
      showSheet(
        'Unavailable',
        subtitle,
        'The Sahha native module is not linked in this build.',
        true
      );
      return;
    }
    run(sdk);
  };

  const toggleType = (type: SahhaScoreType) => {
    const next = new Set(types);
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }
    setTypes(next);
    saveEnumList(
      StorageKeys.scoreTypes,
      ALL_SCORE_TYPES.filter((value) => next.has(value))
    );
  };

  const onGetScores = () => {
    if (!hasSelection || isLoading) {
      return;
    }
    const queriedStart = start;
    const queriedEnd = end;
    setIsLoading(true);
    withSdk(
      'Sahha.getScores',
      (sdk) => {
        sdk.getScores(
          selectedTypes,
          queriedStart.getTime(),
          queriedEnd.getTime(),
          (error: string, value: string) => {
            setIsLoading(false);
            if (error) {
              console.log(`GET SCORES error: ${error}`);
              setRawResponse(null);
              setEntries([]);
              setQueried(null);
              showSheet(
                'GET SCORES',
                'Request failed — authenticate the profile and try again',
                error,
                true
              );
              return;
            }
            const raw = value ?? '';
            console.log(`GET SCORES: ${raw}`);
            setRawResponse(raw);
            setEntries(parseEntries(raw));
            setQueried({ start: queriedStart, end: queriedEnd });
          }
        );
      },
      () => setIsLoading(false)
    );
  };

  const resultCount =
    entries.length === 1 ? '1 result' : `${entries.length} results`;

  const rangeLabel =
    queried === null
      ? null
      : `${formatDateTime(queried.start)} – ${formatDateTime(queried.end)}`;

  return (
    <>
      <ScrollView
        style={[styles.screen, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.xxl * 2,
        }}
      >
        <SectionHeader title="SCORE TYPES" />
        <View style={[styles.chipWrap, { gap: theme.spacing.sm }]}>
          {ALL_SCORE_TYPES.map((type) => (
            <FilterChip
              key={type}
              theme={theme}
              label={prettyLabel(type)}
              selected={types.has(type)}
              onPress={() => toggleType(type)}
            />
          ))}
        </View>

        <SectionHeader
          title="DATE RANGE"
          style={{ marginTop: theme.spacing.xl }}
        />
        <DateRangeSelector
          start={start}
          end={end}
          onChange={(nextStart, nextEnd) => {
            setStart(nextStart);
            setEnd(nextEnd);
          }}
        />

        {!hasSelection ? (
          <View style={{ marginTop: theme.spacing.lg }}>
            <InlineHint message="Select at least one score type to run the request." />
          </View>
        ) : null}

        <AppButton
          title="GET SCORES"
          loading={isLoading}
          disabled={!hasSelection}
          onPress={onGetScores}
          style={{ marginTop: theme.spacing.lg }}
        />

        {rawResponse !== null ? (
          <View style={{ marginTop: theme.spacing.xxl }}>
            <View
              style={[
                styles.rule,
                { backgroundColor: theme.colors.outlineVariant },
              ]}
            />
            <View
              style={[
                styles.resultHeader,
                {
                  marginTop: theme.spacing.md,
                  marginBottom: theme.spacing.sm,
                },
              ]}
            >
              <View style={styles.resultHeaderText}>
                <Text
                  style={[
                    styles.resultCount,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  {resultCount}
                </Text>
                {rangeLabel !== null ? (
                  <Text
                    style={[
                      styles.resultRange,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {rangeLabel}
                  </Text>
                ) : null}
              </View>
              <AppButton
                title="Raw JSON"
                variant="outline"
                compact
                onPress={() =>
                  showSheet(
                    'GET SCORES',
                    resultCount,
                    tryPrettyJson(rawResponse),
                    false
                  )
                }
              />
            </View>

            {entries.length === 0 ? (
              <EmptyResults theme={theme} />
            ) : (
              entries.map((entry, index) => (
                <ScoreCard
                  key={`${entry.type ?? 'unknown'}:${index}`}
                  theme={theme}
                  entry={entry}
                />
              ))
            )}
          </View>
        ) : null}
      </ScrollView>

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

function FilterChip({
  theme,
  label,
  selected,
  onPress,
}: {
  theme: AppTheme;
  label: string;
  selected: boolean;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          borderRadius: theme.radius.pill,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm - 2,
          borderColor: selected
            ? theme.colors.primary
            : theme.colors.outlineVariant,
          backgroundColor: selected
            ? theme.colors.primaryContainer
            : pressed
              ? theme.colors.surfaceVariant
              : undefined,
        },
      ]}
    >
      <Text
        style={[
          styles.chipLabel,
          selected ? styles.chipLabelSelected : null,
          {
            color: selected
              ? theme.colors.onPrimaryContainer
              : theme.colors.onSurface,
          },
        ]}
      >
        {selected ? `✓ ${label}` : label}
      </Text>
    </Pressable>
  );
}

function ScoreCard({
  theme,
  entry,
}: {
  theme: AppTheme;
  entry: ScoreEntry;
}): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const tone = stateTone(theme, entry.state);
  const fraction = entry.fraction;

  return (
    <Card style={[styles.flushCard, { marginBottom: theme.spacing.sm }]}>
      <View style={{ padding: theme.spacing.lg }}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderText}>
            <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
              {prettyLabel(entry.type ?? 'Unknown type')}
            </Text>
            {entry.dateLabel !== null ? (
              <Text
                style={[
                  styles.cardDate,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {entry.dateLabel}
              </Text>
            ) : null}
          </View>
          {entry.state !== null ? (
            <StatusChip
              theme={theme}
              tone={tone}
              label={prettyLabel(entry.state)}
            />
          ) : null}
        </View>

        {fraction === null ? (
          <Text
            style={[
              styles.noScore,
              {
                color: theme.colors.onSurfaceVariant,
                marginTop: theme.spacing.md,
              },
            ]}
          >
            No score value in the response
          </Text>
        ) : (
          <View style={[styles.scoreRow, { marginTop: theme.spacing.md }]}>
            <View
              style={[
                styles.track,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: theme.radius.control - 8,
                },
              ]}
            >
              <View
                style={[
                  styles.trackFill,
                  {
                    width: percentWidth(fraction),
                    backgroundColor: tone.accent,
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.scoreValue,
                {
                  color: theme.colors.onSurface,
                  marginLeft: theme.spacing.md,
                },
              ]}
            >
              {percentLabel(fraction)}
            </Text>
          </View>
        )}
      </View>

      {entry.factors.length > 0 ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            onPress={() => setExpanded((previous) => !previous)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.md,
              backgroundColor: pressed
                ? theme.colors.surfaceVariant
                : undefined,
            })}
          >
            <Text
              style={[styles.factorsTitle, { color: theme.colors.primary }]}
            >
              {`Factors (${entry.factors.length})`}
            </Text>
            <Text
              style={[styles.chevron, { color: theme.colors.onSurfaceVariant }]}
            >
              {expanded ? '▾' : '▸'}
            </Text>
          </Pressable>
          {expanded ? (
            <View style={{ paddingBottom: theme.spacing.xs }}>
              {entry.factors.map((factor, index) => (
                <FactorRow
                  key={`${factor.name ?? 'factor'}:${index}`}
                  theme={theme}
                  factor={factor}
                />
              ))}
            </View>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}

function FactorRow({
  theme,
  factor,
}: {
  theme: AppTheme;
  factor: ScoreFactor;
}): React.JSX.Element {
  const tone = stateTone(theme, factor.state);

  const details: string[] = [];
  if (factor.value !== null) {
    details.push(
      factor.unit === null ? factor.value : `${factor.value} ${factor.unit}`
    );
  }
  if (factor.goal !== null) {
    details.push(
      `goal ${factor.unit === null ? factor.goal : `${factor.goal} ${factor.unit}`}`
    );
  }

  const chipParts: string[] = [];
  if (factor.state !== null) {
    chipParts.push(prettyLabel(factor.state));
  }
  if (factor.fraction !== null) {
    chipParts.push(percentLabel(factor.fraction));
  }

  return (
    <View
      style={[
        styles.factorRow,
        {
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.md,
        },
      ]}
    >
      <View style={styles.factorText}>
        <Text style={[styles.factorName, { color: theme.colors.onSurface }]}>
          {prettyLabel(factor.name ?? 'Unknown factor')}
        </Text>
        {details.length > 0 ? (
          <Text
            style={[
              styles.factorDetails,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {details.join(' · ')}
          </Text>
        ) : null}
      </View>
      {chipParts.length > 0 ? (
        <StatusChip theme={theme} tone={tone} label={chipParts.join(' · ')} />
      ) : null}
    </View>
  );
}

function StatusChip({
  theme,
  tone,
  label,
}: {
  theme: AppTheme;
  tone: StateTone;
  label: string;
}): React.JSX.Element {
  return (
    <View
      style={[
        styles.statusChip,
        {
          backgroundColor: tone.container,
          paddingHorizontal: theme.spacing.sm,
          marginLeft: theme.spacing.sm,
        },
      ]}
    >
      <Text style={[styles.statusChipLabel, { color: tone.onContainer }]}>
        {label}
      </Text>
    </View>
  );
}

function EmptyResults({ theme }: { theme: AppTheme }): React.JSX.Element {
  return (
    <Card>
      <Text style={styles.emptyGlyph}>📭</Text>
      <Text
        style={[
          styles.emptyTitle,
          { color: theme.colors.onSurface, marginTop: theme.spacing.sm },
        ]}
      >
        No scores for this range
      </Text>
      <Text
        style={[
          styles.emptyBody,
          {
            color: theme.colors.onSurfaceVariant,
            marginTop: theme.spacing.xs,
          },
        ]}
      >
        Scores are generated from processed sensor data, so they can take a
        while to appear. Check that the profile is authenticated, that sensor
        permissions are granted, and try a wider date range.
      </Text>
    </Card>
  );
}

/** Semantic colours for a score/factor state string. */
function stateTone(theme: AppTheme, state: string | null): StateTone {
  switch (state?.trim().toLowerCase()) {
    case 'high':
    case 'good':
    case 'optimal':
      return {
        accent: theme.colors.success,
        container: theme.colors.successContainer,
        onContainer: theme.colors.onSuccessContainer,
      };
    case 'medium':
    case 'ok':
    case 'moderate':
    case 'average':
      return {
        accent: theme.colors.warning,
        container: theme.colors.warningContainer,
        onContainer: theme.colors.onWarningContainer,
      };
    case 'low':
    case 'poor':
    case 'minimal':
      return {
        accent: theme.colors.error,
        container: theme.colors.errorContainer,
        onContainer: theme.colors.onErrorContainer,
      };
    default:
      return {
        accent: theme.colors.primary,
        container: theme.colors.surfaceVariant,
        onContainer: theme.colors.onSurfaceVariant,
      };
  }
}

/**
 * Decodes the response array into display entries. A payload that is not a
 * JSON array yields no entries rather than throwing.
 */
function parseEntries(raw: string): ScoreEntry[] {
  let decoded: unknown;
  try {
    decoded = JSON.parse(raw);
  } catch {
    console.log('GET SCORES: response was not JSON');
    return [];
  }
  if (!Array.isArray(decoded)) {
    return [];
  }

  const entries: ScoreEntry[] = [];
  for (const item of decoded) {
    const fields = normaliseFields(item);
    if (fields === null) {
      continue;
    }
    entries.push({
      type: readString(fields, 'type') ?? readString(fields, 'scoreType'),
      state: readString(fields, 'state'),
      fraction: readFraction(fields, 'score'),
      dateLabel: formatTimestamp(
        readRaw(fields, 'scoreDateTime') ?? readRaw(fields, 'startDateTime')
      ),
      factors: parseFactors(readRaw(fields, 'factors')),
    });
  }
  return entries;
}

function parseFactors(raw: unknown): ScoreFactor[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const factors: ScoreFactor[] = [];
  for (const item of raw) {
    const fields = normaliseFields(item);
    if (fields === null) {
      continue;
    }
    factors.push({
      name: readString(fields, 'name') ?? readString(fields, 'factor'),
      state: readString(fields, 'state'),
      value: readString(fields, 'value'),
      goal: readString(fields, 'goal'),
      unit: readString(fields, 'unit'),
      fraction: readFraction(fields, 'score'),
    });
  }
  return factors;
}

/**
 * Lower cases keys and strips underscores so the same lookup works whether
 * the platform returns `scoreDateTime` or `score_date_time`.
 */
function normaliseKey(key: string): string {
  return key.toLowerCase().replace(/_/g, '');
}

function normaliseFields(item: unknown): Record<string, unknown> | null {
  if (typeof item !== 'object' || item === null || Array.isArray(item)) {
    return null;
  }
  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(item as Record<string, unknown>)) {
    fields[normaliseKey(key)] = value;
  }
  return fields;
}

function readRaw(fields: Record<string, unknown>, key: string): unknown {
  return fields[normaliseKey(key)];
}

function readString(
  fields: Record<string, unknown>,
  key: string
): string | null {
  return textOf(readRaw(fields, key));
}

/** Null-tolerant read: anything that is not a scalar becomes null. */
function textOf(raw: unknown): string | null {
  if (typeof raw === 'string') {
    const text = raw.trim();
    return text.length === 0 ? null : text;
  }
  if (typeof raw === 'number') {
    return formatNumber(raw);
  }
  if (typeof raw === 'boolean') {
    return String(raw);
  }
  return null;
}

/**
 * Score values are usually a 0–1 double, but a 0–100 percentage is handled
 * too. Returns null when the field is missing or is not a number.
 */
function readFraction(
  fields: Record<string, unknown>,
  key: string
): number | null {
  const raw = readRaw(fields, key);
  let parsed = Number.NaN;
  if (typeof raw === 'number') {
    parsed = raw;
  } else if (typeof raw === 'string' && raw.trim().length > 0) {
    parsed = Number(raw.trim());
  }
  if (!Number.isFinite(parsed)) {
    return null;
  }
  const ratio = parsed > 1 ? parsed / 100 : parsed;
  return Math.min(1, Math.max(0, ratio));
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return String(value);
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function percentLabel(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

function percentWidth(fraction: number): `${number}%` {
  return `${Math.round(fraction * 100)}%`;
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
 * Formats ISO 8601 text or epoch milliseconds, falling back to the raw text
 * when it is neither.
 */
function formatTimestamp(raw: unknown): string | null {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? formatDateTime(new Date(raw)) : null;
  }
  if (typeof raw !== 'string') {
    return null;
  }
  const text = raw.trim();
  if (text.length === 0) {
    return null;
  }
  const parsed = Date.parse(text);
  return Number.isNaN(parsed) ? text : formatDateTime(new Date(parsed));
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    borderWidth: 1,
  },
  chipLabel: {
    fontSize: 13,
  },
  chipLabelSelected: {
    fontWeight: '600',
  },
  rule: {
    height: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultHeaderText: {
    flex: 1,
  },
  resultCount: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultRange: {
    fontSize: 12,
    marginTop: 2,
  },
  flushCard: {
    padding: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardDate: {
    fontSize: 12,
    marginTop: 2,
  },
  noScore: {
    fontSize: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  track: {
    flex: 1,
    height: 8,
    overflow: 'hidden',
  },
  trackFill: {
    height: 8,
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  factorsTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  chevron: {
    fontSize: 14,
    marginLeft: 8,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  factorText: {
    flex: 1,
  },
  factorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  factorDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  statusChip: {
    borderRadius: 6,
    paddingVertical: 3,
  },
  statusChipLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyGlyph: {
    fontSize: 32,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
