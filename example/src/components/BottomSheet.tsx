import type * as React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Fraction of the screen the panel may occupy. Defaults to 0.85. */
  maxHeightRatio?: number;
}

/**
 * Shared bottom-sheet chrome for `MultiSelectSheet`, `SensorPickerSheet` and
 * `ResponseSheet`: a translucent backdrop that closes on tap, a bottom
 * anchored panel with rounded top corners and a drag-handle bar.
 */
export function BottomSheet({
  visible,
  onClose,
  children,
  maxHeightRatio = 0.85,
}: BottomSheetProps): React.JSX.Element {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          style={styles.backdrop}
        />
        <View
          style={[
            styles.panel,
            {
              maxHeight: `${Math.round(maxHeightRatio * 100)}%`,
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: theme.radius.card,
              borderTopRightRadius: theme.radius.card,
              borderColor: theme.colors.outlineVariant,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          <View
            style={[
              styles.handle,
              {
                borderRadius: theme.radius.pill,
                backgroundColor: theme.colors.outlineVariant,
                marginTop: theme.spacing.md,
                marginBottom: theme.spacing.sm,
              },
            ]}
          />
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  panel: {
    borderTopWidth: 1,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
  },
});
