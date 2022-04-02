import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, Button } from 'react-native';
import Sahha, { SahhaActivity } from 'sahha-react-native';

export default function ProfileView() {
  const [jsonString, setJsonString] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={{ textAlign: 'center' }}>
        A new analysis will be available every 24 hours
      </Text>
      <View style={styles.divider} />
      {jsonString === '' ? (
        <Button
          title="ANALYZE"
          onPress={() => {
            Sahha.analyze((error: string, value: string) => {
              if (error) {
                console.error(`Error: ${error}`);
              } else if (value) {
                console.log(`Value: ${value}`);
                setJsonString(value);
              }
            });
          }}
        />
      ) : (
        <Text>{jsonString}</Text>
      )}
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
