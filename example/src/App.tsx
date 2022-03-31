import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Sahha, { SahhaEnvironment, SahhaSensor } from 'sahha-react-native';
import HomeView from './HomeView';
import AuthenticationView from './AuthenticationView';
import ProfileView from './ProfileView';
import MotionView from './MotionView';
import AnalyzationView from './AnalyzationView';
import HealthView from './HealthView';
//const { message } = Sahha.getConstants();
const Stack = createNativeStackNavigator();

export enum PageTitle {
  HOME = 'HOME',
  AUTHENTICATION = 'AUTHENTICATION',
  PROFILE = 'PROFILE',
  HEALTH = 'HEALTH ACTIVITY',
  MOTION = 'MOTION ACTIVITY',
  ANALYZATION = 'ANALYZATION',
}

export default function App() {
  /*
  Sahha.configure(
    SahhaEnvironment.development,
    [SahhaSensor.sleep, SahhaSensor.pedometer],
    false
  );
*/

  const settings = {
    environment: SahhaEnvironment.development,
  };

  Sahha.configure(settings, (error, success) => {
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
        <Stack.Screen
          name={PageTitle.HEALTH.toString()}
          component={HealthView}
        />
        <Stack.Screen
          name={PageTitle.MOTION.toString()}
          component={MotionView}
        />
        <Stack.Screen
          name={PageTitle.ANALYZATION.toString()}
          component={AnalyzationView}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
