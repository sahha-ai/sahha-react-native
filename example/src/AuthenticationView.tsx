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
  const [appId, setAppId] = useState<string>('');
  const [appSecret, setAppSecret] = useState<string>('');
  const [externalId, setExternalId] = useState<string>('');
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
        await AsyncStorage.setItem('@appId', appId);
        await AsyncStorage.setItem('@appSecret', appSecret);
        await AsyncStorage.setItem('@externalId', externalId);
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
      const _appId = await AsyncStorage.getItem('@appId');
      if (_appId !== null) {
        setAppId(_appId);
      }
      const _appSecret = await AsyncStorage.getItem('@appSecret');
      if (_appSecret !== null) {
        setAppSecret(_appSecret);
      }
      const _externalId = await AsyncStorage.getItem('@externalId');
      if (_externalId !== null) {
        setExternalId(_externalId);
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
    if (!!appId === false) {
      Alert.alert('Missing APP ID');
    } else if (!!appSecret === false) {
      Alert.alert('Missing APP SECRET');
    } else if (!!externalId === false) {
      Alert.alert('Missing EXTERNAL ID');
    } else {
      Sahha.authenticate(
        appId,
        appSecret,
        externalId,
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
    setAppId('');
    setAppSecret('');
    setExternalId('');
    setIsAuth(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text>
        {isAuth ? 'You are authenticated' : 'You are not authenticated'}
      </Text>
      <View style={styles.divider} />
      <Text>App ID</Text>
      <TextInput
        style={styles.input}
        onChangeText={setAppId}
        value={appId}
        placeholder="ABC123"
      />
      <Text>App Secret</Text>
      <TextInput
        style={styles.input}
        onChangeText={setAppSecret}
        value={appSecret}
        placeholder="ABC123"
      />
      <Text>External ID</Text>
      <TextInput
        style={styles.input}
        onChangeText={setExternalId}
        value={externalId}
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
