import { useEffect, useMemo, useRef, useState } from 'react';
import type * as React from 'react';
import {
  FlatList,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAppTheme } from '../theme';
import type { AppTheme } from '../theme';
import { AppButton } from './AppButton';
import { BottomSheet } from './BottomSheet';
import { SectionHeader } from './SectionHeader';

export interface MultiSelectSheetProps<T extends string> {
  visible: boolean;
  title: string;
  options: readonly T[];
  selected: readonly T[];
  /** Fired on Apply press; the parent closes the sheet via `onClose`. */
  onApply: (selection: T[]) => void;
  onClose: () => void;
  labelOf?: (option: T) => string;
  /** When given, rows are grouped under headers. */
  groupOf?: (option: T) => string;
}

interface Group<T extends string> {
  title: string;
  data: T[];
}

/**
 * Searchable multi-select bottom sheet for the long SDK enum lists (biomarker
 * categories and types, score types, sensor sets). Selection is local while
 * the sheet is open and is only handed back on Apply.
 */
export function MultiSelectSheet<T extends string>({
  visible,
  title,
  options,
  selected,
  onApply,
  onClose,
  labelOf,
  groupOf,
}: MultiSelectSheetProps<T>): React.JSX.Element {
  const theme = useAppTheme();
  const [query, setQuery] = useState('');
  const [selection, setSelection] = useState<ReadonlySet<T>>(
    () => new Set(selected)
  );
  const wasVisible = useRef(visible);

  // Re-seed from props every time the sheet is opened so a cancelled edit is
  // discarded and a parent-side change is picked up.
  useEffect(() => {
    if (visible && !wasVisible.current) {
      setSelection(new Set(selected));
      setQuery('');
    }
    wasVisible.current = visible;
  }, [visible, selected]);

  const label = useMemo(
    () => labelOf ?? ((option: T): string => option),
    [labelOf]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length === 0) {
      return options;
    }
    return options.filter((option) =>
      label(option).toLowerCase().includes(needle)
    );
  }, [options, query, label]);

  const groups = useMemo<Group<T>[]>(() => {
    if (!groupOf) {
      return [];
    }
    const byGroup = new Map<string, T[]>();
    for (const option of filtered) {
      const name = groupOf(option);
      const bucket = byGroup.get(name);
      if (bucket) {
        bucket.push(option);
      } else {
        byGroup.set(name, [option]);
      }
    }
    return Array.from(byGroup, ([groupTitle, data]) => ({
      title: groupTitle,
      data,
    }));
  }, [filtered, groupOf]);

  const toggle = (option: T) => {
    setSelection((current) => {
      const next = new Set(current);
      if (next.has(option)) {
        next.delete(option);
      } else {
        next.add(option);
      }
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelection((current) => new Set([...current, ...filtered]));
  };

  const clearAll = () => {
    setSelection(new Set<T>());
  };

  const apply = () => {
    onApply(options.filter((option) => selection.has(option)));
  };

  const renderRow = (option: T) => (
    <CheckRow
      theme={theme}
      label={label(option)}
      checked={selection.has(option)}
      onPress={() => toggle(option)}
    />
  );

  const headerStyle = {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: theme.spacing.xl,
            paddingBottom: theme.spacing.sm,
          },
        ]}
      >
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            {title}
          </Text>
          <Text
            style={[styles.caption, { color: theme.colors.onSurfaceVariant }]}
          >
            {`${selection.size} of ${options.length} selected`}
          </Text>
        </View>
        <TextButton theme={theme} title="All" onPress={selectAllFiltered} />
        <TextButton theme={theme} title="None" onPress={clearAll} />
      </View>

      <View style={{ paddingHorizontal: theme.spacing.xl }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          autoCapitalize="none"
          autoCorrect={false}
          style={[
            styles.search,
            {
              borderColor: theme.colors.outlineVariant,
              borderRadius: theme.radius.control,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
              color: theme.colors.onSurface,
            },
          ]}
        />
      </View>

      <View
        style={[
          styles.rule,
          {
            backgroundColor: theme.colors.outlineVariant,
            marginTop: theme.spacing.md,
          },
        ]}
      />

      <View style={styles.listWrapper}>
        {filtered.length === 0 ? (
          <EmptyState theme={theme} query={query} />
        ) : groupOf ? (
          <SectionList<T, Group<T>>
            sections={groups}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            stickySectionHeadersEnabled={false}
            contentContainerStyle={{ paddingBottom: theme.spacing.md }}
            renderSectionHeader={({ section }) => (
              <SectionHeader title={section.title} style={headerStyle} />
            )}
            renderItem={({ item }) => renderRow(item)}
          />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingVertical: theme.spacing.sm }}
            renderItem={({ item }) => renderRow(item)}
          />
        )}
      </View>

      <View
        style={[styles.rule, { backgroundColor: theme.colors.outlineVariant }]}
      />
      <View
        style={{
          paddingHorizontal: theme.spacing.xl,
          paddingVertical: theme.spacing.md,
        }}
      >
        <AppButton title="Apply" onPress={apply} />
      </View>
    </BottomSheet>
  );
}

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
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Text style={[styles.textButton, { color: theme.colors.primary }]}>
        {title}
      </Text>
    </Pressable>
  );
}

function CheckRow({
  theme,
  label,
  checked,
  onPress,
}: {
  theme: AppTheme;
  label: string;
  checked: boolean;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        backgroundColor: pressed ? theme.colors.surfaceVariant : 'transparent',
      })}
    >
      <View
        style={[
          styles.box,
          checked ? styles.boxChecked : styles.boxUnchecked,
          {
            borderColor: theme.colors.outline,
            backgroundColor: checked ? theme.colors.primary : undefined,
            marginRight: theme.spacing.md,
          },
        ]}
      >
        {checked ? (
          <Text style={[styles.tick, { color: theme.colors.onPrimary }]}>
            ✓
          </Text>
        ) : null}
      </View>
      <Text
        style={[styles.rowLabel, { color: theme.colors.onSurface }]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function EmptyState({
  theme,
  query,
}: {
  theme: AppTheme;
  query: string;
}): React.JSX.Element {
  return (
    <View style={{ padding: theme.spacing.xxl }}>
      <Text style={[styles.empty, { color: theme.colors.onSurfaceVariant }]}>
        {`No matches for "${query.trim()}"`}
      </Text>
    </View>
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
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  caption: {
    fontSize: 12,
  },
  search: {
    borderWidth: 1,
    fontSize: 15,
  },
  rule: {
    height: 1,
  },
  listWrapper: {
    flexShrink: 1,
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
  rowLabel: {
    flex: 1,
    fontSize: 15,
  },
  empty: {
    fontSize: 14,
    textAlign: 'center',
  },
});
