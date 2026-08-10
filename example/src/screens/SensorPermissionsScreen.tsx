import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type * as React from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Sahha, { SahhaSensorStatus } from 'sahha-react-native';
import type { SahhaSensor } from 'sahha-react-native';
import type { RootStackParamList } from '../App';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { InlineHint } from '../components/InlineHint';
import { ResponseSheet } from '../components/ResponseSheet';
import { SectionHeader } from '../components/SectionHeader';
import { StatusPill } from '../components/StatusPill';
import {
  DEFAULT_PERMISSION_SENSORS,
  SENSORS_GROUPED,
  sensorGroupOf,
} from '../data/groups';
import { StorageKeys, loadEnumList, saveEnumList } from '../data/storage';
import { useAppTheme } from '../theme';
import type { AppTheme } from '../theme';

type PermissionsNavigation = NativeStackNavigationProp<
  RootStackParamList,
  'SensorPermissions'
>;

/** The two SDK calls this screen drives, used as the busy marker too. */
type CallName = 'getSensorStatus' | 'enableSensors';

interface SensorSection {
  title: string;
  data: readonly SahhaSensor[];
}

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

const ACTIONS_COPY =
  'Both calls run on exactly the checked list. ENABLE SENSORS is the one ' +
  'that triggers the OS permission prompt; GET SENSOR STATUS only reads the ' +
  'current state and never prompts.';

const DEFAULTS_COPY =
  'Select defaults checks steps, sleep and the whole reproductive and ' +
  'nutrition groups — the sensors backed by a Health Connect READ permission ' +
  "in the example app's AndroidManifest.xml. Anything outside that set can " +
  'never be granted on Android, however it is checked here; on iOS the ' +
  'HealthKit prompt covers whatever is requested.';

const OPEN_SETTINGS_COPY =
  'openAppSettings() opens the OS permission screen for this app. Reach for ' +
  'it when the status comes back disabled — the OS only prompts once, so a ' +
  'declined permission has to be flipped there.';

const DIAGNOSTICS_COPY =
  'This screen returns one combined status for the whole list. Sensor ' +
  "Diagnostics shows each sensor's individual status.";

/** Sensor sections in `SENSORS_GROUPED` order, built once for the list. */
const SECTIONS: readonly SensorSection[] = buildSections();

function buildSections(): SensorSection[] {
  const byGroup = new Map<string, SahhaSensor[]>();
  for (const sensor of SENSORS_GROUPED) {
    const title = sensorGroupOf(sensor);
    const bucket = byGroup.get(title);
    if (bucket) {
      bucket.push(sensor);
    } else {
      byGroup.set(title, [sensor]);
    }
  }
  return Array.from(byGroup, ([title, data]) => ({ title, data }));
}

