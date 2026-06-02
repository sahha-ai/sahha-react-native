import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Sahha, {
  SahhaEnvironment,
  SahhaSensor,
  SahhaSensorStatus,
  SahhaScoreType,
  SahhaBiomarkerCategory,
  SahhaBiomarkerType,
} from 'sahha-react-native';

type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
interface JSONObject {
  [key: string]: JSONValue;
}
type JSONArray = JSONValue[];

function renderPrimitive(value: JSONValue, styles: any) {
  if (value === null) {
    return <Text style={styles.jsonNull}>null</Text>;
  }
  if (typeof value === 'boolean') {
    return <Text style={styles.jsonBoolean}>{value.toString()}</Text>;
  }
  if (typeof value === 'number') {
    return <Text style={styles.jsonNumber}>{value}</Text>;
  }
  if (typeof value === 'string') {
    return <Text style={styles.jsonString}>"{value}"</Text>;
  }
  return null;
}

function JSONView({ data, level = 0 }: { data: JSONValue; level?: number }) {
  const indent = '    '.repeat(level);

  if (data === null) {
    return (
      <Text>
        {indent}
        <Text style={styles.jsonNull}>null</Text>
      </Text>
    );
  }
  if (typeof data === 'boolean') {
    return (
      <Text>
        {indent}
        <Text style={styles.jsonBoolean}>{data.toString()}</Text>
      </Text>
    );
  }
  if (typeof data === 'number') {
    return (
      <Text>
        {indent}
        <Text style={styles.jsonNumber}>{data}</Text>
      </Text>
    );
  }
  if (typeof data === 'string') {
    return (
      <Text>
        {indent}
        <Text style={styles.jsonString}>"{data}"</Text>
      </Text>
    );
  }
  if (Array.isArray(data)) {
    return (
      <View>
        <Text style={styles.jsonBracket}>{indent}[</Text>
        {data.map((item, index) => {
          const isLast = index === data.length - 1;
          if (typeof item !== 'object' || item === null) {
            return (
              <Text key={index}>
                {indent} {renderPrimitive(item, styles)}
                {!isLast ? ',' : ''}
              </Text>
            );
          } else {
            return (
              <View key={index}>
                <Text style={styles.jsonBracket}>
                  {indent} {Array.isArray(item) ? '[' : '{'}
                </Text>
                <JSONView data={item} level={level + 1} />
                <Text style={styles.jsonBracket}>
                  {indent} {Array.isArray(item) ? ']' : '}'}
                  {!isLast ? ',' : ''}
                </Text>
              </View>
            );
          }
        })}
        <Text style={styles.jsonBracket}>{indent}]</Text>
      </View>
    );
  }
  if (typeof data === 'object') {
    const entries = Object.entries(data);
    return (
      <View>
        <Text style={styles.jsonBracket}>
          {indent}
          {'{'}
        </Text>
        {entries.map(([key, value], index) => {
          const isLast = index === entries.length - 1;
          if (typeof value !== 'object' || value === null) {
            return (
              <Text key={key}>
                {indent} <Text style={styles.jsonKey}>"{key}"</Text>:{' '}
                {renderPrimitive(value, styles)}
                {!isLast ? ',' : ''}
              </Text>
            );
          } else {
            return (
              <View key={key}>
                <Text>
                  {indent} <Text style={styles.jsonKey}>"{key}"</Text>:{' '}
                  {Array.isArray(value) ? '[' : '{'}
                </Text>
                <JSONView data={value} level={level + 1} />
                <Text>
                  {indent} {Array.isArray(value) ? ']' : '}'}
                  {!isLast ? ',' : ''}
                </Text>
              </View>
            );
          }
        })}
        <Text style={styles.jsonBracket}>
          {indent}
          {'}'}
        </Text>
      </View>
    );
  }
  return null;
}

