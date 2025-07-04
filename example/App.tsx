import React, {useState, useEffect, useRef} from 'react';
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
  SahhaSensor,
  SahhaSensorStatus,
  SahhaScoreType,
  SahhaBiomarkerCategory,
  SahhaBiomarkerType,
} from 'sahha-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Picker} from '@react-native-picker/picker';
import {WebView} from 'react-native-webview';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

function HomeScreen({navigation}: any) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Button
        title="Authentication"
        onPress={() => navigation.navigate('Authentication')}
      />
      <View style={styles.sectionDivider} />
      <Button title="Profile" onPress={() => navigation.navigate('Profile')} />
      <View style={styles.sectionDivider} />
      <Button title="Sensors" onPress={() => navigation.navigate('Sensors')} />
      <View style={styles.sectionDivider} />
      <Button title="Scores" onPress={() => navigation.navigate('Scores')} />
      <View style={styles.sectionDivider} />
      <Button
        title="Biomarkers"
        onPress={() => navigation.navigate('Biomarkers')}
      />
      <View style={styles.sectionDivider} />
      <Button title="Stats" onPress={() => navigation.navigate('Stats')} />
      <View style={styles.sectionDivider} />
      <Button title="Samples" onPress={() => navigation.navigate('Samples')} />
      <View style={styles.sectionDivider} />
      <Button
        title="Insights"
        onPress={() => navigation.navigate('Insights')}
      />
      <View style={styles.sectionDivider} />
      <Button title="Manual Post Test" onPress={() => Sahha.postSensorData()} />
    </ScrollView>
  );
}

function AuthenticationScreen() {
  const isFirstRender = useRef(true);
  const [isAuth, setIsAuth] = useState<boolean>(false);
  const [appId, setAppId] = useState<string>('');
  const [appSecret, setAppSecret] = useState<string>('');
  const [externalId, setExternalId] = useState<string>('');

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
      getAuthPrefs();
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
        },
      );
    }
  }

  function onPressDelete() {
    Sahha.deauthenticate((error: string, success: boolean) => {
      console.log(`Success: ${success}`);
      if (error) {
        console.error(`Error: ${error}`);
      } else if (success) {
        setExternalId('');
        setIsAuth(false);
      }
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
    </ScrollView>
  );
}

function InsightsScreen() {
  const [profileToken, setProfileToken] = useState<string>('');

  useEffect(() => {
    Sahha.getProfileToken((error: string, token?: string) => {
      if (error) {
        console.error(`Error: ${error}`);
      } else if (token) {
        setProfileToken(token);
      } else {
        console.log(`Profile Token: null`);
      }
    });
  }, []);

  return (
    <WebView
      style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}
      source={{
        uri: 'https://sandbox.webview.sahha.ai/app',
        headers: {
          Authorization: profileToken,
        },
      }}
    />
  );
}

