import type * as React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useAppTheme } from '../theme';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

/** Bordered surface used as the base container on every screen. */
export function Card({
  children,
  style,
  onPress,
}: CardProps): React.JSX.Element {
  const theme = useAppTheme();

  const tokens: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    borderColor: theme.colors.outlineVariant,
    padding: theme.spacing.lg,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.base,
          tokens,
          pressed && styles.pressed,
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[styles.base, tokens, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.75,
  },
});
