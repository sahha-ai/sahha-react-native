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
import Sahha from 'sahha-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthenticationView() {
  const [profileToken, setProfileToken] = useState<string>('');
  const [refreshToken, setRefreshToken] = useState<string>('');
  const [isAuth, setIsAuth] = useState<boolean>(false);
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
        await AsyncStorage.setItem('@profileToken', profileToken);
        await AsyncStorage.setItem('@refreshToken', refreshToken);
        const jsonValue = JSON.stringify(isAuth);
        await AsyncStorage.setItem('@isAuth', jsonValue);
      } catch (error) {
        console.error(error);
      }
    };
    setPrefs();
  }, [isAuth]);

  const getPrefs = async () => {
    try {
      const _profileToken = await AsyncStorage.getItem('@profileToken');
      if (_profileToken !== null) {
        setProfileToken(_profileToken);
      }
      const _refreshToken = await AsyncStorage.getItem('@refreshToken');
      if (_refreshToken !== null) {
        setRefreshToken(_refreshToken);
      }
      const jsonValue = await AsyncStorage.getItem('@isAuth');
      if (jsonValue !== null) {
        const boolValue = JSON.parse(jsonValue);
        setIsAuth(boolValue);
      }
    } catch (error) {
      console.error(error);
    }
  };

  function onPressAuthenticate() {
    if (!!profileToken === false) {
      Alert.alert('Missing PROFILE TOKEN');
    } else if (!!refreshToken === false) {
      Alert.alert('Missing REFRESH TOKEN');
    } else {
      Sahha.authenticate(
        profileToken,
        refreshToken,
        (error: string, success: boolean) => {
          console.log(`Success: ${success}`);
          setIsAuth(success);
          if (error) {
            console.error(`Error: ${error}`);
          }
        }
      );
    }
  }

  function onPressDelete() {
    setProfileToken('');
    setRefreshToken('');
    setIsAuth(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text>
        {isAuth ? 'You are authenticated' : 'You are not authenticated'}
      </Text>
      <View style={styles.divider} />
      <Text>Profile Token</Text>
      <TextInput
        style={styles.input}
        onChangeText={setProfileToken}
        value={profileToken}
        placeholder="ABC123"
      />
      <Text>Refresh Token</Text>
      <TextInput
        style={styles.input}
        onChangeText={setRefreshToken}
        value={refreshToken}
        placeholder="ABC123"
      />
      <View style={styles.divider} />
      <Button title="AUTHENTICATE" onPress={onPressAuthenticate} />
      <View style={styles.divider} />
      <Button title="DELETE" onPress={onPressDelete} />
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
