import type * as React from 'react';
import { StyleSheet, Text } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';
import { useAppTheme } from '../theme';

export interface SectionHeaderProps {
  title: string;
  style?: StyleProp<TextStyle>;
}

/** Small tinted label introducing a group of cards or list rows. */
export function SectionHeader({
  title,
  style,
}: SectionHeaderProps): React.JSX.Element {
  const theme = useAppTheme();
  return (
    <Text
      style={[
        styles.label,
        { color: theme.colors.primary, marginBottom: theme.spacing.sm },
        style,
      ]}
    >
      {title}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
});
