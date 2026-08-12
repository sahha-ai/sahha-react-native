import type * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../theme';

export interface InlineHintProps {
  message: string;
}

/** Subtle inline note used for validation messages and usage hints. */
export function InlineHint({ message }: InlineHintProps): React.JSX.Element {
  const theme = useAppTheme();
  return (
    <View
      style={{
        backgroundColor: theme.colors.surfaceVariant,
        borderRadius: theme.radius.control,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
      }}
    >
      <Text style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
});
