import { useEffect, useMemo, useState } from 'react';
import type * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Sahha, { SahhaBiomarkerType } from 'sahha-react-native';
import type { SahhaBiomarkerCategory } from 'sahha-react-native';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { DateRangeSelector } from '../components/DateRangeSelector';
import { InlineHint } from '../components/InlineHint';
import { MultiSelectSheet } from '../components/MultiSelectSheet';
import { ResponseSheet, tryPrettyJson } from '../components/ResponseSheet';
import { SectionHeader } from '../components/SectionHeader';
import {
  ALL_BIOMARKER_CATEGORIES,
  BIOMARKER_TYPES_GROUPED,
  biomarkerTypeGroupOf,
  prettyLabel,
} from '../data/groups';
import { StorageKeys, loadEnumList, saveEnumList } from '../data/storage';
import { useAppTheme } from '../theme';
import type { AppTheme } from '../theme';

type SdkModule = NonNullable<typeof Sahha>;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Types in declaration order, so the request is stable across taps. */
const ALL_BIOMARKER_TYPES: readonly SahhaBiomarkerType[] =
  Object.values(SahhaBiomarkerType);

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

/** One item of the `getBiomarkers` response, already formatted for display. */
interface BiomarkerEntry {
  type: string | null;
  category: string | null;
  value: string | null;
  unit: string | null;
  periodicity: string | null;
  aggregation: string | null;
  /** `3 Aug, 09:00 – 3 Aug, 17:30`, or null when neither bound is usable. */
  period: string | null;
}

interface BiomarkerGroup {
  title: string;
  entries: BiomarkerEntry[];
}

/**
 * Test harness for `Sahha.getBiomarkers`: pick categories, types and a date
 * range, then inspect the parsed response inline. Ported from the Sahha
 * Flutter example app (`Views/BiomarkersView.dart`).
 */