function ProfileScreen() {
  const [age, setAge] = useState<string>('');
  const [ageNumber, setAgeNumber] = useState<number>();
  const [gender, setGender] = useState<string>('Male');

  useEffect(() => {
    console.log('getProfilePrefs');
    getProfilePrefs();
  }, []);

  const getProfilePrefs = async () => {
    try {
      const _age = await AsyncStorage.getItem('@age');
      if (_age !== null) {
        setAge(_age);
        let ageInt = parseInt(_age, 10);
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
      <Text>AGE</Text>
      <TextInput
        style={styles.input}
        keyboardType="numbers-and-punctuation"
        maxLength={3}
        onChangeText={value => {
          let ageInt = parseInt(value, 10);
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
        style={{height: 200, width: '80%'}}
        selectedValue={gender}
        onValueChange={itemValue => {
          setGender(itemValue);
        }}>
        <Picker.Item label="Male" value={'Male'} />
        <Picker.Item label="Female" value={'Female'} />
        <Picker.Item label="Gender Diverse" value={'Gender Diverse'} />
      </Picker>
      <Button title="SAVE PROFILE" onPress={saveProfilePrefs} />
      <View style={styles.divider} />
      <Button
        title={'GET DEMOGRAPHIC'}
        onPress={() => {
          Sahha.getDemographic((error: string, demographic?: string) => {
            if (error) {
              console.error(`Error: ${error}`);
            } else if (demographic) {
              console.log(`Demographic: ${demographic}`);
            }
          });
        }}
      />
    </ScrollView>
  );
}

function SensorScreen() {
  const [sensorStatus, setSensorStatus] = useState<SahhaSensorStatus>(
    SahhaSensorStatus.pending,
  );

  useEffect(() => {
    console.log('getAllSensorStatus');
    Sahha.getSensorStatus(
      [SahhaSensor.steps, SahhaSensor.sleep],
      (error: string, value: SahhaSensorStatus) => {
        if (error) {
          console.error(`Error: ${error}`);
        } else {
          console.log(`Sensor Status: ${value}`);
          // Set sensor status to value
          setSensorStatus(value);
        }
      },
    );
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>SENSOR STATUS</Text>
      <Picker
        style={{height: 200, width: '80%'}}
        enabled={false}
        selectedValue={sensorStatus}>
        <Picker.Item label="Pending" value={0} />
        <Picker.Item label="Unavailable" value={1} />
        <Picker.Item label="Disabled" value={2} />
        <Picker.Item label="Enabled" value={3} />
      </Picker>
      <Button
        title="GET EMPTY SENSORS"
        onPress={() => {
          console.log('GET EMPTY SENSORS');
          Sahha.getSensorStatus(
            [],
            (error: string, value: SahhaSensorStatus) => {
              if (error) {
                console.error(`Error: ${error}`);
              } else {
                console.log(`Sensor Status: ${value}`);
                setSensorStatus(value);
              }
            },
          );
        }}
      />
      <Button
        title="GET SOME SENSORS"
        onPress={() => {
          console.log('GET SOME SENSORS');
          Sahha.getSensorStatus(
            [SahhaSensor.steps, SahhaSensor.sleep, SahhaSensor.energy_consumed],
            (error: string, value: SahhaSensorStatus) => {
              if (error) {
                console.error(`Error: ${error}`);
              } else {
                console.log(`Sensor Status: ${value}`);
                setSensorStatus(value);
              }
            },
          );
        }}
      />
      <Button
        title="ENABLE EMPTY SENSORS"
        onPress={() => {
          console.log('ENABLE EMPTY SENSORS');
          Sahha.enableSensors([], (error: string, value: SahhaSensorStatus) => {
            if (error) {
              console.error(`Error: ${error}`);
            } else {
              console.log(`Sensor Status: ${value}`);
              setSensorStatus(value);
            }
          });
        }}
      />
      <Button
        title="ENABLE SOME SENSORS"
        onPress={() => {
          console.log('ENABLE SOME SENSORS');
          Sahha.enableSensors(
            [SahhaSensor.steps, SahhaSensor.sleep, SahhaSensor.energy_consumed],
            (error: string, value: SahhaSensorStatus) => {
              if (error) {
                console.error(`Error: ${error}`);
              } else {
                console.log(`Sensor Status: ${value}`);
                setSensorStatus(value);
              }
            },
          );
        }}
      />
      <View style={styles.divider} />
      <Button
        title={'OPEN APP SETTINGS'}
        onPress={() => {
          Sahha.openAppSettings();
        }}
      />
    </ScrollView>
  );
}

function StatsScreen() {
  const [jsonString, setJsonString] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Button
        title="GET STATS TODAY"
        onPress={() => {
          let date = new Date();
          Sahha.getStats(
            SahhaSensor.steps,
            date.getTime(),
            date.getTime(),
            (error: string, value: string) => {
              if (error) {
                console.error(`Error: ${error}`);
              } else if (value) {
                // console.log(`Value: ${value}`);
                const jsonArray = JSON.parse(value);
                console.log(jsonArray[0]);
                const prettyJson = JSON.stringify(jsonArray, null, 6);
                setJsonString(prettyJson);
              }
            },
          );
        }}
      />
      <View style={styles.divider} />
      <Button
        title="GET STATS PREVIOUS WEEK"
        onPress={() => {
          let endDate: Date = new Date();
          let days = endDate.getDate() - 7;
          var startDate = new Date();
          startDate.setDate(days);
          Sahha.getStats(
            SahhaSensor.steps,
            startDate.getTime(),
            endDate.getTime(),
            (error: string, value: string) => {
              if (error) {
                console.error(`Error: ${error}`);
              } else if (value) {
                // console.log(`Value: ${value}`);
                const jsonArray = JSON.parse(value);
                console.log(jsonArray[0]);
                const prettyJson = JSON.stringify(jsonArray, null, 6);
                setJsonString(prettyJson);
              }
            },
          );
        }}
      />
      <View style={styles.divider} />
      <Text>{jsonString}</Text>
    </ScrollView>
  );
}

function SamplesScreen() {
  const [jsonString, setJsonString] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Button
        title="GET SAMPLES TODAY"
        onPress={() => {
          var startDate: Date = new Date();
          startDate.setHours(0, 0, 0);
          let endDate: Date = new Date();
          Sahha.getSamples(
            SahhaSensor.steps,
            startDate.getTime(),
            endDate.getTime(),
            (error: string, value: string) => {
              if (error) {
                console.error(`Error: ${error}`);
              } else if (value) {
                // console.log(`Value: ${value}`);
                const jsonArray = JSON.parse(value);
                console.log(jsonArray[0]);
                const prettyJson = JSON.stringify(jsonArray, null, 6);
                setJsonString(prettyJson);
              }
            },
          );
        }}
      />
      <View style={styles.divider} />
      <Button
        title="GET SAMPLES PREVIOUS WEEK"
        onPress={() => {
          let endDate: Date = new Date();
          let days = endDate.getDate() - 7;
          var startDate = new Date();
          startDate.setDate(days);
          Sahha.getSamples(
            SahhaSensor.steps,
            startDate.getTime(),
            endDate.getTime(),
            (error: string, value: string) => {
              if (error) {
                console.error(`Error: ${error}`);
              } else if (value) {
                // console.log(`Value: ${value}`);
                const jsonArray = JSON.parse(value);
                console.log(jsonArray[0]);
                const prettyJson = JSON.stringify(jsonArray, null, 6);
                setJsonString(prettyJson);
              }
            },
          );
        }}
      />
      <View style={styles.divider} />
      <Text>{jsonString}</Text>
    </ScrollView>
  );
}

function ScoresScreen() {
  const [jsonString, setJsonString] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={{textAlign: 'center'}}>
        New scores will be available every 6 hours
      </Text>
      <View style={styles.divider} />
      <Button
        title="GET SCORES TODAY"
        onPress={() => {
          let date = new Date();
          Sahha.getScores(
            [
              SahhaScoreType.activity,
              SahhaScoreType.sleep,
              SahhaScoreType.wellbeing,
            ],
            date.getTime(),
            date.getTime(),
            (error: string, value: string) => {
              if (error) {
                console.error(`Error: ${error}`);
              } else if (value) {
                // console.log(`Value: ${value}`);
                const jsonArray = JSON.parse(value);
                console.log(jsonArray[0]);
                setJsonString(value);
              }
            },
          );
        }}
      />
      <View style={styles.divider} />
      <Button
        title="GET SCORES PREVIOUS WEEK"
        onPress={() => {
          let endDate: Date = new Date();
          let days = endDate.getDate() - 7;
          var startDate = new Date();
          startDate.setDate(days);
          Sahha.getScores(
            [
              SahhaScoreType.activity,
              SahhaScoreType.sleep,
              SahhaScoreType.wellbeing,
            ],
            startDate.getTime(),
            endDate.getTime(),
            (error: string, value: string) => {
              if (error) {
                console.error(`Error: ${error}`);
              } else if (value) {
                // console.log(`Value: ${value}`);
                const jsonArray = JSON.parse(value);
                console.log(jsonArray[0]);
                setJsonString(value);
              }
            },
          );
        }}
      />
      <View style={styles.divider} />
      <Text>{jsonString}</Text>
    </ScrollView>
  );
}

function BiomarkersScreen() {
  const [jsonString, setJsonString] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={{textAlign: 'center'}}>
        New biomarkers will be available every 6 hours
      </Text>
      <View style={styles.divider} />
      <Button
        title="GET BIOMARKERS TODAY"
        onPress={() => {
          let date: Date = new Date();
          Sahha.getBiomarkers(
            [
              SahhaBiomarkerCategory.activity,
              SahhaBiomarkerCategory.sleep,
              SahhaBiomarkerCategory.vitals,
            ],
            [
              SahhaBiomarkerType.steps,
              SahhaBiomarkerType.sleep_in_bed_duration,
              SahhaBiomarkerType.heart_rate_resting,
              SahhaBiomarkerType.heart_rate_sleep,
            ],
            date.getTime(),
            date.getTime(),
            (error: string, value: string) => {
              if (error) {
                console.error(`Error: ${error}`);
              } else if (value) {
                const jsonArray = JSON.parse(value);
                console.log(jsonArray[0]);
                setJsonString(value);
              }
            },
          );
        }}
      />
      <View style={styles.divider} />
      <Button
        title="GET BIOMARKERS PREVIOUS WEEK"
        onPress={() => {
          let endDate: Date = new Date();
          let days = endDate.getDate() - 7;
          var startDate = new Date();
          startDate.setDate(days);
          Sahha.getBiomarkers(
            [
              SahhaBiomarkerCategory.activity,
              SahhaBiomarkerCategory.sleep,
              SahhaBiomarkerCategory.vitals,
            ],
            [
              SahhaBiomarkerType.steps,
              SahhaBiomarkerType.sleep_in_bed_duration,
              SahhaBiomarkerType.heart_rate_resting,
              SahhaBiomarkerType.heart_rate_sleep,
            ],
            startDate.getTime(),
            endDate.getTime(),
            (error: string, value: string) => {
              if (error) {
                console.error(`Error: ${error}`);
              } else if (value) {
                const jsonArray = JSON.parse(value);
                console.log(jsonArray[0]);
                setJsonString(value);
              }
            },
          );
        }}
      />
      <View style={styles.divider} />
      <Text>{jsonString}</Text>
    </ScrollView>
  );
}

export default function App() {
  useEffect(() => {
    console.log('hello');

    const settings = {
      environment: SahhaEnvironment.sandbox,
      notificationSettings: {
        icon: 'ic_test',
        title: 'Test Title',
        shortDescription: 'Test description.',
      },
    };

    Sahha.configure(settings, (error: string, success: boolean) => {
      if (error) {
        console.error(`Error: ${error}`);
      } else if (success) {
        console.log(`Success: ${success}`);

        // SDK is ready
      }
    });
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{title: 'Sahha React Native Demo'}}
        />
        <Stack.Screen name="Authentication" component={AuthenticationScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Sensors" component={SensorScreen} />
        <Stack.Screen name="Scores" component={ScoresScreen} />
        <Stack.Screen name="Biomarkers" component={BiomarkersScreen} />
        <Stack.Screen name="Stats" component={StatsScreen} />
        <Stack.Screen name="Samples" component={SamplesScreen} />
        <Stack.Screen name="Insights" component={InsightsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: '#000000',
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
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
