import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Sahha, { SahhaEnvironment } from 'sahha-react-native';
import HomeView from './HomeView';
import AuthenticationView from './AuthenticationView';
import ProfileView from './ProfileView';
import PedometerView from './PedometerView';
import AnalyzationView from './AnalyzationView';
import SleepView from './SleepView';
//const { message } = Sahha.getConstants();
const Stack = createNativeStackNavigator();

export enum PageTitle {
  HOME = 'HOME',
  AUTHENTICATION = 'AUTHENTICATION',
  PROFILE = 'PROFILE',
  SLEEP = 'SLEEP',
  PEDOMETER = 'PEDOMETER',
  ANALYZATION = 'ANALYZATION',
}

export default function App() {
  /*
  // Use custom settings
  const settings = {
    environment: SahhaEnvironment.production],
    sensors: [SahhaSensor.sleep, SahhaSensor.pedometer],
    postSensorDataManually: true,
  };
*/

  const settings = {
    environment: SahhaEnvironment.development,
  };

  Sahha.configure(settings, (error: string, success: boolean) => {
    if (error) {
      console.error(`Error: ${error}`);
    } else if (success) {
      console.log(`Success: ${success}`);
    }
  });

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={PageTitle.HOME.toString()}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#333242',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen name={PageTitle.HOME.toString()} component={HomeView} />
        <Stack.Screen
          name={PageTitle.AUTHENTICATION.toString()}
          component={AuthenticationView}
        />
        <Stack.Screen
          name={PageTitle.PROFILE.toString()}
          component={ProfileView}
        />
        <Stack.Screen name={PageTitle.SLEEP.toString()} component={SleepView} />
        <Stack.Screen
          name={PageTitle.PEDOMETER.toString()}
          component={PedometerView}
        />
        <Stack.Screen
          name={PageTitle.ANALYZATION.toString()}
          component={AnalyzationView}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
