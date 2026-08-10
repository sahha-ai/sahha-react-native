import { useEffect, useMemo, useRef, useState } from 'react';
import type * as React from 'react';
import {
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { SahhaSensor } from 'sahha-react-native';
import { SENSORS_GROUPED, sensorGroupOf } from '../data/groups';
import { useAppTheme } from '../theme';
import type { AppTheme } from '../theme';
import { BottomSheet } from './BottomSheet';
import { SectionHeader } from './SectionHeader';

export interface SensorPickerSheetProps {
  visible: boolean;
  selected?: SahhaSensor | null;
  onSelect: (sensor: SahhaSensor) => void;
  onClose: () => void;
}

interface SensorGroup {
  title: string;
  data: SahhaSensor[];
}

/** Searchable single-select bottom sheet over every `SahhaSensor`. */
export function SensorPickerSheet({
  visible,
  selected,
  onSelect,
  onClose,
}: SensorPickerSheetProps): React.JSX.Element {
  const theme = useAppTheme();
  const [query, setQuery] = useState('');
  const wasVisible = useRef(visible);

  useEffect(() => {
    if (visible && !wasVisible.current) {
      setQuery('');
    }
    wasVisible.current = visible;
  }, [visible]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length === 0) {
      return SENSORS_GROUPED;
    }
    return SENSORS_GROUPED.filter(
      (sensor) =>
        sensor.toLowerCase().includes(needle) ||
        sensorGroupOf(sensor).toLowerCase().includes(needle)
    );
  }, [query]);

  const groups = useMemo<SensorGroup[]>(() => {
    const byGroup = new Map<string, SahhaSensor[]>();
    for (const sensor of filtered) {
      const name = sensorGroupOf(sensor);
      const bucket = byGroup.get(name);
      if (bucket) {
        bucket.push(sensor);
      } else {
        byGroup.set(name, [sensor]);
      }
    }
    return Array.from(byGroup, ([title, data]) => ({ title, data }));
  }, [filtered]);

  const choose = (sensor: SahhaSensor) => {
    onSelect(sensor);
    onClose();
  };

  const headerStyle = {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View
        style={{
          paddingHorizontal: theme.spacing.xl,
          paddingBottom: theme.spacing.sm,
        }}
      >
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          Sensor
        </Text>
        <Text
          style={[styles.caption, { color: theme.colors.onSurfaceVariant }]}
        >
          {`${filtered.length} of ${SENSORS_GROUPED.length} sensors`}
        </Text>
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
          <View style={{ padding: theme.spacing.xxl }}>
            <Text
              style={[styles.empty, { color: theme.colors.onSurfaceVariant }]}
            >
              {`No matches for "${query.trim()}"`}
            </Text>
          </View>
        ) : (
          <SectionList<SahhaSensor, SensorGroup>
            sections={groups}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            stickySectionHeadersEnabled={false}
            contentContainerStyle={{ paddingBottom: theme.spacing.lg }}
            renderSectionHeader={({ section }) => (
              <SectionHeader title={section.title} style={headerStyle} />
            )}
            renderItem={({ item }) => (
              <SensorRow
                theme={theme}
                sensor={item}
                isSelected={item === selected}
                onPress={() => choose(item)}
              />
            )}
          />
        )}
      </View>
    </BottomSheet>
  );
}

function SensorRow({
  theme,
  sensor,
  isSelected,
  onPress,
}: {
  theme: AppTheme;
  sensor: SahhaSensor;
  isSelected: boolean;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        backgroundColor: isSelected
          ? theme.colors.primaryContainer
          : pressed
            ? theme.colors.surfaceVariant
            : 'transparent',
      })}
    >
      <Text
        numberOfLines={1}
        style={[
          styles.rowLabel,
          isSelected ? styles.rowLabelSelected : null,
          {
            color: isSelected
              ? theme.colors.onPrimaryContainer
              : theme.colors.onSurface,
          },
        ]}
      >
        {sensor}
      </Text>
      {isSelected ? (
        <Text style={[styles.tick, { color: theme.colors.primary }]}>✓</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  empty: {
    fontSize: 14,
    textAlign: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
  },
  rowLabelSelected: {
    fontWeight: '600',
  },
  tick: {
    fontSize: 15,
  },
});
