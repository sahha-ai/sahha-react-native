import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  ScrollView,
  Button,
} from 'react-native';
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
