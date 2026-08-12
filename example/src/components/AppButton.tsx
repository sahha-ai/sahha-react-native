import type * as React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useAppTheme } from '../theme';

export type AppButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';

export interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Full-width action button used across every screen of the harness. */
export function AppButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  compact = false,
  style,
}: AppButtonProps): React.JSX.Element {
  const theme = useAppTheme();
  const isInactive = disabled || loading;

  let background = theme.colors.primary;
  let foreground = theme.colors.onPrimary;
  let borderColor = 'transparent';
  let borderWidth = 0;

  switch (variant) {
    case 'secondary':
      background = theme.colors.primaryContainer;
      foreground = theme.colors.onPrimaryContainer;
      break;
    case 'outline':
      background = 'transparent';
      foreground = theme.colors.primary;
      borderColor = theme.colors.outline;
      borderWidth = 1;
      break;
    case 'danger':
      background = theme.colors.errorContainer;
      foreground = theme.colors.onErrorContainer;
      break;
    case 'primary':
      break;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isInactive, busy: loading }}
      disabled={isInactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        compact ? styles.compact : styles.regular,
        {
          borderRadius: theme.radius.control,
          backgroundColor: background,
          borderWidth,
          borderColor,
          paddingHorizontal: theme.spacing.xl,
          opacity: isInactive ? 0.5 : pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={foreground} />
      ) : (
        <Text
          numberOfLines={1}
          style={[
            compact ? styles.labelCompact : styles.label,
            { color: foreground },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  regular: {
    height: 48,
  },
  compact: {
    height: 36,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  labelCompact: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});
