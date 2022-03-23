import React from 'react';
import { View, StyleSheet, Image, ScrollView, Button } from 'react-native';
import { PageTitle } from './App';

export default function HomeView({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image style={styles.logo} source={require('../assets/sahha-logo.png')} />
      <Button
        title={PageTitle.AUTHENTICATION.toString()}
        onPress={() => {
          navigation.navigate(PageTitle.AUTHENTICATION.toString());
        }}
      />
      <View style={styles.divider} />
      <Button
        title={PageTitle.PROFILE.toString()}
        onPress={() => {
          navigation.navigate(PageTitle.PROFILE.toString());
        }}
      />
      <View style={styles.divider} />
      <Button
        title={PageTitle.HEALTH.toString()}
        onPress={() => {
          navigation.navigate(PageTitle.HEALTH.toString());
        }}
      />
      <View style={styles.divider} />
      <Button
        title={PageTitle.MOTION.toString()}
        onPress={() => {
          navigation.navigate(PageTitle.MOTION.toString());
        }}
      />
      <View style={styles.divider} />
      <Button
        title={PageTitle.ANALYZATION.toString()}
        onPress={() => {
          navigation.navigate(PageTitle.ANALYZATION.toString());
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    margin: 20,
    width: '80%',
    backgroundColor: '#cccccc',
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 40,
  },
});