export function BiomarkersScreen(): React.JSX.Element {
  const theme = useAppTheme();

  const [categories, setCategories] = useState<
    ReadonlySet<SahhaBiomarkerCategory>
  >(() => new Set(ALL_BIOMARKER_CATEGORIES));
  const [types, setTypes] = useState<ReadonlySet<SahhaBiomarkerType>>(
    () => new Set(ALL_BIOMARKER_TYPES)
  );

  const [start, setStart] = useState(() => new Date(Date.now() - 7 * DAY_MS));
  const [end, setEnd] = useState(() => new Date());

  const [isLoading, setIsLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);

  // Raw response of the last successful call, null before the first one.
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [entries, setEntries] = useState<readonly BiomarkerEntry[]>([]);
  const [queried, setQueried] = useState<{ start: Date; end: Date } | null>(
    null
  );

  const [sheet, setSheet] = useState<SheetState>(CLOSED_SHEET);

  // Restore the stored selections on mount; a missing or unusable payload
  // keeps the "everything selected" defaults.
  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      const [storedCategories, storedTypes] = await Promise.all([
        loadEnumList<SahhaBiomarkerCategory>(
          StorageKeys.biomarkerCategories,
          ALL_BIOMARKER_CATEGORIES
        ),
        loadEnumList<SahhaBiomarkerType>(
          StorageKeys.biomarkerTypes,
          ALL_BIOMARKER_TYPES
        ),
      ]);
      if (cancelled) {
        return;
      }
      if (storedCategories !== null) {
        setCategories(new Set(storedCategories));
      }
      if (storedTypes !== null) {
        setTypes(new Set(storedTypes));
      }
    };
    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  // Selections in enum order so the request never depends on tap order.
  const selectedCategories = useMemo(
    () =>
      ALL_BIOMARKER_CATEGORIES.filter((category) => categories.has(category)),
    [categories]
  );
  const selectedTypes = useMemo(
    () => ALL_BIOMARKER_TYPES.filter((type) => types.has(type)),
    [types]
  );

  const hasSelection =
    selectedCategories.length > 0 && selectedTypes.length > 0;

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

  const commitCategories = (next: ReadonlySet<SahhaBiomarkerCategory>) => {
    setCategories(next);
    saveEnumList(
      StorageKeys.biomarkerCategories,
      ALL_BIOMARKER_CATEGORIES.filter((category) => next.has(category))
    );
  };

  const commitTypes = (next: ReadonlySet<SahhaBiomarkerType>) => {
    setTypes(next);
    saveEnumList(
      StorageKeys.biomarkerTypes,
      ALL_BIOMARKER_TYPES.filter((type) => next.has(type))
    );
  };

  const toggleCategory = (category: SahhaBiomarkerCategory) => {
    const next = new Set(categories);
    if (next.has(category)) {
      next.delete(category);
    } else {
      next.add(category);
    }
    commitCategories(next);
  };

  const onGetBiomarkers = () => {
    if (!hasSelection || isLoading) {
      return;
    }
    const queriedStart = start;
    const queriedEnd = end;
    setIsLoading(true);
    withSdk(
      'Sahha.getBiomarkers',
      (sdk) => {
        sdk.getBiomarkers(
          selectedCategories,
          selectedTypes,
          queriedStart.getTime(),
          queriedEnd.getTime(),
          (error: string, value: string) => {
            setIsLoading(false);
            if (error) {
              console.log(`GET BIOMARKERS error: ${error}`);
              setRawResponse(null);
              setEntries([]);
              setQueried(null);
              showSheet(
                'GET BIOMARKERS',
                'Request failed — authenticate the profile and try again',
                error,
                true
              );
              return;
            }
            const raw = value ?? '';
            console.log(`GET BIOMARKERS: ${raw}`);
            setRawResponse(raw);
            setEntries(parseEntries(raw));
            setQueried({ start: queriedStart, end: queriedEnd });
          }
        );
      },
      () => setIsLoading(false)
    );
  };

  // Insertion ordered, so types appear in the order the API returned them.
  const groups = useMemo<BiomarkerGroup[]>(() => {
    const byType = new Map<string, BiomarkerEntry[]>();
    for (const entry of entries) {
      const title = entry.type ?? 'Unknown type';
      const bucket = byType.get(title);
      if (bucket) {
        bucket.push(entry);
      } else {
        byType.set(title, [entry]);
      }
    }
    return Array.from(byType, ([title, groupEntries]) => ({
      title,
      entries: groupEntries,
    }));
  }, [entries]);

  const typesSummary =
    selectedTypes.length === ALL_BIOMARKER_TYPES.length
      ? `All types (${ALL_BIOMARKER_TYPES.length})`
      : `${selectedTypes.length} of ${ALL_BIOMARKER_TYPES.length} selected`;

  const resultCount =
    entries.length === 1 ? '1 result' : `${entries.length} results`;

  const rangeLabel =
    queried === null
      ? null
      : `${formatDateTime(queried.start)} – ${formatDateTime(queried.end)}`;

  const hint = !hasSelection
    ? selectedCategories.length === 0
      ? 'Select at least one category to run the request.'
      : 'Select at least one biomarker type to run the request.'
    : null;

  return (
    <>
      <ScrollView
        style={[styles.screen, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.xxl * 2,
        }}
      >
        <SectionHeader title="CATEGORIES" />
        <View style={[styles.chipWrap, { gap: theme.spacing.sm }]}>
          {ALL_BIOMARKER_CATEGORIES.map((category) => (
            <FilterChip
              key={category}
              theme={theme}
              label={prettyLabel(category)}
              selected={categories.has(category)}
              onPress={() => toggleCategory(category)}
            />
          ))}
        </View>

        <SectionHeader title="TYPES" style={{ marginTop: theme.spacing.xl }} />
        <Card onPress={() => setPickerVisible(true)}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryText}>
              <Text
                style={[
                  styles.summaryLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                BIOMARKER TYPES
              </Text>
              <Text
                style={[styles.summaryValue, { color: theme.colors.onSurface }]}
              >
                {typesSummary}
              </Text>
            </View>
            <Text
              style={[styles.summaryGlyph, { color: theme.colors.primary }]}
            >
              ⚙
            </Text>
          </View>
        </Card>

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

        {hint !== null ? (
          <View style={{ marginTop: theme.spacing.lg }}>
            <InlineHint message={hint} />
          </View>
        ) : null}

        <AppButton
          title="GET BIOMARKERS"
          loading={isLoading}
          disabled={!hasSelection}
          onPress={onGetBiomarkers}
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
                    'GET BIOMARKERS',
                    resultCount,
                    tryPrettyJson(rawResponse),
                    false
                  )
                }
              />
            </View>

            {groups.length === 0 ? (
              <EmptyResults theme={theme} />
            ) : (
              groups.map((group) => (
                <BiomarkerGroupCard
                  key={group.title}
                  theme={theme}
                  title={group.title}
                  entries={group.entries}
                  initiallyExpanded={groups.length === 1}
                />
              ))
            )}
          </View>
        ) : null}
      </ScrollView>

      <MultiSelectSheet
        visible={pickerVisible}
        title="Biomarker types"
        options={BIOMARKER_TYPES_GROUPED}
        selected={selectedTypes}
        labelOf={(type) => type}
        groupOf={biomarkerTypeGroupOf}
        onApply={(selection) => {
          commitTypes(new Set(selection));
          setPickerVisible(false);
        }}
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