/** `HH:mm:ss`, matching the Flutter example's log timestamps. */
function timestamp(): string {
  const now = new Date();
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(
    now.getSeconds()
  )}`;
}

function countLabel(count: number): string {
  if (count === 0) {
    return 'empty list';
  }
  return count === 1 ? '1 sensor' : `${count} sensors`;
}

/** Plain-English reading of the combined status, ported from `_StatusHero`. */
function describeStatus(
  status: SahhaSensorStatus | null,
  failed: boolean
): string {
  if (failed) {
    return 'The call failed — the error is in the response sheet.';
  }
  switch (status) {
    case SahhaSensorStatus.enabled:
      return 'Collection is active for every sensor in the list.';
    case SahhaSensorStatus.disabled:
      return 'The user declined, or turned the requested sensors off.';
    case SahhaSensorStatus.unavailable:
      return 'Health data is not available on this device.';
    case SahhaSensorStatus.pending:
      return 'The user has not been asked for these sensors yet.';
    default:
      return 'Run GET SENSOR STATUS or ENABLE SENSORS on the checked list.';
  }
}

/**
 * Exercises `getSensorStatus`, `enableSensors` and `openAppSettings` against
 * an arbitrary set of sensors picked on screen. Ported from the Sahha Flutter
 * example app (`Views/SensorPermissionView.dart`).
 *
 * Both SDK calls run on exactly the checked list, so the screen doubles as the
 * "which subset behaves how?" test: check the curated defaults, everything, or
 * any subset in between. The selection is persisted so a device keeps whatever
 * the last test was.
 */
export function SensorPermissionsScreen(): React.JSX.Element {
  const theme = useAppTheme();
  const navigation = useNavigation<PermissionsNavigation>();

  const [selected, setSelected] = useState<ReadonlySet<SahhaSensor>>(
    () => new Set(DEFAULT_PERMISSION_SENSORS)
  );
  const [hydrated, setHydrated] = useState(false);

  const [status, setStatus] = useState<SahhaSensorStatus | null>(null);
  const [failed, setFailed] = useState(false);
  const [caption, setCaption] = useState<string | null>(null);
  const [busyCall, setBusyCall] = useState<CallName | null>(null);
  const [settingsResult, setSettingsResult] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetState>(CLOSED_SHEET);

  const autoChecked = useRef(false);

  /** The checked sensors in grouped-enum order — the exact SDK argument. */
  const checked = useMemo(
    () => SENSORS_GROUPED.filter((sensor) => selected.has(sensor)),
    [selected]
  );

  // Restore the saved selection; a missing/unusable payload keeps the defaults.
  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      const stored = await loadEnumList<SahhaSensor>(
        StorageKeys.permissionSensors,
        SENSORS_GROUPED
      );
      if (cancelled) {
        return;
      }
      if (stored !== null) {
        setSelected(new Set(stored));
      }
      setHydrated(true);
    };
    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist every change, but never before the restore has landed.
  useEffect(() => {
    if (!hydrated) {
      return;
    }
    saveEnumList(StorageKeys.permissionSensors, checked);
  }, [hydrated, checked]);

  const showSheet = useCallback(
    (title: string, subtitle: string, body: string, isError: boolean) => {
      setSheet({ visible: true, title, subtitle, body, isError });
    },
    []
  );

  const runCall = useCallback(
    (name: CallName, sensors: SahhaSensor[]) => {
      const label = `${name} · ${countLabel(sensors.length)}`;
      const sdk = Sahha;
      if (!sdk) {
        setStatus(null);
        setFailed(true);
        setCaption(`${label} · unavailable · ${timestamp()}`);
        showSheet(
          `${name} failed`,
          countLabel(sensors.length),
          'The Sahha native module is not linked in this build.',
          true
        );
        return;
      }

      setBusyCall(name);
      setCaption(`${label} · running…`);

      const onResult = (error: string, value: SahhaSensorStatus) => {
        setBusyCall(null);
        if (error) {
          console.log(`Permissions: ${label} failed -> ${error}`);
          setStatus(null);
          setFailed(true);
          setCaption(`${label} · failed · ${timestamp()}`);
          showSheet(`${name} failed`, countLabel(sensors.length), error, true);
          return;
        }
        console.log(`Permissions: ${label} -> ${SahhaSensorStatus[value]}`);
        setStatus(value);
        setFailed(false);
        setCaption(`${label} · ${timestamp()}`);
      };

      if (name === 'enableSensors') {
        sdk.enableSensors(sensors, onResult);
      } else {
        sdk.getSensorStatus(sensors, onResult);
      }
    },
    [showSheet]
  );

  // Mirror the Dart `_restoreThenCheck`: one status read once the saved
  // selection is in place. The guard keeps it to a single run.
  useEffect(() => {
    if (!hydrated || autoChecked.current) {
      return;
    }
    autoChecked.current = true;
    if (checked.length > 0) {
      runCall('getSensorStatus', checked);
    }
  }, [hydrated, checked, runCall]);

  const toggleSensor = useCallback((sensor: SahhaSensor) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(sensor)) {
        next.delete(sensor);
      } else {
        next.add(sensor);
      }
      return next;
    });
  }, []);

  const toggleGroup = useCallback((section: SensorSection) => {
    setSelected((current) => {
      const next = new Set(current);
      const selectWholeGroup = !section.data.every((sensor) =>
        current.has(sensor)
      );
      for (const sensor of section.data) {
        if (selectWholeGroup) {
          next.add(sensor);
        } else {
          next.delete(sensor);
        }
      }
      return next;
    });
  }, []);

  const openAppSettings = () => {
    Sahha?.openAppSettings();
    console.log('Permissions: openAppSettings() called');
    setSettingsResult(`Opened ${timestamp()}`);
  };

  const nothingChecked = checked.length === 0;
  const busy = busyCall !== null;

  const listHeader = (
    <View>
      <Card>
        <View style={styles.heroRow}>
          <View style={styles.heroText}>
            <Text
              style={[
                styles.heroLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Combined status
            </Text>
            <Text
              numberOfLines={2}
              style={[
                styles.caption,
                {
                  fontFamily: theme.mono,
                  color: theme.colors.onSurfaceVariant,
                  marginTop: theme.spacing.xs,
                },
              ]}
            >
              {caption ?? 'No call made yet'}
            </Text>
          </View>
          <StatusPill status={failed ? null : status} busy={busy} />
        </View>
        <Text
          style={[
            styles.body,
            {
              color: theme.colors.onSurfaceVariant,
              marginTop: theme.spacing.sm,
            },
          ]}
        >
          {describeStatus(status, failed)}
        </Text>

        <View
          style={[
            styles.rule,
            {
              backgroundColor: theme.colors.outlineVariant,
              marginVertical: theme.spacing.md,
            },
          ]}
        />

        <Text style={[styles.countLabel, { color: theme.colors.onSurface }]}>
          {`${selected.size} of ${SENSORS_GROUPED.length} sensors selected`}
        </Text>
        <View style={styles.quickRow}>
          <TextButton
            theme={theme}
            title="Select defaults"
            onPress={() => setSelected(new Set(DEFAULT_PERMISSION_SENSORS))}
          />
          <TextButton
            theme={theme}
            title="All"
            onPress={() => setSelected(new Set(SENSORS_GROUPED))}
          />
          <TextButton
            theme={theme}
            title="None"
            onPress={() => setSelected(new Set<SahhaSensor>())}
          />
        </View>
        <Text style={[styles.body, { color: theme.colors.onSurfaceVariant }]}>
          {DEFAULTS_COPY}
        </Text>
      </Card>

      <SectionHeader title="ACTIONS" style={{ marginTop: theme.spacing.xl }} />
      <View style={{ gap: theme.spacing.md }}>
        <AppButton
          title="GET SENSOR STATUS"
          variant="secondary"
          loading={busyCall === 'getSensorStatus'}
          disabled={nothingChecked || busyCall === 'enableSensors'}
          onPress={() => runCall('getSensorStatus', checked)}
        />
        <AppButton
          title="ENABLE SENSORS"
          loading={busyCall === 'enableSensors'}
          disabled={nothingChecked || busyCall === 'getSensorStatus'}
          onPress={() => runCall('enableSensors', checked)}
        />
      </View>
      {nothingChecked ? (
        <View style={{ marginTop: theme.spacing.md }}>
          <InlineHint message="Nothing is checked. Both calls run on exactly the checked list, so check at least one sensor." />
        </View>
      ) : null}
      <Text
        style={[
          styles.body,
          {
            color: theme.colors.onSurfaceVariant,
            marginTop: theme.spacing.md,
          },
        ]}
      >
        {ACTIONS_COPY}
      </Text>

      <SectionHeader title="MORE" style={{ marginTop: theme.spacing.xl }} />
      <Card>
        <AppButton
          title="OPEN APP SETTINGS"
          variant="outline"
          onPress={openAppSettings}
        />
        <Text
          style={[
            styles.body,
            {
              color: theme.colors.onSurfaceVariant,
              marginTop: theme.spacing.md,
            },
          ]}
        >
          {OPEN_SETTINGS_COPY}
        </Text>
        {settingsResult !== null ? (
          <Text
            style={[
              styles.caption,
              {
                fontFamily: theme.mono,
                color: theme.colors.onSurfaceVariant,
                marginTop: theme.spacing.xs,
              },
            ]}
          >
            {settingsResult}
          </Text>
        ) : null}
      </Card>
      <Card
        style={{ marginTop: theme.spacing.md }}
        onPress={() => navigation.navigate('SensorDiagnostics')}
      >
        <View style={styles.navRow}>
          <View style={styles.navText}>
            <Text style={[styles.navTitle, { color: theme.colors.onSurface }]}>
              Per-sensor diagnostics
            </Text>
            <Text
              style={[
                styles.body,
                {
                  color: theme.colors.onSurfaceVariant,
                  marginTop: theme.spacing.xs,
                },
              ]}
            >
              {DIAGNOSTICS_COPY}
            </Text>
          </View>
          <Text
            style={[styles.chevron, { color: theme.colors.onSurfaceVariant }]}
          >
            ›
          </Text>
        </View>
      </Card>

      <SectionHeader title="SENSORS" style={{ marginTop: theme.spacing.xl }} />
    </View>
  );

  return (
    <>
      <SectionList<SahhaSensor, SensorSection>
        sections={SECTIONS}
        keyExtractor={(item) => item}
        extraData={selected}
        style={[styles.screen, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.xxl * 2,
        }}
        initialNumToRender={24}
        ListHeaderComponent={listHeader}
        renderSectionHeader={({ section }) => (
          <GroupRow
            theme={theme}
            section={section}
            selectedCount={section.data.reduce(
              (total, sensor) => (selected.has(sensor) ? total + 1 : total),
              0
            )}
            onToggle={toggleGroup}
          />
        )}
        renderItem={({ item }) => (
          <SensorRow
            theme={theme}
            sensor={item}
            checked={selected.has(item)}
            onToggle={toggleSensor}
          />
        )}
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

/** Checkbox drawn like `MultiSelectSheet`'s rows, with a tri-state variant. */
function CheckBox({
  theme,
  state,
}: {
  theme: AppTheme;
  state: 'on' | 'off' | 'partial';
}): React.JSX.Element {
  const filled = state !== 'off';
  return (
    <View
      style={[
        styles.box,
        filled ? styles.boxChecked : styles.boxUnchecked,
        {
          borderColor: theme.colors.outline,
          backgroundColor: filled ? theme.colors.primary : undefined,
          marginRight: theme.spacing.md,
        },
      ]}
    >
      {state === 'off' ? null : (
        <Text style={[styles.tick, { color: theme.colors.onPrimary }]}>
          {state === 'on' ? '✓' : '–'}
        </Text>
      )}
    </View>
  );
}

const GroupRow = memo(function GroupRow({
  theme,
  section,
  selectedCount,
  onToggle,
}: {
  theme: AppTheme;
  section: SensorSection;
  selectedCount: number;
  onToggle: (section: SensorSection) => void;
}): React.JSX.Element {
  const total = section.data.length;
  const state =
    selectedCount === 0 ? 'off' : selectedCount === total ? 'on' : 'partial';

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: state === 'on' }}
      accessibilityLabel={`${section.title}, ${selectedCount} of ${total} selected`}
      onPress={() => onToggle(section)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
        backgroundColor: pressed
          ? theme.colors.surfaceVariant
          : theme.colors.background,
      })}
    >
      <CheckBox theme={theme} state={state} />
      <Text style={[styles.groupTitle, { color: theme.colors.primary }]}>
        {section.title}
      </Text>
      <Text
        style={[
          styles.groupCount,
          {
            color:
              selectedCount === 0
                ? theme.colors.onSurfaceVariant
                : theme.colors.primary,
          },
        ]}
      >
        {`${selectedCount}/${total}`}
      </Text>
    </Pressable>
  );
});

const SensorRow = memo(function SensorRow({
  theme,
  sensor,
  checked,
  onToggle,
}: {
  theme: AppTheme;
  sensor: SahhaSensor;
  checked: boolean;
  onToggle: (sensor: SahhaSensor) => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onToggle(sensor)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        backgroundColor: pressed ? theme.colors.surfaceVariant : 'transparent',
      })}
    >
      <CheckBox theme={theme} state={checked ? 'on' : 'off'} />
      <Text
        numberOfLines={1}
        style={[
          styles.sensorName,
          { fontFamily: theme.mono, color: theme.colors.onSurface },
        ]}
      >
        {sensor}
      </Text>
    </Pressable>
  );
});

function TextButton({
  theme,
  title,
  onPress,
}: {
  theme: AppTheme;
  title: string;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        paddingRight: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Text style={[styles.textButton, { color: theme.colors.primary }]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroText: {
    flex: 1,
    marginRight: 12,
  },
  heroLabel: {
    fontSize: 11,
    letterSpacing: 0.6,
    fontWeight: '600',
  },
  caption: {
    fontSize: 11,
  },
  body: {
    fontSize: 12,
    lineHeight: 18,
  },
  rule: {
    height: 1,
  },
  countLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navText: {
    flex: 1,
  },
  navTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 20,
    marginLeft: 8,
  },
  groupTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  groupCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  sensorName: {
    flex: 1,
    fontSize: 12,
  },
  textButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    borderWidth: 0,
  },
  boxUnchecked: {
    borderWidth: 1.5,
  },
  tick: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
});
