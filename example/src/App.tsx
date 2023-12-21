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
import Sahha, {
  SahhaEnvironment,
  SahhaSensorStatus,
} from 'sahha-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

export default function App() {
  const isFirstRender = useRef(true);
  const [isAuth, setIsAuth] = useState<boolean>(false);
  const [appId, setAppId] = useState<string>('');
  const [appSecret, setAppSecret] = useState<string>('');
  const [externalId, setExternalId] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [ageNumber, setAgeNumber] = useState<number>();
  const [gender, setGender] = useState<string>('Male');
  const [sensorStatus, setSensorStatus] = useState<SahhaSensorStatus>(
    SahhaSensorStatus.pending
  );
  var isDisabled =
    sensorStatus === SahhaSensorStatus.unavailable ||
    sensorStatus === SahhaSensorStatus.enabled;
  const [jsonString, setJsonString] = useState('');

  const getAuthPrefs = async () => {
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

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const setAuthPrefs = async () => {
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
    setAuthPrefs();
  }, [appId, appSecret, externalId, isAuth]);

  useEffect(() => {
    console.log('hello');

    getAuthPrefs();
    getProfilePrefs();

    const settings = {
      environment: SahhaEnvironment.sandbox,
      notificationSettings: {
        icon: 'ic_test',
        title: 'Test Title',
        shortDescription: 'Test description.',
      },
      //sensors: [SahhaSensor.sleep, SahhaSensor.activity],
    };

    Sahha.configure(settings, (error: string, success: boolean) => {
      if (error) {
        console.error(`Error: ${error}`);
      } else if (success) {
        console.log(`Success: ${success}`);

        // SDK is ready

        Sahha.isAuthenticated(
          (error: string, success: boolean) => {
            console.log(`Is Auth: ${success}`);
            if (error) {
              console.error(`Error: ${error}`);
            }
          }
        );

        Sahha.getSensorStatus((error: string, value: SahhaSensorStatus) => {
          if (error) {
            console.error(`Error: ${error}`);
          } else if (value) {
            console.log(`Sensor Status: ${value}`);
            // Set sensor status to value
            setSensorStatus(value);
          }
        });
      }
    });
  }, []);

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

      Sahha.deauthenticate(
        (error: string, success: boolean) => {
          console.log(`Success: ${success}`);
          if (error) {
            console.error(`Error: ${error}`);
          } else if (success) {
              setExternalId('');
              setIsAuth(false);
          }
        }
      );
  }

  const getProfilePrefs = async () => {
    try {
      const _age = await AsyncStorage.getItem('@age');
      if (_age !== null) {
        setAge(_age);
        let ageInt = parseInt(_age);
        if (ageInt) {
          setAgeNumber(ageInt);
        }
      }
      const _gender = await AsyncStorage.getItem('@gender');
      if (_gender !== null) {
        setGender(_gender);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const setProfilePrefs = async () => {
    try {
      await AsyncStorage.setItem('@age', age);
      await AsyncStorage.setItem('@gender', gender);
    } catch (error) {
      console.error(error);
    }
  };

  const saveProfilePrefs = () => {
    setProfilePrefs();

    const demographic: Object = {
      age: ageNumber, // number
      gender: gender, // string
    };

    Sahha.postDemographic(demographic, (error: string, success: boolean) => {
      if (error) {
        console.error(`Error: ${error}`);
      } else if (success) {
        console.log(`Success: ${success}`);
      }
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>AUTHENTICATION</Text>
      <Text>App ID</Text>
      <TextInput
        style={styles.input}
        onChangeText={setAppId}
        value={appId}
        placeholder="ABC123"
        clearButtonMode="always"
      />
      <Text>App Secret</Text>
      <TextInput
        style={styles.input}
        onChangeText={setAppSecret}
        value={appSecret}
        placeholder="ABC123"
        clearButtonMode="always"
      />
      <Text>External ID</Text>
      <TextInput
        style={styles.input}
        onChangeText={setExternalId}
        value={externalId}
        placeholder="ABC123"
        clearButtonMode="always"
      />
      <Button title="AUTHENTICATE" onPress={onPressAuthenticate} />
      <Text>
        {isAuth ? 'You are authenticated' : 'You are not authenticated'}
      </Text>
      <View style={styles.divider} />
      <Button title="DEAUTHENTICATE" onPress={onPressDelete} />
      <View style={styles.sectionDivider} />
      <Text style={styles.heading}>PROFILE</Text>
      <Text>AGE</Text>
      <TextInput
        style={styles.input}
        keyboardType="numbers-and-punctuation"
        maxLength={3}
        onChangeText={(value) => {
          let ageInt = parseInt(value);
          if (ageInt) {
            console.log(ageInt.toString());
            setAge(ageInt.toString());
            setAgeNumber(ageInt);
          } else {
            console.log('bad int');
            setAge('');
            setAgeNumber(undefined);
          }
        }}
        value={age}
        placeholder="1 - 100"
        clearButtonMode="always"
      />
      <Text>GENDER</Text>
      <Picker
        style={{ height: 200, width: '80%' }}
        selectedValue={gender}
        onValueChange={(itemValue) => {
          setGender(itemValue);
        }}
      >
        <Picker.Item label="Male" value={'Male'} />
        <Picker.Item label="Female" value={'Female'} />
        <Picker.Item label="Gender Diverse" value={'Gender Diverse'} />
      </Picker>
      <Button title="SAVE PROFILE" onPress={saveProfilePrefs} />
      <View style={styles.divider} />
      <Button
        title={"GET DEMOGRAPHIC"}
        onPress={() => {
          Sahha.getDemographic((error: string, demographic: Object) => {
            if (error) {
              console.error(`Error: ${error}`);
            } else if (demographic) {
              console.log(`Demographic: ${demographic}`);
            }
          });
        }}
      />
      <View style={styles.sectionDivider} />
      <Text style={styles.heading}>SENSOR STATUS</Text>
      <Picker
        style={{ height: 200, width: '80%' }}
        enabled={false}
        selectedValue={sensorStatus}
      >
        <Picker.Item label="Pending" value={0} />
        <Picker.Item label="Unavailable" value={1} />
        <Picker.Item label="Disabled" value={2} />
        <Picker.Item label="Enabled" value={3} />
      </Picker>
      <Button
        title="ENABLE SENSORS"
        disabled={isDisabled}
        onPress={() => {
          console.log('press');
          Sahha.enableSensors((error: string, value: SahhaSensorStatus) => {
            if (error) {
              console.error(`Error: ${error}`);
            } else if (value) {
              console.log(`Sensor Status: ${value}`);
              setSensorStatus(value);
            }
          });
        }}
      />
      <View style={styles.divider} />
      <Button
        title={'OPEN APP SETTINGS'}
        onPress={() => {
          Sahha.openAppSettings();
        }}
      />
      <View style={styles.sectionDivider} />
      <Text style={styles.heading}>ANALYSIS</Text>
      <Text style={{ textAlign: 'center' }}>
        A new analysis will be available every 24 hours
      </Text>
      <View style={styles.divider} />
      <Button
        title="ANALYZE PREVIOUS DAY"
        onPress={() => {
          Sahha.analyze((error: string, value: string) => {
            if (error) {
              console.error(`Error: ${error}`);
            } else if (value) {
              console.log(`Value: ${value}`);
              setJsonString(value);
            }
          });
        }}
      />
      <View style={styles.divider} />
      <Button
        title="ANALYZE PREVIOUS WEEK"
        onPress={() => {
          let endDate: Date = new Date();
          let days = endDate.getDate() - 7;
          var startDate = new Date();
          startDate.setDate(days);
          Sahha.analyzeDateRange(startDate.getTime(), endDate.getTime(), (error: string, value: string) => {
            if (error) {
              console.error(`Error: ${error}`);
            } else if (value) {
              console.log(`Value: ${value}`);
              setJsonString(value);
            }
          });
        }}
      />
      <View style={styles.divider} />
      <Text>{jsonString}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 80,
  },
  divider: {
    height: 1,
    margin: 20,
    width: '80%',
    backgroundColor: '#cccccc',
  },
  sectionDivider: {
    height: 2,
    margin: 20,
    marginBottom: 40,
    width: '80%',
    backgroundColor: '#000',
  },
  input: {
    height: 40,
    margin: 12,
    width: '80%',
    borderWidth: 1,
    padding: 10,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingBottom: 20,
  },
});
