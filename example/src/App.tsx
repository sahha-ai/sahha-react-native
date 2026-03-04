import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
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

function AppContent() {
  const insets = useSafeAreaInsets();

  const [result, setResult] = useState<string | JSONValue>('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleConfigure = () => {
    const settings = {
      environment: SahhaEnvironment.development,
      enableMotionTrigger: true,
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
      'dJ52F2MXsQ6xjJ6IPRahBG1S3ayzYUSo',
      'bodDOI8MwQkIlZycZWAlzO7T6CamQ2fl6SpWt9U6vZc1itbqeECfslnecMRPyfDz',
      '1.3.7-android-test',
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
    const sensors = [SahhaSensor.steps, SahhaSensor.exercise, SahhaSensor.exercise_time, SahhaSensor.sleep];

    Sahha?.getSensorStatus(
      sensors,
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
    const sensors = [SahhaSensor.steps, SahhaSensor.exercise, SahhaSensor.sleep];
    Sahha?.enableSensors(sensors, (error: string, value: SahhaSensorStatus) => {
      if (error) {
        setResult(`Enable sensors error: ${error}`);
      } else {
          const SahhaSensorStatusName: string = SahhaSensorStatus[value]; 
        setResult(`Enable sensors status: ${SahhaSensorStatusName}`);
      }
    });
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

  const handleGetStats = () => {
    const sensor = SahhaSensor.steps;
    const startDateTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const endDateTime = Date.now();
    Sahha?.getStats(
      sensor,
      startDateTime,
      endDateTime,
      (error: string, value: string) => {
        if (error) {
          setResult(`Get stats error: ${error}`);
        } else {
          try {
            const parsed = JSON.parse(value);
            setResult(parsed);
          } catch {
            setResult(`Stats: ${value}`);
          }
        }
      }
    );
  };

  const handleGetSamples = () => {
    const sensor = SahhaSensor.steps;
    const startDateTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const endDateTime = Date.now();
    Sahha?.getSamples(
      sensor,
      startDateTime,
      endDateTime,
      (error: string, value: string) => {
        if (error) {
          setResult(`Get samples error: ${error}`);
        } else {
          try {
            const parsed = JSON.parse(value);
            setResult(parsed);
          } catch {
            setResult(`Samples: ${value}`);
          }
        }
      }
    );
  };

  const handleOpenAppSettings = () => {
    Sahha?.openAppSettings();
    setResult('Opened app settings');
  };

  const handlePostSensorData = () => {
    Sahha?.postSensorData();
    setResult('Posted sensor data (iOS only)');
  };

  const sections = [
    {
      title: 'Configuration',
      buttons: [{ title: 'Configure', onPress: handleConfigure }],
    },
    {
      title: 'Authentication',
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
        { title: 'Get Stats', onPress: handleGetStats },
        { title: 'Get Samples', onPress: handleGetSamples },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Text style={styles.title}>Testing Sahha Module</Text>

      <ScrollView style={styles.buttonContainer}>
        {sections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
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

      <View style={[
          styles.resultHeader,
          {
            paddingBottom: 10 + insets.bottom,
          },
        ]}>
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
});
