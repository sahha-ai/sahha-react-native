import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Button,
  Image,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Sahha from 'sahha-react-native';
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
  Sahha.configure();

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
