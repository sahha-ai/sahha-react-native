import type * as React from 'react';
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAppTheme } from '../theme';
import type { AppTheme } from '../theme';
import { BottomSheet } from './BottomSheet';

export interface ResponseSheetProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  body: string;
  isError?: boolean;
  onClose: () => void;
}

/** Pretty-prints [raw] when it is valid JSON, otherwise returns it unchanged. */
export function tryPrettyJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

/**
 * Shows an SDK response (or error) in a bottom sheet with a selectable
 * monospace body and a share affordance.
 */
export function ResponseSheet({
  visible,
  title,
  subtitle,
  body,
  isError = false,
  onClose,
}: ResponseSheetProps): React.JSX.Element {
  const theme = useAppTheme();
  const accent = isError ? theme.colors.error : theme.colors.primary;

  const share = () => {
    Share.share({ message: body }).catch(() => {
      // The user dismissed the share sheet, or the platform refused it.
    });
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View
        style={[
          styles.header,
          {
            paddingLeft: theme.spacing.xl,
            paddingRight: theme.spacing.sm,
            paddingBottom: theme.spacing.sm,
          },
        ]}
      >
        <Text style={[styles.glyph, { color: accent }]}>
          {isError ? '⚠' : '✓'}
        </Text>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[styles.caption, { color: theme.colors.onSurfaceVariant }]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        <HeaderButton theme={theme} title="Share" onPress={share} />
        <HeaderButton theme={theme} title="Close" onPress={onClose} />
      </View>

      <View
        style={[styles.rule, { backgroundColor: theme.colors.outlineVariant }]}
      />

      <ScrollView
        style={styles.bodyScroll}
        contentContainerStyle={{ padding: theme.spacing.xl }}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Text
            selectable
            style={[
              styles.body,
              { fontFamily: theme.mono, color: theme.colors.onSurface },
            ]}
          >
            {body}
          </Text>
        </ScrollView>
      </ScrollView>
    </BottomSheet>
  );
}

function HeaderButton({
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
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Text style={[styles.buttonLabel, { color: theme.colors.primary }]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
  },
  glyph: {
    fontSize: 18,
    marginRight: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  caption: {
    fontSize: 12,
  },
  rule: {
    height: 1,
  },
  bodyScroll: {
    flexShrink: 1,
  },
  body: {
    fontSize: 12,
    lineHeight: 18,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
