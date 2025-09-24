import { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import Sahha, {
  SahhaEnvironment,
  SahhaSensor,
  SahhaSensorStatus,
  SahhaScoreType,
  SahhaBiomarkerCategory,
  SahhaBiomarkerType,
} from 'sahha-react-native';

export default function App() {
  const [result, setResult] = useState<string>('blah');

  const handleConfigure = () => {
    const settings = {
      environment: SahhaEnvironment.development,
      notificationSettings: {
        icon: 'ic_test',
        title: 'Test Title',
        shortDescription: 'Test description.',
      },
    };
    setResult('configuring...');
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
    // Replace with your actual appId, appSecret, externalId
    Sahha?.authenticate(
      'anGxWFRoY1WHmYM2xk15AbFXmDD4C4pn',
      '9Uw0PnTtDA9L8Kn12Bo5jxXDdO4D7Q4apWXc5tvGK3R6qau1WvyAbC1nY2gi85fP',
      'test-123',
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
    // Replace with your actual profileToken and refreshToken
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
        setResult(`Demographic: ${demographic ?? 'none'}`);
      }
    });
  };

  const handlePostDemographic = () => {
    const demographic = {
      age: 30,
      gender: 'male',
      // Add more fields as needed
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
    const sensors = [SahhaSensor.steps];
    Sahha?.getSensorStatus(
      sensors,
      (error: string, value: SahhaSensorStatus) => {
        if (error) {
          setResult(`Get sensor status error: ${error}`);
        } else {
          setResult(`Sensor status: ${value}`);
        }
      }
    );
  };

  const handleEnableSensors = () => {
    const sensors = [SahhaSensor.steps];
    Sahha?.enableSensors(sensors, (error: string, value: SahhaSensorStatus) => {
      if (error) {
        setResult(`Enable sensors error: ${error}`);
      } else {
        setResult(`Enable sensors status: ${value}`);
      }
    });
  };

  const handleGetScores = () => {
    const types = [SahhaScoreType.activity];
    const startDateTime = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days ago
    const endDateTime = Date.now();
    Sahha?.getScores(
      types,
      startDateTime,
      endDateTime,
      (error: string, value: string) => {
        if (error) {
          setResult(`Get scores error: ${error}`);
        } else {
          setResult(`Scores: ${value}`);
        }
      }
    );
  };

  const handleGetBiomarkers = () => {
    const categories = [SahhaBiomarkerCategory.activity];
    const types = [SahhaBiomarkerType.steps];
    const startDateTime = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days ago
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
          setResult(`Biomarkers: ${value}`);
        }
      }
    );
  };

  const handleGetStats = () => {
    const sensor = SahhaSensor.steps;
    const startDateTime = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days ago
    const endDateTime = Date.now();
    Sahha?.getStats(
      sensor,
      startDateTime,
      endDateTime,
      (error: string, value: string) => {
        if (error) {
          setResult(`Get stats error: ${error}`);
        } else {
          setResult(`Stats: ${value}`);
        }
      }
    );
  };

  const handleGetSamples = () => {
    const sensor = SahhaSensor.steps;
    const startDateTime = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days ago
    const endDateTime = Date.now();
    Sahha?.getSamples(
      sensor,
      startDateTime,
      endDateTime,
      (error: string, value: string) => {
        if (error) {
          setResult(`Get samples error: ${error}`);
        } else {
          setResult(`Samples: ${value}`);
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

  return (
    <View style={styles.container}>
      <Text>Testing Sahha Module</Text>
      <Button title="Configure" onPress={handleConfigure} />
      <Button title="Is Authenticated" onPress={handleIsAuthenticated} />
      <Button title="Authenticate" onPress={handleAuthenticate} />
      <Button title="Authenticate Token" onPress={handleAuthenticateToken} />
      <Button title="Deauthenticate" onPress={handleDeauthenticate} />
      <Button title="Get Profile Token" onPress={handleGetProfileToken} />
      <Button title="Get Demographic" onPress={handleGetDemographic} />
      <Button title="Post Demographic" onPress={handlePostDemographic} />
      <Button title="Get Sensor Status" onPress={handleGetSensorStatus} />
      <Button title="Enable Sensors" onPress={handleEnableSensors} />
      <Button title="Get Scores" onPress={handleGetScores} />
      <Button title="Get Biomarkers" onPress={handleGetBiomarkers} />
      <Button title="Get Stats" onPress={handleGetStats} />
      <Button title="Get Samples" onPress={handleGetSamples} />
      <Button title="Open App Settings" onPress={handleOpenAppSettings} />
      <Button title="Post Sensor Data" onPress={handlePostSensorData} />
      <Text>{result}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
