import { useState } from 'react';
import type * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Sahha from 'sahha-react-native';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { InlineHint } from '../components/InlineHint';
import { ResponseSheet, tryPrettyJson } from '../components/ResponseSheet';
import { SectionHeader } from '../components/SectionHeader';
import { useAppTheme } from '../theme';
import type { AppTheme } from '../theme';

type SdkModule = NonNullable<typeof Sahha>;

interface SheetState {
  visible: boolean;
  title: string;
  subtitle: string;
  body: string;
  isError: boolean;
}

const CLOSED_SHEET: SheetState = {
  visible: false,
  title: '',
  subtitle: '',
  body: '',
  isError: false,
};

const GENDERS: readonly { value: string; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'gender diverse', label: 'Gender Diverse' },
];

const BIRTH_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Exercises `postDemographic` and `getDemographic`. */
export function ProfileScreen(): React.JSX.Element {
  const theme = useAppTheme();

  const [birthDate, setBirthDate] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');

  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const [rawDemographic, setRawDemographic] = useState<string | null>(null);
  const [prettyDemographic, setPrettyDemographic] = useState<string | null>(
    null
  );
  const [sheet, setSheet] = useState<SheetState>(CLOSED_SHEET);

  const showSheet = (
    title: string,
    subtitle: string,
    body: string,
    isError: boolean
  ) => {
    setSheet({ visible: true, title, subtitle, body, isError });
  };

  const withSdk = (
    subtitle: string,
    run: (sdk: SdkModule) => void,
    onUnavailable: () => void
  ) => {
    const sdk = Sahha;
    if (!sdk) {
      onUnavailable();
      showSheet(
        'Unavailable',
        subtitle,
        'The Sahha native module is not linked in this build.',
        true
      );
      return;
    }
    run(sdk);
  };

  const onFetch = () => {
    setHint(null);
    setFetching(true);
    withSdk(
      'Sahha.getDemographic',
      (sdk) => {
        sdk.getDemographic((error: string, demographic?: string) => {
          setFetching(false);
          console.log(`Get Demographic Result: ${error || demographic}`);
          if (error) {
            showSheet('Fetch failed', 'Sahha.getDemographic', error, true);
            return;
          }
          const raw =
            demographic && demographic.length > 0 ? demographic : 'empty';
          const pretty = tryPrettyJson(raw);
          setRawDemographic(raw);
          setPrettyDemographic(pretty);
          showSheet('Demographic', 'Sahha.getDemographic', pretty, false);
        });
      },
      () => setFetching(false)
    );
  };

  const onPost = () => {
    if (!BIRTH_DATE_PATTERN.test(birthDate.trim())) {
      setHint('Birth date must be in YYYY-MM-DD format.');
      return;
    }
    if (Number.isNaN(Date.parse(birthDate.trim()))) {
      setHint('Birth date is not a real date.');
      return;
    }
    if (gender.length === 0) {
      setHint('Pick a gender before posting.');
      return;
    }
    const trimmedAge = age.trim();
    const parsedAge = trimmedAge.length > 0 ? Number(trimmedAge) : null;
    if (parsedAge !== null && !Number.isFinite(parsedAge)) {
      setHint('Age must be a number.');
      return;
    }
    setHint(null);

    const demographic: Record<string, string | number> = {
      birthDate: birthDate.trim(),
      gender,
    };
    if (parsedAge !== null) {
      demographic.age = parsedAge;
    }

    setSaving(true);
    withSdk(
      'Sahha.postDemographic',
      (sdk) => {
        sdk.postDemographic(demographic, (error: string, success: boolean) => {
          setSaving(false);
          console.log(`Post Demographic Result: ${error || success}`);
          showSheet(
            error ? 'Save failed' : 'Saved',
            'Sahha.postDemographic',
            error || String(success),
            Boolean(error)
          );
        });
      },
      () => setSaving(false)
    );
  };

  const busy = fetching || saving;

  return (
    <>
      <ScrollView
        style={[styles.screen, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.xxl * 2,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <SectionHeader title="DEMOGRAPHIC" />
        <Card>
          <LabeledInput
            theme={theme}
            label="BIRTH DATE"
            placeholder="YYYY-MM-DD"
            value={birthDate}
            keyboardType="numbers-and-punctuation"
            onChangeText={(value) => {
              setBirthDate(value);
              setHint(null);
            }}
          />
          <LabeledInput
            theme={theme}
            label="AGE (OPTIONAL)"
            placeholder="e.g. 30"
            value={age}
            keyboardType="number-pad"
            onChangeText={(value) => {
              setAge(value);
              setHint(null);
            }}
          />
          <Text
            style={[
              styles.fieldLabel,
              {
                color: theme.colors.onSurfaceVariant,
                marginBottom: theme.spacing.xs,
              },
            ]}
          >
            GENDER
          </Text>
          <View
            style={[
              styles.segmented,
              {
                borderColor: theme.colors.outlineVariant,
                borderRadius: theme.radius.control,
              },
            ]}
          >
            {GENDERS.map((option, index) => {
              const isSelected = option.value === gender;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => {
                    setGender(option.value);
                    setHint(null);
                  }}
                  style={[
                    styles.segment,
                    index === 0 ? styles.segmentFirst : styles.segmentRest,
                    {
                      paddingVertical: theme.spacing.md - 2,
                      borderLeftColor: theme.colors.outlineVariant,
                      backgroundColor: isSelected
                        ? theme.colors.primaryContainer
                        : undefined,
                    },
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.segmentLabel,
                      isSelected ? styles.segmentLabelSelected : null,
                      {
                        color: isSelected
                          ? theme.colors.onPrimaryContainer
                          : theme.colors.onSurface,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {hint ? (
          <View style={{ marginTop: theme.spacing.md }}>
            <InlineHint message={hint} />
          </View>
        ) : null}

        <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.md }}>
          <AppButton
            title="POST DEMOGRAPHIC"
            loading={saving}
            disabled={busy && !saving}
            onPress={onPost}
          />
          <AppButton
            title="GET DEMOGRAPHIC"
            variant="outline"
            loading={fetching}
            disabled={busy && !fetching}
            onPress={onFetch}
          />
        </View>

        {prettyDemographic !== null ? (
          <>
            <SectionHeader
              title="LAST RESPONSE"
              style={{ marginTop: theme.spacing.xl }}
            />
            <Card>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text
                  selectable
                  style={[
                    styles.mono,
                    {
                      fontFamily: theme.mono,
                      color: theme.colors.onSurface,
                    },
                  ]}
                >
                  {prettyDemographic}
                </Text>
              </ScrollView>
              <AppButton
                title="VIEW RAW RESPONSE"
                variant="outline"
                compact
                style={{ marginTop: theme.spacing.md }}
                onPress={() =>
                  showSheet(
                    'Demographic (raw)',
                    'Sahha.getDemographic',
                    rawDemographic ?? '',
                    false
                  )
                }
              />
            </Card>
          </>
        ) : null}
      </ScrollView>

      <ResponseSheet
        visible={sheet.visible}
        title={sheet.title}
        subtitle={sheet.subtitle}
        body={sheet.body}
        isError={sheet.isError}
        onClose={() => setSheet(CLOSED_SHEET)}
      />
    </>
  );
}

function LabeledInput({
  theme,
  label,
  value,
  placeholder,
  keyboardType,
  onChangeText,
}: {
  theme: AppTheme;
  label: string;
  value: string;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad' | 'numbers-and-punctuation';
  onChangeText: (value: string) => void;
}): React.JSX.Element {
  return (
    <View style={{ marginBottom: theme.spacing.md }}>
      <Text
        style={[
          styles.fieldLabel,
          {
            color: theme.colors.onSurfaceVariant,
            marginBottom: theme.spacing.xs,
          },
        ]}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.onSurfaceVariant}
        style={[
          styles.input,
          {
            borderColor: theme.colors.outlineVariant,
            borderRadius: theme.radius.control,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.md - 2,
            color: theme.colors.onSurface,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    letterSpacing: 0.6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    fontSize: 15,
  },
  segmented: {
    flexDirection: 'row',
    borderWidth: 1,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    alignItems: 'center',
  },
  segmentFirst: {
    borderLeftWidth: 0,
  },
  segmentRest: {
    borderLeftWidth: 1,
  },
  segmentLabel: {
    fontSize: 13,
  },
  segmentLabelSelected: {
    fontWeight: '600',
  },
  mono: {
    fontSize: 12,
    lineHeight: 18,
  },
});
