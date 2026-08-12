import type * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SahhaSensorStatus } from 'sahha-react-native';
import { useAppTheme } from '../theme';

export interface StatusPillProps {
  status: SahhaSensorStatus | null | undefined;
  busy?: boolean;
}

/** Compact pill showing a `SahhaSensorStatus`, or `—` when unknown. */
export function StatusPill({
  status,
  busy = false,
}: StatusPillProps): React.JSX.Element {
  const theme = useAppTheme();

  let background = theme.colors.surfaceVariant;
  let foreground = theme.colors.onSurfaceVariant;
  let label = '—';

  if (status !== null && status !== undefined) {
    label = SahhaSensorStatus[status] ?? String(status);
    switch (status) {
      case SahhaSensorStatus.enabled:
        background = theme.colors.successContainer;
        foreground = theme.colors.onSuccessContainer;
        break;
      case SahhaSensorStatus.pending:
        background = theme.colors.warningContainer;
        foreground = theme.colors.onWarningContainer;
        break;
      case SahhaSensorStatus.disabled:
        background = theme.colors.errorContainer;
        foreground = theme.colors.onErrorContainer;
        break;
      case SahhaSensorStatus.unavailable:
        break;
    }
  }

  return (
    <View
      style={[
        styles.pill,
        {
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.xs,
          borderRadius: theme.radius.pill,
          backgroundColor: background,
        },
      ]}
    >
      {busy ? (
        <ActivityIndicator size="small" color={foreground} />
      ) : (
        <Text numberOfLines={1} style={[styles.label, { color: foreground }]}>
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