// Curated sensor subset for the example: steps, sleep, full reproductive group,
// full nutrition group. Each sensor here maps to a Health Connect READ
// permission declared in example/android/app/src/main/AndroidManifest.xml.
const EXAMPLE_SENSORS: SahhaSensor[] = [
  SahhaSensor.steps,
  SahhaSensor.sleep,

  // Reproductive
  SahhaSensor.menstrual_flow,
  SahhaSensor.menstrual_period,
  SahhaSensor.intermenstrual_bleeding,
  SahhaSensor.infrequent_menstrual_cycles,
  SahhaSensor.irregular_menstrual_cycles,
  SahhaSensor.persistent_intermenstrual_bleeding,
  SahhaSensor.prolonged_menstrual_periods,
  SahhaSensor.ovulation_test,
  SahhaSensor.cervical_mucus,
  SahhaSensor.sexual_activity,
  SahhaSensor.contraceptive,
  SahhaSensor.pregnancy,
  SahhaSensor.pregnancy_test,
  SahhaSensor.progesterone_test,
  SahhaSensor.lactation,

  // Nutrition
  SahhaSensor.energy_intake,
  SahhaSensor.protein_intake,
  SahhaSensor.fat_intake,
  SahhaSensor.fat_saturated_intake,
  SahhaSensor.fat_monounsaturated_intake,
  SahhaSensor.fat_polyunsaturated_intake,
  SahhaSensor.cholesterol_intake,
  SahhaSensor.carbohydrate_intake,
  SahhaSensor.sugar_intake,
  SahhaSensor.fiber_intake,
  SahhaSensor.vitamin_a_intake,
  SahhaSensor.vitamin_c_intake,
  SahhaSensor.vitamin_d_intake,
  SahhaSensor.vitamin_e_intake,
  SahhaSensor.vitamin_k_intake,
  SahhaSensor.vitamin_b6_intake,
  SahhaSensor.vitamin_b12_intake,
  SahhaSensor.thiamin_intake,
  SahhaSensor.riboflavin_intake,
  SahhaSensor.niacin_intake,
  SahhaSensor.pantothenic_acid_intake,
  SahhaSensor.folate_intake,
  SahhaSensor.biotin_intake,
  SahhaSensor.calcium_intake,
  SahhaSensor.iron_intake,
  SahhaSensor.magnesium_intake,
  SahhaSensor.phosphorus_intake,
  SahhaSensor.potassium_intake,
  SahhaSensor.sodium_intake,
  SahhaSensor.zinc_intake,
  SahhaSensor.chloride_intake,
  SahhaSensor.copper_intake,
  SahhaSensor.manganese_intake,
  SahhaSensor.chromium_intake,
  SahhaSensor.molybdenum_intake,
  SahhaSensor.selenium_intake,
  SahhaSensor.iodine_intake,
  SahhaSensor.caffeine_intake,
  SahhaSensor.water_intake,
];

// AsyncStorage keys for persisting the editable credentials across app restarts.
const STORAGE_KEYS = {
  appId: '@sahha_example/appId',
  appSecret: '@sahha_example/appSecret',
  externalId: '@sahha_example/externalId',
};

// All sensors, used to populate the selectable list on the Get Stats /
// Get Samples parameter screens. SahhaSensor is a string enum, so its values
// are exactly the sensor keys (no numeric reverse-mapping to filter out).
const ALL_SENSORS = Object.values(SahhaSensor) as SahhaSensor[];

const DAY_MS = 24 * 60 * 60 * 1000;

const DATE_PRESETS: { label: string; days: number }[] = [
  { label: '24 hours', days: 1 },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
];

// Format a Date as a local "YYYY-MM-DD HH:mm" string for display in the fields.
function formatDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
  const timePart = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return `${datePart} ${timePart}`;
}

