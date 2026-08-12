import type * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../theme';

export interface DeprecationBannerProps {
  replacement: string;
}

/** Warning banner shown at the top of screens backed by a deprecated API. */
export function DeprecationBanner({
  replacement,
}: DeprecationBannerProps): React.JSX.Element {
  const theme = useAppTheme();
  return (
    <View
      style={{
        backgroundColor: theme.colors.warningContainer,
        borderRadius: theme.radius.control,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
      }}
    >
      <Text style={[styles.text, { color: theme.colors.onWarningContainer }]}>
        {`⚠️ Deprecated — use ${replacement} instead.`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 13,
    lineHeight: 18,
  },
});
