import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import SahhaReactNative from 'sahha-react-native';

export default function ProfileView() {
  return (
    <View style={styles.container}>
      <Text>Let's start!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
