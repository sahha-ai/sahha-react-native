import { useEffect, useRef } from 'react';
import type * as React from 'react';
import { StatusBar } from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import type { Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Sahha from 'sahha-react-native';
import { SAHHA_SETTINGS } from './data/settings';
import { useAppTheme } from './theme';
import { AuthenticationScreen } from './screens/AuthenticationScreen';
import { BiomarkersScreen } from './screens/BiomarkersScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SamplesScreen } from './screens/SamplesScreen';
import { ScoresScreen } from './screens/ScoresScreen';
import { SensorDiagnosticsScreen } from './screens/SensorDiagnosticsScreen';
import { SensorPermissionsScreen } from './screens/SensorPermissionsScreen';
import { StatsScreen } from './screens/StatsScreen';

export type RootStackParamList = {
  Home: undefined;
  Authentication: undefined;
  Profile: undefined;
  SensorPermissions: undefined;
  SensorDiagnostics: undefined;
  Scores: undefined;
  Biomarkers: undefined;
  Stats: undefined;
  Samples: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator(): React.JSX.Element {
  const theme = useAppTheme();
  const configured = useRef(false);

  // Configure once at launch, mirroring the Flutter example app.
  useEffect(() => {
    if (configured.current) {
      return;
    }
    configured.current = true;
    Sahha?.configure(SAHHA_SETTINGS, (error: string, success: boolean) => {
      if (error) {
        console.log(`Sahha configure error: ${error}`);
      } else {
        console.log(`Sahha configure success: ${success}`);
      }
    });
  }, []);

  const base = theme.isDark ? DarkTheme : DefaultTheme;
  const navigationTheme: Theme = {
    ...base,
    dark: theme.isDark,
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.onSurface,
      border: theme.colors.outlineVariant,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.surface}
      />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ headerTitleStyle: { fontWeight: '600' } }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Sahha Demo' }}
        />
        <Stack.Screen
          name="Authentication"
          component={AuthenticationScreen}
          options={{ title: 'Authentication' }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: 'Profile' }}
        />
        <Stack.Screen
          name="SensorPermissions"
          component={SensorPermissionsScreen}
          options={{ title: 'Sensor Permissions' }}
        />
        <Stack.Screen
          name="SensorDiagnostics"
          component={SensorDiagnosticsScreen}
          options={{ title: 'Sensor Diagnostics' }}
        />
        <Stack.Screen
          name="Scores"
          component={ScoresScreen}
          options={{ title: 'Scores' }}
        />
        <Stack.Screen
          name="Biomarkers"
          component={BiomarkersScreen}
          options={{ title: 'Biomarkers' }}
        />
        <Stack.Screen
          name="Stats"
          component={StatsScreen}
          options={{ title: 'Stats' }}
        />
        <Stack.Screen
          name="Samples"
          component={SamplesScreen}
          options={{ title: 'Samples' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  );
}