/** One returned biomarker type, with its entries behind a disclosure row. */
function BiomarkerGroupCard({
  theme,
  title,
  entries,
  initiallyExpanded,
}: {
  theme: AppTheme;
  title: string;
  entries: readonly BiomarkerEntry[];
  initiallyExpanded: boolean;
}): React.JSX.Element {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const countLabel =
    entries.length === 1 ? '1 entry' : `${entries.length} entries`;

  return (
    <Card style={[styles.flushCard, { marginBottom: theme.spacing.sm }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((previous) => !previous)}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          padding: theme.spacing.lg,
          backgroundColor: pressed ? theme.colors.surfaceVariant : undefined,
        })}
      >
        <View style={styles.groupHeaderText}>
          <Text style={[styles.groupTitle, { color: theme.colors.onSurface }]}>
            {prettyLabel(title)}
          </Text>
          <Text
            style={[
              styles.groupCount,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {countLabel}
          </Text>
        </View>
        <Text
          style={[styles.chevron, { color: theme.colors.onSurfaceVariant }]}
        >
          {expanded ? '▾' : '▸'}
        </Text>
      </Pressable>

      {expanded ? (
        <View style={{ paddingBottom: theme.spacing.xs }}>
          {entries.map((entry, index) => (
            <BiomarkerRow
              key={`${title}:${index}`}
              theme={theme}
              entry={entry}
            />
          ))}
        </View>
      ) : null}
    </Card>
  );
}

function BiomarkerRow({
  theme,
  entry,
}: {
  theme: AppTheme;
  entry: BiomarkerEntry;
}): React.JSX.Element {
  const value = entry.value ?? '—';
  const headline = entry.unit === null ? value : `${value} ${entry.unit}`;
  const chips = [entry.periodicity, entry.aggregation, entry.category].filter(
    (chip): chip is string => chip !== null
  );

  return (
    <View
      style={{
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
      }}
    >
      <Text style={[styles.rowValue, { color: theme.colors.onSurface }]}>
        {headline}
      </Text>
      {chips.length > 0 ? (
        <View
          style={[
            styles.chipWrap,
            { gap: theme.spacing.xs + 2, marginTop: theme.spacing.xs + 2 },
          ]}
        >
          {chips.map((chip, index) => (
            <MiniChip key={`${chip}:${index}`} theme={theme} label={chip} />
          ))}
        </View>
      ) : null}
      {entry.period !== null ? (
        <Text
          style={[
            styles.rowPeriod,
            {
              color: theme.colors.onSurfaceVariant,
              marginTop: theme.spacing.xs + 2,
            },
          ]}
        >
          {entry.period}
        </Text>
      ) : null}
    </View>
  );
}

function MiniChip({
  theme,
  label,
}: {
  theme: AppTheme;
  label: string;
}): React.JSX.Element {
  return (
    <View
      style={[
        styles.miniChip,
        {
          backgroundColor: theme.colors.surfaceVariant,
          paddingHorizontal: theme.spacing.sm,
        },
      ]}
    >
      <Text
        style={[styles.miniChipLabel, { color: theme.colors.onSurfaceVariant }]}
      >
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
        No biomarkers for this range
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
        Sensor data can take a while to process after it is collected. Check
        that the profile is authenticated, that the sensors for these types are
        enabled, and try a wider date range.
      </Text>
    </Card>
  );
}

/**
 * Decodes the response array into display entries. A payload that is not a
 * JSON array yields no entries rather than throwing.
 */
function parseEntries(raw: string): BiomarkerEntry[] {
  let decoded: unknown;
  try {
    decoded = JSON.parse(raw);
  } catch {
    console.log('GET BIOMARKERS: response was not JSON');
    return [];
  }
  if (!Array.isArray(decoded)) {
    return [];
  }

  const entries: BiomarkerEntry[] = [];
  for (const item of decoded) {
    const fields = normaliseFields(item);
    if (fields === null) {
      continue;
    }
    entries.push({
      type:
        readString(fields, 'type') ??
        readString(fields, 'biomarkerType') ??
        readString(fields, 'name'),
      category: readString(fields, 'category'),
      value: readString(fields, 'value'),
      unit: readString(fields, 'unit'),
      periodicity: readString(fields, 'periodicity'),
      aggregation: readString(fields, 'aggregation'),
      period: periodLabel(
        readRaw(fields, 'startDateTime') ?? readRaw(fields, 'startDate'),
        readRaw(fields, 'endDateTime') ?? readRaw(fields, 'endDate')
      ),
    });
  }
  return entries;
}

/**
 * Lower cases keys and strips underscores so the same lookup works whether
 * the platform returns `startDateTime` or `start_date_time`.
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

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return String(value);
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
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

function periodLabel(start: unknown, end: unknown): string | null {
  const startLabel = formatTimestamp(start);
  const endLabel = formatTimestamp(end);
  if (startLabel === null && endLabel === null) {
    return null;
  }
  if (startLabel === null) {
    return `until ${endLabel}`;
  }
  if (endLabel === null) {
    return `from ${startLabel}`;
  }
  return `${startLabel} – ${endLabel}`;
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
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    letterSpacing: 0.6,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 15,
    marginTop: 2,
  },
  summaryGlyph: {
    fontSize: 16,
    marginLeft: 8,
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
  groupHeaderText: {
    flex: 1,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  groupCount: {
    fontSize: 12,
    marginTop: 2,
  },
  chevron: {
    fontSize: 14,
    marginLeft: 8,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  rowPeriod: {
    fontSize: 12,
  },
  miniChip: {
    borderRadius: 6,
    paddingVertical: 2,
  },
  miniChipLabel: {
    fontSize: 11,
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
