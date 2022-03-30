import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  ScrollView,
  Button,
  TextInput,
} from 'react-native';
import SahhaReactNative from 'sahha-react-native';

export default function AuthenticationView() {
  const [customerId, setCustomerId] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState('');

  function onPressLogin() {
    if (!!customerId === false) {
      Alert.alert('Missing Customer ID');
    } else if (!!profileId === false) {
      Alert.alert('Missing Profile ID');
    } else {
      SahhaReactNative.authenticate(customerId, profileId, (error, value) => {
        if (error) {
          console.error(`Error: ${error}`);
        } else if (value) {
          console.log(`Token: ${value}`);
          setIsLoggedIn(true);
        }
      });
    }
  }

  function onFakeLogin() {
    console.log('try');
    SahhaReactNative.authenticate('ABC', 'XYZ', (error, value) => {
      if (error) {
        console.error(`Error: ${error}`);
      }
      if (value) {
        console.log(`Token: ${value}`);
        setToken(value);
        setIsLoggedIn(true);
      }
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text>{isLoggedIn ? 'You are logged in' : 'You are not logged in'}</Text>
      <Text>Customer ID</Text>
      <TextInput
        style={styles.input}
        onChangeText={setCustomerId}
        value={customerId}
        placeholder="ABC123"
      />
      <Text>Profile ID</Text>
      <TextInput
        style={styles.input}
        onChangeText={setProfileId}
        value={profileId}
        placeholder="ABC123"
      />
      <Button title="LOGIN" onPress={onPressLogin}></Button>
      <Button title="FAKE" onPress={onFakeLogin}></Button>
      {token !== '' && <Text>{token}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    height: 40,
    margin: 12,
    width: '80%',
    borderWidth: 1,
    padding: 10,
  },
});
