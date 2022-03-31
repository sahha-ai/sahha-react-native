import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Alert,
  StyleSheet,
  Text,
  ScrollView,
  Button,
  TextInput,
} from 'react-native';
import SahhaReactNative from 'sahha-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthenticationView() {
  const [customerId, setCustomerId] = useState<string>('');
  const [profileId, setProfileId] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    console.log('auth');
    getPrefs();
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const setPrefs = async () => {
      try {
        await AsyncStorage.setItem('@customerId', customerId);
        await AsyncStorage.setItem('@profileId', profileId);
        const jsonValue = JSON.stringify(isLoggedIn);
        await AsyncStorage.setItem('@isLoggedIn', jsonValue);
      } catch (error) {
        console.error(error);
      }
    };
    setPrefs();
  }, [isLoggedIn]);

  const getPrefs = async () => {
    try {
      const _customerId = await AsyncStorage.getItem('@customerId');
      if (_customerId !== null) {
        setCustomerId(_customerId);
      }
      const _profileId = await AsyncStorage.getItem('@profileId');
      if (_profileId !== null) {
        setProfileId(_profileId);
      }
      const jsonValue = await AsyncStorage.getItem('@isLoggedIn');
      if (jsonValue !== null) {
        const boolValue = JSON.parse(jsonValue);
        setIsLoggedIn(boolValue);
      }
    } catch (error) {
      console.error(error);
    }
  };

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
          console.log(value);
          setIsLoggedIn(true);
        }
      });
    }
  }

  function onPressLogout() {
    setIsLoggedIn(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text>{isLoggedIn ? 'You are logged in' : 'You are not logged in'}</Text>
      <View style={styles.divider} />
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
      {isLoggedIn === false && <Button title="LOGIN" onPress={onPressLogin} />}
      {isLoggedIn === true && <Button title="LOGOUT" onPress={onPressLogout} />}
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
  divider: {
    height: 1,
    margin: 20,
    width: '80%',
    backgroundColor: '#cccccc',
  },
  input: {
    height: 40,
    margin: 12,
    width: '80%',
    borderWidth: 1,
    padding: 10,
  },
});
