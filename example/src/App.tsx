import { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import Sahha, { SahhaEnvironment } from 'sahha-react-native';

export default function App() {
  const [result, setResult] = useState<string>('');

  const handleConfigure = () => {
    const settings = {
      environment: SahhaEnvironment.development,
      notificationSettings: {
        icon: 'ic_test',
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

  return (
    <View style={styles.container}>
      <Text>Testing Sahha Module</Text>
      <Button title="Configure" onPress={handleConfigure} />
      <Button title="Is Authenticated" onPress={handleIsAuthenticated} />
      <Button title="Authenticate" onPress={handleAuthenticate} />
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
