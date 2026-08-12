import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Sahha, { SahhaSensorStatus } from 'sahha-react-native';
import type { SahhaSensor } from 'sahha-react-native';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { InlineHint } from '../components/InlineHint';
import { MultiSelectSheet } from '../components/MultiSelectSheet';
import { ResponseSheet } from '../components/ResponseSheet';
import { SectionHeader } from '../components/SectionHeader';
import { StatusPill } from '../components/StatusPill';
import {
  DEFAULT_DIAGNOSTIC_SENSORS,
  SENSORS_GROUPED,
  sensorGroupOf,
} from '../data/groups';
import { StorageKeys, loadEnumList, saveEnumList } from '../data/storage';
import { useAppTheme } from '../theme';
import type { AppTheme } from '../theme';

type SdkModule = NonNullable<typeof Sahha>;

interface LogEntry {
  id: number;
  time: string;
  message: string;
  isError: boolean;
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

const MAX_LOG_ENTRIES = 50;

const MODULE_MISSING = 'The Sahha native module is not linked in this build.';

const INTRO_COPY =
  'RUN ALL CHECKS re-runs authentication, the combined status and every row ' +
  'of the matrix below. Each matrix row is its own single-sensor ' +
  'getSensorStatus() call, because one call over a set returns a single ' +
  'merged status.';

const ENABLE_COPY =
  'enableSensors() prompts for permission, then re-checks the status of ' +
  'every sensor under test.';

const POST_COPY =
  'postSensorData() is fire-and-forget — it returns no result. iOS only; on ' +
  'Android it is a no-op.';

const SETTINGS_COPY =
  'openAppSettings() opens the OS permission screen for this app.';

/** `HH:mm:ss`, matching the Flutter example's log timestamps. */
function timestamp(): string {
  const now = new Date();
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(
    now.getSeconds()
  )}`;
}

/**
 * One-stop screen for answering "why is my data not flowing?" on a device:
 * authentication plus combined sensor status, a per-sensor status matrix, the
 * three side-effecting SDK calls and an on-screen activity log so the
 * maintainer does not need the Xcode/adb console. Ported from the Sahha
 * Flutter example app (`Views/SensorDiagnosticsView.dart`).
 */
export function SensorDiagnosticsScreen(): React.JSX.Element {
  const theme = useAppTheme();

  const [sensors, setSensors] = useState<readonly SahhaSensor[]>(
    DEFAULT_DIAGNOSTIC_SENSORS
  );
  const [hydrated, setHydrated] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);

  const [authBusy, setAuthBusy] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const [combinedBusy, setCombinedBusy] = useState(false);
  const [combinedStatus, setCombinedStatus] =
    useState<SahhaSensorStatus | null>(null);

  const [statuses, setStatuses] = useState<
    ReadonlyMap<SahhaSensor, SahhaSensorStatus>
  >(() => new Map());
  const [querying, setQuerying] = useState<ReadonlySet<SahhaSensor>>(
    () => new Set()
  );

  const [enableBusy, setEnableBusy] = useState(false);
  const [enableResult, setEnableResult] = useState<SahhaSensorStatus | null>(
    null
  );
  const [postResult, setPostResult] = useState<string | null>(null);
  const [settingsResult, setSettingsResult] = useState<string | null>(null);

  const [log, setLog] = useState<readonly LogEntry[]>([]);
  const [sheet, setSheet] = useState<SheetState>(CLOSED_SHEET);

  const nextLogId = useRef(0);
  const autoRan = useRef(false);

  const appendLog = useCallback((message: string, isError = false) => {
    nextLogId.current += 1;
    const entry: LogEntry = {
      id: nextLogId.current,
      time: timestamp(),
      message,
      isError,
    };
    setLog((current) => [entry, ...current].slice(0, MAX_LOG_ENTRIES));
  }, []);

  /** Hard failures get a log line, a device-log line and a response sheet. */
  const reportError = useCallback(
    (action: string, message: string, subtitle?: string) => {
      console.log(`Diagnostics: ${action} failed -> ${message}`);
      appendLog(`${action} FAILED: ${message}`, true);
      setSheet({
        visible: true,
        title: `${action} failed`,
        subtitle: subtitle ?? '',
        body: message,
        isError: true,
      });
    },
    [appendLog]
  );

  const requireSdk = useCallback(
    (action: string): SdkModule | null => {
      const sdk = Sahha;
      if (!sdk) {
        reportError(action, MODULE_MISSING);
        return null;
      }
      return sdk;
    },
    [reportError]
  );

  // Restore the saved sensors under test; nothing stored keeps the defaults.
  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      const stored = await loadEnumList<SahhaSensor>(
        StorageKeys.diagnosticsSensors,
        SENSORS_GROUPED
      );
      if (cancelled) {
        return;
      }
      if (stored !== null) {
        setSensors(stored);
      }
      setHydrated(true);
    };
    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    saveEnumList(StorageKeys.diagnosticsSensors, sensors);
  }, [hydrated, sensors]);

  const refreshAuthentication = useCallback(() => {
    const sdk = requireSdk('isAuthenticated()');
    if (!sdk) {
      setAuthBusy(false);
      setIsAuthenticated(null);
      return;
    }
    setAuthBusy(true);
    sdk.isAuthenticated((error: string, success: boolean) => {
      setAuthBusy(false);
      if (error) {
        setIsAuthenticated(null);
        reportError('isAuthenticated()', error);
        return;
      }
      console.log(`Diagnostics: isAuthenticated() -> ${success}`);
      setIsAuthenticated(success);
      appendLog(`isAuthenticated() -> ${success}`);
    });
  }, [appendLog, reportError, requireSdk]);

  const refreshCombinedStatus = useCallback(
    (list: readonly SahhaSensor[]) => {
      if (list.length === 0) {
        setCombinedBusy(false);
        setCombinedStatus(null);
        return;
      }
      const action = `getSensorStatus(${list.length} sensors)`;
      const sdk = requireSdk(action);
      if (!sdk) {
        setCombinedBusy(false);
        setCombinedStatus(null);
        return;
      }
      setCombinedBusy(true);
      sdk.getSensorStatus(
        [...list],
        (error: string, value: SahhaSensorStatus) => {
          setCombinedBusy(false);
          if (error) {
            setCombinedStatus(null);
            reportError(action, error);
            return;
          }
          console.log(`Diagnostics: ${action} -> ${SahhaSensorStatus[value]}`);
          setCombinedStatus(value);
          appendLog(`${action} -> ${SahhaSensorStatus[value]}`);
        }
      );
    },
    [appendLog, reportError, requireSdk]
  );

  /**
   * getSensorStatus returns ONE merged status for a set, so the matrix is
   * built from a single-sensor call per row. Resolves with the error string,
   * or null on success, so batch callers can aggregate failures.
   */
  const querySensorStatus = useCallback(
    (sensor: SahhaSensor): Promise<string | null> => {
      const sdk = Sahha;
      if (!sdk) {
        return Promise.resolve(MODULE_MISSING);
      }
      setQuerying((current) => new Set(current).add(sensor));
      return new Promise<string | null>((resolve) => {
        sdk.getSensorStatus(
          [sensor],
          (error: string, value: SahhaSensorStatus) => {
            setQuerying((current) => {
              const next = new Set(current);
              next.delete(sensor);
              return next;
            });
            if (error) {
              console.log(
                `Diagnostics: getSensorStatus([${sensor}]) -> ${error}`
              );
              setStatuses((current) => {
                const next = new Map(current);
                next.delete(sensor);
                return next;
              });
              appendLog(`${sensor} FAILED: ${error}`, true);
              resolve(error);
              return;
            }
            console.log(
              `Diagnostics: getSensorStatus([${sensor}]) -> ${SahhaSensorStatus[value]}`
            );
            setStatuses((current) => new Map(current).set(sensor, value));
            appendLog(`${sensor} -> ${SahhaSensorStatus[value]}`);
            resolve(null);
          }
        );
      });
    },
    [appendLog]
  );

  const refreshMatrix = useCallback(
    (list: readonly SahhaSensor[]) => {
      if (list.length === 0) {
        setStatuses(new Map());
        return;
      }
      Promise.all(list.map((sensor) => querySensorStatus(sensor))).then(
        (results) => {
          const failures = results.filter(
            (result): result is string => result !== null
          );
          if (failures.length === 0) {
            return;
          }
          // One sheet for the batch, not one per failing sensor.
          setSheet({
            visible: true,
            title: 'getSensorStatus failed',
            subtitle: `${failures.length} of ${list.length} sensors`,
            body: failures.join('\n\n'),
            isError: true,
          });
        }
      );
    },
    [querySensorStatus]
  );

  const refreshSensor = useCallback(
    (sensor: SahhaSensor) => {
      querySensorStatus(sensor).then((error) => {
        if (error === null) {
          return;
        }
        setSheet({
          visible: true,
          title: 'getSensorStatus failed',
          subtitle: sensor,
          body: error,
          isError: true,
        });
      });
    },
    [querySensorStatus]
  );

  const refreshAll = useCallback(
    (list: readonly SahhaSensor[]) => {
      appendLog('Running all diagnostics checks');
      refreshAuthentication();
      refreshCombinedStatus(list);
      refreshMatrix(list);
    },
    [appendLog, refreshAuthentication, refreshCombinedStatus, refreshMatrix]
  );

  // Mirror the Dart `initState`: restore, then run every check once.
  useEffect(() => {
    if (!hydrated || autoRan.current) {
      return;
    }
    autoRan.current = true;
    refreshAll(sensors);
  }, [hydrated, sensors, refreshAll]);

  const applySensors = (selection: SahhaSensor[]) => {
    setPickerVisible(false);
    setSensors(selection);
    setStatuses((current) => {
      const next = new Map<SahhaSensor, SahhaSensorStatus>();
      for (const sensor of selection) {
        const status = current.get(sensor);
        if (status !== undefined) {
          next.set(sensor, status);
        }
      }
      return next;
    });
    appendLog(`Sensors under test: ${selection.length} selected`);
    refreshCombinedStatus(selection);
    refreshMatrix(selection);
  };

  const onEnableSensors = () => {
    if (sensors.length === 0) {
      appendLog('enableSensors() skipped — no sensors selected');
      return;
    }
    const action = `enableSensors(${sensors.length} sensors)`;
    const sdk = requireSdk(action);
    if (!sdk) {
      setEnableBusy(false);
      return;
    }
    setEnableBusy(true);
    appendLog(`${action} requested`);
    sdk.enableSensors(
      [...sensors],
      (error: string, value: SahhaSensorStatus) => {
        setEnableBusy(false);
        if (error) {
          reportError(action, error);
          return;
        }
        console.log(`Diagnostics: ${action} -> ${SahhaSensorStatus[value]}`);
        setEnableResult(value);
        appendLog(`enableSensors() -> ${SahhaSensorStatus[value]}`);
        refreshCombinedStatus(sensors);
        refreshMatrix(sensors);
      }
    );
  };

  const onPostSensorData = () => {
    Sahha?.postSensorData();
    console.log('Diagnostics: postSensorData() called — fire and forget');
    setPostResult(`Requested ${timestamp()}`);
    appendLog(
      'postSensorData() called — fire-and-forget (void, no result callback)'
    );
  };

  const onOpenAppSettings = () => {
    Sahha?.openAppSettings();
    console.log('Diagnostics: openAppSettings() called');
    setSettingsResult(`Opened ${timestamp()}`);
    appendLog('openAppSettings() called — check the OS permission screen');
  };

  const authGlyph =
    isAuthenticated === true ? '✓' : isAuthenticated === false ? '✗' : '—';
  const authColor =
    isAuthenticated === true
      ? theme.colors.success
      : isAuthenticated === false
        ? theme.colors.warning
        : theme.colors.onSurfaceVariant;
  const authSubtitle =
    isAuthenticated === true
      ? 'A profile is signed in, so data can be posted.'
      : isAuthenticated === false
        ? 'No data will flow until a profile is authenticated.'
        : 'isAuthenticated() has not returned a result yet.';

  const anyBusy = authBusy || combinedBusy || querying.size > 0;

  return (
    <>
      <ScrollView
        style={[styles.screen, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.xxl * 2,
        }}
      >
        <InlineHint message={INTRO_COPY} />

        <SectionHeader
          title="OVERVIEW"
          style={{ marginTop: theme.spacing.xl }}
        />
        <Card>
          <SummaryRow
            theme={theme}
            title="Authentication"
            subtitle={authSubtitle}
            caption="isAuthenticated()"
            onPress={refreshAuthentication}
            trailing={
              authBusy ? (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.onSurfaceVariant}
                />
              ) : (
                <Text style={[styles.authGlyph, { color: authColor }]}>
                  {authGlyph}
                </Text>
              )
            }
          />
          <Divider theme={theme} />
          <SummaryRow
            theme={theme}
            title="Combined status"
            subtitle={
              sensors.length === 0
                ? 'No sensors under test.'
                : `One getSensorStatus() call for all ${sensors.length} selected sensors.`
            }
            caption="getSensorStatus(sensors)"
            onPress={() => refreshCombinedStatus(sensors)}
            trailing={
              <StatusPill status={combinedStatus} busy={combinedBusy} />
            }
          />
          <AppButton
            title="RUN ALL CHECKS"
            loading={anyBusy}
            onPress={() => refreshAll(sensors)}
            style={{ marginTop: theme.spacing.lg }}
          />
        </Card>

        <View style={[styles.headerRow, { marginTop: theme.spacing.xl }]}>
          <SectionHeader title="SENSOR STATUS" style={styles.headerTitle} />
          <TextButton
            theme={theme}
            title="Edit sensors"
            onPress={() => setPickerVisible(true)}
          />
          <TextButton
            theme={theme}
            title="↻"
            accessibilityLabel="Refresh every sensor"
            onPress={() => refreshMatrix(sensors)}
          />
        </View>
        {sensors.length === 0 ? (
          <Card onPress={() => setPickerVisible(true)}>
            <Text style={[styles.rowTitle, { color: theme.colors.onSurface }]}>
              No sensors under test
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
              Tap here, or "Edit sensors", to pick the sensors to check.
            </Text>
          </Card>
        ) : (
          <Card>
            {sensors.map((sensor, index) => (
              <View key={sensor}>
                {index === 0 ? null : <Divider theme={theme} />}
                <MatrixRow
                  theme={theme}
                  sensor={sensor}
                  group={sensorGroupOf(sensor)}
                  status={statuses.get(sensor)}
                  busy={querying.has(sensor)}
                  onPress={refreshSensor}
                />
              </View>
            ))}
          </Card>
        )}

        <SectionHeader
          title="ACTIONS"
          style={{ marginTop: theme.spacing.xl }}
        />
        <Card>
          <SummaryRow
            theme={theme}
            title="Enable selected sensors"
            subtitle={ENABLE_COPY}
            caption="enableSensors(sensors)"
            onPress={onEnableSensors}
            trailing={
              enableBusy ? (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.onSurfaceVariant}
                />
              ) : enableResult === null ? null : (
                <StatusPill status={enableResult} />
              )
            }
          />
          <Divider theme={theme} />
          <SummaryRow
            theme={theme}
            title="Post sensor data"
            subtitle={POST_COPY}
            caption="postSensorData()"
            onPress={onPostSensorData}
            trailing={
              postResult === null ? null : (
                <Text
                  style={[
                    styles.caption,
                    {
                      fontFamily: theme.mono,
                      color: theme.colors.onSurfaceVariant,
                    },
                  ]}
                >
                  {postResult}
                </Text>
              )
            }
          />
          <Divider theme={theme} />
          <SummaryRow
            theme={theme}
            title="Open app settings"
            subtitle={SETTINGS_COPY}
            caption="openAppSettings()"
            onPress={onOpenAppSettings}
            trailing={
              settingsResult === null ? null : (
                <Text
                  style={[
                    styles.caption,
                    {
                      fontFamily: theme.mono,
                      color: theme.colors.onSurfaceVariant,
                    },
                  ]}
                >
                  {settingsResult}
                </Text>
              )
            }
          />
        </Card>

        <View style={[styles.headerRow, { marginTop: theme.spacing.xl }]}>
          <SectionHeader title="ACTIVITY LOG" style={styles.headerTitle} />
          <Text
            style={[styles.caption, { color: theme.colors.onSurfaceVariant }]}
          >
            {`${log.length}/${MAX_LOG_ENTRIES}`}
          </Text>
          <TextButton
            theme={theme}
            title="Clear"
            onPress={() => setLog([])}
            disabled={log.length === 0}
          />
        </View>
        <Card>
          {log.length === 0 ? (
            <Text
              style={[styles.body, { color: theme.colors.onSurfaceVariant }]}
            >
              Nothing yet. Every action and result is logged here, newest first.
            </Text>
          ) : (
            log.map((entry) => (
              <Text
                key={entry.id}
                style={[
                  styles.logLine,
                  {
                    fontFamily: theme.mono,
                    color: entry.isError
                      ? theme.colors.error
                      : theme.colors.onSurface,
                  },
                ]}
              >
                {`${entry.time}  ${entry.message}`}
              </Text>
            ))
          )}
        </Card>
      </ScrollView>

      <MultiSelectSheet<SahhaSensor>
        visible={pickerVisible}
        title="Sensors under test"
        options={SENSORS_GROUPED}
        selected={sensors}
        groupOf={sensorGroupOf}
        onApply={applySensors}
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

function Divider({ theme }: { theme: AppTheme }): React.JSX.Element {
  return (
    <View
      style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]}
    />
  );
}

function SummaryRow({
  theme,
  title,
  subtitle,
  caption,
  trailing,
  onPress,
}: {
  theme: AppTheme;
  title: string;
  subtitle: string;
  caption: string;
  trailing: React.ReactNode;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: theme.colors.onSurface }]}>
          {title}
        </Text>
        <Text
          style={[
            styles.caption,
            { fontFamily: theme.mono, color: theme.colors.primary },
          ]}
        >
          {caption}
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
          {subtitle}
        </Text>
      </View>
      <View style={styles.rowTrailing}>{trailing}</View>
    </Pressable>
  );
}

const MatrixRow = memo(function MatrixRow({
  theme,
  sensor,
  group,
  status,
  busy,
  onPress,
}: {
  theme: AppTheme;
  sensor: SahhaSensor;
  group: string;
  status: SahhaSensorStatus | undefined;
  busy: boolean;
  onPress: (sensor: SahhaSensor) => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Re-check ${sensor}`}
      onPress={() => onPress(sensor)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View style={styles.rowText}>
        <Text
          numberOfLines={1}
          style={[
            styles.sensorName,
            { fontFamily: theme.mono, color: theme.colors.onSurface },
          ]}
        >
          {sensor}
        </Text>
        <Text
          style={[styles.caption, { color: theme.colors.onSurfaceVariant }]}
        >
          {group}
        </Text>
      </View>
      <StatusPill status={status} busy={busy} />
      <Text
        style={[
          styles.refreshGlyph,
          { color: theme.colors.primary, marginLeft: theme.spacing.sm },
        ]}
      >
        ↻
      </Text>
    </Pressable>
  );
});

function TextButton({
  theme,
  title,
  onPress,
  disabled = false,
  accessibilityLabel,
}: {
  theme: AppTheme;
  title: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
  },
  divider: {
    height: 1,
  },
  rowText: {
    flex: 1,
    marginRight: 12,
  },
  rowTrailing: {
    alignItems: 'flex-end',
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  sensorName: {
    fontSize: 13,
  },
  caption: {
    fontSize: 11,
  },
  body: {
    fontSize: 12,
    lineHeight: 18,
  },
  authGlyph: {
    fontSize: 18,
    fontWeight: '700',
  },
  refreshGlyph: {
    fontSize: 18,
  },
  textButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  logLine: {
    fontSize: 11,
    lineHeight: 16,
    paddingVertical: 2,
  },
});
