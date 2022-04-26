import * as React from 'react';

import { StyleSheet, View, Text } from 'react-native';
import SahhaReactNative from 'sahha-react-native';
const { message } = SahhaReactNative.getConstants();

export default function App() {
  /*
  // Use custom settings
  const settings = {
    environment: SahhaEnvironment.production],
    sensors: [SahhaSensor.sleep, SahhaSensor.pedometer],
    postSensorDataManually: true,
  };
*/

  React.useEffect(() => {
    SahhaReactNative.multiply(3, 7).then(setResult);
    SahhaReactNative.add().then(setAddedResult);
    SahhaReactNative.squareUp(5).then(setSquaredResult);
    SahhaReactNative.speak().then(setSpeech);
  }, []);

  return (
    <View style={styles.container}>
      <Text>Results: {result}</Text>
      <Text>Added Result: {addedResult}</Text>
      <Text>Squared Result: {squaredResult}</Text>
      <Text>{message}</Text>
      <Text>{speech}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
});
