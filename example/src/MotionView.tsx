import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, Button } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Sahha, { SahhaActivity, SahhaActivityStatus } from 'sahha-react-native';

export default function MotionView() {
  const [activityStatus, setActivityStatus] = useState<SahhaActivityStatus>(
    SahhaActivityStatus.pending
  );
  var isDisabled =
    activityStatus === SahhaActivityStatus.unavailable ||
    activityStatus === SahhaActivityStatus.enabled;

  useEffect(() => {
    console.log('motion');
    Sahha.activityStatus(
      SahhaActivity.motion,
      (error: string, value: SahhaActivityStatus) => {
        if (error) {
          console.error(`Error: ${error}`);
        } else if (value) {
          console.log(`Activity Status: ${value}`);
          setActivityStatus(value);
        }
      }
    );
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>ACTIVITY STATUS</Text>
      <Picker
        style={{ height: 200, width: '80%' }}
        enabled={false}
        selectedValue={activityStatus}
      >
        <Picker.Item label="Pending" value={0} />
        <Picker.Item label="Unavailable" value={1} />
        <Picker.Item label="Disabled" value={2} />
        <Picker.Item label="Enabled" value={3} />
      </Picker>
      <View style={styles.divider} />
      <Button
        title="ENABLE"
        disabled={isDisabled}
        onPress={() => {
          console.log('press');
          if (activityStatus === SahhaActivityStatus.disabled) {
            Sahha.openAppSettings();
          } else {
            Sahha.activate(
              SahhaActivity.motion,
              (error: string, value: SahhaActivityStatus) => {
                if (error) {
                  console.error(`Error: ${error}`);
                } else if (value) {
                  console.log(`Activity Status: ${value}`);
                  setActivityStatus(value);
                }
              }
            );
          }
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: `white`,
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
});
