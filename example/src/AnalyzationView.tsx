import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, Button } from 'react-native';
import Sahha from 'sahha-react-native';

export default function ProfileView() {
  const [jsonString, setJsonString] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={{ textAlign: 'center' }}>
        A new analysis will be available every 24 hours
      </Text>
      <View style={styles.divider} />
      <Button
        title="ANALYZE PREVIOUS WEEK"
        onPress={() => {
          let endDate: Date = new Date();
          let days = endDate.getDate() - 7;
          var startDate = new Date();
          startDate.setDate(days);
          const settings = {
            startDate: startDate.getTime(),
            endDate: endDate.getTime(),
          };
          Sahha.analyze(settings, (error: string, value: string) => {
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
        title="ANALYZE PREVIOUS DAY"
        onPress={() => {
          Sahha.analyze({}, (error: string, value: string) => {
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
