import React, { useState } from 'react';
import { StyleSheet, Text, ScrollView, Button } from 'react-native';
import SahhaReactNative from 'sahha-react-native';

export default function ProfileView() {
  var sampleString = `id : kYJk8CCasUeHTz5rvSc9Yw
created_at : 2022-01-19T21:50:27.564Z
state : depressed
sub_state : moderate
range : 7
confidence : 0.91
phenotypes : [
    screen_time
    sleep
]`;
  const [jsonString, setJsonString] = React.useState('');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {jsonString === '' ? (
        <Button
          title="ANALYZE"
          onPress={() => {
            setJsonString(sampleString);
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
});