// A tappable field that lets the user pick both a date and a time. The two
// platforms expose different native pickers, so each uses its own idiom:
//  - Android opens the date dialog, then chains into the time dialog.
//  - iOS reveals an inline datetime spinner toggled by tapping the field.
function DateTimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
}) {
  const [showIOSPicker, setShowIOSPicker] = useState(false);

  const openPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode: 'date',
        is24Hour: true,
        onChange: (dateEvent: DateTimePickerEvent, pickedDate?: Date) => {
          if (dateEvent.type !== 'set' || !pickedDate) return;
          DateTimePickerAndroid.open({
            value: pickedDate,
            mode: 'time',
            is24Hour: true,
            onChange: (timeEvent: DateTimePickerEvent, pickedTime?: Date) => {
              if (timeEvent.type !== 'set' || !pickedTime) return;
              onChange(pickedTime);
            },
          });
        },
      });
    } else {
      setShowIOSPicker((prev) => !prev);
    }
  };

  return (
    <View style={styles.dateField}>
      <TouchableOpacity
        style={[styles.input, styles.dateFieldButton]}
        onPress={openPicker}
      >
        <Text style={styles.dateFieldLabel}>{label}</Text>
        <Text style={styles.dateFieldValue}>{formatDateTime(value)}</Text>
      </TouchableOpacity>
      {Platform.OS === 'ios' && showIOSPicker && (
        <View style={styles.iosPickerContainer}>
          <DateTimePicker
            value={value}
            mode="datetime"
            display="spinner"
            onChange={(_event: DateTimePickerEvent, picked?: Date) => {
              if (picked) onChange(picked);
            }}
          />
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => setShowIOSPicker(false)}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// Shared parameter screen for getStats / getSamples. Both functions take the
// same arguments (one sensor + a start/end datetime range), so a single screen
// drives both; `onRun` wires up the actual SDK call for the chosen function.
function SensorQueryScreen({
  title,
  onBack,
  onRun,
}: {
  title: string;
  onBack: () => void;
  onRun: (
    sensor: SahhaSensor,
    startDateTime: number,
    endDateTime: number
  ) => void;
}) {
  const [filter, setFilter] = useState('');
  const [selectedSensor, setSelectedSensor] = useState<SahhaSensor>(
    SahhaSensor.steps
  );
  // Default to the last 7 days, matching the previous hardcoded behavior.
  const [startDate, setStartDate] = useState(
    () => new Date(Date.now() - 7 * DAY_MS)
  );
  const [endDate, setEndDate] = useState(() => new Date());
  const [error, setError] = useState('');

  const filteredSensors = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return ALL_SENSORS;
    return ALL_SENSORS.filter((sensor) =>
      sensor.toLowerCase().includes(needle)
    );
  }, [filter]);

  const applyPreset = (days: number) => {
    const end = Date.now();
    setStartDate(new Date(end - days * DAY_MS));
    setEndDate(new Date(end));
    setError('');
  };

  const handleRun = () => {
    const start = startDate.getTime();
    const end = endDate.getTime();
    if (start > end) {
      setError('Start date must be on or before the end date.');
      return;
    }
    setError('');
    onRun(selectedSensor, start, end);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.pageHeader}>
        <TouchableOpacity
          onPress={onBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.paramsContainer}>
        <Text style={styles.inputLabel}>Date range</Text>
        <DateTimeField label="Start" value={startDate} onChange={setStartDate} />
        <DateTimeField label="End" value={endDate} onChange={setEndDate} />
        <View style={styles.presetRow}>
          {DATE_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.days}
              style={styles.presetButton}
              onPress={() => applyPreset(preset.days)}
            >
              <Text style={styles.presetText}>{preset.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sensorHeaderRow}>
          <Text style={styles.inputLabel}>Sensor</Text>
          <Text style={styles.selectedSensorText}>{selectedSensor}</Text>
        </View>
        <TextInput
          style={styles.input}
          value={filter}
          onChangeText={setFilter}
          placeholder="Filter sensors…"
          placeholderTextColor="#9e9e9e"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <ScrollView
        style={styles.sensorScroll}
        keyboardShouldPersistTaps="handled"
      >
        {filteredSensors.map((sensor) => {
          const selected = sensor === selectedSensor;
          return (
            <TouchableOpacity
              key={sensor}
              style={[styles.sensorRow, selected && styles.sensorRowSelected]}
              onPress={() => setSelectedSensor(sensor)}
            >
              <Text
                style={[
                  styles.sensorRowText,
                  selected && styles.sensorRowTextSelected,
                ]}
              >
                {sensor}
              </Text>
            </TouchableOpacity>
          );
        })}
        {filteredSensors.length === 0 && (
          <Text style={styles.emptyText}>No sensors match “{filter}”.</Text>
        )}
      </ScrollView>

      <View style={styles.runContainer}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity style={styles.buttonWrapper} onPress={handleRun}>
          <Text style={styles.buttonText}>{title}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();

  const [result, setResult] = useState<string | JSONValue>('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [screen, setScreen] = useState<'home' | 'stats' | 'samples'>('home');
  const [appId, setAppId] = useState('dJ52F2MXsQ6xjJ6IPRahBG1S3ayzYUSo');
  const [appSecret, setAppSecret] = useState(
    'bodDOI8MwQkIlZycZWAlzO7T6CamQ2fl6SpWt9U6vZc1itbqeECfslnecMRPyfDz'
  );
  const [externalId, setExternalId] = useState('1.3.9-rn-test');

  // Restore any previously saved credentials on launch. Falls back to the
  // defaults above when nothing is stored (or on read error).
  useEffect(() => {
    AsyncStorage.multiGet([
      STORAGE_KEYS.appId,
      STORAGE_KEYS.appSecret,
      STORAGE_KEYS.externalId,
    ])
      .then((entries) => {
        for (const [key, value] of entries) {
          if (value == null) continue;
          if (key === STORAGE_KEYS.appId) setAppId(value);
          else if (key === STORAGE_KEYS.appSecret) setAppSecret(value);
          else if (key === STORAGE_KEYS.externalId) setExternalId(value);
        }
      })
      .catch(() => {
        // Ignore load errors and keep the default values.
      });
  }, []);

  // Update a field's state and persist it. Persisting only on user edits (not
  // on the programmatic load above) avoids racing the initial restore.
  const handleFieldChange =
    (key: string, setter: (value: string) => void) => (value: string) => {
      setter(value);
      AsyncStorage.setItem(key, value).catch(() => {
        // Ignore write errors; the in-memory value is still used this session.
      });
    };

  const handleConfigure = () => {
    const settings = {
      environment: SahhaEnvironment.development,
      notificationSettings: {
        icon: 'notification',
        title: 'Test Title',
        shortDescription: 'Test description.',
      },
    };

    Sahha?.configure(settings, (error: string, success: boolean) => {
      if (error) {
        setResult(`Configure error: ${error}`);
      } else {
        setResult(`Configure success: ${success}`);
      }
    });
  };

  const handleIsAuthenticated = () => {
    Sahha?.isAuthenticated((error: string, success: boolean) => {
      if (error) {
        setResult(`Is authenticated error: ${error}`);
      } else {
        setResult(`Is authenticated: ${success}`);
      }
    });
  };

  const handleAuthenticate = () => {
    Sahha?.authenticate(
      appId,
      appSecret,
      externalId,
      (error: string, success: boolean) => {
        if (error) {
          setResult(`Authenticate error: ${error}`);
        } else {
          setResult(`Authenticate success: ${success}`);
        }
      }
    );
  };

  const handleAuthenticateToken = () => {
    Sahha?.authenticateToken(
      'profile-token-placeholder',
      'refresh-token-placeholder',
      (error: string, success: boolean) => {
        if (error) {
          setResult(`Authenticate token error: ${error}`);
        } else {
          setResult(`Authenticate token success: ${success}`);
        }
      }
    );
  };

  const handleDeauthenticate = () => {
    Sahha?.deauthenticate((error: string, success: boolean) => {
      if (error) {
        setResult(`Deauthenticate error: ${error}`);
      } else {
        setResult(`Deauthenticate success: ${success}`);
      }
    });
  };

  const handleGetProfileToken = () => {
    Sahha?.getProfileToken((error: string, profileToken?: string) => {
      if (error) {
        setResult(`Get profile token error: ${error}`);
      } else {
        setResult(`Profile token: ${profileToken ?? 'none'}`);
      }
    });
  };

  const handleGetDemographic = () => {
    Sahha?.getDemographic((error: string, demographic?: string) => {
      if (error) {
        setResult(`Get demographic error: ${error}`);
      } else {
        try {
          const parsed = JSON.parse(demographic ?? '{}');
          setResult(parsed);
        } catch {
          setResult(`Demographic: ${demographic ?? 'none'}`);
        }
      }
    });
  };

  const handlePostDemographic = () => {
    const demographic = {
      age: 30,
      gender: 'male',
    };
    Sahha?.postDemographic(demographic, (error: string, success: boolean) => {
      if (error) {
        setResult(`Post demographic error: ${error}`);
      } else {
        setResult(`Post demographic success: ${success}`);
      }
    });
  };

  const handleGetSensorStatus = () => {
    Sahha?.getSensorStatus(
      EXAMPLE_SENSORS,
      (error: string, value: SahhaSensorStatus) => {
        if (error) {
          setResult(`Get sensor status error: ${error}`);
        } else {
          const SahhaSensorStatusName: string = SahhaSensorStatus[value];
          setResult(`Sensor status: ${SahhaSensorStatusName}`);
        }
      }
    );
  };

  const handleEnableSensors = () => {
    Sahha?.enableSensors(
      EXAMPLE_SENSORS,
      (error: string, value: SahhaSensorStatus) => {
        if (error) {
          setResult(`Enable sensors error: ${error}`);
        } else {
          const SahhaSensorStatusName: string = SahhaSensorStatus[value];
          setResult(`Enable sensors status: ${SahhaSensorStatusName}`);
        }
      }
    );
  };

  const handleGetScores = () => {
    const types = [SahhaScoreType.activity];
    const startDateTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const endDateTime = Date.now();
    Sahha?.getScores(
      types,
      startDateTime,
      endDateTime,
      (error: string, value: string) => {
        if (error) {
          setResult(`Get scores error: ${error}`);
        } else {
          try {
            const parsed = JSON.parse(value);
            setResult(parsed);
          } catch {
            setResult(`Scores: ${value}`);
          }
        }
      }
    );
  };

  const handleGetBiomarkers = () => {
    const categories = [SahhaBiomarkerCategory.activity];
    const types = [SahhaBiomarkerType.steps];
    const startDateTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const endDateTime = Date.now();
    Sahha?.getBiomarkers(
      categories,
      types,
      startDateTime,
      endDateTime,
      (error: string, value: string) => {
        if (error) {
          setResult(`Get biomarkers error: ${error}`);
        } else {
          try {
            const parsed = JSON.parse(value);
            setResult(parsed);
          } catch {
            setResult(`Biomarkers: ${value}`);
          }
        }
      }
    );
  };

  // Runs getStats or getSamples with the parameters chosen on the
  // SensorQueryScreen, then renders the result in the shared result panel.
  const runSensorQuery = (
    kind: 'stats' | 'samples',
    sensor: SahhaSensor,
    startDateTime: number,
    endDateTime: number
  ) => {
    const label = kind === 'stats' ? 'Stats' : 'Samples';
    const callback = (error: string, value: string) => {
      if (error) {
        setResult(`Get ${label.toLowerCase()} error: ${error}`);
      } else {
        try {
          setResult(JSON.parse(value));
        } catch {
          setResult(`${label}: ${value}`);
        }
      }
    };
    if (kind === 'stats') {
      Sahha?.getStats(sensor, startDateTime, endDateTime, callback);
    } else {
      Sahha?.getSamples(sensor, startDateTime, endDateTime, callback);
    }
  };

  const handleOpenAppSettings = () => {
    Sahha?.openAppSettings();
    setResult('Opened app settings');
  };

  const handlePostSensorData = () => {
    Sahha?.postSensorData();
    setResult('Posted sensor data (iOS only)');
  };

  const authFields = [
    {
      label: 'App ID',
      value: appId,
      setter: setAppId,
      key: STORAGE_KEYS.appId,
    },
    {
      label: 'App Secret',
      value: appSecret,
      setter: setAppSecret,
      key: STORAGE_KEYS.appSecret,
    },
    {
      label: 'External ID',
      value: externalId,
      setter: setExternalId,
      key: STORAGE_KEYS.externalId,
    },
  ];

  const sections: {
    title: string;
    content?: React.ReactNode;
    buttons: { title: string; onPress: () => void }[];
  }[] = [
    {
      title: 'Configuration',
      buttons: [{ title: 'Configure', onPress: handleConfigure }],
    },
    {
      title: 'Authentication',
      content: (
        <View>
          {authFields.map((field) => (
            <View key={field.key} style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{field.label}</Text>
              <TextInput
                style={styles.input}
                value={field.value}
                onChangeText={handleFieldChange(field.key, field.setter)}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                placeholderTextColor="#9e9e9e"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          ))}
        </View>
      ),
      buttons: [
        { title: 'Is Authenticated', onPress: handleIsAuthenticated },
        { title: 'Authenticate', onPress: handleAuthenticate },
        { title: 'Authenticate Token', onPress: handleAuthenticateToken },
        { title: 'Deauthenticate', onPress: handleDeauthenticate },
        { title: 'Get Profile Token', onPress: handleGetProfileToken },
      ],
    },
    {
      title: 'Demographics',
      buttons: [
        { title: 'Get Demographic', onPress: handleGetDemographic },
        { title: 'Post Demographic', onPress: handlePostDemographic },
      ],
    },
    {
      title: 'Sensors',
      buttons: [
        { title: 'Get Sensor Status', onPress: handleGetSensorStatus },
        { title: 'Enable Sensors', onPress: handleEnableSensors },
        { title: 'Open App Settings', onPress: handleOpenAppSettings },
        { title: 'Post Sensor Data', onPress: handlePostSensorData },
      ],
    },
    {
      title: 'Data Retrieval',
      buttons: [
        { title: 'Get Scores', onPress: handleGetScores },
        { title: 'Get Biomarkers', onPress: handleGetBiomarkers },
        { title: 'Get Stats', onPress: () => setScreen('stats') },
        { title: 'Get Samples', onPress: () => setScreen('samples') },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {screen === 'home' && (
        <>
          <Text style={styles.title}>Testing Sahha Module</Text>

          <ScrollView style={styles.buttonContainer}>
            {sections.map((section, sectionIndex) => (
              <View key={sectionIndex} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.content}
                {section.buttons.map((btn, btnIndex) => (
                  <TouchableOpacity
                    key={btnIndex}
                    style={styles.buttonWrapper}
                    onPress={btn.onPress}
                  >
                    <Text style={styles.buttonText}>{btn.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        </>
      )}

      {screen === 'stats' && (
        <SensorQueryScreen
          title="Get Stats"
          onBack={() => setScreen('home')}
          onRun={(sensor, startDateTime, endDateTime) =>
            runSensorQuery('stats', sensor, startDateTime, endDateTime)
          }
        />
      )}

      {screen === 'samples' && (
        <SensorQueryScreen
          title="Get Samples"
          onBack={() => setScreen('home')}
          onRun={(sensor, startDateTime, endDateTime) =>
            runSensorQuery('samples', sensor, startDateTime, endDateTime)
          }
        />
      )}

      <View
        style={[
          styles.resultHeader,
          {
            paddingBottom: 10 + insets.bottom,
          },
        ]}
      >
        <Text style={styles.resultTitle}>Result</Text>
        <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
          <Text style={styles.toggleText}>
            {isExpanded ? 'Minimize' : 'Expand'}
          </Text>
        </TouchableOpacity>
      </View>

      {isExpanded && (
        <ScrollView
          style={styles.resultContainer}
          contentContainerStyle={{
            paddingBottom: 24 + insets.bottom, // <-- keeps logs above Android nav bar
          }}
        >
          {typeof result === 'string' ? (
            <Text style={styles.resultText}>{result}</Text>
          ) : (
            <JSONView data={result} />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#212121',
  },
  buttonContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 10,
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#616161',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#bdbdbd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#212121',
    backgroundColor: '#ffffff',
  },
  buttonWrapper: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  toggleText: {
    fontSize: 16,
    color: '#4CAF50',
  },
  resultContainer: {
    flex: 1,
    backgroundColor: '#fafafa',
    padding: 10,
  },
  resultText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#000000',
  },
  jsonKey: {
    color: '#c2185b',
    fontFamily: 'monospace',
  },
  jsonString: {
    color: '#388e3c',
    fontFamily: 'monospace',
  },
  jsonNumber: {
    color: '#1976d2',
    fontFamily: 'monospace',
  },
  jsonBoolean: {
    color: '#7b1fa2',
    fontFamily: 'monospace',
  },
  jsonNull: {
    color: '#f57c00',
    fontFamily: 'monospace',
  },
  jsonBracket: {
    color: '#616161',
    fontFamily: 'monospace',
  },
  screen: {
    flex: 1,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  headerSpacer: {
    width: 50,
  },
  paramsContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  dateField: {
    marginBottom: 10,
  },
  dateFieldButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateFieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#616161',
  },
  dateFieldValue: {
    fontSize: 16,
    color: '#212121',
  },
  iosPickerContainer: {
    marginTop: 6,
  },
  doneButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  doneButtonText: {
    color: '#2e7d32',
    fontWeight: '600',
    fontSize: 15,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  presetButton: {
    flex: 1,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  presetText: {
    color: '#2e7d32',
    fontWeight: '600',
    fontSize: 14,
  },
  sensorHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 6,
  },
  selectedSensorText: {
    fontFamily: 'monospace',
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '600',
  },
  sensorScroll: {
    flex: 1,
    marginTop: 10,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  sensorRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sensorRowSelected: {
    backgroundColor: '#4CAF50',
  },
  sensorRowText: {
    fontSize: 15,
    color: '#212121',
    fontFamily: 'monospace',
  },
  sensorRowTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  emptyText: {
    padding: 14,
    color: '#9e9e9e',
    fontStyle: 'italic',
  },
  runContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 8,
    fontSize: 14,
  },
});
